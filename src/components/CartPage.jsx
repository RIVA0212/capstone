import React, { useState, useEffect } from 'react';
import './BookPage.css';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [keyword, setKeyword] = useState('');

  const navigate = useNavigate();
  const goToBookPage = () => navigate('/book');

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error('장바구니 정보를 가져오는데 실패했습니다.');
      const result = await response.json();
      setCartItems(result.items || []);
      setSessionId(result.user_id || '');
      setError(null);
    } catch (err) {
      setError('장바구니를 불러오는 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (orderItemId, newQuantity) => {
    if (newQuantity < 1) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${process.env.REACT_APP_API_BASE}/api/cart/item/${orderItemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      fetchCartItems();
    } catch (error) {
      alert('수량 변경 실패: ' + error.message);
    }
  };

  const handleRemoveItem = async (orderItemId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${process.env.REACT_APP_API_BASE}/api/cart/item/${orderItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchCartItems();
      alert('상품이 삭제되었습니다.');
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('장바구니에 상품이 없습니다.');
      return;
    }
    setIsModalOpen(true);
  };

  const confirmPayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('로그인이 필요합니다.');
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/complete-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success && result.orderId) {
        setIsModalOpen(false);
        // 전화번호 입력 없이 바로 주문 상세 페이지로 이동
        navigate(`/order-details/${result.orderId}`);
      } else {
        alert(result.error || '결제 중 문제가 발생했습니다.');
      }
    } catch (error) {
      alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
    }
  };


  return (
    <div className="bookstore-container cart-page">
      <Header keyword={keyword} setKeyword={setKeyword} />

      <div className="cart-container">
        <div className="cart-header">
          <h2 className="cart-title">🛒 장바구니</h2>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>장바구니를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">❌</div>
            <h3>오류가 발생했습니다</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchCartItems}>
              다시 시도
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h3>장바구니가 비어있습니다</h3>
            <p>원하는 상품을 장바구니에 담아보세요!</p>
            <button className="continue-shopping-btn" onClick={goToBookPage}>
              쇼핑 계속하기
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items-section">
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.order_item_id} className="cart-item">
                    <div className="product-info">
                      <div className="product-image">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.product_name} />
                        ) : (
                          <div className="placeholder">
                            <span>📖</span>
                          </div>
                        )}
                      </div>
                      <div className="product-details">
                        <h3 className="product-name">{item.product_name}</h3>
                        {item.author && <p className="product-author">저자: {item.author}</p>}
                        {item.publisher && <p className="product-publisher">출판사: {item.publisher}</p>}
                      </div>
                    </div>

                    <div className="quantity-section">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn minus"
                          onClick={() => handleQuantityChange(item.order_item_id, item.quantity - 1)} 
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          className="quantity-btn plus"
                          onClick={() => handleQuantityChange(item.order_item_id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="price-section">
                      {item.original_price > item.price_per_item ? (
                        <div className="price-with-discount">
                          <div className="original-price">{Number(item.original_price).toLocaleString()} 원</div>
                          <div className="sale-price">{Number(item.price_per_item).toLocaleString()} 원</div>
                          <div className="discount-badge">
                            {Math.round(((item.original_price - item.price_per_item) / item.original_price) * 100)}% 할인
                          </div>
                        </div>
                      ) : (
                        <div className="price-normal">
                          <div className="sale-price">{Number(item.price_per_item).toLocaleString()} 원</div>
                        </div>
                      )}
                    </div>

                    <div className="total-section">
                      <div className={`item-total ${item.original_price > item.price_per_item ? 'discounted' : ''}`}>
                        {Number(item.price_per_item * item.quantity).toLocaleString()} 원
                      </div>
                    </div>

                    <div className="remove-section">
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.order_item_id)}
                        title="상품 삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-summary-section">
              <div className="summary-card">
                <h3 className="summary-title">주문 요약</h3>
                
                {(() => {
                  const originalTotal = cartItems.reduce(
                    (sum, item) => sum + (item.original_price ?? item.price_per_item) * item.quantity,
                    0
                  );
                  const discountedTotal = cartItems.reduce(
                    (sum, item) => sum + item.price_per_item * item.quantity,
                    0
                  );
                  const discountAmount = originalTotal - discountedTotal;
                  const discountRate = originalTotal > 0
                    ? Math.round(((originalTotal - discountedTotal) / originalTotal) * 100)
                    : 0;

                  return (
                    <div className="summary-content">
                      <div className="summary-line">
                        <span>총 상품 금액</span>
                        <span>{originalTotal.toLocaleString()} 원</span>
                      </div>
                      
                      <div className="summary-line">
                        <span>총 상품 개수</span>
                        <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}개</span>
                      </div>
                      
                      {discountAmount > 0 && (
                        <>
                          <div className="summary-line discount">
                            <span>할인 금액</span>
                            <span className="discount-amount">-{discountAmount.toLocaleString()} 원</span>
                          </div>
                          <div className="summary-line discount-rate">
                            <span>할인률</span>
                            <span className="rate">{discountRate}%</span>
                          </div>
                        </>
                      )}
                      
                      <div className="summary-divider"></div>
                      
                      <div className="summary-total">
                        <span>최종 결제 금액</span>
                        <span className="total-amount">{discountedTotal.toLocaleString()} 원</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="summary-actions">
                  <button className="checkout-button" onClick={handleCheckout}>
                    💳 결제하기
                  </button>
                  <button className="continue-shopping" onClick={goToBookPage}>
                    🛍️ 쇼핑 계속하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 결제 확인</h3>
            </div>
            <div className="modal-body">
              <div className="payment-amount">
                <span>총 결제 금액</span>
                <span className="amount">
                  {cartItems.reduce((sum, item) => sum + item.price_per_item * item.quantity, 0).toLocaleString()} 원
                </span>
              </div>
              <p className="payment-description">
                위 금액으로 결제를 진행하시겠습니까?<br/>
                결제 후 주문 상세 페이지로 이동됩니다.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={confirmPayment}>
                💳 결제하기
              </button>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                ❌ 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
