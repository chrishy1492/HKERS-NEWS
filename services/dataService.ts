
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - LOCAL FIRST + CLOUD SYNC (HYBRID ARCHITECTURE)
 * 
 * Strategy:
 * 1. WRITE: Local Storage (Sync/Instant) -> Supabase (Async/Background)
 * 2. READ: Local Storage (Priority) -> Supabase (Fallback/Login)
 * 3. AUTH: Allow offline/local session persistence to prevent auto-logout.
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
    joined_at: new Date(u.joinedAt).toISOString(),
    last_login: new Date(u.lastLogin || Date.now()).toISOString()
  };
};

// --- USERS ---

// Get specific user from local cache (fastest)
export const getUserByIdLocal = async (userId: string): Promise<User | null> => {
  try {
    const raw = localStorage.getItem('hker_users_cache');
    if (!raw) return null;
    const users: User[] = JSON.parse(raw);
    return users.find(u => u.id === userId) || null;
  } catch(e) {
    return null;
  }
};

export const getUsers = async (forceCloud = false): Promise<User[]> => {
  // 1. Return Local Cache immediately if not forced
  if (!forceCloud) {
    try {
      const cached = localStorage.getItem('hker_users_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn("Local cache read error", e);
    }
  }

  // 2. Fetch from Cloud (Supabase)
  try {
    // Timeout to prevent hanging if Supabase is blocked
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    const fetchPromise = checkSupabaseConnection().then(async (isConnected) => {
        if (isConnected) {
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;
            return data;
        }
        return null;
    });

    const cloudData = await Promise.race([fetchPromise, timeoutPromise]);

    if (cloudData) {
      const sorted = (cloudData as any[]).map(mapDBUserToFrontend).sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
      // Update cache
      localStorage.setItem('hker_users_cache', JSON.stringify(sorted));
      return sorted;
    }
  } catch (e) {
    console.warn("Cloud fetch failed, fallback to local cache:", e);
  }

  // 3. Fallback to cache if cloud failed
  const cached = localStorage.getItem('hker_users_cache');
  return cached ? JSON.parse(cached) : [];
};

export const saveUser = async (user: User): Promise<boolean> => {
  // 1. Optimistic Update (Local Storage) - INSTANT
  try {
    const raw = localStorage.getItem('hker_users_cache');
    let cachedUsers: User[] = raw ? JSON.parse(raw) : [];
    
    const existingIdx = cachedUsers.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) cachedUsers[existingIdx] = user;
    else cachedUsers.push(user);
    
    localStorage.setItem('hker_users_cache', JSON.stringify(cachedUsers));
  } catch (e) {
    console.error("Local Storage Write Error:", e);
  }

  // 2. Background Sync (Supabase) - FIRE AND FORGET
  // Do NOT await this, let it run in background to prevent UI blocking
  checkSupabaseConnection().then(async (isConnected) => {
      if(isConnected) {
          const dbUser = mapFrontendUserToDB(user);
          const { error } = await supabase.from('users').upsert(dbUser);
          if (error) {
             console.error("Supabase Background Sync Failed:", error.message);
          } else {
             console.log("Supabase Background Sync Success:", user.email);
          }
      }
  }).catch(err => console.error("Supabase Connection Check Failed:", err));

  return true; // Always return true immediately to unblock UI
};

export const deleteUser = async (userId: string): Promise<void> => {
  // Async delete from cloud
  checkSupabaseConnection().then(async (isConnected) => {
      if(isConnected) await supabase.from('users').delete().eq('id', userId);
  });
  
  // Local delete
  const raw = localStorage.getItem('hker_users_cache');
  if (raw) {
    let users: User[] = JSON.parse(raw);
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('hker_users_cache', JSON.stringify(newUsers));
  }
};

// --- HEARTBEAT & STATS (REAL-TIME) ---

export const updateHeartbeat = async (userId: string): Promise<void> => {
  // Fire and forget cloud update
  supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId).then(() => {});
  
  // Update local cache quietly
  const raw = localStorage.getItem('hker_users_cache');
  if (raw) {
    const users: User[] = JSON.parse(raw);
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].lastLogin = Date.now();
      localStorage.setItem('hker_users_cache', JSON.stringify(users));
    }
  }
};

export const getStats = async (): Promise<Stat> => {
  const users = await getUsers(); // Priorities cache
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
  
  const onlineThreshold = 15 * 60 * 1000; // 15 mins
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
  try {
      const fetchPromise = checkSupabaseConnection().then(async (isConnected) => {
        if (isConnected) {
            const { data } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
            return data;
        }
        return null;
      });
      
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
      const data = await Promise.race([fetchPromise, timeoutPromise]);

      if (data) {
        const hydratedPosts = (data as any[]).map(mapDBPostToFrontend);
        localStorage.setItem('hker_posts_cache', JSON.stringify(hydratedPosts));
        return hydratedPosts as Post[];
      }
  } catch (e) {
      console.warn("Post fetch failed, using cache");
  }
  
  const cached = localStorage.getItem('hker_posts_cache');
  return cached ? JSON.parse(cached) : [];
};

export const savePost = async (post: Post): Promise<boolean> => {
  checkSupabaseConnection().then(async (isConnected) => {
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

        await supabase.from('posts').upsert(dbPost);
      }
  });
  return true;
};

export const deletePost = async (postId: string): Promise<void> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected && !postId.includes('-')) {
    await supabase.from('posts').delete().eq('id', postId);
  }
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
  // Local First Logic for Points - Critical for Games
  const raw = localStorage.getItem('hker_users_cache');
  let users: User[] = raw ? JSON.parse(raw) : [];
  let currentUser = users.find(u => u.id === userId);

  if (!currentUser) return 0;

  let newBalance = 0;
  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  currentUser.points = newBalance;
  
  // Save locally first (Sync)
  localStorage.setItem('hker_users_cache', JSON.stringify(users));
  
  // Sync background
  saveUser(currentUser); 
  
  return newBalance;
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
