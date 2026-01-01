import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; // 請確保路徑正確指向您的 supabaseClient

// 定義資料類型
interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  role: string;
  joinedAt: string;
  lastActive?: string;
  avatar?: string;
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

  // 1. 從 Supabase 抓取所有資料的函數
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 抓取會員資料 (解決管理員看不到人的問題)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('joinedAt', { ascending: false });

      if (userError) throw userError;
      if (userData) setUsers(userData as User[]);

      // 抓取貼文資料
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });

      if (postError) throw postError;
      if (postData) setPosts(postData as Post[]);

    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. 初始化與實時監聽 (Realtime)
  useEffect(() => {
    fetchData();

    // 設定實時監聽：當雲端資料庫有任何變動，立即更新 App 畫面 (解決同步問題)
    const userChannel = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        console.log('Users table changed, refreshing...');
        fetchData();
      })
      .subscribe();

    const postChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        console.log('Posts table changed, refreshing...');
        fetchData();
      })
      .subscribe();

    // 清除監聽器
    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(postChannel);
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
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};