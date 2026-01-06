
import { supabase } from './supabaseClient';
import { User, Post, UserRole } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// Local Cache Keys (Fallback only)
const KEY_CURRENT_USER = 'hker_current_user_v9_secure';
const KEY_ALL_USERS = 'hker_all_users_cache_v9'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v9';

// Global Lock for Robot Execution
let isBotProcessing = false;

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Configuration Arrays ---
const NEWS_REGIONS = [
    'Hong Kong', 'Taiwan', 'United Kingdom', 'USA', 'Canada', 'Australia', 'Europe'
];

const NEWS_TOPICS = [
    'Real Estate', 'Current Affairs', 'Finance', 'Entertainment', 
    'Travel', 'Digital/Tech', 'Cars/Automotive', 'Religion/Culture', 
    'Shopping Offers', 'Campus/Education', 'Weather', 'Community Events'
];

// --- UUID Helper ---
export const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try { return crypto.randomUUID(); } catch (e) { }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- SAFE STORAGE WRAPPER ---
const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        console.warn('LocalStorage Quota Full, clearing old caches...');
        localStorage.removeItem(KEY_ALL_USERS);
        try { localStorage.setItem(key, value); } catch (e2) {}
    }
};

const fromDbUser = (dbUser: any): User => {
    return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        password: dbUser.password,
        address: dbUser.address || '',
        phone: dbUser.phone || '',
        solAddress: dbUser.sol_address || dbUser.soladdress || '', 
        gender: dbUser.gender || '',
        role: dbUser.role as UserRole,
        points: dbUser.points || 0,
        avatarId: dbUser.avatar_id || dbUser.avatarid || 1,      
        isBanned: dbUser.is_banned || dbUser.isbanned || false,
        joinedAt: dbUser.joined_at ? new Date(dbUser.joined_at).getTime() : Date.now(),
        lastActive: dbUser.last_active ? new Date(dbUser.last_active).getTime() : Date.now()
    };
};

const toDbUser = (user: User) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        address: user.address || null,
        phone: user.phone || null,
        role: user.role,
        points: user.points || 0,
        sol_address: user.solAddress || null,
        avatar_id: user.avatarId || 1,
        is_banned: user.isBanned || false,
        last_active: new Date().toISOString()
    };
};

// --- CORE: REAL-TIME AI NEWS ENGINE ---
const fetchRealNewsFromGemini = async (targetRegion: string, targetTopic: string) => {
    try {
        console.log(`📡 AI Bot searching: [${targetRegion}] - [${targetTopic}] (Last 24h)...`);
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `You are a professional 24/7 news editor robot.
            TASK: Search for ONE headline news story from the LAST 24 HOURS.
            TARGET REGION: "${targetRegion}"
            TARGET TOPIC: "${targetTopic}"
            
            STRICT CONSTRAINTS:
            1. TIME: The news MUST be from the last 24 hours. NO old news.
            2. RELEVANCE: Ensure the news matches the "${targetTopic}" category in "${targetRegion}".
            3. OUTPUT: JSON format strictly.
            4. LANGUAGES: Generate titles and content in BOTH Traditional Chinese (HK/TW style) and English.
            5. CONTENT: Keep it professional and informative. Use bullet points for content.

            JSON Schema (Strict):
            {
                "title": "English Headline",
                "titleCN": "繁體中文標題",
                "content": "Summary in English (max 3 bullet points)",
                "contentCN": "繁體中文摘要 (最多3點)",
                "category": "${targetTopic}",
                "sourceName": "Name of the news source found"
            }`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        titleCN: { type: Type.STRING },
                        content: { type: Type.STRING },
                        contentCN: { type: Type.STRING },
                        category: { type: Type.STRING },
                        sourceName: { type: Type.STRING }
                    },
                    required: ['title', 'titleCN', 'content', 'contentCN']
                }
            }
        });

        const data = JSON.parse(response.text);

        // Grounding / Source Verification
        let sourceUrl = "";
        let sourceName = data.sourceName || "Google Search";
        
        const grounding = response.candidates?.[0]?.groundingMetadata;
        if (grounding?.groundingChunks) {
            const webChunk = grounding.groundingChunks.find((c: any) => c.web?.uri);
            if (webChunk) {
                sourceUrl = webChunk.web.uri;
                sourceName = webChunk.web.title || sourceName;
            }
        }

        return { ...data, source: sourceName, url: sourceUrl };

    } catch (error) {
        console.error("Gemini News Error:", error);
        throw error;
    }
};

