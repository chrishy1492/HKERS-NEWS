
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, Comment } from '../types';

const KEY_CURRENT_USER = 'hker_current_user_v5';
const KEY_ALL_USERS = 'hker_all_users_db_v5'; // Persistent local DB
const KEY_LOCAL_POSTS = 'hker_local_posts_db_v5';

const FORBIDDEN_KEYWORDS = [
  'Xi Jinping', 'Tiananmen', 'June 4', 'Independence',
  '習近平', '六四', 'Article 23', 'National Security', '國安法' // Robot respects laws
];

const SOURCE_DOMAINS: Record<string, string> = {
    'BBC': 'https://www.bbc.com/news',
    'CNN': 'https://edition.cnn.com',
    'Reuters': 'https://www.reuters.com',
    'HK Free Press': 'https://hongkongfp.com',
    'SCMP': 'https://www.scmp.com'
};

const generateRobotContent = (region: string, topic: string) => {
    const sources = Object.keys(SOURCE_DOMAINS);
    const randSource = sources[Math.floor(Math.random() * sources.length)];
    const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;

    const titleEN = `[${region}] Latest Updates on ${topic}: Market & Community Trends`;
    const titleCN = `【${REGIONS_CN[region]}】關於${CATEGORIES_CN[topic]}的最新動態：市場與社區趨勢`;

    const contentEN = `
(This article is summarized by HKER AI Robot. Source: ${randSource})

**Key Highlights:**
1. Recent developments in ${region} regarding ${topic} have shown significant activity.
2. Local experts suggest that this trend will continue for the next quarter.
3. Community feedback has been mixed, with some residents expressing optimism.

**Disclaimer:**
This content is AI-generated for informational purposes only. Please refer to the original source for full details. 
Source Link: ${mockUrl}
    `.trim();

    const contentCN = `
(本文章由 HKER AI 機械人摘要。來源：${randSource})

**重點摘要：**
1. ${REGIONS_CN[region]} 地區關於 ${CATEGORIES_CN[topic]} 的近期發展顯示出顯著活躍。
2. 當地專家建議這一趨勢將在下一季度持續。
3. 社區反饋意見不一，部分居民表示樂觀。

**免責聲明：**
本內容由 AI 生成，僅供參考。詳情請參閱原文。
原文連結：${mockUrl}
    `.trim();

    return { titleEN, titleCN, contentEN, contentCN, source: randSource, url: mockUrl };
};

