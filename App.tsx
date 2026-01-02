
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageCircle, Coins, LogOut, Loader2, Gamepad2, 
  Shield, User, Settings, Info, Search, Menu, X,
  ExternalLink, Sparkles, Database, Code, AlertTriangle
} from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, ADMIN_EMAILS, AVATARS } from './constants';
import { UserProfile, AppView, ForumSubView, Session } from './types';

import ForumApp from './components/Forum/ForumApp';
import TokenApp from './components/Token/TokenDashboard';
import LandingPage from './components/LandingPage';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, email?: string, metadata?: any) => {
    try {
      // 使用 maybeSingle() 避免拋出錯誤，更穩健地檢查用戶是否存在
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Database connection error:", error.message);
        // 如果是連接錯誤，不要重置資料，保持 loading 或顯示錯誤
        // 這裡我們選擇不操作，避免覆蓋用戶數據
        return; 
      }

      if (!data) {
        // 確認無資料 -> 初始化新用戶
        console.log("New user detected, initializing profile...");
        const newProfile: any = {
          id: userId,
          email: email || '',
          role: ADMIN_EMAILS.includes(email || '') ? 'admin' : 'user',
          points: 88888, // 僅限新用戶的初始積分
          nickname: metadata?.nickname || 'HKER_' + Math.floor(Math.random() * 10000),
          avatar_url: metadata?.avatar_url || AVATARS[Math.floor(Math.random() * AVATARS.length)],
          full_name: metadata?.full_name || '',
          phone: metadata?.phone || '',
          physical_address: metadata?.physical_address || '',
          gender: metadata?.gender || 'Secret',
          sol_address: metadata?.sol_address || '',
          created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
        
        if (!insertError) {
          setUserProfile(newProfile as UserProfile);
        } else {
          console.error("Initialization failed:", insertError);
        }
      } else {
        // 成功讀取現有資料，絕不重置積分
        setUserProfile(data);
      }
    } catch (error: any) {
      console.error("Critical Profile Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session) {
        // 當 Session 改變時，重新抓取資料
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const updatePoints = async (amount: number) => {
    if (!userProfile) return;
    
    // 1. 本地樂觀更新 (Optimistic Update)
    const newPoints = (userProfile.points || 0) + amount;
    setUserProfile(prev => prev ? { ...prev, points: newPoints } : null);

    // 2. 寫入數據庫
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', userProfile.id);

      if (error) {
        console.error("Points sync failed:", error.message);
        // 如果失敗，可以在這裡考慮回滾，或是依賴下次 fetch 校正
      }
    } catch (err) {
      console.error("Connection error during point update");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setView(AppView.LANDING);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h1 className="text-2xl font-bold tracking-tight text-white tech-font">Lion Rock Nexus</h1>
        <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-[10px]">Initializing Community Hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300">
      {view === AppView.LANDING ? (
        <LandingPage setView={setView} />
      ) : view === AppView.FORUM ? (
        <ForumApp 
          supabase={supabase}
          session={session} 
          userProfile={userProfile} 
          updatePoints={updatePoints}
          setView={setView}
          refreshProfile={() => session && fetchUserProfile(session.user.id, session.user.email)}
          onLogout={handleLogout}
        />
      ) : (
        <TokenApp 
          supabase={supabase}
          session={session}
          userProfile={userProfile}
          updatePoints={updatePoints}
          setView={setView}
        />
      )}
    </div>
  );
}
