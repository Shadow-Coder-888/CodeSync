// src/components/SaveModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import s from './SaveModal.module.css';

const API = import.meta.env.VITE_BACKEND_URL || '';

export default function SaveModal({ code, language, onClose }) {
  const { authAxios } = useAuth();
  const [title,   setTitle]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await authAxios({
        method: 'POST',
        url: `${API}/api/snippets`,
        data: { title: title || 'Untitled', code, language },
      });
      setDone(true);
      setTimeout(onClose, 1400);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Could not save snippet.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.mHeader}>
          <span className={s.mTitle}>Save snippet</span>
          <button className={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={s.success}>
            <span className={s.successIcon}>✓</span>
            <p>Snippet saved!</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Title (optional)</label>
              <input
                className="input-field"
                placeholder="e.g. Fibonacci solution"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={60}
                autoFocus
              />
            </div>
            <div className={s.meta}>
              <span className="badge badge-blue">{language}</span>
              <span className={s.metaText}>{code.split('\n').length} lines</span>
            </div>
            {err && <p className={s.err}>{err}</p>}
            <div className={s.actions}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <span className="spinner" /> : '💾 Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
