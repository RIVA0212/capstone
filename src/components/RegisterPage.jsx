import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 아이디가 변경되면 중복 확인 초기화
    if (name === 'username') {
      setUsernameChecked(false);
      setUsernameAvailable(false);
    }
  };

  const checkUsername = async () => {
    if (!formData.username) {
      setError('아이디를 입력해주세요.');
      return;
    }

    if (formData.username.length < 3) {
      setError('아이디는 3글자 이상이어야 합니다.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE}/api/check-username`, {
        username: formData.username
      });

      setUsernameChecked(true);
      setUsernameAvailable(response.data.available);
      setError(response.data.available ? '' : '이미 사용 중인 아이디입니다.');
    } catch (err) {
      setError('아이디 중복 확인에 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.username || !formData.password || !formData.name) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    if (!usernameChecked || !usernameAvailable) {
      setError('아이디 중복 확인을 해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6글자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE}/api/register`, {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        email: formData.email
      });

      if (response.data.success) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">아이디 *</label>
            <div className="username-check-group">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="아이디를 입력하세요 (3글자 이상)"
                disabled={loading}
              />
              <button
                type="button"
                onClick={checkUsername}
                className="check-button"
                disabled={loading || !formData.username}
              >
                중복확인
              </button>
            </div>
            {usernameChecked && (
              <div className={`check-result ${usernameAvailable ? 'success' : 'error'}`}>
                {usernameAvailable ? '✓ 사용 가능한 아이디입니다.' : '✗ 이미 사용 중인 아이디입니다.'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호 *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요 (6글자 이상)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인 *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">이름 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">전화번호</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="전화번호를 입력하세요 (선택사항)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요 (선택사항)"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
