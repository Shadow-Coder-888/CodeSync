// shared/constants.js
const EVENTS = {
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

const LIMITS = {
  MAX_USERS_PER_ROOM:      5,
  ROOM_EXPIRY_MS:          30 * 60 * 1000,
  MAX_CODE_LENGTH:         50000,
  MAX_CHAT_MESSAGE_LENGTH: 500,
  MAX_CHAT_HISTORY:        200,
  RATE_LIMIT_CODE_RUN_MS:  3000,
  RATE_LIMIT_CHAT_MS:      500,
};

// Language metadata — no Judge0 IDs needed anymore
const LANGUAGES = {
  javascript: { name: 'JavaScript', ext: 'js'  },
  python:     { name: 'Python',     ext: 'py'  },
  cpp:        { name: 'C++',        ext: 'cpp' },
  typescript: { name: 'TypeScript', ext: 'ts'  },
  go:         { name: 'Go',         ext: 'go'  },
  java:       { name: 'Java',       ext: 'java'},
  rust:       { name: 'Rust',       ext: 'rs'  },
};

const USER_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#a78bfa'];

module.exports = { EVENTS, LIMITS, LANGUAGES, USER_COLORS };
