
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, Comment } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// Local Cache Keys (Fallback only)
const KEY_CURRENT_USER = 'hker_current_user_v8_secure';
const KEY_ALL_USERS = 'hker_all_users_cache_v8'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v8';

// Global Lock for Robot Execution
let isBotProcessing = false;
let botLockTimestamp = 0;

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UUID Polyfill ---
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
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('LocalStorage Quota Full! Trimming cache...');
            // Try to clear non-essential cache
            localStorage.removeItem(KEY_ALL_USERS);
            try {
                localStorage.setItem(key, value);
            } catch(retryErr) {}
        }
    }
};

const toDbUser = (user: User) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        address: user.address || null,
        phone: user.phone || null,
        gender: user.gender || null,
        role: user.role,
        points: user.points || 0,
        sol_address: user.solAddress || null,
        avatar_id: user.avatarId || 1,
        is_banned: user.isBanned || false,
        joined_at: user.joinedAt ? new Date(user.joinedAt).toISOString() : new Date().toISOString(),
        last_active: user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString()
    };
};

const fromDbUser = (dbUser: any): User => {
    return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        password: dbUser.password,
        address: dbUser.address || '',
        phone: dbUser.phone || '',
        solAddress: dbUser.sol_address || dbUser.soladdress || dbUser.solAddress || '', 
        gender: dbUser.gender || '',
        role: dbUser.role as UserRole,
        points: dbUser.points || 0,
        avatarId: dbUser.avatar_id || dbUser.avatarid || dbUser.avatarId || 1,      
        isBanned: dbUser.is_banned || dbUser.isbanned || dbUser.isBanned || false,
        joinedAt: dbUser.joined_at ? new Date(dbUser.joined_at).getTime() : (dbUser.joinedat ? new Date(dbUser.joinedat).getTime() : Date.now()),
        lastActive: dbUser.last_active ? new Date(dbUser.last_active).getTime() : (dbUser.lastactive ? new Date(dbUser.lastactive).getTime() : Date.now())
    };
};

// --- CORE: REAL-TIME AI NEWS ENGINE ---
// This function strictly fetches news from the last 24 hours using Google Search Grounding
const fetchRealNewsFromGemini = async (targetRegion: string) => {
    try {
        console.log(`📡 AI Bot connecting to global news network for: ${targetRegion}...`);
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `You are a strict news aggregator.
                       Task: Find ONE major breaking news story specifically for "${targetRegion}" that happened within the LAST 24 HOURS.
                       
                       CRITICAL RULES:
                       1. TIME: News MUST be from today or yesterday. DO NOT return old news.
                       2. TRUTH: Use Google Search to verify. Do not invent details.
                       3. TOPIC: Prefer Economy, Politics, Social Issues, or Technology.
                       4. FORMAT: Return JSON only.
                       5. LANGUAGE: Provide Bilingual output (Traditional Chinese & English).`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Headline in English" },
                        titleCN: { type: Type.STRING, description: "Headline in Traditional Chinese (繁體中文)" },
                        content: { type: Type.STRING, description: "Summary in English (bullet points)" },
                        contentCN: { type: Type.STRING, description: "Summary in Traditional Chinese (bullet points)" },
                        category: { type: Type.STRING, description: "One of: Real Estate, Current Affairs, Finance, Digital, Community" },
                    },
                    required: ["title", "titleCN", "content", "contentCN", "category"]
                }
            }
        });

        const data = JSON.parse(response.text);
        
        // Extract Grounding Metadata (Source URL & Name)
        let sourceUrl = "";
        let sourceName = "Google News Network";
        
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = response.candidates[0].groundingMetadata.groundingChunks;
            // Find the first valid web URI
            const webChunk = chunks.find((c: any) => c.web?.uri);
            if (webChunk) {
                sourceUrl = webChunk.web.uri;
                sourceName = webChunk.web.title || "News Source";
            }
        }

        return {
            ...data,
            source: sourceName,
            url: sourceUrl
        };

    } catch (error) {
        console.error("Gemini News Error:", error);
        // Fail silently or throw, so we don't post garbage
        throw new Error("News Fetch Failed");
    }
};

