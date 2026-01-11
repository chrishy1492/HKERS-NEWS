import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

// Admin List
const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

// Initial Real News Data (Simulated 2026 Data from Prompt)
const INITIAL_BOT_NEWS: Post[] = [
  {
    id: 'news-001',
    authorId: 'bot-001',
    authorName: 'HKER Bot 🤖',
    authorAvatar: '🤖',
    timestamp: Date.now() - 3600000 * 2, // 2 hours ago
    region: '中國香港',
    topic: '時事',
    titleCN: '【最新】高鐵香港段新增16個站點 包括南京及合肥',
    titleEN: 'High Speed Rail adds 16 new destinations including Nanjing and Hefei',
    contentCN: '港鐵宣布，高鐵香港段將於1月26日起新增16個站點，直達站點總數將增至超過100個。新增站點包括南京南、合肥南等，進一步便利港人北上交流與旅遊。此消息經機械人事實查核。',
    contentEN: 'MTR Corporation announced that the Hong Kong Section of the High Speed Rail will introduce 16 new stops starting January 26, bringing the total to over 100 direct destinations. New stops include Nanjing South and Hefei South.',
    likes: 154,
    loves: 88,
    isBot: true,
    sourceUrl: 'https://www.scmp.com/news/hong-kong',
    sourceName: 'SCMP'
  },
  {
    id: 'news-002',
    authorId: 'bot-001',
    authorName: 'HKER Bot 🤖',
    authorAvatar: '🤖',
    timestamp: Date.now() - 3600000 * 5, // 5 hours ago
    region: '英國',
    topic: '天氣',
    titleCN: '【突發】風暴 Goretti 吹襲英國 數萬戶斷電',
    titleEN: 'Storm Goretti batters UK, leaving thousands without power',
    contentCN: '風暴 Goretti 席捲英國，陣風高達 100mph (約160公里/小時)。康沃爾郡(Cornwall)受災嚴重，數萬戶家庭停電，交通受阻。氣象局已發布危險警告，在英港人請注意安全。',
    contentEN: 'Storm Goretti has swept across the UK with wind gusts reaching 100mph. Cornwall is heavily affected with thousands of homes without power. The Met Office has issued danger warnings.',
    likes: 210,
    loves: 45,
    isBot: true,
    sourceUrl: 'https://www.fwi.co.uk/news/storm-goretti',
    sourceName: 'Farmers Weekly / Sky'
  },
  {
    id: 'news-003',
    authorId: 'bot-001',
    authorName: 'HKER Bot 🤖',
    authorAvatar: '🤖',
    timestamp: Date.now() - 3600000 * 12, // 12 hours ago
    region: '台灣',
    topic: '時事',
    titleCN: '【政治】台灣反對黨再次阻擋國防預算案',
    titleEN: 'Opposition parties block defense budget in Taiwan Legislature again',
    contentCN: '台灣立法院反對黨再次聯手阻擋加強國防態勢的特別預算及2026年總預算案。行政院長卓榮泰表示，若預算持續卡關，中央政府將面臨約3000億新台幣的資金缺口。',
    contentEN: 'Opposition parties in Taiwan have once again blocked a special defense budget and the 2026 general budget. Premier Cho Jung-tai warned of a NT$300 billion funding gap if the stalemate continues.',
    likes: 342,
    loves: 12,
    isBot: true,
    sourceUrl: 'https://focustaiwan.tw/politics',
    sourceName: 'Focus Taiwan'
  },
  {
    id: 'news-004',
    authorId: 'bot-001',
    authorName: 'HKER Bot 🤖',
    authorAvatar: '🤖',
    timestamp: Date.now() - 3600000 * 18, // 18 hours ago
    region: '加拿大',
    topic: '時事',
    titleCN: '【移民】加拿大暫停接收 2026 年父母及祖父母依親移民申請',
    titleEN: 'Canada pauses Parents and Grandparents Program (PGP) intake for 2026',
    contentCN: '加拿大移民部 (IRCC) 宣布，為清理積壓案件，2026年將不接受新的父母及祖父母依親移民 (PGP) 申請。建議有需要的家庭改為申請「超級簽證」(Super Visa)，可獲准停留長達5年。',
    contentEN: 'IRCC announced it will not accept new applications for the Parents and Grandparents Program (PGP) in 2026 to clear backlogs. Families are advised to apply for the Super Visa instead.',
    likes: 56,
    loves: 10,
    isBot: true,
    sourceUrl: 'https://www.indianexpress.com/',
    sourceName: 'Indian Express'
  },
  {
    id: 'news-005',
    authorId: 'bot-001',
    authorName: 'HKER Bot 🤖',
    authorAvatar: '🤖',
    timestamp: Date.now() - 3600000 * 24, // 1 day ago
    region: '美國',
    topic: '財經',
    titleCN: '【美股】科技股領漲華爾街 Nvidia 與 Amazon 表現強勁',
    titleEN: 'Tech stocks lead Wall Street gains with strong Nvidia and Amazon performance',
    contentCN: '受人工智慧需求推動，美股週二收高。Amazon 上漲 3.4%，Micron Technology 飆升 10%。分析師指 AI 相關硬體需求持續推動市場，投資者密切關注本週經濟數據。',
    contentEN: 'Wall Street closed higher Tuesday led by tech stocks. Amazon rose 3.4% and Micron surged 10%, driven by AI hardware demand.',
    likes: 88,
    loves: 20,
    isBot: true,
    sourceUrl: 'https://apnews.com/',
    sourceName: 'AP News'
  }
];

