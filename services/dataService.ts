
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - ROBUST HYBRID ARCHITECTURE
 * 
 * Strategy:
 * 1. LOGIN: Query Cloud Direct (Accurate) -> Fallback to Local.
 * 2. WRITE: Local First (Speed) -> Sync to Cloud (Persist).
 * ============================================================================
 */

const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

// --- MAPPING HELPERS ---

// Map DB (snake_case) -> Frontend (camelCase)
export const mapDBUserToFrontend = (u: any): User => ({
  id: u.id,
  email: u.email,
  name: u.name,
  password: u.password,
  avatar: u.avatar || '😀',
  points: u.points || 0,
  role: u.role || 'user',
  vipLevel: u.vip_level || 1,
  solAddress: u.sol_address || '',
  gender: u.gender || 'O',
  phone: u.phone || '',
  address: u.address || '',
  joinedAt: u.joined_at ? new Date(u.joined_at).getTime() : Date.now(),
  lastLogin: u.last_login ? new Date(u.last_login).getTime() : Date.now(),
});

// Map Frontend (camelCase) -> DB (snake_case)
const mapFrontendUserToDB = (u: User): any => {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password,
    avatar: u.avatar,
    points: u.points,
    role: u.role,
    vip_level: u.vipLevel,
    sol_address: u.solAddress,
    gender: u.gender,
    phone: u.phone,
    address: u.address,
    joined_at: new Date(u.joinedAt).toISOString(),
    last_login: new Date(u.lastLogin || Date.now()).toISOString()
  };
};

// --- AUTHENTICATION & USERS ---

// NEW: Specific login function to bypass "List All" RLS restrictions
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  console.log(`[Auth] Attempting login for: ${email}`);
  
  // 1. Try Cloud First (Authority)
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

    if (!error && data) {
      // Check password (In production, use hashing. Here we compare direct strings as per current design)
      if (data.password === password) {
        console.log("[Auth] Cloud login successful");
        const user = mapDBUserToFrontend(data);
        // Sync to local cache to keep it fresh
        updateLocalUserCache(user);
        return user;
      } else {
        console.warn("[Auth] Cloud found user, but password mismatch");
      }
    } else if (error) {
      console.error("[Auth] Supabase Query Error:", error.message);
    }
  }

  // 2. Fallback to LocalStorage (Offline or Sync Pending)
  console.log("[Auth] Falling back to LocalStorage...");
  const cached = localStorage.getItem('hker_users_cache');
  if (cached) {
    const users: User[] = JSON.parse(cached);
    const localUser = users.find(u => u.email === email && u.password === password);
    if (localUser) {
      console.log("[Auth] Local login successful");
      return localUser;
    }
  }

  return null;
};

// Helper to update specific user in local cache
const updateLocalUserCache = (user: User) => {
  const cached = localStorage.getItem('hker_users_cache');
  const users: User[] = cached ? JSON.parse(cached) : [];
  const idx = users.findIndex(u => u.id === user.id);
  
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  
  localStorage.setItem('hker_users_cache', JSON.stringify(users));
};

export const getUsers = async (): Promise<User[]> => {
  // Try Cloud
  const { data, error } = await supabase.from('users').select('*');
  if (!error && data) {
    const sorted = (data as User[]).map(mapDBUserToFrontend);
    localStorage.setItem('hker_users_cache', JSON.stringify(sorted));
    return sorted;
  }
  // Fallback
  const cached = localStorage.getItem('hker_users_cache');
  return cached ? JSON.parse(cached) : [];
};

export const saveUser = async (user: User): Promise<boolean> => {
  console.log(`[Save] Saving user: ${user.email} (${user.id})`);

  // 1. Update Local Cache Immediately (Optimistic)
  try {
    updateLocalUserCache(user);
  } catch (e) {
    console.error("Local Storage Error:", e);
    // Continue execution to try cloud
  }

  // 2. Sync to Cloud
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const dbUser = mapFrontendUserToDB(user);
    const { error } = await supabase
      .from('users')
      .upsert(dbUser, { onConflict: 'email' }); // Ensure email uniqueness logic
      
    if (error) {
      console.error("❌ Supabase Write FAILED:", error.message, error.details);
      // We return true anyway because we saved locally, but we logged the error.
      // In a real app, we might want to show a warning toast.
      return true; 
    } else {
      console.log("✅ Supabase Write SUCCESS");
    }
  } else {
    console.warn("⚠️ No Connection to Supabase. Data saved LOCALLY only.");
  }
  
  return true;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await supabase.from('users').delete().eq('id', userId);
  const users = await getUsers();
  const newUsers = users.filter(u => u.id !== userId);
  localStorage.setItem('hker_users_cache', JSON.stringify(newUsers));
};

// --- HEARTBEAT & STATS ---

export const updateHeartbeat = async (userId: string): Promise<void> => {
  // Fire and forget update
  supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId).then(({ error }) => {
      if (error) console.error("Heartbeat error:", error.message);
  });
};

export const getStats = async (): Promise<Stat> => {
  // For stats, we prioritize local cache speed, but verify with cloud count if possible
  const users = await getUsers(); // This handles the fallback logic
  
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();

  const totalUsers = users.length;
  const todayRegisters = users.filter(u => (u.joinedAt || 0) >= todayTs).length;
  
  // Logic: User joined today OR User logged in today
  const todayVisits = users.filter(u => {
      const lastActive = u.lastLogin || u.joinedAt || 0;
      return lastActive >= todayTs;
  }).length;
  
  // Online: Active in last 5 mins
  const onlineUsers = users.filter(u => {
      const lastActive = u.lastLogin || u.joinedAt || 0;
      return (now - lastActive) < 5 * 60 * 1000;
  }).length;

  return {
    onlineUsers: Math.max(onlineUsers, 1),
    totalUsers,
    todayRegisters,
    todayVisits: Math.max(todayVisits, 1)
  };
};

// --- POSTS (Keep existing logic) ---

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
  const cached = localStorage.getItem('hker_posts_cache');
  return cached ? JSON.parse(cached) : [];
};

export const savePost = async (post: Post): Promise<boolean> => {
  // Simplified for brevity, similar to saveUser but for posts
  const dbPost: any = {
      title: post.titleCN,
      content: post.contentEN,
      contentCN: post.contentCN,
      region: post.region,
      category: post.topic,
      url: post.sourceUrl,
      author: post.authorName,
      author_id: post.authorId,
      source_name: post.sourceName
  };
  
  // ID Logic
  if (post.id && !post.id.includes('-') && !isNaN(Number(post.id))) {
      dbPost.id = parseInt(post.id);
  } else {
      dbPost.id = Date.now() + Math.floor(Math.random() * 100000);
  }

  const { error } = await supabase.from('posts').upsert(dbPost);
  return !error;
};

export const deletePost = async (postId: string): Promise<void> => {
  if (!postId.includes('-')) {
    await supabase.from('posts').delete().eq('id', postId);
  }
};

export const updatePostInteraction = async (postId: string, type: 'like' | 'love'): Promise<void> => {
  if (!postId.includes('-')) {
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
  // We must re-fetch the user to get the absolute latest points
  let currentUser: User | null = null;
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  
  if (data) currentUser = mapDBUserToFrontend(data);
  else {
      // Fallback to local
      const users = await getUsers();
      currentUser = users.find(u => u.id === userId) || null;
  }

  if (!currentUser) return 0;

  let newBalance = 0;
  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  currentUser.points = newBalance;
  await saveUser(currentUser);
  
  return newBalance;
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
