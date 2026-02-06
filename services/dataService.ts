
import { supabase } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - HYBRID OFFLINE-FIRST ARCHITECTURE
 * 
 * Strategy:
 * 1. WRITE: Update LocalStorage IMMEDIATELY -> Try Supabase in background.
 *    If Supabase fails, we still return TRUE so the user can use the app.
 * 2. READ: Fetch Supabase -> Merge with LocalStorage -> Return Combined List.
 *    This ensures offline-registered users don't disappear when cloud syncs.
 * ============================================================================
 */

const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

// --- MAPPING HELPERS ---

// Map DB (snake_case) -> Frontend (camelCase)
const mapDBUserToFrontend = (u: any): User => ({
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
    joined_at: new Date(u.joinedAt || Date.now()).toISOString(),
    last_login: new Date(u.lastLogin || Date.now()).toISOString()
  };
};

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  let localUsers: User[] = [];
  try {
    const cached = localStorage.getItem('hker_users_cache');
    if (cached) localUsers = JSON.parse(cached);
  } catch (e) {
    console.error("Cache parse error", e);
  }

  // 1. Try Cloud Fetch
  const { data: cloudData, error } = await supabase.from('users').select('*');
  
  if (!error && cloudData) {
    const cloudUsers = cloudData.map(mapDBUserToFrontend);
    
    // 2. MERGE STRATEGY: Combine Cloud + Local
    // Priority: Cloud version overwrites Local version if IDs match, 
    // BUT we keep Local-only users (who haven't synced yet).
    const mergedMap = new Map<string, User>();
    
    // Add all local users first
    localUsers.forEach(u => mergedMap.set(u.id, u));
    
    // Overwrite with cloud users (source of truth)
    cloudUsers.forEach(u => mergedMap.set(u.id, u));
    
    const mergedList = Array.from(mergedMap.values());
    
    // Sort: Newest first
    const sorted = mergedList.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
    
    // Update Cache
    localStorage.setItem('hker_users_cache', JSON.stringify(sorted));
    return sorted;
  } else {
    // Cloud failed? Return local cache only (Offline Mode)
    console.warn("Cloud fetch failed, using local cache only.");
    return localUsers;
  }
};

export const saveUser = async (user: User): Promise<boolean> => {
  // 1. ALWAYS Update Local Cache FIRST (Success guaranteed for UI)
  try {
    const cached = localStorage.getItem('hker_users_cache');
    const cachedUsers: User[] = cached ? JSON.parse(cached) : [];
    
    const existingIdx = cachedUsers.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) cachedUsers[existingIdx] = user;
    else cachedUsers.push(user);
    
    localStorage.setItem('hker_users_cache', JSON.stringify(cachedUsers));
  } catch (e) {
    console.error("Local Save Error:", e);
    // Even if local storage fails (rare), we try cloud.
  }

  // 2. Try Sync to Cloud (Best Effort)
  try {
    const dbUser = mapFrontendUserToDB(user);
    console.log("Syncing user to Cloud:", dbUser);
    
    const { error } = await supabase.from('users').upsert(dbUser);
    
    if (error) {
      console.warn("⚠️ Cloud Sync Failed (Offline Mode active):", error.message);
      // We return TRUE here because we successfully saved locally.
      // The user should not be blocked from using the app just because backend is down/unconfigured.
      return true; 
    }
  } catch (err) {
    console.warn("Supabase Network Error:", err);
    return true; // Still return true for Offline Mode
  }

  return true;
};

export const deleteUser = async (userId: string): Promise<void> => {
  // Delete from Cloud
  await supabase.from('users').delete().eq('id', userId);
  
  // Delete from Local
  const cached = localStorage.getItem('hker_users_cache');
  if (cached) {
    const users = JSON.parse(cached) as User[];
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('hker_users_cache', JSON.stringify(newUsers));
  }
};

// --- HEARTBEAT & STATS ---

export const updateHeartbeat = async (userId: string): Promise<void> => {
  // Fire and forget - don't block
  const now = new Date().toISOString();
  supabase.from('users').update({ last_login: now }).eq('id', userId).then(({ error }) => {
     if (error) console.warn("Heartbeat skipped (Offline)");
  });
};

export const getStats = async (): Promise<Stat> => {
  // Use getUsers() to get the merged list (Cloud + Local)
  const users = await getUsers();
  
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();

  return {
    onlineUsers: Math.max(users.filter(u => (now - (u.lastLogin || 0)) < 5 * 60 * 1000).length, 1),
    totalUsers: users.length,
    todayRegisters: users.filter(u => (u.joinedAt || 0) >= todayTs).length,
    todayVisits: users.filter(u => (u.lastLogin || 0) >= todayTs).length
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
     if (error.code !== '23505') console.warn("Save Post Failed:", error.message);
     return false;
  }
  return true;
};

export const deletePost = async (postId: string): Promise<void> => {
  await supabase.from('posts').delete().eq('id', postId);
};

export const updatePostInteraction = async (postId: string, type: 'like' | 'love'): Promise<void> => {
    const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (post) {
      const updates = {
        likes: type === 'like' ? (post.likes || 0) + 1 : post.likes,
        loves: type === 'love' ? (post.loves || 0) + 1 : post.loves
      };
      await supabase.from('posts').update(updates).eq('id', postId);
    }
};

// --- POINTS SYSTEM ---

export const updatePoints = async (userId: string, amount: number, mode: 'add' | 'subtract' | 'set'): Promise<number> => {
  // 1. Get current state (Cloud + Local merged)
  const allUsers = await getUsers();
  const currentUser = allUsers.find(u => u.id === userId);

  if (!currentUser) return 0;

  let newBalance = 0;
  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  // 2. Update Object
  const updatedUser = { ...currentUser, points: newBalance };

  // 3. Save (Updates Local immediately + tries Cloud)
  await saveUser(updatedUser);
  
  return newBalance;
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
