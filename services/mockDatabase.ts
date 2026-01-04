
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, Comment } from '../types';

// Local Cache Keys (Temporary Storage Area)
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
    'Bloomberg': 'https://www.bloomberg.com'
};

// --- DATA MAPPING LAYER (透明轉譯層) ---
// 修復：PostgreSQL 默認將欄位視為全小寫 (lowercase)。
// avatarId (駝峰) -> 失敗
// avatar_id (蛇形) -> 失敗
// 解決方案：強制轉換為全小寫 (avatarid, soladdress, lastactive)

const toDbUser = (user: User) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        address: user.address,
        phone: user.phone,
        // 全小寫映射 (Lowercase Mapping)
        soladdress: user.solAddress || null, 
        gender: user.gender,
        role: user.role,
        points: user.points,
        avatarid: user.avatarId,             
        isbanned: user.isBanned || false,    
        // 時間格式轉換: Number -> ISO String
        joinedat: user.joinedAt ? new Date(user.joinedAt).toISOString() : new Date().toISOString(),     
        lastactive: user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString()
    };
};

const fromDbUser = (dbUser: any): User => {
    return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        password: dbUser.password,
        address: dbUser.address,
        phone: dbUser.phone,
        // 兼容讀取：嘗試讀取全小寫，但也保留後備選項
        solAddress: dbUser.soladdress || dbUser.sol_address || dbUser.solAddress || '', 
        gender: dbUser.gender,
        role: dbUser.role as UserRole,
        points: dbUser.points,
        avatarId: dbUser.avatarid || dbUser.avatar_id || dbUser.avatarId || 1,      
        isBanned: dbUser.isbanned || dbUser.is_banned || dbUser.isBanned || false,
        // 時間格式轉換: ISO String -> Number
        joinedAt: dbUser.joinedat ? new Date(dbUser.joinedat).getTime() : Date.now(),
        lastActive: dbUser.lastactive ? new Date(dbUser.lastactive).getTime() : Date.now()
    };
};

// --- CONTENT GENERATION ENGINE v2.0 ---
// (保留原有內容生成邏輯)

