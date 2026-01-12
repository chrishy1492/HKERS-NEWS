import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Shield, Search, RefreshCw, Gamepad2, Coins, 
  Globe, Heart, ThumbsUp, Trash2, Settings, X, Share2, 
  AlertTriangle, CreditCard, UserCheck, ChevronRight, 
  Newspaper, Bot, Lock, Calendar, ExternalLink, Zap,
  Activity, Clock, Link as LinkIcon, CheckCircle,
  Menu, Bell, ChevronDown, MoreVertical
} from 'lucide-react';

/**
 * ============================================================================
 * 1. CONFIGURATION & MOCK DATA
 * ============================================================================
 */

const ADMIN_EMAILS = ['chrishy1494@gmail.com', 'hkerstoken@gmail.com', 'niceleung@gmail.com'];
const REGIONS = ["全部", "中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const TOPICS = ["全部", "地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "宗教", "優惠", "校園", "天氣", "社區活動"];

// 模擬初始數據
const INITIAL_POSTS = [
  {
    id: 'news-101',
    author: 'HKER Bot 🤖',
    role: 'bot',
    avatar: '🤖',
    timestamp: Date.now() - 7200000,
    region: '中國香港',
    topic: '時事',
    titleCN: '【最新】高鐵香港段新增16個站點 包括南京及合肥',
    contentCN: '港鐵宣布，高鐵香港段將於1月26日起新增16個站點，直達站點總數將增至超過100個。',
    likes: 245,
    loves: 112,
    isBot: true,
    url: 'https://hkers-news-mmzi.vercel.app/api/bot'
  }
];

/**
 * ============================================================================
 * 2. MAIN APPLICATION COMPONENT
 * ============================================================================
 */
