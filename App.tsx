import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, RefreshCw, Gamepad2, Coins, Globe, Heart, ThumbsUp, Trash2, 
  Settings, Menu, X, Share2, AlertTriangle, CreditCard, Shield, Bot, Languages, ChevronRight,
  Mountain, Lock, Calendar, ExternalLink, UserCheck, Dice5, Trophy, Zap, Disc, FileText
} from 'lucide-react';
import { User, Post, Stat, Region, Topic } from './types';
import * as DataService from './services/dataService';
import * as GeminiService from './services/geminiService';
import { SlotMachine, Baccarat, HooHeyHow, LittleMary, CyberBlackjack, QuantumRoulette } from './components/Games';
import { FortuneTeller } from './components/Fortune';

const AVATARS = ["🦁", "🐼", "🐨", "🦊", "🐱", "🐶", "🐹", "🐰", "🐻", "🐯", "🤠", "🤖", "👽", "👻", "👺", "🤡", "💀", "💩", "👩‍🚀", "👨‍🚒", "🧟‍♀️", "🧛‍♂️", "🧚‍♀️", "🧜‍♂️", "🧞‍♀️", "🦹‍♂️", "🦸‍♀️", "🧙‍♂️"];
const REGIONS: Region[] = ["全部", "中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const TOPICS: Topic[] = ["全部", "地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "宗教", "優惠", "校園", "天氣", "社區活動"];
const VIP_LEVELS = [
  { level: 1, req: 100000, label: '1星會員 ⭐' },
  { level: 2, req: 300000, label: '2星會員 ⭐⭐' },
  { level: 3, req: 700000, label: '3星會員 ⭐⭐⭐' },
  { level: 4, req: 1500000, label: '4星會員 ⭐⭐⭐⭐' },
  { level: 5, req: 5000000, label: '5星會員 ⭐⭐⭐⭐⭐' }
];

// Custom Lion Rock Logo Component
const HkerLogo = () => (
  <div className="relative w-12 h-12 flex items-center justify-center cursor-pointer">
     <div className="absolute inset-0 bg-hker-red rounded-full border-2 border-hker-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]"></div>
     <svg viewBox="0 0 100 100" className="w-full h-full p-1 relative z-10">
        <path d="M10 60 C 20 40, 40 20, 50 40 S 80 30, 90 60" fill="none" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" />
        <text x="50" y="80" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace" letterSpacing="-2">HKER</text>
     </svg>
  </div>
);

