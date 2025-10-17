import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './EBookLibrary.css';

function EBookLibrary() {
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState([]);
  const [myOnly, setMyOnly] = useState(() => new URLSearchParams(window.location.search).get('mine') === '1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (myOnly && !token) {
          navigate('/login');
          return;
        }
        const base = process.env.REACT_APP_API_BASE || '';
        const endpoint = myOnly ? `${base}/api/my-ebooks` : `${base}/api/ebooks`;
        const res = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            ...(myOnly && token ? { Authorization: `Bearer ${token}` } : {})
          },
          signal: controller.signal
        });
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : { success: false, error: await res.text() };
        if (!res.ok || data.success === false) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error(data.error || '불러오기 실패');
        }
        setEbooks(data.ebooks || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          if (err.message.includes('로그인')) {
            navigate('/login');
          } else {
            setError(err.message || '오류 발생');
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, [myOnly, navigate]);

  return (
    <div className="ebook-container">
      <h2 className="ebook-title">전자책 라이브러리</h2>
      <div className="ebook-toolbar">
        <label className="ebook-toggle">
          <input type="checkbox" checked={myOnly} onChange={e => setMyOnly(e.target.checked)} /> 내 전자책만 보기
        </label>
      </div>
      {loading && <div className="ebook-status">불러오는 중...</div>}
      {error && <div className="ebook-error">{error}</div>}
      <div className="ebook-grid">
        {ebooks.map(e => (
          <div key={e.product_id} className="ebook-card">
            <div className="ebook-image-wrap">
              {e.image_url ? (
                <img src={e.image_url} alt={e.product_name || e.title} />
              ) : (
                <div className="ebook-img-placeholder">이미지 없음</div>
              )}
            </div>
            <div className="ebook-info">
              <div className="ebook-name">{e.product_name || e.title}</div>
              <div className="ebook-format">{e.file_format?.toUpperCase()}</div>
              <Link to={`/ebooks/${e.product_id}`} className="ebook-read-btn">열람</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EBookLibrary;