const REGION_CONTEXT: Record<string, any> = {
    'Hong Kong': { cities: ['Central', 'Mong Kok', 'Shatin', 'Tuen Mun', 'Kai Tak'], currency: 'HKD', policies: ['MPF', 'Stamp Duty', 'MTR Fares'], keywords: ['Lion Rock', 'Dim Sum', 'Land Supply'] },
    'UK': { cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Reading'], currency: 'GBP', policies: ['Council Tax', 'NI', 'Visa Updates'], keywords: ['BNO', 'NHS', 'High Street'] },
    'Taiwan': { cities: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan'], currency: 'TWD', policies: ['Health Insurance', 'Residency Rules'], keywords: ['Night Market', 'MRT', 'Immigration'] },
    'USA': { cities: ['New York', 'SF', 'LA', 'Chicago'], currency: 'USD', policies: ['IRS', 'Green Card', 'Fed Rates'], keywords: ['Wall St', 'Tech Giants', 'Suburbs'] },
    'Canada': { cities: ['Toronto', 'Vancouver', 'Calgary', 'Markham'], currency: 'CAD', policies: ['PR Pathway', 'Housing Crisis', 'Carbon Tax'], keywords: ['Stream A/B', 'Snow Storm', 'Tim Hortons'] },
    'Australia': { cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'], currency: 'AUD', policies: ['Negative Gearing', 'Visa Points'], keywords: ['Beach Life', 'Coffee Culture', 'Rentals'] },
    'Europe': { cities: ['Berlin', 'Paris', 'Amsterdam', 'Dublin'], currency: 'EUR', policies: ['EU Blue Card', 'Digital Nomad'], keywords: ['Train Travel', 'Work Life Balance', 'Energy Prices'] }
};

const rnd = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const rndNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const TEMPLATE_GENERATORS: Record<string, (region: string, ctx: any) => any> = {
    'Real Estate': (region, ctx) => {
        const city = rnd(ctx.cities);
        const change = rndNum(2, 15);
        const direction = Math.random() > 0.5 ? 'rise' : 'drop';
        const directionCN = direction === 'rise' ? '上漲' : '下跌';
        
        return {
            titleEN: `[${region} Property] ${city} rent prices see ${change}% ${direction} amid new demand`,
            titleCN: `【${REGIONS_CN[region]}地產】${city} 租金錄得 ${change}% ${directionCN}，市場需求現變化`,
            contentEN: `Latest housing data from ${city} indicates a significant shift. Agents report that the influx of new residents is impacting the local market. \n\n"It's becoming harder to find quality listings in ${city} under ${rndNum(1000, 3000)} ${ctx.currency}," says a local expert.`,
            contentCN: `來自 ${city} 的最新房屋數據顯示市場出現顯著變化。地產代理報告指出，新移居人口正在影響當地租務市場。\n\n當地專家表示：「在 ${city} 尋找低於 ${rndNum(1000, 3000)} ${ctx.currency} 的優質盤源變得越來越困難。」`
        };
    },
    'Finance': (region, ctx) => {
        const stock = Math.random() > 0.5 ? 'Tech Stocks' : 'Traditional Banking';
        const action = Math.random() > 0.5 ? 'rally' : 'slump';
        
        return {
            titleEN: `[${region} Finance] ${ctx.currency} fluctuation and its impact on ${region} expats`,
            titleCN: `【${REGIONS_CN[region]}財經】${ctx.currency} 匯率波動及其對移居${REGIONS_CN[region]}港人的影響`,
            contentEN: `With the recent volatility in global markets, holding ${ctx.currency} assets has become a hot topic. Analysts suggest diversifying portfolios.\n\nLocal banks in ${rnd(ctx.cities)} are offering new incentives for savings accounts.`,
            contentCN: `隨著全球市場近期波動，持有 ${ctx.currency} 資產成為熱門話題。分析師建議分散投資組合。\n\n${rnd(ctx.cities)} 的本地銀行正為儲蓄賬戶提供新的優惠措施。`
        };
    },
    'Weather': (region, ctx) => {
        const weatherTypes = ['Heavy Rain', 'Heatwave', 'Strong Winds', 'Snow Alert', 'Sunny Spells'];
        const weather = rnd(weatherTypes);
        const temp = rndNum(-5, 35);
        
        return {
            titleEN: `[${region} Weather] ${weather} expected in ${rnd(ctx.cities)} this weekend`,
            titleCN: `【${REGIONS_CN[region]}天氣】預計本週末 ${rnd(ctx.cities)} 將出現${weather === 'Heatwave' ? '熱浪' : '大雨'}`,
            contentEN: `Residents in ${region} should prepare for ${weather.toLowerCase()}. Temperatures are expected to hit ${temp}°C. Please plan your commute accordingly.`,
            contentCN: `居住在${REGIONS_CN[region]}的居民應為${weather === 'Heatwave' ? '高溫' : '惡劣'}天氣做好準備。預計氣溫將達到 ${temp}°C。請相應規劃您的通勤行程。`
        };
    },
    'Community': (region, ctx) => {
        const activity = rnd(['Night Market', 'Charity Run', 'HKER Gathering', 'Cultural Festival']);
        return {
            titleEN: `[Community] ${activity} to be held in ${rnd(ctx.cities)}`,
            titleCN: `【社區活動】${rnd(ctx.cities)} 將舉辦${activity === 'Night Market' ? '夜市' : '港人聚會'}`,
            contentEN: `A fantastic opportunity for the ${region} community to connect. Organizers expect over ${rndNum(100, 500)} participants. Don't miss the chance to meet fellow Hongkongers!`,
            contentCN: `這是一個讓${REGIONS_CN[region]}社區互相連結的絕佳機會。主辦方預計將有超過 ${rndNum(100, 500)} 名參與者。別錯過認識其他香港人的機會！`
        };
    },
    'Current Affairs': (region, ctx) => {
        const policy = rnd(ctx.policies);
        return {
            titleEN: `[Policy Update] New changes to ${policy} in ${region} effective next month`,
            titleCN: `【時事焦點】${REGIONS_CN[region]} ${policy} 新政策將於下月生效`,
            contentEN: `The government has announced adjustments to ${policy}. This could affect many newly arrived families. Experts advise checking the official website for details regarding ${ctx.currency} thresholds.`,
            contentCN: `政府已宣布對 ${policy} 進行調整。這可能會影響許多新抵達的家庭。專家建議查看官方網站，了解有關 ${ctx.currency} 門檻的詳細信息。`
        };
    }
};

const defaultGenerator = (region: string, topic: string, ctx: any) => {
    return {
        titleEN: `[${region}] Discussions on ${topic} heating up in ${rnd(ctx.cities)}`,
        titleCN: `【${REGIONS_CN[region]}】關於${CATEGORIES_CN[topic]}的討論在 ${rnd(ctx.cities)} 持續升溫`,
        contentEN: `Locals are talking about the recent developments in ${topic}. Share your thoughts in the comments below.`,
        contentCN: `當地人正在討論 ${CATEGORIES_CN[topic]} 的最新發展。歡迎在下方留言分享您的看法。`
    };
};

const generateRobotContent = (region: string, topic: string) => {
    const sources = Object.keys(SOURCE_DOMAINS);
    const randSource = sources[Math.floor(Math.random() * sources.length)];
    const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;
    const ctx = REGION_CONTEXT[region] || REGION_CONTEXT['Hong Kong'];
    const specificGenerator = TEMPLATE_GENERATORS[topic];
    const contentData = specificGenerator ? specificGenerator(region, ctx) : defaultGenerator(region, topic, ctx);

    const footerEN = `\n\n(AI Summary by HKER Bot. Source: ${randSource})`;
    const footerCN = `\n\n(本資訊由 HKER AI 機械人摘要。來源：${randSource})`;

    return { 
        titleEN: contentData.titleEN, 
        titleCN: contentData.titleCN, 
        contentEN: contentData.contentEN + footerEN, 
        contentCN: contentData.contentCN + footerCN, 
        source: randSource, 
        url: mockUrl 
    };
};

export const MockDB = {
  
  // --- USERS (Supabase Primary, with Transparent Mapping) ---

  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        if (data) {
            // 從 DB 讀取後，自動轉回 App 認識的 camelCase
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
    return local ? JSON.parse(local) : null;
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    // 從 Supabase 查詢
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

    if (error || !data) {
        throw new Error("User not found (用戶不存在) - Please Register First");
    }

    // 轉換資料格式
    const user = fromDbUser(data);

    if (password && user.password && user.password !== password) {
        throw new Error("Invalid Password (密碼錯誤)");
    }

    if (user.isBanned) throw new Error("Account Banned (此帳戶已被封鎖)");

    // 更新最後活躍時間 (寫入時轉為全小寫 lastactive)
    const nowIso = new Date().toISOString(); 
    await supabase.from('users').update({ lastactive: nowIso }).eq('id', user.id);

    // 更新本地 Session
    const sessionUser = { ...user, lastActive: Date.now() };
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));

    return sessionUser;
  },

  register: async (user: User): Promise<void> => {
    console.log("Attempting registration for:", user.email);

    // 1. 檢查是否已存在
    const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();
        
    if (existingUser) {
        throw new Error("Email already registered (此電郵已被註冊)");
    }

    // 2. 寫入 Supabase (關鍵步驟：轉換為 DB 格式 - 全小寫)
    const dbPayload = toDbUser(user);
    
    const { error } = await supabase.from('users').insert(dbPayload);
    
    if (error) {
        console.error("Supabase Write Error:", JSON.stringify(error, null, 2));
        throw new Error(`Database Registration Failed: ${error.message || 'Unknown Error'}`);
    }

    // 3. 註冊成功後，更新本地狀態
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
    console.log("Registration successful, data persisted to Supabase.");
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  saveUser: async (user: User): Promise<void> => {
      // 更新資料 (同樣需要轉換)
      const dbPayload = toDbUser(user);
      const { error } = await supabase.from('users').upsert(dbPayload).eq('id', user.id);
      
      if (error) {
          console.error("Save User Error", JSON.stringify(error, null, 2));
          throw new Error("Failed to save profile changes to cloud.");
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
      
      if (fetchError || !userData) {
          console.error("Failed to fetch user points for update");
          return -1;
      }

      const newPoints = Math.max(0, userData.points + delta);

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

  // --- POSTS (Supabase Primary) ---
  
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
                  source: (typeof p.source === 'string' && p.source !== '[object Object]' && p.source.trim() !== '') 
                          ? p.source 
                          : 'External Source'
              }));
              localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(cleanData));
              return cleanData as Post[];
          }
      } catch (e) { console.warn("Offline mode for posts"); }

      return JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
  },

  savePost: async (post: Post): Promise<void> => {
      let cached = JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
      const idx = cached.findIndex((p: Post) => p.id === post.id);
      if (idx >= 0) cached[idx] = post;
      else cached.unshift(post);
      localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(cached));

      const safePost = {
          ...post,
          source: (typeof post.source === 'string' && post.source !== '[object Object]') ? post.source : 'System'
      };
      await supabase.from('posts').upsert(safePost);
  },

  deletePost: async (postId: string): Promise<void> => {
      await supabase.from('posts').delete().eq('id', postId);
  },

  // --- ANALYTICS ---
  
  getAnalytics: async () => {
      const now = Date.now();
      const oneDayAgoIso = new Date(now - 86400000).toISOString();

      const { count: totalMembers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      // 注意：這裡查詢也必須使用全小寫欄位名 (joinedat, lastactive)
      const { count: newMembersToday } = await supabase.from('users')
        .select('*', { count: 'exact', head: true })
        .gt('joinedat', oneDayAgoIso);
      const { count: activeMembersToday } = await supabase.from('users')
        .select('*', { count: 'exact', head: true })
        .gt('lastactive', oneDayAgoIso);

      const hourKey = new Date().getHours();
      const guestsToday = Math.floor(100 + (hourKey * 15) + (Math.random() * 5)); 

      return {
          totalMembers: totalMembers || 0,
          newMembersToday: newMembersToday || 0,
          activeMembersToday: activeMembersToday || 0,
          guestsToday: guestsToday
      };
  },

  // --- ROBOT LOGIC ---
  
  triggerRobotPost: async () => {
       const { data: lastPosts } = await supabase
        .from('posts')
        .select('timestamp')
        .eq('isRobot', true)
        .order('timestamp', { ascending: false })
        .limit(1);

       const now = Date.now();
       if (lastPosts && lastPosts.length > 0) {
           const lastTime = lastPosts[0].timestamp;
           if (now - lastTime < 120000) return;
       }

       const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
       const topic = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
       const contentData = generateRobotContent(region, topic);
       
       const newPost: Post = {
        id: `bot-${now}-${Math.random().toString(36).substr(2, 5)}`,
        title: contentData.titleEN,
        titleCN: contentData.titleCN,
        content: contentData.contentEN,
        contentCN: contentData.contentCN,
        region: region,
        category: topic,
        author: `${region} AI Robot`,
        authorId: 'system-bot',
        isRobot: true,
        timestamp: now,
        displayDate: new Date(now).toLocaleString(),
        likes: Math.floor(Math.random() * 20),
        hearts: Math.floor(Math.random() * 20),
        views: Math.floor(Math.random() * 100),
        source: contentData.source, 
        sourceUrl: contentData.url,
        botId: `BOT-${Math.floor(Math.random() * 99)}`,
        replies: []
    };
    
    await MockDB.savePost(newPost);
  },

  recordVisit: async (isLoggedIn: boolean) => {
      if (isLoggedIn) {
          const user = MockDB.getCurrentUser();
          if (user) {
              const now = Date.now();
              if (!user.lastActive || (now - user.lastActive > 300000)) {
                   const nowIso = new Date(now).toISOString();
                   // 更新最後活躍時間 (全小寫 lastactive)
                   await supabase.from('users').update({ lastactive: nowIso }).eq('id', user.id);
                   user.lastActive = now;
                   localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
              }
          }
      }
  }
};
