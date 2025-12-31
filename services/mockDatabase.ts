
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, Comment } from '../types';

const KEY_CURRENT_USER = 'hker_current_user_v3';
const KEY_LOCAL_POSTS = 'hker_local_posts_fallback';
const KEY_LOCAL_USERS = 'hker_local_users_fallback';
const KEY_VISIT_STATS = 'hker_visit_stats_v1'; // Local cache for stats

// Sensitive words filter (Strict compliance)
const FORBIDDEN_KEYWORDS = [
  'China', 'Xi Jinping', 'Tiananmen', 'June 4', 'Independence',
  '中國', '習近平', '六四', 'Article 23', 'National Security', '國安法'
];

// External News Sources
const SOURCE_DOMAINS: Record<string, string> = {
    'BBC': 'https://www.bbc.com/news',
    'CNN': 'https://edition.cnn.com',
    'Reuters': 'https://www.reuters.com',
    'ABC News': 'https://abcnews.go.com',
    'The Guardian': 'https://www.theguardian.com',
    'HK Free Press': 'https://hongkongfp.com',
    'Bloomberg': 'https://www.bloomberg.com',
    'SCMP': 'https://www.scmp.com',
    'Financial Times': 'https://www.ft.com'
};

// =========================================================
// AI CONTENT GENERATION ENGINE
// =========================================================
const formatAsAISummary = (content: string, source: string, region: string) => {
    return `【AI 重點摘要】
本報導由 AI 智能機械人根據《${source}》之內容進行整理，主要涉及 ${region} 地區發展。

📌 重點歸納：
${content}

⚠️ 免責聲明：
1. 本內容僅摘錄少量重點供參考，並非完整原文，避免逐字抄襲。
2. 為尊重版權，請點擊下方「閱讀原文」按鈕瀏覽完整報導。
3. 資料由 AI 自動抓取並翻譯，僅供參考。`;
};

// Helper function to expand content 2-3x (Requirement 85, 87)
const expandContent = (baseContent: string, region: string, topic: string): string => {
  const additionalPoints = [
    `根據 ${region} 地區的最新數據分析，${topic} 領域呈現出明顯的發展趨勢。`,
    `專家指出，這一變化將對當地經濟產生深遠影響，值得持續關注。`,
    `市場觀察家認為，未來幾個月內可能會出現更多相關動態。`,
    `業內人士建議，投資者和相關從業者應密切關注後續發展。`,
    `這一趨勢反映了全球市場的整體變化，同時也體現了 ${region} 地區的獨特優勢。`
  ];
  
  // Add 2-3 additional points randomly
  const numAdditional = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const selected = additionalPoints.slice(0, numAdditional);
  
  return `${baseContent}\n\n【補充分析】\n${selected.join('\n')}\n\n⚠️ 免責聲明：本內容由 AI 系統自動編寫，僅供參考。請點擊下方連結支持原作。`;
};

