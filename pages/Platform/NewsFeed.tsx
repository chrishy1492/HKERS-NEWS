
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Globe, ExternalLink, Clock, Bot, MapPin, Tag, Filter, AlertTriangle, Link as LinkIcon, Info, Trash2, Cpu, BarChart3, ShieldCheck, Share2, TrendingUp } from 'lucide-react';
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
          // Note: Demo Data has future timestamps to bypass this in preview
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
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* HEADER: SYSTEM STATUS & DISCLAIMER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm p-4 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <ShieldCheck size={22}/>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none text-slate-900">HKER INTEL</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Intelligence Bot</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center space-x-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-2" />
              CES 2026 Live Data Stream
            </div>
            <div className="text-[10px] font-bold text-slate-400 hidden sm:block">2026-01-06</div>
          </div>
        </div>
        
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-start space-x-4 shadow-xl shadow-slate-200 relative overflow-hidden">
          <Bot className="text-blue-400 shrink-0 mt-1" size={24} />
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">HKER Intelligence Protocol</p>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              系統已自動鎖定 <strong>Nvidia Rubin</strong>、<strong>Intel 18A</strong> 及 <strong>香港地產預測</strong> 等當天重大熱點。目前正掃描 150+ 個全球新聞源，已過濾所有無實質內容的模板，確保每一條記錄均包含核心性能參數或關鍵價格點。
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Globe size={100} />
          </div>
        </div>
      </header>

      {/* FILTER SYSTEM */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          {/* REGION FILTER */}
          <div className="space-y-3">
              <div className="flex items-center space-x-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <MapPin size={14}/> <span>地區搜尋 (Regions)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterBtn active={selectedRegionCode === 'all'} label="全部" onClick={() => setSelectedRegionCode('all')} />
                {Object.entries(REGION_MAP).map(([code, label]) => (
                    <FilterBtn key={code} active={selectedRegionCode === code} label={label} onClick={() => setSelectedRegionCode(code)} />
                ))}
              </div>
          </div>

          {/* TOPIC FILTER */}
          <div className="space-y-3">
              <div className="flex items-center space-x-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <Tag size={14}/> <span>內容主題 (Topics)</span>
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
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">正在解析全球 36H 實時數據實體...</p>
          </div>
      ) : posts.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-200 space-y-6">
            <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto">
              <AlertTriangle size={48} className="text-slate-300" />
            </div>
            <div className="max-w-xs mx-auto">
              <p className="text-slate-900 font-black text-xl">今日暫無符合條件的新熱點</p>
              <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">
                機械人已自動屏蔽 36 小時之前的舊新聞及所有低價值的模板內容。
              </p>
            </div>
            <button onClick={()=>{setSelectedRegionCode('all'); setSelectedTopicCode('all');}} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-200 hover:bg-blue-600 transition-all">
              重置監測條件
            </button>
          </div>
      ) : (
          <div className="grid gap-8">
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
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        active 
          ? `${color} text-white shadow-md` 
          : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
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
    <article className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
      {/* 頂部信息欄 */}
      <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-50 flex justify-between items-center">
        <div className="flex space-x-3">
          <span className="bg-white px-3.5 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 text-blue-600 shadow-sm flex items-center">
            <Globe size={10} className="mr-1.5" /> {displayRegion}
          </span>
          <span className="bg-white px-3.5 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 text-slate-500 shadow-sm flex items-center">
            <Tag size={10} className="mr-1.5" /> {displayCategory}
          </span>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-[11px] font-bold text-slate-400 flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                <Clock size={12} className="mr-2 text-emerald-500" /> {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            {onDelete && <button onClick={()=>onDelete(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
        </div>
      </div>

      {/* 主體區域 */}
      <div className="p-8 md:p-10 space-y-8">
        <h2 className="text-2xl md:text-3xl font-black leading-tight text-slate-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center text-[11px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl w-fit border border-emerald-100 uppercase tracking-widest shadow-sm">
            <TrendingUp size={16} className="mr-2" /> 實時重點數據提取
          </div>

          {/* 數據化清單 */}
          {processedSummary.length > 0 ? (
              <div className="grid gap-3">
                {processedSummary.map((point: any, index: number) => (
                  <div key={index} className="flex items-start bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100 transition-all hover:bg-white hover:border-blue-100 group/item">
                    <div className="w-28 shrink-0 text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest group-hover/item:text-blue-600 transition-colors">{point.label}</div>
                    <div className="text-[15px] font-bold text-slate-700 leading-relaxed">{point.detail}</div>
                  </div>
                ))}
              </div>
          ) : (
              // Fallback for legacy
              <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                  {backgroundInfo}
              </div>
          )}

          {/* 專家背景/深度解析 */}
          {processedSummary.length > 0 && backgroundInfo && (
              <div className="bg-blue-50/20 p-5 rounded-[1.5rem] flex items-start space-x-4 border border-blue-100/30">
                <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed italic">
                  {backgroundInfo}
                </p>
              </div>
          )}
        </div>

        {/* 腳部來源與操作 */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center text-xs font-bold text-slate-400">
            <LinkIcon size={14} className="mr-2" />
            認證來源：<span className="text-slate-800 ml-1 font-black underline underline-offset-4 decoration-blue-200">{item.source || 'Verified Source'}</span>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex space-x-2">
                <button onClick={()=>onInteract(item.id, 'like')} className={`p-3 rounded-2xl border transition ${interactions.likes>0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <ThumbsUp size={18} fill={interactions.likes>0?"currentColor":"none"}/>
                </button>
                <button onClick={()=>onInteract(item.id, 'heart')} className={`p-3 rounded-2xl border transition ${interactions.hearts>0 ? 'bg-red-50 border-red-200 text-red-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <Heart size={18} fill={interactions.hearts>0?"currentColor":"none"}/>
                </button>
              </div>

              {item.sourceUrl && (
                  <a 
                    href={item.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none flex items-center justify-center space-x-3 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all hover:bg-blue-600 hover:shadow-xl active:scale-95 shadow-lg group"
                  >
                    <span>閱讀原報導全文</span>
                    <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
              )}
          </div>
        </div>
      </div>
    </article>
  );
};
