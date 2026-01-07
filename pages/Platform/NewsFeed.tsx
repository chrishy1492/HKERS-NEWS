
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Globe, ExternalLink, Clock, Bot, MapPin, Tag, Filter, AlertTriangle, Link as LinkIcon, Info, Trash2, Cpu, BarChart3, ShieldCheck, Share2, TrendingUp, Zap, Newspaper } from 'lucide-react';
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
      const thirtySixHoursAgo = Date.now() - (36 * 60 * 60 * 1000);
      
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
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      
      {/* HEADER: SYSTEM STATUS & DISCLAIMER */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-sm p-5 rounded-b-[2rem]">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200 ring-2 ring-blue-50">
              <ShieldCheck size={24}/>
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter leading-none text-slate-900">HKER INTEL</h1>
              <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mt-1 block">Global 36H Real-time Pulse</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bot Status</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
                正在掃描 CES 2026 與全球熱點
              </span>
            </div>
            <div className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
              2026-01-07
            </div>
          </div>
        </div>
      </header>

      {/* FILTER SYSTEM */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-8">
          {/* REGION FILTER */}
          <div className="space-y-4">
              <div className="flex items-center space-x-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                <MapPin size={16} className="text-blue-500"/> <span>地區定位過濾</span>
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
              <div className="flex items-center space-x-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                <Tag size={16} className="text-emerald-500"/> <span>內容主題頻道</span>
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
            <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest animate-pulse">正在提取全球 API 真實數據實體...</p>
          </div>
      ) : posts.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 space-y-8 shadow-inner">
            <div className="p-8 bg-slate-50 rounded-full w-fit mx-auto shadow-sm">
              <AlertTriangle size={56} className="text-slate-300" />
            </div>
            <div className="max-w-sm mx-auto space-y-3">
              <p className="text-slate-900 font-black text-2xl">目前無符合條件的真新聞</p>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                系統已自動過濾所有佔位模板。我們只顯示 36 小時內具備高資訊價值的報導。
              </p>
            </div>
            <button 
                onClick={()=>{setSelectedRegionCode('all'); setSelectedTopicCode('all');}} 
                className="px-10 py-4 bg-slate-900 text-white rounded-[2rem] text-sm font-black hover:bg-blue-600 shadow-xl transition-all active:scale-95"
            >
              重置過濾器以查看全球動態
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
    </div>
  );
};

const FilterBtn = ({ active, label, onClick, color = "bg-blue-600" }: any) => (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
        active 
          ? `${color} text-white shadow-lg shadow-blue-300 scale-105` 
          : 'bg-slate-50 text-slate-500 hover:bg-white hover:border-blue-300 border border-transparent'
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
  const backgroundInfo = item.background || (lang === 'cn' ? item.contentCN : item.content);

  return (
    <article className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
      {/* 頂部信息欄 */}
      <div className="px-10 py-6 bg-slate-50/70 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <span className="bg-white px-4 py-2 rounded-xl text-[11px] font-black border border-slate-200 text-blue-600 shadow-sm flex items-center">
            <Globe size={12} className="mr-2" /> {displayRegion}
          </span>
          <span className="bg-white px-4 py-2 rounded-xl text-[11px] font-black border border-slate-200 text-emerald-600 shadow-sm flex items-center">
            <Newspaper size={12} className="mr-2" /> {displayCategory}
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
        <h2 className="text-2xl md:text-3xl font-black leading-[1.2] text-slate-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center text-[11px] font-black text-blue-600 bg-blue-50 px-5 py-2.5 rounded-2xl w-fit border border-blue-100 uppercase tracking-widest shadow-sm">
            <Zap size={16} className="mr-2" /> 深度摘要提取 (Bot V5.0)
          </div>

          {/* 數據化清單 */}
          {processedSummary.length > 0 ? (
              <div className="grid gap-4">
                {processedSummary.map((point: any, index: number) => (
                  <div key={index} className="flex items-start bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:border-blue-200 hover:shadow-md group/point">
                    <div className="w-24 shrink-0 text-[10px] font-black text-slate-400 uppercase mt-1.5 tracking-widest group-hover/point:text-blue-600 transition-colors">{point.label}</div>
                    <div className="text-[16px] font-bold text-slate-700 leading-relaxed">{point.detail}</div>
                  </div>
                ))}
              </div>
          ) : (
              // Fallback for legacy
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                  {backgroundInfo}
              </div>
          )}

          {/* 專家背景/深度解析 */}
          {processedSummary.length > 0 && backgroundInfo && (
              <div className="bg-emerald-50/30 p-6 rounded-[2rem] flex items-start space-x-5 border border-emerald-100/50">
                <Info size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[15px] text-slate-600 font-medium leading-relaxed italic">
                  {backgroundInfo}
                </p>
              </div>
          )}
        </div>

        {/* 腳部來源與操作 */}
        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center text-xs font-bold text-slate-400 bg-slate-50 px-5 py-3 rounded-2xl">
            <LinkIcon size={14} className="mr-3" />
            認證來源：<span className="text-slate-800 ml-1 font-black underline decoration-blue-200 decoration-2">{item.source || 'Verified Source'}</span>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex space-x-2">
                <button onClick={()=>onInteract(item.id, 'like')} className={`p-4 rounded-2xl border transition-all ${interactions.likes>0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-blue-50 hover:text-blue-500'}`}>
                    <ThumbsUp size={20} fill={interactions.likes>0?"currentColor":"none"}/>
                </button>
                <button onClick={()=>onInteract(item.id, 'heart')} className={`p-4 rounded-2xl border transition-all ${interactions.hearts>0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-red-50 hover:text-red-500'}`}>
                    <Heart size={20} fill={interactions.hearts>0?"currentColor":"none"}/>
                </button>
              </div>

              {item.sourceUrl && (
                  <a 
                    href={item.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-2 md:flex-none flex items-center justify-center space-x-3 bg-slate-900 text-white px-12 py-5 rounded-[2rem] text-sm font-black transition-all hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-200 active:scale-95 shadow-xl group"
                  >
                    <span>完整報導全文</span>
                    <ExternalLink size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
              )}
          </div>
        </div>
      </div>
    </article>
  );
};
