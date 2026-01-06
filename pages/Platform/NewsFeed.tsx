
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Share2, Search, Clock, MessageSquareOff, Bot, ChevronLeft, ChevronRight, CloudLightning, ExternalLink, ShieldCheck, FileText, Tag, MapPin, CalendarDays, Globe, Trash2 } from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { Post, User, UserRole, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN } from '../../types';

const ITEMS_PER_PAGE = 10;
const FORUM_URL = window.location.origin + '/#/platform';

// Mapping for display labels
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
  'community': '社區活動',
  // Ensure compatibility with existing Chinese keys
  'Real Estate': '地產',
  'Current Affairs': '時事',
  'Finance': '財經',
  'Entertainment': '娛樂',
  'Travel': '旅遊',
  'Digital': '數碼',
  'Automotive': '汽車',
  'Religion': '宗教',
  'Offers': '優惠',
  'Campus': '校園',
  'Weather': '天氣',
  'Community': '社區活動'
};

const REGION_MAP: Record<string, string> = {
  'hk': '中國香港',
  'tw': '台灣',
  'uk': '英國',
  'us': '美國',
  'ca': '加拿大',
  'au': '澳洲',
  'eu': '歐洲',
  'jp': '日本',
  'kr': '韓國',
  // Ensure compatibility
  'Hong Kong': '中國香港',
  'Taiwan': '台灣',
  'UK': '英國',
  'USA': '美國',
  'Canada': '加拿大',
  'Australia': '澳洲',
  'Europe': '歐洲'
};

