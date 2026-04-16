// src/components/EditorPanel.jsx
import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import s from './EditorPanel.module.css';

const MONO_LANG = { javascript:'javascript', python:'python', cpp:'cpp', typescript:'typescript', go:'go', java:'java', rust:'rust' };
const TAB_NAME  = { javascript:'main.js', python:'main.py', cpp:'main.cpp', typescript:'main.ts', go:'main.go', java:'Main.java', rust:'main.rs' };

export default function EditorPanel({ code, language, onChange, onCursorChange, remoteCursors, readOnly, theme }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decoRef   = useRef([]);

  function onMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidChangeCursorPosition(e => {
      if (onCursorChange) onCursorChange(e.position);
    });
  }

  // Draw remote cursors as decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const newDecos = Object.entries(remoteCursors || {}).map(([, cur]) => ({
      range: new monaco.Range(cur.position.lineNumber, cur.position.column, cur.position.lineNumber, cur.position.column),
      options: {
        className: s.remoteCursorBlob,
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        hoverMessage: { value: `**${cur.username}**` },
        zIndex: 5,
      },
    }));
    decoRef.current = editor.deltaDecorations(decoRef.current, newDecos);
  }, [remoteCursors]);

  return (
    <div className={s.wrap}>
      <div className={s.tabBar}>
        <div className={s.tab}>
          <span className={s.tabDot} style={{ background: 'var(--acc)' }} />
          {TAB_NAME[language] || 'main.js'}
        </div>
        {readOnly && <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>⏮ Replay mode</span>}
      </div>
      <div className={s.editorWrap}>
        <Editor
          height="100%"
          language={MONO_LANG[language] || 'javascript'}
          value={code}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onChange={val => onChange && onChange(val ?? '')}
          onMount={onMount}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            fontLigatures: true,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            readOnly: readOnly || !onChange,
            padding: { top: 14, bottom: 14 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            renderLineHighlight: 'gutter',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
          }}
        />
      </div>
    </div>
  );
}
