import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; 

// 1. 定義資料結構，確保與雲端表格欄位對應
interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  role: string;
  joinedAt: string;
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

  // 2. 這是關鍵：從雲端抓取資料，不再依賴本地快取
  const fetchData = async () => {
    try {
      setLoading(true);
      // 抓取雲端會員
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('joinedAt', { ascending: false });
      if (userError) throw userError;
      setUsers(userData || []);

      // 抓取雲端貼文
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });
      if (postError) throw postError;
      setPosts(postData || []);

    } catch (error) {
      console.error('數據同步失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. 實時監聽：有人註冊時，手機端會自動收到信號
  useEffect(() => {
    fetchData();

    const userSub = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        console.log('雲端有人註冊或更新，手機端同步中...');
        fetchData();
      })
      .subscribe();

    const postSub = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userSub);
      supabase.removeChannel(postSub);
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
  if (context === undefined) throw new Error('useData must be used within DataProvider');
  return context;
};