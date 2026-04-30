// src/pages/RoomPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom }  from '../hooks/useRoom.js';
import { useTheme } from '../hooks/useTheme.jsx';
import { useAuth }  from '../hooks/useAuth.jsx';
import TopBar       from '../components/TopBar.jsx';
import EditorPanel  from '../components/EditorPanel.jsx';
import OutputPanel  from '../components/OutputPanel.jsx';
import UsersPanel   from '../components/UsersPanel.jsx';
import ChatPanel    from '../components/ChatPanel.jsx';
import StatusBar    from '../components/StatusBar.jsx';
import SaveModal    from '../components/SaveModal.jsx';
import s from './RoomPage.module.css';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const { theme }  = useTheme();
  const { user }   = useAuth();

  const username = sessionStorage.getItem('cs-name') || user?.username || null;

  useEffect(() => {
    if (!username) navigate('/');
  }, [username, navigate]);

  const room = useRoom(roomId, username, user?.id);

  const [panel,      setPanel]    = useState('users');
  const [cursorPos,  setCursorPos]= useState({ line: 1, col: 1 });
  const [showSave,   setShowSave] = useState(false);

  if (!username) return null;

  if (room.error && !room.joined) {
    return (
      <div className={s.centerPage}>
        <div className={s.errCard}>
          <div className={s.errIcon}>⚠</div>
          <h2>Cannot join room</h2>
          <p>{room.error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>← Back to lobby</button>
        </div>
      </div>
    );
  }

  if (!room.joined) {
    return (
      <div className={s.centerPage}>
        <span className={`spinner spinner-dark`} style={{ width: 28, height: 28, borderWidth: 3 }} />
        <p style={{ marginTop: 14, color: 'var(--tx3)', fontSize: 13 }}>
          {room.connected ? `Joining room ${roomId}…` : 'Connecting…'}
        </p>
      </div>
    );
  }

  return (
    <div className={s.layout}>
      <TopBar
        roomId={roomId}
        language={room.language}
        onLangChange={room.emitLang}
        onRun={room.startTerm}
        isRunning={room.isRunning}
        users={room.users}
        currentUser={room.currentUser}
        connected={room.connected}
        onSave={user ? () => setShowSave(true) : null}
        theme={theme}
      />

      <div className={s.body}>
        <div className={s.sidebar}>
          {[['users','👥'],['chat','💬'],['files','📁']].map(([id, ic]) => (
            <button
              key={id}
              className={`${s.sbBtn} ${panel === id ? s.sbOn : ''}`}
              onClick={() => setPanel(id)}
              title={id.charAt(0).toUpperCase() + id.slice(1)}
            >{ic}</button>
          ))}
        </div>

        <div className={s.editorCol}>
          <EditorPanel
            code={room.code}
            language={room.language}
            onChange={room.emitCode}
            onCursorChange={pos => setCursorPos({ line: pos.lineNumber, col: pos.column })}
            remoteCursors={room.cursors}
            theme={theme}
          />
          <OutputPanel
            termLines={room.termLines}
            termRunning={room.termRunning}
            onRun={room.startTerm}
            onSendInput={room.sendTermInput}
            onKill={room.killTerm}
          />
        </div>

        <div className={s.rightPanel}>
          {panel === 'users' && <UsersPanel users={room.users} currentUser={room.currentUser} roomId={roomId} />}
          {panel === 'chat'  && <ChatPanel  messages={room.messages} currentUser={room.currentUser} onSend={room.sendMessage} />}
          {panel === 'files' && <FilePanel  language={room.language} code={room.code} />}
        </div>
      </div>

      <StatusBar connected={room.connected} language={room.language} cursorPos={cursorPos} userCount={room.users.length} />

      {showSave && (
        <SaveModal
          code={room.code}
          language={room.language}
          onClose={() => setShowSave(false)}
        />
      )}
    </div>
  );
}

