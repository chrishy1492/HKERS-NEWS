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
import { Newspaper, Gamepad2, Sparkles, UserCog, RefreshCw } from 'lucide-react';

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
      if (session) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (data) {
         setUserProfile(data as UserProfile);
         subscribeToProfile(userId);
      } else {
         // Self-healing: Create profile if missing
         console.log("Profile missing, attempting creation...");
         const newProfile = {
            id: userId,
            email: email || 'user@hker.news',
            full_name: 'HKER User',
            role: 'user',
            hker_token: 8888,
            created_at: new Date().toISOString()
         };
         const { error: createError } = await supabase.from('profiles').upsert([newProfile]);
         if (!createError) {
            setUserProfile(newProfile as UserProfile);
            subscribeToProfile(userId);
         } else {
            console.error("Failed to create profile:", createError);
         }
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
    setLoading(false);
  };

  const subscribeToProfile = (userId: string) => {
    supabase.channel('profile_update')
      .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
         (payload) => setUserProfile(payload.new as UserProfile)
      ).subscribe();
  };

  const handleUpdatePoints = async (amount: number) => {
    if (!userProfile) return;
    const newTotal = (userProfile.hker_token || 0) + amount;
    const { error } = await supabase.from('profiles').update({ hker_token: newTotal }).eq('id', userProfile.id);
    if (error) console.error("Point sync failed", error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSidebarOpen(false);
    setUserProfile(null);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      <div className="text-xl font-bold text-gray-500 animate-pulse">Loading HKER News Platform...</div>
    </div>
  );

  if (!session) return <AuthModal onAuthSuccess={() => {}} />;

  // Fallback if profile is still missing after self-healing attempts
  if (!userProfile && !loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
           <h2 className="text-2xl font-bold text-red-600">Account Sync Error</h2>
           <p className="text-slate-500">We couldn't load your profile data. This might be a network issue or first-time setup delay.</p>
           <button onClick={() => window.location.reload()} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
             <RefreshCw size={20} /> Retry
           </button>
           <button onClick={handleLogout} className="text-sm text-slate-400 underline">Logout</button>
        </div>
      </div>
    );
  }

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
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-0">
          {userProfile && (
            <>
              {currentView === 'news' && <NewsFeed userProfile={userProfile} updatePoints={handleUpdatePoints} />}
              {currentView === 'games' && <GameCenter userProfile={userProfile} updatePoints={handleUpdatePoints} />}
              {currentView === 'fortune' && <Fortune />}
              {currentView === 'profile' && <Profile userProfile={userProfile} refreshProfile={() => fetchProfile(userProfile.id, userProfile.email)} updatePoints={handleUpdatePoints} />}
              {currentView === 'admin' && <AdminDashboard userProfile={userProfile} />}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 flex justify-around py-3 px-4 z-50 safe-area-pb">
          <button onClick={() => setCurrentView('news')} className={`flex flex-col items-center gap-1 ${currentView === 'news' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <Newspaper size={20} />
            <span className="text-[10px] font-bold">News</span>
          </button>
          <button onClick={() => setCurrentView('games')} className={`flex flex-col items-center gap-1 ${currentView === 'games' ? 'text-purple-500 scale-110' : 'text-slate-400'}`}>
            <Gamepad2 size={20} />
            <span className="text-[10px] font-bold">Games</span>
          </button>
          <button onClick={() => setCurrentView('fortune')} className={`flex flex-col items-center gap-1 ${currentView === 'fortune' ? 'text-yellow-500 scale-110' : 'text-slate-400'}`}>
            <Sparkles size={20} />
            <span className="text-[10px] font-bold">Fortune</span>
          </button>
           <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 ${currentView === 'profile' ? 'text-gray-600 scale-110' : 'text-slate-400'}`}>
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