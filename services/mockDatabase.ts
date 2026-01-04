
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

// --- DATA MAPPING LAYER ---

/**
 * 將 App User 轉換為 DB 格式
 * 策略：預設使用 lowercase (Postgres 默認)，但在寫入失敗時會動態切換到 snake_case
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
        points: user.points || 0, // 確保有預設值，防止 NOT NULL 錯誤
        
        // 嘗試使用 lowercase (如果失敗，register 函數會處理重試)
        soladdress: user.solAddress || null, 
        avatarid: user.avatarId || 1,             
        isbanned: user.isBanned || false,    
        // 時間標準化：App (Timestamp Number) -> DB (ISO String)
        joinedat: user.joinedAt ? new Date(user.joinedAt).toISOString() : new Date().toISOString(),     
        lastactive: user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString()
    };
};

/**
 * 將 DB 格式 轉換為 App User
 * 策略：同時檢查 snake_case 和 lowercase，並將 ISO 時間轉回 Timestamp
 */
const fromDbUser = (dbUser: any): User => {
    return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        password: dbUser.password,
        address: dbUser.address,
        phone: dbUser.phone,
        // 兼容性讀取
        solAddress: dbUser.soladdress || dbUser.sol_address || dbUser.solAddress || '', 
        gender: dbUser.gender,
        role: dbUser.role as UserRole,
        points: dbUser.points || 0,
        avatarId: dbUser.avatarid || dbUser.avatar_id || dbUser.avatarId || 1,      
        isBanned: dbUser.isbanned || dbUser.is_banned || dbUser.isBanned || false,
        // 時間標準化：DB (ISO String) -> App (Timestamp Number)
        joinedAt: dbUser.joinedat ? new Date(dbUser.joinedat).getTime() : (dbUser.joined_at ? new Date(dbUser.joined_at).getTime() : Date.now()),
        lastActive: dbUser.lastactive ? new Date(dbUser.lastactive).getTime() : (dbUser.last_active ? new Date(dbUser.last_active).getTime() : Date.now())
    };
};

// --- CONTENT GENERATION HELPERS ---
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
    
    // Simplified Generator Logic for Bot
    const titles = [
        `[${region}] New discussions on ${topic} emerging`,
        `[${region}] Locals in ${rnd(ctx.cities)} talk about ${topic}`,
        `[${region}] ${topic}: What you need to know today`,
    ];
    const contents = [
        `Latest reports from ${rnd(ctx.cities)} suggest significant interest in ${topic}.`,
        `Community members are discussing the impact of recent ${topic} changes in ${region}.`,
    ];

    return { 
        titleEN: rnd(titles),
        titleCN: `【${REGIONS_CN[region]}】關於${CATEGORIES_CN[topic]}的最新討論`,
        contentEN: rnd(contents) + `\n\n(Source: ${randSource})`,
        contentCN: `來自 ${rnd(ctx.cities)} 的消息指出大家正在關注 ${CATEGORIES_CN[topic]}。\n\n(來源: ${randSource})`,
        source: randSource, 
        url: mockUrl 
    };
};

export const MockDB = {
  
  // --- USER MANAGEMENT ---

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
    try { return JSON.parse(local); } catch { return null; }
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

    // Update Last Active - Try snake_case first as it's standard
    const nowIso = new Date().toISOString(); 
    const { error: updateError } = await supabase.from('users').update({ last_active: nowIso }).eq('id', user.id);
    // Fallback if snake_case fails
    if (updateError) {
         await supabase.from('users').update({ lastactive: nowIso }).eq('id', user.id);
    }

    const sessionUser = { ...user, lastActive: Date.now() };
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(sessionUser));

    return sessionUser;
  },

  // ** CRITICAL FIX: REGISTRATION RETRY LOGIC **
  register: async (user: User): Promise<void> => {
    console.log("Starting Registration Process for:", user.email);

    try {
        // 1. Check duplicate
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
            
        if (checkError) throw checkError;
        if (existingUser) throw new Error("Email already registered (此電郵已被註冊)");

        // 2. Convert to DB Payload (Defaults to lowercase mapping)
        const dbPayload = toDbUser(user);
        console.log("Payload to DB (Attempt 1):", dbPayload);
        
        // 3. Insert to Supabase
        const { error: insertError } = await supabase.from('users').insert(dbPayload);
        
        if (insertError) {
            // DIAGNOSIS: Check if error is due to missing column (e.g., 'avatarid' vs 'avatar_id')
            // Postgres error 42703 is undefined_column
            if (insertError.message.includes("does not exist") || insertError.code === '42703') {
                console.warn("Schema Mismatch Detected. Retrying with snake_case mapping...");
                
                // Construct Snake Case Payload
                const snakePayload = {
                    ...dbPayload,
                    avatar_id: user.avatarId,
                    sol_address: user.solAddress,
                    is_banned: user.isBanned || false,
                    joined_at: dbPayload.joinedat,
                    last_active: dbPayload.lastactive
                };
                
                // Remove lowercase keys to avoid confusion
                delete (snakePayload as any).avatarid;
                delete (snakePayload as any).soladdress;
                delete (snakePayload as any).isbanned;
                delete (snakePayload as any).joinedat;
                delete (snakePayload as any).lastactive;

                console.log("Payload to DB (Attempt 2 - SnakeCase):", snakePayload);
                const { error: retryError } = await supabase.from('users').insert(snakePayload);
                
                if (retryError) {
                    // If strict retry fails, try raw insert with original user object but flattened? 
                    // No, usually snake_case is the fix. Throw if this fails.
                    throw retryError;
                }
            } else {
                // Other error (e.g. constraints)
                throw insertError;
            }
        }

        // 4. Success handling
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
      // For saving, we use the same retry logic via 'upsert' logic simulation or just strict snake_case if we learned.
      // We will try standard snake_case first here as it is safer for updates.
      const nowIso = user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString();
      
      const payload = {
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
          last_active: nowIso
      };

      const { error } = await supabase.from('users').upsert(payload).eq('id', user.id);
      
      if (error) {
          console.error("Save User Error (SnakeCase)", error);
          // Fallback to lowercase keys if snake failed
          const fallbackPayload = toDbUser(user);
          const { error: fbError } = await supabase.from('users').upsert(fallbackPayload).eq('id', user.id);
          if (fbError) throw new Error("Failed to save profile changes.");
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

  // --- POST MANAGEMENT ---
  
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

  // --- ANALYTICS & BOT ---
  
  getAnalytics: async () => {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { count: totalMembers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      // Try querying with snake_case fields first
      let { count: newMembersToday, error: err1 } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('joined_at', oneDayAgo);
      if (err1) {
          // Fallback to lowercase
          const { count: retryNew } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('joinedat', oneDayAgo);
          newMembersToday = retryNew;
      }

      let { count: activeMembersToday, error: err2 } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('last_active', oneDayAgo);
      if (err2) {
           const { count: retryActive } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('lastactive', oneDayAgo);
           activeMembersToday = retryActive;
      }

      return {
          totalMembers: totalMembers || 0,
          newMembersToday: newMembersToday || 0,
          activeMembersToday: activeMembersToday || 0,
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
                   // Try snake_case
                   const { error } = await supabase.from('users').update({ last_active: nowIso }).eq('id', user.id);
                   // Fallback
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
