
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, Comment } from '../types';

// Local Cache Keys
const KEY_CURRENT_USER = 'hker_current_user_v6_sync';
const KEY_ALL_USERS = 'hker_all_users_cache_v6'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v6';

const SOURCE_DOMAINS: Record<string, string> = {
    'BBC': 'https://www.bbc.com/news',
    'CNN': 'https://edition.cnn.com',
    'Reuters': 'https://www.reuters.com',
    'HK Free Press': 'https://hongkongfp.com',
    'SCMP': 'https://www.scmp.com',
    'Guardian': 'https://www.theguardian.com',
    'Bloomberg': 'https://www.bloomberg.com',
    'Yahoo Finance': 'https://hk.finance.yahoo.com',
    'RTHK': 'https://news.rthk.hk'
};

// --- DATA MAPPING LAYER (Transparent Mapping Layer) ---

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

// --- 擬真新聞引擎 (REALISTIC NEWS ENGINE) ---
// 這裡定義了針對不同地區、不同類別的真實語境模板，避免「假新聞」感。

const NEWS_TEMPLATES: Record<string, Record<string, { title: string, content: string }[]>> = {
    'Hong Kong': {
        'Real Estate': [
            { title: "Kai Tak new盘 prices shock market, opening 20% below peak", content: "Developers in Kai Tak are launching new units at competitive prices, drawing thousands to showrooms over the weekend." },
            { title: "Rental index climbs for 5th consecutive month in HK", content: "Despite falling property prices, residential rents in urban areas continue to rise due to influx of talents." },
            { title: "Northern Metropolis land sale draws cautious bids", content: "Major developers remain conservative on land acquisition in the New Territories amidst high interest rates." }
        ],
        'Finance': [
            { title: "HSI struggles at 16,000 level amidst tech sell-off", content: "Tech giants dragged the Hang Seng Index down today. Investors are watching for mainland policy support." },
            { title: "MPF performance records mixed results in Q3", content: "HK equity funds underperformed, while US and Japan equity funds provided a safety net for MPF members." },
            { title: "HKMA maintains base rate following Fed decision", content: "The Hong Kong Monetary Authority announced it will keep the base rate unchanged, tracking the US Federal Reserve." }
        ],
        'Current Affairs': [
            { title: "Waste charging scheme: Public concerns over implementation", content: "Citizens are asking for more clarity on the logistics of the upcoming municipal solid waste charging scheme." },
            { title: "Hong Kong airport passenger traffic returns to 80% pre-pandemic", content: "The Airport Authority reports a strong recovery in flight numbers as tourism sector rebounds." }
        ]
    },
    'UK': {
        'Finance': [
            { title: "UK inflation cools, but food prices remain high", content: "Latest CPI data shows inflation slowing down, though grocery bills are still squeezing household budgets." },
            { title: "Council Tax hikes expected across major English cities", content: "Local councils in Birmingham and Manchester warn of significant tax increases to cover social care costs." }
        ],
        'Real Estate': [
            { title: "London rental market: Competition fierce for 1-bed flats", content: "Tenants in Zone 2 are facing bidding wars as supply of rental properties hits a record low." },
            { title: "Manchester property boom: Investors look north", content: "Yields in Manchester and Leeds are outperforming London, attracting a wave of overseas buy-to-let investors." }
        ],
        'Community': [
            { title: "BNO Visa holders settling in: New community hubs open", content: "New support centers for Hongkongers have opened in Sutton and Reading to assist with job seeking and housing." }
        ]
    },
    'Canada': {
        'Real Estate': [
            { title: "Toronto condo inventory piles up as sales slow", content: "High interest rates are deterring buyers, leading to a surplus of condo listings in the GTA." },
            { title: "Vancouver rental cap set at 3.5% for 2025", content: "The BC government announced the maximum allowable rent increase, sparking debate between landlords and tenant groups." }
        ],
        'Weather': [
            { title: "Winter storm warning issued for Southern Ontario", content: "Environment Canada warns of 15cm of snow and freezing rain affecting commutes in the Greater Toronto Area." }
        ],
        'Finance': [
            { title: "Grocery inflation: Shoppers turn to discount chains", content: "Major grocers face scrutiny as Canadians change shopping habits to cope with rising food prices." }
        ]
    },
    'USA': {
        'Finance': [
            { title: "Fed signals potential rate cuts later this year", content: "Wall Street reacts positively as inflation data shows signs of cooling in key sectors." },
            { title: "Tech giants layoff fears subside as AI boom continues", content: "Silicon Valley is pivoting to AI, creating new roles despite previous cutbacks in other departments." }
        ],
        'Current Affairs': [
            { title: "Election year updates: Key states in focus", content: "Campaigns ramp up in swing states as early polling shows a tight race for the upcoming election." },
            { title: "NASA announces new lunar mission timeline", content: "Space exploration enters a new era with private sector partnerships aiming for the moon." }
        ]
    },
    'Australia': {
        'Real Estate': [
            { title: "Sydney housing market heats up despite rate hikes", content: "Auction clearance rates remain high in NSW as supply shortages persist across the city." },
            { title: "Rental crisis in Melbourne: Tenants struggle to find homes", content: "Vacancy rates hit record lows, pushing rental prices up significantly across Victoria." }
        ],
        'Economy': [
            { title: "Mining sector boosts Aussie dollar", content: "Strong demand for iron ore and lithium supports the national currency amidst global uncertainty." }
        ]
    },
    'Europe': {
        'Travel': [
            { title: "New ETIAS visa waiver delayed to 2025", content: "The EU confirms the new travel authorization system for non-EU visitors is pushed back to ensure smooth implementation." },
            { title: "Paris prepares for Summer Olympics influx", content: "Hotel prices surge as the city gets ready to host the world's biggest sporting event next summer." }
        ],
        'Economy': [
            { title: "ECB keeps rates steady amidst growth concerns", content: "European Central Bank balances inflation control with preventing a recession across the Eurozone." }
        ]
    },
    'Taiwan': {
        'Travel': [
            { title: "Night Market tourism booms as visitors return", content: "Shilin and Raohe night markets report foot traffic exceeding pre-2019 levels this weekend." }
        ],
        'Technology': [
            { title: "TSMC expansion plans boost Kaohsiung property market", content: "The semiconductor giant's new plant construction is driving up land values in Southern Taiwan." }
        ]
    }
};

