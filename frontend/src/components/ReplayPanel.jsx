// src/components/ReplayPanel.jsx
import React, { useEffect } from 'react';
import s from './ReplayPanel.module.css';

export default function ReplayPanel({ snapshots, onRequest, onStart, inReplay }) {
  useEffect(() => { onRequest(); }, []);

  const duration = snapshots.length > 1
    ? Math.round((snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) / 1000)
    : 0;

  const fmt = secs => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span className={s.title}>Session Replay</span>
      </div>
      <div className={s.body}>

        {/* Recording indicator */}
        <div className={s.recCard}>
          <div className={s.recDot} />
          <div>
            <div className={s.recTitle}>Recording in progress</div>
            <div className={s.recSub}>
              {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} saved
              {duration > 0 ? ` · ${fmt(duration)} recorded` : ''}
            </div>
          </div>
        </div>

        {/* Play button — only shown when there is real data */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Current session</div>
          {snapshots.length < 2 ? (
            <p className={s.hint}>
              Start writing code — snapshots are captured every 5 seconds automatically.
            </p>
          ) : (
            <div className={s.sessionRow}>
              <div>
                <div className={s.sessionName}>This session</div>
                <div className={s.sessionMeta}>
                  {snapshots.length} snapshots · {fmt(duration)} recorded
                </div>
              </div>
              <button
                className={`${s.playBtn} ${inReplay ? s.playBtnActive : ''}`}
                onClick={onStart}
              >
                {inReplay ? '↺ Restart' : '▶ Play'}
              </button>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className={s.section}>
          <div className={s.sectionTitle}>How replay works</div>
          <div className={s.infoList}>
            {[
              ['📸', 'Snapshots saved every 5 seconds automatically'],
              ['⏮', 'Use the scrubber bar below the editor to navigate'],
              ['👁', 'Editor is read-only during playback'],
              ['🗑', 'Replay data is cleared when the room expires'],
            ].map(([icon, text]) => (
              <div key={text} className={s.infoRow}>
                <span className={s.infoIcon}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
