
import { supabase } from './supabaseClient';
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, Comment } from '../types';

const KEY_CURRENT_USER = 'hker_current_user_v3';
const KEY_LOCAL_POSTS = 'hker_local_posts_fallback';
const KEY_LOCAL_USERS = 'hker_local_users_fallback';

// Sensitive words filter
const FORBIDDEN_KEYWORDS = [
  'China', 'Xi Jinping', 'Tiananmen', 'June 4', 'Independence',
  '中國', '習近平', '六四'
];

// Mock External URLs for Copyright Compliance
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
// NEWS TEMPLATES (Summary Generation Logic)
// =========================================================
interface NewsTemplate {
    titleEN: string;
    titleCN: string;
    summaryEN: (region: string, source: string) => string;
    summaryCN: (region: string, source: string) => string;
    category: string;
}

// Helper to create safe summaries
const createSafeSummaryEN = (topic: string, source: string) => {
    return `(AI Summary) According to ${source}, ${topic}.\n\nThis is a brief excerpt. Please visit the original link below for full details.`;
};

const createSafeSummaryCN = (topic: string, source: string) => {
    return `(AI 重點摘要) 根據《${source}》報導，${topic}。\n\n以上僅為新聞重點，完整內容請點擊下方連結閱讀原文。`;
};

const NEWS_TEMPLATES: NewsTemplate[] = [
    {
        category: 'Finance',
        titleEN: "Market Alert: Tech Stocks Rally",
        titleCN: "市場快訊：科技股反彈",
        summaryEN: (region, source) => createSafeSummaryEN(`major indices in ${region} hit record highs today driven by semiconductor gains`, source),
        summaryCN: (region, source) => createSafeSummaryCN(`${region} 主要指數今日在半導體板塊帶動下創出新高`, source)
    },
    {
        category: 'Real Estate',
        titleEN: "Luxury Property Market Trends",
        titleCN: "豪宅市場最新趨勢",
        summaryEN: (region, source) => createSafeSummaryEN(`transaction volumes for luxury properties in ${region} have increased by 15% this quarter`, source),
        summaryCN: (region, source) => createSafeSummaryCN(`${region} 豪宅市場本季交易量意外增長了 15%`, source)
    },
    {
        category: 'Current Affairs',
        titleEN: "New Infrastructure Bill Passed",
        titleCN: "新基建法案正式通過",
        summaryEN: (region, source) => createSafeSummaryEN(`the local government in ${region} approved a new bill to modernize public transport networks`, source),
        summaryCN: (region, source) => createSafeSummaryCN(`${region} 當地政府已批准一項旨在現代化公共交通網絡的新法案`, source)
    },
    {
        category: 'Weather',
        titleEN: "Severe Weather Warning Issued",
        titleCN: "惡劣天氣警告生效",
        summaryEN: (region, source) => createSafeSummaryEN(`meteorologists in ${region} warn of heavy rainfall and potential flooding in coastal areas`, source),
        summaryCN: (region, source) => createSafeSummaryCN(`${region} 氣象部門警告沿海地區可能出現暴雨及水浸風險`, source)
    }
];

