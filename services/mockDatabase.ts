
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
    'Bloomberg': 'https://www.bloomberg.com'
};

// --- DATA MAPPING LAYER (透明轉譯層) ---

/**
 * 將 App 的 User 物件轉換為資料庫格式 (PostgreSQL 標準)
 * 解決方案：統一使用 snake_case (avatar_id)，這是 Supabase/PostgreSQL 的標準實作。
 * 同時保留全小寫屬性作為後備，確保 100% 匹配。
 */
const toDbUser = (user: User) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        address: user.address,
        phone: user.phone,
        gender: user.gender,
        role: user.role,
        points: user.points || 0,
        // 修正：優先使用 snake_case，並提供全小寫作為相容性
        sol_address: user.solAddress || null,
        soladdress: user.solAddress || null,
        avatar_id: user.avatarId || 1,
        avatarid: user.avatarId || 1,
        is_banned: user.isBanned || false,
        isbanned: user.isBanned || false,
        joined_at: user.joinedAt ? new Date(user.joinedAt).toISOString() : new Date().toISOString(),
        joinedat: user.joinedAt ? new Date(user.joinedAt).toISOString() : new Date().toISOString(),
        last_active: user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString(),
        lastactive: user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString()
    };
};

/**
 * 將資料庫物件轉換回 App 的 User 型別 (camelCase)
 */
const fromDbUser = (dbUser: any): User => {
    return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        password: dbUser.password,
        address: dbUser.address,
        phone: dbUser.phone,
        // 兼容性讀取：優先嘗試蛇形命名，再嘗試全小寫，最後嘗試駝峰
        solAddress: dbUser.sol_address || dbUser.soladdress || dbUser.solAddress || '', 
        gender: dbUser.gender,
        role: dbUser.role as UserRole,
        points: dbUser.points || 0,
        avatarId: dbUser.avatar_id || dbUser.avatarid || dbUser.avatarId || 1,      
        isBanned: dbUser.is_banned || dbUser.isbanned || dbUser.isBanned || false,
        // 時間格式轉換: ISO String -> Number (Unix Timestamp)
        joinedAt: dbUser.joined_at ? new Date(dbUser.joined_at).getTime() : (dbUser.joinedat ? new Date(dbUser.joinedat).getTime() : Date.now()),
        lastActive: dbUser.last_active ? new Date(dbUser.last_active).getTime() : (dbUser.lastactive ? new Date(dbUser.lastactive).getTime() : Date.now())
    };
};

// --- 機器人內容生成邏輯 ---
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

const generateRobotContent = (region: string, topic: string) => {
    const sources = Object.keys(SOURCE_DOMAINS);
    const randSource = sources[Math.floor(Math.random() * sources.length)];
    const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;
    const ctx = REGION_CONTEXT[region] || REGION_CONTEXT['Hong Kong'];
    
    const contentData = {
        titleEN: `[${region}] Discussions on ${topic} heating up`,
        titleCN: `【${REGIONS_CN[region]}】關於${CATEGORIES_CN[topic]}的討論持續升溫`,
        contentEN: `Locals in ${rnd(ctx.cities)} are talking about ${topic}.`,
        contentCN: `在 ${rnd(ctx.cities)} 的居民正熱烈討論 ${CATEGORIES_CN[topic]}。`
    };

    return { ...contentData, source: randSource, url: mockUrl };
};

export const MockDB = {
  
  // --- 用戶管理 ---

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

    // 更新最後活躍 (使用 snake_case 優先)
    const nowIso = new Date().toISOString(); 
    const { error: updateError } = await supabase.from('users').update({ last_active: nowIso }).eq('id', user.id);
    
    // 如果 snake_case 失敗，嘗試全小寫
    if (updateError) {
        await supabase.from('users').update({ lastactive: nowIso }).eq('id', user.id);
    }

    const sessionUser = { ...user, lastActive: Date.now() };
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));

    return sessionUser;
  },

  register: async (user: User): Promise<void> => {
    console.log("Starting Registration Process for:", user.email);

    try {
        // 1. 檢查重複
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
            
        if (checkError) throw checkError;
        if (existingUser) throw new Error("Email already registered (此電郵已被註冊)");

        // 2. 轉換資料格式 (同時傳送 snake_case 與 lowercase 欄位以適應不同 DB 結構)
        const dbPayload = toDbUser(user);
        
        // 3. 寫入 Supabase (嘗試混合 Payload)
        const { error: insertError } = await supabase.from('users').insert(dbPayload);
        
        if (insertError) {
            console.warn("Initial insert failed, attempting strict snake_case fallback...", insertError.message);
            
            // 嚴格備案：只傳送標準 snake_case 欄位
            const strictSnakePayload = {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                address: user.address,
                phone: user.phone,
                gender: user.gender,
                role: user.role,
                points: user.points || 0,
                sol_address: user.solAddress || null,
                avatar_id: user.avatarId || 1,
                is_banned: user.isBanned || false,
                joined_at: new Date(user.joinedAt || Date.now()).toISOString(),
                last_active: new Date(user.lastActive || Date.now()).toISOString()
            };

            const { error: retryError } = await supabase.from('users').insert(strictSnakePayload);
            if (retryError) throw retryError;
        }

        // 4. 註冊成功，更新本地 Session
        localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
        console.log("Registration Successful.");

    } catch (err: any) {
        console.error("Supabase Registration Error Details:", err);
        throw new Error(`Registration Failed: ${err.message || 'Unknown DB Error'}`);
    }
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  saveUser: async (user: User): Promise<void> => {
      // 類似 Register，我們先嘗試混合，失敗則嘗試嚴格模式
      const dbPayload = toDbUser(user);
      const { error } = await supabase.from('users').upsert(dbPayload).eq('id', user.id);
      
      if (error) {
          console.warn("Save User failed, retrying strict snake_case...");
          const strictSnakePayload = {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                address: user.address,
                phone: user.phone,
                gender: user.gender,
                role: user.role,
                points: user.points,
                sol_address: user.solAddress,
                avatar_id: user.avatarId,
                last_active: new Date().toISOString()
          };
          const { error: retryError } = await supabase.from('users').upsert(strictSnakePayload).eq('id', user.id);
          if (retryError) {
              console.error("Save User Error", retryError);
              throw new Error("Failed to save profile changes.");
          }
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

  // --- 貼文管理 ---
  
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
                  source: (typeof p.source === 'string' && p.source !== '[object Object]') ? p.source : 'External Source'
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

  // --- 分析與機器人 ---
  
  getAnalytics: async () => {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { count: totalMembers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      // 嘗試 snake_case 查詢
      let newMembersQuery = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('joined_at', oneDayAgo);
      if (newMembersQuery.error) {
           newMembersQuery = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('joinedat', oneDayAgo);
      }

      let activeMembersQuery = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('last_active', oneDayAgo);
      if (activeMembersQuery.error) {
           activeMembersQuery = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('lastactive', oneDayAgo);
      }

      return {
          totalMembers: totalMembers || 0,
          newMembersToday: newMembersQuery.count || 0,
          activeMembersToday: activeMembersQuery.count || 0,
          guestsToday: Math.floor(100 + Math.random() * 50)
      };
  },

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
                   // 優先 snake_case
                   const { error } = await supabase.from('users').update({ last_active: nowIso }).eq('id', user.id);
                   if (error) {
                        await supabase.from('users').update({ lastactive: nowIso }).eq('id', user.id);
                   }
                   
                   user.lastActive = now;
                   localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
              }
          }
      }
  }
};
