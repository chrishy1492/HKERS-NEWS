
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - ROBUST HYBRID ARCHITECTURE
 * 
 * Strategy:
 * 1. READ: Merge Local + Cloud (Prefer Cloud for updates, Prefer Local for recent creates)
 * 2. WRITE: Local First (Optimistic), then Sync to Supabase.
 * ============================================================================
 */

const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  // 1. Get Local Data First (The immediate source of truth for new registers)
  const cachedStr = localStorage.getItem('hker_users_cache');
  let localUsers: User[] = cachedStr ? JSON.parse(cachedStr) : [];

  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase
      .from('users')
      .select('*');
      
    if (!error && data) {
      // SMART MERGE STRATEGY:
      // Combine Cloud data with Local data. 
      // If a user exists in both, use Cloud (it might have updates).
      // If a user exists ONLY in Local (newly registered), KEEP IT.
      
      const userMap = new Map<string, User>();
      
      // Load Cloud users first
      data.forEach((u: any) => userMap.set(u.id, u));
      
      // Merge Local users if they are missing from Cloud
      localUsers.forEach(u => {
          if (!userMap.has(u.id)) {
              userMap.set(u.id, u);
          }
      });

      const mergedUsers = Array.from(userMap.values());
      const sorted = mergedUsers.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
      
      // Update Cache with the merged list
      localStorage.setItem('hker_users_cache', JSON.stringify(sorted));
      return sorted;
    }
  }
  
  // Fallback: If cloud fails or returns error, return what we have locally
  return localUsers;
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
    return false;
  }

  // 2. Sync to Cloud (Best Effort)
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { error } = await supabase
      .from('users')
      .upsert(user);
      
    if (error) {
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
    await supabase.from('users').update({ lastLogin: now }).eq('id', userId);
  }
  
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
  const users = await getUsers();
  
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();

  const totalUsers = users.length;
  const todayRegisters = users.filter(u => (u.joinedAt || 0) >= todayTs).length;
  const todayVisits = users.filter(u => {
      const lastActive = u.lastLogin || u.joinedAt || 0;
      return lastActive >= todayTs;
  }).length;
  const onlineThreshold = 5 * 60 * 1000; 
  const onlineUsers = users.filter(u => {
      const lastActive = u.lastLogin || u.joinedAt || 0;
      return (now - lastActive) < onlineThreshold;
  }).length;

  return {
    onlineUsers: Math.max(onlineUsers, 1),
    totalUsers,
    todayRegisters,
    todayVisits: Math.max(todayVisits, 1)
  };
};

// --- POSTS ---

export const mapDBPostToFrontend = (p: any): Post => ({
  id: String(p.id),
  titleCN: p.title || p.titleCN,
  titleEN: p.title_en || p.titleEN || p.title,
  contentCN: p.contentCN || p.content_cn || p.content,
  contentEN: p.content_en || p.contentEN || p.content,
  region: p.region,
  topic: p.category || p.topic, 
  sourceUrl: p.url || p.sourceUrl,
  sourceName: p.source_name || p.sourceName,
  authorId: p.author_id || p.authorId,
  authorName: p.author || p.authorName || (p.is_bot || p.isBot ? 'HKER Bot 🤖' : 'HKER Member'),
  authorAvatar: (p.is_bot || p.isBot ? '🤖' : '😀'),
  isBot: !!(p.is_bot || p.isBot),
  likes: p.likes || 0,
  loves: p.loves || 0,
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
      .order('created_at', { ascending: false })
      .limit(100); 
      
    if (!error && data) {
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
    const dbPost: any = {
      title: post.titleCN,
      content: post.contentEN,
      contentCN: post.contentCN,
      region: post.region,
      category: post.topic,
      url: post.sourceUrl,
      author: post.authorName,
      author_id: post.authorId,
    };

    if (post.id && !post.id.includes('-') && !isNaN(Number(post.id))) {
      dbPost.id = parseInt(post.id);
    } else {
      dbPost.id = Date.now() + Math.floor(Math.random() * 100000);
    }

    Object.keys(dbPost).forEach(key => {
        if (dbPost[key] === undefined) delete dbPost[key];
    });

    const { error } = await supabase.from('posts').upsert(dbPost);
    if (error) {
      if (
        error.code === '23505' || 
        error.message?.includes('duplicate key') || 
        error.details?.includes('already exists')
      ) {
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
  if (isConnected && !postId.includes('-')) {
    await supabase.from('posts').delete().eq('id', postId);
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

export const updatePoints = async (userId: string, amount: number, mode: 'add' | 'subtract' | 'set'): Promise<number> => {
  const isConnected = await checkSupabaseConnection();
  let newBalance = 0;

  let currentUser: User | null = null;
  // Try local find first for speed and consistency
  const users = await getUsers();
  currentUser = users.find(u => u.id === userId) || null;

  if (!currentUser) return 0;

  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  currentUser.points = newBalance;
  await saveUser(currentUser);
  
  return newBalance;
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
