
import React, { useState, useEffect } from 'react';
import { Post, Profile } from '../types';
import { Heart, ThumbsUp, Share2, Languages, ExternalLink, RefreshCw, Cpu, Clock, AlertCircle, MessageSquareOff, Lock } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Props {
  region: string;
  category: string;
  search: string;
  profile: Profile | null;
  supabase: any;
}

const NewsList: React.FC<Props> = ({ region, category, search, profile, supabase }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState<Record<string, boolean>>({});

  const fetchPosts = async () => {
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
    
    if (region) query = query.eq('region', region);
    if (category !== '全部') query = query.eq('category', category);
    
    const { data } = await query;
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    // Real-time subscription to ensure mobile/web sync
    const channel = supabase
      .channel('news-feed-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [region, category, supabase]);

  const handleInteraction = async (postId: string, type: 'like' | 'heart') => {
    if (!profile) return alert('請先登入！');

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const interactionMap = type === 'like' ? post.liked_by || {} : post.hearted_by || {};
    const currentCount = interactionMap[profile.id] || 0;

    // Rule 15: Interaction Limits
    if (currentCount >= 3) {
      return alert(`⚠️ 防刷機制：每個帳戶對同一貼文最多只能給 3 次${type === 'like' ? '讚' : '心'}。`);
    }

    try {
      const updatedMap = { ...interactionMap, [profile.id]: currentCount + 1 };
      const updates = type === 'like' 
        ? { likes: post.likes + 1, liked_by: updatedMap } 
        : { hearts: post.hearts + 1, hearted_by: updatedMap };

      const { error: postError } = await supabase.from('posts').update(updates).eq('id', postId);
      if (postError) throw postError;

      // Reward points (150 pts per interact)
      const reward = 150;
      const { error: profileError } = await supabase.from('profiles').update({
        points: profile.points + reward
      }).eq('id', profile.id);

      if (profileError) throw profileError;

      // Note: No alert here to keep UX smooth, or a small toast
    } catch (err) {
      console.error(err);
    }
  };

  const handleTranslate = async (post: Post) => {
    if (showTranslated[post.id]) {
      setShowTranslated(prev => ({ ...prev, [post.id]: false }));
      return;
    }

    if (post.translated_content) {
      setShowTranslated(prev => ({ ...prev, [post.id]: true }));
      return;
    }

    setTranslatingId(post.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const isChineseRegion = post.region === '中國香港' || post.region === '台灣';
      const targetLang = isChineseRegion ? 'English' : 'Traditional Chinese (繁體中文)';
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate to ${targetLang}. Keep tone professional.\nTitle: ${post.title}\nContent: ${post.content}`,
      });

      const text = response.text || "";
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const newTitle = lines[0]?.replace(/^Title:|^標題:/i, '').trim() || post.title;
      const newContent = lines.slice(1).join('\n').replace(/^Content:|^內容:/i, '').trim() || post.content;

      await supabase.from('posts').update({
        translated_title: newTitle,
        translated_content: newContent
      }).eq('id', post.id);

      setShowTranslated(prev => ({ ...prev, [post.id]: true }));
    } catch (err) {
      alert('AI 翻譯服務繁忙，請稍後再試。');
    } finally {
      setTranslatingId(null);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/#/post/${id}`;
    navigator.clipboard.writeText(url);
    alert('🔗 貼文網址已複製！');
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-blue-500" size={32} />
    </div>
  );

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Rule 57, 80, 96: Users cannot post. Interface removed. */}
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-700">
          <p className="text-slate-500 font-bold">目前沒有符合條件的新聞。</p>
        </div>
      ) : (
        filteredPosts.map(post => {
          const isTranslated = showTranslated[post.id];
          const displayTitle = isTranslated && post.translated_title ? post.translated_title : post.title;
          const displayContent = isTranslated && post.translated_content ? post.translated_content : post.content;

          return (
            <article key={post.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-slate-700 transition-all shadow-xl hover:shadow-2xl group relative">
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${post.is_bot ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-blue-400 border-blue-400/20'}`}>
                      {post.is_bot ? <Cpu size={24} /> : post.author_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-base">{post.author_name}</h4>
                        {post.is_bot && (
                          <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/20">AI Robot</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2 mt-1">
                        <span className="bg-slate-800 px-2 py-0.5 rounded">{post.region}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-blue-400">{post.category}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg">
                      <Clock size={12} />
                      {new Date(post.created_at).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                  {displayTitle}
                </h2>
                
                <div className="text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap pl-4 border-l-2 border-slate-700/50">
                  {displayContent}
                </div>

                {post.is_bot && (
                  <div className="mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 text-xs text-slate-400 space-y-3">
                    <p className="flex items-start gap-2 italic opacity-80">
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-indigo-400" />
                      <span>
                        本文由 <span className="text-indigo-400 font-bold">HKER AI Robot</span> 自動生成摘要 (Own Words Summary)。
                      </span>
                    </p>
                    {post.source_url && (
                      <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 mt-2">
                        <span className="font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          來源: {post.source_name || '網路新聞'}
                        </span>
                        <a href={post.source_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-white transition-colors flex items-center gap-1 font-bold">
                          <ExternalLink size={12} /> 閱讀原文
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-slate-800">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleInteraction(post.id, 'like')}
                      className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group/btn px-3 py-1.5 rounded-lg hover:bg-blue-500/5"
                    >
                      <ThumbsUp size={18} className={`transition-transform group-active/btn:scale-125 ${post.liked_by?.[profile?.id || ''] ? 'fill-blue-500 text-blue-500' : ''}`} />
                      <span className="text-xs font-black">{post.likes}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleInteraction(post.id, 'heart')}
                      className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors group/btn px-3 py-1.5 rounded-lg hover:bg-pink-500/5"
                    >
                      <Heart size={18} className={`transition-transform group-active/btn:scale-125 ${post.hearted_by?.[profile?.id || ''] ? 'fill-pink-500 text-pink-500' : ''}`} />
                      <span className="text-xs font-black">{post.hearts}</span>
                    </button>

                    <button 
                      onClick={() => copyLink(post.id)}
                      className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors group/btn px-3 py-1.5 rounded-lg hover:bg-green-500/5"
                    >
                      <Share2 size={18} />
                      <span className="text-xs font-black">分享</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleTranslate(post)}
                      disabled={!!translatingId}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-lg ${isTranslated ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                      {translatingId === post.id ? <RefreshCw size={12} className="animate-spin" /> : <Languages size={14} />}
                      {isTranslated ? '原文' : '翻譯'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
};

export default NewsList;
