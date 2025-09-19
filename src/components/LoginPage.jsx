import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE}/api/login`, {
        username,
        password
      });

      if (response.data.success) {
        // JWT 토큰을 localStorage에 저장
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 로그인 성공 시에만 메인 페이지로 이동
        navigate('/');
      } else {
        // 서버에서 success가 false인 경우
        const errorMsg = '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (err) {
      // 네트워크 오류나 서버 오류 시
      let errorMsg = '';
      if (err.response?.status === 401) {
        errorMsg = '아이디 또는 비밀번호가 틀렸습니다.';
      } else if (err.response?.status === 400) {
        errorMsg = '아이디와 비밀번호를 입력해주세요.';
      } else {
        errorMsg = '로그인에 실패했습니다. 다시 시도해주세요.';
      }
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>로그인</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            계정이 없으신가요? <Link to="/register">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