export const NewsFeed: React.FC = () => {
  const { user, lang } = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const handleDeletePost = async (postId: string) => {
      if (confirm("Are you sure you want to remove this post?")) {
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
    <div className="max-w-4xl mx-auto">
      {/* AI Bot Active Status Bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center text-sm text-gray-500 bg-white p-4 rounded-xl shadow-sm border border-blue-100 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-blue-700 font-bold">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>AI Robot Active Worker: 24/7/365</span>
            </div>
            <p className="text-xs text-gray-400 pl-4">System: Continuous Global News Crawling & Processing</p>
          </div>
          <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg">
            <span className="flex items-center text-blue-600 font-medium"><ShieldCheck size={14} className="mr-1"/> Copyright Protection Active</span>
            <span className="text-gray-300">|</span>
            <div onClick={handleManualSync} className="cursor-pointer flex items-center gap-1 hover:text-blue-500">
                 <CloudLightning size={14} className={isSyncing ? "text-blue-500 animate-pulse" : "text-gray-400"}/>
                 <span>{isSyncing ? 'Syncing...' : 'System Online'}</span>
            </div>
          </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 sticky top-0 z-10 border border-gray-100">
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
      <div className="space-y-8 pb-10">
        {displayPosts.map(post => (
            <NewsCard 
              key={post.id} 
              item={post} 
              lang={lang} 
              user={user}
              interactions={post.userInteractions?.[user?.id || ''] || { likes: 0, hearts: 0 }}
              onInteract={handleInteraction}
              onDelete={isAdmin ? handleDeletePost : undefined}
            />
        ))}

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

// --- Sub-Component: News Card ---
interface NewsCardProps {
    item: Post;
    lang: 'en' | 'cn';
    user: User | null;
    interactions: { likes: number, hearts: number };
    onInteract: (id: string, type: 'like' | 'heart') => void;
    onDelete?: (id: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, lang, user, interactions, onInteract, onDelete }) => {
  const displayTitle = lang === 'cn' ? (item.titleCN || item.title) : (item.title || item.titleCN);
  const displaySummary = lang === 'cn' ? (item.contentCN || item.content) : (item.content || item.contentCN);

  // Automatic Classification Mapping
  const regionName = REGION_MAP[item.region] || item.region || 'Global';
  const categoryName = CATEGORY_MAP[item.category] || item.category || 'General';

  const timeAgo = (timestamp: number) => {
    const diffInHours = Math.abs(Date.now() - timestamp) / 36e5;
    if (diffInHours < 1) return lang === 'cn' ? '剛剛發布' : 'Just now';
    if (diffInHours < 24) return lang === 'cn' ? `${Math.floor(diffInHours)} 小時前` : `${Math.floor(diffInHours)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Card Header with Tags */}
      <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          {item.isRobot && (
            <span className="flex items-center text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-full font-bold border border-blue-200">
              <Bot size={13} className="mr-1" />
              {lang === 'cn' ? 'AI 深度摘要 (非原文)' : 'AI Summary'}
            </span>
          )}
          
          <span className="flex items-center text-gray-700 bg-white px-2.5 py-1 rounded-md font-bold shadow-sm border border-gray-100">
            <MapPin size={12} className="mr-1 text-gray-400" />
            {regionName}
          </span>

          <span className="flex items-center text-indigo-700 bg-white px-2.5 py-1 rounded-md font-bold shadow-sm border border-indigo-100">
            <Tag size={12} className="mr-1 text-indigo-400" />
            {categoryName}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center text-gray-400 font-medium">
                <CalendarDays size={12} className="mr-1" />
                {timeAgo(item.timestamp)}
            </div>
            {onDelete && (
                 <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
            )}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
            {displayTitle}
          </h2>

          {/* Optional Image Placeholder if bot provides one, currently using generic fallback or none */}
          {/* If the bot provides 'image_url' (not standard in Post type but possible in future), we could render it. 
              For now, we stick to text-heavy professional layout as requested for summaries. */}

          <div className="space-y-5">
            <div className="flex items-center text-blue-800 font-extrabold text-sm tracking-wider uppercase">
              <FileText size={18} className="mr-2" />
              <span>{lang === 'cn' ? '機械人重點處理內文 (關鍵資訊提取)：' : 'AI Processed Content (Key Points):'}</span>
            </div>
            
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Bot size={80} />
              </div>
              <p className="text-gray-800 text-lg md:text-xl whitespace-pre-line leading-relaxed tracking-normal font-medium relative z-10">
                {displaySummary}
              </p>
            </div>
          </div>

          <div className="bg-gray-100/50 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-dashed border-gray-300">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">{lang === 'cn' ? '新聞來源 Source' : 'Original Source'}</p>
              <p className="text-sm text-gray-700 font-bold">{item.source || 'Official Source'}</p>
            </div>
            
            {item.sourceUrl && (
                <a 
                  href={item.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-blue-600 text-white hover:bg-blue-700 px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-md active:scale-95"
                >
                  {lang === 'cn' ? '訪問原新聞網址' : 'Visit Original Link'} <ExternalLink size={16} className="ml-2" />
                </a>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="flex space-x-4 md:space-x-8">
            <InteractionButton 
              icon={ThumbsUp} 
              count={interactions.likes} 
              max={3} 
              color="text-blue-600" 
              onClick={() => onInteract(item.id, 'like')}
            />
            <InteractionButton 
              icon={Heart} 
              count={interactions.hearts} 
              max={3} 
              color="text-red-600" 
              onClick={() => onInteract(item.id, 'heart')}
            />
          </div>

          {item.replies.length === 0 && (
            <div className="hidden sm:flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
              <MessageSquareOff size={14} className="mr-2" />
              {lang === 'cn' ? '機械人自動發帖已停用留言' : 'Comments Disabled for AI Posts'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InteractionButton = ({ icon: Icon, count, max, color, onClick }: any) => {
  const isMaxed = count >= max;
  return (
    <button 
      onClick={onClick}
      disabled={isMaxed}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all border-2 ${
        isMaxed 
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
          : 'bg-white hover:border-gray-300 text-gray-600 hover:text-gray-900 border-gray-100 shadow-sm active:translate-y-0.5'
      }`}
    >
      <Icon size={20} className={count > 0 ? color : ''} fill={count > 0 ? 'currentColor' : 'none'} />
      <span className="font-black text-sm">
        {count > 0 ? count : ' '} 
        <span className="text-[10px] text-gray-300 ml-1 font-normal">/ {max}</span>
      </span>
    </button>
  );
};