export const MockDB = {
  
  // --- USERS ---

  getUsers: async (): Promise<User[]> => {
    // Try Cloud
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) return data as User[];
    } catch (e) { console.warn("Cloud getUsers failed, using local."); }
    
    // Fallback Local
    return JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
  },

  getCurrentUser: (): User | null => {
    const local = localStorage.getItem(KEY_CURRENT_USER);
    return local ? JSON.parse(local) : null;
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    let user: User | null = null;
    
    // 1. Try Cloud Login
    try {
        const { data, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
        if (!error && data) user = data as User;
    } catch (e) {
        console.warn("Cloud login failed/offline. Attempting local login.");
    }

    // 2. Fallback to Local DB
    if (!user) {
        const allUsers: User[] = JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
        user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    if (!user) throw new Error("User not found (用戶不存在) - Please Register First");

    // 3. Verify Password
    if (password && user.password && user.password !== password) {
        throw new Error("Invalid Password (密碼錯誤)");
    }

    if (user.isBanned) throw new Error("Account Banned (此帳戶已被封鎖)");

    // 4. Update Session & Last Active
    const updatedUser = { ...user, lastActive: Date.now() };
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(updatedUser));
    
    // Fire & Forget cloud update
    try { supabase.from('users').update({ lastActive: Date.now() }).eq('id', user.id).then(); } catch(e){}

    return updatedUser;
  },

  register: async (user: User): Promise<void> => {
    // 1. Check Local Duplicates
    const allUsers: User[] = JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
    if (allUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        throw new Error("Email already registered locally (此電郵已被註冊)");
    }

    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) user.role = UserRole.ADMIN;

    // 2. Save Local
    allUsers.push(user);
    localStorage.setItem(KEY_ALL_USERS, JSON.stringify(allUsers));

    // 3. Try Save Cloud (Async, ignore error to allow registration without net)
    try {
        const { error } = await supabase.from('users').insert(user);
        if (error) console.warn("Supabase register error:", error.message);
    } catch (e) {
        console.warn("Cloud unavailable, registered locally.");
    }

    // 4. Set Session
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  saveUser: async (user: User): Promise<void> => {
      // Local
      let allUsers: User[] = JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
      const idx = allUsers.findIndex(u => u.id === user.id);
      if (idx >= 0) allUsers[idx] = user;
      else allUsers.push(user);
      localStorage.setItem(KEY_ALL_USERS, JSON.stringify(allUsers));
      
      // Update Session if it's self
      const current = MockDB.getCurrentUser();
      if(current && current.id === user.id) localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));

      // Cloud
      try { await supabase.from('users').upsert(user); } catch(e){}
  },

  deleteUser: async (id: string): Promise<void> => {
      // Local
      let allUsers: User[] = JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
      allUsers = allUsers.filter(u => u.id !== id);
      localStorage.setItem(KEY_ALL_USERS, JSON.stringify(allUsers));
      // Cloud
      try { await supabase.from('users').delete().eq('id', id); } catch(e){}
  },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
      // Optimistic Local Update
      let allUsers: User[] = JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
      const idx = allUsers.findIndex(u => u.id === userId);
      if (idx === -1) return -1;

      const newPoints = Math.max(0, allUsers[idx].points + delta);
      allUsers[idx].points = newPoints;
      localStorage.setItem(KEY_ALL_USERS, JSON.stringify(allUsers));

      // Sync Session
      const current = MockDB.getCurrentUser();
      if(current && current.id === userId) {
          current.points = newPoints;
          localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(current));
      }

      // Cloud
      try { await supabase.from('users').update({ points: newPoints }).eq('id', userId); } catch(e){}

      return newPoints;
  },

  // --- POSTS ---
  
  getPosts: async (): Promise<Post[]> => {
      // Try Cloud first
      try {
          const { data, error } = await supabase.from('posts').select('*').order('timestamp', { ascending: false }).limit(50);
          if (!error && data && data.length > 0) {
              localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(data));
              return data as Post[];
          }
      } catch (e) {}

      // Fallback
      return JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
  },

  savePost: async (post: Post): Promise<void> => {
      // Local
      let posts: Post[] = JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
      const idx = posts.findIndex(p => p.id === post.id);
      if (idx >= 0) posts[idx] = post;
      else posts.unshift(post);
      localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(posts));

      // Cloud
      try { await supabase.from('posts').upsert(post); } catch(e){}
  },

  deletePost: async (postId: string): Promise<void> => {
      let posts: Post[] = JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
      posts = posts.filter(p => p.id !== postId);
      localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(posts));
      try { await supabase.from('posts').delete().eq('id', postId); } catch(e){}
  },

  addComment: async (postId: string, user: User, content: string): Promise<void> => {
    const newComment: Comment = {
        id: `c-${Date.now()}-${Math.random()}`,
        postId,
        author: user.name,
        authorId: user.id,
        content,
        timestamp: Date.now()
    };
    
    // Get post, update replies
    const posts = await MockDB.getPosts();
    const post = posts.find(p => p.id === postId);
    if(post) {
        post.replies = [...(post.replies || []), newComment];
        await MockDB.savePost(post);
    }
  },
  
  // Analytics & Robot
  getAnalytics: async () => {
      const users = await MockDB.getUsers();
      const now = Date.now();
      return {
          totalMembers: users.length,
          newMembersToday: users.filter(u => (u.joinedAt || 0) > now - 86400000).length,
          activeMembersToday: users.filter(u => (u.lastActive || 0) > now - 86400000).length,
          guestsToday: Math.floor(Math.random() * 100)
      };
  },

  triggerRobotPost: async () => {
       const posts = await MockDB.getPosts();
       const lastRobot = posts.find(p => p.isRobot);
       const now = Date.now();

       if (lastRobot && (now - lastRobot.timestamp < 120000)) return;

       const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
       const topic = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
       const contentData = generateRobotContent(region, topic);
       
       const newPost: Post = {
        id: `bot-${now}-${Math.random().toString(36).substr(2, 5)}`,
        title: contentData.titleEN,
        titleCN: contentData.titleCN,
        content: contentData.contentEN,
        contentCN: contentData.contentCN,
        region: region,
        category: topic,
        author: `${region} AI Robot`,
        authorId: 'system-bot',
        isRobot: true,
        timestamp: now,
        displayDate: new Date(now).toLocaleString(),
        likes: Math.floor(Math.random() * 20),
        hearts: Math.floor(Math.random() * 20),
        views: Math.floor(Math.random() * 100),
        source: contentData.source,
        sourceUrl: contentData.url,
        botId: `BOT-${Math.floor(Math.random() * 99)}`,
        replies: []
    };
    
    await MockDB.savePost(newPost);
  },

  recordVisit: async (isLoggedIn: boolean) => {
      if (isLoggedIn) {
          const user = MockDB.getCurrentUser();
          if (user) {
              const now = Date.now();
              if (!user.lastActive || (now - user.lastActive > 300000)) {
                   user.lastActive = now;
                   localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
                   MockDB.saveUser(user);
              }
          }
      }
  }
};
