
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isAdmin } from './supabase';
import { Profile, Post } from './types';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NewsList from './components/NewsList';
import TokenInterface from './components/TokenInterface';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import FortuneTelling from './components/FortuneTelling';
import { RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'news' | 'token'>('landing');
  const [subView, setSubView] = useState<'news' | 'games' | 'fortune' | 'account'>('news');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRegion, setSelectedRegion] = useState('中國香港');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('profile-realtime')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${profile.id}` 
      }, (payload) => {
        setProfile(payload.new as Profile);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const handleSidebarNavigate = (v: 'news' | 'games' | 'fortune' | 'account') => {
    if (v === 'account') {
      setShowProfile(true);
    } else if (v === 'games' || v === 'fortune' || v === 'news') {
      setSubView(v);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="animate-spin mb-4" size={48} />
        <p className="text-blue-400 font-bold tracking-widest uppercase">HKER News Platform Loading...</p>
      </div>
    );
  }

  if (view === 'landing') {
    return <LandingPage onSelect={setView} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header 
        user={user}
        profile={profile}
        onAuthClick={() => setShowAuth(true)}
        onProfileClick={() => setShowProfile(true)}
        onAdminClick={() => setShowAdmin(true)}
        onLogoClick={() => setView('landing')}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAdminUser={isAdmin(user?.email)}
      />

      <div className="flex flex-1">
        {view === 'news' && (
          <Sidebar onNavigate={handleSidebarNavigate} activeView={subView} />
        )}

        <main className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
          {view === 'news' ? (
            <>
              {subView === 'news' && (
                <NewsList 
                  region={selectedRegion} 
                  category={selectedCategory} 
                  search={searchQuery}
                  profile={profile}
                  supabase={supabase}
                />
              )}
              {subView === 'fortune' && <FortuneTelling profile={profile} supabase={supabase} onUpdate={() => fetchProfile(user?.id)} />}
              {subView === 'games' && (
                <TokenInterface 
                  profile={profile}
                  supabase={supabase}
                  onUpdateProfile={() => fetchProfile(user.id)}
                  defaultTab="games"
                />
              )}
            </>
          ) : (
            <TokenInterface 
              profile={profile}
              supabase={supabase}
              onUpdateProfile={() => fetchProfile(user.id)}
            />
          )}
        </main>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} supabase={supabase} />
      {profile && (
        <ProfileModal 
          isOpen={showProfile} 
          profile={profile} 
          onClose={() => setShowProfile(false)} 
          supabase={supabase}
          onUpdate={() => fetchProfile(user.id)}
        />
      )}
      {isAdmin(user?.email) && (
        <AdminPanel 
          isOpen={showAdmin} 
          onClose={() => setShowAdmin(false)} 
          currentUser={user}
          supabase={supabase}
        />
      )}
    </div>
  );
};

export default App;
