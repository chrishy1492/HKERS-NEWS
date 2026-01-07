
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Globe, ExternalLink, Clock, Bot, MapPin, Tag, Filter, AlertTriangle, Link as LinkIcon, Info, Trash2, Cpu, BarChart3, ShieldCheck, Share2, TrendingUp, Zap, Newspaper, AlertCircle, Home } from 'lucide-react';
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
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200 ring-2 ring-blue-50">
              <ShieldCheck size={24}/>
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter leading-none text-slate-900">HKER INTEL</h1>
              <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mt-1 block">Bot Engine v4.0 • 36H Real-News</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bot Status</span>
              <div className="flex items-center text-xs font-bold text-emerald-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
                正在掃描 CES 2026 & 地產熱點...
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FILTER SYSTEM */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 space-y-8">
          {/* REGION FILTER */}
          <div className="space-y-4">
              <div className="flex items-center space-x-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                <MapPin size={16} className="text-blue-500"/> <span>地區選擇 (Region)</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <FilterBtn active={selectedRegionCode === 'all'} label="全部" onClick={() => setSelectedRegionCode('all')} />
                {Object.entries(REGION_MAP).map(([code, label]) => (
                    <FilterBtn key={code} active={selectedRegionCode === code} label={label} onClick={() => setSelectedRegionCode(code)} />
                ))}
              </div>
          </div>

          {/* TOPIC FILTER */}
          <div className="space-y-4">
              <div className="flex items-center space-x-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                <Tag size={16} className="text-emerald-500"/> <span>主題分類 (Channel)</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <FilterBtn active={selectedTopicCode === 'all'} label="全部" onClick={() => setSelectedTopicCode('all')} color="bg-emerald-600" />
                {Object.entries(CATEGORY_MAP).map(([code, label]) => (
                    <FilterBtn key={code} active={selectedTopicCode === code} label={label} onClick={() => setSelectedTopicCode(code)} color="bg-emerald-600" />
                ))}
              </div>
          </div>
      </div>

      {/* FEED CONTENT */}
      {loading ? (
          <div className="py-32 text-center space-y-6">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">正在調取 API 資源並執行 AI 摘要編寫...</p>
          </div>
      ) : posts.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 space-y-6">
            <AlertCircle size={48} className="mx-auto text-slate-200" />
            <div className="space-y-2">
              <p className="text-slate-900 font-black text-xl">目前區域暫無 36 小時內熱點</p>
              <p className="text-slate-400 text-sm font-bold">系統已過濾所有模板帖，請稍後再試。</p>
            </div>
            <button 
                onClick={()=>{setSelectedRegionCode('all'); setSelectedTopicCode('all');}} 
                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all active:scale-95"
            >
              重置所有篩選
            </button>
          </div>
      ) : (
          <div className="space-y-8">
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
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200 p-2.5 rounded-[3rem] shadow-2xl z-50 flex justify-around items-center">
        <button className="flex flex-col items-center p-3 text-blue-600"><Zap size={22}/><span className="text-[9px] font-black mt-1">熱點</span></button>
        <button className="flex flex-col items-center p-3 text-slate-400 hover:text-blue-600 transition-colors"><BarChart3 size={22}/><span className="text-[9px] font-black mt-1">財經</span></button>
        <button className="flex flex-col items-center p-3 text-slate-400 hover:text-blue-600 transition-colors"><Home size={22}/><span className="text-[9px] font-black mt-1">房產</span></button>
        <button className="flex flex-col items-center p-3 text-slate-400 hover:text-blue-600 transition-colors"><Globe size={22}/><span className="text-[9px] font-black mt-1">全球</span></button>
      </nav>
    </div>
  );
};

const FilterBtn = ({ active, label, onClick, color = "bg-blue-600" }: any) => (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all ${
        active 
          ? `${color} text-white shadow-lg shadow-blue-200 scale-105` 
          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
);

const NewsCard = ({ item, lang, interactions, onInteract, onDelete }: any) => {
  // Map Code to Display Label
  const displayRegion = REGION_MAP[item.region] || item.region;
  const displayCategory = CATEGORY_MAP[item.category] || item.category;
  const title = lang === 'cn' ? (item.titleCN || item.title) : (item.title || item.titleCN);

  const processedSummary = item.processedSummary || [];
  
  return (
    <article className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-2xl">
      {/* 頂部信息欄 */}
      <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
        <div className="flex space-x-3">
          <span className="bg-white px-4 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 text-blue-600 shadow-sm flex items-center">
            <Globe size={10} className="mr-1.5" /> {displayRegion}
          </span>
          <span className="bg-white px-4 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 text-emerald-600 shadow-sm flex items-center">
            <Newspaper size={10} className="mr-1.5" /> {displayCategory}
          </span>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-[12px] font-bold text-slate-400 flex items-center">
                <Clock size={14} className="mr-2 text-blue-400" /> 
                {new Date(item.timestamp).toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
            </div>
            {onDelete && <button onClick={()=>onDelete(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>}
        </div>
      </div>

      {/* 主體區域 */}
      <div className="p-10 md:p-14 space-y-8">
        <h2 className="text-2xl md:text-3xl font-black leading-tight text-slate-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl w-fit border border-blue-100 uppercase tracking-widest shadow-sm">
            <Zap size={14} className="mr-2" /> 智庫重點摘要 (防侵權改寫)
          </div>

          {/* 數據化清單 */}
          {processedSummary.length > 0 ? (
              <div className="grid gap-3">
                {processedSummary.map((point: any, index: number) => {
                  const isDisclaimer = point.label.includes('聲明') || point.label.includes('提示');
                  return (
                    <div key={index} className={`flex items-start p-5 rounded-[1.5rem] border transition-all hover:shadow-sm ${isDisclaimer ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-100'}`}>
                      <div className={`w-24 shrink-0 text-[9px] font-black uppercase mt-1 tracking-tighter ${isDisclaimer ? 'text-amber-600' : 'text-slate-400'}`}>
                        {point.label}
                      </div>
                      <div className={`text-[15px] font-bold leading-relaxed ${isDisclaimer ? 'text-amber-800 italic' : 'text-slate-700'}`}>
                        {point.detail}
                      </div>
                    </div>
                  );
                })}
              </div>
          ) : (
              // Fallback
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                  {item.background || item.contentCN}
              </div>
          )}
        </div>

        {/* 腳部來源與操作 */}
        <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center text-xs font-bold text-slate-400 bg-slate-50 px-5 py-3 rounded-2xl">
            <LinkIcon size={14} className="mr-3 text-blue-400" />
            來源認證：<span className="text-slate-800 ml-1 font-black">{item.source || 'Verified Source'}</span>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex space-x-2">
                <button onClick={()=>onInteract(item.id, 'like')} className={`p-4 rounded-2xl border transition-all ${interactions.likes>0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-blue-50 hover:text-blue-500'}`}>
                    <ThumbsUp size={18} fill={interactions.likes>0?"currentColor":"none"}/>
                </button>
                <button onClick={()=>onInteract(item.id, 'heart')} className={`p-4 rounded-2xl border transition-all ${interactions.hearts>0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-red-50 hover:text-red-500'}`}>
                    <Heart size={18} fill={interactions.hearts>0?"currentColor":"none"}/>
                </button>
              </div>

              {item.sourceUrl && (
                  <a 
                    href={item.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-2 md:flex-none flex items-center justify-center space-x-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-slate-200 active:scale-95 shadow-lg group"
                  >
                    <span>閱讀原文全文</span>
                    <ExternalLink size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
              )}
          </div>
        </div>
      </div>
    </article>
  );
};
