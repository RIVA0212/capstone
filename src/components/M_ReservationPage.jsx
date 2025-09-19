import React, { useState, useEffect } from 'react';
import './M_ReservationPage.css';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import M_Header from './M_Header';

const M_ReservationPage = () => {
  const [phoneTail, setPhoneTail] = useState('');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('admin') === 'true';
    setIsAdmin(adminStatus);
    if (adminStatus) {
      setPhoneTail('admin');
      setShowModal(false);
    }
  }, []);

  useEffect(() => {
    if (!showModal && phoneTail) fetchOrders();
  }, [showModal, phoneTail]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/reservation?tail=${phoneTail}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || '조회 실패');
      }
    } catch (err) {
      setError('서버 요청 실패');
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phoneTail.trim().length !== 4) {
      setError('전화번호 뒷자리 4자리를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/reservation?tail=${phoneTail}`);
      const data = await response.json();
      if (data.success && data.orders.length > 0) {
        setOrders(data.orders);
        setShowModal(false);
      } else {
        setError('일치하는 주문이 없습니다.');
      }
    } catch (err) {
      setError('서버 요청 실패');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/receipt/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        setSelectedOrder((prev) => ({
          ...prev,
          receipt_status: '수령',
          receipt_date: new Date().toISOString()
        }));

        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId ? { ...order, receipt_status: '수령' } : order
          )
        );
      } else {
        alert('수령 처리 실패');
      }
    } catch (error) {
      console.error('수령 처리 오류:', error);
    }
  };

  const handleSelectOrder = async (orderId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/reservation/${orderId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === data.order.order_id
              ? { ...order, receipt_status: data.order.receipt_status }
              : order
          )
        );
      } else {
        alert('주문 상세 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      alert('서버 오류');
    }
  };

  return (
    <div className="m-book-container">
      <M_Header keyword={keyword} setKeyword={setKeyword} />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">전화번호 뒷자리 입력</h3>
            <form onSubmit={handlePhoneSubmit}>
              <input
                type="text"
                maxLength="4"
                value={phoneTail}
                onChange={(e) => setPhoneTail(e.target.value)}
                placeholder="예: 1234"
                className="reservation-input"
              />
              <div className="modal-buttons">
                <button type="submit" className="reservation-button">확인</button>
                <button type="button" className="reservation-button cancel-btn" onClick={() => navigate('/')}>돌아가기</button>
              </div>
            </form>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      )}

      {!showModal && (
        <div className="m-order-list">
          {orders.length === 0 ? (
            <p className="m-no-orders">등록된 주문 내역이 없습니다.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.order_id}
                className="m-order-card"
                onClick={() => handleSelectOrder(order.order_id)}
              >
                <div className="m-order-header">
                  <span className="m-order-id">📦 주문번호 {order.order_id}</span>
                  <span className={`m-order-status ${order.receipt_status?.trim() || '대기'}`}>
                    {order.receipt_status?.trim() || '대기'}
                  </span>
                </div>

                <div className="m-order-row">
                  <span className="label">대표 상품</span>
                  <span className="value">{order.representative_product}</span>
                </div>
                <div className="m-order-row">
                  <span className="label">일자</span>
                  <span className="value">{new Date(order.order_date).toLocaleString('ko-KR')}</span>
                </div>
                <div className="m-order-row">
                  <span className="label">수량</span>
                  <span className="value">{order.total_quantity}개</span>
                </div>
                <div className="m-order-row">
                  <span className="label">금액</span>
                  <span className="value">{Math.round(order.total_amount).toLocaleString()}원</span>
                </div>

                <button className="m-detail-btn">상세보기</button>
              </div>
            ))
          )}
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📦 주문 상세 정보</h3>
            <p>주문번호: {selectedOrder.order_id}</p>
            <p>대표 상품: {selectedOrder.representative_product}</p>
            <p>일자: {new Date(selectedOrder.order_date).toLocaleString('ko-KR')}</p>
            <ul className="item-list">
              {selectedOrder.items?.map((item, idx) => (
                <li key={idx}>{item.name} - {item.author} ({(item.price * item.quantity).toLocaleString()}원)</li>
              ))}
            </ul>
            <p>총 수량: {selectedOrder.total_quantity}개</p>
            <p>총 금액: {Math.round(selectedOrder.total_amount).toLocaleString()}원</p>
            <p className="receipt-status">
              수령 여부:{' '}
              <strong className={selectedOrder.receipt_status}>
                {selectedOrder.receipt_status?.trim() || '대기'}
              </strong>
            </p>

            {isAdmin && selectedOrder.receipt_status?.trim() !== '수령' && (
              <button className="complete-receipt-btn" onClick={() => handleComplete(selectedOrder.order_id)}>
                수령 완료
              </button>
            )}

            {isAdmin && selectedOrder.phone && (
              <p>전화번호 뒷자리: {selectedOrder.phone.slice(-4)}</p>
            )}

            <div className="qr-box">
              <QRCodeCanvas value={`${process.env.REACT_APP_QR_URL}/order-details/${selectedOrder.order_id}`} size={120} />
            </div>

            <button className="close-btn" onClick={() => setSelectedOrder(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default M_ReservationPage;
