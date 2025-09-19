import React, { useState, useEffect } from 'react';
import './M_InquiryPage.css';
import axios from 'axios';
import M_Header from './M_Header';

const M_InquiryPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [inquiry, setInquiry] = useState('');
  const [password, setPassword] = useState('');
  const [answers, setAnswers] = useState({});
  const [myQuestions, setMyQuestions] = useState([]);
  const [myQuestionsVisible, setMyQuestionsVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [answerInputs, setAnswerInputs] = useState({});

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('admin') === 'true';
    if (adminStatus) {
      setIsAdmin(true);
      fetchInquiries('admin');
    }
  }, []);

  const fetchInquiries = async (phoneTail) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE}/api/inquiries?phoneTail=${phoneTail}`);
      setInquiries(response.data);
    } catch (error) {
      console.error('문의 불러오기 실패:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inquiry.trim() || !password.trim()) {
      return alert('문의 내용과 비밀번호를 모두 입력해주세요.');
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE}/api/questions`, {
        question: inquiry,
        password: password
      });
      alert('문의가 등록되었습니다.');
      setInquiry('');
      setPassword('');
      setShowForm(false);
    } catch (err) {
      alert('등록 실패');
    }
  };

  const handleCheckMyQuestions = async () => {
    const input = prompt('문의 시 사용한 비밀번호를 입력하세요');
    if (!input) return;
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE}/api/my-questions`, {
        password: input
      });
      setMyQuestions(res.data.questions);
      setMyQuestionsVisible(true);
    } catch (err) {
      alert('문의 조회 실패');
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    const content = answerInputs[questionId];
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE}/api/questions/${questionId}/answer`, { answer: content });
      setInquiries(prev =>
        prev.map(q => q.question_id === questionId ? { ...q, answer: content } : q)
      );
      const updated = { ...answerInputs };
      delete updated[questionId];
      setAnswerInputs(updated);
    } catch (err) {
      alert('답변 저장 실패');
    }
  };

  const faqList = [
    { question: '상품은 언제 준비되나요?', answer: '결제 당일~다음날 오후 안에 준비하고 있습니다.' },
    { question: '결제 후 몇일 이내 수령해야 하나요?', answer: '결제 후 5일 이내로 연락이 없다면 결제가 취소됩니다.' },
    { question: '주문 취소는 어떻게 하나요?', answer: '결제 전에는 취소 가능하며, 결제 후에는 매장에 문의해 주세요.' },
    { question: '재고는 언제 들어오나요?', answer: '매주 월요일, 수요일 입고됩니다.' },
    { question: '교재가 안보여요', answer: '재고가 없는 경우 보이지 않게 설정되어 있습니다.' },
    { question: '문의 답변은 언제 해주시나요?', answer: '수요일과 금요일 정기적으로 처리됩니다.' }
  ];

  return (
    <div className="m-book-container">
      <M_Header />

      <h2 className="m-inquiry-title">자주 묻는 질문</h2>
      <div className="m-inquiry-list">
        {faqList.map((item, i) => (
          <div className="m-inquiry-card" key={i}>
            <h4 className="m-question-title">{item.question}</h4>
            <p className="m-answer-text">{item.answer}</p>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="m-inquiry-actions">
          <button className="m-inquiry-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? '작성 취소' : '글쓰기'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="m-inquiry-form">
              <textarea
                className="m-inquiry-textarea"
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                placeholder="문의 내용을 입력하세요"
                required
              />
              <input
                type="password"
                className="m-inquiry-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
              />
              <button type="submit" className="m-inquiry-submit">제출</button>
            </form>
          )}

          <button className="m-check-btn" onClick={handleCheckMyQuestions}>
            내 문의 확인
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="m-admin-inquiries">
          <h3 className="m-section-title">전체 문의 내역</h3>
          {inquiries.map((item) => (
            <div className="m-inquiry-card" key={item.question_id}>
              <h4 className="m-question-title">{item.question}</h4>
              <p className="m-answer-text">{item.answer || '답변 없음'}</p>
              <textarea
                className="m-admin-textarea"
                value={answerInputs[item.question_id] || ''}
                placeholder="답변을 입력하세요"
                onChange={(e) =>
                  setAnswerInputs((prev) => ({
                    ...prev,
                    [item.question_id]: e.target.value
                  }))
                }
              />
              <button className="m-admin-submit" onClick={() => handleAnswerSubmit(item.question_id)}>답변 저장</button>
            </div>
          ))}
        </div>
      )}

      {myQuestionsVisible && !isAdmin && (
        <div className="m-my-questions">
          <h3 className="m-section-title">내 문의 내역</h3>
          {myQuestions.length === 0 ? (
            <p className="m-no-questions">등록된 문의가 없습니다.</p>
          ) : (
            myQuestions.map((item) => (
              <div key={item.question_id} className="m-inquiry-card">
                <h4 className="m-question-title">{item.question}</h4>
                <p className="m-answer-text">{item.answer || '답변 대기 중'}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default M_InquiryPage;
