import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { runNewsBotBatch } from '../services/newsBot';
import { Post, UserProfile } from '../types';
import { ThumbsUp, Heart, Share2, Globe, Trash2, Bot, Clock, ExternalLink, Zap, Languages, MessageSquareOff, Search, Play } from 'lucide-react';
import { REGIONS, TOPICS } from '../constants';

interface NewsFeedProps {
  userProfile: UserProfile;
  updatePoints: (amount: number) => void;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ userProfile, updatePoints }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [regionFilter, setRegionFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [activeLang, setActiveLang] = useState<Record<number, 'en' | 'cn'>>({});
  const [generating, setGenerating] = useState(false);
  
  // Local state to track interactions
  const [interactions, setInteractions] = useState<Record<number, { likes: number, loves: number }>>({});

  useEffect(() => {
    fetchPosts();
    
    // --- BOT TRIGGER LOGIC ---
    // Check every minute if we need to run the bot
    const botInterval = setInterval(() => {
       checkBotTrigger();
    }, 60000); // Check every 60s
    
    // Run once on mount
    checkBotTrigger();

    // Realtime subscription
    const channel = supabase.channel('realtime_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((prev) => [payload.new as Post, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((prev) => prev.map(p => p.id === payload.new.id ? payload.new as Post : p));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((prev) => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(botInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionFilter, topicFilter, searchText]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    
    if (regionFilter !== 'all') query = query.eq('region', regionFilter);
    if (topicFilter !== 'all') query = query.eq('category', topicFilter);
    if (searchText) {
       query = query.or(`title_en.ilike.%${searchText}%,title_cn.ilike.%${searchText}%`);
    }

    const { data, error } = await query;
    if (data) setPosts(data as Post[]);
    setLoading(false);
  };

  // Automated Worker Logic
  const checkBotTrigger = async () => {
    // 1. Get timestamp of last bot post
    const { data: lastPost } = await supabase.from('posts')
      .select('created_at')
      .eq('is_bot', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const now = new Date();
    const lastTime = lastPost ? new Date(lastPost.created_at) : new Date(0);
    const diffMinutes = (now.getTime() - lastTime.getTime()) / 1000 / 60;

    // 2. Reduced threshold to 60 mins for better activity
    if (diffMinutes >= 60) {
      if (!generating) {
        setGenerating(true);
        await runNewsBotBatch();
        setGenerating(false);
      }
    }
  };

  // Manual Trigger for Admins
  const forceRunBot = async () => {
    if (generating) return;
    if (!confirm("Force run bot now? This will fetch news immediately.")) return;
    setGenerating(true);
    await runNewsBotBatch();
    setGenerating(false);
    fetchPosts();
  };

  const handleInteract = async (postId: number, type: 'like' | 'love') => {
    const current = interactions[postId] || { likes: 0, loves: 0 };
    const limit = 3;
    
    if ((type === 'like' && current.likes >= limit) || (type === 'love' && current.loves >= limit)) {
      alert("您對此貼文的互動已達上限 (Max 3 times)。");
      return;
    }

    setInteractions(prev => ({
      ...prev,
      [postId]: {
        ...current,
        likes: type === 'like' ? current.likes + 1 : current.likes,
        loves: type === 'love' ? current.loves + 1 : current.loves
      }
    }));

    const post = posts.find(p => p.id === postId);
    if (post) {
       const updateData = type === 'like' ? { likes: (post.likes || 0) + 1 } : { loves: (post.loves || 0) + 1 };
       await supabase.from('posts').update(updateData).eq('id', postId);
       updatePoints(150); 
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Admin Action: Permanently delete this post?')) return;
    await supabase.from('posts').delete().eq('id', postId);
  };

  const toggleLanguage = (postId: number, defaultRegion: string) => {
    const isChineseRegion = ['Hong Kong', 'Taiwan', 'China'].includes(defaultRegion);
    const defaultLang = isChineseRegion ? 'cn' : 'en';
    const current = activeLang[postId] || defaultLang;
    setActiveLang(prev => ({ ...prev, [postId]: current === 'en' ? 'cn' : 'en' }));
  };

  const handleShare = (title: string, url: string) => {
    if (navigator.share) {
      navigator.share({ title: "HKER News", text: title, url: url || window.location.href });
    } else {
      navigator.clipboard.writeText(`${title} - ${url}`);
      alert('Link copied to clipboard (已複製網址)');
    }
  };

  const getSourceUrl = (content: string) => {
    const match = content.match(/(Source|來源): (https?:\/\/[^\s]+)/);
    return match ? match[2] : '';
  };

  const getCleanContent = (content: string) => {
    return content.replace(/(Source|來源): https?:\/\/[^\s]+/, '').trim();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header & Controls */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                HKER NEWS
              </h1>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Live Feed
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
               {generating && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                   <Bot size={12} className="animate-bounce" /> Working...
                 </div>
               )}
               {userProfile.role === 'admin' && (
                 <button onClick={forceRunBot} className="p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 shadow-lg" title="Force Run Bot">
                    <Play size={12} fill="currentColor" />
                 </button>
               )}
            </div>
          </div>

          <div className="mb-3 relative">
             <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Search news title..." 
               value={searchText}
               onChange={(e) => setSearchText(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
               onClick={() => setRegionFilter('all')}
               className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${regionFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              全球 (All)
            </button>
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${regionFilter === r ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div></div>
        ) : (
          posts.map(post => {
            const isChineseRegion = ['Hong Kong', 'Taiwan', 'China'].includes(post.region);
            const defaultLang = isChineseRegion ? 'cn' : 'en';
            const currentLang = activeLang[post.id] || defaultLang;
            
            const title = currentLang === 'en' ? post.title_en : post.title_cn;
            const content = currentLang === 'en' ? post.content_en : post.content_cn;
            const sourceUrl = getSourceUrl(content);
            const cleanBody = getCleanContent(content);

            return (
              <div key={post.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                <div className="p-5 pb-3 flex justify-between items-start">
                   <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase border border-blue-100">{post.category}</span>
                      {post.is_bot && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded flex items-center gap-1 border border-indigo-100"><Bot size={12} /> HKER BOT</span>}
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded uppercase border border-slate-100">{post.region}</span>
                   </div>
                   {userProfile.role === 'admin' && (
                      <button onClick={() => handleDelete(post.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                         <Trash2 size={16} />
                      </button>
                   )}
                </div>

                <div className="px-5 flex-grow">
                   <h2 className="text-lg font-extrabold text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors">{title}</h2>
                   <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{cleanBody}</p>
                   
                   <div className="flex items-center justify-between mb-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <Clock size={12} />
                          {new Date(post.created_at).toLocaleString()}
                          {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-500 ml-2 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200"><ExternalLink size={10} /> Source</a>}
                      </div>
                   </div>

                   <button 
                      onClick={() => toggleLanguage(post.id, post.region)}
                      className="w-full py-2 mb-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-indigo-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm"
                    >
                      <Languages size={14} /> 
                      {currentLang === 'en' ? "翻譯為中文 (Translate to Chinese)" : "Translate to English (翻譯為英文)"}
                    </button>
                </div>

                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleInteract(post.id, 'like')} className="p-2 rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition transform active:scale-90"><ThumbsUp size={18} className={interactions[post.id]?.likes > 0 ? 'fill-blue-600 text-blue-600' : ''} /></button>
                        <span className="text-xs font-bold text-slate-500">{post.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleInteract(post.id, 'love')} className="p-2 rounded-full hover:bg-pink-100 text-slate-400 hover:text-pink-600 transition transform active:scale-90"><Heart size={18} className={interactions[post.id]?.loves > 0 ? 'fill-pink-600 text-pink-600' : ''} /></button>
                        <span className="text-xs font-bold text-slate-500">{post.loves || 0}</span>
                      </div>
                      <button onClick={() => handleShare(title, sourceUrl)} className="p-2 rounded-full hover:bg-green-100 text-slate-400 hover:text-green-600 transition"><Share2 size={18} /></button>
                   </div>
                </div>
                
                {post.is_bot && (
                   <div className="bg-amber-50/50 text-[10px] text-amber-700/70 text-center py-1 font-bold flex items-center justify-center gap-2 border-t border-amber-100/50">
                     <MessageSquareOff size={10} /> Bot Post
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NewsFeed;