import React, { useEffect, useRef, useState } from 'react';
import './ChatWidget.css';

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE || '';

  const suggestions = [
    '전자책은 어디서 보나요?',
    '수령 기한이 어떻게 되나요?',
    '환불/취소가 가능한가요?'
  ];

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const bot = data.reply || '답변을 가져오지 못했습니다.';
      setMessages(prev => [...prev, { role: 'bot', content: bot }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: '오류가 발생했습니다.' }]);
    } finally {
      setLoading(false);
    }
  }

  function quickSend(text) {
    setInput(text);
    setTimeout(() => send(), 0);
  }

  return (
    <>
      {open && (
        <div className="cw-panel cw-animate-in">
          <div className="cw-header">
            <div className="cw-title">
              <span className="cw-avatar">🤖</span>
              <span>도움이 필요하신가요?</span>
            </div>
            <button className="cw-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="cw-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="cw-chip" onClick={() => quickSend(s)}>{s}</button>
            ))}
          </div>

          <div className="cw-messages" ref={listRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`cw-row ${m.role}`}>
                <div className="cw-bubble">{m.content}</div>
              </div>
            ))}
            {loading && <div className="cw-status">답변 생성 중...</div>}
          </div>
          <div className="cw-input">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="메시지를 입력하세요" />
            <button onClick={send} disabled={loading || !input.trim()}>전송</button>
          </div>
        </div>
      )}

      <button className={`cw-fab ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="chat">
        {open ? '−' : '+'}
      </button>
    </>
  );
}

export default ChatWidget;


