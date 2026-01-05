
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, CATEGORIES_CN, Comment } from '../types';

// Local Cache Keys
const KEY_CURRENT_USER = 'hker_current_user_v6_sync';
const KEY_ALL_USERS = 'hker_all_users_cache_v6'; 
const KEY_LOCAL_POSTS = 'hker_posts_cache_v6';

// Global Lock for Robot Execution
let isBotProcessing = false;
let botLockTimestamp = 0;

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

// --- UUID Polyfill ---
export const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try { return crypto.randomUUID(); } catch (e) { }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- SAFE STORAGE WRAPPER WITH AUTO-TRIM ---
const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('LocalStorage Quota Full! Trimming cache...');
            if (key === KEY_LOCAL_POSTS) {
                try {
                    const data = JSON.parse(value);
                    if (Array.isArray(data) && data.length > 20) {
                        const trimmed = JSON.stringify(data.slice(0, 20));
                        localStorage.setItem(key, trimmed);
                        return;
                    }
                } catch(err) {}
            }
            try {
                localStorage.removeItem(KEY_ALL_USERS);
                localStorage.setItem(key, value);
            } catch(retryErr) {
                console.error('Critical Storage Error:', retryErr);
            }
        }
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

// --- MASSIVE BILINGUAL CONTENT ENGINE (5x EXPANSION) ---
// Structure: title (EN), titleCN (CN), content (EN - Key Points), contentCN (CN - Key Points)
const NEWS_TEMPLATES: Record<string, Record<string, { title: string, titleCN: string, content: string, contentCN: string }[]>> = {
    'Hong Kong': {
        'Real Estate': [
            { 
                title: "Kai Tak Property: New Launches Face Cooling Market",
                titleCN: "啟德新盤：市場冷卻下仍有推售",
                content: "• Developers cutting prices by 10-15% to clear inventory.\n• High interest rates dampening mortgage demand.\n• Rental yields rising as sale prices drop.",
                contentCN: "• 發展商減價 10-15% 以清理庫存。\n• 高息環境抑制按揭需求。\n• 樓價下跌帶動租金回報率上升。"
            },
            { 
                title: "Northern Metropolis: Land Resumption Accelerates",
                titleCN: "北部都會區：收地進度加速",
                content: "• Govt invokes ordinance to resume 100 hectares.\n• Tech hub planning creates construction jobs.\n• Controversy over wetland conservation remains.",
                contentCN: "• 政府引用條例收回 100 公頃土地。\n• 創科中心規劃創造大量建築職位。\n• 濕地保育爭議仍然存在。"
            },
            {
                title: "HK Rent Index Hits 4-Year High",
                titleCN: "香港租金指數創 4 年新高",
                content: "• Driven by influx of mainland talents and students.\n• Small units see highest % increase.\n• Landlords shifting from selling to renting.",
                contentCN: "• 受惠於內地專才及學生流入。\n• 小型單位升幅最高。\n• 業主轉賣為租趨勢明顯。"
            }
        ],
        'Finance': [
            {
                title: "HSI Volatility: Tech Stocks Under Pressure",
                titleCN: "恒指波動：科技股受壓",
                content: "• Regulatory concerns impact major platform stocks.\n• Southbound trading volume remains robust.\n• Analysts predict range-bound trading for Q3.",
                contentCN: "• 監管憂慮影響主要平台股。\n• 北水南下交易量保持強勁。\n• 分析師預測第三季將維持區間上落。"
            },
            {
                title: "Green Finance: HK Issues $5B Green Bonds",
                titleCN: "綠色金融：香港發行 50 億綠色債券",
                content: "• Heavily oversubscribed by global investors.\n• Funds directed to sustainable infrastructure.\n• Reinforces HK status as Asian green hub.",
                contentCN: "• 全球投資者超額認購。\n• 資金將用於可持續基建。\n• 鞏固香港作為亞洲綠色金融中心地位。"
            },
            {
                title: "Virtual Asset Platforms: New Licensing Rules",
                titleCN: "虛擬資產平台：新發牌制度生效",
                content: "• SFC emphasizes investor protection measures.\n• Several small exchanges cease operations.\n• Traditional banks exploring crypto custody.",
                contentCN: "• 證監會強調投資者保障措施。\n• 數間小型交易所停止運作。\n• 傳統銀行探索加密貨幣託管業務。"
            }
        ],
        'Current Affairs': [
            {
                title: "Waste Charging Scheme: Implementation Delayed",
                titleCN: "垃圾徵費：實施再度押後",
                content: "• Public confusion over designated bags.\n• Pilot scheme reveals logistical hurdles.\n• Govt to focus on education first.",
                contentCN: "• 市民對指定垃圾袋感到困惑。\n• 先行計劃揭示物流障礙。\n• 政府將先專注於教育宣傳。"
            },
            {
                title: "Northbound Travel Trend: Dining Sector Impact",
                titleCN: "北上消費潮：餐飲業受衝擊",
                content: "• Weekend exits exceed 300k, impacting local revenue.\n• Local restaurants launching discount campaigns.\n• Cross-border bus services increase frequency.",
                contentCN: "• 週末離境人數超 30 萬，影響本地收入。\n• 本地餐廳推出折扣優惠吸客。\n• 跨境巴士班次加密。"
            },
            {
                title: "Article 23: Impact on Business Confidence",
                titleCN: "23條立法：對營商信心的影響",
                content: "• Chamber of Commerce supports clarity.\n• Foreign firms monitoring data laws.\n• Govt assures normal operations unaffected.",
                contentCN: "• 商會表示支持條例清晰化。\n• 外資企業關注數據法規。\n• 政府保證正常運作不受影響。"
            }
        ]
    },
    'UK': {
        'Community': [
            {
                title: "HKers in UK: New Community Center in Manchester",
                titleCN: "居英港人：曼徹斯特新社區中心落成",
                content: "• Hub for cultural exchange and support.\n• Offers Cantonese classes for children.\n• Supported by local council grants.",
                contentCN: "• 文化交流與支援樞紐。\n• 為兒童提供廣東話課程。\n• 獲當地議會撥款支持。"
            },
            {
                title: "BNO Visa Update: 5-Year Route Statistics",
                titleCN: "BNO 簽證更新：5年路徑統計",
                content: "• Over 180k approvals since launch.\n• High employment rate among arrivals.\n• Housing remains top challenge for newcomers.",
                contentCN: "• 計劃啟動以來批出超過 18 萬宗。\n• 抵英人士就業率高。\n• 住房仍是新移民最大挑戰。"
            },
            {
                title: "Sutton Hong Kong Festival Draws Thousands",
                titleCN: "薩頓香港節吸引數千人參與",
                content: "• Street food stalls sold out in hours.\n• Traditional music performances praised.\n• Fosters integration with locals.",
                contentCN: "• 街頭小食攤位數小時內售罄。\n• 傳統音樂表演獲好評。\n• 促進與當地人融合。"
            }
        ],
        'Finance': [
            {
                title: "UK Inflation: Cost of Living Crisis Eases Slightly",
                titleCN: "英國通脹：生活成本危機稍緩",
                content: "• CPI drops to 3.4%, lowest in 2 years.\n• Food prices stabilize but energy remains high.\n• Bank of England holds interest rates.",
                contentCN: "• CPI 跌至 3.4%，兩年新低。\n• 食品價格穩定但能源仍高企。\n• 英倫銀行維持利率不變。"
            },
            {
                title: "London Property: Rental Market Overheating",
                titleCN: "倫敦樓市：租務市場過熱",
                content: "• Average rent exceeds £2,500/month.\n• 20 applicants competing for single flat.\n• Landlords exiting market due to tax changes.",
                contentCN: "• 平均月租超過 2,500 英鎊。\n• 平均 20 人爭奪一個租盤。\n• 稅制改變導致業主退市。"
            }
        ],
        'Current Affairs': [
            {
                title: "NHS Crisis: Junior Doctors Strike Continues",
                titleCN: "NHS 危機：初級醫生持續罷工",
                content: "• Waiting lists hit record high.\n• Pay dispute negotiations stalled.\n• Public support mixed as delays grow.",
                contentCN: "• 輪候名單創歷史新高。\n• 薪酬談判陷入僵局。\n• 隨著延誤增加，公眾支持度參半。"
            },
            {
                title: "UK General Election: Polls Predict Shift",
                titleCN: "英國大選：民調預測變天",
                content: "• Labour holds significant lead.\n• Key issues: Economy, NHS, Immigration.\n• Conservatives launching tax cut promises.",
                contentCN: "• 工黨保持顯著領先優勢。\n• 關鍵議題：經濟、NHS、移民。\n• 保守黨推出減稅承諾。"
            }
        ]
    },
    'USA': {
        'Finance': [
            { title: "Fed Rates: Higher for Longer?", titleCN: "聯儲局利率：維持高息更久？", content: "• Powell signals patience on cuts.\n• Job market remains surprisingly strong.\n• Tech stocks react with volatility.", contentCN: "• 鮑威爾暗示減息需耐性。\n• 就業市場意外強勁。\n• 科技股反應波動。" }
        ]
    },
    'Canada': {
        'Real Estate': [
            { title: "Vancouver Housing: Foreign Buyer Ban Extended", titleCN: "溫哥華樓市：外國買家禁令延長", content: "• Ban extended for 2 more years.\n• Aim to improve affordability for locals.\n• Exemptions for work permit holders.", contentCN: "• 禁令延長兩年。\n• 旨在提高當地人負擔能力。\n• 工簽持有者獲豁免。" }
        ]
    },
    'Taiwan': {
        'Travel': [
            { title: "Taiwan Tourism: HK Visitors Top the List", titleCN: "台灣旅遊：香港遊客居首", content: "• 1 million HK visitors in 2023.\n• Night markets and cultural creative parks popular.\n• Flight capacity fully restored.", contentCN: "• 2023 年香港遊客達 100 萬。\n• 夜市及文創園區受歡迎。\n• 航班運力全面恢復。" }
        ]
    }
};

