// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const initDB = require('./db');  // mysql2/promise 연결
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const path = require('path');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// fetch 폴리필 (Node < 18 지원)
const doFetch = async (...args) => {
  if (typeof fetch !== 'undefined') return fetch(...args);
  const { default: nf } = await import('node-fetch');
  return nf(...args);
};

// ===== 로깅 유틸 =====
const ts = () => new Date().toISOString();
const logInfo = (...a) => console.log(`[${ts()}] ℹ️`, ...a);
const logWarn = (...a) => console.warn(`[${ts()}] ⚠️`, ...a);
const logErr = (...a) => console.error(`[${ts()}] ❌`, ...a);

const app = express();

// CORS 설정
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);  // nginx 뒤에 있다는 걸 명시

// 더미 전자책 PDF 프록시(리다이렉트) - 로컬 경로로 접근하면 외부 더미 PDF로 리다이렉트
app.get('/ebooks/dummy.pdf', (req, res) => {
  res.redirect('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
});

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false,  // 로컬에서는 false
    httpOnly: true,
    sameSite: 'lax'  // 로컬에서는 lax
  }
}));

// JWT 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await initDB();
    const [users] = await db.query('SELECT user_id, username, role FROM users WHERE user_id = ?', [decoded.userId]);
    await db.end();
    
    if (users.length === 0) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    req.user = users[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
  }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
};

