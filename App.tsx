import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import NewsFeed from './components/NewsFeed';
import GameCenter from './components/GameCenter';
import Fortune from './components/Fortune';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import DisclaimerModal from './components/DisclaimerModal';
import HKERInfoModal from './components/HKERInfoModal';
import { UserProfile, ViewState } from './types';
import { Menu, Newspaper, Gamepad2, Sparkles, UserCog } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('news');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showHKERInfo, setShowHKERInfo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
       setUserProfile(data as UserProfile);
       // Setup Realtime
       supabase.channel('profile_update')
         .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
            (payload) => setUserProfile(payload.new as UserProfile)
         ).subscribe();
    }
    setLoading(false);
  };

  const handleUpdatePoints = async (amount: number) => {
    if (!userProfile) return;
    const newTotal = userProfile.hker_token + amount;
    // Direct DB update ensures synchronization across mobile/web immediately
    const { error } = await supabase.from('profiles').update({ hker_token: newTotal }).eq('id', userProfile.id);
    if (error) console.error("Point sync failed", error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSidebarOpen(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-100"><div className="text-xl font-bold text-gray-500 animate-pulse">Loading HKER News...</div></div>;

  if (!session) return <AuthModal onAuthSuccess={() => {}} />;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar 
        userProfile={userProfile} 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenDisclaimer={() => setShowDisclaimer(true)}
        onOpenInfo={() => setShowHKERInfo(true)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-0">
          {userProfile && (
            <>
              {currentView === 'news' && <NewsFeed userProfile={userProfile} updatePoints={handleUpdatePoints} />}
              {currentView === 'games' && <GameCenter userProfile={userProfile} updatePoints={handleUpdatePoints} />}
              {currentView === 'fortune' && <Fortune />}
              {currentView === 'profile' && <Profile userProfile={userProfile} refreshProfile={() => fetchProfile(userProfile.id)} updatePoints={handleUpdatePoints} />}
              {currentView === 'admin' && <AdminDashboard userProfile={userProfile} />}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around py-3 px-4 z-50">
          <button onClick={() => setCurrentView('news')} className={`flex flex-col items-center gap-1 ${currentView === 'news' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Newspaper size={20} />
            <span className="text-[10px] font-bold">News</span>
          </button>
          <button onClick={() => setCurrentView('games')} className={`flex flex-col items-center gap-1 ${currentView === 'games' ? 'text-purple-500' : 'text-slate-400'}`}>
            <Gamepad2 size={20} />
            <span className="text-[10px] font-bold">Games</span>
          </button>
          <button onClick={() => setCurrentView('fortune')} className={`flex flex-col items-center gap-1 ${currentView === 'fortune' ? 'text-yellow-500' : 'text-slate-400'}`}>
            <Sparkles size={20} />
            <span className="text-[10px] font-bold">Fortune</span>
          </button>
           <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 ${currentView === 'profile' ? 'text-gray-600' : 'text-slate-400'}`}>
            <UserCog size={20} />
            <span className="text-[10px] font-bold">Me</span>
          </button>
        </div>
      </div>

      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}
      {showHKERInfo && <HKERInfoModal onClose={() => setShowHKERInfo(false)} />}
    </div>
  );
}

export default App;