const generateMockNews = (region: string, topic?: string): Partial<Post> => {
  const sources = Object.keys(SOURCE_DOMAINS);
  const randSource = sources[Math.floor(Math.random() * sources.length)];
  const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;
  const safeTopic = topic || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const baseContent: Record<string, {en: string, zh: string}> = {
    'Real Estate': {
      en: `Housing market in ${region} shows signs of recovery. Interest rates stabilization helps buyers.`,
      zh: `隨著利率趨於穩定，${region}的房地產市場顯示出復甦跡象。分析師指出，首置買家開始重返市場，主要城市的成交量按月上升了 5%。這對於正在觀望的投資者來說是一個積極的信號。`
    },
    'Current Affairs': {
      en: `Local community updates in ${region}. Citizens discuss infrastructure improvements.`,
      zh: `本次${region}的社區討論進展順利。主要議題集中在基礎設施改善及醫療服務優化。當局表示將投入更多資源提升公共服務品質，顯示出對民生事務的重視。`
    },
    'Finance': {
      en: `Stock markets in ${region} rally as tech sector gains momentum. Inflation data lower than expected.`,
      zh: `受科技板塊強勁表現帶動，${region}股市今日大幅上漲。最新的通脹數據低於預期，減輕了中央銀行加息的壓力。主要指數創下本季度新高，投資者情緒樂觀。`
    },
    'Entertainment': {
      en: `Cultural events in ${region} attracting tourists. New film festival announced.`,
      zh: `${region}市中心正在舉辦大型文化藝術節，吸引了數千名遊客。主辦方宣佈將在下月舉辦國際電影節，預計將為當地帶來數百萬美元的旅遊收益。`
    },
    'Travel': {
      en: `New eco-tourism spots opened in ${region}. Government promotes sustainable travel.`,
      zh: `為了推動可持續發展，${region}政府宣佈開放三個新的生態旅遊景點。這些景點將嚴格限制遊客人數，以保護當地脆弱的生態系統。旅遊局建議遊客提前網上預約。`
    },
    'Digital': {
      en: `5G network expansion in ${region} reaches rural areas. Internet speeds increase significantly.`,
      zh: `${region}的 5G 網絡建設取得重大突破，覆蓋範圍已延伸至偏遠鄉村地區。測試顯示，當地網速平均提升了 200%，這將極大促進當地的數碼經濟發展和遠程教育普及。`
    },
    'Offers': {
      en: `Major retail chains in ${region} announce massive seasonal sales.`,
      zh: `${region}多家大型零售連鎖店宣佈將於下周開始季節性大減價。部分商品折扣高達 70%。消費者權益組織提醒市民理性消費，並注意比較價格。`
    },
    'Campus': {
      en: `Top university in ${region} launches new AI research scholarship.`,
      zh: `${region}的頂尖大學今日宣佈設立新的 AI 研究獎學金，專門面向國際學生。該計劃旨在吸引全球頂尖人才，推動人工智能領域的創新研究。`
    },
    'Weather': {
      en: `Weather forecast for ${region} predicts varied conditions.`,
      zh: `${region}氣象局發佈天氣預報，預計未來三天將出現不穩定天氣。當局建議市民出門帶備雨具，並注意氣溫變化。`
    }
  };

  const contentObj = baseContent[safeTopic] || baseContent['Current Affairs'];
  const title = `【${region} / ${safeTopic}】AI 快訊：${contentObj.zh.substring(0, 15)}...`;
  const finalContent = formatAsAISummary(contentObj.zh, randSource, region);

  return {
    title: title,
    titleCN: title, 
    content: finalContent,
    contentCN: finalContent,
    region: region,
    category: safeTopic,
    source: randSource,
    sourceUrl: mockUrl,
    botId: `${region}_BOT_0${Math.floor(Math.random() * 9) + 1}`,
  };
};

// =========================================================
// LOCAL FALLBACK HELPERS
// =========================================================
const getLocalPosts = (): Post[] => {
    const raw = localStorage.getItem(KEY_LOCAL_POSTS);
    if (raw) return JSON.parse(raw);
    return [];
};

const getLocalUsers = (): User[] => {
    const raw = localStorage.getItem(KEY_LOCAL_USERS);
    return raw ? JSON.parse(raw) : [];
};

const saveLocalPost = (post: Post) => {
    const posts = getLocalPosts();
    const index = posts.findIndex(p => p.id === post.id);
    if (index >= 0) posts[index] = post;
    else posts.unshift(post);
    localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(posts));
};

const saveLocalUser = (user: User) => {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(users));
};

