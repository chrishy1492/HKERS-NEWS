
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
        console.warn("Database connection/schema warning:", error.message);
        
        // 嚴重錯誤處理：如果資料庫完全找不到 profiles 表格 (Schema 錯誤)
        // 我們手動構建一個臨時 Profile，讓 App 仍然可以運作 (Read-Only 模式或 Local 模式)
        if (error.message.includes('Could not find the table') || error.code === 'PGRST204') {
             console.log("⚠️ Schema Error: Using session metadata as fallback profile.");
             const fallbackProfile: any = {
                id: userId,
                email: email || '',
                role: ADMIN_EMAILS.includes(email || '') ? 'admin' : 'user',
                points: 88888, // 臨時積分
                nickname: metadata?.nickname || email?.split('@')[0] || 'Member',
                avatar_url: metadata?.avatar_url || AVATARS[Math.floor(Math.random() * AVATARS.length)],
                created_at: new Date().toISOString()
             };
             setUserProfile(fallbackProfile);
             return; // 終止後續 DB 操作
        }
        
        // 其他連接錯誤
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
          // Insert 失敗也使用 fallback 顯示
          setUserProfile(newProfile as UserProfile);
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

    // 2. 寫入數據庫 (如果表格存在)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', userProfile.id);

      if (error) {
        // 如果是表格不存在錯誤，忽略它，僅保持本地更新
        if (!error.message.includes('Could not find the table')) {
             console.error("Points sync failed:", error.message);
        }
      }
    } catch (err) {
      // Silent fail for connection issues
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
