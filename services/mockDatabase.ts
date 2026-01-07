
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
    'Real Estate': 'property', 'Current Affairs': 'news', 
    'Finance': 'finance', 'Technology': 'digital', 
    'Entertainment': 'entertainment', 'Travel': 'travel',
    'Automotive': 'auto', 'Religion': 'religion',
    'Offers': 'offers', 'Campus': 'campus',
    'Weather': 'weather', 'Community': 'community'
};

// --- 2026-01-07 TRUSTED SOURCE DATA (Bot Engine v5.0) ---
const CES_DEMO_DATA: Post[] = [
    {
        id: "2026-nv-rubin-verge",
        title: "Nvidia's Rubin Platform Real-world Demo: AI Inference Performance Jumps 75%",
        titleCN: "Nvidia's Rubin Platform Real-world Demo: AI Inference Performance Jumps 75%",
        content: "Detailed report on Nvidia Rubin.",
        processedSummary: [
          { label: "技術亮點", detail: "Rubin 架構正式展示實機運行，搭載 Vera CPU 與 HBM4 記憶體。" },
          { label: "效能數據", detail: "推理吞吐量提升 5 倍，整體效能較 Blackwell 提升 75%。" },
          { label: "合作夥伴", detail: "Dell 與 HP 宣佈將於 2026 年底首批搭載該平台。" },
          { label: "市場預測", detail: "預計將進一步鞏固 Nvidia 在生成式 AI 算力市場的領導地位。" },
          { label: "改寫聲明", detail: "內容由 AI 重點整理自 The Verge，非原文複製，詳情請參閱原文。" }
        ],
        background: "CES 2026 重大技術發布。",
        region: "us",
        category: "digital",
        author: "HKER Intel Bot",
        authorId: "system-bot",
        isRobot: true,
        isEnglishSource: true,
        timestamp: new Date('2026-01-07T11:20:00Z').getTime(), 
        displayDate: "2026-01-07 11:20",
        likes: 1250,
        hearts: 430,
        views: 25400,
        source: "The Verge",
        sourceUrl: "https://www.theverge.com/",
        replies: []
    },
    {
        id: "2026-hk-scmp-prop",
        title: "Morgan Stanley: Hong Kong Home Prices Set for 10% Rebound in 2026",
        titleCN: "Morgan Stanley: Hong Kong Home Prices Set for 10% Rebound in 2026",
        content: "Morgan Stanley bullish on HK property.",
        processedSummary: [
          { label: "評級調升", detail: "大摩將香港地產股評級上調至「增持」，結束長期看淡期。" },
          { label: "價格預測", detail: "預計 2026 年樓價反彈 10%，主要受惠於美息回落與優才計劃。" },
          { label: "租金收益", detail: "住宅租金收益率預計回升至 3.5% 以上。" },
          { label: "關鍵數據", detail: "市場庫存預計在 2026 年 Q3 降至 5 年來最低點。" },
          { label: "來源說明", detail: "重點整理自 SCMP 獨家報導。" }
        ],
        background: "大行轉軚唱好香港樓市。",
        region: "hk",
        category: "property",
        author: "HKER Intel Bot",
        authorId: "system-bot",
        isRobot: true,
        isEnglishSource: true,
        timestamp: new Date('2026-01-07T03:30:00Z').getTime(),
        displayDate: "2026-01-07 03:30",
        likes: 890,
        hearts: 210,
        views: 18200,
        source: "SCMP",
        sourceUrl: "https://www.scmp.com/",
        replies: []
    },
    {
        id: "2026-au-weather-guardian",
        title: "Australia Heatwave: Western Australia Records Dangerous 48°C Amid Red Alert",
        titleCN: "Australia Heatwave: Western Australia Records Dangerous 48°C Amid Red Alert",
        content: "Extreme heat in WA.",
        processedSummary: [
          { label: "氣象記錄", detail: "西澳 Marble Bar 錄得 48.2°C，為 2026 年開年最高溫。" },
          { label: "安全警告", detail: "氣象局發布紅色高溫警戒，嚴禁一切戶外用火。" },
          { label: "基礎設施", detail: "多處電網因負載過重導致零星停電，政府實施輪流供電。" },
          { label: "聲明", detail: "災害資訊摘要自 The Guardian，詳情點擊連結。" }
        ],
        background: "澳洲極端氣候持續。",
        region: "au",
        category: "weather",
        author: "HKER Intel Bot",
        authorId: "system-bot",
        isRobot: true,
        isEnglishSource: true,
        timestamp: new Date('2026-01-07T09:15:00Z').getTime(),
        displayDate: "2026-01-07 09:15",
        likes: 450,
        hearts: 120,
        views: 9500,
        source: "The Guardian",
        sourceUrl: "https://www.theguardian.com/",
        replies: []
    },
    {
        id: "2026-tw-reuters-news",
        title: "Taiwan Reports Increased Cyber Activity Ahead of Policy Address",
        titleCN: "Taiwan Reports Increased Cyber Activity Ahead of Policy Address",
        content: "Cyber security alert in Taiwan.",
        processedSummary: [
          { label: "安全報告", detail: "台灣資安部門監測到針對政府基建的網絡攻擊頻率上升 40%。" },
          { label: "官方回應", detail: "政府已啟動二級防護機制，確保關鍵數據安全。" },
          { label: "國際評論", detail: "路透社指此波動與近期亞太地緣政治緊張局勢相關。" },
          { label: "提示", detail: "改寫自路透社即時報導。" }
        ],
        background: "亞太地區資安局勢緊張。",
        region: "tw",
        category: "news",
        author: "HKER Intel Bot",
        authorId: "system-bot",
        isRobot: true,
        isEnglishSource: true,
        timestamp: new Date('2026-01-07T06:45:00Z').getTime(),
        displayDate: "2026-01-07 06:45",
        likes: 560,
        hearts: 80,
        views: 10100,
        source: "Reuters",
        sourceUrl: "https://www.reuters.com/",
        replies: []
    },
    {
        id: "2026-eu-bbc-cold",
        title: "Europe Cold Snap: Deep Snow and Ice Disrupt Travel Across France and UK",
        titleCN: "Europe Cold Snap: Deep Snow and Ice Disrupt Travel Across France and UK",
        content: "Severe cold snap in Europe.",
        processedSummary: [
          { label: "交通影響", detail: "英法海峽隧道因積雪延誤，倫敦多條線路暫停服務。" },
          { label: "數據監測", detail: "氣溫降至零下 15°C，為十年來同月份最冷記錄。" },
          { label: "能源狀況", detail: "歐洲天然氣期貨價格因供暖需求激增而飆升。" },
          { label: "版權提示", detail: "重點摘要自 BBC News 現場報導。" }
        ],
        background: "歐洲交通與能源受嚴寒考驗。",
        region: "eu",
        category: "weather",
        author: "HKER Intel Bot",
        authorId: "system-bot",
        isRobot: true,
        isEnglishSource: true,
        timestamp: new Date('2026-01-07T05:20:00Z').getTime(),
        displayDate: "2026-01-07 05:20",
        likes: 720,
        hearts: 150,
        views: 13400,
        source: "BBC News",
        sourceUrl: "https://www.bbc.com/news",
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
                  background: p.background || p.contentCN || p.content,
                  isEnglishSource: p.is_english_source || false
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
          source: post.isRobot ? (post.source || 'AI News Bot') : 'User',
          is_english_source: post.isEnglishSource
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
