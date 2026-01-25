import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplitScreen from './pages/SplitScreen';
import TokenPage from './pages/TokenPage';
import { PlatformLayout } from './pages/Platform/PlatformLayout';
import { NewsFeed } from './pages/Platform/NewsFeed';
import { Games } from './pages/Platform/Games';
import { Admin } from './pages/Platform/Admin';
import { Auth } from './pages/Platform/Auth';
import { Profile } from './pages/Platform/Profile';
import { Fortune } from './pages/Platform/Fortune';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SplitScreen />} />
        
        {/* Left Side */}
        <Route path="/token" element={<TokenPage />} />
        
        {/* Right Side */}
        <Route path="/platform" element={<PlatformLayout />}>
          <Route index element={<NewsFeed />} />
          <Route path="games" element={<Games />} />
          <Route path="fortune" element={<Fortune />} />
          <Route path="admin" element={<Admin />} />
          <Route path="login" element={<Auth />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;