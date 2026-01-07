
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

// --- 2026-01-07 HIGH-FIDELITY GLOBAL DATA ---
const CES_DEMO_DATA: Post[] = [
    {
        id: "2026-ces-day2-nv",
        title: "CES 2026 直擊：Nvidia 展示 Rubin 平台實機運行，AI 推理效能驚艷全場",
        titleCN: "CES 2026 直擊：Nvidia 展示 Rubin 平台實機運行，AI 推理效能驚艷全場",
        content: "Nvidia shows off Rubin platform live.",
        processedSummary: [
          { label: "性能實測", detail: "現場演示 Rubin GPU 處理大型語言模型，推理延遲降低 75%，吞吐量提升 5 倍。" },
          { label: "生態擴張", detail: "Dell 與 HP 宣佈首批搭載 Rubin 晶片的伺服器將於 Q3 出貨。" },
          { label: "散熱技術", detail: "全新液冷架構可將數據中心能耗進一步降低 20%，符合 ESG 趨勢。" }
        ],
        background: "CES 2026 第二日熱點，Nvidia 鞏固其 AI 基礎設施霸主地位。",
        region: "us",
        category: "digital",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 100000000, 
        displayDate: "2026-01-07 08:30",
        likes: 850,
        hearts: 230,
        views: 15400,
        source: "TechCrunch / NVIDIA Blog",
        sourceUrl: "https://nvidianews.nvidia.com/",
        replies: []
    },
    {
        id: "2026-hk-ms-report",
        title: "摩根士丹利深度分析：香港樓市進入『黃金周期』，2026 預測升幅調高至 10%",
        titleCN: "摩根士丹利深度分析：香港樓市進入『黃金周期』，2026 預測升幅調高至 10%",
        content: "Morgan Stanley upgrades HK property forecast.",
        processedSummary: [
          { label: "政策紅利", detail: "受近期利率連降及人才計劃帶動，剛性需求回升至 5 年新高。" },
          { label: "價格預測", detail: "預計 2026 年全年樓價將累計上漲 10%，新盤去貨速度顯著加快。" },
          { label: "租金收益", detail: "核心區份租金回報率穩步上升至 3.5%，吸引機構投資者入場。" }
        ],
        background: "這份報告是今早財經界的討論核心，標誌著香港地產市場信心的徹底逆轉。",
        region: "hk",
        category: "property",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 98000000,
        displayDate: "2026-01-07 02:00",
        likes: 620,
        hearts: 150,
        views: 11200,
        source: "Morgan Stanley / SCMP",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-tw-tsmc-news",
        title: "台灣半導體報告：2nm 產能提前滿載，台積電 2026 財測大幅上調",
        titleCN: "台灣半導體報告：2nm 產能提前滿載，台積電 2026 財測大幅上調",
        content: "TSMC 2nm capacity fully booked.",
        processedSummary: [
          { label: "產能動態", detail: "2nm 製程良率超預期，Apple 與 Nvidia 已包攬 2026 年全部產能。" },
          { label: "營收預期", detail: "受惠於高效能運算 (HPC) 需求，Q1 營收預計年增 25%。" },
          { label: "資本支出", detail: "宣佈加碼研發 A16 代工技術，維持全球技術領先優勢。" }
        ],
        background: "台股受此消息刺激，半導體板塊早盤錄得強勁升幅。",
        region: "tw",
        category: "finance",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 96000000,
        displayDate: "2026-01-07 05:15",
        likes: 410,
        hearts: 80,
        views: 8900,
        source: "經濟日報 / Reuters",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-au-weather-extreme",
        title: "澳洲極端熱浪蔓延：西澳氣溫破 47°C，創 50 年來最高紀錄",
        titleCN: "澳洲極端熱浪蔓延：西澳氣溫破 47°C，創 50 年來最高紀錄",
        content: "Australia heatwave hits 47C.",
        processedSummary: [
          { label: "極端觀測", detail: "Marble Bar 地區錄得 47.2°C，多地打破 1 月份歷史高溫紀錄。" },
          { label: "電力警報", detail: "空調用電量激增，電網負荷達極限，部分地區實施預防性輪流供電。" },
          { label: "公共安全", detail: "發布極高級別森林火險警告，多個國家公園已宣佈關閉。" }
        ],
        background: "極端天氣持續肆虐，再次引發對氣候變遷與減碳政策的深度討論。",
        region: "au",
        category: "weather",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 94000000,
        displayDate: "2026-01-06 22:00",
        likes: 350,
        hearts: 120,
        views: 7500,
        source: "ABC News",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-uk-economy-ftse",
        title: "英國經濟數據優於預期：2026 年初消費者支出回暖，富時指數創波段新高",
        titleCN: "英國經濟數據優於預期：2026 年初消費者支出回暖，富時指數創波段新高",
        content: "UK Economy rebounds.",
        processedSummary: [
          { label: "零售數據", detail: "1 月首週零售額年增 4.2%，通脹壓力緩解帶動消費信心回升。" },
          { label: "市場表現", detail: "FTSE 100 指數今晨突破 8500 點大關，能源與金融股表現亮眼。" },
          { label: "貨幣政策", detail: "市場預測英倫銀行將維持利率不變，轉向支持經濟增長。" }
        ],
        background: "英國經濟展現韌性，逐步走出高利率陰霾。",
        region: "uk",
        category: "finance",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 92000000,
        displayDate: "2026-01-07 06:30",
        likes: 290,
        hearts: 40,
        views: 6100,
        source: "Financial Times",
        sourceUrl: "#",
        replies: []
    },
    {
        id: "2026-ca-min-wage-impact",
        title: "加拿大聯邦最低工資正式上調：百萬勞工受益，企業界呼籲減稅配套",
        titleCN: "加拿大聯邦最低工資正式上調：百萬勞工受益，企業界呼籲減稅配套",
        content: "Canada minimum wage hike.",
        processedSummary: [
          { label: "政策細節", detail: "聯邦最低時薪升至 $17.50，自動與通脹掛鉤，每年調整。" },
          { label: "行業反饋", detail: "中小企業協會表示人力成本壓力增加，希望政府提供稅收抵免方案。" },
          { label: "社會評價", detail: "勞工組織表示肯定，稱此舉能有效降低『工作性貧窮』率。" }
        ],
        background: "這是 2026 年加拿大首項重大民生政策落實，引發社會廣泛關注。",
        region: "ca",
        category: "news",
        author: "AI Analysis Bot",
        authorId: "system-bot",
        isRobot: true,
        timestamp: Date.now() + 90000000,
        displayDate: "2026-01-06 19:00",
        likes: 550,
        hearts: 90,
        views: 8200,
        source: "Global News Canada",
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