const rnd = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

// Updated to return bilingual content
const generateRealisticContent = (region: string) => {
    // Default to HK if region not found, or pick random backup
    const regionData = NEWS_TEMPLATES[region] || NEWS_TEMPLATES['Hong Kong'];
    const categories = Object.keys(regionData);
    const category = rnd(categories);
    const template = rnd(regionData[category]);

    const dynamicSuffix = ` [AI Report #${1000 + Math.floor(Math.random()*9000)}]`;
    const sources = Object.keys(SOURCE_DOMAINS);
    const randSource = rnd(sources);
    const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;

    return {
        title: template.title,
        titleCN: template.titleCN,
        content: template.content + dynamicSuffix, 
        contentCN: template.contentCN + dynamicSuffix,
        category,
        source: randSource,
        url: mockUrl
    };
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
        return [];
    } catch (e) { 
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
      let remoteData: Post[] = [];
      try {
          const { data, error } = await supabase.from('posts').select('*').order('timestamp', { ascending: false }).limit(100);
          if (!error && data) {
              remoteData = data.map((p: any) => ({
                  ...p,
                  source: (typeof p.source === 'string' && p.source !== '[object Object]') ? p.source : 'System'
              }));
              safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(remoteData));
          }
      } catch (e) { console.warn("Mobile Fetch Error (Using Cache)", e); }
      
      const localData = JSON.parse(localStorage.getItem(KEY_LOCAL_POSTS) || '[]');
      const finalData = remoteData.length > 0 ? remoteData : localData;

      if (finalData.length === 0) {
          const now = Date.now();
          const seed: Post = {
              id: 'welcome-post',
              title: 'Welcome to HKER Platform (Official)',
              titleCN: '歡迎來到 HKER 平台 (官方)',
              content: 'System initialized. Waiting for global news synchronization...',
              contentCN: '系統已初始化。正在等待全球新聞同步...',
              region: 'Hong Kong',
              category: 'System',
              author: 'Admin',
              authorId: 'admin',
              isRobot: false,
              timestamp: now,
              displayDate: new Date(now).toLocaleString(),
              likes: 888,
              hearts: 888,
              views: 9999,
              source: 'System',
              replies: []
          };
          return [seed];
      }
      return finalData;
  },

  savePost: async (post: Post): Promise<void> => {
      const safePost = {
          ...post,
          source: (typeof post.source === 'string' && post.source !== '[object Object]') ? post.source : 'System'
      };
      
      try {
          const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
          let current = localStr ? JSON.parse(localStr) : [];
          current = current.filter((p: any) => p.id !== post.id);
          current.unshift(safePost);
          safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current.slice(0, 100)));
      } catch (e) { }

      supabase.from('posts').upsert(safePost).then(({ error }) => {
          if (error) console.warn("Cloud Sync Warning:", error.message);
      });
  },
  
  deletePost: async (postId: string): Promise<void> => { 
      await supabase.from('posts').delete().eq('id', postId); 
      const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
      if (localStr) {
          const current = JSON.parse(localStr).filter((p: any) => p.id !== postId);
          safeSetItem(KEY_LOCAL_POSTS, JSON.stringify(current));
      }
  },
  
  getAnalytics: async () => {
      try {
          const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
          return { totalMembers: count || 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: Math.floor(100 + Math.random() * 50) };
      } catch (e) { return { totalMembers: 0, newMembersToday: 0, activeMembersToday: 0, guestsToday: 0 }; }
  },

  // --- TRIGGER ROBOT LOGIC (HYPER ACTIVE MODE) ---
  triggerRobotPost: async (force = false) => {
       const now = Date.now();

       // 1. DEADLOCK BREAKER (Melting Point: 60 seconds)
       if (isBotProcessing && (now - botLockTimestamp > 60000)) {
           console.warn("⚠️ Bot Lock Stale. Resetting Lock.");
           isBotProcessing = false;
       }

       if (isBotProcessing) return;
       
       isBotProcessing = true;
       botLockTimestamp = now;

       try {
           let lastTime = 0;

           const localStr = localStorage.getItem(KEY_LOCAL_POSTS);
           if (localStr) {
               const local = JSON.parse(localStr);
               const lastBot = local.find((p: any) => p.isRobot);
               if (lastBot) lastTime = lastBot.timestamp;
           }

           if (lastTime === 0) {
                const { data: dbPosts } = await supabase
                    .from('posts')
                    .select('timestamp')
                    .eq('isRobot', true)
                    .order('timestamp', { ascending: false })
                    .limit(1);
                if (dbPosts && dbPosts.length > 0) {
                    lastTime = dbPosts[0].timestamp;
                }
           }
           
           // COOLDOWN: 3 Minutes (180,000 ms) for Active Worker
           const COOLDOWN = 180000;
           if (!force && lastTime > 0 && lastTime < now && (now - lastTime < COOLDOWN)) {
               return;
           }

           // 4. GENERATE CONTENT (Heavily weighted towards HK and UK)
           const roll = Math.random();
           let region = '';
           if (roll < 0.5) region = 'Hong Kong'; // 50% HK
           else if (roll < 0.8) region = 'UK';   // 30% UK
           else region = REGIONS[Math.floor(Math.random() * REGIONS.length)]; // 20% Others

           const newsData = generateRealisticContent(region);
           
           const newPost: Post = {
                id: `bot-${now}-${generateUUID().split('-')[0]}`,
                title: newsData.title,
                titleCN: newsData.titleCN || newsData.title, // Fallback if missing
                content: newsData.content,
                contentCN: newsData.contentCN || newsData.content, // Fallback if missing
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
            
            console.log("🤖 Active Bot Posting:", newPost.title);
            await MockDB.savePost(newPost);
            
       } catch (err) {
           console.error("Bot Error:", err);
       } finally {
           isBotProcessing = false;
           botLockTimestamp = 0;
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
