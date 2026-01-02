
import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
// Import Session from our types instead of supabase-js
import { UserProfile, Post, Session } from '../../types';
import { Sparkles, Loader2 } from 'lucide-react';
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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
            <p className="text-slate-500 font-medium">It's a bit quiet here. Waiting for news updates...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
