// src/components/StatusBar.jsx
import React from 'react';
import s from './StatusBar.module.css';

const LANG_SHORT = { javascript:'JS', python:'PY', cpp:'C++', typescript:'TS', go:'GO', java:'JAVA', rust:'RS' };

export default function StatusBar({ connected, language, cursorPos, userCount }) {
  return (
    <div className={s.bar}>
      <div className={s.grp}>
        <span className={`${s.connDot} ${connected ? s.connOn : s.connOff}`} />
        <span>{connected ? 'Connected' : 'Reconnecting…'}</span>
        <span className={s.sep}>·</span>
        <span>{LANG_SHORT[language] || language}</span>
        <span className={s.sep}>·</span>
        <span>UTF-8</span>
      </div>
      <div className={s.grp}>
        <span>Ln {cursorPos?.line ?? 1}, Col {cursorPos?.col ?? 1}</span>
        <span className={s.sep}>·</span>
        <span>{userCount} user{userCount !== 1 ? 's' : ''} online</span>
        <span className={s.sep}>·</span>
        <span>WebSocket</span>
      </div>
    </div>
  );
}
