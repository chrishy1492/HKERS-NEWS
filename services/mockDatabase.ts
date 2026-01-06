
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
const REGION_CONFIG: Record<string, string> = {
    'Hong Kong': 'hk', 'Taiwan': 'tw', 'United Kingdom': 'uk', 
    'United States': 'us', 'Canada': 'ca', 'Australia': 'au', 'Europe': 'eu'
};

const CATEGORY_CONFIG: Record<string, string> = {
    'Real Estate': 'property', 'Global News': 'news', 
    'Finance': 'finance', 'Technology': 'digital', 
    'Entertainment': 'entertainment', 'Travel': 'travel',
    'Automotive': 'auto', 'Religion': 'religion',
    'Offers': 'offers', 'Campus': 'campus',
    'Weather': 'weather', 'Community': 'community'
};

// --- CES 2026 HIGH-FIDELITY GLOBAL DATA ---
const CES_DEMO_DATA: Post[] = [
    {
        id: "2026-nv-rubin-platform",
        title: "Nvidia 推出 Vera Rubin 平台：AI 推理性能提升 5 倍，引領超級運算新世代",
        titleCN: "Nvidia 推出 Vera Rubin 平台：AI 推理性能提升 5 倍，引領超級運算新世代",
        content: "Nvidia announces Vera Rubin Platform.",
        processedSummary: [
          { label: "晶片發布", detail: "包含 Rubin GPU 及全新 Vera CPU 在內的 6 款新晶片正式亮相。" },
          { label: "效能指標", detail: "AI 推理性能較 Blackwell 提升 3-5 倍，模型訓練成本降低 10 倍。" },
          { label: "技術創新", detail: "首度採用 NVLink 6 互連技術，支援下一代 AI 超級電腦架構。" },
          { label: "量產時程", detail: "預計於 2026 年下半年進入大規模量產階段。" }
        ],
        background: "這是 CES 2026 開幕日最重磅的消息，定義了未來兩年 AI 基礎設施的發展藍圖。",
        region: "us",
        category: "digital",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 100000000, 
        displayDate: "2026-01-06 09:00",
        likes: 520,
        hearts: 180,
        views: 12500,
        source: "NVIDIA Newsroom",
        sourceUrl: "https://nvidianews.nvidia.com/",
        replies: []
    },
    {
        id: "2026-hk-property-ms",
        title: "摩根士丹利上調香港樓市評級：預測 2026 年樓價升 10%",
        titleCN: "摩根士丹利上調香港樓市評級：預測 2026 年樓價升 10%",
        content: "Morgan Stanley upgrades HK property.",
        processedSummary: [
          { label: "評級調整", detail: "樓市評級由『中性』調升至『吸引』，標誌著新一輪上行周期開始。" },
          { label: "價格預測", detail: "受利率見頂及剛需釋放帶動，2026 全年樓價預計上漲 10%。" },
          { label: "市場現狀", detail: "二手樓價已回升至 14 個月高位，租金回報率創 6 年新高。" }
        ],
        background: "在經歷長時間調整後，大行報告顯示機構投資者對香港地產市場信心大幅回歸。",
        region: "hk",
        category: "property",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 98000000,
        displayDate: "2026-01-06 11:30",
        likes: 340,
        hearts: 45,
        views: 8900,
        source: "Bloomberg",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-au-heatwave",
        title: "澳洲爆發極端熱浪：部分地區氣溫突破 45°C，火災風險達最高級",
        titleCN: "澳洲爆發極端熱浪：部分地區氣溫突破 45°C，火災風險達最高級",
        content: "Australia Heatwave.",
        processedSummary: [
          { label: "極端氣溫", detail: "全國近半地區氣溫超過 45°C，為 2020 年『黑夏』以來最嚴重情況。" },
          { label: "應急預警", detail: "多個州份進入緊急狀態，嚴禁一切野外用火，電力系統面臨負荷高峰。" }
        ],
        background: "南半球夏季極端天氣頻率顯著上升。",
        region: "au",
        category: "weather",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 94000000,
        displayDate: "2026-01-06 15:00",
        likes: 150,
        hearts: 200,
        views: 7800,
        source: "Reuters",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-ca-wage-increase",
        title: "加拿大聯邦最低工資調升至 $17.50，今起正式生效",
        titleCN: "加拿大聯邦最低工資調升至 $17.50，今起正式生效",
        content: "Canada wage increase.",
        processedSummary: [
          { label: "政策生效", detail: "2026 年 1 月 6 日起生效，旨在緩解通脹壓力。" },
          { label: "福利調整", detail: "各項政府補貼與福利支付亦同步進行指數化上調。" }
        ],
        background: "聯邦政府試圖平衡經濟競爭力與勞工權益。",
        region: "ca",
        category: "finance",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 92000000,
        displayDate: "2026-01-06 08:00",
        likes: 400,
        hearts: 20,
        views: 6500,
        source: "Global News",
        sourceUrl: "#",
        replies: []
    }
];

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

