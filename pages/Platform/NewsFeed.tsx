
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Globe, ExternalLink, Clock, Bot, MapPin, Tag, Filter, AlertTriangle, Link as LinkIcon, Info, Trash2, Cpu, BarChart3, ShieldCheck, Share2, TrendingUp, Zap, Newspaper, AlertCircle, Home, CheckCircle2, Map } from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { Post, User, UserRole } from '../../types';

// --- MAPPING CONFIGURATION ---
const CATEGORY_MAP: Record<string, string> = {
    'property': '地產',
    'news': '時事',
    'finance': '財經',
    'entertainment': '娛樂',
    'travel': '旅遊',
    'digital': '數碼',
    'auto': '汽車',
    'religion': '宗教',
    'offers': '優惠',
    'campus': '校園',
    'weather': '天氣',
    'community': '社區活動'
};

const REGION_MAP: Record<string, string> = {
    'hk': '中國香港',
    'tw': '台灣',
    'uk': '英國',
    'us': '美國',
    'ca': '加拿大',
    'au': '澳洲',
    'eu': '歐洲'
};

export const NewsFeed: React.FC = () => {
  const { user, lang } = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedRegionCode, setSelectedRegionCode] = useState('all');
  const [selectedTopicCode, setSelectedTopicCode] = useState('all');
  
  const fetchAndFilterPosts = async () => {
      setLoading(true);
      // 1. Trigger Bot Check (Silent)
      await MockDB.triggerRobotPost();
      
      // 2. Get All Posts
      const allPosts = await MockDB.getPosts();
      
      // 3. Apply Strict Filters (Region Code + Topic Code + 36h Time Limit)
      // Note: Future dated posts (demo data) are considered "new" and will pass the > 36h ago check
      const now = Date.now();
      const thirtySixHoursAgo = now - (36 * 60 * 60 * 1000);
      
      const filtered = allPosts.filter(p => {
          // Time Filter: Only Real News within 36h for bots
          if (p.isRobot && p.timestamp < thirtySixHoursAgo) return false;

          // Region Filter (Match code)
          if (selectedRegionCode !== 'all' && p.region !== selectedRegionCode) return false;

          // Topic Filter (Match code)
          if (selectedTopicCode !== 'all' && p.category !== selectedTopicCode) return false;

          return true;
      });

      // Sort by newest
      filtered.sort((a, b) => b.timestamp - a.timestamp);

      setPosts(filtered);
      setLoading(false);
  };

  useEffect(() => {
      fetchAndFilterPosts();
      // Auto-refresh every 15s
      const interval = setInterval(fetchAndFilterPosts, 15000);
      return () => clearInterval(interval);
  }, [selectedRegionCode, selectedTopicCode]);

  const handleInteraction = async (postId: string, type: 'like' | 'heart') => {
    if (!user) {
        if(confirm('Please Login to interact!')) navigate('/platform/login');
        return;
    }
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = { ...posts[postIndex] };

    if (!post.userInteractions) post.userInteractions = {};
    if (!post.userInteractions[user.id]) post.userInteractions[user.id] = { likes: 0, hearts: 0 };

    if (type === 'like') {
        if (post.userInteractions[user.id].likes >= 3) return alert("Max 3 likes.");
        post.userInteractions[user.id].likes++;
        post.likes++;
    } else {
        if (post.userInteractions[user.id].hearts >= 3) return alert("Max 3 hearts.");
        post.userInteractions[user.id].hearts++;
        post.hearts++;
    }
    
    const newPosts = [...posts];
    newPosts[postIndex] = post;
    setPosts(newPosts);
    
    await MockDB.savePost(post);
    await MockDB.updateUserPoints(user.id, 100);
  };

  const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR);
  const handleDelete = async (id: string) => {
      if(confirm('Delete Post?')) {
          await MockDB.deletePost(id);
          fetchAndFilterPosts();
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 font-sans selection:bg-blue-100">
      
      {/* HEADER: SYSTEM STATUS & DISCLAIMER */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-sm p-6 rounded-b-[2rem]">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg">
              <Bot size={22}/>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-slate-900">HKER INTEL BOT</h1>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">v5.0 Trusted Engine</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Scanning Domains</p>
              <p className="text-[11px] font-black text-slate-600">BBC, Reuters, Verge, SCMP...</p>
            </div>
          </div>
        </div>
      </header>

      {/* FILTER SYSTEM */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-6">
          {/* REGION FILTER */}
          <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <MapPin size={14} className="text-blue-500"/> <span>Region 覆蓋地區</span>
                </div>
                <span className="text-[10px] font-bold text-slate-300">Auto-Polling Active</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterBtn active={selectedRegionCode === 'all'} label="全部" onClick={() => setSelectedRegionCode('all')} />
                {Object.entries(REGION_MAP).map(([code, label]) => (
                    <FilterBtn key={code} active={selectedRegionCode === code} label={label} onClick={() => setSelectedRegionCode(code)} />
                ))}
              </div>
          </div>

          {/* TOPIC FILTER */}
          <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center space-x-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <Tag size={14} className="text-emerald-500"/> <span>Channel 主題頻道</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterBtn active={selectedTopicCode === 'all'} label="全部" onClick={() => setSelectedTopicCode('all')} color="bg-emerald-600" />
                {Object.entries(CATEGORY_MAP).map(([code, label]) => (
                    <FilterBtn key={code} active={selectedTopicCode === code} label={label} onClick={() => setSelectedTopicCode(code)} color="bg-emerald-600" />
                ))}
              </div>
          </div>
      </div>

      {/* FEED CONTENT */}
      {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-sm font-bold animate-pulse tracking-wide">優先抓取全球公信力英文來源並進行 AI 摘要改寫...</p>
          </div>
      ) : posts.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center space-y-6">
            <div className="p-6 bg-slate-50 rounded-full text-slate-200">
              <AlertCircle size={60} />
            </div>
            <div className="space-y-2">
              <p className="text-slate-900 font-black text-xl tracking-tight">36 小時內暫無符合公信力標準的新聞</p>
              <p className="text-slate-400 text-[13px] font-bold max-w-md mx-auto">
                為了保證資訊質量，機器人已過濾所有非白名單來源或低質內容。請切換地區或主題。
              </p>
            </div>
            <button 
                onClick={()=>{setSelectedRegionCode('all'); setSelectedTopicCode('all');}} 
                className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[12px] font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
            >
              重置所有搜尋條件
            </button>
          </div>
      ) : (
          <div className="space-y-10">
            {posts.map(post => (
              <NewsCard 
                key={post.id} 
                item={post} 
                lang={lang}
                interactions={post.userInteractions?.[user?.id || ''] || {likes: 0, hearts: 0}}
                onInteract={handleInteraction}
                onDelete={isAdmin ? handleDelete : undefined}
              />
            ))}
          </div>
      )}

      {/* 底部浮動菜單 */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-2xl z-50 flex justify-between">
        <button className="flex-1 flex flex-col items-center py-2.5 text-blue-400">
          <TrendingUp size={20}/><span className="text-[9px] font-black mt-1 uppercase tracking-widest">Hot</span>
        </button>
        <button className="flex-1 flex flex-col items-center py-2.5 text-slate-400 hover:text-white transition-colors">
          <Globe size={20}/><span className="text-[9px] font-black mt-1 uppercase tracking-widest">Global</span>
        </button>
        <button className="flex-1 flex flex-col items-center py-2.5 text-slate-400 hover:text-white transition-colors">
          <Newspaper size={20}/><span className="text-[9px] font-black mt-1 uppercase tracking-widest">Local</span>
        </button>
        <button className="flex-1 flex flex-col items-center py-2.5 text-slate-400 hover:text-white transition-colors">
          <Map size={20}/><span className="text-[9px] font-black mt-1 uppercase tracking-widest">Travel</span>
        </button>
      </nav>
    </div>
  );
};

const FilterBtn = ({ active, label, onClick, color = "bg-blue-600" }: any) => (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
        active 
          ? `${color} text-white shadow-lg shadow-blue-200` 
          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200'
      }`}
    >
      {label}
    </button>
);

const NewsCard = ({ item, lang, interactions, onInteract, onDelete }: any) => {
  const title = lang === 'cn' ? (item.titleCN || item.title) : (item.title || item.titleCN);
  const processedSummary = item.processedSummary || [];
  
  return (
    <article className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-xl group">
      {/* 來源與信任標誌 */}
      <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
            <CheckCircle2 size={16} className="text-blue-600" />
          </div>
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{item.source || 'Trusted Source'}</span>
          {item.isEnglishSource && (
            <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md uppercase">Global Source</span>
          )}
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center text-[11px] font-bold text-slate-400">
                <Clock size={12} className="mr-1.5" />
                {new Date(item.timestamp).toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
            </div>
            {onDelete && <button onClick={()=>onDelete(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
        </div>
      </div>

      <div className="p-8 md:p-12 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase">{item.region}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg uppercase border border-slate-200">{item.category}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black leading-[1.2] text-slate-900 group-hover:text-blue-700 transition-colors">
            {title}
          </h2>
        </div>
        
        {/* 重點摘要區塊 */}
        <div className="space-y-5">
          <div className="flex items-center space-x-2 text-[11px] font-black text-blue-600 bg-blue-50 w-fit px-4 py-1.5 rounded-full border border-blue-100">
            <Zap size={14} /> <span>機器人自動摘要 (防侵權改寫模式)</span>
          </div>

          <div className="grid gap-3">
            {processedSummary.length > 0 ? processedSummary.map((point: any, index: number) => {
                const isDisclaimer = point.label.includes('聲明') || point.label.includes('提示') || point.label.includes('說明');
                return (
                    <div key={index} className={`flex items-start p-5 rounded-2xl border ${isDisclaimer ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-blue-100 transition-all shadow-sm shadow-transparent hover:shadow-blue-100/50'}`}>
                        <div className={`w-20 shrink-0 text-[10px] font-black uppercase mt-1 tracking-tighter ${isDisclaimer ? 'text-amber-600' : 'text-slate-400'}`}>
                        {point.label}
                        </div>
                        <div className={`text-[15px] font-bold leading-relaxed ${isDisclaimer ? 'text-amber-800/80 italic' : 'text-slate-700'}`}>
                        {point.detail}
                        </div>
                    </div>
                );
            }) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                    {item.background || item.contentCN || item.content}
                </div>
            )}
          </div>
        </div>

        {/* 頁腳 */}
        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="flex space-x-2">
                <button onClick={()=>onInteract(item.id, 'like')} className={`p-3 rounded-xl border transition ${interactions.likes>0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <ThumbsUp size={18} fill={interactions.likes>0?"currentColor":"none"}/>
                </button>
                <button onClick={()=>onInteract(item.id, 'heart')} className={`p-3 rounded-xl border transition ${interactions.hearts>0 ? 'bg-red-50 border-red-200 text-red-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <Heart size={18} fill={interactions.hearts>0?"currentColor":"none"}/>
                </button>
             </div>
             <p className="text-[11px] font-bold text-slate-400 italic hidden md:block">
                * 內容已通過 2026 年最新公信力白名單校驗
             </p>
          </div>
          
          {item.sourceUrl && (
              <a 
                href={item.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto flex items-center justify-center space-x-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[13px] font-black hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                <span>閱讀公信力來源原文</span>
                <ExternalLink size={16} />
              </a>
          )}
        </div>
      </div>
    </article>
  );
};
