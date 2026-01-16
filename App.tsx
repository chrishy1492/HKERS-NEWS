
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, Shield, Search, RefreshCw, Gamepad2, Coins, 
  Globe, Heart, ThumbsUp, Trash2, Settings, X, Share2, 
  AlertTriangle, CreditCard, UserCheck, ChevronRight, 
  Newspaper, Bot, Lock, Calendar, ExternalLink, Zap,
  Activity, Clock, Link as LinkIcon, CheckCircle,
  Menu, Bell, ChevronDown, MoreVertical, LogOut, Edit3, MapPin, Mail, Smartphone,
  Compass, Sparkles, Database
} from 'lucide-react';
import { User, Post, Stat, Topic, Region } from './types';
import * as DataService from './services/dataService';
import * as GeminiService from './services/geminiService';
import { CyberBlackjack, SlotMachine, LittleMary, HooHeyHow, Baccarat, QuantumRoulette } from './components/Games';
import { FortuneTeller } from './components/Fortune';

// --- CONSTANTS ---
const REGIONS: Region[] = ["全部", "中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const TOPICS: Topic[] = ["全部", "地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "宗教", "優惠", "校園", "天氣", "社區活動"];

// --- MAIN APP ---
export default function App() {
  // State: Auth
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // State: Navigation & Views
  const [currentView, setCurrentView] = useState<'feed' | 'games' | 'fortune' | 'profile' | 'admin'>('feed');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  
  // State: Data
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region>("全部");
  const [selectedTopic, setSelectedTopic] = useState<Topic>("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State: Bot & System
  const [botStatus, setBotStatus] = useState<{lastRun: string | null, isRunning: boolean, error: string | null}>({ lastRun: null, isRunning: false, error: null });
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  
  // State: UI
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);

  // --- LOGGING HELPER ---
  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  // --- INIT & SYNC ---

  // 1. Session Persistence Check (Run once on mount)
  useEffect(() => {
    const checkSession = async () => {
      const storedUserId = localStorage.getItem('hker_user_id');
      if (storedUserId) {
        const users = await DataService.getUsers();
        const found = users.find(u => u.id === storedUserId);
        if (found) {
          setUser(found);
          setShowAuthModal(false); // Skip login screen if session valid
          addLog(`Session restored for: ${found.email}`);
        } else {
          localStorage.removeItem('hker_user_id'); // Clean invalid session
        }
      }
    };
    checkSession();
  }, [addLog]);

  const refreshData = useCallback(async () => {
    // 1. Fetch Posts (Cloud First)
    const fetchedPosts = await DataService.getPosts();
    setPosts(fetchedPosts);
    
    // 2. Sync User Data if logged in (Update points/level in background)
    if (user) {
      const users = await DataService.getUsers();
      const updatedUser = users.find(u => u.id === user.id);
      if (updatedUser) {
        // Only update if points or vital info changed to avoid re-renders
        if(updatedUser.points !== user.points || updatedUser.vipLevel !== user.vipLevel) {
           setUser(updatedUser);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    refreshData();
    // Auto-refresh every 30s to keep sync
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // --- BOT AUTOMATION LOGIC ---
  const executeBotTask = useCallback(async (isManual = false) => {
    if (botStatus.isRunning) return;
    
    setBotStatus(prev => ({ ...prev, isRunning: true, error: null }));
    if (isManual) notify('機械人正在搜尋新聞... (Bot Searching)', 'info');
    addLog(isManual ? 'Manual Bot Trigger initiated.' : 'Auto Bot Trigger initiated.');

    try {
      // Pick random parameters
      const r = REGIONS[Math.floor(Math.random() * (REGIONS.length - 1)) + 1];
      const t = TOPICS[Math.floor(Math.random() * (TOPICS.length - 1)) + 1];
      
      addLog(`Bot Target: Region=${r}, Topic=${t}`);

      const newPostData = await GeminiService.generateNewsPost(r, t);
      
      if (newPostData) {
        const fullPost: Post = {
          id: crypto.randomUUID(),
          region: r, // Explicitly set from target
          topic: t,  // Explicitly set from target
          authorId: 'bot-auto-gen', // Mandatory ID
          ...newPostData as any
        };
        
        // Save to DB
        await DataService.savePost(fullPost);
        
        // Update Local State
        setPosts(prev => [fullPost, ...prev]);
        
        const time = new Date().toLocaleTimeString();
        setBotStatus(prev => ({ ...prev, lastRun: time, isRunning: false }));
        addLog(`SUCCESS: Generated article "${fullPost.titleCN}"`);
        
        if (isManual) notify('機械人發貼成功 (Synced to Cloud)', 'success');
      } else {
        throw new Error("Gemini returned no valid news.");
      }
    } catch (e: any) {
      console.error(e);
      setBotStatus(prev => ({ ...prev, isRunning: false, error: e.message || 'Unknown Error' }));
      addLog(`ERROR: ${e.message}`);
      if (isManual) notify('機械人任務失敗 (See Logs)', 'error');
    }
  }, [botStatus.isRunning, addLog]);

  // Client-Side Cron: Run bot every 5 minutes (300,000 ms)
  useEffect(() => {
    const timer = setInterval(() => {
      // Only auto-run if we aren't already running
      executeBotTask(false);
    }, 300000); 
    return () => clearInterval(timer);
  }, [executeBotTask]);

  // --- ACTIONS ---

  const notify = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const allUsers = await DataService.getUsers();

    if (authMode === 'login') {
      const found = allUsers.find(u => u.email === email && u.password === password);
      if (found) {
        setUser(found);
        localStorage.setItem('hker_user_id', found.id); // Save Session
        setShowAuthModal(false);
        notify(`歡迎回來, ${found.name}`, 'success');
        addLog(`User logged in: ${found.email}`);
      } else {
        notify('帳號或密碼錯誤', 'error');
      }
    } else {
      // Register
      if (allUsers.find(u => u.email === email)) {
        notify('此電郵已被註冊', 'error');
        return;
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        password,
        name: (form.elements.namedItem('name') as HTMLInputElement).value || 'HKER Member',
        avatar: '😀',
        points: 8888, // Welcome bonus
        role: DataService.isAdmin(email) ? 'admin' : 'user',
        vipLevel: 1,
        solAddress: (form.elements.namedItem('solAddress') as HTMLInputElement).value || '',
        gender: (form.elements.namedItem('gender') as HTMLSelectElement).value as any || 'O',
        phone: (form.elements.namedItem('phone') as HTMLInputElement).value || '',
        address: (form.elements.namedItem('address') as HTMLInputElement).value || '',
        joinedAt: Date.now()
      };
      
      const success = await DataService.saveUser(newUser);
      if (success) {
        setUser(newUser);
        localStorage.setItem('hker_user_id', newUser.id); // Save Session
        setShowAuthModal(false);
        notify('註冊成功！獲得 8888 HKER 積分', 'success');
        addLog(`New user registered: ${newUser.email}`);
      } else {
        notify('註冊失敗，請檢查網絡', 'error');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hker_user_id'); // Clear Session
    setShowAuthModal(true);
    notify('已安全登出', 'info');
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    const success = await DataService.saveUser(updatedUser);
    if (success) {
      setUser(updatedUser);
      notify('資料已更新', 'success');
    } else {
      notify('更新失敗', 'error');
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!user) return;
    if (amount < 1000000) {
      alert("最少提幣數量為 1,000,000 HKER Token");
      return;
    }
    if (!user.solAddress) {
      alert("請先在帳戶設定中填寫 SOL Address");
      return;
    }
    if (user.points < amount) {
      alert("積分不足");
      return;
    }

    // Deduct points
    const newPoints = await DataService.updatePoints(user.id, amount, 'subtract');
    setUser(prev => prev ? ({ ...prev, points: newPoints }) : null);

    // Simulate Email Logic
    addLog(`Withdrawal Request: ${user.email} - ${amount} HKER`);
    alert(`提幣申請已提交！\n數量: ${amount}\n錢包: ${user.solAddress}\n系統已通知管理員。`);
  };

  // --- INTERACTION LOGIC ---
  const handlePostInteraction = async (postId: string, type: 'like' | 'love') => {
    if (!user) {
      notify("請先登入 (Please Login)", "error");
      return;
    }

    // 1. Optimistic UI Update (Immediate feedback for post)
    setPosts(currentPosts => currentPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: type === 'like' ? p.likes + 1 : p.likes,
          loves: type === 'love' ? p.loves + 1 : p.loves
        };
      }
      return p;
    }));

    // 2. Reward User Logic (150 Points)
    const REWARD_POINTS = 150;
    try {
      // A. Update local state immediately
      const newPoints = (user.points || 0) + REWARD_POINTS;
      setUser(prev => prev ? ({ ...prev, points: newPoints }) : null);
      
      // B. Persist points to DB
      await DataService.updatePoints(user.id, REWARD_POINTS, 'add');
      
      // C. Persist interaction to DB
      await DataService.updatePostInteraction(postId, type);

      notify(`互動成功！獎勵 +${REWARD_POINTS} 積分`, 'success');
    } catch (error) {
      console.error("Interaction/Reward failed", error);
      notify("網絡錯誤，積分未更新", "error");
      // Optional: Revert optimistic updates here if strict consistency is needed
    }
  };

  // --- RENDER HELPERS ---

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchR = selectedRegion === "全部" || p.region === selectedRegion;
      const matchT = selectedTopic === "全部" || p.topic === selectedTopic;
      const matchQ = p.titleCN.includes(searchQuery) || p.contentCN.includes(searchQuery);
      return matchR && matchT && matchQ;
    });
  }, [posts, selectedRegion, selectedTopic, searchQuery]);

  // --- VIEWS ---

  if (showAuthModal) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-blend-multiply">
        <div className="bg-[#1E293B]/90 backdrop-blur-md p-8 rounded-2xl border border-hker-red/50 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="text-center mb-6">
             <h1 className="text-4xl font-black text-white tracking-tighter mb-2"><span className="text-hker-red">HKER</span> NEWS</h1>
             <p className="text-hker-gold font-mono text-xs">WEB3 COMMUNITY PLATFORM</p>
          </div>
          
          <div className="flex bg-black/40 rounded-lg p-1 mb-6">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${authMode==='login' ? 'bg-hker-red text-white' : 'text-slate-400'}`}>登入 Login</button>
            <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${authMode==='register' ? 'bg-hker-gold text-black' : 'text-slate-400'}`}>註冊 Register</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input name="email" type="email" placeholder="Email (電郵)" required className="w-full bg-black/50 border border-slate-600 rounded p-3 text-white outline-none focus:border-hker-gold" />
            <input name="password" type="password" placeholder="Password (密碼)" required className="w-full bg-black/50 border border-slate-600 rounded p-3 text-white outline-none focus:border-hker-gold" />
            
            {authMode === 'register' && (
              <>
                <input name="name" type="text" placeholder="Display Name (暱稱)" required className="w-full bg-black/50 border border-slate-600 rounded p-3 text-white outline-none focus:border-hker-gold" />
                <div className="grid grid-cols-2 gap-2">
                  <select name="gender" className="bg-black/50 border border-slate-600 rounded p-3 text-white outline-none">
                    <option value="M">Male (男)</option>
                    <option value="F">Female (女)</option>
                    <option value="O">Other (其他)</option>
                  </select>
                  <input name="phone" type="tel" placeholder="Phone (電話)" className="bg-black/50 border border-slate-600 rounded p-3 text-white outline-none" />
                </div>
                <input name="address" type="text" placeholder="Address (地址)" className="w-full bg-black/50 border border-slate-600 rounded p-3 text-white outline-none" />
                <input name="solAddress" type="text" placeholder="SOL Wallet Address (可後補)" className="w-full bg-black/50 border border-slate-600 rounded p-3 text-white outline-none" />
              </>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-hker-red to-red-800 text-white font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
              {authMode === 'login' ? 'ENTER PLATFORM' : 'JOIN HKER'}
            </button>
          </form>
          {authMode === 'login' && (
            <div className="text-center mt-4">
               <button onClick={() => { setAuthMode('login'); setShowAuthModal(false); setUser(null); }} className="text-xs text-slate-400 hover:text-white underline">
                 Guest Mode (訪客瀏覽)
               </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // GAME RENDERER
  if (selectedGame) {
    const handleGameBack = () => setSelectedGame(null);
    const handlePoints = async (amt: number) => {
       if (!user) return;
       const newPts = await DataService.updatePoints(user.id, amt, 'add');
       setUser({ ...user, points: newPts });
       notify(amt > 0 ? `贏得 ${amt} 分!` : `扣除 ${Math.abs(amt)} 分`, amt > 0 ? 'success' : 'info');
    };

    return (
      <div className="h-screen bg-[#0B0F19] p-2 md:p-4 flex flex-col">
         {selectedGame === 'blackjack' && <CyberBlackjack user={user!} onUpdatePoints={handlePoints} onBack={handleGameBack} />}
         {selectedGame === 'slots' && <SlotMachine user={user!} onUpdatePoints={handlePoints} onBack={handleGameBack} />}
         {selectedGame === 'littlemary' && <LittleMary user={user!} onUpdatePoints={handlePoints} onBack={handleGameBack} />}
         {selectedGame === 'hooheyhow' && <HooHeyHow user={user!} onUpdatePoints={handlePoints} onBack={handleGameBack} />}
         {selectedGame === 'baccarat' && <Baccarat user={user!} onUpdatePoints={handlePoints} onBack={handleGameBack} />}
         {selectedGame === 'roulette' && <QuantumRoulette user={user!} onUpdatePoints={handlePoints} onBack={handleGameBack} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#1E293B]/95 backdrop-blur border-b border-hker-gold/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('feed')}>
             <div className="w-10 h-10 bg-gradient-to-br from-hker-red to-black rounded-lg flex items-center justify-center border border-hker-gold">
               <Zap className="w-6 h-6 text-hker-gold fill-current" />
             </div>
             <div className="hidden md:block leading-tight">
               <h1 className="font-black text-lg tracking-tight text-white">HKER NEWS</h1>
               <p className="text-[10px] text-hker-gold font-mono">PLATFORM</p>
             </div>
          </div>

          <div className="flex-1 max-w-2xl mx-4 hidden md:flex items-center gap-3">
             <div className="relative flex-1">
               <input 
                 type="text" 
                 placeholder="Search news / topics..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-black/40 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-hker-gold outline-none text-white placeholder-slate-500"
               />
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             </div>
             
             {/* DESKTOP NAV BUTTONS (ADDED FOR VISIBILITY) */}
             <button 
                onClick={() => setCurrentView('games')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'games' ? 'bg-hker-gold text-black' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
             >
                <Gamepad2 className="w-4 h-4" /> 遊戲區 (Games)
             </button>
             <button 
                onClick={() => setCurrentView('fortune')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'fortune' ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
             >
                <Compass className="w-4 h-4" /> 風水算命 (Fortune)
             </button>
          </div>

          <div className="flex items-center gap-3">
             {user ? (
               <>
                 <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white">{user.name}</div>
                    <div className="text-[10px] text-hker-gold font-mono">{user.points.toLocaleString()} PTS</div>
                 </div>
                 <button onClick={() => setCurrentView('profile')} className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600 hover:border-hker-gold">
                    <Settings className="w-5 h-5" />
                 </button>
                 {user.role === 'admin' && (
                   <button onClick={() => setCurrentView('admin')} className="w-9 h-9 bg-red-900/50 rounded-full flex items-center justify-center border border-red-500 hover:bg-red-800">
                      <Shield className="w-5 h-5 text-red-200" />
                   </button>
                 )}
                 <button onClick={handleLogout} className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600">
                    <LogOut className="w-4 h-4" />
                 </button>
               </>
             ) : (
               <button onClick={() => setShowAuthModal(true)} className="bg-hker-red hover:bg-red-600 text-white px-4 py-2 rounded font-bold text-xs">
                 LOGIN
               </button>
             )}
          </div>
        </div>
      </header>

      {/* MOBILE SEARCH & NAV */}
      <div className="md:hidden bg-[#1E293B] border-b border-slate-800 p-2 space-y-2">
         <div className="flex gap-2">
           <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-black/40 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white"
           />
         </div>
         <div className="grid grid-cols-2 gap-2">
           <button onClick={() => setCurrentView('games')} className="px-3 py-2 bg-hker-gold text-black rounded font-bold text-xs flex items-center justify-center gap-1 shadow-lg"><Gamepad2 className="w-3 h-3"/> 遊戲區 GAMES</button>
           <button onClick={() => setCurrentView('fortune')} className="px-3 py-2 bg-purple-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1 shadow-lg"><Compass className="w-3 h-3"/> 風水算命 FATE</button>
         </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
         
         {/* LEFT SIDEBAR (Topics) */}
         <aside className="lg:w-64 space-y-4">
           
           {/* SHORTCUTS (Newly added for visibility) */}
           <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-800 shadow-xl">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-hker-gold"/> 娛樂與服務 (Services)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setCurrentView('games')} 
                    className="bg-slate-800 hover:bg-hker-gold hover:text-black border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center transition-all group"
                  >
                      <Gamepad2 className="w-6 h-6 mb-1 text-hker-gold group-hover:text-black"/>
                      <span className="text-[10px] font-bold">遊戲大廳</span>
                  </button>
                  <button 
                    onClick={() => setCurrentView('fortune')} 
                    className="bg-slate-800 hover:bg-purple-600 hover:text-white border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center transition-all group"
                  >
                      <Compass className="w-6 h-6 mb-1 text-purple-400 group-hover:text-white"/>
                      <span className="text-[10px] font-bold">玄學算命</span>
                  </button>
              </div>
           </div>

           {currentView === 'feed' && (
             <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-800 shadow-xl">
                <h3 className="font-bold text-hker-gold mb-3 flex items-center gap-2"><Globe className="w-4 h-4"/> Regions</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                   {REGIONS.map(r => (
                     <button 
                       key={r} 
                       onClick={() => setSelectedRegion(r)}
                       className={`text-xs px-2 py-1 rounded border transition-colors ${selectedRegion === r ? 'bg-hker-red border-hker-red text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                     >
                       {r}
                     </button>
                   ))}
                </div>
                <h3 className="font-bold text-hker-gold mb-3 flex items-center gap-2"><Newspaper className="w-4 h-4"/> Topics</h3>
                <div className="space-y-1">
                   {TOPICS.map(t => (
                     <button 
                       key={t}
                       onClick={() => setSelectedTopic(t)}
                       className={`w-full text-left text-xs px-3 py-2 rounded transition-colors ${selectedTopic === t ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}
                     >
                       {t}
                     </button>
                   ))}
                </div>
             </div>
           )}

           {/* EXTERNAL LINKS */}
           <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ecosystem</div>
              <a href="https://www.orca.so/pools/6anyfgQ2G9WgeCEh3XBfrzmLLKgb2WVvW5HAsQgb2Bss" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/30 p-2 rounded hover:bg-black/50 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-xs">O</div>
                 <div className="text-xs">
                    <div className="font-bold text-white">Orca Pool</div>
                    <div className="text-slate-500">Liquidity</div>
                 </div>
              </a>
              <a href="https://raydium.io/liquidity-pools/?token=B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/30 p-2 rounded hover:bg-black/50 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center text-purple-400 font-bold text-xs">R</div>
                 <div className="text-xs">
                    <div className="font-bold text-white">Raydium</div>
                    <div className="text-slate-500">Staking</div>
                 </div>
              </a>
              <a href="https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/30 p-2 rounded hover:bg-black/50 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center text-green-400 font-bold text-xs">J</div>
                 <div className="text-xs">
                    <div className="font-bold text-white">Jupiter</div>
                    <div className="text-slate-500">Trade HKER</div>
                 </div>
              </a>
           </div>
         </aside>

         {/* CENTER CONTENT */}
         <div className="flex-1 min-h-[500px]">
            
            {/* VIEW: FEED */}
            {currentView === 'feed' && (
               <div className="space-y-4 animate-in fade-in duration-500">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-[#1E293B] rounded-2xl border border-slate-800">
                       <Bot className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                       <p>機械人正在搜尋新聞... (Bot Searching)</p>
                       <p className="text-xs mt-2 text-slate-600">系統每 5 分鐘會自動抓取最新新聞</p>
                       {user?.role === 'admin' && (
                         <button onClick={() => executeBotTask(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-500">
                           {botStatus.isRunning ? 'Running...' : '手動觸發 (Manual Trigger)'}
                         </button>
                       )}
                    </div>
                  ) : (
                    filteredPosts.map(post => (
                      <NewsCard key={post.id} post={post} user={user} onInteraction={handlePostInteraction} />
                    ))
                  )}
               </div>
            )}

            {/* VIEW: GAMES */}
            {currentView === 'games' && (
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in duration-300">
                  <GameCard id="blackjack" name="Cyber 21" icon={<Zap/>} bg="from-indigo-900 to-black" onSelect={setSelectedGame} />
                  <GameCard id="slots" name="AI Slots" icon={<Coins/>} bg="from-yellow-900 to-black" onSelect={setSelectedGame} />
                  <GameCard id="baccarat" name="AI Baccarat" icon={<CreditCard/>} bg="from-green-900 to-black" onSelect={setSelectedGame} />
                  <GameCard id="roulette" name="Quantum Roulette" icon={<Activity/>} bg="from-cyan-900 to-black" onSelect={setSelectedGame} />
                  <GameCard id="littlemary" name="Little Mary" icon={<Gamepad2/>} bg="from-red-900 to-black" onSelect={setSelectedGame} />
                  <GameCard id="hooheyhow" name="Hoo Hey How" icon={<CheckCircle/>} bg="from-orange-900 to-black" onSelect={setSelectedGame} />
               </div>
            )}

            {/* VIEW: FORTUNE */}
            {currentView === 'fortune' && <FortuneTeller />}

            {/* VIEW: PROFILE */}
            {currentView === 'profile' && user && (
               <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-800 animate-in slide-in-from-right duration-300">
                  <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><UserCheck className="w-6 h-6 text-hker-gold"/> ACCOUNT SETTINGS</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="bg-black/30 p-4 rounded-lg">
                           <label className="text-xs text-slate-500 font-bold uppercase">Display Name</label>
                           <input type="text" defaultValue={user.name} onBlur={(e) => handleUpdateProfile({name: e.target.value})} className="w-full bg-transparent border-b border-slate-600 py-2 outline-none text-white focus:border-hker-gold"/>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg">
                           <label className="text-xs text-slate-500 font-bold uppercase">Email (Login ID)</label>
                           <input type="email" defaultValue={user.email} disabled className="w-full bg-transparent border-b border-slate-700 py-2 outline-none text-slate-400 cursor-not-allowed"/>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg">
                           <label className="text-xs text-slate-500 font-bold uppercase">Password</label>
                           <input type="password" placeholder="New Password" onBlur={(e) => { if(e.target.value) handleUpdateProfile({password: e.target.value}) }} className="w-full bg-transparent border-b border-slate-600 py-2 outline-none text-white focus:border-hker-gold"/>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg">
                           <label className="text-xs text-slate-500 font-bold uppercase">Phone</label>
                           <input type="tel" defaultValue={user.phone} onBlur={(e) => handleUpdateProfile({phone: e.target.value})} className="w-full bg-transparent border-b border-slate-600 py-2 outline-none text-white focus:border-hker-gold"/>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg">
                           <label className="text-xs text-slate-500 font-bold uppercase">Address</label>
                           <input type="text" defaultValue={user.address} onBlur={(e) => handleUpdateProfile({address: e.target.value})} className="w-full bg-transparent border-b border-slate-600 py-2 outline-none text-white focus:border-hker-gold"/>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-gradient-to-br from-hker-red to-black p-6 rounded-xl border border-hker-red/50 relative overflow-hidden">
                           <Coins className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                           <div className="relative z-10">
                              <div className="text-xs font-bold text-red-200 mb-2">HKER BALANCE</div>
                              <div className="text-4xl font-mono font-black text-white mb-4">{user.points.toLocaleString()}</div>
                              <div className="flex gap-2">
                                 <input id="withdrawAmt" type="number" placeholder="Amount (Min 1M)" className="flex-1 bg-black/40 border border-white/20 rounded px-3 text-sm text-white"/>
                                 <button 
                                   onClick={() => {
                                      const el = document.getElementById('withdrawAmt') as HTMLInputElement;
                                      handleWithdraw(Number(el.value));
                                   }}
                                   className="bg-white text-hker-red font-bold px-4 rounded hover:bg-slate-200"
                                 >
                                   WITHDRAW
                                 </button>
                              </div>
                              <p className="text-[10px] text-red-200 mt-2">* 1 HKER Point = 1 HKER Token</p>
                           </div>
                        </div>

                        <div className="bg-black/30 p-4 rounded-lg border border-yellow-500/30">
                           <label className="text-xs text-yellow-500 font-bold uppercase flex items-center gap-2"><CreditCard className="w-3 h-3"/> SOL Wallet Address</label>
                           <input type="text" defaultValue={user.solAddress} onBlur={(e) => handleUpdateProfile({solAddress: e.target.value})} className="w-full bg-transparent border-b border-yellow-500/50 py-2 outline-none text-white font-mono text-sm focus:border-yellow-400 placeholder-slate-600" placeholder="Enter SOL Address for withdrawal"/>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* VIEW: ADMIN */}
            {currentView === 'admin' && user?.role === 'admin' && (
               <AdminConsole 
                 posts={posts} 
                 onDeletePost={async (id) => { await DataService.deletePost(id); setPosts(p => p.filter(x => x.id !== id)); }}
                 executeBotTask={executeBotTask}
                 botStatus={botStatus}
                 systemLogs={systemLogs}
               />
            )}

         </div>
      </main>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-[60] px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : notification.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 'bg-blue-900/90 border-blue-500 text-blue-100'}`}>
           {notification.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
           <span className="font-bold text-sm">{notification.msg}</span>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

const NewsCard: React.FC<{ post: Post; user: User | null; onInteraction: (id: string, type: 'like'|'love') => void }> = ({ post, user, onInteraction }) => {
  const [lang, setLang] = useState<'CN'|'EN'>('CN');

  const copyLink = () => {
    navigator.clipboard.writeText(post.sourceUrl || window.location.href);
    alert("Link Copied!");
  };

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-600 transition-all">
       <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-2xl border border-slate-700">{post.authorAvatar}</div>
             <div>
                <div className="font-bold text-blue-400 text-sm flex items-center gap-1">
                   {post.authorName} <Bot className="w-3 h-3" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                   {new Date(post.timestamp).toLocaleString()} • {post.region}
                </div>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setLang(l => l === 'CN' ? 'EN' : 'CN')} className="text-[10px] font-bold border border-slate-600 px-2 py-1 rounded text-slate-400 hover:text-white hover:border-white transition-colors">
                {lang === 'CN' ? 'Translate EN' : '翻譯中文'}
             </button>
          </div>
       </div>

       <h3 className="text-lg font-bold text-white mb-2 leading-tight">
          {lang === 'CN' ? post.titleCN : post.titleEN}
       </h3>
       
       <div className="bg-black/20 p-3 rounded-lg border-l-2 border-hker-red mb-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            {lang === 'CN' ? post.contentCN : post.contentEN}
          </p>
          {post.sourceUrl && (
            <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="block mt-2 text-[10px] text-blue-400 hover:underline flex items-center gap-1">
               Source: {post.sourceName || 'News Link'} <ExternalLink className="w-3 h-3"/>
            </a>
          )}
       </div>

       <div className="flex items-center gap-4 pt-2 border-t border-slate-800/50">
          <button onClick={() => onInteraction(post.id, 'like')} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-500 transition-colors active:scale-110">
             <ThumbsUp className="w-4 h-4"/> {post.likes}
          </button>
          <button onClick={() => onInteraction(post.id, 'love')} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-pink-500 transition-colors active:scale-110">
             <Heart className="w-4 h-4"/> {post.loves}
          </button>
          <button onClick={copyLink} className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-white transition-colors">
             <Share2 className="w-4 h-4"/> Share
          </button>
       </div>
    </div>
  );
};

const GameCard = ({ id, name, icon, bg, onSelect }: any) => (
  <button onClick={() => onSelect(id)} className={`relative h-32 rounded-xl overflow-hidden group border border-slate-700 hover:border-hker-gold transition-all shadow-lg`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
       <div className="text-white mb-2 group-hover:scale-110 transition-transform">{icon}</div>
       <div className="font-black text-white uppercase text-sm tracking-wider">{name}</div>
    </div>
  </button>
);

const AdminConsole = ({ posts, onDeletePost, executeBotTask, botStatus, systemLogs }: any) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stat | null>(null);

  useEffect(() => {
     DataService.getUsers().then(setUsers);
     DataService.getStats().then(setStats);
  }, []);

  const handleEditPoints = async (uid: string, newPts: number) => {
     await DataService.updatePoints(uid, newPts, 'set');
     const updated = await DataService.getUsers();
     setUsers(updated);
  };

  return (
     <div className="space-y-6">
        {/* BOT DIAGNOSTICS */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Bot className="w-32 h-32 text-blue-500"/></div>
           <div className="flex justify-between items-center mb-6 relative z-10">
             <div>
               <h3 className="text-lg font-bold text-white flex items-center gap-2"><Bot className="text-blue-400 w-5 h-5"/> 機械人運行診斷 (Bot Diagnostics)</h3>
               <p className="text-xs text-slate-500 mt-1">
                 Cron Job Interval: 5 mins | Status: 
                 <span className={`ml-1 font-bold ${botStatus.isRunning ? "text-green-400 animate-pulse" : "text-slate-400"}`}>
                   {botStatus.isRunning ? "RUNNING..." : "IDLE"}
                 </span>
               </p>
             </div>
             <button 
               onClick={() => executeBotTask(true)}
               disabled={botStatus.isRunning}
               className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
             >
               <Zap className="w-4 h-4 fill-current"/> 立即執行抓取 (Run Now)
             </button>
           </div>

           <div className="grid grid-cols-3 gap-4 relative z-10">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Last Run</div>
                <div className="text-sm font-mono text-white flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-500"/> {botStatus.lastRun || "Never"}
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Generated Posts</div>
                <div className="text-sm font-mono text-yellow-500 flex items-center gap-2">
                  <Newspaper className="w-3 h-3 text-slate-500"/> {posts.filter((p: any) => p.isBot).length}
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">API Status</div>
                <div className="text-sm font-mono text-green-400 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-slate-500"/> {botStatus.error ? 'Error' : 'Healthy'}
                </div>
              </div>
           </div>
           
           {/* LOGS */}
           <div className="mt-4 bg-black/40 rounded-xl p-3 h-32 overflow-y-auto font-mono text-[10px] text-slate-400 border border-slate-800 relative z-10">
              {systemLogs.length === 0 && <div className="text-slate-600 italic">No logs available...</div>}
              {systemLogs.map((log: string, i: number) => (
                <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">{log}</div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
              <div className="text-xs text-blue-400 font-bold uppercase">Total Users</div>
              <div className="text-2xl font-black text-white">{stats?.totalUsers || 0}</div>
           </div>
           <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/30">
              <div className="text-xs text-green-400 font-bold uppercase">Today Registers</div>
              <div className="text-2xl font-black text-white">{stats?.todayRegisters || 0}</div>
           </div>
           <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30">
              <div className="text-xs text-purple-400 font-bold uppercase">Today Visits</div>
              <div className="text-2xl font-black text-white">{stats?.todayVisits || 0}</div>
           </div>
           <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-500/30">
              <div className="text-xs text-orange-400 font-bold uppercase flex items-center gap-2">Online Users</div>
              <div className="text-2xl font-black text-white">{stats?.onlineUsers || 1}</div>
           </div>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden">
           <div className="p-4 bg-black/20 border-b border-slate-800 font-bold text-white flex justify-between items-center">
              <span className="flex items-center gap-2"><Database className="w-4 h-4 text-slate-400"/> USER DATABASE</span>
              <span className="text-xs text-slate-500 font-mono">Total: {users.length}</span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-400">
               <thead className="text-xs text-slate-500 uppercase bg-black/40">
                 <tr>
                   <th className="px-4 py-3">User</th>
                   <th className="px-4 py-3">Email</th>
                   <th className="px-4 py-3">Points</th>
                   <th className="px-4 py-3">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                     <td className="px-4 py-3 font-bold text-white">{u.name}</td>
                     <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                     <td className="px-4 py-3">
                        <input 
                          type="number" 
                          defaultValue={u.points} 
                          onBlur={(e) => handleEditPoints(u.id, Number(e.target.value))}
                          className="bg-black/30 w-24 px-2 py-1 rounded border border-slate-600 text-white focus:border-hker-gold outline-none"
                        />
                     </td>
                     <td className="px-4 py-3">
                        <button onClick={async () => {
                           if(confirm('Delete user?')) {
                             await DataService.deleteUser(u.id);
                             setUsers(p => p.filter(x => x.id !== u.id));
                           }
                        }} className="text-red-500 hover:text-white"><Trash2 className="w-4 h-4"/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
        
        <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden">
           <div className="p-4 bg-black/20 border-b border-slate-800 font-bold text-white">POST MANAGEMENT</div>
           <div className="p-4 space-y-2">
              {posts.map((p: Post) => (
                <div key={p.id} className="flex justify-between items-center bg-black/20 p-2 rounded hover:bg-black/40">
                   <div className="truncate flex-1 pr-4">
                      <span className="text-xs font-mono text-slate-500 mr-2">[{new Date(p.timestamp).toLocaleDateString()}]</span>
                      <span className="text-sm text-white font-bold">{p.titleCN}</span>
                   </div>
                   <button onClick={() => onDeletePost(p.id)} className="p-1 text-red-500 hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
           </div>
        </div>
     </div>
  );
};
