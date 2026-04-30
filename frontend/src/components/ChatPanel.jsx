// src/components/ChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import s from './ChatPanel.module.css';

export default function ChatPanel({ messages, currentUser, onSend }) {
  const [text, setText] = useState('');
  const [unread, setUnread] = useState({}); // userId -> { count, color, username }
  const [focused, setFocused] = useState(false);
  const bottomRef = useRef(null);
  const prevLenRef = useRef(messages.length);

  // Auto-scroll and track unread badges per user
  useEffect(() => {
    const newMsgs = messages.slice(prevLenRef.current);
    prevLenRef.current = messages.length;

    newMsgs.forEach(msg => {
      // Don't badge your own messages
      if (msg.userId === currentUser?.id) return;
      setUnread(prev => ({
        ...prev,
        [msg.userId]: {
          count: (prev[msg.userId]?.count || 0) + 1,
          color: msg.color,
          username: msg.username,
        },
      }));
    });

    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear all unread when panel is focused/clicked
  function clearUnread() {
    setUnread({});
    setFocused(true);
  }

  function send() {
    const t = text.trim();
    if (!t) return;
    onSend(t); setText('');
  }

  const totalUnread = Object.values(unread).reduce((a, v) => a + v.count, 0);
  const badgeUsers  = Object.values(unread).filter(u => u.count > 0);

  return (
    <div className={s.panel} onClick={clearUnread}>

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.title}>Chat</span>
          <span className="badge badge-blue">{messages.length}</span>
        </div>

        {/* Per-user colour notification badges */}
        {badgeUsers.length > 0 && (
          <div className={s.notifRow}>
            {badgeUsers.map(u => (
              <div
                key={u.username}
                className={s.notifBadge}
                style={{
                  background: u.color + '22',
                  border: `1.5px solid ${u.color}`,
                  color: u.color,
                  boxShadow: `0 0 6px ${u.color}55`,
                }}
                title={`${u.username}: ${u.count} new message${u.count > 1 ? 's' : ''}`}
              >
                <span
                  className={s.notifDot}
                  style={{ background: u.color }}
                />
                <span className={s.notifName}>{u.username.slice(0, 6)}</span>
                <span className={s.notifCount}>{u.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
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
                <div className={s.avWrap}>
                  <div className={s.av} style={{ background: msg.color + '22', color: msg.color }}>
                    {msg.username.slice(0, 2).toUpperCase()}
                  </div>
                  {/* Colour indicator dot on avatar */}
                  <span className={s.avDot} style={{ background: msg.color }} />
                </div>
              )}
              <div className={s.content}>
                {!me && (
                  <div className={s.meta}>
                    {/* Coloured username badge */}
                    <span
                      className={s.unameTag}
                      style={{
                        background: msg.color + '18',
                        border: `1px solid ${msg.color}44`,
                        color: msg.color,
                      }}
                    >
                      {msg.username}
                    </span>
                    <span className={s.time}>{fmtTime(msg.timestamp)}</span>
                  </div>
                )}
                <div
                  className={`${s.bubble} ${me ? s.bubbleMe : s.bubbleThem}`}
                  style={!me ? { borderLeft: `2.5px solid ${msg.color}` } : {}}
                >
                  {msg.text}
                </div>
                {me && (
                  <div className={s.metaR}><span className={s.time}>{fmtTime(msg.timestamp)}</span></div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={s.inputArea}>
        {/* Show my own colour indicator */}
        {currentUser && (
          <div className={s.myColorBar}>
            <span
              className={s.myColorDot}
              style={{ background: currentUser.color }}
            />
            <span className={s.myColorLabel} style={{ color: currentUser.color }}>
              You ({currentUser.username})
            </span>
          </div>
        )}
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
