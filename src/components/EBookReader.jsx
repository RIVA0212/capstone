import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EBookReader.css';

function EBookReader() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [contentUrl, setContentUrl] = useState('');
  const [fileFormat, setFileFormat] = useState('pdf');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchAccess() {
      setLoading(true);
      setError('');
      
      // productId 검증 및 수정
      let actualProductId = productId;
      if (productId === 'dummy.pdf' || productId === 'dummy') {
        // URL에서 실제 product_id 추출 시도
        const pathParts = window.location.pathname.split('/');
        const urlProductId = pathParts[pathParts.length - 1];
        if (urlProductId && urlProductId !== 'dummy.pdf' && urlProductId !== 'dummy') {
          actualProductId = urlProductId;
        } else {
          setError('잘못된 전자책 ID입니다.');
          setLoading(false);
          return;
        }
      }
      
      console.log('EBookReader - 원본 productId:', productId); // 디버깅용
      console.log('EBookReader - 수정된 productId:', actualProductId); // 디버깅용
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const base = process.env.REACT_APP_API_BASE || '';
        console.log('EBookReader - API 요청 URL:', `${base}/api/ebooks/${actualProductId}/access`); // 디버깅용
        const res = await fetch(`${base}/api/ebooks/${actualProductId}/access`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const contentType = res.headers.get('content-type') || '';
        console.log('EBookReader - 응답 상태:', res.status, res.ok); // 디버깅용
        const data = contentType.includes('application/json') ? await res.json() : { success: false, error: await res.text() };
        console.log('EBookReader - 응답 데이터:', data); // 디버깅용
        
        if (!res.ok || data.success === false) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error(data.error || '접근 실패');
        }
        
        console.log('EBookReader - 콘텐츠 설정:', data.content_url, data.file_format); // 디버깅용
        
        // 로컬 PDF 파일 사용
        setContentUrl('/ebooks/sample.pdf');
        setFileFormat(data.file_format || 'pdf');
      } catch (err) {
        if (err.name !== 'AbortError') {
          if (err.message.includes('로그인이 필요')) {
            navigate('/login');
          } else {
            setError(err.message || '오류 발생');
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAccess();
    return () => controller.abort();
  }, [productId, navigate]);

  if (loading) return <div className="ebookr-status">불러오는 중...</div>;
  if (error) return <div className="ebookr-error">{error}</div>;

  // 간단히 iframe으로 PDF/웹뷰 표시
  return (
    <div className="ebookr-root">
      <div className="ebookr-header">전자책 보기 ({fileFormat.toUpperCase()})</div>
      <div className="ebookr-view">
        <iframe title="ebook-viewer" src={contentUrl} className="ebookr-iframe" />
      </div>
    </div>
  );
}

export default EBookReader;


