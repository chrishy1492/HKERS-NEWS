
import { supabase } from './supabaseClient';
import { User, Post, UserRole } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// Local Cache Keys
const KEY_CURRENT_USER = 'hker_current_user_v11_stable';
const KEY_ALL_USERS = 'hker_all_users_cache_v11'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v11';

// Global Lock for Bot
let isBotProcessing = false;

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 地區與主題設定 ---
const NEWS_REGIONS = [
    '中國香港', '台灣', '英國', '美國', '加拿大', '澳洲', '歐洲', '日本', '韓國'
];

const NEWS_TOPICS = [
    '地產', '時事', '財經', '娛樂', '旅遊', '數碼', '汽車', '宗教', '優惠', '校園', '天氣', '社區活動'
];

// --- 工具函式：強力清洗 JSON 字串 ---
const cleanJsonString = (raw: string): string => {
    if (!raw) return "{}";
    let cleaned = raw.trim();
    // 移除 Markdown 標記 (包括 ```json, ```, 等)
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
    
    // 尋找第一個 { 和最後一個 }
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1) {
        return cleaned.substring(startIdx, endIdx + 1);
    }
    return "{}"; // 若找不到有效的 JSON 結構，回傳空物件字串
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

// --- 實時新聞搜尋與生成 (Updated to Gemini 3 Flash / Correct SDK Usage) ---
const fetchRealNewsFromGemini = async (region: string, topic: string) => {
    try {
        const prompt = `
            You are a professional 24/7 Global News Editor Robot. 
            CURRENT TASK: Use Google Search to find ONE major headline from the LAST 24 HOURS.
            REGION: "${region}"
            TOPIC: "${topic}"

            REQUIREMENTS:
            1. The news MUST have happened within the last 24 hours.
            2. ANALYSIS: Provide a DETAILED, STRUCTURED analysis (not just a summary). 
            3. CONTENT FORMAT: Use numbered lists (1. Market Overview, 2. Key Drivers, 3. Future Outlook).
            4. LENGTH: The content should be substantial (approx 150-200 words).
            5. COPYRIGHT: You MUST include a disclaimer that this is AI-processed content.
            
            JSON Schema:
            {
                "title": "English Headline",
                "titleCN": "繁體中文標題",
                "content": "[AI Core Summary - No Full-Text Copying]\n\n1. Overview: ...\n2. Analysis: ...\n3. Conclusion: ...",
                "contentCN": "【AI 重點摘要 - 嚴禁全文複製以保護版權】\n\n1. 市場概覽：...\n2. 關鍵分析：...\n3. 未來展望：...",
                "category": "${topic}",
                "sourceName": "Actual News Agency Name"
            }
        `;

        // CORRECT SDK USAGE: ai.models.generateContent
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });

        // Robust Cleaning & Parsing
        const cleanedJson = cleanJsonString(response.text || "{}");
        let data;
        
        try {
            data = JSON.parse(cleanedJson);
            // Basic validation
            if (!data.titleCN && !data.title) throw new Error("Empty Data");
        } catch (e) {
            console.warn("Gemini JSON Parse Failed, using fallback:", e);
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
        console.error("Gemini Search/Parse Error:", error);
        // Fallback Data to ensure bot doesn't crash completely
        return {
            title: `Community Update: ${topic}`,
            titleCN: `社區動態：${region} ${topic} 討論`,
            content: "We are aggregating the latest updates for this topic. Please check back shortly or share your own insights.",
            contentCN: "【系統訊息】\n\n1. 狀態：系統正在整合最新資訊。\n2. 建議：歡迎各位會員分享您的見解。\n3. 提示：請稍後刷新頁面查看最新報導。",
            category: topic,
            sourceName: "HKER Community Bot",
            url: ""
        };
    }
};

export const MockDB = {
  // --- AUTHENTICATION ---
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

  // --- POSTS (Cloud First) ---
  getPosts: async (): Promise<Post[]> => {
      try {
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

  // --- ROBOT ENGINE (FIXED & OPTIMIZED) ---
  triggerRobotPost: async (force = false) => {
       if (isBotProcessing) return; 
       isBotProcessing = true;

       try {
           const now = Date.now();
           
           // 1. 檢查雲端最後發布時間
           const { data: latest } = await supabase
                .from('posts')
                .select('timestamp')
                .eq('isRobot', true)
                .order('timestamp', { ascending: false })
                .limit(1);
            
           let lastTime = 0;
           if (latest && latest.length > 0) {
               lastTime = latest[0].timestamp;
           }

           // 2. 冷卻檢查：調整為 15 分鐘 (900000ms)
           const COOLDOWN = 900000; 
           if (!force && lastTime > 0 && (now - lastTime < COOLDOWN)) {
               console.log(`🤖 Bot resting. Next check in: ${((COOLDOWN - (now - lastTime))/60000).toFixed(1)} mins`);
               return; 
           }

           // 3. 隨機地區與主題
           const region = NEWS_REGIONS[Math.floor(Math.random() * NEWS_REGIONS.length)];
           const topic = NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)];

           console.log(`🤖 Bot Active: Fetching 24h News for [${region}] - [${topic}]`);

           // 4. Gemini 搜尋 (含容錯機制)
           const newsData = await fetchRealNewsFromGemini(region, topic);
           
           // 5. 建立與儲存貼文
           const newPost: Post = {
                id: `bot-${now}-${generateUUID().split('-')[0]}`,
                title: newsData.title,
                titleCN: newsData.titleCN || newsData.title, 
                content: newsData.content,
                contentCN: newsData.contentCN || newsData.content, 
                region: region,
                category: topic,
                author: `${region} 實時報導`,
                authorId: 'system-bot',
                isRobot: true,
                timestamp: now,
                displayDate: new Date(now).toLocaleString(),
                likes: Math.floor(Math.random() * 20),
                hearts: 0,
                views: Math.floor(Math.random() * 150) + 30,
                source: newsData.sourceName || "Global News", 
                sourceUrl: newsData.url,
                botId: `GEMINI-3-FLASH-V7-STABLE`,
                replies: []
            };
            
            console.log(`✅ Bot Posting: ${newPost.titleCN}`);
            await MockDB.savePost(newPost);
            
       } catch (err) {
           console.error("❌ Bot Process Interrupted (Unexpected):", err);
       } finally {
           // CRITICAL: Always release lock to prevent stalling
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