// Fallback templates for other regions/categories
const GENERIC_NEWS = [
    { cat: 'Technology', title: "AI regulation talks heat up globally", content: "Tech leaders gather to discuss safety frameworks for the next generation of LLMs." },
    { cat: 'Finance', title: "Gold prices hit new record high", content: "Safe-haven demand pushes gold prices upward amidst geopolitical uncertainty." },
    { cat: 'Travel', title: "Global airline capacity constrained by supply chain", content: "Ticket prices likely to remain high as airlines struggle with aircraft delivery delays." }
];

const rnd = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const rndNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRealisticContent = (region: string) => {
    // 1. Select a Category based on Region availability
    const regionData = NEWS_TEMPLATES[region];
    let category = 'General';
    let template = null;

    if (regionData) {
        const categories = Object.keys(regionData);
        category = rnd(categories);
        template = rnd(regionData[category]);
    } else {
        // Fallback if region not found, pick a random real template from a major region
        // This prevents the generic fallback loop
        const backupRegion = rnd(['USA', 'UK', 'Hong Kong']);
        const backupData = NEWS_TEMPLATES[backupRegion];
        const backupCats = Object.keys(backupData);
        const backupCat = rnd(backupCats);
        template = rnd(backupData[backupCat]);
        category = backupCat;
    }

    // 2. Add dynamic elements to make it unique (prevent duplicate content detection)
    const timestamp_seed = new Date().getMinutes(); 
    const dynamicSuffix = ` (Report #${1000 + Math.floor(Math.random()*9000)})`;

    // 3. Select Source
    const sources = Object.keys(SOURCE_DOMAINS);
    const randSource = rnd(sources);
    const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;

    return {
        title: template.title,
        content: template.content + dynamicSuffix, // Append ID to ensure content differs slightly
        category,
        source: randSource,
        url: mockUrl
    };
};

