import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './M_Header.css';

const M_Header = ({ keyword, setKeyword, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isBookPage = location.pathname === '/book';

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('admin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  const handleAdminLogin = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/admin-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login' }),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        sessionStorage.clear();
        sessionStorage.setItem('admin', 'true');
        setIsAdmin(true);
        alert('관리자 모드로 로그인되었습니다.');
        navigate('/');
      } else {
        alert('로그인 실패');
      }
    } catch (err) {
      console.error('관리자 로그인 오류:', err);
      alert('서버 오류');
    }
  };

  const handleAdminLogout = async () => {
    sessionStorage.removeItem('admin');
    setIsAdmin(false);

    await fetch(`${process.env.REACT_APP_API_BASE}/api/admin-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });

    alert('관리자 모드가 종료되었습니다.');
    navigate('/');
  };

  return (
    <header className="m-header">
      <div className="m-header-top">
        <h1 className="m-logo" onClick={() => navigate('/')}>EasyFind</h1>
        <button className="m-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </div>

      {isBookPage && (
        <div className="m-search-box">
          <input
            type="text"
            placeholder="도서 검색..."
            className="m-search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button className="m-search-button" onClick={onSearch}>🔍</button>
        </div>
      )}

      {menuOpen && (
        <div className="m-nav-panel">
          <nav className="m-nav-menu">
            <ul>
              <li className={location.pathname === '/' ? 'active' : ''} onClick={() => navigate('/')}>메인</li>
              <li className={location.pathname === '/book' ? 'active' : ''} onClick={() => navigate('/book')}>도서 목록</li>
              <li className={location.pathname === '/cart' ? 'active' : ''} onClick={() => navigate('/cart')}>장바구니</li>
              <li className={location.pathname === '/reservation' ? 'active' : ''} onClick={() => navigate('/reservation')}>예약내역</li>
              <li className={location.pathname === '/inquiry' ? 'active' : ''} onClick={() => navigate('/inquiry')}>문의하기</li>
            </ul>
          </nav>
          <div className="m-admin-controls">
            {isAdmin ? (
              <button onClick={handleAdminLogout} className="m-admin-btn">관리자 로그아웃</button>
            ) : (
              <button onClick={handleAdminLogin} className="m-admin-btn">관리자 로그인</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default M_Header;