export default function App() {
  // Global State
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [stats, setStats] = useState<Stat>({ onlineUsers: 0, newRegisters: 0, totalVisits: 0, botLastRun: 0 });
  
  // UI State
  const [view, setView] = useState<'forum' | 'game' | 'wallet' | 'profile' | 'admin' | 'fortune'>('forum');
  const [showLogin, setShowLogin] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, boolean>>({});

  // Filters
  const [selectedRegion, setSelectedRegion] = useState<Region>("全部");
  const [selectedTopic, setSelectedTopic] = useState<Topic>("全部");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync Data
  const loadData = useCallback(async () => {
    const p = await DataService.getPosts();
    const u = await DataService.getUsers();
    const s = await DataService.getStats();
    setPosts(p);
    setUsersList(u);
    setStats(s);
    
    // Sync current user if logged in
    if (user) {
      const updatedUser = u.find(x => x.id === user.id);
      if (updatedUser) setUser(updatedUser);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Helpers
  const handleNotify = (msg: string, type: 'success' | 'error' | 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleTranslation = (postId: string) => {
    setTranslatedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Interactions (Like/Love) with Anti-Spam
  const handleInteraction = async (postId: string, type: 'like' | 'love') => {
    if (!user) return handleNotify('請先登入 Please Login', 'error');

    // Initialize interactions if missing
    const currentUserInteractions = user.interactions || {};
    const postInteractions = currentUserInteractions[postId] || { like: 0, love: 0 };

    // Check limit (Max 3)
    if (postInteractions[type] >= 3) {
      return handleNotify(`每個貼文最多只能給 3 次${type === 'like' ? '讚' : '心'}！ Limit Reached!`, 'error');
    }

    // Update Local State Optimistically
    const updatedPostInteractions = { ...postInteractions, [type]: postInteractions[type] + 1 };
    const updatedUserInteractions = { ...currentUserInteractions, [postId]: updatedPostInteractions };
    
    // Award Points (+150)
    const updatedUser = { 
      ...user, 
      points: user.points + 150,
      interactions: updatedUserInteractions
    };

    // Update Global State
    await DataService.saveUser(updatedUser);
    await DataService.updatePostInteraction(postId, type);
    
    setUser(updatedUser);
    // handleNotify(`+150 積分! (${updatedPostInteractions[type]}/3)`, 'success');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const allUsers = await DataService.getUsers();
    const found = allUsers.find(u => u.email === email && u.password === password);
    
    if (found) {
      setUser(found);
      setShowLogin(false);
      handleNotify('登入成功 Login Success', 'success');
      DataService.updateStats({ onlineUsers: stats.onlineUsers + 1 });
    } else {
      handleNotify('帳號或密碼錯誤 Invalid Credentials', 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email as string,
      password: data.password as string,
      name: data.name as string,
      avatar: data.avatar as string || AVATARS[0],
      points: 8888, // Welcome Bonus
      role: 'user',
      vipLevel: 1,
      solAddress: data.solAddress as string || '',
      gender: data.gender as string,
      joinedAt: Date.now(),
      phone: data.phone as string,
      address: data.address as string,
      interactions: {}
    };

    if (['chrishy1494@gmail.com', 'hkerstoken@gmail.com', 'niceleung@gmail.com'].includes(newUser.email)) {
      newUser.role = 'admin';
      newUser.vipLevel = 5;
    }

    await DataService.saveUser(newUser);
    setUser(newUser);
    setShowRegister(false);
    setShowLogin(false);
    DataService.updateStats({ newRegisters: stats.newRegisters + 1, onlineUsers: stats.onlineUsers + 1 });
    handleNotify('註冊成功！獲得 8888 HKER 積分！', 'success');
  };

  const handleWithdraw = async (amount: number, address: string) => {
    if (!user) return;
    if (amount < 1000000) return handleNotify('最少提幣數量為 1,000,000 HKER', 'error');
    if (!address) return handleNotify('請提供 SOL 地址', 'error');
    if (user.points < amount) return handleNotify('積分不足', 'error');

    const updatedUser = { ...user, points: user.points - amount };
    await DataService.saveUser(updatedUser);
    
    console.log(`[EMAIL SENT] To: hkerstoken@gmail.com | Subj: Withdrawal | User: ${user.email} | Amt: ${amount} | SOL: ${address}`);
    handleNotify('申請已提交，管理員已收到通知 Request Sent', 'success');
  };

  const handleBotRun = async () => {
    if (user?.role !== 'admin') return;
    handleNotify('AI 機械人正在搜尋真實新聞... (Gemini)', 'info');
    
    const now = Date.now();
    
    // Randomize Region/Topic
    const r = REGIONS.filter(x => x !== '全部')[Math.floor(Math.random() * 7)];
    const t = TOPICS.filter(x => x !== '全部')[Math.floor(Math.random() * 12)];

    const newPost = await GeminiService.generateNewsPost(r, t);
    
    if (newPost) {
        const fullPost: Post = {
            id: `post-bot-${Date.now()}`,
            authorId: 'bot-gemini',
            authorName: 'HKER Bot 🤖',
            authorAvatar: '🤖',
            region: r,
            topic: t,
            titleCN: newPost.titleCN || '',
            titleEN: newPost.titleEN || '',
            contentCN: newPost.contentCN || '',
            contentEN: newPost.contentEN || '',
            sourceUrl: newPost.sourceUrl,
            sourceName: new URL(newPost.sourceUrl || 'https://google.com').hostname,
            timestamp: Date.now(),
            likes: 0,
            loves: 0,
            isBot: true
        };
        await DataService.savePost(fullPost);
        DataService.updateStats({ botLastRun: now });
        handleNotify('AI 發貼成功！ Bot Posted', 'success');
    } else {
        handleNotify('AI 發貼失敗 (Check API Key)', 'error');
    }
  };

  const filteredPosts = posts.filter(p => {
      const matchRegion = selectedRegion === '全部' || p.region === selectedRegion;
      const matchTopic = selectedTopic === '全部' || p.topic === selectedTopic;
      const matchSearch = !searchQuery || 
        p.titleCN.includes(searchQuery) || 
        p.titleEN.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchTopic && matchSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-hker-dark text-slate-100 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0F172A] border-b-4 border-hker-red shadow-[0_4px_20px_rgba(208,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3" onClick={() => setView('forum')}>
            <HkerLogo />
            <div className="cursor-pointer">
               <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                 <span className="text-hker-red">HKER</span> 
                 <span className="text-white">News</span>
               </h1>
               <div className="text-[10px] text-hker-gold tracking-widest uppercase font-bold">Lion Rock Spirit Web3</div>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
            <input 
               type="text" 
               placeholder="搜尋 / Search topics..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full bg-black/40 border-2 border-slate-700 rounded-lg py-2 px-10 text-sm focus:border-hker-gold focus:outline-none transition-all placeholder-slate-500 text-white"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-hker-gold" />
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setLang(prev => prev === 'zh' ? 'en' : 'zh')} className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700">
                <Globe className="w-5 h-5 text-hker-gold" />
             </button>
             
             {user ? (
                 <div className="flex items-center gap-3 bg-slate-800/50 py-1 px-3 rounded-full border border-slate-700">
                    <div className="hidden md:block text-right">
                        <div className="text-sm font-bold text-hker-gold">{user.points.toLocaleString()} HKER</div>
                        <div className="text-[10px] text-slate-400">{user.name}</div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 rounded-full bg-hker-red border-2 border-hker-gold flex items-center justify-center text-xl overflow-hidden hover:scale-110 transition-transform shadow-lg">
                        {user.avatar}
                    </button>
                 </div>
             ) : (
                 <button onClick={() => setShowLogin(true)} className="bg-hker-red hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_10px_rgba(208,0,0,0.5)] border border-red-500 uppercase tracking-wide">
                    Login / 登入
                 </button>
             )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && user && (
            <div className="absolute top-full right-0 w-64 bg-[#1a1a1a] border-l-2 border-b-2 border-hker-red shadow-2xl p-2 flex flex-col gap-1 z-50">
                <button onClick={() => { setView('profile'); setMobileMenuOpen(false); }} className="text-left p-3 hover:bg-slate-800 rounded text-sm font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-hker-gold"/> Profile</button>
                <button onClick={() => { setView('wallet'); setMobileMenuOpen(false); }} className="text-left p-3 hover:bg-slate-800 rounded text-sm font-bold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-hker-gold"/> Wallet</button>
                {user.role === 'admin' && (
                    <button onClick={() => { setView('admin'); setMobileMenuOpen(false); }} className="text-left p-3 hover:bg-slate-800 rounded text-sm font-bold text-hker-gold flex items-center gap-2"><Shield className="w-4 h-4"/> Admin</button>
                )}
                <div className="h-px bg-slate-700 my-1"></div>
                <button onClick={() => { setUser(null); setMobileMenuOpen(false); }} className="text-left p-3 hover:bg-red-900/30 rounded text-sm font-bold text-red-400 flex items-center gap-2">Logout</button>
            </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Background Decorative */}
        <div className="fixed bottom-0 left-0 right-0 h-64 bg-lion-rock opacity-20 pointer-events-none z-0 clip-path-mountain"></div>

        {/* LEFT COLUMN (Forum/News) */}
        <div className={`lg:col-span-8 space-y-6 relative z-10 ${view !== 'forum' ? 'hidden lg:block' : ''}`}>
           
           {/* Filters */}
           <div className="bg-hker-night border-l-4 border-hker-gold rounded-r-lg p-5 shadow-lg">
              <div className="flex flex-wrap gap-2 mb-4">
                 <span className="text-[10px] font-black text-hker-gold uppercase tracking-widest w-full mb-1">Region / 地區</span>
                 {REGIONS.map(r => (
                     <button key={r} onClick={() => setSelectedRegion(r)} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide transform transition-all skew-x-[-10deg] ${selectedRegion === r ? 'bg-hker-red text-white shadow-[0_0_10px_rgba(208,0,0,0.6)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                        <span className="skew-x-[10deg] inline-block">{r}</span>
                     </button>
                 ))}
              </div>
              <div className="flex flex-wrap gap-2">
                 <span className="text-[10px] font-black text-hker-gold uppercase tracking-widest w-full mb-1">Topic / 主題</span>
                 {TOPICS.map(t => (
                     <button key={t} onClick={() => setSelectedTopic(t)} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide transform transition-all skew-x-[-10deg] ${selectedTopic === t ? 'bg-hker-gold text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                        <span className="skew-x-[10deg] inline-block">{t}</span>
                     </button>
                 ))}
              </div>
              
              {/* Disclaimer Button */}
              <button 
                onClick={() => setShowDisclaimer(true)}
                className="mt-4 text-xs flex items-center gap-1 text-slate-500 hover:text-hker-gold transition-colors font-bold"
              >
                <FileText className="w-3 h-3" /> 免責聲明 (Disclaimer)
              </button>
           </div>
           
           {/* Mobile Quick Nav */}
           <div className="lg:hidden grid grid-cols-2 gap-3">
              <button onClick={() => setView('game')} className="bg-gradient-to-r from-blue-900 to-black border border-blue-500/50 p-4 rounded-lg flex items-center justify-center gap-2 font-bold text-white shadow-lg">
                  <Gamepad2 className="text-hker-gold" /> Game Zone
              </button>
              <button onClick={() => setView('wallet')} className="bg-gradient-to-r from-red-900 to-black border border-red-500/50 p-4 rounded-lg flex items-center justify-center gap-2 font-bold text-white shadow-lg">
                  <Coins className="text-hker-gold" /> Wallet
              </button>
           </div>

           {/* News Feed */}
           <div className="space-y-4">
              {filteredPosts.map(post => {
                  // Translation Logic
                  const isLocal = ['中國香港', '台灣'].includes(post.region);
                  const defaultLang = isLocal ? 'cn' : 'en';
                  // If manually translated, use that, else use default logic based on region
                  const showEnglish = translatedPosts[post.id] !== undefined ? translatedPosts[post.id] : (defaultLang === 'en');
                  const displayTitle = showEnglish ? post.titleEN : post.titleCN;
                  const displayContent = showEnglish ? post.contentEN : post.contentCN;

                  return (
                  <div key={post.id} className="group bg-hker-night rounded-lg p-6 border border-slate-700 hover:border-hker-gold transition-all shadow-md relative overflow-hidden">
                      {/* Bot Badge */}
                      {post.isBot && (
                          <div className="absolute top-0 right-0 bg-purple-900/80 text-purple-200 text-[10px] px-3 py-1 rounded-bl-lg font-bold border-b border-l border-purple-500/30 flex items-center gap-1 z-20">
                              <Bot className="w-3 h-3" /> BOT POST
                          </div>
                      )}

                      <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600 group-hover:border-hker-gold transition-colors text-2xl shadow-inner">
                                {post.authorAvatar}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-lg text-white group-hover:text-hker-gold transition-colors">{post.authorName}</span>
                                    {post.authorName.includes('Admin') && <Shield className="w-4 h-4 text-hker-red" />}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(post.timestamp).toLocaleString()}</span>
                                    <span className="text-hker-red">|</span> 
                                    <span>{post.region}</span>
                                </div>
                             </div>
                          </div>
                          {user?.role === 'admin' && (
                              <button onClick={() => DataService.deletePost(post.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                          )}
                      </div>

                      <h2 className="text-xl font-bold text-white mb-3 group-hover:text-hker-gold transition-colors">{displayTitle}</h2>
                      <p className="text-slate-300 leading-relaxed text-sm mb-5 border-l-2 border-slate-700 pl-4 group-hover:border-hker-red transition-colors whitespace-pre-line">{displayContent}</p>
                      
                      <div className="flex items-center justify-between mb-5 text-xs">
                          {post.sourceUrl && (
                              <div className="flex items-center gap-1 font-mono text-slate-500">
                                  <ExternalLink className="w-3 h-3" /> 
                                  <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-hker-red underline">
                                      Source: {post.sourceName || 'Link'}
                                  </a>
                              </div>
                          )}
                          {post.isBot && (
                              <button 
                                onClick={() => toggleTranslation(post.id)}
                                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2 py-1 rounded text-white transition-colors"
                              >
                                  <Globe className="w-3 h-3 text-hker-gold" />
                                  {showEnglish ? '翻譯為中文 / CN' : 'Translate to EN'}
                              </button>
                          )}
                      </div>

                      <div className="flex items-center gap-4 border-t border-slate-800 pt-4 relative z-10">
                          <button onClick={() => handleInteraction(post.id, 'like')} className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-blue-900/30 text-slate-400 hover:text-blue-400 text-xs font-bold transition-colors">
                              <ThumbsUp className="w-3 h-3" /> Like {post.likes}
                          </button>
                          <button onClick={() => handleInteraction(post.id, 'love')} className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-pink-900/30 text-slate-400 hover:text-pink-400 text-xs font-bold transition-colors">
                              <Heart className="w-3 h-3" /> Love {post.loves}
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(window.location.href); handleNotify('Link Copied', 'info'); }} className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-green-900/30 text-slate-400 hover:text-green-400 text-xs font-bold transition-colors ml-auto">
                              <Share2 className="w-3 h-3" /> Share
                          </button>
                          {post.isBot && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold ml-2 cursor-not-allowed">
                                  <Lock className="w-3 h-3" /> Comments Locked
                              </div>
                          )}
                      </div>
                  </div>
              )})}
              
              {filteredPosts.length === 0 && (
                  <div className="text-center py-24 text-slate-600 bg-hker-night/50 rounded-lg border-2 border-dashed border-slate-800">
                      <Mountain className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="font-bold">No posts found / 暫無文章</p>
                  </div>
              )}
           </div>
        </div>

        {/* RIGHT COLUMN (Sidebar / Games / Profile) */}
        <div className={`lg:col-span-4 space-y-6 relative z-10 ${view === 'forum' ? 'hidden lg:block' : ''}`}>
           
           {/* Mobile Back Button */}
           <div className="lg:hidden mb-4">
               <button onClick={() => setView('forum')} className="w-full bg-slate-800 py-3 rounded-lg flex items-center justify-center gap-2 text-white font-bold border border-slate-700">
                   <ChevronRight className="rotate-180 w-5 h-5" /> Back to News
               </button>
           </div>

           {/* Token Stats Card - Coin Style */}
           <div className="relative">
              <div className="bg-coin-gradient w-full aspect-square max-h-80 mx-auto rounded-full shadow-[0_0_30px_rgba(208,0,0,0.4)] border-4 border-[#B00000] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden group">
                  <div className="absolute inset-2 rounded-full border border-white/20"></div>
                  <div className="absolute inset-4 rounded-full border border-white/10"></div>
                  <Mountain className="absolute bottom-0 w-64 h-32 text-black/10 group-hover:scale-110 transition-transform duration-700" />

                  <h3 className="font-black text-2xl text-hker-gold drop-shadow-md mb-1 relative z-10">HKER COIN</h3>
                  <p className="text-white/80 text-[10px] font-mono mb-4 relative z-10">ERC-20 / SOL SPL</p>
                  
                  <div className="relative z-10 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 mb-4">
                      <div className="text-[10px] text-white/60 uppercase tracking-widest">Balance</div>
                      <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                          {user ? user.points.toLocaleString() : '---'}
                      </div>
                  </div>
                  
                  {user && (
                      <div className="text-[10px] text-hker-gold font-bold relative z-10 mb-2 bg-black/30 px-2 py-1 rounded">
                         {VIP_LEVELS.find(l => user.points < l.req)?.label || '5星會員 ⭐⭐⭐⭐⭐'}
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 w-full px-4 relative z-10">
                       <a href="https://www.orca.so" target="_blank" className="bg-hker-gold/20 hover:bg-hker-gold text-hker-gold hover:text-black py-2 rounded text-[10px] font-bold border border-hker-gold transition-colors">ORCA POOL</a>
                       <a href="https://raydium.io/liquidity-pools/?token=B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" className="bg-hker-gold/20 hover:bg-hker-gold text-hker-gold hover:text-black py-2 rounded text-[10px] font-bold border border-hker-gold transition-colors">RAYDIUM</a>
                  </div>
                  <div className="w-full px-4 mt-2 relative z-10">
                       <a href="https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" className="block bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-black py-2 rounded text-[10px] font-bold border border-green-500 transition-colors">
                         JUPITER TRADING (交易)
                       </a>
                  </div>
              </div>
           </div>

           {/* HKER Project Info */}
           <div className="bg-hker-night border-l-4 border-hker-gold rounded-r-lg p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10"><Trophy className="w-24 h-24 text-white"/></div>
              <h4 className="text-hker-gold font-black text-lg mb-2 flex items-center gap-2">🦁 HKER 計劃</h4>
              <p className="text-sm text-slate-300 leading-relaxed text-justify font-serif">
                HKER（Hongkongers Token）是一個由香港人社群發起的計畫，以「獅子山精神」為靈感，推動香港人團結、自由與創意的數位象徵。
                <br/><br/>
                這不是交易幣，而是一種社群精神與文化象徵，希望讓全球港人透過 Web3 連結，共同建立屬於我們的價值與故事。
              </p>
           </div>

           {/* Content Switcher Buttons */}
           {user ? (
               <>
                   {(view === 'game' || view === 'forum' || view === 'fortune') && (
                       <div className="space-y-4">
                           <div className="flex gap-3">
                               <button onClick={() => setView('game')} className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-black border border-hker-gold/30 p-4 rounded-lg text-center hover:border-hker-gold transition-all shadow-lg group">
                                   <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-hker-gold group-hover:scale-110 transition-transform" />
                                   <div className="font-bold text-sm text-white">Game Zone</div>
                               </button>
                               <button onClick={() => setView('fortune')} className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-black border border-blue-500/30 p-4 rounded-lg text-center hover:border-blue-400 transition-all shadow-lg group">
                                   <RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                                   <div className="font-bold text-sm text-white">Fortune</div>
                               </button>
                           </div>
                           
                           {/* Active Games */}
                           {view === 'game' && <GameCenter user={user} onUpdatePoints={(amt) => {
                               const updated = { ...user, points: user.points + amt };
                               DataService.saveUser(updated);
                               setUser(updated);
                           }} />}

                           {view === 'fortune' && (
                               <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                   <FortuneTeller />
                               </div>
                           )}
                       </div>
                   )}

                   {view === 'wallet' && (
                       <div className="bg-hker-night rounded-lg p-6 border border-slate-700 shadow-xl">
                           <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-hker-gold border-b border-slate-700 pb-2">
                             <CreditCard /> Withdraw / 提幣
                           </h3>
                           <div className="space-y-5">
                               <div>
                                 <label className="text-xs text-slate-400 font-bold ml-1">Amount (Min 1M)</label>
                                 <input type="number" id="withdrawAmount" placeholder="1000000" className="w-full bg-black border-2 border-slate-700 rounded-lg p-3 text-white focus:border-hker-gold focus:outline-none" />
                               </div>
                               <div>
                                 <label className="text-xs text-slate-400 font-bold ml-1">SOL Address</label>
                                 <input type="text" id="withdrawAddr" placeholder="Wallet Address" defaultValue={user.solAddress} className="w-full bg-black border-2 border-slate-700 rounded-lg p-3 text-white focus:border-hker-gold focus:outline-none font-mono text-xs" />
                               </div>
                               <button 
                                   onClick={() => {
                                       const amt = parseFloat((document.getElementById('withdrawAmount') as HTMLInputElement).value);
                                       const addr = (document.getElementById('withdrawAddr') as HTMLInputElement).value;
                                       handleWithdraw(amt, addr);
                                   }}
                                   className="w-full bg-hker-gold hover:bg-yellow-400 text-black font-black py-3 rounded-lg shadow-lg transform active:scale-95 transition-all"
                                >
                                   CONFIRM WITHDRAW
                               </button>
                           </div>
                       </div>
                   )}

                   {view === 'admin' && user.role === 'admin' && (
                       <div className="bg-hker-night rounded-lg p-6 border border-hker-red/50 shadow-[0_0_20px_rgba(208,0,0,0.1)]">
                           <h3 className="font-bold text-lg text-hker-red flex items-center gap-2 mb-4"><Shield /> Admin Console</h3>
                           <div className="grid grid-cols-2 gap-3 text-center text-xs mb-4">
                               <div className="bg-black/50 p-3 rounded border border-slate-800">
                                   <div className="text-2xl font-black text-blue-400">{stats.onlineUsers}</div>
                                   <div className="text-slate-500 uppercase font-bold">Online</div>
                               </div>
                               <div className="bg-black/50 p-3 rounded border border-slate-800">
                                   <div className="text-2xl font-black text-green-400">{stats.newRegisters}</div>
                                   <div className="text-slate-500 uppercase font-bold">New</div>
                               </div>
                           </div>
                           
                           <button onClick={handleBotRun} className="w-full bg-gradient-to-r from-purple-900 to-purple-600 hover:from-purple-800 hover:to-purple-500 py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 border border-purple-400/30 shadow-lg mb-4">
                               <Bot className="w-5 h-5" /> Trigger AI Bot News
                           </button>
                           
                           <div className="border-t border-slate-800 pt-4 max-h-64 overflow-y-auto custom-scrollbar">
                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Member List</h4>
                               {usersList.map(u => (
                                   <div key={u.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-800 hover:bg-slate-800/50 px-2 rounded">
                                       <span className="font-bold text-white">{u.name}</span>
                                       <div className="flex items-center gap-2">
                                          <span className="font-mono text-hker-gold">{u.points}</span>
                                          <button 
                                              onClick={() => {
                                                  const newPts = prompt("Points Adjustment:", u.points.toString());
                                                  if (newPts) DataService.saveUser({ ...u, points: parseInt(newPts) });
                                              }}
                                              className="bg-slate-700 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-[10px]"
                                           >Edit</button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {view === 'profile' && (
                       <div className="bg-hker-night rounded-lg p-6 border border-slate-700">
                           <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white border-b border-slate-700 pb-2"><Settings /> Account Settings</h3>
                           <form onSubmit={async (e) => {
                               e.preventDefault();
                               const form = e.target as HTMLFormElement;
                               const formData = new FormData(form);
                               const updates = Object.fromEntries(formData.entries());
                               const updated = { ...user, ...updates };
                               await DataService.saveUser(updated as any);
                               setUser(updated as any);
                               handleNotify('Profile Updated', 'success');
                           }} className="space-y-4">
                               <div>
                                   <label className="text-xs text-slate-500 font-bold ml-1">Display Name</label>
                                   <input name="name" defaultValue={user.name} className="w-full bg-black border border-slate-700 rounded p-2 text-sm text-white focus:border-hker-gold" />
                               </div>
                               <div>
                                   <label className="text-xs text-slate-500 font-bold ml-1">Email</label>
                                   <input name="email" defaultValue={user.email} className="w-full bg-black border border-slate-700 rounded p-2 text-sm text-white focus:border-hker-gold" />
                               </div>
                               <div>
                                   <label className="text-xs text-slate-500 font-bold ml-1">SOL Address</label>
                                   <input name="solAddress" defaultValue={user.solAddress} className="w-full bg-black border border-slate-700 rounded p-2 text-sm text-white font-mono focus:border-hker-gold" />
                               </div>
                               <div>
                                   <label className="text-xs text-slate-500 font-bold ml-1">Change Password</label>
                                   <input name="password" type="password" defaultValue={user.password} className="w-full bg-black border border-slate-700 rounded p-2 text-sm text-white focus:border-hker-gold" />
                               </div>
                               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold text-white shadow-lg mt-2">Save Changes</button>
                           </form>
                       </div>
                   )}
               </>
           ) : (
               <div className="bg-hker-night p-8 rounded-lg border border-slate-700 text-center shadow-lg">
                   <Mountain className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                   <h3 className="text-white font-bold text-lg mb-2">Member Access Only</h3>
                   <p className="text-slate-400 mb-6 text-sm">Please login to play games, withdraw tokens, and manage your profile.</p>
                   <button onClick={() => setShowLogin(true)} className="bg-hker-gold text-black font-black px-8 py-3 rounded shadow-lg hover:scale-105 transition-transform">
                      LOGIN NOW
                   </button>
               </div>
           )}

        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl border-l-4 flex items-center gap-3 animate-bounce z-[60] ${
            notification.type === 'success' ? 'bg-[#0B1810] border-green-500 text-green-400' :
            notification.type === 'error' ? 'bg-[#180B0B] border-red-500 text-red-400' :
            'bg-[#0B1018] border-blue-500 text-blue-400'
        }`}>
            {notification.type === 'success' ? <UserCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold">{notification.msg}</span>
        </div>
      )}

      {/* MODALS */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-hker-night border-2 border-hker-red/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(208,0,0,0.2)] relative">
                <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X /></button>
                <div className="text-center mb-6">
                   <div className="inline-block mb-2"><HkerLogo /></div>
                   <h2 className="text-2xl font-black text-white">WELCOME BACK</h2>
                   <p className="text-hker-gold text-sm font-bold">HKER NEWS PLATFORM</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 ml-1">Email</label>
                       <input name="email" type="email" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-red outline-none" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 ml-1">Password</label>
                       <input name="password" type="password" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-red outline-none" required />
                    </div>
                    <button type="submit" className="w-full bg-hker-red hover:bg-red-700 text-white font-black py-4 rounded shadow-lg uppercase tracking-wider transition-colors">Login</button>
                </form>
                <div className="mt-6 text-center text-sm text-slate-400">
                    No account? <button onClick={() => { setShowLogin(false); setShowRegister(true); }} className="text-hker-gold font-bold hover:underline ml-1">Register Now</button>
                </div>
            </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-hker-night border-2 border-hker-gold/30 p-8 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(255,215,0,0.1)] relative h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setShowRegister(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X /></button>
                <h2 className="text-2xl font-black text-hker-gold mb-1 text-center">JOIN HKER</h2>
                <p className="text-center text-slate-400 text-sm mb-6">Create account & get 8888 Points</p>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-400 ml-1">Name</label>
                           <input name="name" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-gold outline-none" required />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-400 ml-1">Gender</label>
                           <select name="gender" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-gold outline-none">
                               <option value="M">Male</option>
                               <option value="F">Female</option>
                               <option value="O">Other</option>
                           </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 ml-1">Email</label>
                       <input name="email" type="email" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-gold outline-none" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 ml-1">Password</label>
                       <input name="password" type="password" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-gold outline-none" required />
                    </div>
                    <input name="phone" placeholder="Phone" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-gold outline-none" required />
                    <input name="address" placeholder="Address" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-gold outline-none" required />
                    <input name="solAddress" placeholder="SOL Address (Optional)" className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-hker-gold outline-none font-mono" />
                    
                    <div className="bg-black/50 p-4 rounded border border-slate-700">
                        <label className="text-xs text-hker-gold font-bold block mb-3 uppercase tracking-wider">Select Avatar</label>
                        <div className="grid grid-cols-6 gap-2 h-32 overflow-y-auto custom-scrollbar pr-2">
                            {AVATARS.map(a => (
                                <label key={a} className="cursor-pointer text-center text-2xl hover:bg-slate-800 rounded p-2 transition-colors">
                                    <input type="radio" name="avatar" value={a} className="hidden peer" defaultChecked={a === AVATARS[0]} />
                                    <span className="opacity-40 peer-checked:opacity-100 peer-checked:scale-125 block transition-all filter grayscale peer-checked:grayscale-0">{a}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-hker-gold hover:bg-yellow-400 text-black font-black py-4 rounded shadow-lg mt-4 transform active:scale-95 transition-all">REGISTER ACCOUNT</button>
                </form>
            </div>
        </div>
      )}

      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-hker-night border-2 border-slate-600 p-8 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl relative">
                <button onClick={() => setShowDisclaimer(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X /></button>
                
                <h2 className="text-2xl font-black text-hker-gold mb-6 border-b border-slate-700 pb-4 text-center">💡 免責聲明 (Disclaimer)</h2>
                
                <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                    <p>歡迎光臨本論壇，為維護良好的社群環境及保障各方權益，請所有使用者在使用本站服務前，務必詳閱並遵守以下聲明：</p>

                    <div>
                      <h3 className="font-bold text-white text-base mb-2">一、 法律守法原則</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>嚴禁違法言論：</strong>本論壇所有使用者之言論與行為均受法律約束。嚴禁發佈任何違反當地法律之內容。</li>
                        <li><strong>遵守特定區域法律：</strong>使用者必須嚴格遵守中華人民共和國及香港特別行政區之法律法規(包括23條和國安法)。嚴禁發佈任何危害國家安全、公眾秩序或煽動違法行為之言論。</li>
                        <li><strong>拒絕有害內容：</strong>本站堅決反對並嚴禁任何涉及暴力、色情、低俗或人身攻擊之訊息，一經發現將立即刪除並封禁帳號。</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base mb-2">二、 遊戲性質與娛樂警示</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>非賭博性質：</strong>本網站所提供之「小瑪莉」、「魚蝦蟹」等遊戲，僅供社群互動與休閒娛樂使用。</li>
                        <li><strong>純積分機制：</strong>遊戲內所有數值均為「虛擬積分」，不具備任何實際價值，亦不可兌換為現金或任何實物資產。本站嚴禁任何涉及真實金錢的博弈行為。</li>
                        <li><strong>理性娛樂：</strong>請使用者保持健康心態，切勿沉迷虛擬遊戲。遊戲旨在舒壓，不應影響日常生活、工作或家庭。</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base mb-2">三、 專業內容參考與免責</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>參考性質：</strong>本站所提供之「算命」、「占卜」及「運勢分析」功能，其結果僅供心理參考，不代表科學事實或必然趨勢。</li>
                        <li><strong>決策自主：</strong>使用者不應將算命結果作為現實決策（如投資、醫療、法律等）之唯一依據。對於因參考相關內容而產生的任何損失，本站概不負責。</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base mb-2">四、 聲明之變更</h3>
                      <p>本論壇保留隨時修訂本聲明之權利。繼續使用本站服務即代表您同意上述所有條款。</p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                   <button onClick={() => setShowDisclaimer(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-full transition-colors">
                      我已閱讀並同意 (I Agree)
                   </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Game Center Lobby ---
const GameCenter = ({ user, onUpdatePoints }: { user: User, onUpdatePoints: (amt: number) => void }) => {
  const [selectedGame, setSelectedGame] = useState<'slots' | 'baccarat' | 'hhh' | 'littlemary' | 'blackjack' | 'roulette' | null>(null);

  if (!selectedGame) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-hker-gold font-bold mb-4 uppercase text-xs tracking-widest text-center border-b border-slate-700 pb-2">Select a Game</h3>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => setSelectedGame('blackjack')} className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-500/30 p-6 rounded-xl hover:border-cyan-400 transition-all shadow-lg group flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="text-2xl w-8 text-center group-hover:scale-110 transition-transform">♠️</div>
                <div className="text-left">
                   <div className="font-bold text-white text-lg">21點 (Cyber 21)</div>
                   <div className="text-xs text-slate-400">AI Dealer • 3:2 Payout</div>
                </div>
             </div>
             <ChevronRight className="text-slate-600 group-hover:text-white" />
          </button>

          <button onClick={() => setSelectedGame('roulette')} className="bg-gradient-to-r from-cyan-900 to-slate-900 border border-cyan-500/30 p-6 rounded-xl hover:border-white transition-all shadow-lg group flex items-center justify-between">
             <div className="flex items-center gap-4">
                <Disc className="w-8 h-8 text-cyan-400 group-hover:scale-110 group-hover:rotate-180 transition-transform duration-700" />
                <div className="text-left">
                   <div className="font-bold text-white text-lg">AI 輪盤 (Roulette)</div>
                   <div className="text-xs text-slate-400">Quantum Pulse Engine</div>
                </div>
             </div>
             <ChevronRight className="text-slate-600 group-hover:text-white" />
          </button>

          <button onClick={() => setSelectedGame('littlemary')} className="bg-gradient-to-r from-purple-900 to-slate-900 border border-purple-500/30 p-6 rounded-xl hover:border-hker-gold transition-all shadow-lg group flex items-center justify-between">
             <div className="flex items-center gap-4">
                <Zap className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                   <div className="font-bold text-white text-lg">小瑪莉</div>
                   <div className="text-xs text-slate-400">Little Mary</div>
                </div>
             </div>
             <ChevronRight className="text-slate-600 group-hover:text-white" />
          </button>

          <button onClick={() => setSelectedGame('hhh')} className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-500/30 p-6 rounded-xl hover:border-hker-gold transition-all shadow-lg group flex items-center justify-between">
             <div className="flex items-center gap-4">
                <Dice5 className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                   <div className="font-bold text-white text-lg">魚蝦蟹</div>
                   <div className="text-xs text-slate-400">Hoo Hey How</div>
                </div>
             </div>
             <ChevronRight className="text-slate-600 group-hover:text-white" />
          </button>

          <button onClick={() => setSelectedGame('baccarat')} className="bg-gradient-to-r from-red-900 to-slate-900 border border-red-500/30 p-6 rounded-xl hover:border-hker-gold transition-all shadow-lg group flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="text-2xl w-8 text-center group-hover:scale-110 transition-transform">🃏</div>
                <div className="text-left">
                   <div className="font-bold text-white text-lg">百家樂</div>
                   <div className="text-xs text-slate-400">Baccarat</div>
                </div>
             </div>
             <ChevronRight className="text-slate-600 group-hover:text-white" />
          </button>

          <button onClick={() => setSelectedGame('slots')} className="bg-gradient-to-r from-yellow-900 to-slate-900 border border-yellow-500/30 p-6 rounded-xl hover:border-hker-gold transition-all shadow-lg group flex items-center justify-between">
             <div className="flex items-center gap-4">
                <Trophy className="w-8 h-8 text-hker-gold group-hover:scale-110 transition-transform" />
                <div className="text-left">
                   <div className="font-bold text-white text-lg">老虎機</div>
                   <div className="text-xs text-slate-400">Lucky Slots</div>
                </div>
             </div>
             <ChevronRight className="text-slate-600 group-hover:text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
      {selectedGame === 'slots' && <SlotMachine user={user} onUpdatePoints={onUpdatePoints} onBack={() => setSelectedGame(null)} />}
      {selectedGame === 'baccarat' && <Baccarat user={user} onUpdatePoints={onUpdatePoints} onBack={() => setSelectedGame(null)} />}
      {selectedGame === 'hhh' && <HooHeyHow user={user} onUpdatePoints={onUpdatePoints} onBack={() => setSelectedGame(null)} />}
      {selectedGame === 'littlemary' && <LittleMary user={user} onUpdatePoints={onUpdatePoints} onBack={() => setSelectedGame(null)} />}
      {selectedGame === 'blackjack' && <CyberBlackjack user={user} onUpdatePoints={onUpdatePoints} onBack={() => setSelectedGame(null)} />}
      {selectedGame === 'roulette' && <QuantumRoulette user={user} onUpdatePoints={onUpdatePoints} onBack={() => setSelectedGame(null)} />}
    </div>
  );
};