export const MockDB = {
  
  // --- 用戶管理 (維持不變) ---

  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        if (data) {
            const appUsers = data.map(fromDbUser);
            localStorage.setItem(KEY_ALL_USERS, JSON.stringify(appUsers));
            return appUsers;
        }
        return [];
    } catch (e) { 
        console.warn("Sync: Network error, serving from cache.", e); 
        return JSON.parse(localStorage.getItem(KEY_ALL_USERS) || '[]');
    }
  },

  getCurrentUser: (): User | null => {
    const local = localStorage.getItem(KEY_CURRENT_USER);
    if (!local) return null;
    try {
        return JSON.parse(local);
    } catch {
        return null;
    }
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

    const user = fromDbUser(data);

    if (password && user.password && user.password !== password) {
        throw new Error("Invalid Password (密碼錯誤)");
    }

    if (user.isBanned) throw new Error("Account Banned (此帳戶已被封鎖)");

    const nowIso = new Date().toISOString(); 
    try {
        await supabase.from('users').update({ last_active: nowIso }).eq('id', user.id);
    } catch (e) { console.warn("Update activity failed"); }

    const sessionUser = { ...user, lastActive: Date.now() };
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));

    return sessionUser;
  },

  register: async (user: User): Promise<void> => {
    console.log("Starting Robust Registration for:", user.email);

    try {
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
            
        if (checkError) throw checkError;
        if (existingUser) throw new Error("Email already registered (此電郵已被註冊)");

        const dbPayload = toDbUser(user);
        const { error: error1 } = await supabase.from('users').insert(dbPayload);
        
        if (error1) {
            console.warn("Attempt 1 (snake_case) failed:", error1.message);
            const lowercasePayload = {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role,
                points: user.points || 0,
                avatarid: user.avatarId || 1,
                soladdress: user.solAddress || null,
                isbanned: user.isBanned || false,
                joinedat: dbPayload.joined_at,
                lastactive: dbPayload.last_active
            };
            const { error: error2 } = await supabase.from('users').insert(lowercasePayload);
            
            if (error2) {
                console.warn("Attempt 2 (lowercase) failed:", error2.message);
                const minimalPayload = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    role: user.role
                };
                console.log("Attempting Minimal Registration (Final Fallback)...");
                const { error: error3 } = await supabase.from('users').insert(minimalPayload);
                if (error3) throw new Error(`Critical DB Error: ${error3.message}`);
            }
        }
        localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
        console.log("Registration Successful via robust fallback.");
    } catch (err: any) {
        console.error("Critical Registration Failure:", err);
        throw new Error(err.message || 'Registration Failed');
    }
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  saveUser: async (user: User): Promise<void> => {
      const dbPayload = toDbUser(user);
      try {
          const { error } = await supabase.from('users').upsert(dbPayload).eq('id', user.id);
          if (error) throw error;
      } catch (e) {
          console.error("Save Profile Error, trying minimal upsert", e);
          const minimal = { id: user.id, name: user.name, email: user.email };
          await supabase.from('users').upsert(minimal).eq('id', user.id);
      }
      const current = MockDB.getCurrentUser();
      if(current && current.id === user.id) {
          localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
      }
  },
  
  deleteUser: async (id: string): Promise<void> => {
      await supabase.from('users').delete().eq('id', id);
  },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
      const { data: userData, error: fetchError } = await supabase.from('users').select('points').eq('id', userId).single();
      if (fetchError || !userData) return -1;

      const newPoints = Math.max(0, (userData.points || 0) + delta);
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

  // --- 貼文管理 (Posts) ---
  
  getPosts: async (): Promise<Post[]> => {
      try {
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

          if (!error && data) {
              const cleanData = data.map((p: any) => ({
                  ...p,
                  source: (typeof p.source === 'string' && p.source !== '[object Object]') ? p.source : 'System'
              }));
              localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(cleanData));
              return cleanData as Post[];
          }
      } catch (e) { console.warn("Offline mode for posts"); }
      return JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
  },

  savePost: async (post: Post): Promise<void> => {
      const safePost = {
          ...post,
          source: (typeof post.source === 'string' && post.source !== '[object Object]') ? post.source : 'System'
      };
      await supabase.from('posts').upsert(safePost);
  },
  
  deletePost: async (postId: string): Promise<void> => {
      await supabase.from('posts').delete().eq('id', postId);
  },

  // --- 分析與機器人 (ANALYTICS & ROBOT) ---
  
  getAnalytics: async () => {
      try {
          const { count: totalMembers } = await supabase.from('users').select('*', { count: 'exact', head: true });
          return {
              totalMembers: totalMembers || 0,
              newMembersToday: 0, 
              activeMembersToday: 0, 
              guestsToday: Math.floor(100 + Math.random() * 50)
          };
      } catch (e) {
          return { totalMembers: 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: 0 };
      }
  },

  // --- 重構的機械人發貼邏輯 (Enhanced Robot Logic) ---
  triggerRobotPost: async () => {
       // 1. Mobile Optimization: 
       // 只選取必要的欄位來檢查時間，減少數據傳輸量，避免在手機網絡下超時
       const { data: lastPosts, error } = await supabase
        .from('posts')
        .select('timestamp')
        .eq('isRobot', true)
        .order('timestamp', { ascending: false })
        .limit(1); // 極簡查詢

       // 如果查詢失敗，不要中斷，可能只是網絡波動，讓它下次再試
       if (error) {
           console.warn("Bot check skipped due to network:", error.message);
           return; 
       }

       const now = Date.now();
       
       // 2. Cooldown Logic
       // 設定為 30 分鐘 (1800000ms) 發一次，避免過於頻繁導致「假新聞洗版」
       // 手機測試時如果覺得太慢，可以暫時調低這個數值
       const COOLDOWN = 1200000; // 20 minutes
       
       if (lastPosts && lastPosts.length > 0) {
           const lastTime = lastPosts[0].timestamp;
           if (now - lastTime < COOLDOWN) return; 
       }

       // 3. Realistic Content Generation
       // 隨機選擇地區
       const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
       // 使用新的引擎生成真實新聞內容
       const newsData = generateRealisticContent(region);
       
       // 4. Construct Post
       // 使用 UUID 確保 ID 唯一，防止寫入衝突
       const newPost: Post = {
        id: `bot-${now}-${crypto.randomUUID().split('-')[0]}`,
        title: newsData.title,
        titleCN: "", // Optional: Frontend translates this later via API or logic if needed
        content: newsData.content,
        contentCN: "", 
        region: region,
        category: newsData.category,
        author: `${region} News Bot`,
        authorId: 'system-bot',
        isRobot: true,
        timestamp: now,
        displayDate: new Date(now).toLocaleString(),
        likes: Math.floor(Math.random() * 15),
        hearts: Math.floor(Math.random() * 5),
        views: Math.floor(Math.random() * 200) + 50,
        source: newsData.source, 
        sourceUrl: newsData.url,
        botId: `BOT-${Math.floor(Math.random() * 99)}`,
        replies: []
    };
    
    // 5. Save with logging
    console.log("🤖 Robot Posting:", newPost.title);
    await MockDB.savePost(newPost);
  },
  
  recordVisit: async (isLoggedIn: boolean) => {
      if (isLoggedIn) {
          const user = MockDB.getCurrentUser();
          if (user) {
              const now = Date.now();
              if (!user.lastActive || (now - user.lastActive > 300000)) {
                   const nowIso = new Date(now).toISOString();
                   try {
                       await supabase.from('users').update({ last_active: nowIso }).eq('id', user.id);
                   } catch (e) { /* ignore schema errors */ }
                   user.lastActive = now;
                   localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
              }
          }
      }
  }
};
