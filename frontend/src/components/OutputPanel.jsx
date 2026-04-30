// src/components/OutputPanel.jsx
import React, { useState, useEffect } from 'react';
import s from './OutputPanel.module.css';

// Detect if code likely uses stdin so we can nudge the user
function codeUsesInput(code = '') {
  return /\binput\s*\(|\bscanner\b|\breadline\b|\bstdin\b|\bscanf\b|\bcin\b/i.test(code);
}

export default function OutputPanel({ output, isRunning, runBy, onRun, stdin, onStdinChange, code }) {
  const [tab, setTab] = useState('output');
  const [showNudge, setShowNudge] = useState(false);

  const usesInput = codeUsesInput(code);

  // Show nudge when code uses input but stdin is empty and output shows EOFError
  useEffect(() => {
    if (
      output?.stderr &&
      usesInput &&
      !stdin?.trim() &&
      (output.stderr.includes('EOFError') ||
       output.stderr.includes('EOF') ||
       output.stderr.includes('NoSuchElementException') ||
       output.stderr.includes('end of input'))
    ) {
      setShowNudge(true);
    } else {
      setShowNudge(false);
    }
  }, [output, usesInput, stdin]);

  function handleRun() {
    onRun(stdin || '');
    setTab('output');
  }

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <div className={s.tabs}>
          {['output', 'input'].map(t => (
            <button
              key={t}
              className={`${s.tab} ${tab === t ? s.tabOn : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'input'
                ? <>
                    Input
                    {stdin?.trim()
                      ? <span className={s.inputDot} />
                      : usesInput
                        ? <span className={s.inputWarnDot} title="Your code needs input — add it here" />
                        : null
                    }
                  </>
                : 'Output'
              }
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
            {isRunning && <Line pre="›" cls={s.info}>Executing…</Line>}

            {!isRunning && !output && (
              <Line pre="›" cls={s.muted}>Press ▶ Run to execute your code</Line>
            )}

            {/* Nudge banner when EOFError detected */}
            {showNudge && !isRunning && (
              <div className={s.nudge}>
                <span>⚠ Your code calls <code>input()</code> but no input was provided.</span>
                <button
                  className={s.nudgeBtn}
                  onClick={() => { setShowNudge(false); setTab('input'); }}
                >
                  Add Input →
                </button>
              </div>
            )}

            {output && !isRunning && (
              <>
                {output.stdout
                  ? output.stdout.split('\n').map((ln, i) =>
                      <Line key={i} pre="›" cls={s.success}>{ln || ' '}</Line>)
                  : <Line pre="›" cls={s.muted}>(no output)</Line>
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
              Enter stdin for your program — one value per line.<br />
              e.g. for <code>input()</code> in Python, <code>Scanner</code> in Java, <code>cin</code> in C++.
            </div>
            <textarea
              className={s.stdinArea}
              value={stdin}
              onChange={e => onStdinChange(e.target.value)}
              placeholder={'3\nhello\nworld'}
              spellCheck={false}
              autoFocus
            />
            <button
              className={s.runFromInput}
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? '⏳ Running…' : '▶ Run with this input'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ pre, cls, children }) {
  return (
    <div style={{ display:'flex', gap:10, fontFamily:'var(--mono)', fontSize:12, lineHeight:'20px' }}>
      <span style={{ color:'var(--tx3)', flexShrink:0, userSelect:'none' }}>{pre}</span>
      <span className={cls}>{children}</span>
    </div>
  );
}
