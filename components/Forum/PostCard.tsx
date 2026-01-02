
import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, Share2, Languages, Trash2, MoreHorizontal, 
  Loader2, Cpu, Globe, MessageSquareOff, Calendar, Sparkles, 
  ExternalLink, Megaphone, ShieldAlert, CheckCircle2 
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
  // Default to 'zh' as we removed the database column, effectively resetting state on unmount
  const [currentLang, setCurrentLang] = useState('zh');
  
  const [likes, setLikes] = useState(post.likes);
  const [interactionCount, setInteractionCount] = useState({ likes: 0 });

  // Infer bot status from title or explicit flag (fallback)
  const isBot = post.is_bot || (post.title && post.title.includes("速遞]"));
  const isReadonly = post.is_readonly || isBot;

  // Safe fallback for author name and avatar
  const displayAuthorName = post.author_name || (isBot ? "HKER_NEWS_BOT" : "Anonymous Member");
  const displayAvatar = post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayAuthorName}`;

  useEffect(() => {
    const key = `nexus_limit_v4_${post.id}_${session?.user?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) setInteractionCount(JSON.parse(saved));
  }, [post.id, session]);

  const handleInteraction = async () => {
    if (!session) return alert("請先登入系統 / Please Login First");
    
    // Strict Limit: Max 3 likes per user per post
    if (interactionCount.likes >= 3) {
      alert("⚠️ 系統提示：每位用戶對單一貼文最多只能點讚 3 次。");
      return;
    }

    // Optimistic Update
    const newCounts = { likes: interactionCount.likes + 1 };
    setLikes(prev => prev + 1);
    setInteractionCount(newCounts);
    
    // Persist Limit Locally
    localStorage.setItem(`nexus_limit_v4_${post.id}_${session.user.id}`, JSON.stringify(newCounts));
    
    // Update DB
    await supabase.from('posts').update({ likes: likes + 1 }).eq('id', post.id);
    
    // Reward User
    updatePoints(50);
  };

  const handleTranslate = async () => {
    if (translatedText) {
      // Toggle back to original
      setTranslatedText(null);
      setTranslatedTitle(null);
      setCurrentLang('zh');
      return;
    }
    
    setIsTranslating(true);
    const target = 'en'; // Default translation target
    
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
    if (!confirm("ADMIN ACTION: Are you sure you want to delete this post?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) window.location.reload();
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className={`bg-white rounded-[32px] shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300 group mb-8 ${
      post.is_announcement 
        ? 'border-red-500 ring-2 ring-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]' 
        : isBot ? 'border-indigo-100' : 'border-slate-200'
    }`}>
      {/* Admin Action Bar */}
      {isAdmin && (
        <div className="bg-slate-900 px-6 py-1.5 flex justify-between items-center text-white text-[9px] font-black uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <ShieldAlert size={12} className="text-red-500" /> ADMIN OVERRIDE
           </div>
           <button onClick={handleDelete} className="hover:text-red-400 flex items-center gap-1 transition-colors">
             <Trash2 size={10} /> DELETE POST
           </button>
        </div>
      )}

      {/* Header Section */}
      <div className="p-6 flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
            post.is_announcement ? 'bg-red-600 text-white' : 
            isBot ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-100'
          }`}>
            {post.is_announcement ? <Megaphone size={24} /> : 
             isBot ? <Cpu size={24} className="animate-pulse" /> : 
             <img src={displayAvatar} className="w-full h-full rounded-2xl object-cover" alt="Avt" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-base">{displayAuthorName}</span>
              {post.is_announcement ? (
                <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-red-200 flex items-center gap-1">
                  <Megaphone size={8} /> ANNOUNCEMENT
                </span>
              ) : isBot && (
                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                  <Sparkles size={8} /> AI BOT
                </span>
              )}
            </div>
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              <Calendar size={10} className="mr-1.5" /> {new Date(post.created_at).toLocaleDateString()}
              <span className="mx-2 opacity-30">|</span>
              <Globe size={10} className="mr-1.5" /> {post.region}
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="px-6 pb-6 space-y-4">
        <h3 className={`text-xl font-bold leading-tight transition-colors ${
          post.is_announcement ? 'text-red-600' : 'text-slate-900'
        }`}>
          {translatedTitle || post.title}
        </h3>
        
        <div className={`text-slate-600 leading-relaxed text-sm whitespace-pre-wrap ${
          post.is_announcement ? 'bg-red-50 p-6 rounded-2xl border border-red-100' :
          isBot ? 'bg-slate-50/50 p-6 rounded-2xl border border-slate-100' : ''
        }`}>
          {translatedText || post.content}
        </div>

        {post.source_url && (
          <div className="pt-2">
            <a 
              href={post.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <ExternalLink size={12} /> Source: {post.source_name || 'Link'}
            </a>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center gap-4">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleInteraction}
            className={`flex items-center gap-2 group/btn transition-all ${interactionCount.likes >= 3 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            title={interactionCount.likes >= 3 ? "Limit Reached" : "Like Post"}
          >
            <div className={`p-2 rounded-lg transition-colors ${interactionCount.likes > 0 ? 'bg-blue-100 text-blue-600' : 'bg-white border border-slate-200 text-slate-400 group-hover/btn:border-blue-400 group-hover/btn:text-blue-500'}`}>
              <ThumbsUp size={16} className={interactionCount.likes > 0 ? 'fill-current' : ''} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-slate-700">{likes}</span>
              {interactionCount.likes > 0 && <span className="text-[8px] font-bold text-blue-500 uppercase">{interactionCount.likes}/3</span>}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
              translatedText 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={14} />}
            <span>{translatedText ? 'Show Original' : 'Translate'}</span>
          </button>
          
          {(isReadonly || post.is_announcement) && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[10px] font-bold border-l border-slate-200 pl-4">
              <MessageSquareOff size={14} />
              <span>READ ONLY</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
