import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPageSidebar.css';

const MyPageSidebar = ({ user, onPasswordChange, onLogout, onWithdraw, recentOrders, ordersLoading }) => {
  const navigate = useNavigate();


  const quickActions = [
    { name: '도서 목록', path: '/book', icon: '📚' },
    { name: '장바구니', path: '/cart', icon: '🛒' },
    { name: '주문 내역', path: '/reservation', icon: '📦' },
    { name: '고객센터', path: '/inquiry', icon: '💬' }
  ];

  return (
    <div className="mypage-sidebar">
      {/* 사용자 정보 섹션 */}
      <div className="user-profile-section">
        <div className="user-avatar">
          <div className="avatar-circle">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
        <div className="user-info">
          <h3 className="username">{user?.username || '사용자'}</h3>
          <div className={`user-role ${user?.role}`}>
            {user?.role === 'admin' ? '관리자' : '일반 사용자'}
          </div>
        </div>
      </div>

      {/* 계정 관리 */}
      <div className="sidebar-section">
        <h4 className="section-title">계정 관리</h4>
        <div className="action-buttons">
          <button 
            className="action-btn password-btn"
            onClick={onPasswordChange}
          >
            🔐 비밀번호 변경
          </button>
          <button 
            className="action-btn logout-btn"
            onClick={onLogout}
          >
            🚪 로그아웃
          </button>
          <button 
            className="action-btn withdraw-btn"
            onClick={onWithdraw}
          >
            ⚠️ 회원 탈퇴
          </button>
        </div>
      </div>

      {/* 빠른 이동 */}
      <div className="sidebar-section">
        <h4 className="section-title">빠른 이동</h4>
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => navigate(action.path)}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-text">{action.name}</span>
            </button>
          ))}
        </div>
      </div>


      {/* 최근 주문내역 */}
      <div className="sidebar-section">
        <h4 className="section-title">최근 주문내역</h4>
        <div className="recent-orders">
          {ordersLoading ? (
            <div className="loading-text">로딩 중...</div>
          ) : recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order.order_id} className="order-item" onClick={() => navigate(`/order-details/${order.order_id}`)}>
                <div className="order-info">
                  <div className="order-product">{order.representative_product}</div>
                  <div className="order-date">{new Date(order.order_date).toLocaleDateString()}</div>
                  <div className="order-amount">{Number(order.total_amount).toLocaleString()}원</div>
                </div>
                <div className="order-status">
                  {order.receipt_status === '완료' ? '✅' : '⏳'}
                </div>
              </div>
            ))
          ) : (
            <div className="no-orders">주문내역이 없습니다</div>
          )}
        </div>
        {recentOrders.length > 0 && (
          <button 
            className="view-all-orders-btn"
            onClick={() => navigate('/reservation')}
          >
            전체 주문내역 보기
          </button>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="sidebar-section">
        <h4 className="section-title">활동 통계</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{recentOrders.length}</div>
            <div className="stat-label">총 주문</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">0</div>
            <div className="stat-label">장바구니</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">0</div>
            <div className="stat-label">문의</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPageSidebar;
