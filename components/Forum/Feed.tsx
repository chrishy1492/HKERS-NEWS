
import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
// Import Session from our types instead of supabase-js
import { UserProfile, Post, Session } from '../../types';
import { Send, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import PostCard from './PostCard';

interface FeedProps {
  supabase: SupabaseClient;
  session: Session | null;
  region: string;
  topic: string;
  searchTerm: string;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
}

const Feed: React.FC<FeedProps> = ({ 
  supabase, session, region, topic, searchTerm, userProfile, updatePoints 
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [region, topic, searchTerm, supabase]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
    
    if (region !== 'All') query = query.eq('region', region);
    if (topic !== 'All') query = query.eq('topic', topic);
    if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);

    const { data, error } = await query;
    if (!error) setPosts(data || []);
    setLoading(false);
  };

  const handlePost = async () => {
    if (!session || !userProfile) return alert("Please login to post.");
    if (!newPostTitle || !newPostContent) return;
    setIsPosting(true);

    const postData = {
      user_id: session.user.id,
      title: newPostTitle,
      content: newPostContent,
      author_name: userProfile.nickname,
      author_avatar: userProfile.avatar_url,
      region: region === 'All' ? '中國香港' : region,
      topic: topic === 'All' ? '時事' : topic,
      likes: 0,
      hearts: 0
    };

    const { error } = await supabase.from('posts').insert([postData]);
    if (!error) {
      setNewPostTitle('');
      setNewPostContent('');
      updatePoints(500); // Reward for posting
    } else {
      alert("Error posting: " + error.message);
    }
    setIsPosting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Create Post Card */}
      {session && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 transition-all hover:shadow-md">
          <div className="flex items-center space-x-3 mb-4">
            <img src={userProfile?.avatar_url} className="w-10 h-10 rounded-full bg-slate-100" alt="Me" />
            <h3 className="font-bold text-slate-800">Share something with the community</h3>
          </div>
          <input 
            className="w-full text-lg font-bold border-none focus:ring-0 p-0 mb-3 text-slate-900 placeholder-slate-400" 
            placeholder="Give it a catchy title..."
            value={newPostTitle}
            onChange={e => setNewPostTitle(e.target.value)}
          />
          <textarea 
            className="w-full border-none focus:ring-0 p-0 mb-4 text-slate-600 placeholder-slate-400 resize-none min-h-[100px]"
            placeholder={`What's happening in ${region !== 'All' ? region : 'your area'}?`}
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
          />
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex space-x-2">
              <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                <ImageIcon size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                <Sparkles size={20} />
              </button>
            </div>
            <div className="flex items-center space-x-4">
               <span className="hidden sm:inline text-xs font-semibold text-slate-400 uppercase tracking-widest">+500 Points Reward</span>
               <button 
                onClick={handlePost} 
                disabled={isPosting || !newPostTitle || !newPostContent}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {isPosting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>{isPosting ? 'Sending...' : 'Post Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post List */}
      <div className="space-y-6">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-medium">Fetching the latest community vibes...</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              session={session} 
              updatePoints={updatePoints}
              supabase={supabase}
              userProfile={userProfile}
            />
          ))
        )}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-slate-400" size={30} />
            </div>
            <p className="text-slate-500 font-medium">It's a bit quiet here. Why not start the conversation?</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
