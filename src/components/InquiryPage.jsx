import React, { useState, useEffect } from 'react';
import './InquiryPage.css';
import axios from 'axios';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const InquiryPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [inquiry, setInquiry] = useState('');
  const [answers, setAnswers] = useState({});
  const [myQuestions, setMyQuestions] = useState([]);
  const [myQuestionsVisible, setMyQuestionsVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [answerInputs, setAnswerInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initPage = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        // 비로그인: 페이지는 열어두되 글쓰기/내 문의는 비활성화
        setIsLoggedIn(false);
        setIsAdmin(false);
        setMyQuestionsVisible(false);
        setLoading(false);
        return;
      }

      try {
        setIsLoggedIn(true);
        const user = JSON.parse(userData);
        if (user.role === 'admin') {
          setIsAdmin(true);
          await fetchInquiries('admin');
        } else {
          setIsAdmin(false);
          await fetchUserInquiries();
        }
      } catch (err) {
        console.error('사용자 정보 파싱 오류:', err);
        // 파싱 실패 시 비로그인 취급
        setIsLoggedIn(false);
        setIsAdmin(false);
        setMyQuestionsVisible(false);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [navigate]);

  // ✅ 일반 사용자 문의 조회 (로그인 기반)
  const fetchUserInquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/my-inquiries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setMyQuestionsVisible(false);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setMyQuestions(data.questions || []);
        setMyQuestionsVisible(true);
        setError('');
      } else {
        setError(data.error || '문의 조회 실패');
        setMyQuestions([]);
        setMyQuestionsVisible(false);
      }
    } catch (err) {
      setError('서버 요청 실패');
      setMyQuestions([]);
      setMyQuestionsVisible(false);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 관리자 문의 조회
  const fetchInquiries = async (phoneTail) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/inquiries?phoneTail=${phoneTail}`);
      const data = await response.json();
      setInquiries(data);
      setError('');
    } catch (error) {
      console.error('문의 불러오기 실패:', error);
      setError('문의 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inquiry.trim()) {
      return alert('문의 내용을 입력해주세요.');
    }

    // 비로그인 시 글쓰기 차단
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE}/api/questions`, {
        question: inquiry
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        alert('문의가 성공적으로 등록되었습니다.');
        setInquiry('');
        setShowForm(false);
        
        // 문의 제출 후 목록 새로고침
        if (isAdmin) {
          await fetchInquiries('admin');
        } else {
          await fetchUserInquiries();
        }
      } else {
        alert('등록 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else {
        alert('등록 중 오류가 발생했습니다.');
      }
    }
  };

  // 비밀번호 확인 기능 제거됨 (로그인 기반으로 전환)


  const handleAnswerSubmit = async (questionId) => {
    const content = answerInputs[questionId];
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE}/api/questions/${questionId}/answer`, {
        answer: content,
      });

      setInquiries((prev) =>
        prev.map((q) =>
          q.question_id === questionId ? { ...q, answer: content } : q
        )
      );

      setAnswerInputs((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    } catch (err) {
      alert('답변 저장 실패');
    }
  };

  const faqList = [
    { question: '상품은 언제 준비되나요?', answer: '결제 당일~다음날 오후 안에 준비하고 있습니다.' },
    { question: '결제 후 몇일 이내 수령해야 하나요?', answer: '결제 후 5일 이내로 연락이 없다면 결제가 취소됩니다. 환불은 매장에 방문하거나 전화 바랍니다.' },
    { question: '주문 취소는 어떻게 하나요?', answer: '장바구니 결제 전에는 취소가 가능하고, 이미 결제한 경우 매장에 전화 바랍니다.' },
    { question: '재고는 언제 들어오나요?', answer: '보통 매주 월요일, 수요일날 들어옵니다.' },
    { question: '교재가 안보여요', answer: '재고가 전부 소진된 경우 보이지 않게 설정되어 있습니다.' },
    { question: '문의 답변은 언제 해주시나요?', answer: '매주 수요일과 금요일, 주 2회 정기적으로 처리하고 있습니다' },
  ];

  return (
    <div className="bookstore-container">
      <Header keyword={keyword} setKeyword={setKeyword} />
      <main className="main-content">
        <div className="inquiry-wrapper">
          <h2 className="inquiry-title">자주 묻는 질문</h2>

          <div className="faq-section">
            {faqList.map((item, index) => (
              <div key={`faq-${index}`} className="faq-item">
                <div className="faq-question">{item.question}</div>
                <div className="faq-answer">{item.answer}</div>
              </div>
            ))}
          </div>
          
          {/* 로딩 상태 */}
          {loading && (
            <div className="loading-container">
              <div className="loading">문의 내역을 불러오는 중...</div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          )}
          
          {!isAdmin && !loading && (
          <div className="write-section">
            <button
              className="write-button"
              onClick={() => {
                if (!isLoggedIn) {
                  alert('로그인이 필요합니다.');
                  navigate('/login');
                  return;
                }
                setShowForm(!showForm);
              }}
            >
              글쓰기
            </button>
            {showForm && isLoggedIn && (
              <form className="inquiry-form" onSubmit={handleSubmit}>
                <textarea
                  value={inquiry}
                  onChange={(e) => setInquiry(e.target.value)}
                  placeholder="내용을 입력하세요."
                  rows={5}
                  required
                />
                {/* 비밀번호 입력 제거 */}
                <button type="submit">제출</button>
              </form>
            )}
            {!isLoggedIn && (
              <div className="login-hint">글쓰기는 로그인 후 이용 가능합니다.</div>
            )}
            
          </div>
          )}
          
          {isAdmin && (
            <div className="question-list">
              <h3>전체 문의 내역 (관리자)</h3>
              {inquiries.length > 0 ? (
                inquiries.map((item) => (
                  <div key={item.question_id} className="faq-item">
                    <div
                      className="faq-question"
                      onClick={() =>
                        setAnswerInputs((prev) => ({
                          ...prev,
                          [item.question_id]: prev[item.question_id] !== undefined
                            ? undefined
                            : item.answer || '',
                        }))
                      }
                    >
                      {item.question}
                    </div>
                    <div className="faq-answer">{item.answer || '답변 준비 중입니다.'}</div>

                    {answerInputs[item.question_id] !== undefined && (
                      <div className="answer-form">
                        <textarea
                          value={answerInputs[item.question_id]}
                          onChange={(e) =>
                            setAnswerInputs((prev) => ({
                              ...prev,
                              [item.question_id]: e.target.value,
                            }))
                          }
                          placeholder="답변을 입력하세요"
                        />
                        <button
                          onClick={() => handleAnswerSubmit(item.question_id)}
                          className="submit-btn"
                        >
                          저장
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-question-box">
                  <div className="no-questions">등록된 문의가 없습니다.</div>
                </div>
              )}
            </div>
          )}

          {!isAdmin && !loading && myQuestionsVisible && (
            <div className="question-list">
              <h3>내 문의 내역</h3>
              <div className="inquiry-cards">
                {myQuestions.length > 0 ? (
                  myQuestions.map((item) => (
                    <div key={item.question_id} className="inquiry-card">
                      <div className="inquiry-card-content">
                        <div className="inquiry-question">
                          <p>{item.question}</p>
                        </div>
                        <div className="inquiry-answer">
                          <p className={item.answer ? 'answered' : 'pending'}>
                            {item.answer || '답변 준비 중입니다.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-question-box">
                    <div className="no-questions">등록된 문의가 없습니다.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InquiryPage;