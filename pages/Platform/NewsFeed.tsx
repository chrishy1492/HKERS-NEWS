
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Share2, Search, Clock, MessageSquare, Bot, ChevronLeft, ChevronRight, CloudLightning, ExternalLink, ShieldAlert, Globe, Trash2, Languages } from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { Post, User, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, UserRole } from '../../types';

const ITEMS_PER_PAGE = 10;
const FORUM_URL = window.location.origin + '/#/platform';

export const NewsFeed: React.FC = () => {
  const { user, lang } = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Translation State per Post
  const [translatedPosts, setTranslatedPosts] = useState<Set<string>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
      setIsSyncing(true);
      const data = await MockDB.getPosts();
      setPosts(data);
      setIsSyncing(false);
  };

  useEffect(() => {
    // 1. Initial Load
    fetchData();
    MockDB.triggerRobotPost(); // Check immediately on load

    // 2. Regular Sync (Foreground)
    const syncInterval = setInterval(fetchData, 5000); 
    
    // 3. Robot Trigger Interval
    // Note: This may be throttled on mobile, so we rely on visibility change as backup
    const robotCheck = setInterval(() => {
        MockDB.triggerRobotPost();
    }, 20000); // Check every 20s

    // 4. Mobile Wake-up Handler (CRITICAL FIX)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            console.log("📱 Mobile Wake-up: Triggering Bot Check");
            MockDB.triggerRobotPost(); // Force check when user opens app/unlocks phone
            fetchData();
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        clearInterval(syncInterval);
        clearInterval(robotCheck);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
    
    // Cloud Save
    await MockDB.savePost(post);
    // Rewards
    await MockDB.updateUserPoints(user.id, 150);
  };

  const toggleTranslation = (postId: string) => {
      const newSet = new Set(translatedPosts);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      setTranslatedPosts(newSet);
  };

  const handleDeletePost = async (postId: string) => {
      if (confirm("Are you sure you want to remove this post?")) {
          await MockDB.deletePost(postId);
          fetchData();
      }
  };

  const handleShare = (post: Post) => {
      const url = `${FORUM_URL}?post=${post.id}`;
      navigator.clipboard.writeText(url);
      alert("Post Link Copied!");
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
    <div className="max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 sticky top-0 z-10 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <div className="text-xs text-gray-400 font-bold flex items-center gap-1">
                <CloudLightning size={12} className={isSyncing ? "text-blue-500 animate-pulse" : "text-green-500"}/>
                {isSyncing ? 'Syncing Cloud...' : 'Live Connected'}
            </div>
            {isAdmin && (
                <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">Admin Mode Active</div>
            )}
        </div>

        <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3">
                <Search className="text-gray-400" size={18} />
                <input type="text" placeholder="Search topics..." className="flex-1 bg-transparent p-2 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>
        
        {/* Regions */}
        <div className="flex overflow-x-auto gap-2 mb-2 pb-2 scrollbar-hide">
            <button onClick={() => setSelectedRegion('All')} className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-bold border ${selectedRegion === 'All' ? 'bg-hker-black text-white' : 'bg-white text-gray-600'}`}>ALL</button>
            {REGIONS.map(r => (
            <button key={r} onClick={() => setSelectedRegion(r)} className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-bold border ${selectedRegion === r ? 'bg-hker-red text-white' : 'bg-white text-gray-600'}`}>{lang === 'cn' ? REGIONS_CN[r] : r}</button>
            ))}
        </div>
        
        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory('All')} className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-bold border ${selectedCategory === 'All' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>ALL TOPICS</button>
            {CATEGORIES.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-bold border ${selectedCategory === c ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}>{lang === 'cn' ? CATEGORIES_CN[c] : c}</button>
            ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6 pb-10">
        {displayPosts.map(post => {
            const isTranslated = translatedPosts.has(post.id);
            const displayTitle = isTranslated && post.titleCN ? post.titleCN : post.title;
            const displayContent = isTranslated && post.contentCN ? post.contentCN : post.content;
            
            // Fix [object Object] by explicitly handling the source and excluding corrupted data
            let displaySource = 'AI Source';
            if (typeof post.source === 'string' && post.source !== '[object Object]') {
                displaySource = post.source;
            }

            return (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-300">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${post.isRobot ? 'bg-blue-100 text-blue-600' : 'bg-hker-yellow text-black'}`}>
                            {post.isRobot ? <Bot size={20} /> : <span className="text-lg">🦁</span>}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-gray-800">{post.author}</p>
                                {post.isRobot && <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-500">AI AGENT</span>}
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> {post.displayDate} • {post.region} • {post.category}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => handleShare(post)} className="p-2 text-gray-400 hover:text-green-600"><Share2 size={16}/></button>
                         {isAdmin && (
                             <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                         )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 leading-tight">{displayTitle}</h3>
                    <p className="text-gray-700 text-sm leading-7 mb-4 whitespace-pre-line">{displayContent}</p>
                    
                    {/* Robot Tools */}
                    {post.isRobot && (
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-amber-700 flex items-center gap-1"><ShieldAlert size={12}/> AI Summary</span>
                                    {post.sourceUrl && (
                                        <a href={post.sourceUrl} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline font-bold"><ExternalLink size={12} /> Source Link</a>
                                    )}
                                </div>
                                <p className="text-amber-800/70 italic">Content summarized from {displaySource}. Please respect copyright.</p>
                            </div>
                            
                            <button 
                                onClick={() => toggleTranslation(post.id)} 
                                className="self-start flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold hover:bg-blue-100 transition"
                            >
                                <Languages size={14} /> {isTranslated ? 'Show Original (English)' : '翻譯成中文 (Translate)'}
                            </button>
                        </div>
                    )}

                    {/* Interactions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                        <div className="flex gap-6">
                            <button onClick={() => handleInteraction(post.id, 'heart')} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 group">
                                <Heart size={20} className={post.userInteractions?.[user?.id || '']?.hearts ? "fill-red-500 text-red-500" : "group-hover:scale-110 transition"} /> 
                                <span className="text-sm font-bold">{post.hearts}</span>
                            </button>
                            <button onClick={() => handleInteraction(post.id, 'like')} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 group">
                                <ThumbsUp size={20} className={post.userInteractions?.[user?.id || '']?.likes ? "fill-blue-500 text-blue-500" : "group-hover:scale-110 transition"} /> 
                                <span className="text-sm font-bold">{post.likes}</span>
                            </button>
                        </div>
                        {!post.isRobot && (
                            <div className="text-xs text-gray-400">
                                {post.replies?.length || 0} Comments
                            </div>
                        )}
                    </div>
                </div>
              </div>
            );
        })}

        {/* Pagination */}
        {filteredPosts.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-full disabled:opacity-50 hover:bg-gray-100"><ChevronLeft size={20} /></button>
                <span className="text-sm font-bold pt-2">{currentPage} / {Math.ceil(filteredPosts.length/ITEMS_PER_PAGE)}</span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPosts.length/ITEMS_PER_PAGE), p + 1))} disabled={currentPage === Math.ceil(filteredPosts.length/ITEMS_PER_PAGE)} className="p-2 border rounded-full disabled:opacity-50 hover:bg-gray-100"><ChevronRight size={20} /></button>
            </div>
        )}
      </div>
    </div>
  );
};
