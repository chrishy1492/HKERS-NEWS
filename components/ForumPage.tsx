
import React, { useState, useContext, useMemo } from 'react';
import { 
  Search, Settings, LogOut, Layout, Shield, User as UserIcon,
  Bot, Globe, Languages, ExternalLink, Clock, MessageSquareOff,
  Sparkles, Compass, Gauge, Share2, Trash2, ThumbsUp, Heart, RefreshCw,
  Home, Gamepad2, Sparkle, AlertCircle, X, Terminal
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
  const { currentUser, posts, deletePost, toggleLike, logout, toggleTranslation } = useContext(DataContext);
  const [view, setView] = useState<ForumView>('home');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isFortuneModalOpen, setIsFortuneModalOpen] = useState(false);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

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

  const renderText = (post: Post, type: 'title' | 'content') => {
    if (post.isBot && post.isTranslated && post.translation) {
      return post.translation[type];
    }
    return post[type];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans selection:bg-blue-100">
      <FortuneModal isOpen={isFortuneModalOpen} onClose={() => setIsFortuneModalOpen(false)} />
      <PrayerModal isOpen={isPrayerModalOpen} onClose={() => setIsPrayerModalOpen(false)} />
      
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <button onClick={onBack} className="md:hidden p-2 text-gray-400 hover:text-blue-600"><Layout size={20}/></button>
             <div className="flex items-center cursor-pointer group" onClick={() => setView('home')}>
               <Logo className="w-8 h-8 md:w-10 md:h-10 mr-2 md:mr-3 shadow-sm group-hover:scale-110 transition-transform"/>
               <h1 className="text-xl md:text-2xl font-black text-blue-600 tracking-tighter italic">HKER論壇</h1>
             </div>
          </div>

          <div className="flex-1 mx-4 md:mx-10 relative max-w-xl">
            <input 
              type="text" 
              placeholder="搜尋新聞、戰略、情報..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
          </div>

          <div className="flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('profile')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><Settings size={20}/></button>
                <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><LogOut size={20}/></button>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-black shadow-md hover:bg-blue-700">登入</button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 container mx-auto md:px-4 py-4 max-w-7xl">
        
        {/* SIDEBAR */}
        <aside className="hidden md:block w-64 mr-6 space-y-4 shrink-0">
          {isAdmin && (
             <button onClick={() => setView('admin')} className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all transform hover:-translate-y-1">
                <Shield className="text-blue-400" size={20}/> 管理員控制台
             </button>
          )}

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <div className="text-[10px] font-black text-blue-600 mb-3 flex justify-between items-center uppercase border-b pb-2">
                <span>系統運行狀態</span>
                <span className="flex items-center gap-1 text-green-500 font-mono"><RefreshCw size={10} className="animate-spin-slow"/> REAL-TIME SYNC</span>
             </div>
             <div className="space-y-2">
                <button onClick={() => setView('divination')} className="w-full bg-purple-50 text-purple-700 p-3 rounded-xl shadow-sm font-bold flex items-center justify-center hover:bg-purple-100 transition-all group">
                  <Compass className="mr-2 group-hover:rotate-90 transition-transform" size={20} /> 算命導航區
                </button>
                <button onClick={() => setView('games')} className="w-full bg-amber-500 text-white p-3 rounded-xl shadow-md font-bold flex items-center justify-center hover:bg-amber-600 transition-all transform hover:-translate-y-1">
                  <Sparkles className="mr-2" size={20} /> 遊戲中心
                </button>
             </div>
          </div>
          <div className="space-y-2">
            <button onClick={() => setIsFortuneModalOpen(true)} className="w-full py-3 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-black hover:bg-indigo-200 transition-all shadow-sm">🔮 每日 AI 運程</button>
            <button onClick={() => setIsPrayerModalOpen(true)} className="w-full py-3 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-black hover:bg-yellow-200 transition-all shadow-sm">🙏 全球雲端祈福</button>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
            {view === 'admin' && isAdmin && <AdminPanel />}
            {view === 'games' && <GameCenter />}
            {view === 'divination' && <DivinationCenter />}
            {view === 'profile' && <UserProfile />}
            {view === 'login' && <LoginForm setView={setView} />}
            {view === 'register' && <RegisterForm setView={setView} />}

            {view === 'home' && (
              <div className="space-y-4 px-2 md:px-0">
                {/* FILTERS */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                         <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded shrink-0 uppercase tracking-tighter">區域</span>
                         <button onClick={() => setSelectedRegion(null)} className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${!selectedRegion ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>全部</button>
                         {REGIONS.map(r => (
                           <button key={r} onClick={() => setSelectedRegion(r)} className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${selectedRegion === r ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>{r}</button>
                         ))}
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-t pt-3">
                         <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded shrink-0 uppercase tracking-tighter">主題</span>
                         {TOPICS.map(t => (
                            <button key={t} onClick={() => setSelectedTopic(t === selectedTopic ? null : t)} className={`px-4 py-1.5 rounded-full text-xs font-black border transition-all whitespace-nowrap ${selectedTopic === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}>{t}</button>
                         ))}
                      </div>
                   </div>
                </div>

                {/* POSTS */}
                <div className="space-y-5">
                    {filteredPosts.map(post => (
                        <article key={post.id} className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${post.isBot ? 'border-indigo-100' : 'border-gray-200'}`}>
                          <div className="p-5 md:p-7">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${post.isBot ? 'bg-indigo-600' : 'bg-blue-100'}`}>
                                    {post.isBot ? <Bot className="text-white" size={28}/> : <UserIcon className="text-blue-600" size={26}/>}
                                  </div>
                                  <div>
                                      <div className="text-sm font-black flex items-center gap-2 text-gray-900 uppercase">
                                        {post.authorName} 
                                        {post.isBot && <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded font-black">AI ROBOT</span>}
                                      </div>
                                      <div className="text-[10px] text-gray-400 flex items-center gap-3 font-bold mt-1">
                                        <Clock size={12}/> {new Date(post.createdAt).toLocaleTimeString()}
                                        <span className="text-blue-600 px-2 py-0.5 bg-blue-50 rounded font-black">#{post.region}</span>
                                        <span className="text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded font-black">#{post.topic}</span>
                                      </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleTranslation(post.id)} className={`p-2 rounded-xl border transition-all ${post.isTranslated ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}><Languages size={20}/></button>
                                    {isAdmin && <button onClick={() => deletePost(post.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>}
                                </div>
                            </div>
                            
                            <h3 className="font-black text-xl text-gray-900 mb-4 leading-tight">{renderText(post, 'title')}</h3>
                            <div className="text-[15px] text-gray-700 mb-6 whitespace-pre-wrap leading-relaxed font-medium">
                              {renderText(post, 'content')}
                            </div>

                            {post.isBot && (
                              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-bold text-slate-500 space-y-2">
                                 <div className="flex items-center gap-2 text-blue-600"><ExternalLink size={14}/> 資訊來源: {post.sourceName}</div>
                                 <div className="flex items-center gap-2 text-amber-600"><Sparkle size={14}/> 本內容由 AI 合規生成，重點摘要自外部情報流。</div>
                              </div>
                            )}

                            <div className="flex items-center gap-6 text-xs font-black text-gray-500 border-t pt-5">
                                <button onClick={() => toggleLike(post.id, 'like')} className="flex items-center gap-2 hover:text-blue-600 transition-colors"><ThumbsUp size={20}/> {post.likes.length}</button>
                                <button onClick={() => toggleLike(post.id, 'love')} className="flex items-center gap-2 hover:text-pink-600 transition-colors"><Heart size={20}/> {post.loves.length}</button>
                            </div>
                          </div>
                        </article>
                    ))}
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};