const generateMockNews = (region: string, topic?: string): Partial<Post> => {
  const sources = Object.keys(SOURCE_DOMAINS);
  const randSource = sources[Math.floor(Math.random() * sources.length)];
  const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
  const mockUrl = `${SOURCE_DOMAINS[randSource]}/article/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`;

  return {
    title: `【${region}】${template.titleEN}`,
    titleCN: `【${REGIONS_CN[region] || region}】${template.titleCN}`,
    content: template.summaryEN(region, randSource),
    contentCN: template.summaryCN(REGIONS_CN[region] || region, randSource),
    region: region,
    category: template.category,
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
    
    // Initial Seed Data if empty
    const seed: Post[] = [
        {
            id: 'init-1',
            title: 'Welcome to HKER Platform (Local Mode)',
            titleCN: '歡迎來到 HKER 平台 (離線模式)',
            content: 'Since the cloud database tables are not set up yet, the system has switched to Local Storage mode. You can still post, comment, and use the robot.',
            contentCN: '由於雲端資料庫尚未設定，系統已切換至本地儲存模式。您仍然可以發文、留言並使用機械人功能。',
            region: 'Hong Kong',
            category: 'Digital',
            author: 'System',
            authorId: 'sys-001',
            isRobot: false,
            timestamp: Date.now(),
            displayDate: new Date().toLocaleString(),
            likes: 88,
            hearts: 88,
            views: 1000,
            replies: [],
            userInteractions: {}
        }
    ];
    localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(seed));
    return seed;
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
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.warn('Cloud DB Error (Users), using local:', error.message);
      return getLocalUsers();
    }
    return (data as User[]) || [];
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEY_CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  login: async (email: string): Promise<User | null> => {
    // 1. Try Cloud
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    // 2. Fallback to Local if Error
    if (error) {
        console.warn("Login Cloud Error, trying local:", error.message);
        const localUsers = getLocalUsers();
        const localUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (localUser) {
            localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(localUser));
            return localUser;
        }
        return null;
    }

    if (!user) return null;
    const typedUser = user as User;
    if (typedUser.isBanned) throw new Error("This account has been banned.");
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(typedUser));
    return typedUser;
  },

  register: async (user: User): Promise<void> => {
    // 1. Try Cloud
    const { error } = await supabase.from('users').insert(user);
    
    // 2. Fallback if Table Missing or Error
    if (error) {
        console.warn("Register Cloud Error, saving locally:", error.message);
        const localUsers = getLocalUsers();
        if (localUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase())) {
            throw new Error("Email already registered (Local)");
        }
        if (ADMIN_EMAILS.includes(user.email.toLowerCase())) user.role = UserRole.ADMIN;
        saveLocalUser(user);
    } 
    
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  saveUser: async (user: User): Promise<void> => {
    const { error } = await supabase.from('users').upsert(user);
    if (error) {
        console.warn('Save user cloud error, saving local:', error.message);
        saveLocalUser(user);
    }
    
    const current = MockDB.getCurrentUser();
    if (current && current.id === user.id) {
        localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
    }
  },

  updateUserPoints: async (userId: string, delta: number): Promise<number> => {
    // 1. Try Cloud
    const { data: user, error: fetchError } = await supabase.from('users').select('points').eq('id', userId).single();
    
    // 2. Fallback Logic
    if (fetchError) {
        // console.warn("Point Sync Error (Cloud), using local:", fetchError.message);
        const localUsers = getLocalUsers();
        const localUser = localUsers.find(u => u.id === userId);
        if (localUser) {
            const newPoints = Math.max(0, localUser.points + delta);
            if (delta < 0 && (localUser.points + delta < 0)) return -1;
            localUser.points = newPoints;
            saveLocalUser(localUser);
            
            // Sync Session
            const current = MockDB.getCurrentUser();
            if (current && current.id === userId) {
                current.points = newPoints;
                localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(current));
            }
            return newPoints;
        }
        return 0;
    }

    const newPoints = Math.max(0, user.points + delta);
    if (delta < 0 && (user.points + delta < 0)) return -1;

    const { error: updateError } = await supabase.from('users').update({ points: newPoints }).eq('id', userId);
    if (!updateError) {
        const current = MockDB.getCurrentUser();
        if (current && current.id === userId) {
            current.points = newPoints;
            localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(current));
        }
        return newPoints;
    }
    return user.points;
  },

  resetAllPoints: async (value: number): Promise<void> => {
    const { error } = await supabase.from('users').update({ points: value }).neq('id', '0');
    if (error) {
        const localUsers = getLocalUsers();
        localUsers.forEach(u => u.points = value);
        localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(localUsers));
    }
  },

  // --- POSTS ---

  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100); 
      
    if (error) {
        // Suppress warn for missing table to keep console clean, just fallback
        if (error.code !== 'PGRST205') console.warn("Cloud Feed Error:", error.message);
        return getLocalPosts();
    }
    return (data as Post[]) || [];
  },

  savePost: async (post: Post): Promise<void> => {
    const { error } = await supabase.from('posts').upsert(post);
    if (error) {
        // console.warn("Save Post Cloud Error, using local:", error.message);
        saveLocalPost(post);
    }
  },

  deletePost: async (postId: string): Promise<void> => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
        const posts = getLocalPosts().filter(p => p.id !== postId);
        localStorage.setItem(KEY_LOCAL_POSTS, JSON.stringify(posts));
    }
  },

  // --- COMMENTS ---
  
  addComment: async (postId: string, user: User, content: string): Promise<void> => {
    const newComment: Comment = {
        id: `c-${Date.now()}-${Math.random()}`,
        postId,
        author: user.name,
        authorId: user.id,
        content,
        timestamp: Date.now()
    };

    // Try Cloud
    const { data: post, error } = await supabase.from('posts').select('replies').eq('id', postId).maybeSingle();
    
    if (error || !post) {
        // Local Fallback
        const posts = getLocalPosts();
        const localPost = posts.find(p => p.id === postId);
        if (localPost) {
            if (!localPost.replies) localPost.replies = [];
            localPost.replies.push(newComment);
            saveLocalPost(localPost);
        }
        return;
    }
    
    const currentReplies = Array.isArray(post.replies) ? post.replies : [];
    const updatedReplies = [...currentReplies, newComment];
    await supabase.from('posts').update({ replies: updatedReplies }).eq('id', postId);
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    const { data: post, error } = await supabase.from('posts').select('replies').eq('id', postId).maybeSingle();
    
    if (error || !post) {
         // Local Fallback
        const posts = getLocalPosts();
        const localPost = posts.find(p => p.id === postId);
        if (localPost && localPost.replies) {
            localPost.replies = localPost.replies.filter(c => c.id !== commentId);
            saveLocalPost(localPost);
        }
        return;
    }
    
    if (Array.isArray(post.replies)) {
        const updatedReplies = post.replies.filter((c: Comment) => c.id !== commentId);
        await supabase.from('posts').update({ replies: updatedReplies }).eq('id', postId);
    }
  },

  // --- ROBOT LOGS & AUTOMATION ---

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
    await supabase.from('robot_logs').insert(newLog).catch(() => {});
  },

  triggerRobotPost: async (forcedTimestamp?: number, targetRegion?: string, targetCategory?: string): Promise<Post | null> => {
    // 1. CHECK CLOUD (If available)
    let lastBotTimestamp = 0;
    const { data: lastBotPost, error: checkError } = await supabase
        .from('posts')
        .select('timestamp')
        .eq('isRobot', true)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!checkError && lastBotPost) {
        lastBotTimestamp = lastBotPost.timestamp;
    } else {
        // Fallback check local
        const localPosts = getLocalPosts();
        const localBot = localPosts.find(p => p.isRobot);
        if (localBot) lastBotTimestamp = localBot.timestamp;
    }

    const now = Date.now();
    // 30 seconds cooldown
    if (!forcedTimestamp && (now - lastBotTimestamp < 30000)) {
        return null; 
    }

    const region = targetRegion || REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = targetCategory || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const mockData = generateMockNews(region, topic);
    
    const fullText = (mockData.title + mockData.content).toLowerCase();
    const hasForbidden = FORBIDDEN_KEYWORDS.some(k => fullText.includes(k.toLowerCase()));
    if (hasForbidden) return null;

    const timestamp = forcedTimestamp || now;
    const newPost: Post = {
      id: `bot-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      title: mockData.title!,
      titleCN: mockData.titleCN,
      content: mockData.content!,
      contentCN: mockData.contentCN,
      region: region,
      category: mockData.category || topic,
      author: `${region} Bot`,
      authorId: 'system-bot',
      isRobot: true,
      timestamp: timestamp,
      displayDate: new Date(timestamp).toLocaleString(),
      likes: Math.floor(Math.random() * 50),
      hearts: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 200),
      source: mockData.source,
      sourceUrl: mockData.sourceUrl,
      botId: mockData.botId,
      replies: [],
      userInteractions: {}
    };

    await MockDB.savePost(newPost); // Will save locally if cloud fails
    
    // Log only if cloud available to avoid noise
    if (!checkError && !forcedTimestamp) {
        await MockDB.logRobotAction('POST', `Posted in [${region}]: ${mockData.title?.substring(0, 20)}...`, region);
    }
    return newPost;
  }
};
