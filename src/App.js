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
import EBookLibrary from './components/EBookLibrary';
import EBookReader from './components/EBookReader';
import ChatWidget from './components/ChatWidget';

// 모바일 렌더링 (현재는 BookPage만 존재)
import MBookPage from './components/M_BookPage';
import MCartPage from './components/M_CartPage';
import MOrderDetails from './components/M_OrderDetails';
import MReservationPage from './components/M_ReservationPage';
import MInquiryPage from './components/M_InquiryPage';


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
          <Route path="/book" element={isMobile ? <MBookPage /> : <BookPage />} />
          <Route path="/cart" element={isMobile ? <MCartPage /> : <CartPage />} />
          <Route path="/order-details/:orderId" element={isMobile ? <MOrderDetails /> : <OrderDetails />} />
          <Route path="/reservation" element={isMobile ? <MReservationPage /> : <ReservationPage />} />
          <Route path="/inquiry" element={isMobile ? <MInquiryPage /> : <InquiryPage />} />
          <Route path="/ebooks" element={<EBookLibrary />} />
          <Route path="/ebooks/:productId" element={<EBookReader />} />
        </Routes>
        <ChatWidget />
      </div>
    </Router>
  );
}

export default App;
