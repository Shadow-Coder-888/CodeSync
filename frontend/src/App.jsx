// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { AuthProvider }  from './hooks/useAuth.jsx';
import LobbyPage  from './pages/LobbyPage.jsx';
import RoomPage   from './pages/RoomPage.jsx';
import AuthPage   from './pages/AuthPage.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/"            element={<LobbyPage />} />
          <Route path="/auth"        element={<AuthPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
