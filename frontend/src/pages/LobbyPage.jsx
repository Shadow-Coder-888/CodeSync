// src/pages/LobbyPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme.jsx';
import { useAuth }  from '../hooks/useAuth.jsx';
import s from './LobbyPage.module.css';

const API = import.meta.env.VITE_BACKEND_URL || '';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { user, logout }  = useAuth();

  const [tab,      setTab]      = useState('create'); // 'create' | 'join'
  const [name,     setName]     = useState(user?.username || '');
  const [roomInput,setRoomInput]= useState('');
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  function validate() {
    if (!name.trim())        { setErr('Please enter your name.'); return false; }
    if (name.trim().length < 2) { setErr('Name must be at least 2 characters.'); return false; }
    return true;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true); setErr('');
    try {
      const res = await axios.post(`${API}/api/rooms/create`);
      sessionStorage.setItem('cs-name', name.trim());
      navigate(`/room/${res.data.roomId}`);
    } catch {
      setErr('Could not create room. Is the backend running?');
    } finally { setBusy(false); }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!validate()) return;
    const rid = roomInput.trim().toUpperCase();
    if (!rid) { setErr('Please enter a room ID.'); return; }
    setBusy(true); setErr('');
    try {
      const res = await axios.get(`${API}/api/rooms/${rid}`);
      if (res.data.full) { setErr('This room is full (max 5 users).'); setBusy(false); return; }
      sessionStorage.setItem('cs-name', name.trim());
      navigate(`/room/${rid}`);
    } catch (ex) {
      setErr(ex.response?.status === 404 ? `Room "${rid}" not found.` : 'Connection failed. Is the backend running?');
    } finally { setBusy(false); }
  }

  return (
    <div className={s.page}>
      {/* top-right controls */}
      <div className={s.topRight}>
        {user ? (
          <div className={s.userChip}>
            <div className={s.userDot} />
            <span>{user.username}</span>
            <button className={s.logoutBtn} onClick={logout}>Sign out</button>
          </div>
        ) : (
          <button className={`btn btn-ghost ${s.authBtn}`} onClick={() => navigate('/auth')}>
            Sign in / Register
          </button>
        )}
        <button className={s.themeBtn} onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>

      <div className={`${s.card} fade-up`}>
        {/* Logo */}
        <div className={s.logo}>
          <div className={s.logoIcon}>⚡</div>
          <span>Code<em>Sync</em></span>
        </div>
        <p className={s.tagline}>Real-time collaborative coding. No sign-up needed to start.</p>

        {/* Tab switcher */}
        <div className={s.tabs}>
          <button className={`${s.tabBtn} ${tab === 'create' ? s.tabOn : ''}`} onClick={() => { setTab('create'); setErr(''); }}>
            Create room
          </button>
          <button className={`${s.tabBtn} ${tab === 'join' ? s.tabOn : ''}`} onClick={() => { setTab('join'); setErr(''); }}>
            Join room
          </button>
        </div>

        <form onSubmit={tab === 'create' ? handleCreate : handleJoin} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Your display name</label>
            <input
              className="input-field"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={32}
              autoFocus
              autoComplete="off"
            />
          </div>

          {tab === 'join' && (
            <div className={s.field}>
              <label className={s.label}>Room ID</label>
              <input
                className="input-field"
                placeholder="e.g. MK-4892"
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase())}
                maxLength={8}
                autoComplete="off"
                style={{ fontFamily: 'var(--mono)', letterSpacing: '2px' }}
              />
            </div>
          )}

          {err && <p className={s.err}>{err}</p>}

          <button
            type="submit"
            className={`btn ${tab === 'create' ? 'btn-primary' : 'btn-green'} ${s.submit}`}
            disabled={busy}
          >
            {busy ? <span className="spinner" /> : tab === 'create' ? '+ Create Room' : '→ Join Room'}
          </button>
        </form>

        {/* Save-work callout — only shown when not logged in */}
        {!user && (
          <div className={s.saveCallout}>
            <span className={s.saveIcon}>💾</span>
            <div>
              <strong>Want to save your work?</strong>
              <p>
                <button className={s.inlineLink} onClick={() => navigate('/auth')}>Create a free account</button>
                {' '}to save snippets across sessions.
              </p>
            </div>
          </div>
        )}

        {user && (
          <div className={s.saveCallout} style={{ borderColor: 'rgba(16,185,129,.25)', background: 'rgba(16,185,129,.05)' }}>
            <span className={s.saveIcon}>✓</span>
            <div>
              <strong>Signed in as {user.username}</strong>
              <p>You can save snippets from inside any room.</p>
            </div>
          </div>
        )}

        <div className={s.features}>
          {[
            ['👥', 'Up to 5 users per room'],
            ['⚡', 'Real-time sync'],
            ['🔒', 'Sandboxed execution'],
            ['⏮',  'Session replay'],
          ].map(([icon, text]) => (
            <div key={text} className={s.feat}>
              <span className={s.featIcon}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
