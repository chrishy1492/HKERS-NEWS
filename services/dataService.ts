
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('joinedAt', { ascending: false });
      
    if (!error && data) {
      // Sync to local for redundancy
      localStorage.setItem('hker_users_cache', JSON.stringify(data));
      return data as User[];
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
      console.error("Supabase Save User Error:", error);
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
      .order('timestamp', { ascending: false })
      .limit(100); // Get last 100 posts
      
    if (!error && data) {
      localStorage.setItem('hker_posts_cache', JSON.stringify(data));
      return data as Post[];
    }
  }
  const cached = localStorage.getItem('hker_posts_cache');
  return cached ? JSON.parse(cached) : [];
};

export const savePost = async (post: Post): Promise<boolean> => {
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    const { error } = await supabase.from('posts').upsert(post);
    if (error) {
      console.error("Supabase Save Post Error:", error);
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
  // Fetch current to increment safely
  const isConnected = await checkSupabaseConnection();
  if (isConnected) {
    // We use an RPC call or simple fetch-update strategy. 
    // For simplicity here, we fetch first.
    const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (post) {
      const updates = {
        likes: type === 'like' ? post.likes + 1 : post.likes,
        loves: type === 'love' ? post.loves + 1 : post.loves
      };
      await supabase.from('posts').update(updates).eq('id', postId);
    }
  }
};

// --- POINTS SYSTEM ---

export const updatePoints = async (userId: string, amount: number, mode: 'add' | 'subtract' | 'set'): Promise<number> => {
  const isConnected = await checkSupabaseConnection();
  let newBalance = 0;

  // 1. Get current remote state
  let currentUser: User | null = null;
  if (isConnected) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    currentUser = data;
  } else {
    const users = await getUsers();
    currentUser = users.find(u => u.id === userId) || null;
  }

  if (!currentUser) return 0;

  // 2. Calculate
  if (mode === 'set') newBalance = amount;
  else if (mode === 'add') newBalance = (currentUser.points || 0) + amount;
  else if (mode === 'subtract') newBalance = Math.max(0, (currentUser.points || 0) - amount);

  // 3. Save
  currentUser.points = newBalance;
  await saveUser(currentUser);
  
  return newBalance;
};

// --- STATS ---

export const getStats = async (): Promise<Stat> => {
  // Calculate stats dynamically from DB
  const users = await getUsers();
  
  const today = new Date().setHours(0,0,0,0);
  const todayRegisters = users.filter(u => u.joinedAt >= today).length;
  // Simulating visits based on login activity if we had it, or random for now
  const todayVisits = Math.floor(Math.random() * 50) + todayRegisters; 

  return {
    onlineUsers: Math.floor(Math.random() * 20) + 1, // Simulated
    totalUsers: users.length,
    todayRegisters,
    todayVisits
  };
};

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);
