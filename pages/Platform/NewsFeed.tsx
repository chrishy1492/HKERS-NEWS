
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Share2, Search, Clock, Bot, ChevronLeft, ChevronRight, CloudLightning, ExternalLink, ShieldCheck, Languages, MapPin, Tag, Trash2 } from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { Post, User, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, UserRole } from '../../types';

const ITEMS_PER_PAGE = 10;
const FORUM_URL = window.location.origin + '/#/platform';

const NewsCard: React.FC<{ post: Post, user: User | null, isAdmin: boolean, onInteract: (id: string, type: 'like' | 'heart') => void, onDelete: (id: string) => void }> = ({ post, user, isAdmin, onInteract, onDelete }) => {
    const [showCn, setShowCn] = useState(true); // Default to CN for HK platform
    
    // Toggle content
    const displayTitle = showCn ? (post.titleCN || post.title) : post.title;
    const displayContent = showCn ? (post.contentCN || post.content) : post.content;
    const isBot = post.isRobot;

    const handleShare = () => {
        const url = `${FORUM_URL}?post=${post.id}`;
        navigator.clipboard.writeText(url);
        alert("連結已複製 (Link Copied)");
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    {isBot ? (
                        <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                            <Bot size={14} /> <span>AI Agent</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold">
                            <span className="text-sm">🦁</span> <span>Member</span>
                        </div>
                    )}
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <MapPin size={12} /> {post.region}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                         <Tag size={12} /> {post.category}
                    </span>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {post.displayDate}
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">
                    {displayTitle}
                </h3>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-4">
                    {displayContent}
                </div>

                {isBot && post.sourceUrl && (
                    <div className="flex items-center gap-2 mt-4 text-xs">
                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded">Source: {post.source || 'Web'}</span>
                        <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition">
                            Verify Link <ExternalLink size={10} />
                        </a>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50/30 border-t border-gray-100 flex justify-between items-center">
                <div className="flex gap-4">
                     <button 
                        onClick={() => onInteract(post.id, 'like')} 
                        className={`flex items-center gap-1.5 text-xs font-bold transition hover:text-blue-600 ${post.userInteractions?.[user?.id || '']?.likes ? 'text-blue-600' : 'text-gray-500'}`}
                    >
                        <ThumbsUp size={16} className={post.userInteractions?.[user?.id || '']?.likes ? 'fill-current' : ''} /> {post.likes}
                    </button>
                    <button 
                        onClick={() => onInteract(post.id, 'heart')} 
                        className={`flex items-center gap-1.5 text-xs font-bold transition hover:text-red-600 ${post.userInteractions?.[user?.id || '']?.hearts ? 'text-red-600' : 'text-gray-500'}`}
                    >
                        <Heart size={16} className={post.userInteractions?.[user?.id || '']?.hearts ? 'fill-current' : ''} /> {post.hearts}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowCn(!showCn)} 
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition" 
                        title="Translate"
                    >
                        <Languages size={16} />
                    </button>
                    <button 
                        onClick={handleShare} 
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition" 
                        title="Share"
                    >
                        <Share2 size={16} />
                    </button>
                    {isAdmin && (
                        <button 
                            onClick={() => onDelete(post.id)} 
                            className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition" 
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const NewsFeed: React.FC = () => {
  const { user, lang } = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
      setIsSyncing(true);
      const data = await MockDB.getPosts();
      setPosts(data);
      setIsSyncing(false);
  };

  useEffect(() => {
    fetchData();
    const syncInterval = setInterval(fetchData, 8000); 
    const robotCheck = setInterval(() => { MockDB.triggerRobotPost(); }, 15000); // Trigger less frequently
    return () => { clearInterval(syncInterval); clearInterval(robotCheck); };
  }, []);

  const handleInteraction = async (postId: string, type: 'like' | 'heart') => {
    if (!user) {
        if(confirm(lang === 'cn' ? '請先登入！' : 'Please Login first!')) window.location.href = '#/platform/login';
        return;
    }
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = { ...posts[postIndex] };

    if (!post.userInteractions) post.userInteractions = {};
    if (!post.userInteractions[user.id]) post.userInteractions[user.id] = { likes: 0, hearts: 0 };

    if (type === 'like') {
        if (post.userInteractions[user.id].likes >= 3) return alert("Max 3 likes per post.");
        post.userInteractions[user.id].likes++;
        post.likes++;
    } else if (type === 'heart') {
        if (post.userInteractions[user.id].hearts >= 3) return alert("Max 3 hearts per post.");
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

  const handleDeletePost = async (postId: string) => {
      if (confirm("Confirm Delete?")) {
          await MockDB.deletePost(postId);
          fetchData();
      }
  };

  const filteredPosts = posts.filter(post => {
    const matchesRegion = selectedRegion === 'All' || post.region === selectedRegion;
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesCategory && matchesSearch;
  });

  const displayPosts = filteredPosts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR);

  return (
    <div className="max-w-5xl mx-auto px-2">
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    HKER News <span className="text-hker-red">Bot</span>
                </h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                    AI Automated Aggregation • Real-time
                </p>
            </div>
            <div className="flex items-center gap-3">
                 <div className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full flex items-center gap-1 border border-green-100">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    SYSTEM ONLINE
                 </div>
                 {isSyncing && <CloudLightning size={16} className="text-blue-500 animate-pulse"/>}
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search keywords..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-hker-red focus:ring-1 focus:ring-hker-red/20 transition"
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            
            {/* Quick Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                <select 
                    value={selectedRegion} 
                    onChange={e => setSelectedRegion(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm text-gray-700 outline-none focus:border-hker-red"
                >
                    <option value="All">Global Regions</option>
                    {REGIONS.map(r => <option key={r} value={r}>{REGIONS_CN[r] || r}</option>)}
                </select>

                <select 
                    value={selectedCategory} 
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm text-gray-700 outline-none focus:border-hker-red"
                >
                    <option value="All">All Topics</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORIES_CN[c] || c}</option>)}
                </select>
            </div>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {displayPosts.map(post => (
            <NewsCard 
                key={post.id} 
                post={post} 
                user={user} 
                isAdmin={!!isAdmin} 
                onInteract={handleInteraction}
                onDelete={handleDeletePost}
            />
        ))}
        {displayPosts.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="opacity-50"/>
                </div>
                <p>No news found matching your criteria.</p>
            </div>
        )}
      </div>

      {/* Pagination */}
      {filteredPosts.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center gap-4 pb-10">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 bg-white border rounded-full disabled:opacity-50 hover:bg-gray-50 shadow-sm transition"><ChevronLeft size={20} /></button>
            <span className="flex items-center font-bold text-gray-500">Page {currentPage}</span>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPosts.length/ITEMS_PER_PAGE), p + 1))} disabled={currentPage === Math.ceil(filteredPosts.length/ITEMS_PER_PAGE)} className="p-3 bg-white border rounded-full disabled:opacity-50 hover:bg-gray-50 shadow-sm transition"><ChevronRight size={20} /></button>
        </div>
      )}
    </div>
  );
};
