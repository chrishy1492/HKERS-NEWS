
import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Post, UserRole, VisitorLog } from '../types';
import { ADMIN_EMAILS, AVATARS, REGIONS, TOPICS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface DataContextType {
  users: User[];
  currentUser: User | null;
  posts: Post[];
  visitorLogs: VisitorLog;
  register: (userData: Partial<User>) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  adminUpdateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  createPost: (postData: Partial<Post>) => void;
  deletePost: (postId: number) => void;
  addReply: (postId: number, content: string) => void;
  toggleLike: (postId: number, type: 'like' | 'love') => boolean;
  updatePoints: (userId: string, amount: number) => void;
  toggleTranslation: (postId: number) => void;
  logActivity: (type: 'guest' | 'member') => void;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

const STORAGE_KEYS = {
  POSTS: 'hker_local_posts_v6',
  USERS: 'hker_local_users_v6',
  SESSION: 'hker_session_user_v6',
  LOGS: 'hker_analytics_v6'
};

const BOT_SOURCES = [
  { name: "Global HK Intel", url: "https://hker-intel.org" },
  { name: "Strategic Tech Review", url: "https://tech-strategic.io" },
  { name: "World Finance Watch", url: "https://finance-watch.net" }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog>({});
  
  const botIntervalRef = useRef<number | null>(null);

  // --- 1. 初始化與同步 (Init & Sync) ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: uData } = await supabase.from('users').select('*');
      const { data: pData } = await supabase.from('posts').select('*').order('createdAt', { ascending: false });
      
      const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const localPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]');
      const localLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '{}');

      const mergedUsers = uData || localUsers;
      setUsers(mergedUsers);
      setPosts(pData || localPosts);
      setVisitorLogs(localLogs);

      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (session) {
        const sUser = JSON.parse(session);
        const latest = mergedUsers.find((u: User) => u.id === sUser.id);
        if (latest) {
          setCurrentUser(latest);
          logActivity('member');
        }
      } else {
        logActivity('guest');
      }
    };
    fetchData();

    const channel = supabase.channel('global_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        const updated = payload.new as User;
        setUsers(prev => {
          const exists = prev.find(u => u.id === updated.id);
          return exists ? prev.map(u => u.id === updated.id ? updated : u) : [updated, ...prev];
        });
        if (currentUser?.id === updated.id) {
          setCurrentUser(updated);
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updated));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        setPosts(prev => [payload.new as Post, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts.slice(0, 100)));
  }, [posts]);

  // --- 2. 流量計數 (Analytics) ---
  const logActivity = (type: 'guest' | 'member') => {
    const now = new Date();
    const Y = now.getFullYear().toString();
    const M = (now.getMonth() + 1).toString();
    const D = now.getDate().toString();
    const H = now.getHours().toString();

    setVisitorLogs(prev => {
      const next = { ...prev };
      if (!next[Y]) next[Y] = {};
      if (!next[Y][M]) next[Y][M] = {};
      if (!next[Y][M][D]) next[Y][M][D] = {};
      if (!next[Y][M][D][H]) next[Y][M][D][H] = { guests: 0, members: 0 };
      if (type === 'guest') next[Y][M][D][H].guests++;
      else next[Y][M][D][H].members++;
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(next));
      return next;
    });
  };

  // --- 3. 24/7 專業 Bot 引擎 (AI Bot Engine) ---
  useEffect(() => {
    botIntervalRef.current = window.setInterval(generateBotPost, 60000); // 每分鐘發布
    return () => { if (botIntervalRef.current) clearInterval(botIntervalRef.current); };
  }, []);

  const generateBotPost = async () => {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const source = BOT_SOURCES[Math.floor(Math.random() * BOT_SOURCES.length)];

    const enTitle = `Intelligence Analysis: ${region}'s ${topic} Strategic Shift (2025)`;
    const enContent = `
[STRATEGIC OVERVIEW]
Field data from ${region} indicates a significant acceleration in the ${topic} sector. Our AI synthesis engine has detected structural anomalies suggesting a total market pivot.

[CORE INTELLIGENCE HIGHLIGHTS]
• SYSTEM OPTIMIZATION: New decentralized protocols are reducing administrative latency by 22% across primary ${topic} networks.
• MARKET SYNERGY: Inter-regional alliances in ${region} are effectively mitigating 35% of traditional supply chain bottlenecks.
• REGULATORY ALIGNMENT: Recent frameworks have shifted 50% of infrastructure towards green-certified standards, a record high.
• TECH ADOPTION: Implementation rates for next-gen automation in ${topic} services have surged to 12.5x the quarterly average.
• ECONOMIC RESILIENCE: Current internal rates of return remain stable at 8.2% despite volatile external market fluctuations.

[IMPACT ANALYSIS]
From an economic standpoint, these developments will likely cushion ${region} against global inflationary pressures. For local stakeholders, this transition marks a move from high-cost legacy systems to lean, AI-driven operations.

[FUTURE OUTLOOK]
Continued monitoring is required as the ${region} ${topic} landscape enters Phase 3.0 implementation. Expect further consolidations by Q4.

---
AI COMPLIANCE NOTICE: This content is an original synthesis of global data streams and was automatically generated by the HKER Intelligence Engine to prevent direct copyright infringement.
SOURCE INTEL: ${source.name} (${source.url})
    `.trim();

    const zhTitle = `情報分析：${region} ${topic} 領域的戰略轉型 (2025)`;
    const zhContent = `
【戰略概覽】
來自 ${region} 的實地數據顯示 ${topic} 領域正在加速發展。我們的 AI 綜合引擎檢測到結構性異常，顯示市場正在發生全面轉向。

【核心情報亮點】
• 系統優化：新的去中心化協議將主要 ${topic} 網絡的行政延遲降低了 22%。
• 市場協同：${region} 的跨區域聯盟有效緩解了 35% 的傳統供應鏈瓶頸。
• 監管對齊：近期框架已將 50% 的基礎設施轉向綠色認證標準，創下歷史新高。
• 技術採用：${topic} 服務中下一代自動化的實施率已飆升至季度平均水平的 12.5 倍。
• 經濟韌性：儘管外部市場波動劇烈，當前內部收益率仍穩定在 8.2%。

【影響分析】
從經濟角度來看，這些發展可能會緩衝 ${region} 承受的全球通脹壓力。對於當地利益相關者而言，這一轉變標誌著從高成本遺留系統向精益、AI 驅動運作的跨越。

【未來展望】
隨著 ${region} ${topic} 格局進入 3.0 階段實施，需要持續監控。預計第四季度將出現進一步整合。

---
AI 合規聲明：本內容為全球數據流的原創綜合，由 HKER 情報引擎自動編寫，以防止直接侵犯版權。
情報來源：${source.name} (${source.url})
    `.trim();

    const newPost: Post = {
      id: Date.now(),
      authorId: 'AI-BOT-ENGINE',
      authorName: 'AI Intel Robot',
      title: enTitle,
      content: enContent,
      region, topic,
      likes: [], loves: [],
      createdAt: new Date().toISOString(),
      replies: [], 
      isBot: true,
      sourceName: source.name,
      sourceUrl: source.url,
      originalLang: 'en',
      isTranslated: false,
      translation: { title: zhTitle, content: zhContent }
    };

    setPosts(prev => [newPost, ...prev]);
    try { await supabase.from('posts').insert(newPost); } catch (e) {}
  };

  // --- 4. 會員與積分 (Members & Points) ---
  const register = async (userData: Partial<User>) => {
    const newUser: User = {
      id: `HKER-${Math.floor(100000 + Math.random() * 900000)}`,
      name: userData.name || 'User',
      email: userData.email || '',
      password: userData.password,
      points: 8888, 
      role: ADMIN_EMAILS.includes(userData.email || '') ? 'admin' : 'user',
      starLevel: 1,
      joinedAt: new Date().toISOString(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      solAddress: userData.solAddress,
      phone: userData.phone,
      address: userData.address,
      gender: userData.gender
    };
    
    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));
    logActivity('member');

    try { await supabase.from('users').insert(newUser); } catch (e) {}
  };

  const login = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      logActivity('member');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  };

  const adminUpdateUser = async (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    try { await supabase.from('users').update(updates).eq('id', userId); } catch (e) {}
  };

  const deleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    try { await supabase.from('users').delete().eq('id', userId); } catch (e) {}
  };

  const updatePoints = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newPoints = Math.max(0, user.points + amount);
    adminUpdateUser(userId, { points: newPoints });
  };

  const toggleTranslation = (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isTranslated: !p.isTranslated } : p));
  };

  return (
    <DataContext.Provider value={{
      users, currentUser, posts, visitorLogs,
      register, login, logout,
      adminUpdateUser, deleteUser,
      createPost: () => {}, deletePost: (id) => {
        setPosts(prev => prev.filter(p => p.id !== id));
        supabase.from('posts').delete().eq('id', id).then();
      }, addReply: () => {}, toggleLike: (id, type) => {
        if (!currentUser) return false;
        const post = posts.find(p => p.id === id);
        if (!post) return false;
        const list = type === 'like' ? [...post.likes] : [...post.loves];
        if (list.filter(uid => uid === currentUser.id).length >= 3) return false;
        list.push(currentUser.id);
        const updates = type === 'like' ? { likes: list } : { loves: list };
        setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        updatePoints(currentUser.id, 150);
        supabase.from('posts').update(updates).eq('id', id).then();
        return true;
      },
      updatePoints, toggleTranslation, logActivity
    }}>
      {children}
    </DataContext.Provider>
  );
};
