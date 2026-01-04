
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, Comment } from '../types';

// Local Cache Keys
const KEY_CURRENT_USER = 'hker_current_user_v6_sync';
const KEY_ALL_USERS = 'hker_all_users_cache_v6'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v6';

// Global Lock for Robot Execution
let isBotProcessing = false;

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

// --- CRITICAL FIX: UUID Polyfill for Mobile Browsers ---
// Many mobile browsers (iOS < 15.4, Android webviews) do NOT support crypto.randomUUID
// This fallback ensures the app doesn't crash on mobile.
export const generateUUID = () => {
    // Try native secure crypto first
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fallback if it exists but fails
        }
    }
    // Fallback: Timestamp + Random Math (Sufficient for non-critical IDs)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- SAFE STORAGE WRAPPER ---
// Prevents app crash when LocalStorage is full or in Private Mode
const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('LocalStorage Error (Quota/Privacy):', e);
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

// --- REALISTIC NEWS ENGINE ---
const NEWS_TEMPLATES: Record<string, Record<string, { title: string, content: string }[]>> = {
    'Hong Kong': {
        'Real Estate': [
            { title: "Kai Tak new launches see strong demand despite market cooling", content: "Hundreds queued up for the latest residential project in Kai Tak, signaling resilient demand for prime urban locations despite high interest rates." },
            { title: "Rental index climbs again: Tenants face higher renewal costs", content: "Residential rents in Hong Kong have risen for the 6th consecutive month, driven by the influx of professionals and students returning to the city." },
            { title: "Northern Metropolis: Gov pushes forward with land resumption", content: "The development bureau announced new timelines for land resumption in the New Territories to accelerate the Northern Metropolis plan." }
        ],
        'Finance': [
            { title: "HSI rebounds as tech stocks lead the charge", content: "The Hang Seng Index closed higher today, boosted by strong earnings reports from major technology firms and positive sentiment from mainland policies." },
            { title: "Green Bonds: Hong Kong solidifies hub status", content: "Issuance of green bonds in Hong Kong reached a record high this quarter, attracting global ESG investors and cementing the city's status as a green finance hub." },
            { title: "HKMA keeps watch on currency peg amidst Fed rate volatility", content: "The Monetary Authority reiterated its commitment to the linked exchange rate system despite external pressures and fluctuating US interest rates." }
        ],
        'Current Affairs': [
            { title: "Plastic ban implementation: Restaurants adapt to new rules", content: "Eateries across the city are switching to paper and wooden alternatives as the single-use plastic ban comes into full effect, receiving mixed reactions from the public." },
            { title: "Tourism revival: Visitor numbers hit post-pandemic peak", content: "The Tourism Board reports a significant surge in arrivals during the Golden Week holiday, with hotels reaching 90% occupancy." }
        ]
    },
    'UK': {
        'Finance': [
            { title: "UK inflation drops to 2-year low, easing cost of living crisis", content: "Office for National Statistics data shows a welcome decline in inflation, giving relief to households, though food prices remain high." },
            { title: "London Stock Exchange eyes new tech listings", content: "Reforms are underway to attract more technology companies to list in London post-Brexit, aiming to revitalize the financial market." }
        ],
        'Real Estate': [
            { title: "London rents hit record high: Average exceeds £2,600", content: "Tenants are facing unprecedented rental costs in the capital due to a severe shortage of available stock and high mortgage rates for landlords." },
            { title: "Manchester property boom continues with new regeneration projects", content: "The northern powerhouse sees property values rise faster than the national average, attracting investors from Asia and the Middle East." }
        ],
        'Community': [
            { title: "BN(O) community groups launch cultural festival in Sutton", content: "A new festival celebrating Hong Kong culture and food drew thousands of locals and newcomers this weekend, fostering community integration." }
        ]
    },
    'Canada': {
        'Real Estate': [
            { title: "Toronto housing market cools as inventory rises", content: "Buyers are taking a wait-and-see approach, leading to an accumulation of listings in the GTA as interest rates remain restrictive." },
            { title: "Vancouver introduces stricter short-term rental rules", content: "New provincial regulations aim to return short-term rental units to the long-term housing market to alleviate the housing crisis." }
        ],
        'Finance': [
            { title: "Bank of Canada holds rates steady, signals potential cuts", content: "The central bank maintained its policy rate today, citing progress in the fight against inflation but warning that risks remain." }
        ]
    },
    'USA': {
        'Finance': [
            { title: "Fed signals potential rate cuts later this year", content: "Wall Street reacts positively as inflation data shows signs of cooling in key sectors, raising hopes for a soft landing." },
            { title: "Tech giants pivot: AI investment drives market rally", content: "Major tech firms are shifting resources to artificial intelligence, fueling a stock market surge and creating new demands for chip manufacturing." }
        ],
        'Current Affairs': [
            { title: "Election year updates: Key swing states in focus", content: "Early polling indicates a tight race in battleground states as campaign season heats up, with economy being the top voter concern." }
        ]
    },
    'Australia': {
        'Real Estate': [
            { title: "Sydney housing prices defy rate hikes", content: "Despite higher interest rates, property values in Sydney continue to inch upwards due to low supply and strong population growth." }
        ],
        'Economy': [
            { title: "Resource exports drive trade surplus", content: "Strong demand for iron ore and LNG continues to support the Australian economy despite global economic headwinds." }
        ]
    },
    'Europe': {
        'Travel': [
            { title: "ETIAS visa waiver launch delayed again", content: "The EU has pushed back the start date for its new travel authorization system to ensure smooth border operations and system readiness." }
        ]
    },
    'Taiwan': {
        'Travel': [
            { title: "Taiwan tourism goal: 12 million visitors in 2024", content: "The Tourism Administration launches new campaigns to attract international travelers, focusing on culinary and cultural experiences." }
        ]
    }
};

