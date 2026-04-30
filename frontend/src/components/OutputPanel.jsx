// src/components/OutputPanel.jsx
import React, { useState } from 'react';
import s from './OutputPanel.module.css';

export default function OutputPanel({ output, isRunning, runBy, onRun, stdin, onStdinChange }) {
  const [tab, setTab] = useState('output');

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <div className={s.tabs}>
          {['output', 'input', 'problems'].map(t => (
            <button key={t} className={`${s.tab} ${tab === t ? s.tabOn : ''}`} onClick={() => setTab(t)}>
              {t === 'input'
                ? <>Input {stdin?.trim() ? <span className={s.inputDot} /> : null}</>
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className={s.right}>
          {isRunning && (
            <span className={s.runningTag}>
              <span className={s.runDot} />
              {runBy ? `${runBy} is running…` : 'Running…'}
            </span>
          )}
          {output && !isRunning && (
            <span className={`badge ${output.success ? 'badge-green' : 'badge-red'}`}>
              {output.success ? '✓ Success' : '✗ Error'}
            </span>
          )}
        </div>
      </div>

      <div className={s.body}>

        {/* ── OUTPUT TAB ── */}
        {tab === 'output' && (
          <>
            {isRunning && <Line pre="›" cls={s.info}>Executing in sandboxed container…</Line>}

            {!isRunning && !output && (
              <Line pre="›" cls={s.muted}>Press ▶ Run to compile and execute your code</Line>
            )}

            {output && !isRunning && (
              <>
                {output.stdout
                  ? output.stdout.split('\n').map((ln, i) => <Line key={i} pre="›" cls={s.success}>{ln || ' '}</Line>)
                  : <Line pre="›" cls={s.muted}>(no stdout)</Line>
                }
                {output.stderr && (
                  <>
                    <div className={s.divider} />
                    {output.stderr.split('\n').filter(Boolean).map((ln, i) => (
                      <Line key={i} pre="!" cls={s.error}>{ln}</Line>
                    ))}
                  </>
                )}
                <div className={s.divider} />
                <Line pre="·" cls={s.muted}>
                  {output.status}
                  {output.time   ? ` · ${output.time}s`    : ''}
                  {output.memory ? ` · ${output.memory}KB` : ''}
                </Line>
              </>
            )}
          </>
        )}

        {/* ── INPUT TAB ── */}
        {tab === 'input' && (
          <div className={s.inputTab}>
            <div className={s.inputHint}>
              Provide stdin for your program. Each line = one input.
              <br />
              e.g. for <code>input()</code> in Python or <code>Scanner</code> in Java.
            </div>
            <textarea
              className={s.stdinArea}
              value={stdin}
              onChange={e => onStdinChange(e.target.value)}
              placeholder={'5\nhello world\n42'}
              spellCheck={false}
            />
            <button
              className={s.runFromInput}
              onClick={() => { onRun(stdin); setTab('output'); }}
              disabled={isRunning}
            >
              {isRunning ? '⏳ Running…' : '▶ Run with this input'}
            </button>
          </div>
        )}

        {/* ── PROBLEMS TAB ── */}
        {tab === 'problems' && (
          <Line pre="✓" cls={s.success}>No problems detected in workspace</Line>
        )}
      </div>
    </div>
  );
}

function Line({ pre, cls, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontFamily: 'var(--mono)', fontSize: 12, lineHeight: '20px' }}>
      <span style={{ color: 'var(--tx3)', flexShrink: 0, userSelect: 'none' }}>{pre}</span>
      <span className={cls}>{children}</span>
    </div>
  );
}
