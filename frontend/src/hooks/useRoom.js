// src/hooks/useRoom.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const EV = {
  ROOM_JOIN:        'room:join',
  ROOM_STATE:       'room:state',
  ROOM_USER_JOINED: 'room:user_joined',
  ROOM_USER_LEFT:   'room:user_left',
  ROOM_ERROR:       'room:error',
  CODE_CHANGE:      'code:change',
  CODE_SYNC:        'code:sync',
  CURSOR_MOVE:      'cursor:move',
  CURSOR_UPDATE:    'cursor:update',
  CHAT_MESSAGE:     'chat:message',
  LANG_CHANGE:      'lang:change',
  REPLAY_SNAPSHOT:  'replay:snapshot',
  REPLAY_REQUEST:   'replay:request',
  REPLAY_DATA:      'replay:data',
  CODE_RUNNING:     'code:running',
  CODE_RUN:         'code:run',
};

export function useRoom(roomId, username, userId) {
  const socketRef   = useRef(null);
  const codeRef     = useRef('');
  const snapTimerRef = useRef(null);

  const [connected,  setConnected]  = useState(false);
  const [joined,     setJoined]     = useState(false);
  const [error,      setError]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [currentUser,setCurrentUser]= useState(null);
  const [code,       setCode]       = useState('');
  const [language,   setLanguage]   = useState('javascript');
  const [messages,   setMessages]   = useState([]);   // starts empty — real only
  const [cursors,    setCursors]    = useState({});
  const [output,     setOutput]     = useState(null);
  const [isRunning,  setIsRunning]  = useState(false);
  const [runBy,      setRunBy]      = useState(null);
  const [snapshots,  setSnapshots]  = useState([]);

  useEffect(() => {
    if (!roomId || !username) return;

    const socket = io(BACKEND, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      withCredentials: false,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      socket.emit(EV.ROOM_JOIN, { roomId, username, createIfMissing: true, userId });
    });

    socket.on('disconnect', () => setConnected(false));

    // Full room state — code could already exist if others are in the room
    socket.on(EV.ROOM_STATE, state => {
      codeRef.current = state.code || '';
      setCode(state.code || '');
      setLanguage(state.language || 'javascript');
      setUsers(state.users || []);
      setMessages(state.chatHistory || []);   // real history only
      setJoined(true);
      const me = state.users.find(u => u.username === username);
      if (me) setCurrentUser(me);
    });

    socket.on(EV.ROOM_USER_JOINED, ({ user, users: us }) => {
      setUsers(us);
      if (user.username === username && !currentUser) setCurrentUser(user);
    });

    socket.on(EV.ROOM_USER_LEFT, ({ users: us }) => {
      setUsers(us);
      setCursors(prev => {
        const next = { ...prev };
        const alive = new Set(us.map(u => u.id));
        Object.keys(next).forEach(id => { if (!alive.has(id)) delete next[id]; });
        return next;
      });
    });

    socket.on(EV.ROOM_ERROR, ({ message }) => { setError(message); setJoined(false); });

    socket.on(EV.CODE_SYNC, ({ code: c }) => {
      codeRef.current = c;
      setCode(c);
    });

    socket.on(EV.LANG_CHANGE, ({ language: l }) => setLanguage(l));

    socket.on(EV.CURSOR_UPDATE, ({ userId: uid, username: uname, color, position }) => {
      setCursors(prev => ({ ...prev, [uid]: { username: uname, color, position } }));
    });

    // Only real messages from real users
    socket.on(EV.CHAT_MESSAGE, msg => setMessages(prev => [...prev, msg]));

    socket.on(EV.CODE_RUNNING, ({ triggeredBy }) => {
      setIsRunning(true);
      setRunBy(triggeredBy);
      setOutput(null);
    });

    socket.on(EV.REPLAY_DATA, ({ snapshots: snaps }) => setSnapshots(snaps));

    // Periodic snapshot for replay
    snapTimerRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit(EV.REPLAY_SNAPSHOT, { roomId, code: codeRef.current });
      }
    }, 5000);

    return () => {
      clearInterval(snapTimerRef.current);
      socket.disconnect();
    };
  }, [roomId, username]);

  const emitCode = useCallback(val => {
    codeRef.current = val;
    setCode(val);
    socketRef.current?.emit(EV.CODE_CHANGE, { roomId, code: val });
  }, [roomId]);

  const emitLang = useCallback(lang => {
    setLanguage(lang);
    socketRef.current?.emit(EV.LANG_CHANGE, { roomId, language: lang });
  }, [roomId]);

  const emitCursor = useCallback(pos => {
    socketRef.current?.emit(EV.CURSOR_MOVE, { roomId, position: pos });
  }, [roomId]);

  const sendMessage = useCallback(text => {
    if (text?.trim()) socketRef.current?.emit(EV.CHAT_MESSAGE, { roomId, text });
  }, [roomId]);

  const requestReplay = useCallback(() => {
    socketRef.current?.emit(EV.REPLAY_REQUEST, { roomId });
  }, [roomId]);

  // Real execution — posts code to backend which calls Judge0
  const runCode = useCallback(async () => {
    if (isRunning) return;
    socketRef.current?.emit(EV.CODE_RUN, { roomId });
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await axios.post(`${BACKEND}/api/execute`, {
        code: codeRef.current,
        language,
      });
      const d = res.data;
      setOutput({
        stdout:   d.stdout  || '',
        stderr:   d.stderr  || '',
        status:   d.status?.description || 'Done',
        statusId: d.status?.id,
        time:     d.time,
        memory:   d.memory,
        success:  d.success ?? (!d.stderr && !!d.stdout),
      });
    } catch (err) {
      setOutput({
        stdout: '',
        stderr: err.response?.data?.error || err.message || 'Execution failed.',
        status: 'Error',
        statusId: 0,
        success: false,
      });
    } finally {
      setIsRunning(false);
      setRunBy(null);
    }
  }, [language, roomId, isRunning]);

  return {
    connected, joined, error,
    users, currentUser,
    code, emitCode,
    language, emitLang,
    messages, sendMessage,
    cursors, emitCursor,
    output, isRunning, runBy, runCode,
    snapshots, requestReplay,
  };
}
