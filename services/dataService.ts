
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

/**
 * ============================================================================
 * DATA SERVICE - CLOUD FIRST ARCHITECTURE
 * 
 * Strategy:
 * 1. READ: Always attempt to fetch from Supabase first.
 * 2. WRITE: Critical data (Users/Points) MUST go to Supabase.
 * ============================================================================
 */

const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

// --- MAPPING HELPERS (Fix for 'Column not found' errors) ---

// Map DB (snake_case) -> Frontend (camelCase)
const mapDBUserToFrontend = (u: any): User => ({
  id: u.id,
  email: u.email,
  name: u.name,
  password: u.password, // Note: In prod, do not fetch passwords
  avatar: u.avatar || '😀',
  points: u.points || 0,
  role: u.role || 'user',
  vipLevel: u.vip_level || 1,
  solAddress: u.sol_address || '',
  gender: u.gender || 'O',
  phone: u.phone || '',
  address: u.address || '',
  // Convert ISO string back to timestamp number
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
    // Convert timestamp number to ISO string for Postgres
    joined_at: u.joinedAt ? new Date(u.joinedAt).toISOString() : new Date().toISOString(),
    last_login: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date().toISOString(),
  };
};

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  // Always try cloud first for users to ensure we see new registrations
  const { data, error } = await supabase.from('users').select('*');
      
  if (!error && data) {
    // Map DB rows to Frontend User objects
    const mappedUsers = data.map(mapDBUserToFrontend);
    
    // Sort in memory
    const sorted = mappedUsers.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
    
    // Cache for offline fallback only
    localStorage.setItem('hker_users_cache', JSON.stringify(sorted));
    return sorted;
  } else {
    console.warn("Failed to fetch users from Cloud, using cache.", error);
  }
  
  // Fallback
  const cached = localStorage.getItem('hker_users_cache');
  return cached ? JSON.parse(cached) : [];
};

export const saveUser = async (user: User): Promise<boolean> => {
  // 1. Critical: Write to Cloud with correct mapping
  const dbUser = mapFrontendUserToDB(user);
  
  const { error } = await supabase
    .from('users')
    .upsert(dbUser);
    
  if (error) {
    console.error("❌ CRITICAL: Supabase Save User Failed:", JSON.stringify(error, null, 2));
    // Do not alert in loop/background tasks, but helpful for debugging
    if (!error.message.includes('duplicate')) {
       console.warn(`User Save Failed: ${error.message}`);
    }
    return false;
  }

  // 2. Update Local Cache (Optimistic UI)
  try {
    const cached = localStorage.getItem('hker_users_cache');
    const cachedUsers: User[] = cached ? JSON.parse(cached) : [];
    const existingIdx = cachedUsers.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) cachedUsers[existingIdx] = user;
    else cachedUsers.push(user);
    localStorage.setItem('hker_users_cache', JSON.stringify(cachedUsers));
  } catch (e) {
    console.warn("Local cache update failed, but cloud save was successful.");
  }

  return true;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await supabase.from('users').delete().eq('id', userId);
  
  // Update cache
  const cached = localStorage.getItem('hker_users_cache');
  if (cached) {
    const users = JSON.parse(cached) as User[];
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('hker_users_cache', JSON.stringify(newUsers));
  }
};

// --- HEARTBEAT & STATS (REAL-TIME) ---

export const updateHeartbeat = async (userId: string): Promise<void> => {
  const now = new Date().toISOString();
  // Fire and forget - use mapped column name
  supabase.from('users').update({ last_login: now }).eq('id', userId).then(({ error }) => {
     if (error) console.error("Heartbeat error:", error.message);
  });
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

  Object.keys(dbPost).forEach(key => {
      if (dbPost[key] === undefined) delete dbPost[key];
  });

  const { error } = await supabase.from('posts').upsert(dbPost);
  if (error) {
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      console.warn("Post duplicate skipped.");
      return true; 
    }
    console.error("Supabase Save Post Error:", JSON.stringify(error, null, 2));
    return false;
  }
  return true;
};

export const deletePost = async (postId: string): Promise<void> => {
  if (!postId.includes('-')) {
      await supabase.from('posts').delete().eq('id', postId);
  }
  const posts = await getPosts(); // Refresh
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

// --- POINTS SYSTEM ---

export const updatePoints = async (userId: string, amount: number, mode: 'add' | 'subtract' | 'set'): Promise<number> => {
  // 1. Fetch latest user state from DB
  const { data: dbRows, error } = await supabase.from('users').select('*').eq('id', userId);

  if (error || !dbRows || dbRows.length === 0) {
    console.error("Cannot update points, user not found in DB or Network error.");
    return 0;
  }
  
  const currentUser = mapDBUserToFrontend(dbRows[0]);

  let newBalance = 0;
  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  // 2. Write back to DB (Using mapped function)
  currentUser.points = newBalance;
  await saveUser(currentUser);
  
  return newBalance;
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