// --- REAL NEWS GENERATION ENGINE (Fair Use / Entity Extraction Mode) ---
const fetchRealNewsFromGemini = async (searchRegion: string, searchTopic: string, regionCode: string, categoryCode: string) => {
    try {
        // Updated Prompt for Anti-Copyright / Structured Summary
        const prompt = `
            ROLE: Senior News Analyst Bot.
            TASK: Find ONE major, REAL news event in the LAST 24 HOURS for ${searchRegion} regarding ${searchTopic}.
            
            STRICT RULES:
            1. TIME: Must be within 36 hours. If no major news, return empty JSON or null.
            2. ANTI-COPYRIGHT: Do NOT copy the article. Extract ENTITIES and FACTS only.
            3. OUTPUT: JSON format strictly.
            
            JSON Schema:
            {
                "title": "Headline in Traditional Chinese (Eng if unavailable)",
                "sourceName": "Source Name (e.g. Reuters, RTHK)",
                "background": "A 1-2 sentence context summary (Traditional Chinese).",
                "processedSummary": [
                    { "label": "Key Entity 1", "detail": "Details..." },
                    { "label": "Key Entity 2", "detail": "Details..." },
                    { "label": "Key Entity 3", "detail": "Details..." }
                ]
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
            if (!data.title) throw new Error("Empty Data");
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

        return { ...data, url: sourceUrl, regionCode, categoryCode };

    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
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
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);
          
          if (!error && data && data.length > 0) {
              const remotePosts = data.map((p: any) => ({
                  ...p,
                  source: typeof p.source === 'string' ? p.source : 'System',
                  processedSummary: p.processed_summary || [], 
                  background: p.background || p.contentCN || p.content
              }));
              safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(remotePosts));
              return remotePosts;
          } else {
              // INJECT DEMO DATA IF DB IS EMPTY (For Preview)
              return CES_DEMO_DATA;
          }
      } catch (e) {}
      
      // Local fallback
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      const localPosts = localStr ? JSON.parse(localStr) : [];
      if (localPosts.length === 0) return CES_DEMO_DATA;
      return localPosts;
  },

  savePost: async (post: Post): Promise<void> => {
      const dbPost = {
          ...post,
          processed_summary: post.processedSummary, 
          background: post.background,
          source: post.isRobot ? (post.source || 'AI News Bot') : 'User'
      };
      
      await supabase.from('posts').upsert(dbPost);
      
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      let current = localStr ? JSON.parse(localStr) : [];
      current = current.filter((p: any) => p.id !== post.id);
      current.unshift(post);
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

           const regionKeys = Object.keys(REGION_CONFIG);
           const catKeys = Object.keys(CATEGORY_CONFIG);
           const searchRegion = regionKeys[Math.floor(Math.random() * regionKeys.length)];
           const searchTopic = catKeys[Math.floor(Math.random() * catKeys.length)];
           
           const regionCode = REGION_CONFIG[searchRegion];
           const categoryCode = CATEGORY_CONFIG[searchTopic];

           console.log(`🤖 Bot Scanning: [${searchRegion}] - [${searchTopic}]`);

           const newsData = await fetchRealNewsFromGemini(searchRegion, searchTopic, regionCode, categoryCode);
           
           if (newsData) {
               const newPost: Post = {
                    id: `bot-${now}-${generateUUID().split('-')[0]}`,
                    title: newsData.title,
                    content: "Processed data.",
                    contentCN: "已結構化處理。",
                    processedSummary: newsData.processedSummary || [],
                    background: newsData.background || "",
                    region: newsData.regionCode,
                    category: newsData.categoryCode,
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
           }
            
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
