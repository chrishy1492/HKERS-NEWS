import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Post, VisitorLog } from '../types';
import { supabase } from '../lib/supabaseClient';

interface DataContextType {
  users: User[];
  currentUser: User | null;
  posts: Post[];
  visitorLogs: VisitorLog;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createPost: (postData: Partial<Post>) => Promise<void>;
  deletePost: (postId: string | number) => Promise<void>;
  toggleLike: (postId: string | number, type: 'like' | 'love') => Promise<void>;
  updatePoints: (userId: string, amount: number) => Promise<void>;
  toggleTranslation: (postId: string | number) => void;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog>({ totalVisits: 0, todayVisits: 0 });

  // 1. 初始化數據：從 Supabase 拉取
  useEffect(() => {
    fetchInitialData();

    // 2. 實時監聽 (Realtime)：當機器人發帖時自動更新 UI
    const postSubscription = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        const newPost = payload.new as Post;
        setPosts(prev => [newPost, ...prev]); // 將新新聞推送到最上方
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, []);

  const fetchInitialData = async () => {
    // 獲取貼文 (包含機器人新聞)
    const { data: postData } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false });
    if (postData) setPosts(postData);

    // 檢查 LocalStorage 是否有登錄狀態
    const savedUser = localStorage.getItem('hker_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  };

  // 登錄邏輯
  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (data && !error) {
      setCurrentUser(data);
      localStorage.setItem('hker_user', JSON.stringify(data));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hker_user');
  };

  // 創建貼文
  const createPost = async (postData: Partial<Post>) => {
    if (!currentUser) return;
    const newPost = {
      ...postData,
      author: currentUser.name,
      author_id: currentUser.id,
      timestamp: Date.now(),
      likes: [],
      loves: [],
      is_robot: false
    };

    const { error } = await supabase.from('posts').insert([newPost]);
    if (error) console.error("發帖失敗:", error);
  };

  // 點讚邏輯 (直接同步到 Supabase)
  const toggleLike = async (postId: string | number, type: 'like' | 'love') => {
    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const column = type === 'like' ? 'likes' : 'loves';
    const currentList = post[column] || [];
    const newList = currentList.includes(currentUser.id) 
      ? currentList.filter(id => id !== currentUser.id)
      : [...currentList, currentUser.id];

    // 更新本地狀態（立即反應）
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, [column]: newList } : p));

    // 同步到數據庫
    await supabase.from('posts').update({ [column]: newList }).eq('id', postId);
    
    // 增加積分
    await updatePoints(currentUser.id, 150);
  };

  const updatePoints = async (userId: string, amount: number) => {
    if (!currentUser) return;
    const newPoints = (currentUser.points || 0) + amount;
    
    setCurrentUser(prev => prev ? { ...prev, points: newPoints } : null);
    await supabase.from('users').update({ points: newPoints }).eq('id', userId);
  };

  const deletePost = async (postId: string | number) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from('posts').delete().eq('id', postId);
  };

  const toggleTranslation = (postId: string | number) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) return { ...p, isTranslated: !p.isTranslated };
      return p;
    }));
  };

  return (
    <DataContext.Provider value={{
      users, currentUser, posts, visitorLogs,
      login, logout, createPost, deletePost, 
      toggleLike, updatePoints, toggleTranslation
    }}>
      {children}
    </DataContext.Provider>
  );
};