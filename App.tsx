
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, Settings, Shield, 
  Globe, Moon, Menu, X, 
  RefreshCw, LogOut, LogIn, Music, VolumeX, Volume2, Gamepad2, Compass, ShieldAlert
} from 'lucide-react';
import { loadSupabaseSDK, createSupabaseClient } from './services/supabase';
import { ADMIN_EMAILS, REGIONS, TOPICS } from './constants';
import { UserProfile, Notification, AppView } from './types';
import { GoogleGenAI, Type } from "@google/genai";

import Logo from './components/Logo';
import ForumView from './components/ForumView';
import GameZoneView from './components/GameZoneView';
import FengShuiZoneView from './components/FengShuiZoneView';
import ProfileView from './components/ProfileView';
import AdminView from './components/AdminView';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DisclaimerView from './components/DisclaimerView';
import TokenInfoView from './components/TokenInfoView';

export default function App() {
  const [supabase, setSupabase] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<AppView>('forum');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [bgMusic, setBgMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const showNotification = useCallback((msg: string, type: 'info' | 'error' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // AI 機械人背景服務 - 24/7 自動尋找新聞、自動總結
  useEffect(() => {
    if (!supabase) return;

    const runBotCycle = async () => {
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      
      const isChineseDefault = region === "中國香港" || region === "台灣";

      try {
        const prompt = `You are an advanced autonomous news robot for HKER Forum. 
        Task: Find a real-time news story for "${region}" and topic "${topic}".
        Constraint: Summarize the news in your OWN WORDS (no verbatim copying).
        Language: ${isChineseDefault ? 'Traditional Chinese (Hong Kong Style)' : 'English'}.
        Formatting: Strictly follow the JSON schema. Provide a small excerpt.
        Metadata: Must include a specific source name and a valid source URL.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                excerpt: { type: Type.STRING },
                source_name: { type: Type.STRING },
                source_url: { type: Type.STRING }
              },
              required: ["headline", "summary", "excerpt", "source_name", "source_url"]
            }
          }
        });

        const text = response.text?.trim() || '{}';
        const data = JSON.parse(text);

        if (data.headline && data.summary) {
          await supabase.from('posts').insert({
            content: `${data.headline}\n\n${data.summary}\n\n重點摘錄：\n${data.excerpt}`,
            region, 
            topic, 
            author_id: '00000000-0000-0000-0000-000000000000', 
            is_bot: true, 
            source_name: data.source_name, 
            source_url: data.source_url
          });
        }
      } catch (err) { 
        console.error("Bot AI Cycle Error:", err); 
      }
    };

    const interval = setInterval(runBotCycle, 20 * 60 * 1000);
    runBotCycle(); 
    return () => clearInterval(interval);
  }, [supabase]);

  const fetchUserProfile = useCallback(async (client: any, userId: string, userEmail: string, metadata: any = {}) => {
    try {
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
      if (data) { setUserProfile(data); } else {
        const newProfileData = { id: userId, email: userEmail, points: 88888, role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user', nickname: metadata.nickname || '新會員', name: metadata.full_name || '', address: metadata.address || '', phone: metadata.phone || '', gender: metadata.gender || '', sol_address: metadata.sol_address || '' };
        const { data: newProfile } = await client.from('profiles').insert([newProfileData]).select().single();
        if (newProfile) setUserProfile(newProfile);
      }
    } catch (e) { console.error("Auth profile sync error:", e); }
  }, []);

  useEffect(() => {
    loadSupabaseSDK().then((sdk) => {
      const client = createSupabaseClient(sdk);
      setSupabase(client);
      client.auth.getSession().then(({ data: { session: currentSession } }: any) => {
        setSession(currentSession);
        if (currentSession) { fetchUserProfile(client, currentSession.user.id, currentSession.user.email, currentSession.user.user_metadata); }
      });
      const { data: { subscription } } = client.auth.onAuthStateChange((event: string, newSession: any) => {
        setSession(newSession);
        if (newSession) { fetchUserProfile(client, newSession.user.id, newSession.user.email, newSession.user.user_metadata); if (event === 'SIGNED_IN') setView('forum'); } 
        else if (event === 'SIGNED_OUT') { setUserProfile(null); setView('forum'); }
      });
      return () => subscription.unsubscribe();
    });
  }, [fetchUserProfile]);

  useEffect(() => {
    if (!supabase || !session?.user?.id) return;
    const channel = supabase.channel(`profile_realtime_${session.user.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` }, (payload: any) => { setUserProfile(payload.new); }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [supabase, session]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    showNotification("已安全退出帳戶");
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    if (!supabase) return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <RefreshCw className="animate-spin text-yellow-500" size={48} />
        <p className="text-slate-400 animate-pulse font-black tracking-widest uppercase text-xs text-center">HKER CLOUD INITIALIZING...</p>
      </div>
    );

    if (!session) {
      if (view === 'register') return <RegisterPage supabase={supabase} setView={setView} showNotification={showNotification} />;
      if (view === 'forum') return <ForumView supabase={supabase} userProfile={null} showNotification={showNotification} onAuthRequired={() => setView('register')} setView={setView} />;
      if (view === 'disclaimer') return <DisclaimerView />;
      if (view === 'token_info') return <TokenInfoView setView={setView} />;
      return <LoginPage supabase={supabase} setView={setView} showNotification={showNotification} />;
    }

    switch (view) {
      case 'forum': return <ForumView supabase={supabase} userProfile={userProfile} showNotification={showNotification} onAuthRequired={() => {}} setView={setView} />;
      case 'game_zone': return <GameZoneView supabase={supabase} userProfile={userProfile} showNotification={showNotification} />;
      case 'fengshui_zone': return <FengShuiZoneView supabase={supabase} userProfile={userProfile} showNotification={showNotification} />;
      case 'profile': return <ProfileView supabase={supabase} userProfile={userProfile} showNotification={showNotification} setView={setView} />;
      case 'admin': return <AdminView supabase={supabase} currentUser={userProfile} showNotification={showNotification} />;
      case 'register': return <RegisterPage supabase={supabase} setView={setView} showNotification={showNotification} />;
      case 'disclaimer': return <DisclaimerView />;
      case 'token_info': return <TokenInfoView setView={setView} />;
      default: return <ForumView supabase={supabase} userProfile={userProfile} showNotification={showNotification} onAuthRequired={() => {}} setView={setView} />;
    }
  };

  return (
    <div className={`min-h-screen ${language === 'en' ? 'font-sans' : 'font-serif'} bg-slate-50 text-slate-900`}>
      <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-2xl border-b border-white/5 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('forum')}>
             <Logo />
          </div>

          <div className="hidden md:flex items-center gap-4 lg:gap-8 overflow-x-auto no-scrollbar">
             <NavTab active={view === 'forum'} icon={<Globe size={18}/>} label="交流論壇" onClick={() => setView('forum')} />
             <NavTab active={view === 'game_zone'} icon={<Gamepad2 size={18}/>} label="娛樂遊戲區" onClick={() => setView('game_zone')} />
             <NavTab active={view === 'fengshui_zone'} icon={<Moon size={18}/>} label="風水算命區" onClick={() => setView('fengshui_zone')} />
             <NavTab active={view === 'disclaimer'} icon={<ShieldAlert size={18}/>} label="免責聲明" onClick={() => setView('disclaimer')} />
             
             <div className="h-6 w-px bg-slate-700 mx-2 hidden lg:block" />
             
             <button onClick={() => setBgMusic(!bgMusic)} className="p-2.5 bg-slate-800 rounded-xl hover:text-yellow-500 transition-all shrink-0">
                {bgMusic ? <Volume2 size={16}/> : <VolumeX size={16}/>}
             </button>

             {userProfile ? (
               <div className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 p-2 rounded-2xl pl-4 cursor-pointer hover:shadow-lg transition-all border border-white/5 group shrink-0" onClick={() => setView('profile')}>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black leading-none group-hover:text-yellow-400 transition-colors">{userProfile.nickname}</p>
                    <p className="text-[10px] text-yellow-500 font-black mt-1 uppercase tracking-tighter">{userProfile.points.toLocaleString()} PT</p>
                  </div>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.id}`} className="w-10 h-10 rounded-xl border-2 border-yellow-500 bg-white" alt="avatar" />
               </div>
             ) : (
               <button onClick={() => setView('forum')} className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-2.5 rounded-full font-black text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 shrink-0">
                 <LogIn size={18}/> 立即登錄
               </button>
             )}
          </div>

          <button className="md:hidden p-2.5 bg-slate-800 rounded-xl active:scale-95 transition-all" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu size={24} /></button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950 z-[60] p-8 flex flex-col gap-6 text-white animate-in slide-in-from-right duration-500 overflow-y-auto">
           <div className="flex justify-between items-center">
              <Logo />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-slate-900 rounded-[2rem] active:scale-90 transition-all"><X size={32}/></button>
           </div>
           <div className="flex flex-col gap-4 text-2xl font-black mt-10">
              <button onClick={() => {setView('forum'); setIsMobileMenuOpen(false)}} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-slate-900/50 active:bg-slate-900 transition-all border border-white/5"><Globe size={32} className="text-yellow-500" /> 交流論壇</button>
              <button onClick={() => {setView('game_zone'); setIsMobileMenuOpen(false)}} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-slate-900/50 active:bg-slate-900 transition-all border border-white/5"><Gamepad2 size={32} className="text-emerald-500" /> 娛樂遊戲區</button>
              <button onClick={() => {setView('fengshui_zone'); setIsMobileMenuOpen(false)}} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-slate-900/50 active:bg-slate-900 transition-all border border-white/5"><Moon size={32} className="text-indigo-400" /> 風水算命區</button>
              <button onClick={() => {setView('disclaimer'); setIsMobileMenuOpen(false)}} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-slate-900/50 active:bg-slate-900 transition-all border border-white/5"><ShieldAlert size={32} className="text-red-500" /> 免責聲明</button>
              <button onClick={() => {setView('profile'); setIsMobileMenuOpen(false)}} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-slate-900/50 active:bg-slate-900 transition-all border border-white/5"><User size={32} className="text-yellow-500" /> 個人帳戶</button>
           </div>
           {userProfile ? (
             <button onClick={handleLogout} className="mt-auto flex items-center justify-center gap-3 p-6 rounded-[2.5rem] bg-red-600 font-black text-xl shadow-2xl active:scale-95 transition-all"><LogOut size={24}/> 退出登錄</button>
           ) : (
             <button onClick={() => {setView('forum'); setIsMobileMenuOpen(false)}} className="mt-auto flex items-center justify-center gap-3 p-6 rounded-[2.5rem] bg-yellow-500 text-black font-black text-xl shadow-2xl active:scale-95 transition-all"><LogIn size={24}/> 會員登錄</button>
           )}
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-10 right-4 left-4 md:left-auto md:w-[450px] z-[100] border-l-[10px] p-6 shadow-2xl rounded-[2rem] animate-in slide-in-from-bottom-10 transition-all ${
          notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-white border-yellow-500 text-slate-900'
        }`}>
          <div className="flex items-center gap-4">
            <RefreshCw className={`animate-spin ${notification.type === 'error' ? 'text-red-500' : 'text-yellow-600'}`} size={20} />
            <p className="font-black text-sm">{notification.msg}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-12">
        {renderContent()}
      </main>
    </div>
  );
}

function NavTab({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 transition-all duration-500 relative py-2 px-1 group shrink-0 ${active ? 'text-yellow-400' : 'text-slate-400 hover:text-white'}`}>
       <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
       <span className="text-xs font-black uppercase tracking-widest hidden lg:block">{label}</span>
       {active && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>}
    </button>
  );
}
