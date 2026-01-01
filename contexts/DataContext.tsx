
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
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

// --- AI BOT CONFIG ---
const BOT_SOURCES = [
  { name: "HK Global News", url: "https://news.hk-global.com" },
  { name: "Tech Daily", url: "https://techdaily.io" },
  { name: "World Finance", url: "https://finance.world.org" },
  { name: "Community Buzz", url: "https://community.buzz" }
];

// Enhanced Bot Content Engine for longer, summary-based posts
const BOT_PHRASES = {
  en: {
    titles: [
      "{region} {topic} Update: Key Developments",
      "Analysis: The Future of {topic} in {region}",
      "Breaking: Major {topic} Shift in {region}",
      "Weekly Report: {region}'s {topic} Trends"
    ],
    openers: [
      "Recent reports indicate significant developments regarding {topic} in {region}. Analysts are closely monitoring the situation as new data emerges.",
      "A major shift is occurring in the {topic} sector within {region}. Stakeholders are advising caution as the landscape evolves.",
      "Breaking news from {region} highlights a turning point for {topic}. The community has expressed mixed reactions to these changes.",
      "According to recent sources, {region} is poised for a transformation in {topic}. Here is a summary of the key events."
    ],
    points: [
      "Local authorities have proposed new guidelines to streamline operations and improve efficiency.",
      "Market data suggests a significant increase in activity, with experts predicting a 15% growth next quarter.",
      "Concerns have been raised regarding sustainability, prompting a review of current practices.",
      "Several key industry leaders have announced a strategic partnership to address emerging challenges.",
      "Public feedback indicates a strong demand for more transparency and faster implementation.",
      "Financial analysts warn of potential short-term volatility, though the long-term outlook remains positive.",
      "Innovative technologies are being deployed to solve persistent issues in the sector."
    ],
    closers: [
      "We will continue to monitor these developments and provide updates as they become available.",
      "This marks a significant milestone, and its impact will likely be felt for months to come.",
      "Experts recommend that residents stay informed and prepare for potential changes in regulations.",
      "The situation is developing rapidly; stay tuned for our follow-up analysis."
    ]
  },
  zh: {
    titles: [
      "{region} {topic} 更新：重點發展",
      "分析：{region} {topic} 的未來",
      "突發：{region} {topic} 出現重大轉變",
      "週報：{region} {topic} 趨勢"
    ],
    openers: [
      "最新報告顯示，{region}在{topic}方面有顯著發展。隨著新數據的出現，分析師正密切關注局勢。",
      "{region}的{topic}領域正在發生重大轉變。隨著形勢的發展，利益相關者建議謹慎行事。",
      "來自{region}的突發新聞凸顯了{topic}的轉折點。社區對這些變化反應不一。",
      "據最新消息來源，{region}的{topic}正準備轉型。以下是關鍵事件的摘要。"
    ],
    points: [
      "當局已提出新指引，旨在簡化運作流程並提高效率。",
      "市場數據顯示活動顯著增加，專家預測下季度將增長 15%。",
      "人們對可持續性提出了擔憂，促使對當前做法進行審查。",
      "幾位主要行業領袖已宣布建立戰略合作夥伴關係，以應對新出現的挑戰。",
      "公眾反饋表明，人們強烈要求提高透明度和加快實施速度。",
      "金融分析師警告短期內可能出現波動，但長期前景依然看好。",
      "正在部署創新技術以解決該行業存在的長期問題。"
    ],
    closers: [
      "我們將繼續關注這些發展，並在有消息時提供更新。",
      "這標誌著一個重要的里程碑，其影響可能會持續數月。",
      "專家建議居民隨時了解情況，並為法規的潛在變化做好準備。",
      "局勢發展迅速；請留意我們的後續分析。"
    ]
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog>({});
  
  const botIntervalRef = useRef<number | null>(null);

  // --- SYNC MECHANISM (Critical for Mobile/Web consistency) ---
  useEffect(() => {
    const loadLocalData = () => {
      try {
        const savedUsers = localStorage.getItem('hker_users');
        const savedPosts = localStorage.getItem('hker_posts');
        const savedLogs = localStorage.getItem('hker_visitor_logs');
        const savedSession = localStorage.getItem('hker_session_user');
        
        if (savedUsers) setUsers(JSON.parse(savedUsers));
        if (savedPosts) setPosts(JSON.parse(savedPosts));
        if (savedLogs) setVisitorLogs(JSON.parse(savedLogs));
        
        if (savedSession && savedUsers) {
           const sessionUser = JSON.parse(savedSession);
           const validUser = JSON.parse(savedUsers).find((u: User) => u.id === sessionUser.id);
           if (validUser) setCurrentUser(validUser);
        }
      } catch (e) {
        console.error("Local Data Load Error", e);
      }
    };
    loadLocalData();
    logVisit(null); 

    const setupRealtime = async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const { data: dbPosts } = await supabase.from('posts').select('*').order('createdAt', { ascending: false });
        if (dbPosts) setPosts(prev => [...dbPosts, ...prev.filter(p => !dbPosts.find(dp => dp.id === p.id))]); 

        const { data: dbUsers } = await supabase.from('users').select('*');
        if (dbUsers) setUsers(prev => [...dbUsers, ...prev.filter(u => !dbUsers.find(du => du.id === u.id))]);

        const channel = supabase.channel('realtime_forum')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
                if (payload.eventType === 'INSERT') setPosts(prev => [payload.new as Post, ...prev]);
                if (payload.eventType === 'DELETE') setPosts(prev => prev.filter(p => p.id !== payload.old.id));
                if (payload.eventType === 'UPDATE') setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Post : p));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
                if (payload.eventType === 'UPDATE') {
                    setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new as User : u));
                    if (currentUser && currentUser.id === payload.new.id) setCurrentUser(payload.new as User);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    };
    setupRealtime();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hker_users' && e.newValue) setUsers(JSON.parse(e.newValue));
      if (e.key === 'hker_posts' && e.newValue) setPosts(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem('hker_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (posts.length > 0) localStorage.setItem('hker_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('hker_session_user', JSON.stringify(currentUser));
    else localStorage.removeItem('hker_session_user');
  }, [currentUser]);

  const logVisit = (loggedInUser: User | null) => {
    // Analytics logic...
  };

  // --- ROBOT WORKER (Requirement 2: Active 24/7, Active Worker) ---
  useEffect(() => {
    botIntervalRef.current = window.setInterval(() => {
      generateBotPost();
    }, 30000); 
    
    return () => { if (botIntervalRef.current) clearInterval(botIntervalRef.current); };
  }, []);

  // --- NEW BOT GENERATION LOGIC (Requirement 1, 2, 3) ---
  const generateBotPost = async () => {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const source = BOT_SOURCES[Math.floor(Math.random() * BOT_SOURCES.length)];
    
    // Helper to pick random items from an array
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    // Helper to get 3 unique random points
    const getPoints = (arr: string[], count: number) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Construct English Content (Default)
    const enTitleTemplate = pick(BOT_PHRASES.en.titles);
    const enTitle = enTitleTemplate.replace("{region}", region).replace("{topic}", topic);
    
    const enOpener = pick(BOT_PHRASES.en.openers).replace("{region}", region).replace("{topic}", topic);
    const enPoints = getPoints(BOT_PHRASES.en.points, 3);
    const enCloser = pick(BOT_PHRASES.en.closers);
    
    // Construct the "Key Highlights" format
    const enContent = `${enOpener}\n\n**Key Highlights:**\n1. ${enPoints[0]}\n2. ${enPoints[1]}\n3. ${enPoints[2]}\n\n${enCloser}`;

    // Construct Chinese Content (Translation)
    const zhTitleTemplate = pick(BOT_PHRASES.zh.titles);
    const zhTitle = zhTitleTemplate.replace("{region}", region).replace("{topic}", topic);
    
    const zhOpener = pick(BOT_PHRASES.zh.openers).replace("{region}", region).replace("{topic}", topic);
    const zhPoints = getPoints(BOT_PHRASES.zh.points, 3); // Independent random points to simulate different phrasing or just map via index if strict translation needed (here independent is fine for demo)
    const zhCloser = pick(BOT_PHRASES.zh.closers);

    const zhContent = `${zhOpener}\n\n**重點摘要：**\n1. ${zhPoints[0]}\n2. ${zhPoints[1]}\n3. ${zhPoints[2]}\n\n${zhCloser}`;

    const newPost: Post = {
      id: Date.now(),
      authorId: 'AI-BOT-001',
      authorName: 'AI News Robot',
      title: enTitle, // Force English
      content: enContent, // Force English, formatted with bullets
      region: region,
      topic: topic,
      likes: [],
      loves: [],
      createdAt: new Date().toISOString(),
      replies: [], 
      isBot: true,
      sourceName: source.name,
      sourceUrl: source.url,
      originalLang: 'en', // Force English Origin
      isTranslated: false,
      translation: {
        title: zhTitle,
        content: zhContent
      }
    };

    setPosts(prev => [newPost, ...prev]);
    await supabase.from('posts').insert(newPost); 
  };

  // --- ACTIONS ---

  const register = (userData: Partial<User>) => {
    const newUser: User = {
      id: `HKER-${Math.floor(Math.random() * 900000) + 100000}`,
      name: userData.name || 'User',
      email: userData.email || '',
      password: userData.password,
      points: 8888, 
      role: ADMIN_EMAILS.includes(userData.email || '') ? 'admin' : 'user',
      starLevel: 0,
      joinedAt: new Date().toISOString(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      solAddress: userData.solAddress,
      phone: userData.phone,
      address: userData.address,
      gender: userData.gender
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    supabase.from('users').insert(newUser);
  };

  const login = (email: string, password: string) => {
    const user = users.find((u: User) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const adminUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === userId) setCurrentUser({ ...currentUser, ...updates });
    supabase.from('users').update(updates).eq('id', userId);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser && currentUser.id === userId) logout();
    supabase.from('users').delete().eq('id', userId);
  };

  const updatePoints = (userId: string, amount: number) => {
    let newPoints = 0;
    setUsers(prevUsers => {
        return prevUsers.map(u => {
            if (u.id === userId) {
                newPoints = Math.max(0, u.points + amount);
                if (currentUser && currentUser.id === userId) {
                    setCurrentUser(curr => curr ? { ...curr, points: newPoints } : null);
                }
                return { ...u, points: newPoints };
            }
            return u;
        });
    });
    supabase.from('users').update({ points: newPoints }).eq('id', userId);
  };

  const createPost = (postData: Partial<Post>) => {
    alert("系統公告：目前僅限機械人發貼 (System Notice: Posting is currently restricted to Bots only).");
    return;
  };

  const deletePost = (postId: number) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    supabase.from('posts').delete().eq('id', postId);
  };

  const addReply = (postId: number, content: string) => {
    alert("系統公告：目前已關閉回覆功能 (System Notice: Replying is currently disabled).");
    return;
  };

  const toggleLike = (postId: number, type: 'like' | 'love') => {
    if (!currentUser) return false;
    let success = false;
    let updatedPost: Post | null = null;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const list = type === 'like' ? p.likes : p.loves;
        const userCount = list.filter(id => id === currentUser.id).length;
        
        if (userCount < 3) {
          const newList = [...list, currentUser.id];
          success = true;
          updatedPost = type === 'like' ? { ...p, likes: newList } : { ...p, loves: newList };
          if (success) updatePoints(currentUser.id, 150); 
          return updatedPost;
        }
        return p; 
      }
      return p;
    }));
    if(updatedPost) supabase.from('posts').update(updatedPost).eq('id', postId);
    return success;
  };

  const toggleTranslation = (postId: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, isTranslated: !p.isTranslated };
    }));
  };

  return (
    <DataContext.Provider value={{
      users, currentUser, posts, visitorLogs,
      register, login, logout,
      adminUpdateUser, deleteUser,
      createPost, deletePost, addReply, toggleLike,
      updatePoints, toggleTranslation
    }}>
      {children}
    </DataContext.Provider>
  );
};
