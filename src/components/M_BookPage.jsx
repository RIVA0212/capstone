import React, { useState, useEffect } from 'react';
import './M_BookPage.css';
import M_Header from './M_Header';
import axios from 'axios';

const M_BookPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('최신순');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 사용자 정보 확인
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setIsAdmin(user.role === 'admin');
      } catch (err) {
        console.error('사용자 정보 파싱 오류:', err);
      }
    }
  }, []);
  const [editTarget, setEditTarget] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [newDiscountRate, setNewDiscountRate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState({ id: 'all', name: '전체', product_type: '책' });
  const [discountRate, setDiscountRate] = useState('');

  useEffect(() => {
    if (!isSearching) fetchBooks();
    fetchCategories();
  }, [currentPage, sortOrder, isSearching, selectedCategory]);

  useEffect(() => {
    if (isSearching) handleSearch();
  }, [currentPage]);

  useEffect(() => {
    if (keyword.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [keyword]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory.id !== 'all' ? selectedCategory.id : '';
      const productTypeParam = selectedCategory.product_type;

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE}/api/data?page=${currentPage}&sort=${sortOrder}&category=${categoryParam}&product_type=${productTypeParam}&admin=${isAdmin}`
      );
      const result = await response.json();
      setBooks(result.data);
      const totalCount = result.pagination?.total || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / 9)));
    } catch (err) {
      console.error('도서 데이터 로딩 실패:', err);
      setError('서버와의 연결에 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/categories`);
      const data = await response.json();

      const bookCategories = data.map((cat) => ({ ...cat, product_type: '책' }));
      const combined = [
        { id: 'all', name: '전체', product_type: '책' },
        ...bookCategories,
        { id: 'all', name: '문구류', product_type: '문구류' }
      ];
      setCategories(combined);
    } catch (err) {
      console.error('카테고리 로딩 실패:', err);
    }
  };

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const params = {
        query: trimmedKeyword,
        admin: isAdmin,
        page: currentPage,
        limit: 9,
        product_type: selectedCategory.product_type
      };

      if (selectedCategory.id !== 'all') params.category_id = selectedCategory.id;

      const response = await axios.get(`${process.env.REACT_APP_API_BASE}/api/search`, { params });

      setSearchResults(response.data.data);
      const totalCount = response.data.pagination?.total || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / 9)));
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);
    }
  };

  const handleAddToCart = async (product_id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/cart`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id, quantity: 1 }),
      });
      
      if (response.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      const data = await response.json();
      alert(data.message || '장바구니에 추가되었습니다.');
    } catch (err) {
      console.error('장바구니 추가 실패:', err);
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleStockUpdate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const stockNum = Number(newStock);
    const rateNum = discountRate === '' || isNaN(Number(discountRate)) ? 0 : Number(discountRate);

    // 유효성 검사
    if (isNaN(stockNum)) {
      alert('재고 수량이 숫자가 아닙니다.');
      return;
    }

    const discountedPrice = Math.round(editTarget.original_price * (1 - rateNum / 100));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/products/${editTarget.product_id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_quantity: stockNum,
          price: discountedPrice
        })
      });

      if (response.ok) {
        setBooks(prev =>
          prev.map(b =>
            b.product_id === editTarget.product_id
              ? {
                  ...b,
                  stock_quantity: stockNum,
                  price: discountedPrice,
                  discount_rate: rateNum // 필요 시 discount_rate도 갱신
                }
              : b
          )
        );
        alert('수정이 완료되었습니다.');
        setEditTarget(null);
      } else {
        const errorMsg = await response.json();
        alert(`수정 실패: ${errorMsg.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('수정 오류:', err);
      alert('서버 오류');
    }
  };

  return (
    <div className="m-book-container">
      <M_Header keyword={keyword} setKeyword={setKeyword} onSearch={handleSearch} />

      <div className="m-sort-bar">
        <select
          value={`${selectedCategory.id}_${selectedCategory.product_type}`}
          onChange={(e) => {
            const [id, type] = e.target.value.split('_');
            const found = categories.find((cat) => cat.id === id && cat.product_type === type);
            if (found) {
              setSelectedCategory(found);
              setCurrentPage(1);
              setIsSearching(false);
            }
          }}
        >
          {categories.map((category) => (
            <option
              key={`${category.id}_${category.product_type}`}
              value={`${category.id}_${category.product_type}`}
            >
              {category.name}
            </option>
          ))}
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="낮은가격순">낮은가격순</option>
          <option value="높은가격순">높은가격순</option>
        </select>
      </div>

      <div className="m-book-grid">
        {loading ? (
          <div className="m-loading">로딩 중...</div>
        ) : error ? (
          <div className="m-error">{error}</div>
        ) : (isSearching ? searchResults : books).length === 0 ? (
          <div className="m-no-results">상품이 없습니다.</div>
        ) : (
          (isSearching ? searchResults : books).map((book) => (
            <div key={book.product_id} className="m-book-item">
              <div className="m-book-image">
                {book.image_url ? (
                  <img src={book.image_url} alt={book.product_name} />
                ) : (
                  <div className="m-no-image">이미지 없음</div>
                )}
              </div>
              <div className="m-book-info">
                <h3>{book.product_name}</h3>
                {book.product_type === '책' && (
                  <>
                    <p className="m-book-author">저자: {book.author}</p>
                    <p className="m-book-publisher">출판사: {book.publisher}</p>
                  </>
                )}
                <div className="m-book-price">
                  {book.original_price > book.price ? (
                    <>
                      <span className="original-price">{Number(book.original_price).toLocaleString()}원</span>
                      <span className="sale-price">{Number(book.price).toLocaleString()}원</span>
                      <span className="discount-rate">
                        ({Math.round(((book.original_price - book.price) / book.original_price) * 100)}%)
                      </span>
                    </>
                  ) : (
                    <span className="sale-price">{Number(book.price).toLocaleString()}원</span>
                  )}
                </div>

                {isAdmin && <p className="m-book-stock">재고: {book.stock_quantity}</p>}
                <div className="m-book-actions">
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setEditTarget(book);
                        setNewStock(book.stock_quantity.toString());
                        setNewDiscountRate(book.discount_rate?.toString() || '');
                      }}
                    >
                      수정
                    </button>
                  ) : (
                    <button onClick={() => handleAddToCart(book.product_id)}>장바구니</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="m-pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          &lt;
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={currentPage === page ? 'active' : ''}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          &gt;
        </button>
      </div>

      {editTarget && (
        <div className="m-modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="m-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📦 재고 수정</h3>
            <p>{editTarget.product_name}</p>
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              min="0"
              placeholder="재고 수량"
            />
            <input
              type="number"
              value={newDiscountRate}
              onChange={(e) => setNewDiscountRate(e.target.value)}
              min="0"
              max="99"
              placeholder="할인률 (%)"
            />
            <div className="m-modal-buttons">
              <button onClick={handleStockUpdate}>수정 완료</button>
              <button onClick={() => setEditTarget(null)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default M_BookPage;
