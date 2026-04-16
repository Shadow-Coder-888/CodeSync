// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }  from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import s from './AuthPage.module.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const { theme, toggle }   = useTheme();

  const [mode,     setMode]     = useState('login');   // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'register') {
        await register(email, password, username);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.page}>
      <button className={s.themeBtn} onClick={toggle}>{theme === 'dark' ? '☀' : '☽'}</button>

      <div className={`${s.card} fade-up`}>
        <button className={s.backBtn} onClick={() => navigate('/')}>← Back</button>

        <div className={s.logo}>
          <div className={s.logoIcon}>⚡</div>
          <span>Code<em>Sync</em></span>
        </div>

        <p className={s.subtitle}>
          {mode === 'login'
            ? 'Sign in to save and access your snippets.'
            : 'Create an account to save your work across sessions.'}
        </p>

        <div className={s.tabs}>
          <button className={`${s.tabBtn} ${mode === 'login'    ? s.tabOn : ''}`} onClick={() => { setMode('login');    setErr(''); }}>Sign in</button>
          <button className={`${s.tabBtn} ${mode === 'register' ? s.tabOn : ''}`} onClick={() => { setMode('register'); setErr(''); }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          {mode === 'register' && (
            <div className={s.field}>
              <label className={s.label}>Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Alex"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={32}
                autoComplete="username"
                required
              />
            </div>
          )}

          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              className="input-field"
              type="password"
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {err && <p className={s.err}>{err}</p>}

          <button type="submit" className={`btn btn-primary ${s.submit}`} disabled={busy}>
            {busy ? <span className="spinner" /> : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={s.note}>
          You don't need an account to use CodeSync.{' '}
          <button className={s.inlineLink} onClick={() => navigate('/')}>
            Continue as guest →
          </button>
        </p>
      </div>
    </div>
  );
}
