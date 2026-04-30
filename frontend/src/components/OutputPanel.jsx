// src/components/OutputPanel.jsx — Interactive terminal
import React, { useState, useEffect, useRef } from 'react';
import s from './OutputPanel.module.css';

export default function OutputPanel({ termLines, termRunning, onRun, onSendInput, onKill }) {
  const [inputVal, setInputVal]   = useState('');
  const [history,  setHistory]    = useState([]); // input history
  const [histIdx,  setHistIdx]    = useState(-1);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [termLines]);

  // Focus input when terminal is running
  useEffect(() => {
    if (termRunning) inputRef.current?.focus();
  }, [termRunning]);

  function sendInput() {
    const val = inputVal;
    setHistory(h => [val, ...h].slice(0, 50));
    setHistIdx(-1);
    setInputVal('');
    onSendInput(val + '\n');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInputVal(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInputVal(idx === -1 ? '' : history[idx] ?? '');
    } else if (e.key === 'c' && e.ctrlKey) {
      onKill();
    }
  }

  const isEmpty = termLines.length === 0 && !termRunning;

  return (
    <div className={s.terminal} onClick={() => inputRef.current?.focus()}>

      {/* Header bar */}
      <div className={s.termHeader}>
        <div className={s.termDots}>
          <span className={s.dot} style={{ background:'#ef4444' }} />
          <span className={s.dot} style={{ background:'#f59e0b' }} />
          <span className={s.dot} style={{ background:'#10b981' }} />
        </div>
        <span className={s.termTitle}>Terminal</span>
        <div className={s.termActions}>
          {termRunning
            ? <button className={s.killBtn} onClick={e => { e.stopPropagation(); onKill(); }} title="Stop (Ctrl+C)">■ Stop</button>
            : <button className={s.runBtn2} onClick={e => { e.stopPropagation(); onRun(); }} title="Run">▶ Run</button>
          }
        </div>
      </div>

      {/* Output area */}
      <div className={s.termBody}>
        {isEmpty && (
          <span className={s.termHint}>Press <kbd>▶ Run</kbd> to execute your code</span>
        )}

        {termLines.map((line, i) => (
          <span
            key={i}
            className={line.isMeta ? s.metaLine : line.isErr ? s.errLine : s.outLine}
          >
            {line.text}
          </span>
        ))}

        {/* Live input line — shown when process is running */}
        {termRunning && (
          <div className={s.inputLine}>
            <span className={s.prompt}>▶</span>
            <input
              ref={inputRef}
              className={s.termInput}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
              placeholder="type input and press Enter…"
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
