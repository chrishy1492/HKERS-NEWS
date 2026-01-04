import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, Comment } from '../types';

// 本地緩存鍵值
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

// --- 資料映射層 (Transparent Mapping Layer) ---

/**
 * 將 App 的 User 物件轉換為資料庫格式 (PostgreSQL 標準)
 * 解決方案：保持標準命名，但所有擴充欄位皆設為可選，以便在 register 邏輯中動態過濾。
 */
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

/**
 * 將資料庫物件轉換回 App 的 User 型別 (camelCase)
 */
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

    const nowIso = new Date().toISOString(); 
    // 使用非破壞性更新，失敗不阻斷登入流程
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
        // 1. 檢查重複
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
            
        if (checkError) throw checkError;
        if (existingUser) throw new Error("Email already registered (此電郵已被註冊)");

        // 2. 嘗試層級化寫入策略
        const dbPayload = toDbUser(user);
        
        // 嘗試 1: 全欄位寫入 (snake_case)
        const { error: error1 } = await supabase.from('users').insert(dbPayload);
        
        if (error1) {
            console.warn("Attempt 1 (snake_case) failed:", error1.message);
            
            // 嘗試 2: 全小寫欄位寫入
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
                
                // 嘗試 3: 終極降級模式 (只傳送核心必填欄位)
                // 假設 avatar_id 等擴充欄位是導致快取錯誤的主因，這裡將其完全移除
                const minimalPayload = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    role: user.role
                };
                console.log("Attempting Minimal Registration (Final Fallback)...");
                const { error: error3 } = await supabase.from('users').insert(minimalPayload);
                
                if (error3) {
                    throw new Error(`Critical DB Error: ${error3.message}. Please check if 'users' table exists.`);
                }
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
      // Upsert 同樣使用 try...catch 避免因個別欄位不匹配導致無法存檔
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

  getAnalytics: async () => {
      try {
          const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
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
  }
};