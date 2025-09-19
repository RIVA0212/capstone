import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 환경 변수 설정
if (!process.env.REACT_APP_API_BASE) {
  process.env.REACT_APP_API_BASE = 'http://localhost:5000';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// 페이지 이탈 시 자동 로그아웃 처리
const handlePageExitAndLogout = () => {
  try {
    const isAdmin = sessionStorage.getItem('admin') === 'true';

    // 클라이언트 측 인증 정보 제거
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('admin');

    // 관리자 세션 서버 종료 (가능하면 sendBeacon 사용)
    if (isAdmin && navigator.sendBeacon) {
      const url = `${process.env.REACT_APP_API_BASE}/api/admin-session`;
      const payload = new Blob([JSON.stringify({ action: 'logout' })], {
        type: 'application/json'
      });
      navigator.sendBeacon(url, payload);
    }
  } catch (err) {
    // noop
  }
};

// 실제 페이지 종료/이탈 시에만 로그아웃
window.addEventListener('beforeunload', handlePageExitAndLogout);