export const MockDB = {
  // --- USERS ---

  getUsers: async (): Promise<User[]> => {
    // FORCE CLOUD SYNC: Attempt to fetch from Supabase first
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data) {
        // Sync cloud data to local to keep fallback updated
        localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(data));
        return data as User[];
    }
    // Fallback only if cloud fails
    return getLocalUsers();
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEY_CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  login: async (email: string): Promise<User | null> => {
    const { data: user, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    let targetUser = user as User;
    
    if (error || !targetUser) {
        // Fallback Local
        const localUsers = getLocalUsers();
        const localUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (localUser) targetUser = localUser;
        else return null;
    }

    if (targetUser.isBanned) throw new Error("This account has been banned.");
    
    // Update Last Active for Analytics
    targetUser.lastActive = Date.now();
    await MockDB.saveUser(targetUser); // Sync active time back to DB
    
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(targetUser));
    return targetUser;
  },

  register: async (user: User): Promise<void> => {
    // Force Admin Role for specific emails
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        user.role = UserRole.ADMIN;
    }

    // Ensure JoinedAt is set
    user.joinedAt = Date.now();
    user.lastActive = Date.now();

    const { error } = await supabase.from('users').insert(user);
    
    // Optimistic Update: Save local immediately so user feels it's instant
    saveLocalUser(user);
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));

    if (error) {
        console.warn("Cloud register failed, using local fallback", error);
    }
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  saveUser: async (user: User): Promise<void> => {
    // Force Admin Role check
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        user.role = UserRole.ADMIN;
    }

    // Dual write for consistency
    saveLocalUser(user);
    const { error } = await supabase.from('users').upsert(user);
    
    const current = MockDB.getCurrentUser();
    if (current && current.id === user.id) {
        localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
    }
  },

  deleteUser: async (id: string): Promise<void> => {
      await supabase.from('users').delete().eq('id', id);
      const users = getLocalUsers().filter(u => u.id !== id);
      localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(users));
  },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
    // Atomic update simulation logic remains, but enhanced with cloud priority
    let currentPoints = 0;
    
    // 1. Try Cloud Fetch
    const { data: user, error } = await supabase.from('users').select('points').eq('id', userId).single();
    
    if (!error && user) {
        currentPoints = user.points;
    } else {
        // Fallback
        const localUser = getLocalUsers().find(u => u.id === userId);
        if (localUser) currentPoints = localUser.points;
    }

    const newPoints = Math.max(0, currentPoints + delta);
    
    // 2. Write Back
    await supabase.from('users').update({ points: newPoints }).eq('id', userId);
    
    // 3. Update Local Cache
    const localUsers = getLocalUsers();
    const idx = localUsers.findIndex(u => u.id === userId);
    if (idx >= 0) {
        localUsers[idx].points = newPoints;
        localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(localUsers));
    }
    
    // 4. Update Current User Session if match
    const current = MockDB.getCurrentUser();
    if (current && current.id === userId) {
        current.points = newPoints;
        localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(current));
    }

    return newPoints;
  },

  resetAllPoints: async (value: number): Promise<void> => {
    await supabase.from('users').update({ points: value }).neq('id', '0');
    const localUsers = getLocalUsers();
    localUsers.forEach(u => u.points = value);
    localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(localUsers));
  },

  // --- POSTS (Real-time Sync Optimized) ---

  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase.from('posts').select('*').order('timestamp', { ascending: false }).limit(100); 
    if (error) return getLocalPosts();
    // Sync to local for offline viewing
    localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(data));
    return (data as Post[]) || [];
  },

  savePost: async (post: Post): Promise<void> => {
    saveLocalPost(post); // Optimistic UI
    await supabase.from('posts').upsert(post); // Cloud Sync
  },

  deletePost: async (postId: string): Promise<void> => {
    await supabase.from('posts').delete().eq('id', postId);
    const posts = getLocalPosts().filter(p => p.id !== postId);
    localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(posts));
  },

  addComment: async (postId: string, user: User, content: string): Promise<void> => {
    const newComment: Comment = {
        id: `c-${Date.now()}-${Math.random()}`,
        postId,
        author: user.name,
        authorId: user.id,
        content,
        timestamp: Date.now()
    };
    // Fetch fresh post to ensure we append to latest replies
    const { data: post } = await supabase.from('posts').select('replies').eq('id', postId).single();
    let currentReplies = post?.replies || [];
    if (!Array.isArray(currentReplies)) currentReplies = [];
    
    const updatedReplies = [...currentReplies, newComment];
    
    await supabase.from('posts').update({ replies: updatedReplies }).eq('id', postId);
    
    // Local update for speed
    const localPosts = getLocalPosts();
    const lp = localPosts.find(p => p.id === postId);
    if(lp) {
        if(!lp.replies) lp.replies = [];
        lp.replies.push(newComment);
        saveLocalPost(lp);
    }
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    const { data: post } = await supabase.from('posts').select('replies').eq('id', postId).single();
    if(post && Array.isArray(post.replies)) {
        const updatedReplies = post.replies.filter((c: Comment) => c.id !== commentId);
        await supabase.from('posts').update({ replies: updatedReplies }).eq('id', postId);
    }
  },

  // --- ANALYTICS & VISIT TRACKING ---

  recordVisit: async (isMember: boolean): Promise<void> => {
      // Simulate recording a visit to the cloud
      // In a real Supabase setup, this would insert into an 'analytics' table.
      // Since we are mocking the analytics structure but using real Users/Posts:
      
      const todayKey = new Date().toISOString().split('T')[0];
      const statsStr = localStorage.getItem(KEY_VISIT_STATS);
      let stats = statsStr ? JSON.parse(statsStr) : {};

      if (!stats[todayKey]) stats[todayKey] = { members: 0, guests: 0 };
      
      // Simple debounce to prevent counting every page refresh as a new visit in one session
      const sessionKey = `hker_session_${todayKey}`;
      if (!sessionStorage.getItem(sessionKey)) {
          if (isMember) stats[todayKey].members++;
          else stats[todayKey].guests++;
          sessionStorage.setItem(sessionKey, '1');
          
          // Persist
          localStorage.setItem(KEY_VISIT_STATS, JSON.stringify(stats));
      }
  },

  getAnalytics: async () => {
      // 1. Fetch all users for accurate Member counts
      const allUsers = await MockDB.getUsers();
      
      // 2. Calculate Stats
      const totalMembers = allUsers.length;
      
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      const newMembersToday = allUsers.filter(u => u.joinedAt && (now - u.joinedAt < oneDay)).length;
      const activeMembersToday = allUsers.filter(u => u.lastActive && (now - u.lastActive < oneDay)).length;
      
      // 3. Get Guest Stats (from local cache as proxy for system stats)
      const todayKey = new Date().toISOString().split('T')[0];
      const statsStr = localStorage.getItem(KEY_VISIT_STATS);
      const stats = statsStr ? JSON.parse(statsStr) : {};
      const guestsToday = stats[todayKey]?.guests || 0;
      
      return {
          totalMembers,
          newMembersToday,
          activeMembersToday,
          guestsToday,
          totalVisitsToday: activeMembersToday + guestsToday
      };
  },

  // --- ROBOT LOGS ---

  getRobotLogs: async (): Promise<RobotLog[]> => {
    const { data, error } = await supabase.from('robot_logs').select('*').order('timestamp', { ascending: false }).limit(50);
    if (error) return [];
    return (data as RobotLog[]) || [];
  },

  logRobotAction: async (action: 'POST' | 'CLEANUP' | 'ERROR', details: string, region?: string): Promise<void> => {
    const newLog: RobotLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        action,
        details,
        region
    };
    await supabase.from('robot_logs').insert(newLog);
  },

  triggerRobotPost: async (forcedTimestamp?: number, targetRegion?: string, targetCategory?: string): Promise<Post | null> => {
    let lastBotTimestamp = 0;
    const { data: lastBotPost } = await supabase.from('posts').select('timestamp').eq('isRobot', true).order('timestamp', { ascending: false }).limit(1).maybeSingle();
    if (lastBotPost) lastBotTimestamp = lastBotPost.timestamp;
    
    if (lastBotTimestamp === 0) {
        const localPosts = getLocalPosts();
        const localBot = localPosts.find(p => p.isRobot);
        if (localBot) lastBotTimestamp = localBot.timestamp;
    }

    const now = Date.now();
    // Requirement 66: 機械人發貼設定為每日工作和每天工作24小時，每分鐘檢查一次
    if (!forcedTimestamp && (now - lastBotTimestamp < 60000)) return null; // Changed from 25s to 60s for more frequent posting

    const region = targetRegion || REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = targetCategory || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const mockData = generateMockNews(region, topic);
    
    const fullText = (mockData.title + mockData.content).toLowerCase();
    const hasForbidden = FORBIDDEN_KEYWORDS.some(k => fullText.includes(k.toLowerCase()));
    if (hasForbidden) return null;

    const timestamp = forcedTimestamp || now;
    
    // Requirement 85: 機械人發貼內容可以比現在多 2 to 3倍
    // Requirement 87: 機械人發貼文章內文只寫重點，機械人自動編寫文章內文
    const expandedContent = expandContent(mockData.content || '', region, topic);
    const expandedContentCN = expandContent(mockData.contentCN || '', region, topic);
    
    const newPost: Post = {
      id: `bot-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      title: mockData.title!,
      titleCN: mockData.titleCN,
      content: expandedContent, // Expanded content 2-3x
      contentCN: expandedContentCN,
      region: region,
      category: mockData.category || topic,
      author: `${region} AI Bot`,
      authorId: 'system-bot',
      isRobot: true,
      timestamp: timestamp,
      displayDate: new Date(timestamp).toLocaleString(),
      likes: 0, // Start at 0, let users interact
      hearts: 0,
      views: 0,
      source: mockData.source,
      sourceUrl: mockData.sourceUrl,
      botId: mockData.botId,
      replies: [], // Requirement 51: 每個機械人發貼設定每不可留言貼
      userInteractions: {}
    };

    await MockDB.savePost(newPost);
    await MockDB.logRobotAction('POST', `Posted AI Summary in [${region}]: ${mockData.title?.substring(0, 20)}...`, region);
    return newPost;
  }
};
