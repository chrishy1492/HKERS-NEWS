
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
  
  // Interactions State
  const [likes, setLikes] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false); // Local tracking for immediate feedback

  // Display Fields Logic
  const isBot = post.is_bot;
  // Use source_name as author if bot, else generic
  const displayAuthorName = post.source_name || (isBot ? "HKER AI Bot" : "Member");
  const displayAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayAuthorName}`;

  // Check if user has already liked this session (Simple check, ideally check DB)
  useEffect(() => {
    // In a real app we would fetch 'interactions' count from DB here
    // For now, we trust the 'likes' count passed down (if available)
  }, [post.id]);

  const handleInteraction = async () => {
    if (!session) return alert("請先登入系統 / Please Login First");
    
    // 1. Optimistic Update (For UI Responsiveness)
    setLikes(prev => prev + 1);
    setHasLiked(true);
    
    // 2. Insert into 'interactions' table (Trigger will validate limit)
    try {
      const { error } = await supabase.from('interactions').insert({
        user_id: session.user.id,
        post_id: post.id,
        type: 'like'
      });

      if (error) {
        // Handle Trigger Error (P0001 is standard raise exception code)
        if (error.code === 'P0001' || error.message.includes('limit reached')) {
          alert("⚠️ 系統提示：您對此貼文的點讚次數已達上限 (Max 3)。");
          setLikes(prev => prev - 1); // Revert optimistic update
        } else {
          console.error("Interaction Error:", error.message);
        }
      } else {
        // Success: Reward User
        updatePoints(10);
      }
    } catch (err) {
      console.error("System Error", err);
      setLikes(prev => prev - 1);
    }
  };

  const handleTranslate = async () => {
    if (translatedText) {
      setTranslatedText(null);
      setTranslatedTitle(null);
      return;
    }
    
    setIsTranslating(true);
    const target = 'en'; 
    
    const [newTitle, newSummary] = await Promise.all([
      performQuantumTranslation(post.title, target),
      performQuantumTranslation(post.summary, target)
    ]);
    
    if (newSummary && newTitle) {
      setTranslatedTitle(newTitle);
      setTranslatedText(newSummary);
    }
    setIsTranslating(false);
  };

  const handleDelete = async () => {
    if (!confirm("ADMIN ACTION: Confirm delete? This will create a log in audit trail.")) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) window.location.reload();
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className={`bg-white rounded-[32px] shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300 group mb-8 ${isBot ? 'border-indigo-100' : 'border-slate-200'}`}>
      
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
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isBot ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-100'}`}>
            {isBot ? <Cpu size={24} className="animate-pulse" /> : 
             <img src={displayAvatar} className="w-full h-full rounded-2xl object-cover" alt="Avt" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-base">{displayAuthorName}</span>
              {isBot && (
                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                  <Sparkles size={8} /> AI AGENT
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
        <h3 className="text-xl font-bold leading-tight text-slate-900">
          {translatedTitle || post.title}
        </h3>
        
        {/* Content Snippet (Lead-in) */}
        {post.content_snippet && (
           <div className="text-sm font-medium text-slate-500 italic border-l-2 border-indigo-200 pl-3">
             {post.content_snippet}
           </div>
        )}

        {/* Main Summary (Markdown) */}
        <div className={`text-slate-600 leading-relaxed text-sm whitespace-pre-wrap ${isBot ? 'bg-slate-50/50 p-6 rounded-2xl border border-slate-100' : ''}`}>
          {translatedText || post.summary}
        </div>

        {post.original_url && (
          <div className="pt-2">
            <a 
              href={post.original_url} 
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
            className={`flex items-center gap-2 group/btn transition-all ${hasLiked ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
            title="Like Post"
          >
            <div className={`p-2 rounded-lg transition-colors ${hasLiked ? 'bg-blue-100' : 'bg-white border border-slate-200 group-hover/btn:border-blue-400'}`}>
              <ThumbsUp size={16} className={hasLiked ? 'fill-current' : ''} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold">{likes}</span>
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
            <span>{translatedText ? 'Original' : 'Translate'}</span>
          </button>
          
          {(!post.allow_comments) && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[10px] font-bold border-l border-slate-200 pl-4">
              <MessageSquareOff size={14} />
              <span>LOCKED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
