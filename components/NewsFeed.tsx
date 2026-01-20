import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { runNewsBotBatch } from '../services/newsBot';
import { Post, UserProfile } from '../types';
import { ThumbsUp, Heart, Share2, Globe, Trash2, Bot, Clock, ExternalLink, Zap, Languages, MessageSquareOff } from 'lucide-react';
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
  const [activeLang, setActiveLang] = useState<Record<number, 'en' | 'cn'>>({});
  const [generating, setGenerating] = useState(false);
  
  // Local state to track interactions for the current session (limiting spam)
  const [interactions, setInteractions] = useState<Record<number, { likes: number, loves: number }>>({});

  useEffect(() => {
    fetchPosts();
    
    // --- BOT TRIGGER LOGIC ---
    // Check every minute if we need to run the bot
    const botInterval = setInterval(() => {
       checkBotTrigger();
    }, 60000); // Check every 60s
    
    // Also run once on mount
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
  }, [regionFilter, topicFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    
    if (regionFilter !== 'all') query = query.eq('region', regionFilter);
    if (topicFilter !== 'all') query = query.eq('category', topicFilter);

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

    // 2. If > 30 minutes since last post, OR no posts exist, trigger batch
    if (diffMinutes >= 30) {
      if (!generating) {
        setGenerating(true);
        await runNewsBotBatch();
        setGenerating(false);
      }
    }
  };

  const handleInteract = async (postId: number, type: 'like' | 'love') => {
    // Local limit check (Max 3 per type per post)
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

    // Optimistic UI update handled by realtime, but we trigger the DB update here
    const post = posts.find(p => p.id === postId);
    if (post) {
       const updateData = type === 'like' ? { likes: (post.likes || 0) + 1 } : { loves: (post.loves || 0) + 1 };
       await supabase.from('posts').update(updateData).eq('id', postId);
       updatePoints(10); // Reward for interaction
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await supabase.from('posts').delete().eq('id', postId);
  };

  const toggleLanguage = (postId: number, defaultRegion: string) => {
    // Determine default: HK/TW/China = Chinese, others = English
    const isChineseRegion = ['Hong Kong', 'Taiwan', 'China'].includes(defaultRegion);
    const defaultLang = isChineseRegion ? 'cn' : 'en';
    
    const current = activeLang[postId] || defaultLang;
    setActiveLang(prev => ({ ...prev, [postId]: current === 'en' ? 'cn' : 'en' }));
  };

  const handleShare = (title: string, url: string) => {
    if (navigator.share) {
      navigator.share({ title: "HKER News", text: title, url: url || window.location.href });
    } else {
      navigator.clipboard.writeText(`${title} - Read more on HKER News`);
      alert('Link copied to clipboard');
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
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-0">
      {/* Header & Controls */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              HKER NEWS
            </h1>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live Feed
            </div>
          </div>
          <div className="flex gap-2">
             {generating && (
               <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                 <Bot size={12} className="animate-bounce" /> Bot Working...
               </div>
             )}
          </div>
        </div>
        
        {/* Region Filter */}
        <div className="max-w-5xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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

      {/* Feed */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div></div>
        ) : (
          posts.map(post => {
            // Language Logic
            const isChineseRegion = ['Hong Kong', 'Taiwan', 'China'].includes(post.region);
            const defaultLang = isChineseRegion ? 'cn' : 'en';
            const currentLang = activeLang[post.id] || defaultLang;
            
            const title = currentLang === 'en' ? post.title_en : post.title_cn;
            const content = currentLang === 'en' ? post.content_en : post.content_cn;
            const sourceUrl = getSourceUrl(content);
            const cleanBody = getCleanContent(content);

            return (
              <div key={post.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                {/* Post Header */}
                <div className="p-5 pb-3 flex justify-between items-start">
                   <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase border border-blue-100">
                        {post.category}
                      </span>
                      {post.is_bot && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded flex items-center gap-1 border border-indigo-100">
                          <Bot size={12} /> HKER BOT
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded uppercase border border-slate-100">
                        {post.region}
                      </span>
                   </div>
                   <div className="flex gap-2">
                     {(userProfile.role === 'admin' || userProfile.id === post.author_id) && (
                        <button onClick={() => handleDelete(post.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                           <Trash2 size={16} />
                        </button>
                     )}
                   </div>
                </div>

                {/* Post Content */}
                <div className="px-5 flex-grow">
                   <h2 className="text-lg font-extrabold text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors">
                     {title}
                   </h2>
                   
                   <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                     {cleanBody}
                   </p>
                   
                   <div className="flex items-center justify-between mb-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <Clock size={12} />
                          {new Date(post.created_at).toLocaleString()}
                          {sourceUrl && (
                            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-500 ml-2 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                              <ExternalLink size={10} /> Source
                            </a>
                          )}
                      </div>
                   </div>

                   {/* Translate Button */}
                   <button 
                      onClick={() => toggleLanguage(post.id, post.region)}
                      className="w-full py-2 mb-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-indigo-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm"
                    >
                      <Languages size={14} /> 
                      {currentLang === 'en' ? "翻譯為中文 (Translate to Chinese)" : "Translate to English (翻譯為英文)"}
                    </button>
                </div>

                {/* Interaction Bar */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleInteract(post.id, 'like')} className="p-2 rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition">
                          <ThumbsUp size={18} className={interactions[post.id]?.likes > 0 ? 'fill-blue-600 text-blue-600' : ''} />
                        </button>
                        <span className="text-xs font-bold text-slate-500">{post.likes || 0}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button onClick={() => handleInteract(post.id, 'love')} className="p-2 rounded-full hover:bg-pink-100 text-slate-400 hover:text-pink-600 transition">
                          <Heart size={18} className={interactions[post.id]?.loves > 0 ? 'fill-pink-600 text-pink-600' : ''} />
                        </button>
                        <span className="text-xs font-bold text-slate-500">{post.loves || 0}</span>
                      </div>

                      <button onClick={() => handleShare(title, sourceUrl)} className="p-2 rounded-full hover:bg-green-100 text-slate-400 hover:text-green-600 transition">
                        <Share2 size={18} />
                      </button>
                   </div>
                </div>
                
                {/* Bot Footer */}
                {post.is_bot && (
                   <div className="bg-amber-50/50 text-[10px] text-amber-700/70 text-center py-1 font-bold flex items-center justify-center gap-2 border-t border-amber-100/50">
                     <MessageSquareOff size={10} />
                     Bot Post - Comments Disabled
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