// Initial Data for Fallback
const INITIAL_STATS: Stat = {
  onlineUsers: 124,
  newRegisters: 15,
  totalVisits: 3420,
  botLastRun: 0
};

// --- Helper: LocalStorage Keys ---
const KEYS = {
  USERS: 'hker_users',
  POSTS: 'hker_posts',
  STATS: 'hker_stats'
};

// --- State Variables to cache connection status ---
let isSupabaseActive = false;
let hasCheckedConnection = false;

const init = async () => {
  if (!hasCheckedConnection) {
    isSupabaseActive = await checkSupabaseConnection();
    hasCheckedConnection = true;
  }
};

// --- Users ---
export const getUsers = async (): Promise<User[]> => {
  await init();
  if (isSupabaseActive) {
    const { data } = await supabase.from('users').select('*');
    return data || [];
  }
  const local = localStorage.getItem(KEYS.USERS);
  return local ? JSON.parse(local) : [];
};

export const saveUser = async (user: User): Promise<void> => {
  await init();
  if (isSupabaseActive) {
    await supabase.from('users').upsert(user);
  }
  const users = await getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

// --- Posts ---
export const getPosts = async (): Promise<Post[]> => {
  await init();
  if (isSupabaseActive) {
    const { data } = await supabase.from('posts').select('*').order('timestamp', { ascending: false }).limit(50);
    return data || [];
  }
  const local = localStorage.getItem(KEYS.POSTS);
  return local ? JSON.parse(local) : INITIAL_BOT_NEWS; // Default to specific news
};

export const savePost = async (post: Post): Promise<void> => {
  await init();
  if (isSupabaseActive) {
    await supabase.from('posts').insert(post);
  }
  const posts = await getPosts();
  const newPosts = [post, ...posts];
  localStorage.setItem(KEYS.POSTS, JSON.stringify(newPosts));
};

export const updatePostInteraction = async (postId: string, type: 'like' | 'love'): Promise<void> => {
  await init();
  const posts = await getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    if (type === 'like') post.likes++;
    if (type === 'love') post.loves++;
    
    localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));

    if (isSupabaseActive) {
      await supabase.from('posts').update({ likes: post.likes, loves: post.loves }).eq('id', postId);
    }
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  await init();
  if (isSupabaseActive) {
    await supabase.from('posts').delete().eq('id', postId);
  }
  const posts = await getPosts();
  const filtered = posts.filter(p => p.id !== postId);
  localStorage.setItem(KEYS.POSTS, JSON.stringify(filtered));
};

// --- Stats ---
export const getStats = async (): Promise<Stat> => {
  const local = localStorage.getItem(KEYS.STATS);
  return local ? JSON.parse(local) : INITIAL_STATS;
};

export const updateStats = (updates: Partial<Stat>) => {
  const current = localStorage.getItem(KEYS.STATS);
  const stats = current ? JSON.parse(current) : INITIAL_STATS;
  const newStats = { ...stats, ...updates };
  localStorage.setItem(KEYS.STATS, JSON.stringify(newStats));
  return newStats;
};

// --- Init Logic ---
// Seed Admin if not exists locally
(async () => {
  const users = await getUsers();
  let changed = false;
  ADMIN_EMAILS.forEach(email => {
    if (!users.find(u => u.email === email)) {
      users.push({
        id: `admin-${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: 'Super Admin',
        role: 'admin',
        points: 99999999,
        vipLevel: 5,
        avatar: '🦁',
        solAddress: 'HKER-ADMIN-WALLET',
        gender: 'M',
        joinedAt: Date.now()
      });
      changed = true;
    }
  });
  if (changed) localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  
  // Ensure initial posts exist
  const currentPosts = localStorage.getItem(KEYS.POSTS);
  if (!currentPosts) {
      localStorage.setItem(KEYS.POSTS, JSON.stringify(INITIAL_BOT_NEWS));
  }
})();
