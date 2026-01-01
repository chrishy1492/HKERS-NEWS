import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; 

// 1. 定義資料結構（必須與 Supabase 欄位完全對應）
interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  role: string;
  joinedAt: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

interface Post {
  id: number;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
  likes: string[];
}

interface DataContextType {
  users: User[];
  posts: Post[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. 從 Supabase 雲端抓取資料 (解決手機看不到人的問題)
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 抓取雲端會員名單
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('joinedAt', { ascending: false });
      if (userError) throw userError;
      if (userData) setUsers(userData as User[]);

      // 抓取雲端貼文名單
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });
      if (postError) throw postError;
      if (postData) setPosts(postData as Post[]);

    } catch (error) {
      console.error('Supabase 連線失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. 核心功能：實時監聽 (解決手機電腦不互通、不更新的問題)
  useEffect(() => {
    fetchData();

    // 監聽 Users 表格變動
    const userSubscription = supabase
      .channel('realtime-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        console.log('雲端會員資料已更新，正在同步 App...');
        fetchData(); // 只要有人在電腦註冊，手機會立刻收到訊號並重新抓取
      })
      .subscribe();

    // 監聽 Posts 表格變動
    const postSubscription = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(postSubscription);
    };
  }, []);

  return (
    <DataContext.Provider value={{ users, posts, loading, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData 必須在 DataProvider 內使用');
  return context;
};