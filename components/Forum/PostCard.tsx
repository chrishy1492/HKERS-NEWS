
import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, Heart, Share2, Languages, Trash2, MoreHorizontal, 
  Loader2, Cpu, Globe, MessageSquareOff, Calendar, Sparkles, 
  ExternalLink, Megaphone, ShieldAlert 
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Post, UserProfile, Session } from '../../types';
import { performQuantumTranslation } from '../../services/gemini';

interface PostCardProps {
  post: Post;
  session: Session | null;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  supabase: SupabaseClient;
}

const PostCard: React.FC<PostCardProps> = ({ post, session, userProfile, updatePoints, supabase }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState(post.original_lang || 'zh');
  
  const [likes, setLikes] = useState(post.likes);
  const [hearts, setHearts] = useState(post.hearts);
  
  const [interactionCount, setInteractionCount] = useState({ likes: 0, hearts: 0 });

  useEffect(() => {
    const key = `nexus_limit_v3_${post.id}_${session?.user?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) setInteractionCount(JSON.parse(saved));
  }, [post.id, session]);

  const handleInteraction = async (type: 'like' | 'heart') => {
    if (!session) return alert("請先登入系統。");
    if (type === 'like' && interactionCount.likes >= 3) return alert("對此貼的點讚已達今日上限。");
    if (type === 'heart' && interactionCount.hearts >= 3) return alert("對此貼的愛心已達今日上限。");

    const newCounts = { ...interactionCount, [type === 'like' ? 'likes' : 'hearts']: interactionCount[type === 'like' ? 'likes' : 'hearts'] + 1 };
    
    if (type === 'like') setLikes(prev => prev + 1);
    else setHearts(prev => prev + 1);

    const field = type === 'like' ? 'likes' : 'hearts';
    await supabase.from('posts').update({ [field]: (type === 'like' ? likes : hearts) + 1 }).eq('id', post.id);
    
    setInteractionCount(newCounts);
    localStorage.setItem(`nexus_limit_v3_${post.id}_${session.user.id}`, JSON.stringify(newCounts));
    updatePoints(50);
  };

  const handleTranslate = async () => {
    if (translatedText) {
      setTranslatedText(null);
      setTranslatedTitle(null);
      setCurrentLang(post.original_lang || 'zh');
      return;
    }
    setIsTranslating(true);
    const target = currentLang === 'zh' ? 'en' : 'zh';
    const [newTitle, newContent] = await Promise.all([
      performQuantumTranslation(post.title, target),
      performQuantumTranslation(post.content, target)
    ]);
    if (newContent && newTitle) {
      setTranslatedTitle(newTitle);
      setTranslatedText(newContent);
      setCurrentLang(target);
    }
    setIsTranslating(false);
  };

  const handleDelete = async () => {
    if (!confirm("管理員操作：確定要移除此帖子嗎？")) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) window.location.reload();
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className={`bg-white rounded-[40px] shadow-sm border overflow-hidden hover:shadow-2xl transition-all group mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
      post.is_announcement 
        ? 'border-red-500 ring-4 ring-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.15)] bg-gradient-to-b from-red-50/30 to-white' 
        : post.is_bot ? 'border-indigo-100 ring-4 ring-indigo-500/5' : 'border-slate-200'
    }`}>
      {/* Admin Action Bar (Hidden except for admins) */}
      {isAdmin && (
        <div className="bg-red-600 px-8 py-2 flex justify-between items-center text-white text-[10px] font-black uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <ShieldAlert size={14} /> 系統管理員模式
           </div>
           <button onClick={handleDelete} className="hover:text-black flex items-center gap-1 transition-colors">
             <Trash2 size={12} /> 立即移除 / DELETE
           </button>
        </div>
      )}

      {/* Header */}
      <div className="p-8 flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shadow-inner ${
            post.is_announcement ? 'bg-red-600 text-white' : 
            post.is_bot ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white' : 'bg-slate-100'
          }`}>
            {post.is_announcement ? <Megaphone size={28} /> : 
             post.is_bot ? <Cpu size={28} className="animate-pulse" /> : 
             <img src={post.author_avatar} className="w-full h-full rounded-[22px] object-cover" alt="Avt" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 text-lg">{post.author_name}</span>
              {post.is_announcement ? (
                <span className="bg-red-100 text-red-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-red-200 flex items-center gap-1.5 animate-pulse">
                  <Megaphone size={10} /> SYSTEM BROADCAST
                </span>
              ) : post.is_bot && (
                <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1.5">
                  <Sparkles size={10} /> AI NEWS BOT
                </span>
              )}
            </div>
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              <Calendar size={10} className="mr-1.5" /> {new Date(post.created_at).toLocaleString()}
              <span className="mx-3 opacity-30">|</span>
              <Globe size={10} className="mr-1.5" /> {post.region}
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="px-8 pb-8 space-y-6">
        <h3 className={`text-3xl font-black tracking-tighter leading-tight transition-colors ${
          post.is_announcement ? 'text-red-600' : 'text-slate-900 group-hover:text-indigo-600'
        }`}>
          {translatedTitle || post.title}
        </h3>
        
        <div className={`text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-wrap ${
          post.is_announcement ? 'bg-red-50 p-8 rounded-[32px] border border-red-100 font-bold' :
          post.is_bot ? 'bg-slate-50/80 p-8 rounded-[32px] border border-slate-100 italic' : ''
        }`}>
          {translatedText || post.content}
        </div>

        {post.source_url && (
          <div className="pt-4">
            <a 
              href={post.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
            >
              <ExternalLink size={14} /> 新聞原文: {post.source_name || '查看來源'}
            </a>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className={`px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 ${post.is_announcement ? 'bg-red-50/50' : 'bg-slate-50/30'}`}>
        <div className="flex items-center space-x-8">
          <button 
            onClick={() => handleInteraction('like')}
            className={`flex items-center space-x-2 group/btn transition-all ${interactionCount.likes >= 3 ? 'opacity-50 grayscale' : ''}`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${interactionCount.likes > 0 ? 'bg-blue-100 text-blue-600' : 'bg-white border border-slate-200 text-slate-400 group-hover/btn:border-blue-300'}`}>
              <ThumbsUp size={20} className={interactionCount.likes > 0 ? 'fill-current' : ''} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900">{likes}</span>
              {interactionCount.likes > 0 && <span className="text-[9px] font-bold text-blue-500 uppercase">{interactionCount.likes}/3 LIMIT</span>}
            </div>
          </button>

          <button 
            onClick={() => handleInteraction('heart')}
            className={`flex items-center space-x-2 group/btn transition-all ${interactionCount.hearts >= 3 ? 'opacity-50 grayscale' : ''}`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${interactionCount.hearts > 0 ? 'bg-pink-100 text-pink-600' : 'bg-white border border-slate-200 text-slate-400 group-hover/btn:border-pink-300'}`}>
              <Heart size={20} className={interactionCount.hearts > 0 ? 'fill-current' : ''} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900">{hearts}</span>
              {interactionCount.hearts > 0 && <span className="text-[9px] font-bold text-pink-500 uppercase">{interactionCount.hearts}/3 LIMIT</span>}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 text-[11px] font-black uppercase tracking-[0.15em] px-8 py-4 rounded-2xl border-2 transition-all ${translatedText ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}
          >
            {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Languages size={18} />}
            <span>{translatedText ? '顯示原文 / Original' : '量子翻譯 / Translate'}</span>
          </button>
          
          {(post.is_readonly || post.is_announcement) && (
            <div className="flex items-center gap-2 text-slate-400 italic text-[11px] font-black border-l-2 border-slate-100 pl-6 h-10">
              <MessageSquareOff size={16} className="text-slate-300" />
              <span>此帖不可留言</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
