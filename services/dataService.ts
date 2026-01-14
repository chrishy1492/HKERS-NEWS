
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - CLOUD FIRST ARCHITECTURE
 * 
 * Strategy:
 * 1. READ: Always attempt to fetch from Supabase first.
 * 2. WRITE: Always write to Supabase.
 * 3. FALLBACK: LocalStorage is only used if Supabase is unreachable (Temporary Storage Area).
 * ============================================================================
 */

const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    // Try to order by created_at if it exists, otherwise just get all
    const { data, error } = await supabase
      .from('users')
      .select('*');
      
    if (!error && data) {
      // Sort in memory to be safe against missing DB sort columns
      const sorted = (data as User[]).sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
      localStorage.setItem('hker_users_cache', JSON.stringify(sorted));
      return sorted;
    }
  }
  // Fallback
  const cached = localStorage.getItem('hker_users_cache');
  return cached ? JSON.parse(cached) : [];
};

export const saveUser = async (user: User): Promise<boolean> => {
  const isConnected = await checkSupabaseConnection();
  
  // 1. Update Local Cache (Optimistic UI)
  const cachedUsers = await getUsers();
  const existingIdx = cachedUsers.findIndex(u => u.id === user.id);
  if (existingIdx >= 0) cachedUsers[existingIdx] = user;
  else cachedUsers.push(user);
  localStorage.setItem('hker_users_cache', JSON.stringify(cachedUsers));

  // 2. Sync to Cloud
  if (isConnected) {
    // Determine if insert or update
    const { error } = await supabase
      .from('users')
      .upsert(user);
      
    if (error) {
      console.error("Supabase Save User Error:", JSON.stringify(error, null, 2));
      return false;
    }
    return true;
  }
  return true; // Return true if saved locally at least
};

export const deleteUser = async (userId: string): Promise<void> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    await supabase.from('users').delete().eq('id', userId);
  }
  // Local cleanup
  const users = await getUsers();
  const newUsers = users.filter(u => u.id !== userId);
  localStorage.setItem('hker_users_cache', JSON.stringify(newUsers));
};

// --- POSTS ---

export const getPosts = async (): Promise<Post[]> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(100); 
      
    if (!error && data) {
      // Hydrate missing fields & map DB columns to Frontend Types
      const hydratedPosts = data.map((p: any) => ({
        ...p,
        // MAP DB -> Frontend
        sourceUrl: p.url || p.sourceUrl, 
        topic: p.category || p.topic,    
        // Normalize Timestamp: Try created_at (ISO) -> timestamp (num) -> inserted_at (ISO) -> fallback
        timestamp: p.timestamp 
          || (p.created_at ? new Date(p.created_at).getTime() : 0)
          || (p.inserted_at ? new Date(p.inserted_at).getTime() : Date.now()),
        
        authorName: p.authorName || (p.isBot ? 'HKER Bot 🤖' : 'HKER Member'),
        authorAvatar: p.authorAvatar || (p.isBot ? '🤖' : '😀')
      }));

      // Sort client side to ensure order regardless of DB schema
      hydratedPosts.sort((a: Post, b: Post) => b.timestamp - a.timestamp);

      localStorage.setItem('hker_posts_cache', JSON.stringify(hydratedPosts));
      return hydratedPosts as Post[];
    }
  }
  const cached = localStorage.getItem('hker_posts_cache');
  return cached ? JSON.parse(cached) : [];
};

export const savePost = async (post: Post): Promise<boolean> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    // STRICT ALLOW-LIST & MAPPING: 
    // OMIT 'timestamp' and 'created_at' to let DB use default value (fixing PGRST204)
    const dbPost = {
      id: post.id,
      titleCN: post.titleCN,
      titleEN: post.titleEN,
      contentCN: post.contentCN,
      contentEN: post.contentEN,
      authorId: post.authorId,
      // Removed created_at/timestamp to prevent "Column not found" errors.
      // The DB should have a default `now()` for the creation time column.
      region: post.region,
      category: post.topic, // MAP topic -> category
      url: post.sourceUrl,  // MAP sourceUrl -> url
      likes: post.likes,
      loves: post.loves,
      isBot: post.isBot,
      sourceName: post.sourceName
    };

    // Remove undefined keys
    Object.keys(dbPost).forEach(key => {
        if ((dbPost as any)[key] === undefined) {
            delete (dbPost as any)[key];
        }
    });

    const { error } = await supabase.from('posts').upsert(dbPost);
    if (error) {
      console.error("Supabase Save Post Error:", JSON.stringify(error, null, 2));
      return false;
    }
    return true;
  }
  return false;
};

export const deletePost = async (postId: string): Promise<void> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    await supabase.from('posts').delete().eq('id', postId);
  }
  // Optimistic update
  const posts = await getPosts();
  const newPosts = posts.filter(p => p.id !== postId);
  localStorage.setItem('hker_posts_cache', JSON.stringify(newPosts));
};

export const updatePostInteraction = async (postId: string, type: 'like' | 'love'): Promise<void> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (post) {
      const updates = {
        likes: type === 'like' ? (post.likes || 0) + 1 : post.likes,
        loves: type === 'love' ? (post.loves || 0) + 1 : post.loves
      };
      await supabase.from('posts').update(updates).eq('id', postId);
    }
  }
};

// --- POINTS SYSTEM ---

export const updatePoints = async (userId: string, amount: number, mode: 'add' | 'subtract' | 'set'): Promise<number> => {
  const isConnected = await checkSupabaseConnection();
  let newBalance = 0;

  let currentUser: User | null = null;
  if (isConnected) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    currentUser = data;
  } else {
    const users = await getUsers();
    currentUser = users.find(u => u.id === userId) || null;
  }

  if (!currentUser) return 0;

  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  currentUser.points = newBalance;
  await saveUser(currentUser);
  
  return newBalance;
};

// --- STATS ---

export const getStats = async (): Promise<Stat> => {
  const users = await getUsers();
  
  const today = new Date().setHours(0,0,0,0);
  const todayRegisters = users.filter(u => u.joinedAt >= today).length;
  const todayVisits = Math.floor(Math.random() * 50) + todayRegisters; 

  return {
    onlineUsers: Math.floor(Math.random() * 20) + 1,
    totalUsers: users.length,
    todayRegisters,
    todayVisits
  };
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
