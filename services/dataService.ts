
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - PERSISTENT SESSION ARCHITECTURE
 * 
 * Key Features:
 * 1. getUserById: Instant session restoration with "Stale-While-Revalidate" logic.
 * 2. Write Lock: Prevents background fetch from reverting recent local changes.
 * 3. updatePoints: Atomic-like operations with local-first optimistic updates.
 * ============================================================================
 */

const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

// Global timestamp to track the last time we modified data locally.
// This prevents the background poller from overwriting our new data with stale cloud data.
let lastLocalWriteTime = 0;
const WRITE_LOCK_DURATION = 5000; // 5 seconds lock

// --- MAPPING HELPERS ---

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

// --- CORE USER MANAGEMENT ---

/**
 * CRITICAL FIX: "Revert" Prevention Logic
 * When fetching user data, we check if a local write happened recently.
 * If yes, we skip the cloud data (which might be stale) and return local data.
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  // 1. FAST PATH: Check Local Cache
  const localStr = localStorage.getItem('hker_users_cache');
  let localUser: User | null = null;
  
  if (localStr) {
    const users: User[] = JSON.parse(localStr);
    localUser = users.find(u => u.id === userId) || null;
  }

  // 2. WRITE LOCK CHECK (Fix for Revert Issue)
  // If we wrote data locally < 5 seconds ago, TRUST LOCAL. Do not fetch cloud.
  if (localUser && (Date.now() - lastLocalWriteTime < WRITE_LOCK_DURATION)) {
    console.log(`[Session] Skipping cloud fetch due to recent write lock (${Date.now() - lastLocalWriteTime}ms)`);
    return localUser;
  }

  // 3. Background Sync / Fetch
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    
    if (!error && data) {
      const cloudUser = mapDBUserToFrontend(data);
      
      // Only update local cache if we are NOT in a locked state (double check)
      if (Date.now() - lastLocalWriteTime >= WRITE_LOCK_DURATION) {
         saveUserLocal(cloudUser);
         return cloudUser;
      }
    }
  }

  // If cloud failed or locked, return local
  if (localUser) {
    return localUser;
  }

  return null;
};

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  console.log(`[Auth] Authenticating: ${email}`);
  
  // 1. Try Cloud (Authoritative)
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!error && data) {
      if (data.password === password) {
        const user = mapDBUserToFrontend(data);
        saveUserLocal(user);
        return user;
      }
    }
  }

  // 2. Fallback to LocalStorage
  const users = await getUsers(true);
  const localUser = users.find(u => u.email === email && u.password === password);
  
  if (localUser) {
    console.log("[Auth] Local login successful (Offline Mode)");
    return localUser;
  }

  return null;
};

// Internal helper: Writes to LocalStorage
const saveUserLocal = (user: User) => {
  try {
    const cached = localStorage.getItem('hker_users_cache');
    const users: User[] = cached ? JSON.parse(cached) : [];
    
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    
    localStorage.setItem('hker_users_cache', JSON.stringify(users));
  } catch (e) {
    console.error("Local Storage Write Error:", e);
  }
};

export const getUsers = async (skipCloud = false): Promise<User[]> => {
  const localStr = localStorage.getItem('hker_users_cache');
  let localUsers: User[] = localStr ? JSON.parse(localStr) : [];

  if (skipCloud) return localUsers;

  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data) {
      const cloudUsers = (data as User[]).map(mapDBUserToFrontend);
      // Merge logic...
      const userMap = new Map<string, User>();
      localUsers.forEach(u => userMap.set(u.email, u));
      cloudUsers.forEach(u => userMap.set(u.email, u)); 
      const mergedList = Array.from(userMap.values());
      
      localStorage.setItem('hker_users_cache', JSON.stringify(mergedList));
      return mergedList;
    }
  }
  return localUsers;
};

export const saveUser = async (user: User): Promise<boolean> => {
  saveUserLocal(user); // Always save local first
  lastLocalWriteTime = Date.now(); // Set Lock

  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const dbUser = mapFrontendUserToDB(user);
    const { error } = await supabase.from('users').upsert(dbUser, { onConflict: 'email' });
    if (error) {
      console.warn("⚠️ Supabase Sync Pending", error.message);
      return true; 
    }
  }
  return true;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await supabase.from('users').delete().eq('id', userId);
  const localStr = localStorage.getItem('hker_users_cache');
  if (localStr) {
    const users: User[] = JSON.parse(localStr);
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('hker_users_cache', JSON.stringify(newUsers));
  }
};

export const updateHeartbeat = async (userId: string): Promise<void> => {
  supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId).then(() => {});
};

export const getStats = async (): Promise<Stat> => {
  const users = await getUsers(true);
  const now = Date.now();
  const todayTs = new Date().setHours(0,0,0,0);

  return {
    onlineUsers: Math.max(users.filter(u => (now - (u.lastLogin || 0)) < 5*60*1000).length, 1),
    totalUsers: users.length,
    todayRegisters: users.filter(u => (u.joinedAt || 0) >= todayTs).length,
    todayVisits: users.filter(u => (u.lastLogin || 0) >= todayTs).length
  };
};

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
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100); 
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

/**
 * FIXED: Update Points with strict write lock.
 * Ensures the returned balance is always the calculated new balance.
 * Updates local storage immediately and sets a lock to prevent background fetch reversion.
 */
export const updatePoints = async (userId: string, amount: number, mode: 'add' | 'subtract' | 'set'): Promise<number> => {
  let currentUser: User | null = null;

  // 1. Try get fresh from Cloud first (for base)
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) {
      currentUser = mapDBUserToFrontend(data);
    }
  }

  // Fallback to local if cloud fetch failed (Ensure we can always play games)
  if (!currentUser) {
    const users = await getUsers(true); 
    currentUser = users.find(u => u.id === userId) || null;
  }

  if (!currentUser) {
    console.error("[Data] updatePoints failed: User not found");
    return 0;
  }

  // 2. Calculate New Balance based on what we have
  let newBalance = currentUser.points;
  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  // 3. Update Object & Local Storage IMMEDIATELY
  currentUser.points = newBalance;
  saveUserLocal(currentUser);
  
  // 4. Set Write Lock (Critical for fixing revert issue)
  lastLocalWriteTime = Date.now();

  // 5. Sync to Cloud (Fire and forget, or await if needed)
  if (isConnected) {
      // Use direct update for atomicity where possible
      await supabase.from('users').update({ points: newBalance }).eq('id', userId);
  }
  
  console.log(`[Data] Points updated: ${newBalance} (Lock active)`);
  return newBalance;
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
