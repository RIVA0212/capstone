import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './M_OrderDetails.css';
import { QRCodeCanvas } from 'qrcode.react';
import M_Header from './M_Header';

const M_OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/order-details/${orderId}`, {
          credentials: 'include'
        });
        const result = await response.json();
        setOrderData(result);
      } catch (err) {
        console.error('결제 내역 조회 오류:', err);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatPrice = (price) => `${Number(price).toLocaleString()}원`;

  if (!orderData) {
    return <div className="m-loading">결제 내역을 불러오는 중입니다...</div>;
  }

  return (
    <div className="m-book-container">
      <M_Header />

      <h2 className="m-order-title">내 결제 내역</h2>

      <div className="m-order-box">
        <p className="m-order-id"><strong>주문번호:</strong> ORD{orderData.orderId}</p>
        <p className="m-order-date">
          <strong>일시:</strong>{' '}
          {new Date(orderData.orderDate).toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          })}
        </p>

        <ul className="m-order-items">
          {orderData.items.map((item, i) => (
            <li key={i} className="m-order-item">
              🔹 {item.name} - {item.author} ({formatPrice(item.price)})
            </li>
          ))}
        </ul>

        <p className="m-order-total"><strong>총 금액:</strong> {formatPrice(orderData.totalAmount)}</p>

        <div className="m-qr-box">
          <QRCodeCanvas value={`${process.env.REACT_APP_QR_URL}/order-details/${orderData.orderId}`} size={140} />
        </div>

        <button className="m-close-btn" onClick={() => navigate('/book')}>닫기</button>
      </div>
    </div>
  );
};

export default M_OrderDetails;
