import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 데스크탑 렌더링
import MainPage from './components/MainPage';
import BookPage from './components/BookPage';
import CartPage from './components/CartPage';
import OrderDetails from './components/OrderDetails';
import ReservationPage from './components/ReservationPage';
import InquiryPage from './components/InquiryPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import MyPage from './components/MyPage';

// 모바일 렌더링 (현재는 BookPage만 존재)
import M_BookPage from './components/M_BookPage';
import M_CartPage from './components/M_CartPage';
import M_OrderDetails from './components/M_OrderDetails';
import M_ReservationPage from './components/M_ReservationPage';
import M_InquiryPage from './components/M_InquiryPage';


function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/book" element={isMobile ? <M_BookPage /> : <BookPage />} />
          <Route path="/cart" element={isMobile ? <M_CartPage /> : <CartPage />} />
          <Route path="/order-details/:orderId" element={isMobile ? <M_OrderDetails /> : <OrderDetails />} />
          <Route path="/reservation" element={isMobile ? <M_ReservationPage /> : <ReservationPage />} />
          <Route path="/inquiry" element={isMobile ? <M_InquiryPage /> : <InquiryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
