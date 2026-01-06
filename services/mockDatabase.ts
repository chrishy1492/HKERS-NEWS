
import { supabase } from './supabaseClient';
import { User, Post, UserRole } from '../types';
import { GoogleGenAI } from "@google/genai";

// Local Cache Keys
const KEY_CURRENT_USER = 'hker_current_user_v11_stable';
const KEY_ALL_USERS = 'hker_all_users_cache_v11'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v11';

// Global Lock for Bot
let isBotProcessing = false;

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MAPPING CONFIGURATION (Critical for Filtering) ---
// Keys used for searching, Values used for database storage codes
const REGION_CONFIG: Record<string, string> = {
    'Hong Kong': 'hk',
    'Taiwan': 'tw',
    'United Kingdom': 'uk',
    'United States': 'us',
    'Canada': 'ca',
    'Australia': 'au',
    'Europe': 'eu'
};

const CATEGORY_CONFIG: Record<string, string> = {
    'Real Estate Market': 'property',
    'Global News': 'news',
    'Financial Economy': 'finance',
    'Technology & Digital': 'digital',
    'Community & Life': 'community'
};

const cleanJsonString = (raw: string): string => {
    if (!raw) return "{}";
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
        return cleaned.substring(startIdx, endIdx + 1);
    }
    return "{}"; 
};

export const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try { return crypto.randomUUID(); } catch (e) { }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        localStorage.removeItem(KEY_ALL_USERS);
        try { localStorage.setItem(key, value); } catch (e2) {}
    }
};

const fromDbUser = (dbUser: any): User => ({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    password: dbUser.password,
    address: dbUser.address || '',
    phone: dbUser.phone || '',
    solAddress: dbUser.sol_address || '', 
    gender: dbUser.gender || '',
    role: dbUser.role as UserRole,
    points: dbUser.points || 0,
    avatarId: dbUser.avatar_id || 1,      
    isBanned: dbUser.is_banned || false,
    joinedAt: dbUser.joined_at ? new Date(dbUser.joined_at).getTime() : Date.now(),
    lastActive: dbUser.last_active ? new Date(dbUser.last_active).getTime() : Date.now()
});

const toDbUser = (user: User) => ({
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
});

