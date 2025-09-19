import React, { useEffect, useState } from 'react';
import './MainPage.css';
import { useNavigate } from 'react-router-dom';

const bannerImages = [
  '/images/banner1.jpg',
  '/images/banner2.jpg',
  '/images/banner3.jpg',
];

const MainPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate(); // ✅ 추가

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
  };

  return (
    <div className="main-page">
        <section className="main-header">
        <div className="main-title">
          <h1>EasyFind Bookstore</h1>
          <p>지식의 여정을 더 쉽고 빠르게.</p>
        </div>
      </section>

      {/* 네비게이션 버튼 */}
      <div className="main-buttons">
        <button onClick={() => navigate('/book')}>
          <div className="icon">🔍</div>
          <div className="label">상품 탐색</div>
        </button>
        <button onClick={() => navigate('/cart')}>
          <div className="icon">🛒</div>
          <div className="label">장바구니</div>
        </button>
        <button onClick={() => navigate('/reservation')}>
          <div className="icon">📦</div>
          <div className="label">주문 내역</div>
        </button>
        <button onClick={() => navigate('/inquiry')}>
          <div className="icon">💬</div>
          <div className="label">고객센터</div>
        </button>
      </div>

      <section className="main-banner">
        <div className="banner-wrapper">
          <div className="banner-slider">
            {bannerImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`banner-${idx}`}
                className={`banner-img ${idx === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>
          <button className="banner-arrow left" onClick={prevSlide}>❮</button>
          <button className="banner-arrow right" onClick={nextSlide}>❯</button>
        </div>

        <div className="banner-dots">
          {bannerImages.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      </section>

      <footer className="main-footer-text">
        <p>© 2025 Capstone EasyFind Project.<br />문의: easyfind@support.com</p>
      </footer>
    </div>
  );
};

export default MainPage;