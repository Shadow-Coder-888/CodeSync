// src/components/UsersPanel.jsx
import React, { useState } from 'react';
import s from './UsersPanel.module.css';

export default function UsersPanel({ users, currentUser, roomId }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span className={s.title}>Users</span>
        <span className="badge badge-blue">{users.length} / 5</span>
      </div>
      <div className={s.list}>
        {users.length === 0 && <p className={s.empty}>No users connected</p>}
        {users.map(u => (
          <div key={u.id} className={s.item}>
            <div className={s.av} style={{ background: u.color + '22', color: u.color }}>
              {u.username.slice(0, 2).toUpperCase()}
            </div>
            <div className={s.info}>
              <div className={s.name}>
                {u.username}
                {u.id === currentUser?.id && <span className={s.you}>you</span>}
              </div>
              <div className={s.sub}>Active</div>
            </div>
            <div className={s.colorPin} style={{ background: u.color }} />
          </div>
        ))}
      </div>
      <div className={s.invite}>
        <p className={s.inviteHint}>Share room link to invite collaborators</p>
        <div className={s.linkRow}>
          <span className={s.roomIdText}>{roomId}</span>
          <button className={s.copyBtn} onClick={copy}>{copied ? '✓ Copied' : '📋 Copy link'}</button>
        </div>
        <p className={s.cap}>Max 5 users · Room expires after 30 min inactivity</p>
      </div>
    </div>
  );
}
