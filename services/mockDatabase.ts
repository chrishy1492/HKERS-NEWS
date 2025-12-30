import { createClient } from '@supabase/supabase-js';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, Comment } from '../types';

// 初始化 Supabase 連線
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const KEY_CURRENT_USER = 'hker_current_user_v3';

export const MockDB = {
  // --- 用戶相關 (改為從 Supabase 讀取) ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return data || [];
  },

  saveUser: async (user: User): Promise<void> => {
    const { error } = await supabase.from('users').upsert(user);
    if (error) console.error('Error saving user:', error);
    
    // 同步更新本地 Session
    const currentUserRaw = localStorage.getItem(KEY_CURRENT_USER);
    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      if (currentUser.id === user.id) {
        localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
      }
    }
  },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (fetchError || !user) return 0;

    const newPoints = Math.max(0, (user.points || 0) + delta);
    if (delta < 0 && (user.points + delta < 0)) return -1;

    const { error: updateError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    if (updateError) return 0;

    // 更新本地 Session
    const currentUserRaw = localStorage.getItem(KEY_CURRENT_USER);
    if (currentUserRaw) {
      const cUser = JSON.parse(currentUserRaw);
      if (cUser.id === userId) {
        cUser.points = newPoints;
        localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(cUser));
      }
    }
    return newPoints;
  },

  // --- 帖子相關 (改為從 Supabase 讀取) ---
  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
    return data || [];
  },

  savePost: async (post: Post): Promise<void> => {
    const { error } = await supabase.from('posts').upsert(post);
    if (error) console.error('Error saving post:', error);
  },

  // --- 登入與註冊 ---
  login: async (email: string): Promise<User | null> => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) return null;
    if (user.isBanned) throw new Error("This account has been banned.");
    
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
    return user;
  },

  register: async (user: User): Promise<void> => {
    // 檢查是否已註冊
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();

    if (existing) throw new Error("Email already registered");

    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      user.role = UserRole.ADMIN;
    }
    
    const { error } = await supabase.from('users').insert(user);
    if (error) throw error;

    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEY_CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  }
};