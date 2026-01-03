import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { LandingPage } from './components/LandingPage';
import { TokenPage } from './components/TokenPage';
import { ForumPage } from './components/ForumPage';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  return (
    <DataProvider>
      <div className="font-sans antialiased text-gray-900 bg-gray-100 min-h-screen">
        {currentView === 'landing' && <LandingPage onSelect={setCurrentView} />}
        {currentView === 'token' && <TokenPage onBack={() => setCurrentView('landing')} />}
        {currentView === 'forum' && <ForumPage onBack={() => setCurrentView('landing')} />}
      </div>
    </DataProvider>
  );
};

export default App;
