// src/components/ChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import s from './ChatPanel.module.css';

export default function ChatPanel({ messages, currentUser, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    const t = text.trim();
    if (!t) return;
    onSend(t); setText('');
  }

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span className={s.title}>Chat</span>
        <span className="badge badge-blue">{messages.length}</span>
      </div>

      <div className={s.msgs}>
        {messages.length === 0 && (
          <div className={s.empty}>
            <p>No messages yet.</p>
            <p>Say hello to your team 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const me = msg.userId === currentUser?.id;
          return (
            <div key={msg.id} className={`${s.row} ${me ? s.rowMe : ''}`}>
              {!me && (
                <div className={s.av} style={{ background: msg.color + '22', color: msg.color }}>
                  {msg.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className={s.content}>
                {!me && (
                  <div className={s.meta}>
                    <span className={s.uname} style={{ color: msg.color }}>{msg.username}</span>
                    <span className={s.time}>{fmtTime(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`${s.bubble} ${me ? s.bubbleMe : s.bubbleThem}`}>{msg.text}</div>
                {me && (
                  <div className={s.metaR}><span className={s.time}>{fmtTime(msg.timestamp)}</span></div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={s.inputArea}>
        <div className={s.inputWrap}>
          <input
            className={s.input}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message…"
            maxLength={500}
          />
          <button className={s.sendBtn} onClick={send} disabled={!text.trim()}>➤</button>
        </div>
      </div>
    </div>
  );
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
