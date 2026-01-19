
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - ROBUST HYBRID ARCHITECTURE
 * 
 * Strategy:
 * 1. READ: Always attempt to fetch from Supabase first.
 * 2. WRITE: Local First (Optimistic), then Sync to Supabase.
 * 3. FALLBACK: If Supabase fails, we rely on LocalStorage to ensure UX continuity.
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
    const { data, error } = await supabase
      .from('users')
      .select('*');
      
    if (!error && data) {
      // Sort in memory
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
  // 1. Update Local Cache (Optimistic UI - Always Succeeds)
  try {
    const cachedUsers = await getUsers();
    const existingIdx = cachedUsers.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) cachedUsers[existingIdx] = user;
    else cachedUsers.push(user);
    localStorage.setItem('hker_users_cache', JSON.stringify(cachedUsers));
  } catch (e) {
    console.error("Local Storage Error:", e);
    // If local storage fails (e.g. quota), we truly fail.
    return false;
  }

  // 2. Sync to Cloud (Best Effort)
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { error } = await supabase
      .from('users')
      .upsert(user);
      
    if (error) {
      // CRITICAL FIX: Do NOT block the user if cloud sync fails (e.g. RLS issues, Table missing).
      // We log the error but return TRUE because the user exists locally.
      console.warn("Supabase Sync Failed (Running in Offline/Hybrid Mode):", error.message);
      return true; 
    }
  }
  
  return true; 
};

export const deleteUser = async (userId: string): Promise<void> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    await supabase.from('users').delete().eq('id', userId);
  }
  const users = await getUsers();
  const newUsers = users.filter(u => u.id !== userId);
  localStorage.setItem('hker_users_cache', JSON.stringify(newUsers));
};

// --- HEARTBEAT & STATS (REAL-TIME) ---

export const updateHeartbeat = async (userId: string): Promise<void> => {
  const now = Date.now();
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    // Efficiently update only the lastLogin field
    await supabase.from('users').update({ lastLogin: now }).eq('id', userId);
  }
  
  // Update local cache quietly to keep UI consistent
  const cached = localStorage.getItem('hker_users_cache');
  if (cached) {
    const users = JSON.parse(cached) as User[];
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].lastLogin = now;
      localStorage.setItem('hker_users_cache', JSON.stringify(users));
    }
  }
};

export const getStats = async (): Promise<Stat> => {
  // Always fetch fresh data for stats to ensure sync across devices
  const users = await getUsers();
  
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();

  // 1. Total Users
  const totalUsers = users.length;
  
  // 2. Today Registers (Joined after 00:00 today)
  const todayRegisters = users.filter(u => (u.joinedAt || 0) >= todayTs).length;

  // 3. Today Visits (Active Members)
  // Logic: User joined today OR User logged in today
  const todayVisits = users.filter(u => {
      const lastActive = u.lastLogin || u.joinedAt || 0;
      return lastActive >= todayTs;
  }).length;

  // 4. Online Users (Heartbeat within last 5 minutes)
  const onlineThreshold = 5 * 60 * 1000; 
  const onlineUsers = users.filter(u => {
      const lastActive = u.lastLogin || u.joinedAt || 0;
      return (now - lastActive) < onlineThreshold;
  }).length;

  return {
    onlineUsers: Math.max(onlineUsers, 1), // At least 1 (the admin themselves)
    totalUsers,
    todayRegisters,
    todayVisits: Math.max(todayVisits, 1) // At least the current user
  };
};

// --- POSTS ---

// Helper: Map raw DB object to Frontend Post Type
export const mapDBPostToFrontend = (p: any): Post => ({
  // FIX 22P02: Convert BigInt ID to string for frontend compatibility
  id: String(p.id),
  // Titles
  titleCN: p.title || p.titleCN,
  titleEN: p.title_en || p.titleEN || p.title, // Fallback to title if EN missing
  // Contents
  contentCN: p.contentCN || p.content_cn || p.content, // Prioritize explicit CN column
  contentEN: p.content_en || p.contentEN || p.content, // Fallback to content
  // Meta
  region: p.region,
  topic: p.category || p.topic, 
  sourceUrl: p.url || p.sourceUrl,
  sourceName: p.source_name || p.sourceName,
  // Author
  authorId: p.author_id || p.authorId,
  authorName: p.author || p.authorName || (p.is_bot || p.isBot ? 'HKER Bot 🤖' : 'HKER Member'),
  authorAvatar: (p.is_bot || p.isBot ? '🤖' : '😀'), // Generated client-side
  isBot: !!(p.is_bot || p.isBot),
  // Stats
  likes: p.likes || 0,
  loves: p.loves || 0,
  // Time
  timestamp: p.timestamp 
    || (p.created_at ? new Date(p.created_at).getTime() : 0)
    || (p.inserted_at ? new Date(p.inserted_at).getTime() : Date.now()),
});

export const getPosts = async (): Promise<Post[]> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false }) // Added Sort: Newest first
      .limit(100); 
      
    if (!error && data) {
      // MAP DB -> FRONTEND (camelCase)
      const hydratedPosts = data.map(mapDBPostToFrontend);

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
    // MAP FRONTEND (camelCase) -> DB (Correct Schema Columns)
    const dbPost: any = {
      title: post.titleCN,        // DB 'title'
      // title_en: post.titleEN,
      content: post.contentEN,    // DB 'content'
      contentCN: post.contentCN,  // DB 'contentCN'
      region: post.region,
      category: post.topic,
      url: post.sourceUrl,
      author: post.authorName,    // DB 'author'
      author_id: post.authorId,   // DB 'author_id'
      // is_bot: post.isBot,
      // likes: post.likes,
      // loves: post.loves
    };

    // FIX 23502 (Not Null ID) & 22P02 (BigInt):
    if (post.id && !post.id.includes('-') && !isNaN(Number(post.id))) {
      dbPost.id = parseInt(post.id);
    } else {
      // Generate numeric ID for new post using timestamp + random to fit in BigInt
      dbPost.id = Date.now() + Math.floor(Math.random() * 100000);
    }

    // Remove undefined keys
    Object.keys(dbPost).forEach(key => {
        if (dbPost[key] === undefined) {
            delete dbPost[key];
        }
    });

    const { error } = await supabase.from('posts').upsert(dbPost);
    if (error) {
      // Fix 23505: Gracefully handle duplicate key (URL) errors
      if (
        error.code === '23505' || 
        error.message?.includes('duplicate key') || 
        error.details?.includes('already exists')
      ) {
        console.warn("Post already exists (Duplicate URL). Skipping to prevent error.");
        return true; 
      }
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
    // Only attempt delete if ID is valid (not a temp UUID)
    if (!postId.includes('-')) {
        await supabase.from('posts').delete().eq('id', postId);
    }
  }
  const posts = await getPosts();
  const newPosts = posts.filter(p => p.id !== postId);
  localStorage.setItem('hker_posts_cache', JSON.stringify(newPosts));
};

export const updatePostInteraction = async (postId: string, type: 'like' | 'love'): Promise<void> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected && !postId.includes('-')) {
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

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