const GENERIC_NEWS = [
    { cat: 'Technology', title: "Global chip shortage eases, but AI chips remain scarce", content: "Supply chains are normalizing, though demand for high-end AI processors continues to outstrip supply." },
    { cat: 'Finance', title: "Gold prices stabilize near all-time highs", content: "Geopolitical uncertainty keeps gold as a favored safe-haven asset for investors." }
];

const rnd = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const generateRealisticContent = (region: string) => {
    const regionData = NEWS_TEMPLATES[region];
    let category = 'General';
    let template = null;

    if (regionData) {
        const categories = Object.keys(regionData);
        category = rnd(categories);
        template = rnd(regionData[category]);
    } else {
        const backupRegion = rnd(['USA', 'UK', 'Hong Kong']);
        const backupData = NEWS_TEMPLATES[backupRegion];
        const backupCat = rnd(Object.keys(backupData));
        template = rnd(backupData[backupCat]);
        category = backupCat;
    }

    const dynamicSuffix = ` (Report #${1000 + Math.floor(Math.random()*9000)})`;
    const sources = Object.keys(SOURCE_DOMAINS);
    const randSource = rnd(sources);
    const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;

    return {
        title: template.title,
        content: template.content + dynamicSuffix, 
        category,
        source: randSource,
        url: mockUrl
    };
};

export const MockDB = {
  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        if (data) {
            const appUsers = data.map(fromDbUser);
            safeSetItem(KEY_ALL_USERS, JSON.stringify(appUsers));
            return appUsers;
        }
        return [];
    } catch (e) { 
        // Fallback for offline/mobile errors
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
            console.warn("Snake_case failed, trying minimal fallback");
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
          const minimal = { id: user.id, name: user.name, email: user.email };
          await supabase.from('users').upsert(minimal).eq('id', user.id);
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
  
  getPosts: async (): Promise<Post[]> => {
      try {
          const { data, error } = await supabase.from('posts').select('*').order('timestamp', { ascending: false }).limit(100);
          if (!error && data) {
              const cleanData = data.map((p: any) => ({
                  ...p,
                  source: (typeof p.source === 'string' && p.source !== '[object Object]') ? p.source : 'System'
              }));
              // SAFE WRAPPER APPLIED HERE
              safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(cleanData));
              return cleanData as Post[];
          }
      } catch (e) { }
      return JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
  },

  savePost: async (post: Post): Promise<void> => {
      const safePost = {
          ...post,
          source: (typeof post.source === 'string' && post.source !== '[object Object]') ? post.source : 'System'
      };
      await supabase.from('posts').upsert(safePost);
  },
  
  deletePost: async (postId: string): Promise<void> => { await supabase.from('posts').delete().eq('id', postId); },
  
  getAnalytics: async () => {
      try {
          const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
          return { totalMembers: count || 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: Math.floor(100 + Math.random() * 50) };
      } catch (e) { return { totalMembers: 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: 0 }; }
  },

  // --- ENHANCED ROBOT LOGIC WITH MUTEX LOCK ---
  triggerRobotPost: async () => {
       // 1. MUTEX LOCK: Prevent concurrent executions
       if (isBotProcessing) {
           return;
       }
       isBotProcessing = true;

       try {
           // 2. MOBILE OPTIMIZATION
           const { data: lastPosts, error } = await supabase
            .from('posts')
            .select('timestamp')
            .eq('isRobot', true)
            .order('timestamp', { ascending: false })
            .limit(1);

           if (error) {
               console.warn("Bot Network Check Failed");
               return; 
           }

           const now = Date.now();
           // COOLDOWN: 20 Minutes (1200000ms)
           const COOLDOWN = 1200000;
           
           if (lastPosts && lastPosts.length > 0) {
               const lastTime = lastPosts[0].timestamp;
               if (now - lastTime < COOLDOWN) return; 
           }

           // 3. GENERATE & SAVE
           const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
           const newsData = generateRealisticContent(region);
           
           // CRITICAL FIX: Use safe generateUUID() instead of crypto.randomUUID()
           // This prevents the mobile browser crash
           const newPost: Post = {
                id: `bot-${now}-${generateUUID().split('-')[0]}`,
                title: newsData.title,
                titleCN: "",
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
            
            console.log("🤖 Robot Posting:", newPost.title);
            await MockDB.savePost(newPost);
            
       } catch (err) {
           console.error("Critical Bot Error:", err);
       } finally {
           // Release Lock
           isBotProcessing = false;
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
