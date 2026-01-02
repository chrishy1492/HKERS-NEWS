
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
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (userId: string, email?: string, metadata?: any) => {
    try {
      // 1. 嘗試讀取檔案
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // 如果錯誤訊息包含 "schema cache" 或 "not found"，代表資料表可能未建立
        if (error.message.includes('profiles') && (error.message.includes('cache') || error.message.includes('find'))) {
          throw new Error('DATABASE_TABLE_MISSING');
        }
        if (error.code !== 'PGRST116') throw error;
      }

      if (data) {
        setUserProfile(data);
      } else {
        // 2. 如果檔案不存在，則進行初始化 (註冊後首次登入)
        // 從 metadata 中提取註冊時填寫的詳細資料
        const newProfile: any = {
          id: userId,
          email: email || '',
          role: ADMIN_EMAILS.includes(email || '') ? 'admin' : 'user',
          points: 88888,
          nickname: metadata?.nickname || 'HKER_' + Math.floor(Math.random() * 10000),
          avatar_url: metadata?.avatar_url || AVATARS[Math.floor(Math.random() * AVATARS.length)],
          full_name: metadata?.full_name || '',
          phone: metadata?.phone || '',
          physical_address: metadata?.physical_address || '',
          gender: metadata?.gender || 'Secret',
          sol_address: metadata?.sol_address || '',
          created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase.from('profiles').upsert([newProfile]);
        
        if (insertError) {
          console.error("Profile initialization failed:", insertError.message);
          // 嘗試最小化寫入 (Fallback)
          const minimalProfile = { 
            id: userId, 
            email: email || '', 
            nickname: newProfile.nickname, 
            points: 88888,
            role: newProfile.role
          };
          const { error: minError } = await supabase.from('profiles').upsert([minimalProfile]);
          if (!minError) setUserProfile(minimalProfile as any);
        } else {
          setUserProfile(newProfile as UserProfile);
        }
      }
    } catch (error: any) {
      console.error("Critical User Profile Error:", error);
      if (error.message === 'DATABASE_TABLE_MISSING') {
        setDbError('請在 Supabase SQL Editor 中建立 "profiles" 資料表。');
      } else {
        setDbError(error.message || "初始化失敗，請檢查資料庫連線。");
      }
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
    const newPoints = (userProfile.points || 0) + amount;
    setUserProfile({ ...userProfile, points: newPoints });

    const { error } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userProfile.id);

    if (error) {
      console.error("Points update failed:", error.message);
    }
  };

  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white font-sans">
        <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-[40px] p-10 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
            <Database className="text-red-500" size={40} />
          </div>
          <h1 className="text-4xl font-black mb-4 tech-font tracking-tight">資料表缺失</h1>
          <p className="text-slate-400 mb-8 leading-relaxed font-medium">偵測到資料庫中缺少 <code className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">public.profiles</code> 資料表。請執行以下 SQL 以完成初始化：</p>
          
          <div className="bg-black/50 rounded-2xl p-6 font-mono text-[11px] text-blue-300 border border-white/5 mb-8 overflow-x-auto">
            <pre>{`create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  nickname text,
  avatar_url text,
  points bigint default 0,
  role text default 'user',
  sol_address text,
  full_name text,
  physical_address text,
  phone text,
  gender text,
  created_at timestamp with time zone default now()
);
alter table public.profiles enable row level security;
create policy "Public view" on public.profiles for select using (true);
create policy "Self update" on public.profiles for update using (auth.uid() = id);`}</pre>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            <span>我已執行 SQL，重新整理</span>
          </button>
        </div>
      </div>
    );
  }

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

// 輔助組件
const RefreshCw = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
);
