import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import MyPageSidebar from './MyPageSidebar';
import './MyPage.css';

const MyPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [withdrawData, setWithdrawData] = useState({
    password: '',
    confirmText: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [keyword, setKeyword] = useState('');
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalAmount: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
    fetchRecommendedBooks();
    fetchRecentOrders();
    fetchOrderStats();
    fetchRecentActivity();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_BASE}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('사용자 정보 조회 실패:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWithdrawChange = (e) => {
    const { name, value } = e.target;
    setWithdrawData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('새 비밀번호는 6글자 이상이어야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${process.env.REACT_APP_API_BASE}/api/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setError('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    
    if (!withdrawData.password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (withdrawData.confirmText !== '탈퇴하겠습니다') {
      setError('확인 문구를 정확히 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${process.env.REACT_APP_API_BASE}/api/withdraw`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          password: withdrawData.password
        }
      });

      if (response.data.success) {
        setSuccess('회원 탈퇴가 완료되었습니다.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || '회원 탈퇴에 실패했습니다.');
    }
  };

  const fetchRecommendedBooks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE}/api/recommended-books?limit=2`);
      if (response.data.success) {
        setRecommendedBooks(response.data.books);
      }
    } catch (err) {
      console.error('추천 도서 조회 실패:', err);
    }
  };

  const fetchRecentOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setOrdersLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE}/api/reservation`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setRecentOrders(response.data.orders.slice(0, 3)); // 최근 3개만
      }
    } catch (err) {
      console.error('주문내역 조회 실패:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setStatsLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE}/api/order-stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setOrderStats(response.data.stats);
      }
    } catch (err) {
      console.error('주문 통계 조회 실패:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [ordersRes, inquiriesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_BASE}/api/reservation`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_BASE}/api/my-inquiries`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const orderActivities = (ordersRes.data?.orders || []).map((o) => ({
        type: 'order',
        title: `${o.representative_product} 외 ${Math.max((o.total_quantity || 1) - 1, 0)}건 주문 완료`,
        time: o.order_date,
        icon: '📦'
      }));

      const inquiryActivities = (inquiriesRes.data?.questions || []).map((q) => ({
        type: 'inquiry',
        title: `문의 등록: ${q.question.length > 20 ? q.question.slice(0, 20) + '…' : q.question}`,
        time: q.created_at,
        icon: '💬'
      }));

      const merged = [...orderActivities, ...inquiryActivities]
        .filter(a => a.time)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);

      setRecentActivities(merged);
    } catch (err) {
      console.error('최근 활동 조회 실패:', err);
    }
  };

  const formatRelativeTime = (isoString) => {
    try {
      const now = new Date();
      const then = new Date(isoString);
      const diff = Math.floor((now - then) / 1000);
      if (diff < 60) return '방금 전';
      const m = Math.floor(diff / 60);
      if (m < 60) return `${m}분 전`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}시간 전`;
      const d = Math.floor(h / 24);
      if (d < 7) return `${d}일 전`;
      return then.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="bookstore-container">
        <Header keyword={keyword} setKeyword={setKeyword} />
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="bookstore-container">
      <Header keyword={keyword} setKeyword={setKeyword} />
      
      <div className="mypage-layout">
        {/* 사이드바 */}
        <MyPageSidebar 
          user={user}
          onPasswordChange={() => setShowPasswordModal(true)}
          onLogout={handleLogout}
          onWithdraw={() => setShowWithdrawModal(true)}
          recentOrders={recentOrders}
          ordersLoading={ordersLoading}
        />
        
        {/* 메인 콘텐츠 */}
        <div className="mypage-main-content">
          <div className="mypage-header">
            <h1>마이페이지</h1>
            <p>안녕하세요, {user?.username}님! 환영합니다.</p>
          </div>

          <div className="mypage-content-grid">
            {/* 최근 활동 */}
            <div className="content-card">
              <h3>📊 최근 활동</h3>
              <div className="activity-list">
                {recentActivities.length > 0 ? (
                  recentActivities.map((a, idx) => (
                    <div key={idx} className="activity-item">
                      <div className="activity-icon">{a.icon}</div>
                      <div className="activity-content">
                        <div className="activity-title">{a.title}</div>
                        <div className="activity-time">{formatRelativeTime(a.time)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-books">최근 활동이 없습니다.</div>
                )}
              </div>
            </div>

            {/* 주문 요약 */}
            <div className="content-card">
              <h3>📋 주문 요약</h3>
              {statsLoading ? (
                <div className="loading-stats">로딩 중...</div>
              ) : (
                <div className="order-summary">
                  <div className="summary-item">
                    <div className="summary-label">총 주문 수</div>
                    <div className="summary-value">{orderStats.totalOrders}건</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">진행 중인 주문</div>
                    <div className="summary-value">{orderStats.pendingOrders}건</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">완료된 주문</div>
                    <div className="summary-value">{orderStats.completedOrders}건</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">총 구매 금액</div>
                    <div className="summary-value">{Number(orderStats.totalAmount).toLocaleString()}원</div>
                  </div>
                </div>
              )}
            </div>

            {/* 추천 도서 */}
            <div className="content-card">
              <h3>📚 추천 도서</h3>
              <div className="recommended-books">
                {recommendedBooks.length > 0 ? (
                  recommendedBooks.map((book) => (
                    <div key={book.product_id} className="book-item" onClick={() => navigate('/book')}>
                      <div className="book-cover">
                        {book.image_url ? (
                          <img src={book.image_url} alt={book.product_name} />
                        ) : (
                          <div className="book-placeholder">📖</div>
                        )}
                      </div>
                      <div className="book-info">
                        <div className="book-title">{book.product_name}</div>
                        <div className="book-author">{book.author}</div>
                        <div className="book-price">
                          {book.original_price > book.price ? (
                            <>
                              <span className="original-price">{Number(book.original_price).toLocaleString()}원</span>
                              <span className="sale-price">{Number(book.price).toLocaleString()}원</span>
                            </>
                          ) : (
                            <span className="sale-price">{Number(book.price).toLocaleString()}원</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-books">추천 도서를 불러오는 중...</div>
                )}
              </div>
            </div>

            {/* 공지사항 */}
            <div className="content-card">
              <h3>📢 공지사항</h3>
              <div className="notice-list">
                <div className="notice-item">
                  <div className="notice-title">시스템 점검 안내</div>
                  <div className="notice-date">2025.01.15</div>
                </div>
                <div className="notice-item">
                  <div className="notice-title">새로운 도서 입고</div>
                  <div className="notice-date">2025.01.10</div>
                </div>
                <div className="notice-item">
                  <div className="notice-title">배송 정책 변경</div>
                  <div className="notice-date">2025.01.05</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>비밀번호 변경</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="currentPassword">현재 비밀번호</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="새 비밀번호를 입력하세요 (6글자 이상)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="modal-buttons">
                <button type="submit" className="confirm-button">
                  변경하기
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setError('');
                    setSuccess('');
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 모달 */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ 회원 탈퇴</h3>
            <p className="withdraw-warning">
              회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.<br/>
              정말로 탈퇴하시겠습니까?
            </p>
            <form onSubmit={handleWithdrawSubmit}>
              <div className="form-group">
                <label htmlFor="withdrawPassword">현재 비밀번호</label>
                <input
                  type="password"
                  id="withdrawPassword"
                  name="password"
                  value={withdrawData.password}
                  onChange={handleWithdrawChange}
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmText">확인 문구</label>
                <input
                  type="text"
                  id="confirmText"
                  name="confirmText"
                  value={withdrawData.confirmText}
                  onChange={handleWithdrawChange}
                  placeholder="탈퇴하겠습니다"
                />
                <small>위 문구를 정확히 입력해주세요</small>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="modal-buttons">
                <button type="submit" className="withdraw-button">
                  탈퇴하기
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setError('');
                    setSuccess('');
                    setWithdrawData({
                      password: '',
                      confirmText: ''
                    });
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyPage;
