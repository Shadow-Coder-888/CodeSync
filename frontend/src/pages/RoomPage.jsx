// src/pages/RoomPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom }  from '../hooks/useRoom.js';
import { useTheme } from '../hooks/useTheme.jsx';
import { useAuth }  from '../hooks/useAuth.jsx';
import TopBar       from '../components/TopBar.jsx';
import EditorPanel  from '../components/EditorPanel.jsx';
import OutputPanel  from '../components/OutputPanel.jsx';
import UsersPanel   from '../components/UsersPanel.jsx';
import ChatPanel    from '../components/ChatPanel.jsx';
import ReplayPanel  from '../components/ReplayPanel.jsx';
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

  const [panel,        setPanel]       = useState('users');
  const [replayOn,     setReplayOn]    = useState(false);
  const [replayIdx,    setReplayIdx]   = useState(0);
  const [replayPlay,   setReplayPlay]  = useState(false);
  const [cursorPos,    setCursorPos]   = useState({ line: 1, col: 1 });
  const [showSave,     setShowSave]    = useState(false);
  const rpTimer = useRef(null);

  // Replay playback
  useEffect(() => {
    if (replayPlay && room.snapshots.length > 0) {
      rpTimer.current = setInterval(() => {
        setReplayIdx(i => {
          if (i >= room.snapshots.length - 1) {
            setReplayPlay(false);
            clearInterval(rpTimer.current);
            return i;
          }
          return i + 1;
        });
      }, 200);
    }
    return () => clearInterval(rpTimer.current);
  }, [replayPlay, room.snapshots.length]);

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

  const displayCode = replayOn && room.snapshots.length > 0
    ? (room.snapshots[replayIdx]?.code ?? '')
    : room.code;

  return (
    <div className={s.layout}>
      <TopBar
        roomId={roomId}
        language={room.language}
        onLangChange={room.emitLang}
        onRun={room.runCode}
        isRunning={room.isRunning}
        users={room.users}
        currentUser={room.currentUser}
        connected={room.connected}
        onStartReplay={() => { room.requestReplay(); setReplayOn(true); setReplayIdx(0); setReplayPlay(false); }}
        replayOn={replayOn}
        onSave={user ? () => setShowSave(true) : null}
        theme={theme}
      />

      <div className={s.body}>
        <div className={s.sidebar}>
          {[['users','👥'],['chat','💬'],['replay','⏮']].map(([id, ic]) => (
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
            code={displayCode}
            language={room.language}
            onChange={replayOn ? undefined : room.emitCode}
            onCursorChange={pos => { setCursorPos({ line: pos.lineNumber, col: pos.column }); room.emitCursor(pos); }}
            remoteCursors={room.cursors}
            readOnly={replayOn}
            theme={theme}
          />

          {replayOn && (
            <div className={s.replayScrubber}>
              <button className={s.rpPlay} onClick={() => setReplayPlay(p => !p)}>
                {replayPlay ? '⏸' : '▶'}
              </button>
              <input
                type="range" min={0} step={1}
                max={Math.max(0, room.snapshots.length - 1)}
                value={replayIdx}
                onChange={e => { setReplayIdx(+e.target.value); setReplayPlay(false); }}
                className={s.rpSlider}
              />
              <span className={s.rpCount}>
                {replayIdx + 1} / {room.snapshots.length || 1}
              </span>
              <button className={s.rpExit} onClick={() => { setReplayOn(false); setReplayPlay(false); }}>
                ✕ Exit replay
              </button>
            </div>
          )}

          <OutputPanel output={room.output} isRunning={room.isRunning} runBy={room.runBy} />
        </div>

        <div className={s.rightPanel}>
          {panel === 'users'  && <UsersPanel  users={room.users} currentUser={room.currentUser} roomId={roomId} />}
          {panel === 'chat'   && <ChatPanel   messages={room.messages} currentUser={room.currentUser} onSend={room.sendMessage} />}
          {panel === 'replay' && <ReplayPanel snapshots={room.snapshots} onRequest={room.requestReplay} onStart={() => { room.requestReplay(); setReplayOn(true); setReplayIdx(0); setReplayPlay(false); setPanel('users'); }} inReplay={replayOn} />}
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