export const MockDB = {
  // --- USER AUTHENTICATION ---
  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) {
            const appUsers = data.map(fromDbUser);
            safeSetItem(KEY_ALL_USERS, JSON.stringify(appUsers));
            return appUsers;
        }
    } catch (e) { console.warn("Sync Users Failed", e); }
    return JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
  },

  getCurrentUser: (): User | null => {
    const local = localStorage.getItem(KEY_CURRENT_USER);
    if (!local) return null;
    try { return JSON.parse(local); } catch { return null; }
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    if (error || !data) throw new Error("User not found (用戶不存在)");
    
    const user = fromDbUser(data);
    if (password && user.password && user.password !== password) throw new Error("Invalid Password (密碼錯誤)");
    if (user.isBanned) throw new Error("Account Banned (此帳戶已被封鎖)");
    
    try { await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', user.id); } catch(e) {}
    
    const sessionUser = { ...user, lastActive: Date.now() };
    safeSetItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));
    return sessionUser;
  },

  register: async (user: User): Promise<void> => {
      const { data } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
      if (data) throw new Error("Email already registered (此電郵已被註冊)");

      const { error } = await supabase.from('users').insert(toDbUser(user));
      if (error) throw new Error(error.message);
      
      safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  logout: (): void => { localStorage.removeItem(KEY_CURRENT_USER); },

  saveUser: async (user: User): Promise<void> => {
      try {
          await supabase.from('users').upsert(toDbUser(user)).eq('id', user.id);
      } catch (e) { console.error(e); }
      const current = MockDB.getCurrentUser();
      if(current && current.id === user.id) safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
  },
  
  deleteUser: async (id: string): Promise<void> => { await supabase.from('users').delete().eq('id', id); },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
      const { data } = await supabase.from('users').select('points').eq('id', userId).single();
      if (!data) return -1;
      const newPoints = Math.max(0, (data.points || 0) + delta);
      await supabase.from('users').update({ points: newPoints }).eq('id', userId);
      
      const current = MockDB.getCurrentUser();
      if(current && current.id === userId) {
          current.points = newPoints;
          safeSetItem(KEY_CURRENT_USER, JSON.stringify(current));
      }
      return newPoints;
  },

  // --- WITHDRAWAL SYSTEM POST ---
  createWithdrawalPost: async (user: User, amount: number) => {
       const now = Date.now();
       const post: Post = {
           id: `wd-${now}-${user.id.substring(0,4)}`,
           title: `⚠️ WITHDRAWAL ALERT: ${amount.toLocaleString()} HKER`,
           titleCN: `⚠️ 提幣申請通知: ${amount.toLocaleString()} HKER`,
           content: `URGENT REQUEST\n\nUser: ${user.name}\nEmail: ${user.email}\nWallet: ${user.solAddress}\nAmount: ${amount.toLocaleString()} HKER\n\nStatus: Pending Transfer. Admin please verify.`,
           contentCN: `緊急提幣申請\n\n用戶: ${user.name}\n電郵: ${user.email}\n錢包: ${user.solAddress}\n金額: ${amount.toLocaleString()} HKER\n\n狀態: 等待轉帳。請管理員核實。`,
           region: 'Hong Kong',
           category: 'Finance',
           author: 'System Bot',
           authorId: 'sys-bot-finance',
           isRobot: true,
           timestamp: now,
           displayDate: new Date(now).toLocaleString(),
           likes: 0,
           hearts: 0,
           views: 0,
           source: 'HKER Withdrawal System',
           replies: []
       };
       await MockDB.savePost(post);
  },

  // --- POSTS MANAGEMENT (CLOUD FIRST STRATEGY) ---
  getPosts: async (): Promise<Post[]> => {
      try {
          // CLOUD FIRST: Fetch from Supabase
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);

          if (!error && data && data.length > 0) {
              const remotePosts = data.map((p: any) => ({
                  ...p,
                  source: (typeof p.source === 'string' && p.source !== '[object Object]') ? p.source : 'System'
              }));
              safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(remotePosts));
              return remotePosts;
          }
      } catch (e) {
          console.warn("Cloud Fetch Error, falling back to local cache", e);
      }
      
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      return localStr ? JSON.parse(localStr) : [];
  },

  savePost: async (post: Post): Promise<void> => {
      const safePost = {
          ...post,
          source: post.isRobot ? (post.source || 'AI News Bot') : 'User'
      };

      const { error } = await supabase.from('posts').upsert(safePost);
      
      if (error) {
          console.error("Failed to save post to Cloud:", error);
          throw error;
      }

      try {
          const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
          let current = localStr ? JSON.parse(localStr) : [];
          current = current.filter((p: any) => p.id !== post.id);
          current.unshift(safePost);
          safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current.slice(0, 50)));
      } catch (e) {}
  },
  
  deletePost: async (postId: string): Promise<void> => { 
      await supabase.from('posts').delete().eq('id', postId);
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      if (localStr) {
          const current = JSON.parse(localStr).filter((p: any) => p.id !== postId);
          safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current));
      }
  },

  // --- ROBOT AUTO-POSTING ENGINE ---
  triggerRobotPost: async (force = false) => {
       if (isBotProcessing) return; 
       isBotProcessing = true;

       try {
           const now = Date.now();
           
           // 1. Check Cloud for latest bot post
           const { data: latestBotPost } = await supabase
                .from('posts')
                .select('timestamp')
                .eq('isRobot', true)
                .order('timestamp', { ascending: false })
                .limit(1);
            
           let lastTime = 0;
           if (latestBotPost && latestBotPost.length > 0) {
               lastTime = latestBotPost[0].timestamp;
           }

           // 2. Cooldown: 55 minutes (3300000ms) to ensure hourly updates
           const COOLDOWN = 3300000; 
           
           if (!force && lastTime > 0 && (now - lastTime < COOLDOWN)) {
               console.log("🤖 Bot Cooldown: Next active scan in approx.", ((COOLDOWN - (now - lastTime))/60000).toFixed(0), "mins");
               return; 
           }

           // 3. Randomize Region and Topic
           const region = NEWS_REGIONS[Math.floor(Math.random() * NEWS_REGIONS.length)];
           const topic = NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)];

           // 4. Fetch from Gemini
           const newsData = await fetchRealNewsFromGemini(region, topic);
           
           // 5. Construct Post
           const newPost: Post = {
                id: `bot-${now}-${generateUUID().split('-')[0]}`,
                title: newsData.title,
                titleCN: newsData.titleCN || newsData.title, 
                content: newsData.content,
                contentCN: newsData.contentCN || newsData.content, 
                region: region,
                category: newsData.category || topic,
                author: `${region} Daily Bot`,
                authorId: 'system-bot',
                isRobot: true,
                timestamp: now,
                displayDate: new Date(now).toLocaleString(),
                likes: Math.floor(Math.random() * 8),
                hearts: 0,
                views: Math.floor(Math.random() * 80) + 10,
                source: newsData.source, 
                sourceUrl: newsData.url,
                botId: `GEMINI-GLOBAL-V3`,
                replies: []
            };
            
            console.log(`🤖 AI Posting News Success: ${newPost.title}`);
            await MockDB.savePost(newPost);
            
       } catch (err) {
           console.error("Bot Trigger Error:", err);
       } finally {
           isBotProcessing = false;
       }
  },
  
  getAnalytics: async () => {
      try {
          const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
          return { totalMembers: count || 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: 0 };
      } catch (e) { return { totalMembers: 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: 0 }; }
  },

  recordVisit: async (isLoggedIn: boolean) => {
      if (isLoggedIn) {
          const user = MockDB.getCurrentUser();
          if (user) {
              try { await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', user.id); } catch (e) { }
              user.lastActive = Date.now();
              safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
          }
      }
  }
};
