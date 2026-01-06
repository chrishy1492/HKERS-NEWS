
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Globe, ExternalLink, Clock, Bot, MessageSquareOff, FileText, ShieldCheck, Tag, MapPin, CalendarDays, Filter, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { Post, User, UserRole } from '../../types';

// --- FILTER MAPPING (Must match MockDatabase codes) ---
const CATEGORY_MAP: Record<string, string> = {
    'property': '地產 (Property)',
    'news': '時事 (News)',
    'finance': '財經 (Finance)',
    'digital': '數碼 (Tech)',
    'community': '社區 (Community)',
    'Real Estate': '地產', // Legacy compat
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
    'Hong Kong': '中國香港', // Legacy compat
    'Taiwan': '台灣',
    'UK': '英國'
};

export const NewsFeed: React.FC = () => {
  const { user, lang } = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAndFilterPosts = async () => {
      setLoading(true);
      // 1. Trigger Bot Check (Silent)
      await MockDB.triggerRobotPost();
      
      // 2. Get All Posts
      const allPosts = await MockDB.getPosts();
      
      // 3. Apply Strict Filters (Region + Topic + 36h Time Limit)
      const thirtySixHoursAgo = Date.now() - (36 * 60 * 60 * 1000);
      
      const filtered = allPosts.filter(p => {
          // Time Filter: Only Real News within 36h
          if (p.isRobot && p.timestamp < thirtySixHoursAgo) return false;

          // Region Filter
          if (selectedRegion !== 'all' && p.region !== selectedRegion) return false;

          // Topic Filter
          if (selectedTopic !== 'all' && p.category !== selectedTopic) return false;

          return true;
      });

      setPosts(filtered);
      setLoading(false);
  };

  useEffect(() => {
      fetchAndFilterPosts();
      
      // Auto-refresh every 15s to catch new bot posts
      const interval = setInterval(fetchAndFilterPosts, 15000);
      return () => clearInterval(interval);
  }, [selectedRegion, selectedTopic]); // Re-run when filters change

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
    
    // Optimistic Update
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
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* 24/7 ACTIVE BOT STATUS BAR */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Bot size={28} className="text-blue-600" />
              </div>
              <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <div className="text-sm font-black text-blue-900 flex items-center">
                AI BOT WORKER <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">24/7 ACTIVE</span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Continuous Global Scanning (Last 36h). Status: <span className="text-green-600 font-bold">ONLINE</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <ShieldCheck size={14} className="text-blue-500" />
            <span>MODE: DEEP ANALYSIS & VERIFICATION</span>
          </div>
      </div>

      {/* FILTER SYSTEM */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
            <Filter size={12} className="mr-2" /> Content Filter System
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-gray-400 mr-2 w-12">REGION:</span>
              <FilterBtn active={selectedRegion === 'all'} label="ALL" onClick={() => setSelectedRegion('all')} />
              {Object.entries(REGION_MAP).map(([code, label]) => (
                <FilterBtn key={code} active={selectedRegion === code} label={label} onClick={() => setSelectedRegion(code)} />
              ))}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-gray-400 mr-2 w-12">TOPIC:</span>
              <FilterBtn active={selectedTopic === 'all'} label="ALL" onClick={() => setSelectedTopic('all')} color="bg-indigo-600" />
              {Object.entries(CATEGORY_MAP).map(([code, label]) => (
                <FilterBtn key={code} active={selectedTopic === code} label={label} onClick={() => setSelectedTopic(code)} color="bg-indigo-600" />
              ))}
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
                <AlertCircle size={32} />
            </div>
            <p className="text-gray-500 font-black text-lg">No verified news in last 36h for this filter.</p>
            <button onClick={() => {setSelectedRegion('all'); setSelectedTopic('all');}} className="mt-6 text-blue-600 font-bold text-sm hover:underline">Reset Filters</button>
          </div>
      ) : (
          posts.map(post => (
            <NewsCard 
                key={post.id} 
                item={post} 
                lang={lang} 
                interactions={post.userInteractions?.[user?.id || ''] || { likes: 0, hearts: 0 }}
                onInteract={handleInteraction}
                onDelete={isAdmin ? handleDelete : undefined}
            />
          ))
      )}
    </div>
  );
};

const FilterBtn = ({ active, label, onClick, color = "bg-blue-600" }: any) => (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
        active 
          ? `${color} text-white shadow-md transform scale-105` 
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
);

