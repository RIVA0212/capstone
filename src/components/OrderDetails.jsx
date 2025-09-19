import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderDetails.css';
import { QRCodeCanvas } from 'qrcode.react';
import Header from '../components/Header';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const qrRef = useRef(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/order-details/${orderId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('주문 정보를 찾을 수 없습니다.');
        }
        
        const result = await response.json();
        setOrderData(result);
        setError(null);
      } catch (err) {
        console.error('결제 내역 조회 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatPrice = (price) => `${Number(price).toLocaleString()}원`;
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadQRCode = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `order-${orderData.orderId}-qr.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  if (loading) {
    return (
      <div className="bookstore-container">
        <Header keyword={keyword} setKeyword={setKeyword} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>주문 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookstore-container">
        <Header keyword={keyword} setKeyword={setKeyword} />
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bookstore-container order-details-page">
      <Header keyword={keyword} setKeyword={setKeyword} />

      <main className="main-content">
        <div className="order-container">
          <div className="order-header">
            <h2 className="order-title">📋 주문 상세 내역</h2>
            <div className="status-container">
              <div className="order-status-badge">
                <span className="status-icon">✅</span>
                <span>주문 완료</span>
              </div>
              <div className={`receipt-status-badge ${orderData.receiptStatus === '수령완료' ? 'completed' : 'pending'}`}>
                <span className="receipt-icon">
                  {orderData.receiptStatus === '수령완료' ? '📦' : '⏳'}
                </span>
                <span>{orderData.receiptStatus || '수령대기'}</span>
              </div>
            </div>
          </div>

          <div className="order-card">
            <div className="order-info-section">
              <div className="order-id-section">
                <h3 className="section-title">주문 정보</h3>
                <div className="order-id">#{orderData.orderId}</div>
                <div className="order-date">
                  <span className="date-label">주문일시:</span>
                  <span className="date-value">{formatDate(orderData.orderDate)}</span>
                </div>
              </div>

              <div className="order-items-section">
                <h3 className="section-title">주문 상품</h3>
                <div className="order-items">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-author">저자: {item.author}</div>
                      </div>
                      <div className="item-quantity">수량: {item.quantity}개</div>
                      <div className="item-price">{formatPrice(item.price)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-total-section">
                <div className="total-line">
                  <span>총 상품 금액</span>
                  <span>{formatPrice(orderData.totalAmount)}</span>
                </div>
                <div className="total-line final-total">
                  <span>최종 결제 금액</span>
                  <span>{formatPrice(orderData.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="qr-section">
              <h3 className="section-title">주문 확인 QR코드</h3>
              <div className="qr-container" ref={qrRef}>
                <QRCodeCanvas 
                  value={`${process.env.REACT_APP_QR_URL}/order-details/${orderData.orderId}`} 
                  size={200}
                  level="M"
                />
                <p className="qr-description">매장에서 이 QR코드를 제시해주세요</p>
                <button className="qr-download-btn" onClick={downloadQRCode}>
                  📥 QR코드 다운로드
                </button>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => navigate('/mypage')}>
              마이페이지로
            </button>
            <button className="btn-primary" onClick={() => navigate('/book')}>
              쇼핑 계속하기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;