export default function App() {
  // --- Auth & Navigation State ---
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('forum'); // 'forum' | 'admin'
  const [showLogin, setShowLogin] = useState(true);
  
  // --- Content State ---
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("全部");
  
  // --- UI State ---
  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Helpers ---
  const notify = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (ADMIN_EMAILS.includes(email) && password === 'admin') {
      setCurrentUser({
        id: 'admin-01',
        name: 'HKER Admin',
        email: email,
        role: 'admin',
        points: 8888888,
        avatar: '🦁'
      });
      setShowLogin(false);
      notify('管理員登入成功', 'success');
    } else {
      notify('帳號或密碼錯誤', 'error');
    }
  };

  const runCronJob = () => {
    setIsRefreshing(true);
    notify('執行中: HKER News Bot (Cron API)...', 'info');
    
    setTimeout(() => {
      const newPost = {
        id: `bot-${Date.now()}`,
        author: 'HKER Bot 🤖',
        role: 'bot',
        avatar: '🤖',
        timestamp: Date.now(),
        region: '全球',
        topic: '技術',
        titleCN: `【系統同步】排程任務已於 ${new Date().toLocaleTimeString()} 成功執行`,
        contentCN: 'Vercel Cron Job 已成功觸發 API 端點。所有新聞數據已同步至 Supabase 資料庫。',
        likes: 0,
        loves: 0,
        isBot: true,
        url: ''
      };
      setPosts([newPost, ...posts]);
      setIsRefreshing(false);
      notify('排程執行完畢，數據已更新', 'success');
    }, 1500);
  };

  // --- Filtered Data ---
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchRegion = selectedRegion === "全部" || p.region === selectedRegion;
      const matchSearch = p.titleCN.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    });
  }, [posts, selectedRegion, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-white tracking-tight">HKER <span className="text-blue-500">Console</span></h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Automation Platform</p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="搜尋任務或新聞..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-white">{currentUser.name}</span>
                  <span className="text-[10px] text-yellow-500 font-mono">{currentUser.points.toLocaleString()} HKER</span>
                </div>
                <button 
                  onClick={() => setView(view === 'admin' ? 'forum' : 'admin')}
                  className={`p-2 rounded-lg transition-colors ${view === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-slate-800'}`}
                >
                  <Shield className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                  {currentUser.avatar}
                </div>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                登入控制台
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Section: Main View */}
        <div className="flex-1 space-y-6">
          {view === 'admin' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdminDashboard 
                runJob={runCronJob} 
                isRefreshing={isRefreshing}
                stats={{ activeJobs: 1, totalCalls: 1284, successRate: "99.8%" }}
              />
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">新聞動態 Feed</h2>
                <div className="flex gap-2">
                  {["全部", "中國香港", "台灣"].map(r => (
                    <button 
                      key={r}
                      onClick={() => setSelectedRegion(r)}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${selectedRegion === r ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPosts.map(post => (
                <div key={post.id} className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-xl border border-slate-700">
                        {post.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-400 flex items-center gap-2">
                          {post.author}
                          {post.isBot && <Bot className="w-3 h-3" />}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {new Date(post.timestamp).toLocaleString()} • {post.region} • {post.topic}
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-600 hover:text-slate-400 p-1"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors">{post.titleCN}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{post.contentCN}</p>
                  <div className="flex items-center gap-6 pt-4 border-t border-slate-800/50">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors text-xs font-bold">
                      <ThumbsUp className="w-4 h-4" /> {post.likes}
                    </button>
                    <button className="flex items-center gap-2 text-slate-500 hover:text-pink-500 transition-colors text-xs font-bold">
                      <Heart className="w-4 h-4" /> {post.loves}
                    </button>
                    <button className="ml-auto flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold">
                      <Share2 className="w-4 h-4" /> 分享
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Sidebar */}
        <div className="lg:w-80 space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-xl shadow-blue-500/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Coins className="w-32 h-32" />
            </div>
            <h4 className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-4">HKER Balance</h4>
            <div className="text-3xl font-mono font-bold text-white mb-6">
              {currentUser ? currentUser.points.toLocaleString() : '---'}
            </div>
            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold py-3 rounded-xl transition-all border border-white/10">
              提領到 Phantom 錢包
            </button>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" /> 系統健康度
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">API 響應</span>
                <span className="text-green-400 font-mono">24ms</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">數據庫同步</span>
                <span className="text-blue-400 font-mono">即時 (Real-time)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[98%]"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm" onClick={() => setShowLogin(false)}></div>
          <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Shield className="text-white w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">管理員登入</h2>
              <p className="text-slate-500 text-sm mt-1">請輸入您的管理密碼進入控制台</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Admin Email</label>
                <input name="email" type="email" defaultValue="hkerstoken@gmail.com" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Password</label>
                <input name="password" type="password" defaultValue="admin" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-sm" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] mt-4">
                進入系統
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-8 right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-blue-500/10 border-blue-500/50 text-blue-400'}`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          <span className="text-sm font-bold">{notification.msg}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * 3. ADMIN DASHBOARD COMPONENT (Redesigned like cron-job.org)
 * ============================================================================
 */
function AdminDashboard({ runJob, isRefreshing, stats }: { runJob: () => void, isRefreshing: boolean, stats: any }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">排程任務監控 <span className="text-slate-500 font-normal">Cron Jobs</span></h2>
          <p className="text-sm text-slate-500">管理與執行自動化數據抓取任務</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-all">
            <PlusIcon className="w-4 h-4" /> 新增任務
          </button>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">運行中任務</div>
          <div className="text-2xl font-bold text-white">{stats.activeJobs}</div>
        </div>
        <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">今日呼叫次數</div>
          <div className="text-2xl font-bold text-blue-500">{stats.totalCalls}</div>
        </div>
        <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">平均成功率</div>
          <div className="text-2xl font-bold text-green-500">{stats.successRate}</div>
        </div>
      </div>

      {/* The Cron Job Console Card */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#0f172a]/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-bold text-slate-200">HKER News Bot</span>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-green-400 font-bold uppercase">Active</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 block">端點網址 (API Endpoint)</label>
                <div className="flex items-center gap-2 bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                  <LinkIcon className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <code className="text-xs text-blue-400 font-mono truncate">https://hkers-news-mmzi.vercel.app/api/bot</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("https://hkers-news-mmzi.vercel.app/api/bot");
                      alert('已複製到剪貼簿');
                    }}
                    className="ml-auto p-1 hover:bg-slate-800 rounded text-slate-500"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 block">排程週期</label>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" /> 每小時 (Hourly)
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 block">超時限制</label>
                  <div className="text-sm font-bold text-white">30s</div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex flex-col justify-center gap-4">
              <div className="flex justify-between items-center px-2">
                <div className="text-xs text-slate-500 font-medium">上次執行時間</div>
                <div className="text-xs text-slate-300 font-mono">2026-01-12 11:00:02</div>
              </div>
              <div className="flex justify-between items-center px-2">
                <div className="text-xs text-slate-500 font-medium">下次執行預計</div>
                <div className="text-xs text-blue-400 font-mono">2026-01-12 12:00:00</div>
              </div>
              <div className="border-t border-slate-800 my-1"></div>
              <div className="flex justify-between items-center px-2">
                <div className="text-xs text-slate-500 font-medium">歷史執行成功率</div>
                <div className="text-xs text-green-500 font-bold">100%</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={runJob}
              disabled={isRefreshing}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg ${isRefreshing ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? '正在觸發排程 API...' : '立即手動執行任務 (Manual Trigger)'}
            </button>
          </div>
        </div>
      </div>

      {/* History Log Section */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-white mb-4">執行日誌 (Last 5 Runs)</h4>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300 font-mono">2026-01-12 0{9+i}:00:01</span>
              </div>
              <span className="text-slate-500 uppercase font-bold text-[10px]">Status: 200 OK</span>
              <span className="text-blue-400 font-medium">Execution: 1.2s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 4v16m8-8H4" />
    </svg>
  );
}