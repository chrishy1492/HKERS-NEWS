
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

// --- 2026-01-07 HIGH-FIDELITY GLOBAL DATA (Bot Engine v4.0) ---
const CES_DEMO_DATA: Post[] = [
    {
        id: "2026-ces-nv-01",
        title: "CES 2026：Nvidia Rubin 晶片細節曝光，推理吞吐量提升 5 倍",
        titleCN: "CES 2026：Nvidia Rubin 晶片細節曝光，推理吞吐量提升 5 倍",
        content: "Nvidia Rubin chip details revealed.",
        processedSummary: [
          { label: "技術核心", detail: "展示全新 Vera CPU 與 Rubin GPU 協作架構。" },
          { label: "效能指標", detail: "AI 推理延遲較上一代 Blackwell 降低 75%。" },
          { label: "上市時間", detail: "首批量產型號預計 2026 年第 4 季正式投入數據中心。" },
          { label: "影響預測", detail: "將大幅降低中小型 AI 公司訓練 Llama 4 等模型的成本。" },
          { label: "聲明", detail: "內容為重點整理，非原文複製，詳情請點擊連結。" }
        ],
        background: "CES 2026 第二日最受矚目的技術發布。",
        region: "us",
        category: "digital",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        // Use future dates to ensure they persist in demo
        timestamp: new Date('2026-01-07T09:45:00Z').getTime(), 
        displayDate: "2026-01-07 09:45",
        likes: 1250,
        hearts: 430,
        views: 25400,
        source: "TechCrunch / NVIDIA News",
        sourceUrl: "https://nvidianews.nvidia.com/",
        replies: []
    },
    {
        id: "2026-hk-prop-01",
        title: "摩根士丹利預測：香港樓市 2026 年將反彈 10%，租金收益率回升",
        titleCN: "摩根士丹利預測：香港樓市 2026 年將反彈 10%，租金收益率回升",
        content: "Morgan Stanley predicts HK property rebound.",
        processedSummary: [
          { label: "評級調升", detail: "將地產板塊由『持有』調升至『增持』。" },
          { label: "數據支持", detail: "預計 2026 年底前利率將累計下調 150 個基點。" },
          { label: "價格預測", detail: "住宅樓價預計錄得 10% 升幅，打破連續三年的跌勢。" },
          { label: "關鍵因素", detail: "人才計劃帶動的租務需求已轉化為購買力。" },
          { label: "版權提示", detail: "本文由智庫摘要改寫，請參閱原研究報告。" }
        ],
        background: "該報告今早在香港財經界引發廣泛討論。",
        region: "hk",
        category: "property",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: new Date('2026-01-07T03:00:00Z').getTime(),
        displayDate: "2026-01-07 03:00",
        likes: 890,
        hearts: 210,
        views: 18200,
        source: "Morgan Stanley Research",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-au-weather-01",
        title: "澳洲氣象局發布熱浪紅警：西澳局部地區體感溫度逼近 50°C",
        titleCN: "澳洲氣象局發布熱浪紅警：西澳局部地區體感溫度逼近 50°C",
        content: "Australia heatwave alert.",
        processedSummary: [
          { label: "極端觀測", detail: "Marble Bar 地區錄得 47.5°C 實溫，體感溫度接近 50°C。" },
          { label: "應急措施", detail: "全州禁止戶外用火，並設立多個臨時避暑中心。" },
          { label: "能源壓力", detail: "電網負荷打破紀錄，政府呼籲民眾節約非必要用電。" },
          { label: "聲明", detail: "即時氣象重點摘要，詳情請點閱官方預報。" }
        ],
        background: "這是澳洲 50 年來最嚴峻的一場 1 月份熱浪。",
        region: "au",
        category: "weather",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: new Date('2026-01-07T08:15:00Z').getTime(),
        displayDate: "2026-01-07 08:15",
        likes: 450,
        hearts: 120,
        views: 9500,
        source: "Bureau of Meteorology Australia",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-eu-snow-01",
        title: "歐洲寒潮襲擊：英法多地雪災致交通中斷，能源需求激增",
        titleCN: "歐洲寒潮襲擊：英法多地雪災致交通中斷，能源需求激增",
        content: "Europe snowstorm disruption.",
        processedSummary: [
          { label: "降雪規模", detail: "法國北部部分地區積雪達 30 厘米，多條高速公路封閉。" },
          { label: "能源價格", detail: "受低溫影響，天然氣期貨價格盤中上升 8%。" },
          { label: "交通警報", detail: "歐洲之星部分班次受極端低溫影響而延誤。" },
          { label: "聲明", detail: "災情資訊彙整，請關注當地交通部門最新公告。" }
        ],
        background: "極端氣候導致歐洲各國再次面臨電力平衡挑戰。",
        region: "eu",
        category: "weather",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: new Date('2026-01-07T05:30:00Z').getTime(),
        displayDate: "2026-01-07 05:30",
        likes: 560,
        hearts: 80,
        views: 10100,
        source: "Euronews / BBC",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-ca-wage-01",
        title: "加拿大最低工資生效首日：全國逾百萬勞工獲加薪，通脹壓力成焦點",
        titleCN: "加拿大最低工資生效首日：全國逾百萬勞工獲加薪，通脹壓力成焦點",
        content: "Canada minimum wage increase.",
        processedSummary: [
          { label: "政策細節", detail: "聯邦最低時薪調升至 $17.50，主要針對銀行及鐵路等行業。" },
          { label: "經濟評論", detail: "經濟學家憂慮加薪可能推遲央行降息時間表。" },
          { label: "勞方反應", detail: "工會表示雖有助抗通脹，但房租成本仍是最大負擔。" },
          { label: "聲明", detail: "政策資訊改寫摘要，詳情參閱聯邦公報。" }
        ],
        background: "此政策是加拿大 2026 年開年最重大的勞工市場變動。",
        region: "ca",
        category: "news",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: new Date('2026-01-06T20:00:00Z').getTime(),
        displayDate: "2026-01-06 20:00",
        likes: 720,
        hearts: 150,
        views: 13400,
        source: "Canada Gazette / CBC",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-uk-economy-01",
        title: "英國 12 月零售銷售勝預期，倫敦股市受提振創六個月高位",
        titleCN: "英國 12 月零售銷售勝預期，倫敦股市受提振創六個月高位",
        content: "UK retail sales beat expectations.",
        processedSummary: [
          { label: "數據指標", detail: "聖誕季零售銷售增長 3.8%，顯示消費者信心正在觸底回升。" },
          { label: "股市動態", detail: "富時 100 指數成分股中，零售及旅遊股領漲。" },
          { label: "未來展望", detail: "高盛報告指英國經濟 2026 年有望避免衰退。" }
        ],
        background: "數據釋放了市場累積已久的壓力。",
        region: "uk",
        category: "finance",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: new Date('2026-01-07T07:10:00Z').getTime(),
        displayDate: "2026-01-07 07:10",
        likes: 380,
        hearts: 60,
        views: 7800,
        source: "Financial Times / ONS",
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
