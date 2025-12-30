
import React, { useState, useContext, useMemo } from 'react';
import { 
  Search, Settings, LogOut, Layout, Shield, User as UserIcon,
  MessageSquare, ThumbsUp, Heart, X, AlertTriangle, Send,
  Bot, Globe, Languages, ExternalLink, Clock, MessageSquareOff,
  Sparkles, Compass, Gauge, Share2, Trash2, Link, RefreshCw
} from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import { ForumView, Post } from '../types';
import { REGIONS, TOPICS, ADMIN_EMAILS } from '../constants';
import { AdminPanel } from './AdminPanel';
import { GameCenter } from './GameCenter';
import { DivinationCenter } from './DivinationCenter';
import { LoginForm, RegisterForm } from './AuthForms';
import { UserProfile } from './UserProfile';
import { FortuneModal } from './FortuneModal';
import { PrayerModal } from './PrayerModal';
import { Logo } from './Logo';

interface ForumPageProps {
  onBack: () => void;
}

export const ForumPage: React.FC<ForumPageProps> = ({ onBack }) => {
  const { currentUser, posts, deletePost, toggleLike, logout, users, toggleTranslation } = useContext(DataContext);
  const [view, setView] = useState<ForumView>('home');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isFortuneModalOpen, setIsFortuneModalOpen] = useState(false);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isMod = currentUser?.role === 'moderator' || isAdmin;

  // Optimized Filter (Memoized for performance)
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchRegion = selectedRegion ? post.region === selectedRegion : true;
      const matchTopic = selectedTopic ? post.topic === selectedTopic : true;
      const matchSearch = searchQuery ? (
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;
      return matchRegion && matchTopic && matchSearch;
    });
  }, [posts, selectedRegion, selectedTopic, searchQuery]);

  const handleInteraction = (postId: number, type: 'like' | 'love') => {
    if (!currentUser) return alert("請先登入以互動 (Please Login to interact)");
    const success = toggleLike(postId, type);
    if (!success) {
      alert("每個帳戶對每個貼只能給 3 次心和 3 次讚！(Max 3 interactions limit reached)");
    }
  };

  const handleSharePost = (post: Post) => {
    const shareData = {
      title: post.title,
      text: `HKER Forum News: ${post.title}`,
      url: post.isBot ? post.sourceUrl : window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert("連結已複製到剪貼簿 (Link Copied)");
    }
  };

  const handleShareForum = () => {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: 'HKER Global Forum', url }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url);
        alert("論壇網址已複製！(Forum URL Copied)");
    }
  };

  const renderText = (post: Post, type: 'title' | 'content') => {
    if (post.isBot && post.isTranslated && post.translation) {
      return post.translation[type];
    }
    return post[type];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <FortuneModal isOpen={isFortuneModalOpen} onClose={() => setIsFortuneModalOpen(false)} />
      <PrayerModal isOpen={isPrayerModalOpen} onClose={() => setIsPrayerModalOpen(false)} />
      
      {/* Navigation Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
             <button onClick={onBack} className="md:hidden p-2 text-gray-500 hover:text-blue-600 transition-colors"><Layout size={20}/></button>
             <div className="flex items-center cursor-pointer group" onClick={() => setView('home')}>
               <Logo className="w-8 h-8 md:w-10 md:h-10 mr-2 md:mr-3 shadow-sm group-hover:shadow-md transition-all"/>
               <h1 className="text-lg md:text-2xl font-bold text-blue-600 tracking-tight">HKER論壇</h1>
             </div>
             <button onClick={handleShareForum} className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors" title="分享整個論壇">
                <Share2 size={18}/>
             </button>
          </div>

          <div className="flex-1 mx-2 md:mx-8 relative max-w-xl">
            <input 
              type="text" 
              placeholder="搜尋文章關鍵字..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 md:py-2 text-sm border rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-2.5 top-2.2 md:top-2.5 text-gray-400" size={16} />
          </div>

          <div className="flex items-center space-x-2">
            {currentUser ? (
              <>
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="font-bold text-xs flex items-center text-gray-800">
                    {currentUser.starLevel > 0 && <span className="text-yellow-500 mr-1">{'★'.repeat(currentUser.starLevel)}</span>}
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-blue-600 font-mono font-bold tracking-tighter">{currentUser.points.toLocaleString()} PTS</span>
                </div>
                <div className="flex space-x-1">
                    {isAdmin && (
                        <button onClick={() => setView('admin')} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" title="管理後台">
                            <Gauge size={18}/>
                        </button>
                    )}
                    <button onClick={() => setView('profile')} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <Settings size={18}/>
                    </button>
                    <button onClick={logout} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <LogOut size={18}/>
                    </button>
                </div>
              </>
            ) : (
              <div className="flex text-xs font-bold gap-2">
                <button onClick={() => setView('login')} className="text-blue-600 hover:underline">登入</button>
                <button onClick={() => setView('register')} className="bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-sm hover:bg-blue-700 transition-colors">註冊</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 container mx-auto md:px-4 py-4 max-w-7xl">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 mr-6 space-y-4 flex-shrink-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
             <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-3 border-b pb-2">
                <span>系統狀態</span>
                <span className="flex items-center gap-1"><RefreshCw size={10} className="animate-spin-slow"/> 即時同步中</span>
             </div>
             <div className="space-y-3">
                <button onClick={() => setView('divination')} className="w-full bg-white border-2 border-purple-100 text-purple-700 p-3 rounded-xl shadow-sm font-bold flex items-center justify-center hover:bg-purple-50 transition-all group">
                  <Compass className="mr-2 group-hover:rotate-45 transition-transform" size={20} /> 算命導航
                </button>
                <button onClick={() => setView('games')} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white p-3 rounded-xl shadow-md font-bold flex items-center justify-center hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <Sparkles className="mr-2" size={20} /> 遊戲中心
                </button>
             </div>
          </div>
          <div className="space-y-2">
             <button onClick={() => setIsFortuneModalOpen(true)} className="w-full py-2.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors">🔮 每日 AI 運程</button>
             <button onClick={() => setIsPrayerModalOpen(true)} className="w-full py-2.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-bold hover:bg-yellow-200 transition-colors">🙏 全球雲端祈福</button>
          </div>
          <div className="p-4 bg-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed">
             <h4 className="font-bold text-slate-700 mb-1 uppercase tracking-widest">Notice</h4>
             所有資料已在網頁與手機版同步。機械人24小時活躍中，為您提供全球資訊。
          </div>
        </aside>

        {/* Mobile Quick Navigation */}
        <div className="md:hidden flex justify-around bg-white p-2 mb-4 shadow-sm text-[10px] font-black text-gray-500 sticky top-16 z-30 border-b overflow-x-auto no-scrollbar">
           <button onClick={() => setView('divination')} className="flex flex-col items-center min-w-[50px]"><Compass size={20} className="text-purple-500 mb-0.5"/>算命</button>
           <button onClick={() => setView('games')} className="flex flex-col items-center min-w-[50px]"><Sparkles size={20} className="text-amber-500 mb-0.5"/>遊戲</button>
           <button onClick={() => setIsFortuneModalOpen(true)} className="flex flex-col items-center min-w-[50px]"><Clock size={20} className="text-indigo-500 mb-0.5"/>運程</button>
           <button onClick={() => setIsPrayerModalOpen(true)} className="flex flex-col items-center min-w-[50px]"><Heart size={20} className="text-red-500 mb-0.5"/>祈福</button>
           <div className="w-px h-8 bg-gray-200 self-center mx-1"></div>
           <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex flex-col items-center min-w-[50px]"><RefreshCw size={20} className="text-blue-500 mb-0.5"/>頂部</button>
        </div>

        {/* Main Content (The Articles) */}
        <main className="flex-1 min-w-0 bg-white md:bg-transparent rounded-lg">
            {view === 'admin' && isAdmin && <AdminPanel />}
            {view === 'games' && <GameCenter />}
            {view === 'divination' && <DivinationCenter />}
            {view === 'profile' && <UserProfile />}
            {view === 'login' && <LoginForm setView={setView} />}
            {view === 'register' && <RegisterForm setView={setView} />}

            {view === 'home' && (
              <div className="flex flex-col space-y-4 px-2 md:px-0">
                
                {/* Global Filters */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                         <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-md shrink-0 uppercase tracking-tighter">區域 REGION</span>
                         <button onClick={() => setSelectedRegion(null)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${!selectedRegion ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>全部</button>
                         {REGIONS.map(r => (
                           <button key={r} onClick={() => setSelectedRegion(r)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedRegion === r ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{r}</button>
                         ))}
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-t pt-2">
                         <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-md shrink-0 uppercase tracking-tighter">主題 TOPIC</span>
                         {TOPICS.map(t => (
                            <button key={t} onClick={() => setSelectedTopic(t === selectedTopic ? null : t)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${selectedTopic === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>{t}</button>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Article Feed - Sync and Realtime */}
                <div className="space-y-4 pb-20">
                    {filteredPosts.length === 0 ? (
                      <div className="bg-white p-12 rounded-xl text-center border border-dashed border-gray-300">
                        <MessageSquareOff size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 font-bold">目前該篩選條件下暫無文章</p>
                        <p className="text-xs text-gray-300 mt-1">機械人正在整理資訊中，請稍候...</p>
                      </div>
                    ) : (
                      filteredPosts.map(post => (
                        <article key={post.id} className={`bg-white rounded-xl shadow-sm border transition-all ${post.isBot ? 'border-indigo-100 hover:border-indigo-300' : 'border-gray-200'} p-4 md:p-5 overflow-hidden group`}>
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                {post.isBot ? (
                                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-inner"><Bot size={22} className="text-white"/></div>
                                ) : (
                                  <img src={users.find(u=>u.id===post.authorId)?.avatar} className="w-10 h-10 rounded-full bg-gray-100 border shadow-sm" alt="U"/>
                                )}
                                <div>
                                    <div className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                                      {post.authorName} 
                                      {post.isBot && <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">ROBOT AI</span>}
                                      {!post.isBot && isAdmin && <span className="text-[9px] text-gray-400 bg-gray-100 px-1 rounded">ID:{post.authorId}</span>}
                                    </div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-2 font-medium">
                                      <span className="flex items-center gap-1"><Clock size={10}/> {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                      <span className="text-blue-600 font-bold">{post.region}</span>
                                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                      <span className="text-indigo-500 font-bold">{post.topic}</span>
                                    </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleSharePost(post)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all" title="分享此文章"><Share2 size={16}/></button>
                                  {(isMod || (currentUser && currentUser.id === post.authorId)) && (
                                    <button onClick={() => {if(confirm("確定刪除此文章？")) deletePost(post.id)}} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="刪除文章"><Trash2 size={16}/></button>
                                  )}
                              </div>
                          </div>
                          
                          <h3 className="font-black text-lg text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{renderText(post, 'title')}</h3>
                          <div className="text-sm text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed tracking-wide font-normal bg-gray-50/50 p-3 rounded-lg border border-gray-100 italic md:not-italic">{renderText(post, 'content')}</div>

                          {post.isBot && (
                            <div className="mb-4 pt-3 border-t border-indigo-50 flex flex-col md:flex-row gap-2.5 text-[10px]">
                               <div className="flex flex-wrap gap-2 items-center">
                                  <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 font-bold hover:bg-indigo-100 transition-all">
                                    <Globe size={11} className="mr-1.5"/> 來源: {post.sourceName} <ExternalLink size={10} className="ml-1.5"/>
                                  </a>
                                  <span className="text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold flex items-center gap-1.5 shadow-sm">
                                     <Sparkles size={11} className="text-amber-500"/> 此文章由機械人 AI 自動重點編寫 (防止版權問題)
                                  </span>
                               </div>
                               <span className="text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 font-black md:ml-auto shadow-sm">
                                 💰 互動獎勵 150 HKER
                               </span>
                            </div>
                          )}

                          <div className="flex items-center gap-5 text-xs font-bold text-gray-500 border-t border-gray-100 pt-3">
                              <button 
                                onClick={() => handleInteraction(post.id, 'like')} 
                                className={`flex items-center gap-1.5 transition-all ${post.likes.includes(currentUser?.id || '') ? 'text-blue-600 scale-110' : 'hover:text-blue-500'}`}
                              >
                                <ThumbsUp size={16} fill={post.likes.includes(currentUser?.id || '') ? "currentColor" : "none"}/> {post.likes.length}
                              </button>
                              <button 
                                onClick={() => handleInteraction(post.id, 'love')} 
                                className={`flex items-center gap-1.5 transition-all ${post.loves.includes(currentUser?.id || '') ? 'text-pink-600 scale-110' : 'hover:text-pink-500'}`}
                              >
                                <Heart size={16} fill={post.loves.includes(currentUser?.id || '') ? "currentColor" : "none"}/> {post.loves.length}
                              </button>
                              
                              {post.isBot && (
                                <button 
                                  onClick={() => toggleTranslation(post.id)} 
                                  className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all font-black ${post.isTranslated ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100'}`}
                                >
                                  <Languages size={14}/> {post.isTranslated ? '顯示原文 (EN)' : '一鍵翻譯 (繁中)'}
                                </button>
                              )}
                          </div>

                          {/* Static Placeholder for comments (Requirement 1) */}
                          <div className="mt-4 text-[10px] text-gray-400 text-center border-t border-dashed border-gray-100 pt-3 font-bold flex items-center justify-center gap-1.5">
                             <MessageSquareOff size={11}/> 
                             為了社群質量，留言回覆功能已暫時關閉
                          </div>
                        </article>
                      ))
                    )}
                </div>
              </div>
            )}
        </main>
      </div>
      
      {/* Footer Info */}
      <footer className="bg-slate-900 text-slate-500 py-8 text-center text-[10px] px-4 mt-auto border-t border-white/5">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center mb-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
              <Logo className="w-12 h-12" />
            </div>
            <p className="font-black text-slate-300 mb-2 tracking-widest uppercase">© 2025 HKER GLOBAL ECOSYSTEM</p>
            <div className="bg-slate-800/50 p-4 rounded-xl mb-4 border border-white/5 inline-block text-left max-w-md">
              <p className="text-white font-bold mb-1">📢 專業工程聲明 (Professional Notice)</p>
              <p>本系統已實現全自動 24/7 即時同步。手機端與網頁版共享同一個 Supabase 實時數據庫架構。無論您身處何地，資訊均為 100% 同步更新。</p>
            </div>
            <p className="mb-1 leading-relaxed">免責聲明：所有 HKER Token 積分僅為虛擬互動用途，送完即止。用戶不得對虛擬積分進行法律追究。</p>
            <p className="opacity-50">聯絡管理員: {ADMIN_EMAILS[1]}</p>
          </div>
      </footer>
    </div>
  );
};
