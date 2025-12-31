
import React, { useState, useContext } from 'react';
import { 
  Search, Settings, LogOut, Layout, Shield, User as UserIcon,
  MessageSquare, ThumbsUp, Heart, X, AlertTriangle, Send,
  Bot, Globe, Languages, ExternalLink, Clock, MessageSquareOff,
  Sparkles, Compass, Gauge, Share2, Trash2, Link
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

  const filteredPosts = posts.filter(post => {
    const matchRegion = selectedRegion ? post.region === selectedRegion : true;
    const matchTopic = selectedTopic ? post.topic === selectedTopic : true;
    const matchSearch = searchQuery ? (post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase())) : true;
    return matchRegion && matchTopic && matchSearch;
  });

  const handleInteraction = (postId: number, type: 'like' | 'love') => {
    if (!currentUser) return alert("請先登入 (Please Login First)");
    const success = toggleLike(postId, type);
    if (!success) {
      alert("每個帳戶對每個貼只能給 3 次心和 3 次讚！(Max 3 interactions limit)");
    }
  };

  const handleSharePost = (post: Post) => {
    const shareData = {
      title: post.title,
      text: `HKER Forum: ${post.title}`,
      url: post.isBot ? post.sourceUrl : window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert("連結已複製 (Link Copied)");
    }
  };

  const handleShareForum = () => {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: 'HKER Forum', url }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url);
        alert("論壇地址已複製！(Forum URL Copied)");
    }
  };

  const renderText = (post: Post, type: 'title' | 'content') => {
    // If bot post and translation toggle is ON, show the stored translation
    if (post.isBot && post.isTranslated && post.translation) {
      return post.translation[type];
    }
    // Default to original (English for bots)
    return post[type];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <FortuneModal isOpen={isFortuneModalOpen} onClose={() => setIsFortuneModalOpen(false)} />
      <PrayerModal isOpen={isPrayerModalOpen} onClose={() => setIsPrayerModalOpen(false)} />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
             <button onClick={onBack} className="md:hidden p-2 text-gray-500"><Layout size={20}/></button>
             <div className="flex items-center cursor-pointer group" onClick={() => setView('home')}>
               <Logo className="w-8 h-8 md:w-10 md:h-10 mr-2 md:mr-3 shadow-sm group-hover:shadow-md transition-shadow"/>
               <h1 className="text-lg md:text-2xl font-bold text-blue-600">論壇</h1>
             </div>
             <button onClick={handleShareForum} className="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition-colors" title="分享論壇">
                <Share2 size={18}/>
             </button>
          </div>

          <div className="flex-1 mx-2 md:mx-8 relative max-w-xl">
            <input 
              type="text" 
              placeholder="搜尋..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 md:py-2 text-sm border rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <Search className="absolute left-2.5 top-2 md:top-2.5 text-gray-400" size={16} />
          </div>

          <div className="flex items-center space-x-2">
            {currentUser ? (
              <>
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="font-bold text-xs flex items-center text-gray-800">
                    {currentUser.starLevel > 0 && <span className="text-yellow-500 mr-1">{'★'.repeat(currentUser.starLevel)}</span>}
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-blue-600 font-mono font-bold">{currentUser.points.toLocaleString()}</span>
                </div>
                <div className="flex space-x-1">
                    {isAdmin && (
                        <button onClick={() => setView('admin')} className="p-1.5 bg-red-100 text-red-600 rounded-full" title="操作台">
                            <Gauge size={18}/>
                        </button>
                    )}
                    <button onClick={() => setView('profile')} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
                        <Settings size={18}/>
                    </button>
                    <button onClick={logout} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
                        <LogOut size={18}/>
                    </button>
                </div>
              </>
            ) : (
              <div className="flex text-xs font-bold gap-2">
                <button onClick={() => setView('login')} className="text-blue-600">登入</button>
                <button onClick={() => setView('register')} className="bg-blue-600 text-white px-3 py-1 rounded-full">註冊</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 container mx-auto md:px-4 py-4 max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 mr-6 space-y-4 flex-shrink-0">
          <button onClick={() => setView('divination')} className="w-full bg-white border-2 border-purple-200 text-purple-700 p-4 rounded-xl shadow-sm font-bold text-lg flex items-center justify-center hover:bg-purple-50 transition-all">
            <Compass className="mr-2" /> 算命區
          </button>
          <button onClick={() => setView('games')} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 rounded-xl shadow-md font-bold text-lg flex items-center justify-center hover:shadow-lg hover:-translate-y-1 transition-all">
            <span className="mr-2">🎮</span> 遊戲中心
          </button>
          <div className="space-y-2">
             <button onClick={() => setIsFortuneModalOpen(true)} className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">🔮 每日運程</button>
             <button onClick={() => setIsPrayerModalOpen(true)} className="w-full py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-bold">🙏 雲端祈福</button>
          </div>
        </aside>

        {/* Mobile Nav */}
        <div className="md:hidden flex justify-around bg-white p-2 mb-4 shadow-sm text-xs font-bold text-gray-600 sticky top-16 z-30">
           <button onClick={() => setView('divination')} className="flex flex-col items-center"><Compass size={20} className="text-purple-500"/>算命</button>
           <button onClick={() => setView('games')} className="flex flex-col items-center"><Sparkles size={20} className="text-amber-500"/>遊戲</button>
           <button onClick={() => setIsFortuneModalOpen(true)} className="flex flex-col items-center"><Clock size={20} className="text-indigo-500"/>運程</button>
           <button onClick={() => setIsPrayerModalOpen(true)} className="flex flex-col items-center"><Heart size={20} className="text-red-500"/>祈福</button>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-white md:bg-transparent rounded-lg">
            {view === 'admin' && isAdmin && <AdminPanel />}
            {view === 'games' && <GameCenter />}
            {view === 'divination' && <DivinationCenter />}
            {view === 'profile' && <UserProfile />}
            {view === 'login' && <LoginForm setView={setView} />}
            {view === 'register' && <RegisterForm setView={setView} />}

            {view === 'home' && (
              <div className="flex flex-col space-y-4 px-2 md:px-0">
                
                {/* Filters */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                         <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">地區</span>
                         <button onClick={() => setSelectedRegion(null)} className={`px-2 py-0.5 rounded text-xs ${!selectedRegion ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>全部</button>
                         {REGIONS.map(r => (
                           <button key={r} onClick={() => setSelectedRegion(r)} className={`px-2 py-0.5 rounded text-xs ${selectedRegion === r ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>{r}</button>
                         ))}
                      </div>
                      <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto no-scrollbar">
                         <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">主題</span>
                         {TOPICS.map(t => (
                            <button key={t} onClick={() => setSelectedTopic(t === selectedTopic ? null : t)} className={`px-2 py-0.5 rounded text-xs border ${selectedTopic === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>{t}</button>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Post List */}
                <div className="space-y-4 pb-10">
                    {filteredPosts.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">暫無帖子</div>}
                    
                    {filteredPosts.map(post => (
                      <div key={post.id} className={`bg-white rounded-xl shadow-sm border ${post.isBot ? 'border-indigo-100 bg-indigo-50/10' : 'border-gray-200'} p-4`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {post.isBot ? (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><Bot size={20} className="text-indigo-600"/></div>
                              ) : (
                                <img src={users.find(u=>u.id===post.authorId)?.avatar} className="w-8 h-8 rounded-full bg-gray-100 border" alt="avatar"/>
                              )}
                              <div>
                                  <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                    {post.authorName} 
                                    {post.isBot && <span className="bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">ROBOT</span>}
                                    {!post.isBot && isAdmin && <span className="text-[10px] text-gray-400">ID:{post.authorId}</span>}
                                  </div>
                                  <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                    {new Date(post.createdAt).toLocaleDateString()} · {post.region}
                                  </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleSharePost(post)} className="text-gray-400 hover:text-blue-500" title="分享帖子"><Share2 size={16}/></button>
                                {/* Admin/Mod Delete Button */}
                                {(isMod || (currentUser && currentUser.id === post.authorId)) && (
                                  <button onClick={() => {if(confirm("刪除此貼？")) deletePost(post.id)}} className="text-gray-300 hover:text-red-500" title="移除帖子"><Trash2 size={16}/></button>
                                )}
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-base mb-1">{renderText(post, 'title')}</h3>
                        <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{renderText(post, 'content')}</div>

                        {post.isBot && (
                          <div className="mb-3 pt-2 border-t border-indigo-100 flex flex-col md:flex-row gap-2 text-[10px]">
                             <div className="flex flex-wrap gap-2 items-center">
                                <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100">
                                  <Globe size={10} className="mr-1"/> 來源: {post.sourceName} <ExternalLink size={8} className="ml-1"/>
                                </a>
                                <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center">
                                   🤖 此新聞是機械人自動編寫 (Auto-generated by Robot)
                                </span>
                             </div>
                             <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded md:ml-auto w-fit">
                               💰 互動獎勵 150 HKER
                             </span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-2">
                            <button onClick={() => handleInteraction(post.id, 'like')} className={`flex items-center gap-1 ${post.likes.includes(currentUser?.id || '') ? 'text-blue-600 font-bold' : ''}`}>
                              <ThumbsUp size={14}/> {post.likes.length}
                            </button>
                            <button onClick={() => handleInteraction(post.id, 'love')} className={`flex items-center gap-1 ${post.loves.includes(currentUser?.id || '') ? 'text-pink-600 font-bold' : ''}`}>
                              <Heart size={14}/> {post.loves.length}
                            </button>
                            
                            {/* Requirement 2: Translate Button for Bot */}
                            {post.isBot && (
                              <button 
                                onClick={() => toggleTranslation(post.id)} 
                                className={`ml-auto flex items-center gap-1 px-2 py-1 rounded border transition-colors ${post.isTranslated ? 'bg-indigo-500 text-white border-indigo-500' : 'text-indigo-500 border-indigo-200 hover:bg-indigo-50'}`}
                              >
                                <Languages size={14}/> {post.isTranslated ? '顯示原文 (Show Original)' : '翻譯成中文 (Translate)'}
                              </button>
                            )}
                        </div>

                        {/* Existing Replies Display (ReadOnly) */}
                        {post.replies.length > 0 && (
                           <div className="bg-gray-50 mt-3 p-3 rounded-lg text-xs">
                              {post.replies.map(reply => (
                                 <div key={reply.id} className="mb-2 pb-2 border-b last:border-0 flex justify-between">
                                    <span><span className="font-bold text-blue-700">{reply.authorName}</span>: {reply.content}</span>
                                    {isMod && <button onClick={()=>alert("刪除回覆 (Admin)")} className="text-red-300 hover:text-red-500">x</button>}
                                 </div>
                              ))}
                           </div>
                        )}
                        
                        {/* Requirement 1: Reply Input UI REMOVED */}
                        <div className="mt-2 text-[10px] text-gray-400 text-center border-t border-dashed pt-2">
                           <MessageSquareOff size={10} className="inline mr-1"/> 
                           留言功能已關閉 (Comments Disabled)
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </main>
      </div>
      
      {/* Footer Disclaimer */}
      <footer className="bg-slate-800 text-slate-400 py-6 text-center text-[10px] px-4">
          <p className="font-bold text-slate-300 mb-1">© 2025 HKER Forum & Token.</p>
          <p>免責聲明：所有 HKER Token 積分僅為虛擬互動用途，送完即止。送完後不能獲取，用戶不得追究及投訴。</p>
          <p className="mt-1 opacity-50">管理員聯絡: {ADMIN_EMAILS[1]}</p>
      </footer>
    </div>
  );
};
