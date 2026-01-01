import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; 

// 1. 定義與 Supabase 完全一致的資料結構
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
  solAddress?: string;
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

  // 2. 從 Supabase 雲端抓取最新資料 (解決資料不互通問題)
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 獲取雲端會員
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('joinedAt', { ascending: false });
      if (userError) throw userError;
      if (userData) setUsers(userData as User[]);

      // 獲取雲端貼文
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });
      if (postError) throw postError;
      if (postData) setPosts(postData as Post[]);

    } catch (error) {
      console.error('Supabase 同步失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. 實時監聽：利用已開啟的 Realtime 2 tables 功能
  useEffect(() => {
    fetchData();

    // 監聽會員變動 (解決手機與電腦不同步問題)
    const userSubscription = supabase
      .channel('realtime-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        console.log('雲端會員資料已更新，正在同步畫面...');
        fetchData(); 
      })
      .subscribe();

    // 監聽貼文變動
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
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};