import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ keyword, setKeyword, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isBookPage = location.pathname === '/book';

  // 최초 마운트 시 사용자 정보 체크
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsLoggedIn(true);
        } catch (err) {
          console.error('사용자 정보 파싱 오류:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, []); // 의존성 배열을 빈 배열로 변경하여 최초 마운트 시에만 실행

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    navigate('/');
    window.location.reload();
  };

  return (
    <>
      <header className="header">
        <div className="header-title" onClick={() => navigate('/')}>
          EasyFind
        </div>

        <div className="header-right">
          {/* 도서 페이지일 때만 검색창 표시 */}
          {isBookPage && (
            <div className="search-box">
              <input
                type="text"
                placeholder="도서 검색..."
                className="search-input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
              <button className="search-button" onClick={onSearch}>
                검색
              </button>
            </div>
          )}

          <div className="user-controls">
            {isLoggedIn ? (
              <div className="user-menu">
                <span className="user-greeting">
                  안녕하세요, {user?.username}님
                  {user?.role === 'admin' && <span className="admin-badge">관리자</span>}
                </span>
                <button onClick={() => navigate('/mypage')} className="mypage-btn">
                  마이페이지
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => navigate('/login')} className="login-btn">
                  로그인
                </button>
                <button onClick={() => navigate('/register')} className="register-btn">
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 하단 네비게이션 메뉴 */}
      <nav className="nav-menu">
        <ul>
          <li className={location.pathname === '/' ? 'active' : ''} onClick={() => navigate('/')}>
            메인
          </li>
          <li className={location.pathname === '/book' ? 'active' : ''} onClick={() => navigate('/book')}>
            도서 목록
          </li>
          <li className={location.pathname === '/cart' ? 'active' : ''} onClick={() => navigate('/cart')}>
            장바구니
          </li>
          <li className={location.pathname === '/reservation' ? 'active' : ''} onClick={() => navigate('/reservation')}>
            예약내역
          </li>
          <li className={location.pathname === '/inquiry' ? 'active' : ''} onClick={() => navigate('/inquiry')}>
            문의하기
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Header;
