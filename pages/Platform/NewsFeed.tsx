
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Share2, Search, Clock, MessageSquareOff, Bot, ChevronLeft, ChevronRight, CloudLightning, ExternalLink, ShieldAlert, FileText, ShieldCheck, Languages, Trash2 } from 'lucide-react';
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
      await MockDB.triggerRobotPost();
      const data = await MockDB.getPosts();
      setPosts(data);
      setIsSyncing(false);
  };

  const handleManualSync = async () => {
      if (confirm("Force wake up Bot Agent?")) {
          setIsSyncing(true);
          await MockDB.triggerRobotPost(true); // Force True
          const data = await MockDB.getPosts();
          setPosts(data);
          setIsSyncing(false);
          alert("Bot Agent Triggered.");
      }
  };

  useEffect(() => {
    fetchData();
    const syncInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            fetchData();
        }
    }, 10000); 
    
    const handleWakeUp = () => {
        if (document.visibilityState === 'visible') {
            MockDB.triggerRobotPost().then(() => {
                fetchData();
            });
        }
    };

    document.addEventListener('visibilitychange', handleWakeUp);
    window.addEventListener('focus', handleWakeUp);

    return () => {
        clearInterval(syncInterval);
        document.removeEventListener('visibilitychange', handleWakeUp);
        window.removeEventListener('focus', handleWakeUp);
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
    
    const newPosts = [...posts];
    newPosts[postIndex] = post;
    setPosts(newPosts);
    
    await MockDB.savePost(post);
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
            <div onClick={handleManualSync} className="text-xs text-gray-400 font-bold flex items-center gap-1 cursor-pointer hover:text-blue-500 transition" title="Click to force sync">
                <CloudLightning size={12} className={isSyncing ? "text-blue-500 animate-pulse" : "text-green-500"}/>
                {isSyncing ? 'Syncing...' : 'Live Feed (Click to Refresh)'}
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
            const hasTranslation = post.titleCN && post.contentCN && post.titleCN.length > 0;
            const displayTitle = (isTranslated && hasTranslation) ? post.titleCN : post.title;
            const displayContent = (isTranslated && hasTranslation) ? post.contentCN : post.content;
            
            let displaySource = 'AI Source';
            if (typeof post.source === 'string' && post.source !== '[object Object]') {
                displaySource = post.source;
            }

            return (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-300">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        {post.isRobot ? (
                           <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 border border-blue-200">
                                <Bot size={20} />
                           </div>
                        ) : (
                           <div className="w-10 h-10 rounded-full flex items-center justify-center bg-hker-yellow text-black font-bold">
                                🦁
                           </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-gray-800">{post.author}</p>
                                {post.isRobot && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded font-bold border border-blue-100">AI AGENT</span>}
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
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 leading-tight">{displayTitle}</h3>
                    
                    {/* Robot Enhanced Content Display */}
                    {post.isRobot ? (
                        <div className="space-y-4">
                             <div className="flex items-center text-amber-700 font-bold text-xs uppercase tracking-wider">
                                  <FileText size={14} className="mr-1.5" />
                                  <span>AI Generated Summary • Copyright Protected</span>
                             </div>
                             
                             <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                                  <p className="text-gray-800 text-sm whitespace-pre-line leading-7 font-medium">
                                      {displayContent}
                                  </p>
                             </div>

                             {/* Source & Actions */}
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 rounded-lg mt-2">
                                  <div className="space-y-1">
                                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Original Source</p>
                                      <p className="text-sm text-gray-900 font-bold flex items-center gap-1">
                                          <ShieldCheck size={14} className="text-green-500" /> 
                                          {displaySource}
                                      </p>
                                  </div>
                                  
                                  <div className="flex gap-2 w-full md:w-auto">
                                      {post.sourceUrl && (
                                          <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none inline-flex justify-center items-center bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm">
                                              Visit Source <ExternalLink size={12} className="ml-2" />
                                          </a>
                                      )}
                                      <button 
                                          onClick={() => toggleTranslation(post.id)} 
                                          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm border ${isTranslated ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                      >
                                          <Languages size={14} /> {isTranslated ? 'Show Original' : 'Translate'}
                                      </button>
                                  </div>
                             </div>
                        </div>
                    ) : (
                        <p className="text-gray-700 text-sm leading-7 mb-4 whitespace-pre-line">{displayContent}</p>
                    )}

                    {/* Interactions */}
                    <div className="flex items-center justify-between pt-5 border-t border-gray-50 mt-4">
                        <div className="flex gap-6">
                            <button onClick={() => handleInteraction(post.id, 'heart')} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 group transition">
                                <Heart size={20} className={post.userInteractions?.[user?.id || '']?.hearts ? "fill-red-500 text-red-500" : "group-hover:scale-110 transition"} /> 
                                <span className="text-sm font-bold">{post.hearts}</span>
                            </button>
                            <button onClick={() => handleInteraction(post.id, 'like')} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 group transition">
                                <ThumbsUp size={20} className={post.userInteractions?.[user?.id || '']?.likes ? "fill-blue-500 text-blue-500" : "group-hover:scale-110 transition"} /> 
                                <span className="text-sm font-bold">{post.likes}</span>
                            </button>
                        </div>
                        {post.allow_comments === false ? (
                            <div className="flex items-center text-gray-400 text-xs font-medium italic">
                                <MessageSquareOff size={14} className="mr-1.5" />
                                Comments Off
                            </div>
                        ) : (
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
