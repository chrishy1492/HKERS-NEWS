
import { supabase } from './supabaseClient';
import { User, Post } from '../types';

// Local Cache Keys (Temporary Storage Area)
const KEY_CURRENT_USER = 'hker_current_user_v6_sync';
const KEY_ALL_USERS = 'hker_all_users_cache_v6'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v6';

export const MockDB = {
  
  // --- USERS (Supabase Primary, Local Cache) ---

  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) {
            localStorage.setItem(KEY_ALL_USERS, JSON.stringify(data));
            return data as User[];
        }
        throw error;
    } catch (e) { 
        console.warn("Sync: Network error, serving from cache.", e); 
        return JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
    }
  },

  getCurrentUser: (): User | null => {
    const local = localStorage.getItem(KEY_CURRENT_USER);
    return local ? JSON.parse(local) : null;
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

    if (error || !data) {
        throw new Error("User not found (用戶不存在) - Please Register First");
    }

    const user = data as User;

    if (password && user.password && user.password !== password) {
        throw new Error("Invalid Password (密碼錯誤)");
    }

    if (user.isBanned) throw new Error("Account Banned (此帳戶已被封鎖)");

    const now = Date.now();
    await supabase.from('users').update({ lastActive: now }).eq('id', user.id);

    const sessionUser = { ...user, lastActive: now };
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));

    return sessionUser;
  },

  register: async (user: User): Promise<void> => {
    const { data } = await supabase.from('users').select('email').eq('email', user.email).maybeSingle();
    if (data) throw new Error("Email already registered (此電郵已被註冊)");

    const { error } = await supabase.from('users').insert(user);
    if (error) {
        console.error(error);
        throw new Error("Database Error: " + error.message);
    }
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  saveUser: async (user: User): Promise<void> => {
      const { error } = await supabase.from('users').upsert(user).eq('id', user.id);
      if (error) console.error("Save User Error", error);

      const current = MockDB.getCurrentUser();
      if(current && current.id === user.id) {
          localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
      }
  },

  deleteUser: async (id: string): Promise<void> => {
      await supabase.from('users').delete().eq('id', id);
  },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
      const { data: userData } = await supabase.from('users').select('points').eq('id', userId).single();
      if (!userData) return -1;

      const newPoints = Math.max(0, userData.points + delta);

      const { error } = await supabase.from('users').update({ points: newPoints }).eq('id', userId);
      
      if (!error) {
          const current = MockDB.getCurrentUser();
          if(current && current.id === userId) {
              current.points = newPoints;
              localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(current));
          }
          return newPoints;
      }
      return -1;
  },

  // --- POSTS (Real Data from Supabase) ---
  
  getPosts: async (): Promise<Post[]> => {
      try {
          // Fetch posts (including new robot fields)
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

          if (!error && data) {
              // DATA MAPPING & SANITIZATION
              const cleanData = data.map((p: any) => {
                  const likesArr = Array.isArray(p.likes) ? p.likes : [];
                  const heartsArr = Array.isArray(p.loves) ? p.loves : [];
                  
                  // Construct userInteractions map (approximated from arrays)
                  const userInteractions: Record<string, any> = {};
                  likesArr.forEach((uid: string) => {
                      if(!userInteractions[uid]) userInteractions[uid] = {likes:0, hearts:0};
                      userInteractions[uid].likes = 1;
                  });
                  heartsArr.forEach((uid: string) => {
                      if(!userInteractions[uid]) userInteractions[uid] = {likes:0, hearts:0};
                      userInteractions[uid].hearts = 1;
                  });

                  return {
                      id: p.id,
                      title: p.title,
                      titleCN: p.titleCN, // Optional DB field
                      content: p.content,
                      contentCN: p.contentCN, // Optional DB field
                      region: p.region || 'Global',
                      category: p.category || 'General',
                      author: p.author || 'Anonymous',
                      authorId: p.author_id || p.authorId,
                      // STRICT MAPPING: DB (snake_case) -> Frontend (camelCase)
                      isRobot: p.is_robot === true, 
                      timestamp: p.timestamp,
                      displayDate: new Date(p.timestamp).toLocaleString(),
                      likes: likesArr.length,
                      hearts: heartsArr.length,
                      views: p.views || 0,
                      source: (typeof p.source === 'string' && p.source !== '[object Object]') ? p.source : 'System',
                      // STRICT MAPPING: DB (snake_case) -> Frontend (camelCase)
                      sourceUrl: p.source_url, 
                      userInteractions: userInteractions,
                      replies: p.replies || []
                  };
              });

              localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(cleanData));
              return cleanData as Post[];
          }
      } catch (e) { console.warn("Offline mode for posts", e); }

      return JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
  },

  savePost: async (post: Post): Promise<void> => {
      // Optimistic Cache Update
      let cached = JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
      const idx = cached.findIndex((p: Post) => p.id === post.id);
      if (idx >= 0) cached[idx] = post;
      else cached.unshift(post);
      localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(cached));

      // DB Update
      const safePost = {
          ...post,
          is_robot: post.isRobot, // Map back to DB field for storage
          source_url: post.sourceUrl
      };
      await supabase.from('posts').upsert(safePost);
  },

  deletePost: async (postId: string): Promise<void> => {
      await supabase.from('posts').delete().eq('id', postId);
  },

  // --- ANALYTICS ---
  
  getAnalytics: async () => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;

      const { count: totalMembers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: newMembersToday } = await supabase.from('users')
        .select('*', { count: 'exact', head: true })
        .gt('joinedAt', oneDayAgo);
      const { count: activeMembersToday } = await supabase.from('users')
        .select('*', { count: 'exact', head: true })
        .gt('lastActive', oneDayAgo);

      const hourKey = new Date().getHours();
      const guestsToday = Math.floor(100 + (hourKey * 15) + (Math.random() * 5)); 

      return {
          totalMembers: totalMembers || 0,
          newMembersToday: newMembersToday || 0,
          activeMembersToday: activeMembersToday || 0,
          guestsToday: guestsToday
      };
  },

  // --- ROBOT LOGIC (DEPRECATED: Now handled by Vercel Cron) ---
  
  triggerRobotPost: async () => {
       // Placeholder: Managed by Server-side Cron
       console.log("Robot posts are managed by Server-side Cron Jobs.");
  },

  recordVisit: async (isLoggedIn: boolean) => {
      if (isLoggedIn) {
          const user = MockDB.getCurrentUser();
          if (user) {
              const now = Date.now();
              if (!user.lastActive || (now - user.lastActive > 300000)) {
                   await supabase.from('users').update({ lastActive: now }).eq('id', user.id);
                   user.lastActive = now;
                   localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
              }
          }
      }
  }
};
