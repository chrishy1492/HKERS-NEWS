
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
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false);

  // 1. 核心修復：更嚴謹的用戶資料獲取，防止積分被錯誤重置
  const fetchUserProfile = useCallback(async (userId: string, email?: string, metadata?: any) => {
    try {
      // 使用 maybeSingle() 安全地獲取單條記錄
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Database Error:", error.message);
        // CRITICAL FIX: 遇到資料庫錯誤時，不要自動設置為 88888 的 Fallback Profile。
        // 這會導致用戶看到錯誤的積分。應該保持 loading 或顯示錯誤提示，等待重試。
        if (!userProfile) { 
            // 僅在完全無資料時顯示一個最小化的錯誤狀態，而不是偽造數據
            console.warn("Retrying fetch in 3s...");
            setTimeout(() => fetchUserProfile(userId, email, metadata), 3000);
        }
        return; 
      }

      if (!data) {
        // CASE: 用戶不存在 (Data is null, Error is null) -> 這是真正的新用戶
        console.log("New user detected, initializing generic profile...");
        const newProfile: any = {
          id: userId,
          email: email || '',
          role: ADMIN_EMAILS.includes(email || '') ? 'admin' : 'user',
          points: 88888, // 僅限新用戶的初始積分 (Welcome Bonus)
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
          console.error("Initialization insert failed:", insertError);
        }
      } else {
        // CASE: 用戶存在 -> 使用資料庫中的真實積分
        // 這裡絕不覆蓋為 88888
        setUserProfile(data);
      }
    } catch (error: any) {
      console.error("Critical Profile System Error:", error);
    } finally {
      setLoading(false);
    }
  }, []); // Remove userProfile from dependency to avoid loops

  useEffect(() => {
    // Auth Listener
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
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // 2. 核心修復：積分更新引擎 (Point Engine)
  // 支援正數(獲勝)與負數(下注/提幣)
  const updatePoints = async (amount: number) => {
    if (!userProfile || isUpdatingPoints) return;
    
    // 樂觀更新 (Optimistic Update) - 讓 UI 立即反應，提升遊戲體驗
    // 使用 callback 確保基於最新 state 進行計算
    let previousPoints = 0;
    setUserProfile(prev => {
        if (!prev) return null;
        previousPoints = prev.points;
        return { ...prev, points: prev.points + amount };
    });

    // 異步寫入資料庫
    try {
      // 為了數據一致性，我們不直接寫入計算後的值，而是依賴數據庫的當前值+增量 (如果可以寫 SQL Function 最好)
      // 但在標準客戶端環境，我們先做一個 Check-and-Set
      
      const { data: latestData, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userProfile.id)
        .single();

      if (fetchError || !latestData) throw new Error("Sync failed");

      const newDbPoints = latestData.points + amount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: newDbPoints })
        .eq('id', userProfile.id);

      if (updateError) {
        throw updateError;
      }
      
      // 如果數據庫更新成功，確保本地狀態與 DB 完全同步 (避免漂移)
      setUserProfile(prev => prev ? { ...prev, points: newDbPoints } : null);

    } catch (err: any) {
      console.error("Points Transaction Failed:", err.message);
      // 交易失敗，回滾 UI
      setUserProfile(prev => prev ? { ...prev, points: previousPoints } : null);
      alert("網絡不穩，積分更新失敗，已自動還原。");
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
        <h1 className="text-2xl font-bold tracking-tight text-white tech-font">HKER News Platform</h1>
        <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-[10px]">Syncing HKER Ledger...</p>
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
