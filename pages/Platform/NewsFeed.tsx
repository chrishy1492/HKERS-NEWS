
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Share2, AlertTriangle, Search, Filter, Clock, MessageSquare, Bot, ChevronLeft, ChevronRight, Languages, Trash2, Send, X } from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { Post, User, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, UserRole, Comment } from '../../types';

const ITEMS_PER_PAGE = 10;

export const NewsFeed: React.FC = () => {
  const { user, lang } = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Comment System
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  
  const [translatedPosts, setTranslatedPosts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Initial Load & Real-time Sync
  useEffect(() => {
    // Catch up if app was closed
    MockDB.runCatchUpRoutine();

    // Initial fetch
    setPosts(MockDB.getPosts());

    // 1. DATA SYNC POLLING (Crucial for Mobile/Web sync in local env)
    const syncInterval = setInterval(() => {
        setPosts(MockDB.getPosts());
    }, 2000); // Check every 2 seconds for new updates

    // 2. ROBOT AUTOMATION (Simulated 24/7)
    const robotInterval = setInterval(() => {
        const batchSize = Math.floor(Math.random() * 2) + 1; 
        for(let i=0; i<batchSize; i++) {
            MockDB.triggerRobotPost();
        }
        // State update handled by syncInterval
    }, 15000); // 15 seconds

    return () => {
        clearInterval(syncInterval);
        clearInterval(robotInterval);
    };
  }, []);

  const handleInteraction = (postId: string, type: 'like' | 'heart' | 'view') => {
    if (!user) {
      if (type !== 'view') {
          if(confirm(lang === 'cn' ? '請先登入以進行互動並賺取積分！' : 'Please login to interact and earn points!')) navigate('/platform/login');
      }
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (type === 'like') post.likes++;
    if (type === 'heart') post.hearts++;
    
    // Optimistic UI Update
    setPosts([...posts]);
    MockDB.savePost(post);

    let pointsAwarded = 0;
    if (type === 'view') pointsAwarded = 200;
    if (type === 'like') pointsAwarded = 300;
    if (type === 'heart') pointsAwarded = 300;

    MockDB.updateUserPoints(user.id, pointsAwarded);
  };

  const handleSubmitComment = (postId: string) => {
      if (!user) return alert(lang === 'cn' ? "請先登入" : "Please login");
      if (!commentInput.trim()) return;

      MockDB.addComment(postId, user, commentInput);
      setCommentInput('');
      
      // Points for commenting (Requirement check: usually implies activity)
      MockDB.updateUserPoints(user.id, 200); 
      
      // Force refresh
      setPosts(MockDB.getPosts());
  };

  const handleDeletePost = (postId: string) => {
      if (confirm(lang === 'cn' ? "確定刪除此貼文？" : "Delete this post?")) {
          MockDB.deletePost(postId);
          setPosts(prev => prev.filter(p => p.id !== postId));
      }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
      if (confirm(lang === 'cn' ? "確定刪除此留言？" : "Delete this comment?")) {
          MockDB.deleteComment(postId, commentId);
          setPosts(MockDB.getPosts());
      }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/#/platform?post=${postId}`;
    navigator.clipboard.writeText(url);
    alert(lang === 'cn' ? `連結已複製！\n${url}` : `Link Copied!\n${url}`);
  };

  const handleReport = (postId: string) => {
    const reason = prompt(lang === 'cn' ? "舉報原因 (垃圾訊息, 假新聞, 濫用):" : "Reason for reporting (Spam, Fake News, Abuse):");
    if (reason) {
      alert(lang === 'cn' 
        ? `已收到關於貼子 ${postId} 的舉報。\n電郵: hkerstoken@gmail.com`
        : `Report sent to admins for Post ${postId}.\nEmail: hkerstoken@gmail.com`);
    }
  };

  const toggleTranslation = (postId: string) => {
      setTranslatedPosts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(postId)) {
              newSet.delete(postId);
          } else {
              newSet.add(postId);
          }
          return newSet;
      });
  };

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR;

  // Filter Logic
  const filteredPosts = posts.filter(post => {
    const matchesRegion = selectedRegion === 'All' || post.region === selectedRegion;
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const displayedPosts = filteredPosts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE, 
      currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  useEffect(() => {
      setCurrentPage(1); 
  }, [selectedRegion, selectedCategory, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Bar & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 sticky top-0 z-10 border border-gray-100">
        <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3">
                <Search className="text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder={lang === 'cn' ? "搜尋題目..." : "Search topics..."}
                    className="flex-1 bg-transparent p-2 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Region Selector */}
        <div className="flex overflow-x-auto gap-2 mb-3 pb-2 scrollbar-hide">
            <button 
                onClick={() => setSelectedRegion('All')}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-bold border transition ${selectedRegion === 'All' ? 'bg-hker-black text-white' : 'bg-white text-gray-600'}`}
            >
                {lang === 'cn' ? '全部' : 'ALL'}
            </button>
            {REGIONS.map(r => (
            <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-bold border transition ${selectedRegion === r ? 'bg-hker-red text-white border-hker-red' : 'bg-white text-gray-600'}`}
            >
                {lang === 'cn' ? REGIONS_CN[r] : r}
            </button>
            ))}
        </div>

        {/* Category Filter */}
        <div className="flex overflow-x-auto gap-2 pb-1">
            <button onClick={() => setSelectedCategory('All')} className={`px-2 py-1 rounded text-xs border ${selectedCategory === 'All' ? 'bg-gray-200 font-bold' : 'bg-white'}`}>
                {lang === 'cn' ? '全部' : 'All'}
            </button>
            {CATEGORIES.map(c => (
            <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2 py-1 rounded text-xs border whitespace-nowrap ${selectedCategory === c ? 'bg-gray-200 font-bold' : 'bg-white'}`}
            >
                {lang === 'cn' ? CATEGORIES_CN[c] : c}
            </button>
            ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6 pb-10">
        {filteredPosts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <Bot size={48} className="mx-auto text-gray-300 mb-4 animate-bounce" />
            <p className="text-gray-400 font-bold">{lang === 'cn' ? 'AI 機械人正在全速搜尋新聞...' : 'AI Robots are actively scanning...'}</p>
          </div>
        )}
        
        {displayedPosts.map(post => {
            const isTranslated = translatedPosts.has(post.id);
            const displayTitle = (isTranslated && post.titleCN) ? post.titleCN : post.title;
            const displayContent = (isTranslated && post.contentCN) ? post.contentCN : post.content;

            return (
              <div 
                key={post.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-300 animate-fade-in-up" 
                onMouseEnter={() => handleInteraction(post.id, 'view')}
              >
                {/* Post Header */}
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${post.isRobot ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-hker-yellow text-black border-yellow-400'}`}>
                            {post.isRobot ? <Bot size={20} /> : <span className="text-lg">🦁</span>}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-gray-800">{post.author}</p>
                                {post.isRobot && <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-500">{post.botId}</span>}
                                {post.authorId !== 'system-bot' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded font-mono">ID: {post.authorId.substring(0,8)}</span>}
                                <span className="text-[10px] border border-gray-300 px-1 rounded text-gray-500">{lang === 'cn' ? REGIONS_CN[post.region] || post.region : post.region}</span>
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> {post.displayDate}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                         <div className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-500 font-medium shadow-sm">
                            {lang === 'cn' ? CATEGORIES_CN[post.category] || post.category : post.category}
                        </div>
                        {canManage && (
                             <button onClick={() => handleDeletePost(post.id)} className="bg-red-100 p-1.5 rounded text-red-500 hover:bg-red-200" title="Delete Post">
                                 <Trash2 size={14} />
                             </button>
                        )}
                    </div>
                </div>

                {/* Post Content */}
                <div className="p-5">
                    <div className="flex justify-end mb-2">
                         <button 
                            onClick={() => toggleTranslation(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isTranslated ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-500'}`}
                         >
                             <Languages size={14} />
                             {isTranslated ? (lang === 'cn' ? '顯示原文 (Original)' : 'Show Original') : (lang === 'cn' ? '翻譯成中文' : 'Translate to Chinese')}
                         </button>
                    </div>

                    <h3 className="text-lg font-bold mb-4 text-gray-900 leading-tight">{displayTitle}</h3>
                    <p className="text-gray-700 text-sm leading-7 mb-4 whitespace-pre-line font-serif">{displayContent}</p>
                    
                    {post.source && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-amber-700">{lang === 'cn' ? '新聞來源: ' : 'Source: '}{post.source}</span>
                                <span className="text-amber-600 italic">{lang === 'cn' ? '只供參考' : 'For Reference Only'}</span>
                            </div>
                            <p className="text-amber-800/70">{lang === 'cn' ? '內容由自動化區域機械人生成。' : 'Content generated by automated regional bot.'}</p>
                        </div>
                    )}

                    {/* Interactions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-4">
                        <div className="flex gap-4">
                            <button onClick={() => handleInteraction(post.id, 'heart')} className="group flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition">
                                <div className="p-1.5 rounded-full group-hover:bg-red-50"><Heart size={18} /></div>
                                <span className="text-xs font-medium">{post.hearts}</span>
                            </button>
                            <button onClick={() => handleInteraction(post.id, 'like')} className="group flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition">
                                <div className="p-1.5 rounded-full group-hover:bg-blue-50"><ThumbsUp size={18} /></div>
                                <span className="text-xs font-medium">{post.likes}</span>
                            </button>
                            <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="group flex items-center gap-1.5 text-gray-500 hover:text-purple-500 transition">
                                <div className="p-1.5 rounded-full group-hover:bg-purple-50"><MessageSquare size={18} /></div>
                                <span className="text-xs font-medium">{post.replies?.length || 0}</span>
                            </button>
                            <button onClick={() => handleShare(post.id)} className="group flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition">
                                <div className="p-1.5 rounded-full group-hover:bg-green-50"><Share2 size={18} /></div>
                            </button>
                        </div>
                        
                        <button onClick={() => handleReport(post.id)} className="text-gray-300 hover:text-orange-500 flex items-center gap-1 text-xs" title="Report">
                            <AlertTriangle size={14} /> {lang === 'cn' ? '舉報' : 'Report'}
                        </button>
                    </div>
                </div>

                {/* Comment Section */}
                {expandedPostId === post.id && (
                    <div className="bg-gray-50 border-t border-gray-100 p-4 animate-fade-in-up">
                        {/* List */}
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                            {(!post.replies || post.replies.length === 0) && <p className="text-xs text-gray-400 italic text-center">No comments yet. Be the first!</p>}
                            {post.replies?.map(comment => (
                                <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200 text-sm relative group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-800 text-xs">{comment.author}</span>
                                        <div className="flex gap-2">
                                             <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleString()}</span>
                                             {canManage && (
                                                <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-red-300 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                             )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                        
                        {/* Input */}
                        <div className="flex gap-2">
                            <input 
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                placeholder={lang === 'cn' ? "撰寫回覆..." : "Write a reply..."}
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-hker-red"
                                onKeyDown={e => e.key === 'Enter' && handleSubmitComment(post.id)}
                            />
                            <button onClick={() => handleSubmitComment(post.id)} className="bg-hker-red text-white p-2 rounded-full hover:bg-red-700">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="bg-gray-50 px-5 py-2 text-[10px] text-gray-400 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-1 text-center md:text-left">
                   <span>{lang === 'cn' ? '瀏覽量' : 'Views'}: {post.views}</span>
                   <span>{lang === 'cn' ? '版權問題? 電郵: hkerstoken@gmail.com' : 'Copyright/Issues? Email: hkerstoken@gmail.com'}</span>
                </div>
              </div>
            );
        })}

        {/* Pagination Controls */}
        {filteredPosts.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center items-center gap-4 pt-4">
                <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-gray-600">
                    {lang === 'cn' ? `第 ${currentPage} 頁 / 共 ${totalPages} 頁` : `Page ${currentPage} of ${totalPages}`}
                </span>
                <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