// 회원가입
app.post('/api/register', async (req, res) => {
  const { username, password, name, phone, email } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: '필수 정보를 입력해주세요.' });
  }

  try {
    const db = await initDB();
    
    // 아이디 중복 확인
    const [existingUsers] = await db.query('SELECT username FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      await db.end();
      return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const [result] = await db.query(
      'INSERT INTO users (username, password, name, phone, email) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, phone, email]
    );

    await db.end();
    res.json({ success: true, message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 아이디 중복 확인
app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: '아이디를 입력해주세요.' });
  }

  try {
    const db = await initDB();
    const [users] = await db.query('SELECT username FROM users WHERE username = ?', [username]);
    await db.end();

    res.json({ available: users.length === 0 });
  } catch (err) {
    console.error('아이디 중복 확인 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    const db = await initDB();
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    await db.end();

    if (users.length === 0) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 토큰 검증 및 사용자 정보 조회
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      userId: req.user.user_id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// 비밀번호 변경
app.put('/api/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
  }

  try {
    const db = await initDB();
    const [users] = await db.query('SELECT password FROM users WHERE user_id = ?', [req.user.user_id]);
    
    if (users.length === 0) {
      await db.end();
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!passwordMatch) {
      await db.end();
      return res.status(400).json({ error: '현재 비밀번호가 틀렸습니다.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedNewPassword, req.user.user_id]);
    await db.end();

    res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 회원 탈퇴
app.delete('/api/withdraw', authenticateToken, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력해주세요.' });
  }

  try {
    const db = await initDB();
    const [users] = await db.query('SELECT password FROM users WHERE user_id = ?', [req.user.user_id]);
    
    if (users.length === 0) {
      await db.end();
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const passwordMatch = await bcrypt.compare(password, users[0].password);
    if (!passwordMatch) {
      await db.end();
      return res.status(400).json({ error: '비밀번호가 틀렸습니다.' });
    }

    // 사용자 관련 데이터 삭제 (외래키 제약조건으로 인해 순서 중요)
    await db.query('DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = ?)', [req.user.user_id]);
    await db.query('DELETE FROM orders WHERE user_id = ?', [req.user.user_id]);
    await db.query('DELETE FROM inquiries WHERE user_id = ?', [req.user.user_id]);
    await db.query('DELETE FROM users WHERE user_id = ?', [req.user.user_id]);
    
    await db.end();

    res.json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
  } catch (err) {
    console.error('회원 탈퇴 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 조회
app.get('/api/categories', async (req, res) => {
  try {
    const db = await initDB();
    const [results] = await db.query(`SELECT DISTINCT category FROM book`);
    const categories = results.map(row => ({ id: row.category, name: row.category }));
    res.json(categories);
    await db.end();
  } catch (err) {
    console.error('카테고리 조회 오류:', err);
    res.status(500).json({ error: 'DB 오류' });
  }
});

// 추천 도서 조회 (랜덤)
app.get('/api/recommended-books', async (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  
  try {
    const db = await initDB();
    
    const [results] = await db.query(`
      SELECT p.product_id, p.product_name, p.price, p.image_url,
             b.author, b.publisher, b.category, b.grade, b.semester
      FROM product p
      LEFT JOIN book b ON p.product_id = b.product_id
      WHERE p.product_type = '책' AND p.is_active = 'true'
      ORDER BY RAND()
      LIMIT ?
    `, [limit]);
    
    res.json({ success: true, books: results });
    await db.end();
  } catch (error) {
    console.error('추천 도서 조회 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 학년/학기별 도서 조회
app.get('/api/books-by-grade-semester', async (req, res) => {
  const category = req.query.category; // 학과
  const grade = req.query.grade ? parseInt(req.query.grade) : null;
  const semester = req.query.semester ? parseInt(req.query.semester) : null;
  
  try {
    const db = await initDB();
    
    let whereClause = `p.product_type = '책' AND p.is_active = 'true'`;
    const params = [];
    
    if (category && category !== 'all') {
      whereClause += ` AND b.category = ?`;
      params.push(category);
    }
    
    if (grade) {
      whereClause += ` AND b.grade = ?`;
      params.push(grade);
    }
    
    if (semester) {
      whereClause += ` AND b.semester = ?`;
      params.push(semester);
    }
    
    const [results] = await db.query(`
      SELECT p.product_id, p.product_name, p.price, p.image_url,
             b.author, b.publisher, b.category, b.grade, b.semester, b.published_year
      FROM product p
      JOIN book b ON p.product_id = b.product_id
      WHERE ${whereClause}
      ORDER BY b.grade, b.semester, p.product_name
    `, params);
    
    res.json({ success: true, books: results });
    await db.end();
  } catch (error) {
    console.error('학년/학기별 도서 조회 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});
// 상품 데이터 조회
app.get('/api/data', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 9;
  const offset = (page - 1) * limit;

  const category = req.query.category || 'all';
  const sort = req.query.sort || '최신순';
  const productType = req.query.product_type || '책';
  const isAdmin = String(req.query.admin).toLowerCase() === 'true';
  
  // ✅ 학년/학기 필터 추가
  const grade = req.query.grade ? parseInt(req.query.grade) : null;
  const semester = req.query.semester ? parseInt(req.query.semester) : null;

  let whereClause = '1=1';
  const params = [];

  // ✅ 비관리자라면 활성 상품만
  if (!isAdmin) {
    whereClause += ` AND p.is_active = 'true'`;
  }

  // ✅ 'lowstock'일 경우 - 재고만 필터하고 product_type/category 제한 없음
  if (category === 'lowstock') {
    whereClause += ` AND p.stock_quantity <= 5`;
  } else if (category === 'outofstock') {
    whereClause += ` AND p.stock_quantity = 0 AND p.is_active = 'false'`;
  } else {
    if (productType !== 'all') {
      whereClause += ` AND p.product_type = ?`;
      params.push(productType);
    }

    // ✅ 책일 때만 category 필터 적용
    if (productType === '책' && category && category !== 'all') {
      whereClause += ` AND b.category = ?`;
      params.push(category);
    }
    
    // ✅ 학년 필터 적용
    if (grade) {
      whereClause += ` AND b.grade = ?`;
      params.push(grade);
    }
    
    // ✅ 학기 필터 적용
    if (semester) {
      whereClause += ` AND b.semester = ?`;
      params.push(semester);
    }
  }

  // ✅ 정렬
  let orderClause = 'p.created_at DESC';
  if (sort === '낮은가격순') orderClause = 'p.price ASC';
  else if (sort === '높은가격순') orderClause = 'p.price DESC';

  try {
    const db = await initDB();

    const query = `
      SELECT p.*, b.author, b.publisher, b.category, b.grade, b.semester
      FROM product p
      LEFT JOIN book b ON p.product_id = b.product_id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [results] = await db.query(query, [...params, limit, offset]);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM product p
      LEFT JOIN book b ON p.product_id = b.product_id
      WHERE ${whereClause}
    `;
    const [countResults] = await db.query(countQuery, params);

    const totalItems = countResults[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: results,
      pagination: {
        total: countResults[0].total,
        per_page: limit,
        current_page: page,
        last_page: Math.ceil(countResults[0].total / limit),
      },
    });

    await db.end();
  } catch (error) {
    console.error('데이터 조회 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 장바구니에 상품 추가
app.post('/api/cart', authenticateToken, async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.user_id;

  try {
    const db = await initDB();

    // 준비 상태 주문 확인
    const [orderResults] = await db.query(
      `SELECT order_id FROM orders WHERE user_id = ? AND status = '준비' LIMIT 1`,
      [userId]
    );

    let order_id;
    if (orderResults.length === 0) {
      const [insertOrder] = await db.query(
        `INSERT INTO orders (status, user_id) VALUES ('준비', ?)`,
        [userId]
      );
      order_id = insertOrder.insertId;
    } else {
      order_id = orderResults[0].order_id;
    }

    // 상품 가격 조회
    const [productResults] = await db.query(
      `SELECT price FROM product WHERE product_id = ?`,
      [product_id]
    );
    const price_per_item = productResults[0]?.price;

    // 기존 아이템 확인
    const [itemResults] = await db.query(
      `SELECT order_item_id, quantity FROM order_items
       WHERE order_id = ? AND product_id = ?`,
      [order_id, product_id]
    );

    if (itemResults.length > 0) {
      const newQuantity = itemResults[0].quantity + quantity;
      await db.query(
        `UPDATE order_items SET quantity = ? WHERE order_item_id = ?`,
        [newQuantity, itemResults[0].order_item_id]
      );
      res.status(200).json({ message: '장바구니 수량 업데이트 완료' });
    } else {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_per_item)
         VALUES (?, ?, ?, ?)`,
        [order_id, product_id, quantity, price_per_item]
      );
      res.status(200).json({ message: '장바구니에 상품 추가됨' });
    }

    await db.end();
  } catch (err) {
    console.error('장바구니 추가 오류:', err);
    res.status(500).json({ error: '장바구니 추가 실패' });
  }
});

// 장바구니 조회
app.get('/api/cart', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  
  console.log('장바구니 조회 요청 - userId:', userId);

  try {
    const db = await initDB();

    const [orderResults] = await db.query(
      `SELECT order_id FROM orders WHERE user_id = ? AND status = '준비' LIMIT 1`,
      [userId]
    );

    if (orderResults.length === 0) {
      await db.end();
      return res.json({ items: [], user_id: userId });
    }

    const orderId = orderResults[0].order_id;

    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.price_per_item,
              p.product_name, p.image_url, p.product_type,
              b.author, b.publisher
       FROM order_items oi
       JOIN product p ON oi.product_id = p.product_id
       LEFT JOIN book b ON p.product_id = b.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({ items, user_id: userId });
    await db.end();
  } catch (err) {
    console.error('장바구니 조회 오류:', err);
    console.error('오류 상세:', err.message);
    console.error('스택 트레이스:', err.stack);
    res.status(500).json({ error: '장바구니 정보를 불러오는 데 실패했습니다.' });
  }
});

// 결제 완료
app.post('/api/complete-order', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const db = await initDB();

    const [orderRow] = await db.query(`
      SELECT order_id FROM orders
      WHERE user_id = ? AND status = '준비'
      LIMIT 1
    `, [userId]);

    if (!orderRow || orderRow.length === 0) {
      await db.end();
      return res.status(400).json({ success: false, error: '주문이 없습니다.' });
    }

    const orderId = orderRow[0].order_id;

    // ✅ 재고 확인 먼저
    const [items] = await db.query(`
      SELECT oi.product_id, oi.quantity, p.stock_quantity, p.product_name
      FROM order_items oi
      JOIN product p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [orderId]);

    for (const item of items) {
      if (item.quantity > item.stock_quantity) {
        await db.end();
        return res.status(400).json({
          success: false,
          error: `${item.product_name}의 재고가 부족합니다. 현재 재고: ${item.stock_quantity}개`
        });
      }
    }

    // ✅ 이 시점에만 주문 상태를 '완료'로 변경
    await db.query(`
      UPDATE orders
      SET status = '완료',
          order_date = CURRENT_TIMESTAMP
      WHERE order_id = ?`, [orderId]);

    // ✅ 재고 차감
    for (const item of items) {
      await db.query(`
        UPDATE product
        SET stock_quantity = stock_quantity - ?
        WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );

      // ✅ stock_quantity 확인 후 is_active 업데이트
      await db.query(`
        UPDATE product
        SET is_active = CASE 
                          WHEN stock_quantity = 0 THEN 'false'
                          ELSE 'true'
                        END
        WHERE product_id = ?
      `, [item.product_id]);
    }

    const [sumResult] = await db.query(`
      SELECT SUM(quantity * price_per_item) AS total FROM order_items WHERE order_id = ?`,
      [orderId]
    );
    const totalAmount = sumResult[0].total || 0;

    await db.query(
      `UPDATE orders SET total_amount = ? WHERE order_id = ?`,
      [totalAmount, orderId]
    );

    await db.query(`
      INSERT INTO receipts (order_id, receipt_status, payment_date)
      VALUES (?, '대기', CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE receipt_status = '대기',
      payment_date = CURRENT_TIMESTAMP
    `, [orderId]);

    res.json({ success: true, orderId });
    await db.end();
  } catch (err) {
    console.error('주문 상태 업데이트 오류:', err);
    res.status(500).json({ success: false, error: '서버 오류' });
  }
});


// 수량 변경
app.put('/api/cart/item/:id', authenticateToken, async (req, res) => {
  const orderItemId = req.params.id;
  const { quantity } = req.body;
  const userId = req.user.user_id;

  try {
    const db = await initDB();

    const [verify] = await db.query(
      `SELECT oi.order_item_id
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.order_item_id = ? AND o.user_id = ? AND o.status = '준비'`,
      [orderItemId, userId]
    );

    if (verify.length === 0) {
      await db.end();
      return res.status(403).json({ error: '해당 상품을 수정할 권한이 없습니다.' });
    }

    await db.query(
      `UPDATE order_items SET quantity = ? WHERE order_item_id = ?`,
      [quantity, orderItemId]
    );

    res.json({ message: '수량이 업데이트되었습니다.' });
    await db.end();
  } catch (err) {
    console.error('수량 업데이트 오류:', err);
    res.status(500).json({ error: '수량을 업데이트하는데 실패했습니다.' });
  }
});

// 아이템 삭제
app.delete('/api/cart/item/:id', authenticateToken, async (req, res) => {
  const orderItemId = req.params.id;
  const userId = req.user.user_id;

  try {
    const db = await initDB();

    const [verify] = await db.query(
      `SELECT oi.order_item_id
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.order_item_id = ? AND o.user_id = ? AND o.status = '준비'`,
      [orderItemId, userId]
    );

    if (verify.length === 0) {
      await db.end();
      return res.status(403).json({ error: '해당 상품을 삭제할 권한이 없습니다.' });
    }

    await db.query(
      `DELETE FROM order_items WHERE order_item_id = ?`,
      [orderItemId]
    );

    res.json({ message: '상품이 장바구니에서 삭제되었습니다.' });
    await db.end();
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).json({ error: '아이템을 삭제하는데 실패했습니다.' });
  }
});

// 검색 API
app.get('/api/search', async (req, res) => {
  const searchQuery = req.query.query || '';
  const productType = req.query.product_type || '책';
  const category = req.query.category_id || '';
  const isAdmin = String(req.query.admin).toLowerCase() === 'true';

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const offset = (page - 1) * limit;

  try {
    const db = await initDB();

    let whereClause = `p.product_name LIKE ? AND p.product_type = ?`;
    const params = [`%${searchQuery}%`, productType];

    if (!isAdmin) {
      whereClause += ` AND p.is_active = 'true'`;
    }

    if (category && category !== '전체' && category !== 'all') {
      whereClause += ` AND b.category = ?`;
      params.push(category);
    }

    // ✅ 1. 결과 데이터 조회 (LIMIT 적용)
    const dataQuery = `
      SELECT 
        p.product_id, p.product_name, p.price, p.image_url, p.product_type, p.stock_quantity, p.is_active,
        b.author, b.publisher, b.category, b.grade, b.semester
      FROM product p
      LEFT JOIN book b ON p.product_id = b.product_id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [results] = await db.query(dataQuery, [...params, limit, offset]);

    // ✅ 2. 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product p
      LEFT JOIN book b ON p.product_id = b.product_id
      WHERE ${whereClause}
    `;
    const [countResults] = await db.query(countQuery, params);
    const totalItems = countResults[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // ✅ 3. 응답 반환
    res.json({
      success: true,
      data: results,
      pagination: {
        total: totalItems,
        per_page: limit,
        current_page: page,
        last_page: totalPages
      }
    });

    await db.end();
  } catch (err) {
    console.error('🔴 검색 오류:', err);
    res.status(500).json({ error: '검색 실패', message: err.message });
  }
});

// 주문 상세 조회
app.get('/api/order-details/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const db = await initDB();

    const [results] = await db.query(
      `SELECT 
         o.order_id,
         o.order_date,
         oi.quantity,
         oi.price_per_item,
         p.product_name,
         b.author
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN product p ON oi.product_id = p.product_id
       LEFT JOIN book b ON p.product_id = b.product_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (results.length === 0) {
      await db.end();
      return res.status(404).json({ error: '주문 내역 없음' });
    }

    const items = results.map(item => ({
      name: item.product_name,
      author: item.author,
      price: item.price_per_item,
      quantity: item.quantity
    }));

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    res.json({
      orderId: results[0].order_id,
      orderDate: results[0].order_date,
      totalAmount: total,
      items
    });

    await db.end();
  } catch (err) {
    console.error('주문 상세 오류:', err);
    res.status(500).json({ error: 'DB 오류' });
  }
});

// 전화번호 저장
app.post('/api/save-phone', authenticateToken, async (req, res) => {
  const { phone_tail } = req.body;
  const userId = req.user.user_id;

  if (!phone_tail) {
    return res.status(400).json({ success: false, error: '전화번호 뒷자리를 입력해주세요.' });
  }

  try {
    const db = await initDB();

    const [orderRows] = await db.query(
      `SELECT order_id FROM orders
       WHERE user_id = ? AND status = '완료'
       ORDER BY order_id DESC LIMIT 1`,
      [userId]
    );

    if (!orderRows || orderRows.length === 0) {
      await db.end();
      return res.status(404).json({ success: false, error: '주문 없음' });
    }

    const orderId = orderRows[0].order_id;

    await db.query(
      `UPDATE orders SET phone = ? WHERE order_id = ?`,
      [phone_tail, orderId]
    );

    res.json({ success: true, orderId });
    await db.end();
  } catch (err) {
    console.error('전화번호 저장 오류:', err);
    res.status(500).json({ success: false, error: '전화번호 저장 실패' });
  }
});


// 주문 통계 조회 - 마이페이지용
app.get('/api/order-stats', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const db = await initDB();

    // 총 주문 수
    const [totalOrders] = await db.query(
      `SELECT COUNT(*) as total_count FROM orders WHERE user_id = ? AND status = '완료'`,
      [userId]
    );

    // 진행 중인 주문 수 (수령 대기)
    const [pendingOrders] = await db.query(
      `SELECT COUNT(*) as pending_count 
       FROM orders o
       LEFT JOIN receipts r ON o.order_id = r.order_id
       WHERE o.user_id = ? AND o.status = '완료' AND (r.receipt_status = '대기' OR r.receipt_status IS NULL)`,
      [userId]
    );

    // 완료된 주문 수 (수령 완료)
    const [completedOrders] = await db.query(
      `SELECT COUNT(*) as completed_count 
       FROM orders o
       LEFT JOIN receipts r ON o.order_id = r.order_id
       WHERE o.user_id = ? AND o.status = '완료' AND r.receipt_status = '수령'`,
      [userId]
    );

    // 총 구매 금액
    const [totalAmount] = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_amount 
       FROM orders WHERE user_id = ? AND status = '완료'`,
      [userId]
    );

    await db.end();

    res.json({
      success: true,
      stats: {
        totalOrders: totalOrders[0].total_count,
        pendingOrders: pendingOrders[0].pending_count,
        completedOrders: completedOrders[0].completed_count,
        totalAmount: totalAmount[0].total_amount
      }
    });
  } catch (err) {
    console.error('주문 통계 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 예약내역 조회 - 로그인한 사용자의 주문 내역 조회
app.get('/api/reservation', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const connection = await initDB();

    // ✅ 로그인한 사용자의 완료된 주문 조회
    const [orders] = await connection.query(
      `SELECT o.order_id, o.order_date, o.total_amount, r.receipt_status, o.phone
       FROM orders o
       LEFT JOIN receipts r ON o.order_id = r.order_id
       WHERE o.user_id = ? AND o.status = '완료'
       ORDER BY o.order_date DESC`,
      [userId]
    );

    if (orders.length === 0) {
      return res.json({ success: false, message: '조회된 주문이 없습니다.' });
    }

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const [items] = await connection.query(
          `SELECT p.product_name
           FROM order_items oi
           JOIN product p ON oi.product_id = p.product_id
           WHERE oi.order_id = ?
           LIMIT 1`,
          [order.order_id]
        );

        const [summary] = await connection.query(
          `SELECT SUM(oi.quantity) as total_quantity
           FROM order_items oi
           WHERE oi.order_id = ?`,
          [order.order_id]
        );

        return {
          ...order,
          representative_product: items[0]?.product_name || '상품 없음',
          total_quantity: summary[0]?.total_quantity || 0
        };
      })
    );

    res.json({ success: true, orders: enrichedOrders });
  } catch (err) {
    console.error('예약 내역 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 관리자용 예약내역 조회 - 전화번호 뒷자리로 조회 (기존 기능 유지)
app.get('/api/reservation/admin', async (req, res) => {
  const phoneTail = req.query.tail;

  try {
    const connection = await initDB();

    // ✅ 관리자일 경우 전체 조회
    if (phoneTail === 'admin') {
      const [adminOrders] = await connection.query(
        `SELECT o.order_id, o.order_date, o.total_amount, r.receipt_status, o.phone
         FROM orders o
         LEFT JOIN receipts r ON o.order_id = r.order_id
         WHERE o.status = '완료'
         ORDER BY o.order_date DESC`
      );

      const enrichedAdminOrders = await Promise.all(
        adminOrders.map(async (order) => {
          const [items] = await connection.query(
            `SELECT p.product_name
             FROM order_items oi
             JOIN product p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?
             LIMIT 1`,
            [order.order_id]
          );

          const [summary] = await connection.query(
            `SELECT SUM(oi.quantity) as total_quantity
             FROM order_items oi
             WHERE oi.order_id = ?`,
            [order.order_id]
          );

          return {
            ...order,
            representative_product: items[0]?.product_name || '상품 없음',
            total_quantity: summary[0]?.total_quantity || 0
          };
        })
      );

      return res.json({ success: true, orders: enrichedAdminOrders });
    }

    // ✅ 일반 사용자 (전화번호 뒷자리로 조회)
    const [orders] = await connection.query(
      `SELECT o.order_id, o.order_date, o.total_amount, r.receipt_status, o.phone
       FROM orders o
       LEFT JOIN receipts r ON o.order_id = r.order_id
       WHERE o.phone LIKE ? AND o.status = '완료'
       ORDER BY o.order_date DESC`,
      [`%${phoneTail}`]
    );

    if (orders.length === 0) {
      return res.json({ success: false, message: '조회된 주문이 없습니다.' });
    }

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const [items] = await connection.query(
          `SELECT p.product_name
           FROM order_items oi
           JOIN product p ON oi.product_id = p.product_id
           WHERE oi.order_id = ?
           LIMIT 1`,
          [order.order_id]
        );

        const [summary] = await connection.query(
          `SELECT SUM(oi.quantity) as total_quantity
           FROM order_items oi
           WHERE oi.order_id = ?`,
          [order.order_id]
        );

        return {
          ...order,
          representative_product: items[0]?.product_name || '상품 없음',
          total_quantity: summary[0]?.total_quantity || 0
        };
      })
    );

    res.json({ success: true, orders: enrichedOrders });
  } catch (err) {
    console.error('예약 내역 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 단일 주문 상세 조회 API
app.get('/api/reservation/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const db = await initDB();

    const [orderResult] = await db.query(`
      SELECT o.order_id, o.order_date, o.total_amount, o.phone,
             r.receipt_status, r.receipt_date
      FROM orders o
      LEFT JOIN receipts r ON o.order_id = r.order_id
      WHERE o.order_id = ?
    `, [orderId]);

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, message: '주문 없음' });
    }

    const [rep] = await db.query(`
      SELECT p.product_name
      FROM order_items oi
      JOIN product p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
      LIMIT 1
    `, [orderId]);

    const [summary] = await db.query(`
      SELECT SUM(quantity) as total_quantity
      FROM order_items
      WHERE order_id = ?
    `, [orderId]);

    const [items] = await db.query(`
      SELECT p.product_name AS name, b.author, oi.quantity, oi.price_per_item AS price
      FROM order_items oi
      JOIN product p ON oi.product_id = p.product_id
      LEFT JOIN book b ON p.product_id = b.product_id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      success: true,
      order: {
        ...orderResult[0],
        representative_product: rep[0]?.product_name || '상품 없음',
        total_quantity: summary[0]?.total_quantity || 0,
        items: items
      }
    });

    await db.end();
  } catch (err) {
    console.error('🔴 주문 상세 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});


// ✅ 주문 상세 조회 API (server.js)
app.get('/api/order-details/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  const connection = await initDB();

  try {
    const [items] = await connection.query(`
      SELECT p.product_name, b.author, oi.price_per_item
      FROM order_items oi
      JOIN product p ON oi.product_id = p.product_id
      LEFT JOIN book b ON p.product_id = b.product_id
      WHERE oi.order_id = ?
    `, [orderId]);

    const [orderMeta] = await connection.query(`
      SELECT order_id, order_date
      FROM orders
      WHERE order_id = ?
    `, [orderId]);

    if (orderMeta.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false });
    }

    // ✅ QR코드 생성 전 URL 유효성 검사
    const qr = require('qrcode');
    const qrUrl = `${BASE_URL}/order-details/${orderId}`;

    if (!orderId || typeof orderId !== 'string' || /[:*]/.test(orderId)) {
      console.error(`🚨 잘못된 orderId 값:`, orderId);
      await connection.end();
      return res.status(400).json({ success: false, error: '잘못된 주문 ID' });
    }

    const qrDataUrl = await qr.toDataURL(qrUrl);

    const totalAmount = items.reduce((sum, i) => sum + i.price_per_item, 0);

    res.json({
      success: true,
      order_id: orderMeta[0].order_id,
      order_date: orderMeta[0].order_date,
      total_amount: totalAmount,
      items,
      qrUrl: qrDataUrl
    });

    await connection.end();
  } catch (err) {
    console.error('상세 조회 실패:', err);
    res.status(500).json({ success: false });
  }
});

// ✅ [유지] 주문 수령 상태 처리 (있으면 UPDATE, 없으면 INSERT)
app.post('/api/receipt/complete', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, error: 'orderId가 필요합니다.' });
  }

  try {
    const db = await initDB();

    // receipt 존재 여부 확인
    const [check] = await db.query(
      `SELECT * FROM receipts WHERE order_id = ?`,
      [orderId]
    );

    if (check.length === 0) {
      // 없다면 새로 삽입
      await db.query(
        `INSERT INTO receipts (order_id, receipt_status, receipt_date)
         VALUES (?, '수령', CURRENT_TIMESTAMP)`,
        [orderId]
      );
    } else {
      // 있다면 상태만 업데이트
      await db.query(
        `UPDATE receipts
         SET receipt_status = '수령', receipt_date = CURRENT_TIMESTAMP
         WHERE order_id = ?`,
        [orderId]
      );
    }

    res.json({ success: true, message: '수령 완료 처리됨' });
    await db.end();
  } catch (err) {
    console.error('수령 상태 업데이트 오류:', err);
    res.status(500).json({ success: false, error: 'DB 오류' });
  }
});

// 질의응답 질문 등록하기 (로그인 필수, 비밀번호 불필요)
app.post('/api/questions', authenticateToken, async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: '질문 내용을 입력해주세요.' });
  }

  try {
    const db = await initDB();
    const userId = req.user.user_id;

    const [result] = await db.query(
      'INSERT INTO questions (user_id, question) VALUES (?, ?)',
      [userId, question.trim()]
    );

    res.json({ success: true, insertId: result.insertId });
    await db.end();
  } catch (err) {
    console.error('질문 등록 오류:', err);
    res.status(500).json({ success: false, error: 'DB 오류' });
  }
});

// 질문 목록 불러오기
app.get('/api/questions', async (req, res) => {
  try {
    const db = await initDB();
    const [rows] = await db.query('SELECT question_id, question FROM questions ORDER BY question_id DESC');
    res.json(rows);
    await db.end();
  } catch (err) {
    console.error('질문 목록 조회 오류:', err);
    res.status(500).json({ error: 'DB 오류' });
  }
});

// 질문에 비밀번호 확인
app.post('/api/questions/verify', async (req, res) => {
  const { questionId, password } = req.body;

  if (!questionId || !password) {
    return res.status(400).json({ error: '질문 ID와 비밀번호가 필요합니다.' });
  }

  try {
    const db = await initDB();
    const [rows] = await db.query(
      'SELECT passwd, answer FROM questions WHERE question_id = ?',
      [questionId]
    );

    if (rows.length === 0) {
      await db.end();
      return res.status(404).json({ error: '질문이 존재하지 않습니다.' });
    }

    const match = await bcrypt.compare(password, rows[0].passwd);
    if (!match) {
      await db.end();
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    res.json({ answer: rows[0].answer || '아직 답변이 등록되지 않았습니다.' });
    await db.end();
  } catch (err) {
    console.error('답변 열람 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 로그인한 사용자의 문의 조회 (새로운 API)
app.get('/api/my-inquiries', authenticateToken, async (req, res) => {
  try {
    const db = await initDB();
    const userId = req.user.user_id;

    const [rows] = await db.query(
      'SELECT question_id, question, answer, created_at FROM questions WHERE user_id = ? ORDER BY question_id DESC',
      [userId]
    );

    await db.end();
    res.json({ success: true, questions: rows });
  } catch (err) {
    console.error('내 문의 조회 오류:', err);
    res.status(500).json({ success: false, error: '서버 오류' });
  }
});

// 내 질문 확인 (기존 API - 비밀번호 기반)
app.post('/api/my-questions', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력하세요' });
  }

  try {
    const db = await initDB();
    const [rows] = await db.query('SELECT question_id, question, answer, passwd FROM questions');

    const matchedQuestions = [];

    for (const row of rows) {
      const match = await bcrypt.compare(password, row.passwd);
      if (match) {
        matchedQuestions.push({
          question_id: row.question_id,
          question: row.question,
          answer: row.answer
        });
      }
    }

    await db.end();
    res.json({ questions: matchedQuestions });
  } catch (err) {
    console.error('내 문의 조회 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 관리자 세션 실행 여부 확인
app.post('/api/admin-session', (req, res) => {
  const { action } = req.body;

  if (action === 'login') {
    req.session.regenerate((err) => {
      if (err) {
        console.error('세션 재생성 실패:', err);
        return res.status(500).json({ success: false });
      }

      req.session.admin = true;
      console.log('🔐 새 관리자 세션 생성됨');
      res.json({ success: true });
    });
  } else if (action === 'logout') {
    req.session.destroy((err) => {
      if (err) {
        console.error('세션 삭제 실패:', err);
        return res.status(500).json({ success: false });
      }
      console.log('🔓 관리자 세션 종료됨');
      res.json({ success: true });
    });
  }
});

// 관리자 상품 수정
app.put('/api/products/:productId', authenticateToken, requireAdmin, async (req, res) => {
  const { productId } = req.params;
  const { stock_quantity, price } = req.body;

  if (typeof stock_quantity !== 'number' || isNaN(stock_quantity)) {
    return res.status(400).json({ error: '재고 수량이 올바르지 않습니다.' });
  }

  if (typeof price !== 'number' || isNaN(price)) {
    return res.status(400).json({ error: '가격이 올바르지 않습니다.' });
  }

  try {
    const db = await initDB();

    await db.query(
      'UPDATE product SET stock_quantity = ?, price = ? WHERE product_id = ?',
      [stock_quantity, price, productId]
    );

    await db.query(`
      UPDATE product
      SET is_active = CASE 
                        WHEN stock_quantity = 0 THEN 'false'
                        ELSE 'true'
                      END
      WHERE product_id = ?
    `, [productId]);

    res.send({ success: true });
    await db.end();
  } catch (err) {
    console.error('재고 및 가격 수정 실패:', err);
    res.status(500).json({ success: false });
  }
});

// =============================
// 전자책(EBook) APIs
// =============================

// 전자책 목록 조회 (공개, 활성 상품만)
app.get('/api/ebooks', async (req, res) => {
  try {
    const db = await initDB();
    const [rows] = await db.query(`
      SELECT p.product_id, p.product_name, p.price, p.image_url,
             e.title, e.file_format
      FROM product p
      JOIN ebook e ON p.product_id = e.product_id
      WHERE p.product_type = '전자책' AND p.is_active = 'true'
      ORDER BY p.created_at DESC
    `);
    await db.end();
    res.json({ success: true, ebooks: rows });
  } catch (err) {
    console.error('전자책 목록 조회 오류:', err);
    res.status(500).json({ success: false, error: '서버 오류' });
  }
});

// 내 전자책 라이브러리 (구매 완료된 전자책)
app.get('/api/my-ebooks', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const db = await initDB();
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.image_url,
        e.title,
        e.file_format,
        MAX(o.order_date) AS last_order_date
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN product p ON oi.product_id = p.product_id
      JOIN ebook e ON p.product_id = e.product_id
      WHERE o.user_id = ? 
        AND o.status = '완료' 
        AND p.product_type = '전자책'
      GROUP BY p.product_id, p.product_name, p.image_url, e.title, e.file_format
      ORDER BY last_order_date DESC
    `, [userId]);
    await db.end();
    res.json({ success: true, ebooks: rows });
  } catch (err) {
    console.error('내 전자책 조회 오류:', err);
    res.status(500).json({ success: false, error: '서버 오류' });
  }
});

// 전자책 콘텐츠 접근 (구매자만 접근 가능)
app.get('/api/ebooks/:productId/access', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { productId } = req.params;
  try {
    const db = await initDB();
    
    // 디버깅을 위한 로그
    console.log(`전자책 접근 시도 - userId: ${userId}, productId: ${productId}`);
    console.log('JWT 토큰에서 추출한 사용자 정보:', req.user);
    
    // 구매 여부 확인
    const [owns] = await db.query(`
      SELECT o.order_id, o.status, oi.product_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ?
    `, [userId, productId]);

    console.log('구매 확인 결과:', owns);

    if (owns.length === 0) {
      console.log('구매 확인 실패 - 구매 기록 없음');
      await db.end();
      return res.status(403).json({ 
        success: false, 
        error: `구매한 전자책이 아닙니다. (userId: ${userId}, productId: ${productId})` 
      });
    }

    // 주문 상태 확인
    const completedOrder = owns.find(order => order.status === '완료');
    if (!completedOrder) {
      console.log('구매 확인 실패 - 주문 미완료:', owns);
      await db.end();
      return res.status(403).json({ 
        success: false, 
        error: `주문이 완료되지 않았습니다. (상태: ${owns[0].status})` 
      });
    }

    console.log('주문 확인 완료, 콘텐츠 URL 조회 중...');
    const [rows] = await db.query(
      `SELECT e.content_url, e.file_format FROM ebook e WHERE e.product_id = ? LIMIT 1`,
      [productId]
    );
    console.log('콘텐츠 조회 결과:', rows);
    await db.end();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '콘텐츠를 찾을 수 없습니다.' });
    }

    console.log('전자책 접근 성공:', { productId, content_url: rows[0].content_url, file_format: rows[0].file_format });
    // 단순 URL 반환 (향후 서명 URL/프록시 전환 가능)
    const responseData = { 
      success: true, 
      content_url: rows[0].content_url, 
      file_format: rows[0].file_format 
    };
    console.log('응답 데이터:', responseData);
    
    // 응답 헤더 명시적 설정
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(200).json(responseData);
  } catch (err) {
    console.error('전자책 접근 오류:', err);
    res.status(500).json({ success: false, error: '서버 오류' });
  }
});

// =============================
// 챗봇 API
// =============================
app.post('/api/chatbot/message', async (req, res) => {
  const { message } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, error: '메시지를 입력하세요.' });
  }

  try {
    const provider = (process.env.CHAT_PROVIDER || '').toLowerCase();
    let reply = '';
    let suggestions = [];
    logInfo('chatbot', { provider, msgLen: String(message).length });


    // 1-b) Google Gemini 사용 시: CHAT_PROVIDER=gemini, GEMINI_API_KEY
    if (!reply && provider === 'gemini') {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.warn('GEMINI_API_KEY 미설정');
        } else {
          // 일부 환경에서 모델 가용성이 달라 404가 날 수 있으므로 여러 모델을 순차 시도
          const models = [
            process.env.GEMINI_MODEL,
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro',
            'gemini-1.5-pro-001',
            'gemini-1.5-pro-latest'
          ].filter(Boolean);

          const prompt = `캠퍼스 서점/전자책/주문/수령 안내용 챗봇으로서 간단하고 친절하게 한국어로 답하세요.\n질문: ${String(message)}`;
          const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };

          for (const m of models) {
            const endpoint = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(apiKey)}`;
            logInfo('gemini:request', m);
            try {
              const r = await doFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              if (r.ok) {
                const data = await r.json();
                const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
                if (text) { reply = text; break; }
              } else {
                const errTxt = await r.text();
                if (r.status === 404) {
                  logWarn('gemini:404', m);
                  continue;
                }
                logWarn('gemini:error', { status: r.status, model: m, body: errTxt.slice(0, 200) });
              }
            } catch (inner) {
              logWarn('gemini:fail', { model: m, error: inner.message });
            }
          }
        }
      } catch (e) {
        logWarn('gemini:outer-fail', e.message);
      }
    }

    // 2) 폴백: 간단 규칙 + FAQ 기반
    if (!reply) {
      const normalized = String(message).toLowerCase();
      if (normalized.includes('환불') || normalized.includes('반품')) {
        reply = '환불/반품은 수령 전에는 가능하며, 수령 후에는 지원되지 않습니다.';
      } else if (normalized.includes('전자책') || normalized.includes('ebook')) {
        reply = '전자책은 구매 완료 후 마이페이지의 내 전자책에서 열람하실 수 있어요.';
      } else if (normalized.includes('배송') || normalized.includes('수령')) {
        reply = '주문 후 결제 완료 시 수령 대기 상태가 되며, 수령 시 영수증 상태가 업데이트됩니다.';
      }

      const db = await initDB();
      const [faq] = await db.query(
        `SELECT question, answer FROM questions WHERE answer IS NOT NULL AND answer <> '' ORDER BY question_id DESC LIMIT 3`
      );
      await db.end();
      suggestions = faq.map(f => ({ q: f.question, a: f.answer }));

      if (!reply) {
        reply = faq.length > 0 ? `도움이 될 수 있는 최근 답변: ${faq[0].answer}` : '질문을 이해하지 못했어요. 더 구체적으로 말씀해 주세요.';
      }
    }

    res.json({ success: true, reply, suggestions });
  } catch (err) {
    logErr('chatbot:exception', err && (err.stack || err.message || err));
    // 폴백 응답으로 200 반환 (프런트에 친절한 메시지)
    return res.json({ success: true, reply: '잠시 통신 오류가 있었어요. 다시 한번 시도해 주세요.', suggestions: [] });
  }
});

// 장바구니 자동 삭제
// 매일 자정에 실행, 7일 안에 결제하지 않으면 삭제
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    const db = await initDB();

    // 1. 삭제 대상 order_id 조회 (7일 전)
    const [rows] = await db.query(`
      SELECT order_id FROM orders
      WHERE status = '준비'
        AND order_date < (NOW() - INTERVAL 7 DAY)
    `);

    if (rows.length > 0) {
      const orderIds = rows.map(row => row.order_id);

      // 2. order_items 먼저 삭제
      const [deletedItems] = await db.query(
        `DELETE FROM order_items WHERE order_id IN (?)`,
        [orderIds]
      );

      // 3. orders 삭제
      const [deletedOrders] = await db.query(
        `DELETE FROM orders WHERE order_id IN (?)`,
        [orderIds]
      );

      console.log(`🗑️ 7일 경과 장바구니 order_items ${deletedItems.affectedRows}건 삭제됨`);
      console.log(`🗑️ 7일 경과 장바구니 orders ${deletedOrders.affectedRows}건 삭제됨`);
    }

    await db.end();
  } catch (err) {
    console.error('⛔ 장바구니 자동 삭제 실패:', err);
  }
});

// 미수령으로 인한 주문 취소 및 삭제
// 매일 자정에 실행, 7일 안에 수령하지 않으면 취소 후 삭제
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    const db = await initDB();

    // 1. 7일 경과된 수령 대기 주문들을 취소 상태로 변경
    const [result] = await db.query(`
      UPDATE receipts
      SET receipt_status = '취소'
      WHERE receipt_status = '대기'
        AND payment_date < (NOW() - INTERVAL 7 DAY)
    `);

    if (result.affectedRows > 0) {
      console.log(`🔄 7일 경과 미수령 주문 취소: ${result.affectedRows}건`);
    }

    // 2. 취소된 주문들의 상세 정보 삭제
    const [canceledOrders] = await db.query(`
      SELECT o.order_id FROM orders o
      JOIN receipts r ON o.order_id = r.order_id
      WHERE r.receipt_status = '취소'
        AND r.payment_date < (NOW() - INTERVAL 7 DAY)
    `);

    if (canceledOrders.length > 0) {
      const orderIds = canceledOrders.map(row => row.order_id);

      // order_items 삭제
      const [deletedItems] = await db.query(
        `DELETE FROM order_items WHERE order_id IN (?)`,
        [orderIds]
      );

      // receipts 삭제
      const [deletedReceipts] = await db.query(
        `DELETE FROM receipts WHERE order_id IN (?)`,
        [orderIds]
      );

      // orders 삭제
      const [deletedOrders] = await db.query(
        `DELETE FROM orders WHERE order_id IN (?)`,
        [orderIds]
      );

      console.log(`🗑️ 7일 경과 미수령 주문 order_items ${deletedItems.affectedRows}건 삭제됨`);
      console.log(`🗑️ 7일 경과 미수령 주문 receipts ${deletedReceipts.affectedRows}건 삭제됨`);
      console.log(`🗑️ 7일 경과 미수령 주문 orders ${deletedOrders.affectedRows}건 삭제됨`);
    }

    await db.end();
  } catch (err) {
    console.error('⛔ 미수령 주문 자동 삭제 실패:', err);
  }
});

app.get('/api/inquiries', async (req, res) => {
  const phoneTail = req.query.phoneTail;

  try {
    const db = await initDB(); // ✅ 이 줄이 빠져 있었음!!

    let results;
    if (phoneTail === 'admin') {
      [results] = await db.query('SELECT * FROM questions ORDER BY question_id DESC');
    } else {
      [results] = await db.query(
        'SELECT * FROM questions WHERE RIGHT(passwd, 4) = ? ORDER BY question_id DESC',
        [phoneTail]
      );
    }

    res.json(results);
    await db.end();
  } catch (err) {
    console.error('DB 조회 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

app.put('/api/questions/:id/answer', async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  try {
    const db = await initDB();

    await db.query(
      'UPDATE questions SET answer = ? WHERE question_id = ?',
      [answer, id]
    );

    res.json({ success: true });
    await db.end();
  } catch (err) {
    console.error('답변 저장 오류:', err);
    res.status(500).json({ message: '답변 저장 실패' });
  }
});

// 테스트용 스케줄러 (개발 환경에서만 실행)
if (process.env.NODE_ENV === 'development') {
  console.log('🧪 테스트용 스케줄러 활성화 (30초마다 실행)');
  
  // 테스트용 장바구니 삭제 (30초마다, 1분 경과 시)
  schedule.scheduleJob('*/30 * * * * *', async () => {
    try {
      const db = await initDB();
      const [rows] = await db.query(`
        SELECT order_id FROM orders
        WHERE status = '준비'
          AND order_date < (NOW() - INTERVAL 1 MINUTE)
      `);

      if (rows.length > 0) {
        const orderIds = rows.map(row => row.order_id);
        const [deletedItems] = await db.query(
          `DELETE FROM order_items WHERE order_id IN (?)`,
          [orderIds]
        );
        const [deletedOrders] = await db.query(
          `DELETE FROM orders WHERE order_id IN (?)`,
          [orderIds]
        );
        console.log(`🧪 테스트: 장바구니 ${deletedOrders.affectedRows}건 삭제됨`);
      }
      await db.end();
    } catch (err) {
      console.error('🧪 테스트 장바구니 삭제 실패:', err);
    }
  });

  // 테스트용 미수령 주문 삭제 (30초마다, 1분 경과 시)
  schedule.scheduleJob('*/30 * * * * *', async () => {
    try {
      const db = await initDB();
      const [result] = await db.query(`
        UPDATE receipts
        SET receipt_status = '취소'
        WHERE receipt_status = '대기'
          AND payment_date < (NOW() - INTERVAL 1 MINUTE)
      `);

      if (result.affectedRows > 0) {
        console.log(`🧪 테스트: 미수령 주문 ${result.affectedRows}건 취소됨`);
      }
      await db.end();
    } catch (err) {
      console.error('🧪 테스트 미수령 주문 취소 실패:', err);
    }
  });
}

// 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: ${BASE_URL}`);
  console.log('📅 자동 삭제 스케줄러: 매일 자정 (7일 경과 시)');
});
