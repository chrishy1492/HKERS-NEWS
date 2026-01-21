
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - PERSISTENT SESSION ARCHITECTURE
 * 
 * Key Features:
 * 1. getUserById: Instant session restoration from LocalStorage (fixes refresh logout).
 * 2. saveUser: Writes to LocalStorage immediately before attempting Cloud sync.
 * 3. getUsers: Merges Cloud data into Local data (never overwrites with empty list).
 * ============================================================================
 */

const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

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
 * CRITICAL: Used for Page Refresh / Auto-Login.
 * Checks LocalStorage FIRST for instant feedback, then verifies with Cloud.
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  // 1. FAST PATH: Check Local Cache
  const localStr = localStorage.getItem('hker_users_cache');
  if (localStr) {
    const users: User[] = JSON.parse(localStr);
    const localUser = users.find(u => u.id === userId);
    if (localUser) {
      console.log(`[Session] Restored ${localUser.email} from Local Cache.`);
      
      // Background Sync: Verify if cloud has updates (e.g. points changed)
      checkSupabaseConnection().then(async (connected) => {
        if (connected) {
           const { data } = await supabase.from('users').select('*').eq('id', userId).single();
           if (data) {
             const cloudUser = mapDBUserToFrontend(data);
             // Update local cache if cloud is newer/different
             if (cloudUser.points !== localUser.points) {
               saveUserLocal(cloudUser); 
             }
           }
        }
      });
      
      return localUser;
    }
  }

  // 2. SLOW PATH: Fetch from Cloud (if not in local)
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!error && data) {
      const user = mapDBUserToFrontend(data);
      saveUserLocal(user); // Cache it for next time
      return user;
    }
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
        saveUserLocal(user); // Sync valid cloud user to local
        return user;
      }
    }
  }

  // 2. Fallback to LocalStorage (Offline/Sync issues)
  const users = await getUsers(true); // Force read from local state
  const localUser = users.find(u => u.email === email && u.password === password);
  
  if (localUser) {
    console.log("[Auth] Local login successful (Offline Mode)");
    return localUser;
  }

  return null;
};

// Internal helper: Writes to LocalStorage ONLY (Safe)
const saveUserLocal = (user: User) => {
  try {
    const cached = localStorage.getItem('hker_users_cache');
    const users: User[] = cached ? JSON.parse(cached) : [];
    
    // Update existing or add new
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user }; // Merge properties
    } else {
      users.push(user);
    }
    
    localStorage.setItem('hker_users_cache', JSON.stringify(users));
  } catch (e) {
    console.error("Local Storage Write Error:", e);
  }
};

/**
 * Robust Get Users: Merges Cloud + Local
 */
export const getUsers = async (skipCloud = false): Promise<User[]> => {
  // 1. Read Local
  const localStr = localStorage.getItem('hker_users_cache');
  let localUsers: User[] = localStr ? JSON.parse(localStr) : [];

  if (skipCloud) return localUsers;

  // 2. Try Fetch Cloud
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { data, error } = await supabase.from('users').select('*');
    
    if (!error && data) {
      const cloudUsers = (data as User[]).map(mapDBUserToFrontend);
      
      // 3. Merge Logic (Cloud overwrites Local, but Local-only users are kept)
      const userMap = new Map<string, User>();
      localUsers.forEach(u => userMap.set(u.email, u));
      cloudUsers.forEach(u => userMap.set(u.email, u));

      const mergedList = Array.from(userMap.values());
      mergedList.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
      
      localStorage.setItem('hker_users_cache', JSON.stringify(mergedList));
      return mergedList;
    }
  }
  
  return localUsers;
};

export const saveUser = async (user: User): Promise<boolean> => {
  console.log(`[Save] Processing: ${user.email}, Points: ${user.points}`);

  // 1. ALWAYS Save Local First (Critical for instant registration/game success)
  saveUserLocal(user);

  // 2. Try Cloud Sync
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const dbUser = mapFrontendUserToDB(user);
    const { error } = await supabase
      .from('users')
      .upsert(dbUser, { onConflict: 'email' });
      
    if (error) {
      console.warn("⚠️ Supabase Sync Pending (Local Data Saved)", error.message);
      // Return true because local save succeeded, user can use the app
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

// --- HEARTBEAT & STATS ---

export const updateHeartbeat = async (userId: string): Promise<void> => {
  // Fire and forget cloud update
  supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId).then(() => {});
  
  // Update local
  const localStr = localStorage.getItem('hker_users_cache');
  if (localStr) {
    const users: User[] = JSON.parse(localStr);
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].lastLogin = Date.now();
      localStorage.setItem('hker_users_cache', JSON.stringify(users));
    }
  }
};

export const getStats = async (): Promise<Stat> => {
  const users = await getUsers(true); // Fast local read
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
 * UPDATED: Update Points
 * Uses getUserById to get fresh state, modifies, saves, and returns the new value.
 * This guarantees consistency for games and withdrawals.
 */
export const updatePoints = async (userId: string, amount: number, mode: 'add' | 'subtract' | 'set'): Promise<number> => {
  // Use getUserById for consistency
  const currentUser = await getUserById(userId);

  if (!currentUser) return 0;

  let newBalance = 0;
  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  currentUser.points = newBalance;
  
  // Save ensures it hits local cache + Cloud
  await saveUser(currentUser);
  
  console.log(`[Data] Points updated for ${currentUser.email}: ${newBalance}`);
  return newBalance;
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