export const MockDB = {
  // --- USER AUTHENTICATION & MANAGEMENT ---
  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) {
            const appUsers = data.map(fromDbUser);
            safeSetItem(KEY_ALL_USERS, JSON.stringify(appUsers));
            return appUsers;
        }
        return [];
    } catch (e) { 
        return JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
    }
  },

  getCurrentUser: (): User | null => {
    const local = localStorage.getItem(KEY_CURRENT_USER);
    if (!local) return null;
    try { return JSON.parse(local); } catch { return null; }
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    if (error || !data) throw new Error("User not found (用戶不存在) - Please Register First");
    const user = fromDbUser(data);
    if (password && user.password && user.password !== password) throw new Error("Invalid Password (密碼錯誤)");
    if (user.isBanned) throw new Error("Account Banned (此帳戶已被封鎖)");
    
    try { await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', user.id); } catch(e) {}
    
    const sessionUser = { ...user, lastActive: Date.now() };
    safeSetItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));
    return sessionUser;
  },

  register: async (user: User): Promise<void> => {
    try {
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
        if (existingUser) throw new Error("Email already registered (此電郵已被註冊)");

        const dbPayload = toDbUser(user);
        const { error: error1 } = await supabase.from('users').insert(dbPayload);
        
        if (error1) {
            // Minimal fallback for older DB schemas
            const minimalPayload = {
                id: user.id, name: user.name, email: user.email, password: user.password, role: user.role
            };
            const { error: error3 } = await supabase.from('users').insert(minimalPayload);
            if (error3) throw new Error(`Registration Failed: ${error3.message}`);
        }
        safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
    } catch (err: any) {
        throw new Error(err.message || 'Registration Failed');
    }
  },

  logout: (): void => { localStorage.removeItem(KEY_CURRENT_USER); },

  saveUser: async (user: User): Promise<void> => {
      try {
          const { error } = await supabase.from('users').upsert(toDbUser(user)).eq('id', user.id);
          if (error) throw error;
      } catch (e) {
          console.error("Save Profile Error", e);
      }
      const current = MockDB.getCurrentUser();
      if(current && current.id === user.id) safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
  },
  
  deleteUser: async (id: string): Promise<void> => { await supabase.from('users').delete().eq('id', id); },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
      const { data: userData } = await supabase.from('users').select('points').eq('id', userId).single();
      if (!userData) return -1;
      const newPoints = Math.max(0, (userData.points || 0) + delta);
      const { error } = await supabase.from('users').update({ points: newPoints }).eq('id', userId);
      if (!error) {
          const current = MockDB.getCurrentUser();
          if(current && current.id === userId) {
              current.points = newPoints;
              safeSetItem(KEY_CURRENT_USER, JSON.stringify(current));
          }
          return newPoints;
      }
      return -1;
  },
  
  // --- POST MANAGEMENT (CLOUD FIRST & SYNC) ---
  // Fixes Problem 2: New accounts see old news because everyone fetches from Supabase
  getPosts: async (): Promise<Post[]> => {
      let remoteData: Post[] = [];
      try {
          // 1. CLOUD FIRST: Fetch from Supabase
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('timestamp', { ascending: false }) // Newest first
            .limit(50);

          if (!error && data && data.length > 0) {
              // Normalize data
              remoteData = data.map((p: any) => ({
                  ...p,
                  source: (typeof p.source === 'string' && p.source !== '[object Object]') ? p.source : 'HKER Bot'
              }));
              
              // 2. Cache result for offline capability
              safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(remoteData));
              return remoteData;
          }
      } catch (e) { 
          console.warn("Supabase Fetch Error (Using Local Cache)", e); 
      }
      
      // 3. Fallback only if Cloud fails
      const localData = JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
      return localData;
  },

  savePost: async (post: Post): Promise<void> => {
      const safePost = {
          ...post,
          source: (typeof post.source === 'string' && post.source !== '[object Object]') ? post.source : 'User'
      };
      
      // 1. Write to Supabase (Single Source of Truth)
      supabase.from('posts').upsert(safePost).then(({ error }) => {
          if (error) console.error("Cloud Sync Error:", error.message);
      });

      // 2. Optimistic Local Update
      try {
          const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
          let current = localStr ? JSON.parse(localStr) : [];
          current = current.filter((p: any) => p.id !== post.id);
          current.unshift(safePost);
          safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current.slice(0, 100)));
      } catch (e) { }
  },
  
  deletePost: async (postId: string): Promise<void> => { 
      await supabase.from('posts').delete().eq('id', postId); 
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      if (localStr) {
          const current = JSON.parse(localStr).filter((p: any) => p.id !== postId);
          safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current));
      }
  },
  
  getAnalytics: async () => {
      try {
          const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
          return { totalMembers: count || 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: Math.floor(100 + Math.random() * 50) };
      } catch (e) { return { totalMembers: 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: 0 }; }
  },

  // --- INTELLIGENT ROBOT SCHEDULER (REAL-TIME MODE) ---
  // Fixes Problem 1 & 3: Real 24h News + Anti-Duplicate Logic
  triggerRobotPost: async (force = false) => {
       const now = Date.now();

       // 1. In-Memory Lock (Prevent spamming from same client)
       if (isBotProcessing && (now - botLockTimestamp > 60000)) {
           isBotProcessing = false; // Reset if stuck > 1 min
       }
       if (isBotProcessing) return;
       
       isBotProcessing = true;
       botLockTimestamp = now;

       try {
           let lastTime = 0;

           // 2. Cloud Lock: Check the DB for the LATEST robot post from ANYONE
           const { data: dbPosts } = await supabase
                .from('posts')
                .select('timestamp')
                .eq('isRobot', true)
                .order('timestamp', { ascending: false })
                .limit(1);
            
           if (dbPosts && dbPosts.length > 0) {
                lastTime = dbPosts[0].timestamp;
           }
           
           // 3. Cooldown: 3 Hours (10,800,000 ms)
           // Prevents posting old news repeatedly.
           const COOLDOWN = 10800000; 
           if (!force && lastTime > 0 && (now - lastTime < COOLDOWN)) {
               console.log(`🤖 Bot Cooldown: ${(COOLDOWN - (now - lastTime)) / 60000} mins remaining.`);
               return; 
           }

           // 4. Region Selection
           const roll = Math.random();
           let region = 'Hong Kong'; // Default 60%
           if (roll > 0.6 && roll <= 0.85) region = 'United Kingdom'; // 25%
           if (roll > 0.85) region = 'Global Tech'; // 15%

           // 5. FETCH REAL NEWS
           const newsData = await fetchRealNewsFromGemini(region);
           
           const newPost: Post = {
                id: `bot-${now}-${generateUUID().split('-')[0]}`,
                title: newsData.title,
                titleCN: newsData.titleCN || newsData.title, 
                content: newsData.content,
                contentCN: newsData.contentCN || newsData.content, 
                region: region,
                category: newsData.category,
                author: `${region} News Bot`,
                authorId: 'system-bot',
                isRobot: true,
                timestamp: now,
                displayDate: new Date(now).toLocaleString(),
                likes: Math.floor(Math.random() * 8),
                hearts: 0,
                views: Math.floor(Math.random() * 50) + 20,
                source: newsData.source, 
                sourceUrl: newsData.url,
                botId: `GEMINI-SEARCH-V2`,
                replies: []
            };
            
            console.log(`🤖 SUCCESS: Posted Real News [${region}]:`, newPost.titleCN);
            await MockDB.savePost(newPost);
            
       } catch (err) {
           console.error("Bot Execution Failed:", err);
       } finally {
           isBotProcessing = false;
           botLockTimestamp = 0;
       }
  },
  
  recordVisit: async (isLoggedIn: boolean) => {
      if (isLoggedIn) {
          const user = MockDB.getCurrentUser();
          if (user) {
               try { await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', user.id); } catch (e) {}
               user.lastActive = Date.now();
               safeSetItem(KEY_CURRENT_USER, JSON.stringify(user));
          }
      }
  }
};
