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
  login: (email: string, password: string) => Promise<boolean>;
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

// --- AI BOT 保持不變 ---
const BOT_SOURCES = [{ name: "HK Global News", url: "https://news.hk-global.com" }, { name: "Tech Daily", url: "https://techdaily.io" }, { name: "World Finance", url: "https://finance.world.org" }, { name: "Community Buzz", url: "https://community.buzz" }];
const BOT_PHRASES = { en: { titles: ["{region} {topic} Update: Key Developments", "Analysis: The Future of {topic} in {region}", "Breaking: Major {topic} Shift in {region}", "Weekly Report: {region}'s {topic} Trends"], openers: ["Recent reports indicate significant developments regarding {topic} in {region}. Analysts are closely monitoring the situation as new data emerges.", "A major shift is occurring in the {topic} sector within {region}. Stakeholders are advising caution as the landscape evolves.", "Breaking news from {region} highlights a turning point for {topic}. The community has expressed mixed reactions to these changes.", "According to recent sources, {region} is poised for a transformation in {topic}. Here is a summary of the key events."], points: ["Local authorities have proposed new guidelines to streamline operations and improve efficiency.", "Market data suggests a significant increase in activity, with experts predicting a 15% growth next quarter.", "Concerns have been raised regarding sustainability, prompting a review of current practices.", "Several key industry leaders have announced a strategic partnership to address emerging challenges.", "Public feedback indicates a strong demand for more transparency and faster implementation.", "Financial analysts warn of potential short-term volatility, though the long-term outlook remains positive.", "Innovative technologies are being deployed to solve persistent issues in the sector."], closers: ["We will continue to monitor these developments and provide updates as they become available.", "This marks a significant milestone, and its impact will likely be felt for months to come.", "Experts recommend that residents stay informed and prepare for potential changes in regulations.", "The situation is developing rapidly; stay tuned for our follow-up analysis."] }, zh: { titles: ["{region} {topic} 更新：重點發展", "分析：{region} {topic} 的未來", "突發：{region} {topic} 出現重大轉變", "週報：{region} {topic} 趨勢"], openers: ["最新報告顯示，{region}在{topic}方面有顯著發展。隨著新數據的出現，分析師正密切關注局勢。", "{region}的{topic}領域正在發生重大轉變。隨著形勢的發展，利益相關者建議謹慎行事。", "來自{region}的突發新聞凸顯了{topic}的轉折點。社區對這些變化反應不一。", "據最新消息來源，{region}的{topic}正準備轉型。以下是關鍵事件的摘要。"], points: ["當局已提出新指引，旨在簡化運作流程並提高效率。", "市場數據顯示活動顯著增加，專家預測下季度將增長 15%。", "人們對可持續性提出了擔憂，促使對當前做法進行審查。", "幾位主要行業領袖已宣布建立戰略合作夥伴關係，以應對新出現的挑戰。", "公眾反饋表明，人們強烈要求提高透明度和加快實施速度。", "金融分析師警告短期內可能出現波動，但長期前景依然看好。", "正在部署創新技術以解決該行業存在的長期問題。"], closers: ["我們將繼續關注這些發展，並在有消息時提供更新。", "這標誌著一個重要的里程碑，其影響可能會持續數月。", "專家建議居民隨時了解情況，並為法規的潛在變化做好準備。", "局勢發展迅速；請留意我們的後續分析。"] } };

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog>({});
  const botIntervalRef = useRef<number | null>(null);

  // --- 重大修改：從 Supabase 加載數據，不再信任 localStorage ---
  useEffect(() => {
    const initAppData = async () => {
      // 1. 從 Supabase 抓取所有用戶 (解決電腦手機不互通問題)
      const { data: dbUsers, error: uError } = await supabase.from('users').select('*');
      if (dbUsers) setUsers(dbUsers);

      // 2. 從 Supabase 抓取所有貼文
      const { data: dbPosts, error: pError } = await supabase.from('posts').select('*').order('createdAt', { ascending: false });
      if (dbPosts) setPosts(dbPosts);

      // 3. 處理登入狀態 (僅 Session 保留在本地)
      const savedSession = localStorage.getItem('hker_session_user');
      if (savedSession && dbUsers) {
        const sessionObj = JSON.parse(savedSession);
        const userInDb = dbUsers.find(u => u.id === sessionObj.id);
        if (userInDb) setCurrentUser(userInDb);
      }
    };

    initAppData();

    // 實時監聽：任何人註冊或發文，所有設備同步更新
    const channel = supabase.channel('realtime_forum')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'INSERT') setPosts(prev => [payload.new as Post, ...prev]);
        if (payload.eventType === 'DELETE') setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        if (payload.eventType === 'UPDATE') setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Post : p));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setUsers(prev => {
            const exists = prev.find(u => u.id === payload.new.id);
            if (exists) return prev.map(u => u.id === payload.new.id ? payload.new as User : u);
            return [...prev, payload.new as User];
          });
          // 如果是當前用戶資料更新，同步更新狀態
          if (currentUser && currentUser.id === payload.new.id) setCurrentUser(payload.new as User);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  // --- 機器人邏輯保持 ---
  useEffect(() => {
    botIntervalRef.current = window.setInterval(() => { generateBotPost(); }, 60000); 
    return () => { if (botIntervalRef.current) clearInterval(botIntervalRef.current); };
  }, []);

  const generateBotPost = async () => {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const source = BOT_SOURCES[Math.floor(Math.random() * BOT_SOURCES.length)];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const getPoints = (arr: string[], count: number) => [...arr].sort(() => 0.5 - Math.random()).slice(0, count);

    const enTitle = pick(BOT_PHRASES.en.titles).replace("{region}", region).replace("{topic}", topic);
    const enContent = `${pick(BOT_PHRASES.en.openers).replace("{region}", region).replace("{topic}", topic)}\n\n**Key Highlights:**\n1. ${getPoints(BOT_PHRASES.en.points, 3).join("\n2. ")}\n\n${pick(BOT_PHRASES.en.closers)}`;
    const zhTitle = pick(BOT_PHRASES.zh.titles).replace("{region}", region).replace("{topic}", topic);
    const zhContent = `${pick(BOT_PHRASES.zh.openers).replace("{region}", region).replace("{topic}", topic)}\n\n**重點摘要：**\n1. ${getPoints(BOT_PHRASES.zh.points, 3).join("\n2. ")}\n\n${pick(BOT_PHRASES.zh.closers)}`;

    const newPost: Post = {
      id: Date.now(), authorId: 'AI-BOT-001', authorName: 'AI News Robot',
      title: enTitle, content: enContent, region, topic,
      likes: [], loves: [], createdAt: new Date().toISOString(), replies: [],
      isBot: true, sourceName: source.name, sourceUrl: source.url,
      originalLang: 'en', isTranslated: false,
      translation: { title: zhTitle, content: zhContent }
    };
    await supabase.from('posts').insert(newPost);
  };

  // --- ACTIONS 修改：確保數據先上雲端 ---

  const register = async (userData: Partial<User>) => {
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
      solAddress: userData.solAddress, phone: userData.phone, address: userData.address, gender: userData.gender
    };
    
    const { error } = await supabase.from('users').insert(newUser);
    if (!error) {
      setCurrentUser(newUser);
      localStorage.setItem('hker_session_user', JSON.stringify(newUser));
    } else {
      alert("註冊失敗，請重試");
    }
  };

  const login = async (email: string, password: string) => {
    // 登入時直接查 Supabase
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
    if (data) {
      setCurrentUser(data);
      localStorage.setItem('hker_session_user', JSON.stringify(data));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hker_session_user');
  };

  const updatePoints = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newPoints = Math.max(0, user.points + amount);
    await supabase.from('users').update({ points: newPoints }).eq('id', userId);
  };

  const toggleLike = (postId: number, type: 'like' | 'love') => {
    if (!currentUser) return false;
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    const list = type === 'like' ? [...post.likes, currentUser.id] : [...post.loves, currentUser.id];
    const updatedPost = type === 'like' ? { ...post, likes: list } : { ...post, loves: list };
    
    supabase.from('posts').update(updatedPost).eq('id', postId);
    updatePoints(currentUser.id, 150);
    return true;
  };

  // 其餘管理功能...
  const adminUpdateUser = (userId: string, updates: Partial<User>) => supabase.from('users').update(updates).eq('id', userId);
  const deleteUser = (userId: string) => supabase.from('users').delete().eq('id', userId);
  const deletePost = (postId: number) => supabase.from('posts').delete().eq('id', postId);
  const toggleTranslation = (postId: number) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, isTranslated: !p.isTranslated } : p));
  const createPost = () => alert("目前僅限機械人發貼");
  const addReply = () => alert("留言功能關閉中");

  return (
    <DataContext.Provider value={{
      users, currentUser, posts, visitorLogs,
      register, login, logout, adminUpdateUser, deleteUser,
      createPost, deletePost, addReply, toggleLike, updatePoints, toggleTranslation
    }}>
      {children}
    </DataContext.Provider>
  );
};