const NewsCard = ({ item, lang, interactions, onInteract, onDelete }: any) => {
  const [expanded, setExpanded] = useState(false);
  const displayTitle = lang === 'cn' ? (item.titleCN || item.title) : (item.title || item.titleCN);
  const displaySummary = lang === 'cn' ? (item.contentCN || item.content) : (item.content || item.contentCN);
  
  // Verify Logic: If sourceUrl exists, we consider it verified by bot
  const isVerified = !!item.sourceUrl;
  
  // Length Check for Accordion
  const shouldShowExpand = displaySummary && displaySummary.length > 300;
  const truncatedSummary = !expanded && shouldShowExpand ? displaySummary.slice(0, 300) + '...' : displaySummary;

  const regionLabel = REGION_MAP[item.region] || item.region;
  const catLabel = CATEGORY_MAP[item.category] || item.category;

  const timeAgo = (timestamp: number) => {
    const diff = Math.abs(Date.now() - timestamp) / 36e5;
    if (diff < 1) return 'Just Now';
    return `${Math.floor(diff)}h ago`;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-500">
      {/* Header */}
      <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-50 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <MapPin size={10} className="mr-1" /> {regionLabel}
          </span>
          <span className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-100 uppercase tracking-widest">
            <Tag size={10} className="mr-1" /> {catLabel}
          </span>
          {isVerified && (
            <span className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black border border-green-100 uppercase tracking-widest">
              <ShieldCheck size={10} className="mr-1" /> VERIFIED
            </span>
          )}
        </div>
        <div className="flex items-center text-gray-400 font-bold text-[10px] gap-2">
          <Clock size={12} />
          {timeAgo(item.timestamp)}
          {onDelete && <button onClick={()=>onDelete(item.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 size={12}/></button>}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 space-y-6">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{displayTitle}</h2>

        <div className="space-y-4">
          <div className="flex items-center text-blue-800 font-black text-xs uppercase tracking-[0.2em] bg-blue-50 w-max px-3 py-1 rounded border border-blue-100">
            <FileText size={14} className="mr-2" /> AI DEEP ANALYSIS
          </div>
          
          <div className={`relative ${!expanded && shouldShowExpand ? 'max-h-[300px] overflow-hidden' : ''}`}>
            <p className="text-gray-800 text-base md:text-lg leading-relaxed whitespace-pre-line font-medium bg-slate-50 p-6 rounded-2xl border border-gray-100">
              {truncatedSummary}
            </p>
            {!expanded && shouldShowExpand && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>
            )}
          </div>

          {shouldShowExpand && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold text-xs transition-all shadow-sm"
            >
              {expanded ? (
                <>Collapse Content <ChevronUp size={14} /></>
              ) : (
                <>Read Full Analysis ({displaySummary.length - 300} chars) <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>

        {/* Source */}
        <div className="bg-gray-100/50 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 border-dashed">
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] block mb-1">SOURCE ORIGIN</span>
            <span className="text-sm font-bold text-gray-700 flex items-center">
                <Globe size={14} className="mr-2 text-blue-500" /> {item.source || 'Aggregated Data'}
            </span>
          </div>
          {item.sourceUrl && (
              <a 
                href={item.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-6 py-2 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95 group"
              >
                VISIT SOURCE <ExternalLink size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
          <div className="flex space-x-6">
            <InteractionBtn icon={ThumbsUp} count={interactions.likes} color="text-blue-600" onClick={() => onInteract(item.id, 'like')} label="Agree" />
            <InteractionBtn icon={Heart} count={interactions.hearts} color="text-red-600" onClick={() => onInteract(item.id, 'heart')} label="Support" />
          </div>
          {item.isRobot && (
            <div className="hidden sm:flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                <MessageSquareOff size={12} className="mr-1" /> Comments Locked
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InteractionBtn = ({ icon: Icon, count, color, onClick, label }: any) => (
  <button onClick={onClick} className="flex items-center gap-2 group">
    <div className={`p-2 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-all ${count > 0 ? color + ' shadow-sm' : 'text-gray-400'}`}>
        <Icon size={20} fill={count > 0 ? 'currentColor' : 'none'} />
    </div>
    <div className="flex flex-col items-start leading-none">
        <span className={`font-black text-sm ${count > 0 ? color : 'text-gray-400'}`}>{count || 0}</span>
    </div>
  </button>
);