// ── Inline FilePanel component ─────────────────────────────────────────────
const EXT_MAP = {
  javascript: 'js', typescript: 'ts', python: 'py',
  cpp: 'cpp', java: 'java',
};

function FilePanel({ language, code }) {
  const [files,    setFiles]    = useState([]);
  const [fileName, setFileName] = useState('');
  const [err,      setErr]      = useState('');
  const [saved,    setSaved]    = useState(null);

  const ext = EXT_MAP[language] || 'txt';

  function addFile() {
    const name = fileName.trim();
    if (!name) { setErr('Please enter a file name.'); return; }
    const fullName = name.includes('.') ? name : `${name}.${ext}`;
    if (files.find(f => f.name === fullName)) { setErr(`"${fullName}" already exists.`); return; }
    const newFile = { name: fullName, code, language, savedAt: new Date().toLocaleTimeString() };
    setFiles(prev => [newFile, ...prev]);
    setFileName('');
    setErr('');
    setSaved(fullName);
    setTimeout(() => setSaved(null), 2000);
  }

  function downloadFile(file) {
    const blob = new Blob([file.code], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'12px', gap:'10px', overflowY:'auto' }}>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--tx1)', borderBottom:'1px solid var(--bd)', paddingBottom:8 }}>
        📁 File Manager
      </div>

      {/* Save current code as a file */}
      <div style={{ background:'var(--s2)', borderRadius:8, padding:'10px', border:'1px solid var(--bd)' }}>
        <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Save current code</div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <input
            style={{
              flex:1, background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:6,
              padding:'5px 8px', fontSize:12, color:'var(--tx1)', outline:'none',
            }}
            placeholder={`filename.${ext}`}
            value={fileName}
            onChange={e => { setFileName(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && addFile()}
            maxLength={60}
          />
          <button
            onClick={addFile}
            style={{
              background:'var(--acc)', color:'#fff', border:'none', borderRadius:6,
              padding:'5px 12px', fontSize:12, cursor:'pointer', whiteSpace:'nowrap',
            }}
          >
            + Save
          </button>
        </div>
        {err && <p style={{ color:'#f87171', fontSize:11, marginTop:5, margin:'5px 0 0' }}>{err}</p>}
        {saved && <p style={{ color:'#10b981', fontSize:11, marginTop:5, margin:'5px 0 0' }}>✓ Saved as "{saved}"</p>}
        <div style={{ fontSize:11, color:'var(--tx3)', marginTop:5 }}>
          Auto-extension: <code style={{ background:'var(--s1)', padding:'1px 5px', borderRadius:3 }}>.{ext}</code> added if no extension given
        </div>
      </div>

      {/* Files list */}
      <div style={{ fontSize:11, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
        Saved files ({files.length})
      </div>

      {files.length === 0 ? (
        <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'20px 0' }}>
          No files saved yet.<br/>Write code and save it above.
        </div>
      ) : (
        files.map(f => (
          <div key={f.name} style={{
            background:'var(--s2)', borderRadius:8, padding:'9px 10px',
            border:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ fontSize:14 }}>
              {f.name.endsWith('.py') ? '🐍' : f.name.endsWith('.js') || f.name.endsWith('.ts') ? '🟨' : f.name.endsWith('.java') ? '☕' : f.name.endsWith('.cpp') ? '⚙️' : '📄'}
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--tx1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
              <div style={{ fontSize:11, color:'var(--tx3)' }}>{f.code.split('\n').length} lines · {f.savedAt}</div>
            </div>
            <button
              onClick={() => downloadFile(f)}
              title="Download file"
              style={{ background:'none', border:'1px solid var(--bd)', borderRadius:5, padding:'3px 7px', fontSize:11, cursor:'pointer', color:'var(--tx2)' }}
            >⬇</button>
            <button
              onClick={() => removeFile(f.name)}
              title="Remove"
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', fontSize:13, padding:'2px 4px' }}
            >✕</button>
          </div>
        ))
      )}
    </div>
  );
}
