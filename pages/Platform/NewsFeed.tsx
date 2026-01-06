
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Globe, ExternalLink, Clock, Bot, MessageSquareOff, FileText, ShieldCheck, Tag, MapPin, Filter, AlertTriangle, Link as LinkIcon, Info, Trash2 } from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { Post, User, UserRole } from '../../types';

// --- MAPPING CONFIGURATION ---
const CATEGORY_MAP: Record<string, string> = {
    'property': '地產',
    'news': '時事',
    'finance': '財經',
    'digital': '數碼',
    'community': '社區',
    'Real Estate': '地產', 
    'Current Affairs': '時事',
    'Finance': '財經'
};

const REGION_MAP: Record<string, string> = {
    'hk': '中國香港',
    'tw': '台灣',
    'uk': '英國',
    'us': '美國',
    'ca': '加拿大',
    'au': '澳洲',
    'eu': '歐洲',
    'Hong Kong': '中國香港', 
    'Taiwan': '台灣',
    'UK': '英國'
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* HEADER: SYSTEM STATUS & DISCLAIMER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm p-4 rounded-b-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-600 text-white p-2 rounded-lg"><ShieldCheck size={20}/></div>
            <h1 className="font-black text-xl tracking-tight text-slate-800">HKER 真新聞監測系統</h1>
          </div>
          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-pulse">
            ● 36H 實時處理中
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="text-amber-500 shrink-0" size={16} />
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            <strong>機械人發帖協議：</strong> 本系統僅提取新聞之「事實重點」與「關鍵數據」。嚴禁全文複製以防侵權。所有內容均經過 AI 二次編寫與結構化整理，並強制標註原文連結。
          </p>
        </div>
      </header>

      {/* FILTER SYSTEM */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <Filter size={12} className="mr-2" /> FILTER SYSTEM
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 mt-1 w-10">地區:</span>
              <FilterBtn active={selectedRegionCode === 'all'} label="全部" onClick={() => setSelectedRegionCode('all')} />
              {Object.entries(REGION_MAP).map(([code, label]) => {
                  if(code.length > 2 && code !== 'Hong Kong') return null; 
                  return <FilterBtn key={code} active={selectedRegionCode === code} label={label} onClick={() => setSelectedRegionCode(code)} />
              })}
            </div>
            
            <div className="flex items-start flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 mt-1 w-10">主題:</span>
              <FilterBtn active={selectedTopicCode === 'all'} label="全部" onClick={() => setSelectedTopicCode('all')} color="bg-indigo-600" />
              {Object.entries(CATEGORY_MAP).map(([code, label]) => {
                  if(code.length > 10) return null; 
                  return <FilterBtn key={code} active={selectedTopicCode === code} label={label} onClick={() => setSelectedTopicCode(code)} color="bg-indigo-600" />
              })}
            </div>
          </div>
      </div>

      {/* FEED CONTENT */}
      {loading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-bold animate-pulse text-sm">Bot aggregating latest 36h news...</p>
          </div>
      ) : posts.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Clock size={32} />
            </div>
            <p className="text-slate-500 font-black text-lg">目前無 36 小時內的真新聞重點</p>
            <p className="text-slate-400 text-xs mt-2">系統已過濾過期資訊。請嘗試更換地區。</p>
            <button onClick={()=>{setSelectedRegionCode('all'); setSelectedTopicCode('all');}} className="mt-6 text-blue-600 font-bold text-sm hover:underline">查看所有地區</button>
          </div>
      ) : (
          <div className="space-y-6">
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
      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
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
    <article className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex space-x-2">
          <span className="bg-white px-2 py-1 rounded-md text-[10px] font-black border border-slate-200 text-slate-500 flex items-center uppercase">
            <MapPin size={10} className="mr-1" /> {displayRegion}
          </span>
          <span className="bg-white px-2 py-1 rounded-md text-[10px] font-black border border-slate-200 text-slate-500 flex items-center uppercase">
            <Tag size={10} className="mr-1" /> {displayCategory}
          </span>
        </div>
        <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold text-slate-400 flex items-center">
              <Clock size={12} className="mr-1" /> {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            {onDelete && <button onClick={()=>onDelete(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button>}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-black leading-tight text-slate-800">{title}</h2>
        
        <div className="space-y-4">
          <div className="flex items-center text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md w-fit border border-emerald-100 uppercase tracking-widest">
            <Bot size={14} className="mr-2" /> 機械人處理：精簡資訊
          </div>

          {/* Structured Summary - Entity Extraction Mode */}
          {processedSummary.length > 0 ? (
              <div className="grid gap-3">
                {processedSummary.map((point: any, index: number) => (
                  <div key={index} className="flex items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="w-24 shrink-0 text-[10px] font-black text-slate-400 uppercase mt-0.5 tracking-wider">{point.label}</div>
                    <div className="text-sm font-bold text-slate-700 leading-snug">{point.detail}</div>
                  </div>
                ))}
              </div>
          ) : (
              // Fallback for legacy posts or manual posts
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-line">
                  {backgroundInfo}
              </div>
          )}

          {/* Context/Background */}
          {processedSummary.length > 0 && backgroundInfo && (
              <div className="bg-blue-50/50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed italic font-medium">{backgroundInfo}</p>
              </div>
          )}
        </div>

        {/* Source & Interaction */}
        <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center text-xs font-bold text-slate-400">
            <LinkIcon size={14} className="mr-2" />
            來源：<span className="text-slate-600">{item.source || 'Verified Source'}</span>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
              {item.sourceUrl && (
                  <a 
                    href={item.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 px-6 py-2.5 rounded-xl text-xs font-black transition-all group text-slate-700"
                  >
                    <span>閱讀原始完整文章</span>
                    <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
              )}
              
              <div className="flex space-x-2">
                <button onClick={()=>onInteract(item.id, 'like')} className={`p-2 rounded-full border transition ${interactions.likes>0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <ThumbsUp size={16} fill={interactions.likes>0?"currentColor":"none"}/>
                </button>
                <button onClick={()=>onInteract(item.id, 'heart')} className={`p-2 rounded-full border transition ${interactions.hearts>0 ? 'bg-red-50 border-red-200 text-red-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <Heart size={16} fill={interactions.hearts>0?"currentColor":"none"}/>
                </button>
              </div>
          </div>
        </div>
      </div>
    </article>
  );
};
