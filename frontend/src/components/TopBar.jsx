// src/components/TopBar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.jsx';
import s from './TopBar.module.css';

const LANGS = [
  { value:'javascript', label:'JavaScript' },
  { value:'python',     label:'Python'     },
  { value:'cpp',        label:'C++'        },
  { value:'typescript', label:'TypeScript' },
  { value:'go',         label:'Go'         },
  { value:'java',       label:'Java'       },
  { value:'rust',       label:'Rust'       },
];

export default function TopBar({ roomId, language, onLangChange, onRun, isRunning, users, currentUser, connected, onStartReplay, replayOn, onSave }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={s.bar}>
      <button className={s.logo} onClick={() => navigate('/')}>
        <div className={s.logoIcon}>⚡</div>
        Code<em>Sync</em>
      </button>

      <div className={s.roomPill}>
        <span className={`${s.dot} ${connected ? s.dotGrn : s.dotRed}`} />
        <span className={s.roomId}>{roomId}</span>
      </div>

      <div className={s.spacer} />

      {/* user avatars */}
      <div className={s.avatars}>
        {users.map(u => (
          <div key={u.id} className={s.av}
            style={{ background: u.color + '28', color: u.color, borderColor: u.color + '55' }}
            title={u.username + (u.id === currentUser?.id ? ' (you)' : '')}>
            {u.username.slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>

      <select className={s.langSel} value={language} onChange={e => onLangChange(e.target.value)} disabled={replayOn}>
        {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>

      <button className={`${s.runBtn} ${isRunning ? s.runBusy : ''}`} onClick={onRun} disabled={isRunning || replayOn}>
        {isRunning
          ? <><span className="spinner" style={{width:12,height:12,borderWidth:2}} /> Running…</>
          : '▶ Run'}
      </button>

      {onSave && (
        <button className={s.iconBtn} onClick={onSave} title="Save snippet">💾</button>
      )}

      <button className={`${s.iconBtn} ${replayOn ? s.iconActive : ''}`} onClick={onStartReplay} title="Session replay">⏮</button>

      <button className={s.iconBtn} onClick={copyLink} title="Copy link">
        {copied ? '✓' : '🔗'}
      </button>

      <button className={s.themeToggle} onClick={toggle}>
        <span>{theme === 'dark' ? '☀' : '☽'}</span>
        <span className={s.themeLabel}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
    </div>
  );
}