// --- REAL NEWS GENERATION ENGINE (Deep Analysis Mode) ---
const fetchRealNewsFromGemini = async (searchRegion: string, searchTopic: string, regionCode: string, categoryCode: string) => {
    try {
        // Updated Prompt for 10x Content Length & Structure
        const prompt = `
            ROLE: Senior Global News Analyst Bot (24/7 Monitoring).
            TASK: Search for ONE major, REAL news event that happened in the LAST 24 HOURS.
            REGION: "${searchRegion}"
            TOPIC: "${searchTopic}"

            STRICT REQUIREMENTS:
            1. TIME: Must be within 36 hours. If no major news, find the most significant recent trend.
            2. FORMAT: Output a JSON object.
            3. CONTENT: The 'contentCN' (Chinese) must be a LONG-FORM Deep Analysis (approx 800-1000 chars).
            4. STRUCTURE: The content must use the following headers:
               - 【第一章：新聞背景與核心事實】(Core Facts)
               - 【第二章：深度數據分析】(Data Analysis)
               - 【第三章：對市場/社會的影響】(Impact)
               - 【第四章：未來 36 小時預測】(Forecast)
               - 【第五章：AI 總結】(Conclusion)
            5. TONE: Professional, Objective, Financial/Political Standard.
            
            JSON Schema:
            {
                "title": "English Headline (Professional)",
                "titleCN": "繁體中文標題 (加上【36h快訊】前綴)",
                "content": "English Summary (Short, 1 paragraph)",
                "contentCN": "LONG FORM ANALYSIS with 5 Chapters as requested...",
                "sourceName": "Actual Source Name (e.g. BBC, Reuters, HK01)",
                "region": "${regionCode}",
                "category": "${categoryCode}"
            }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });

        const cleanedJson = cleanJsonString(response.text || "{}");
        let data;
        
        try {
            data = JSON.parse(cleanedJson);
            if (!data.titleCN) throw new Error("Empty Data");
        } catch (e) {
            console.warn("Gemini JSON Parse Failed", e);
            throw new Error("JSON_PARSE_ERROR");
        }

        let sourceUrl = "";
        const grounding = response.candidates?.[0]?.groundingMetadata;
        if (grounding?.groundingChunks) {
            const webChunk = grounding.groundingChunks.find((c: any) => c.web?.uri);
            if (webChunk) sourceUrl = webChunk.web.uri;
        }

        return { ...data, url: sourceUrl };

    } catch (error) {
        console.error("Gemini Error:", error);
        // Fallback for fail-safe (Generic Update)
        return {
            title: `Global Market Update: ${searchRegion}`,
            titleCN: `【系統公告】${searchRegion} ${searchTopic} 實時監測報告`,
            content: "Monitoring...",
            contentCN: `【第一章：系統狀態】\n目前 AI 正在深度掃描 ${searchRegion} 的最新資訊。\n\n【第二章：暫時狀態】\n由於上游新聞源更新延遲，暫未生成深度報告。\n\n【第三章：建議】\n請稍後刷新查看。`,
            category: categoryCode,
            region: regionCode,
            sourceName: "HKER AI System",
            url: ""
        };
    }
};

export const MockDB = {
  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) {
            const appUsers = data.map(fromDbUser);
            safeSetItem(KEY_ALL_USERS, JSON.stringify(appUsers));
            return appUsers;
        }
    } catch (e) {}
    return JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
  },

  getCurrentUser: (): User | null => {
    const local = localStorage.getItem(KEY_CURRENT_USER);
    if (!local) return null;
    try { return JSON.parse(local); } catch { return null; }
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    if (error || !data) throw new Error("User not found");
    const user = fromDbUser(data);
    if (password && user.password && user.password !== password) throw new Error("Invalid Password");
    if (user.isBanned) throw new Error("Account Banned");
    supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', user.id).then();
    const sessionUser = { ...user, lastActive: Date.now() };
    safeSetItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));
    return sessionUser;
  },

  register: async (user: User): Promise<void> => {
      const { data } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
      if (data) throw new Error("Email exists");
      await supabase.from('users').insert(toDbUser(user));
      safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  logout: (): void => { localStorage.removeItem(KEY_CURRENT_USER); },

  saveUser: async (user: User): Promise<void> => {
      const { error } = await supabase.from('users').update(toDbUser(user)).eq('id', user.id);
      if (error) throw new Error(error.message);
      
      const current = MockDB.getCurrentUser();
      if (current && current.id === user.id) {
          safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
      }
  },

  deleteUser: async (userId: string): Promise<void> => {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw new Error(error.message);
      
      const current = MockDB.getCurrentUser();
      if (current && current.id === userId) {
          MockDB.logout();
      }
  },

  getPosts: async (): Promise<Post[]> => {
      try {
          // Fetch limit 50, but we will filter for 36h in the UI/Service
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);
          
          if (!error && data) {
              const remotePosts = data.map((p: any) => ({
                  ...p,
                  source: typeof p.source === 'string' ? p.source : 'System'
              }));
              safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(remotePosts));
              return remotePosts;
          }
      } catch (e) {}
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      return localStr ? JSON.parse(localStr) : [];
  },

  savePost: async (post: Post): Promise<void> => {
      const safePost = { ...post, source: post.isRobot ? (post.source || 'AI News Bot') : 'User' };
      await supabase.from('posts').upsert(safePost);
      
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      let current = localStr ? JSON.parse(localStr) : [];
      current = current.filter((p: any) => p.id !== post.id);
      current.unshift(safePost);
      safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current.slice(0, 50)));
  },

  deletePost: async (postId: string): Promise<void> => { 
      await supabase.from('posts').delete().eq('id', postId);
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      if (localStr) {
          const current = JSON.parse(localStr).filter((p: any) => p.id !== postId);
          safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current));
      }
  },

  triggerRobotPost: async (force = false) => {
       if (isBotProcessing) return; 
       isBotProcessing = true;

       try {
           const now = Date.now();
           const { data: latest } = await supabase.from('posts').select('timestamp').eq('isRobot', true).order('timestamp', { ascending: false }).limit(1);
           let lastTime = 0;
           if (latest && latest.length > 0) lastTime = latest[0].timestamp;

           // 15 min cool down
           const COOLDOWN = 900000; 
           if (!force && lastTime > 0 && (now - lastTime < COOLDOWN)) return; 

           // Pick Random Region/Category Names for Search
           const regionKeys = Object.keys(REGION_CONFIG);
           const catKeys = Object.keys(CATEGORY_CONFIG);
           const searchRegion = regionKeys[Math.floor(Math.random() * regionKeys.length)];
           const searchTopic = catKeys[Math.floor(Math.random() * catKeys.length)];
           
           // Get Codes for DB Storage
           const regionCode = REGION_CONFIG[searchRegion];
           const categoryCode = CATEGORY_CONFIG[searchTopic];

           console.log(`🤖 Bot Scanning: [${searchRegion}] - [${searchTopic}]`);

           const newsData = await fetchRealNewsFromGemini(searchRegion, searchTopic, regionCode, categoryCode);
           
           const newPost: Post = {
                id: `bot-${now}-${generateUUID().split('-')[0]}`,
                title: newsData.title,
                titleCN: newsData.titleCN || newsData.title, 
                content: newsData.content,
                contentCN: newsData.contentCN || newsData.content, 
                region: newsData.region || regionCode, // Use code (hk, uk)
                category: newsData.category || categoryCode, // Use code (finance, property)
                author: `AI Analysis Bot`,
                authorId: 'system-bot',
                isRobot: true,
                timestamp: now,
                displayDate: new Date(now).toLocaleString(),
                likes: Math.floor(Math.random() * 5),
                hearts: 0,
                views: Math.floor(Math.random() * 100) + 10,
                source: newsData.sourceName || "Global News", 
                sourceUrl: newsData.url,
                botId: `GEMINI-3-FLASH-PRO`,
                replies: []
            };
            
            await MockDB.savePost(newPost);
            
       } catch (err) {
           console.error("Bot Error:", err);
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

  createWithdrawalPost: async (user: User, amount: number) => {
       const now = Date.now();
       const post: Post = {
           id: `wd-${now}-${user.id.substring(0,4)}`,
           title: `⚠️ WITHDRAWAL ALERT`,
           titleCN: `⚠️ 提幣申請通知: ${amount.toLocaleString()} HKER`,
           content: `User: ${user.name}\nAmount: ${amount}`,
           contentCN: `用戶: ${user.name}\n金額: ${amount.toLocaleString()}`,
           region: 'hk',
           category: 'finance',
           author: 'System Bot',
           authorId: 'sys-bot-finance',
           isRobot: true,
           timestamp: now,
           displayDate: new Date(now).toLocaleString(),
           likes: 0,
           hearts: 0,
           views: 0,
           source: 'System',
           replies: []
       };
       await MockDB.savePost(post);
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
