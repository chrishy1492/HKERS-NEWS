
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, Menu, X, Shield, User, Coins, 
  ArrowLeft, Cpu, Activity
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, AppView, ForumSubView, Session } from '../../types';
import Sidebar from './Sidebar';
import Feed from './Feed';
import AIChat from './AIChat';
import Casino from '../Games/Casino';
import AdminPanel from '../Admin/AdminPanel';
import UserProfileSettings from './UserProfileSettings';
import AuthModal from '../Common/AuthModal';
import FortuneAI from './FortuneAI';
import ZiWeiGame from './ZiWeiGame';
import TarotGame from './TarotGame';
import DigitalPrayer from './DigitalPrayer';
import FortuneTeller from './FortuneTeller';
import FortuneHub from './FortuneHub';
import HKERLogo from '../Common/HKERLogo';
import { scoutAutomatedNews, logBotActivity } from '../../services/gemini';
import { REGIONS, TOPICS } from '../../constants';

// 遊戲組件
import FishPrawnCrab from '../Games/FishPrawnCrab';
import LittleMary from '../Games/LittleMary';
import LuckySlots from '../Games/LuckySlots';
import BlackjackAI from '../Games/BlackjackAI';
import BaccaratAI from '../Games/BaccaratAI';
import RouletteAI from '../Games/RouletteAI';

interface ForumAppProps {
  supabase: SupabaseClient;
  session: Session | null;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  setView: (view: AppView) => void;
  refreshProfile: () => void;
  onLogout?: () => void;
}

// Bot Settings
const BOT_COOLDOWN_MS = 60 * 1000; // 60 Seconds
const BOT_STORAGE_KEY = 'hker_bot_last_pulse';

const ForumApp: React.FC<ForumAppProps> = ({ 
  supabase, session, userProfile, updatePoints, setView, refreshProfile, onLogout
}) => {
  const [subView, setSubView] = useState<ForumSubView>(ForumSubView.FEED);
  const [region, setRegion] = useState('All');
  const [topic, setTopic] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Audio State for Games
  const [isMuted, setIsMuted] = useState(false);

  // Bot Status
  const [botStatus, setBotStatus] = useState<'IDLE' | 'SCOUTING' | 'COOLDOWN'>('IDLE');

  const sessionRef = useRef(session);
  const isBotProcessingRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // --- 核心修復：符合新 SQL 架構的機械人邏輯 (v10.1 SQL-Compliant) ---
  useEffect(() => {
    const runBotLogic = async () => {
      // 1. 權限檢查：必須有 Session 才能執行 Supabase 寫入
      if (!sessionRef.current) {
         setBotStatus('IDLE');
         return;
      }
      
      if (isBotProcessingRef.current) return;

      try {
        isBotProcessingRef.current = true;
        
        // 2. 檢查數據庫最後 "BOT" 發貼時間 (Source of Truth)
        // 修復：只檢查 is_bot = true 的貼文，避免因為人類剛發文而導致機械人一直被重置
        const { data: lastPosts, error } = await supabase
          .from('posts')
          .select('created_at')
          .eq('is_bot', true) // CRITICAL FIX: Ensure we only check bot cadence
          .order('created_at', { ascending: false })
          .limit(1);

        let lastTime = 0;
        if (!error && lastPosts && lastPosts.length > 0) {
          lastTime = new Date(lastPosts[0].created_at).getTime();
        }

        // 3. 檢查 LocalStorage (Client Throttle)
        const lastLocal = parseInt(localStorage.getItem(BOT_STORAGE_KEY) || '0');
        const now = Date.now();
        const effectiveLastTime = Math.max(lastTime, lastLocal);
        const timeDiff = now - effectiveLastTime;

        if (timeDiff > BOT_COOLDOWN_MS) {
          console.log(`🤖 HKER Bot: Engaging SQL Protocol... (Last: ${new Date(effectiveLastTime).toLocaleTimeString()})`);
          setBotStatus('SCOUTING');
          
          // 預先鎖定，防止雙重觸發
          localStorage.setItem(BOT_STORAGE_KEY, now.toString());

          const randomRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
          const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
          
          // A. 獲取數據
          const newsData = await scoutAutomatedNews(randomRegion, randomTopic);

          if (newsData && newsData.title) {
            // B. 構建符合 SQL Schema 的物件
            // CRITICAL FIX: 加入 user_id，確保符合 RLS 規範
            const botPost = {
              title: `[${randomTopic}速遞] ${newsData.title}`,
              summary: newsData.summary,              
              content_snippet: newsData.content_snippet, 
              original_url: newsData.original_url,    
              source_name: newsData.source_name,
              region: randomRegion,
              topic: randomTopic,
              is_bot: true,
              allow_comments: false,                  
              language: newsData.language,
              user_id: sessionRef.current.user.id, // Must attribute to current logged in user (who acts as the bot runner)
              author_name: "HKER AI Bot",
              author_avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=HKER_Bot"
            };

            // C. 寫入 Posts 表
            const { data: insertedPost, error: insertError } = await supabase.from('posts').insert([botPost]).select();
            
            if (insertError) {
              console.error("🤖 Bot Insert Error:", insertError.message);
              
              // 記錄失敗日誌
              await logBotActivity(supabase, { ...botPost, error: insertError.message }, 'failed');
              
              // 若是 Unique Constraint (URL重複) 以外的錯誤，縮短冷卻時間以便重試
              if (!insertError.message.includes('unique') && !insertError.message.includes('duplicate')) {
                 localStorage.setItem(BOT_STORAGE_KEY, (now - BOT_COOLDOWN_MS + 10000).toString()); // Retry in 10s
              }
            } else {
              console.log("🤖 Bot: SQL Insert Success.");
              // D. 同步寫入成功日誌
              await logBotActivity(supabase, insertedPost ? insertedPost[0] : botPost, 'success');
            }
          } else {
            console.log("🤖 Bot: No content found (Gemini Limit or Parse Error).");
            // 失敗也更新時間，避免 API 頻繁請求 (Backoff)
            localStorage.setItem(BOT_STORAGE_KEY, (now - BOT_COOLDOWN_MS + 20000).toString());
          }
        } else {
            setBotStatus('COOLDOWN');
        }
      } catch (err) {
        console.error("🤖 Bot Logic Exception:", err);
      } finally {
        isBotProcessingRef.current = false;
        setTimeout(() => {
             // 只有當沒有在運行時才切換回 COOLDOWN 狀態顯示
             if (!isBotProcessingRef.current) setBotStatus('COOLDOWN');
        }, 2000);
      }
    };

    // 初始運行
    runBotLogic();
    // 設置定時器，每 20 秒檢查一次是否需要發貼
    const intervalId = setInterval(runBotLogic, 20 * 1000);

    return () => {
        clearInterval(intervalId);
        isBotProcessingRef.current = false;
    };
  }, []);

  const isAdmin = userProfile?.role === 'admin';
  const showBackButton = ![ForumSubView.FEED, ForumSubView.GAMES_HUB, ForumSubView.FORTUNE_HUB, ForumSubView.AI_CHAT, ForumSubView.ADMIN].includes(subView);

  const handleBack = () => {
    if ([ForumSubView.FORTUNE_AI, ForumSubView.PRAYER, ForumSubView.ZIWEI, ForumSubView.TAROT, ForumSubView.FORTUNE_TELLER].includes(subView)) {
      setSubView(ForumSubView.FORTUNE_HUB);
    } else {
      setSubView(ForumSubView.GAMES_HUB);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <header className="bg-white border-b border-slate-200 z-30 sticky top-0 flex-shrink-0 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setView(AppView.LANDING)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2">
              <LogOut size={20} className="rotate-180"/>
              <span className="hidden sm:inline text-xs font-bold uppercase">Exit App</span>
            </button>
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => { setSubView(ForumSubView.FEED); setTopic('All'); setRegion('All'); }}>
              <HKERLogo size={36} className="group-hover:rotate-12 transition-transform" />
              <span className="font-black text-2xl text-slate-900 tracking-tighter hidden sm:block italic">HKER News Platform</span>
            </div>
            
            {showBackButton && (
              <button onClick={handleBack} className="ml-4 flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full text-xs font-black text-slate-600 hover:bg-slate-200 transition-all">
                <ArrowLeft size={14} /> 返回中樞
              </button>
            )}

            {/* 機械人狀態指示燈 */}
            {session && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 ml-4" title="AI Bot Status">
                    <Cpu size={14} className={`transition-colors ${botStatus === 'SCOUTING' ? 'text-blue-500 animate-spin' : 'text-slate-300'}`} />
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                        {botStatus === 'SCOUTING' ? 'AI SCOUTING...' : (botStatus === 'IDLE' ? 'BOT STANDBY' : 'AUTO ACTIVE')}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${botStatus === 'SCOUTING' ? 'bg-blue-500' : 'bg-green-400'} animate-pulse`}></div>
                </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {session ? (
              <div className="flex items-center gap-1 sm:gap-3">
                <div className="bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <Coins size={14} className="text-[#B91C1C]" />
                  <span className="text-xs font-black text-red-700">{userProfile?.points?.toLocaleString()}</span>
                </div>
                <button onClick={() => setSubView(ForumSubView.PROFILE)} className={`p-2 rounded-xl transition-all ${subView === ForumSubView.PROFILE ? 'bg-[#B91C1C] text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`} title="個人檔案">
                  <User size={18} />
                </button>
                {isAdmin && (
                  <button onClick={() => setSubView(ForumSubView.ADMIN)} className={`p-2 rounded-xl transition-all ${subView === ForumSubView.ADMIN ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`} title="管理員面板">
                    <Shield size={18} />
                  </button>
                )}
                {onLogout && (
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 ml-1 text-slate-600 hover:text-white hover:bg-red-600 rounded-xl transition-all font-bold text-xs uppercase"
                    title="登出帳戶"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">登出 / Logout</span>
                  </button>
                )}
              </div>
            ) : (
              <AuthModal supabase={supabase} onLogin={refreshProfile} />
            )}
            <button className="lg:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 overflow-y-auto">
          <Sidebar currentRegion={region} setRegion={setRegion} currentTopic={topic} setTopic={setTopic} setSubView={setSubView} activeSubView={subView} />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white lg:hidden overflow-y-auto pt-16 animate-in slide-in-from-right duration-300">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
               <span className="font-bold text-lg">HKER Menu</span>
               <button onClick={() => setMobileMenuOpen(false)} className="p-2"><X /></button>
             </div>
             <Sidebar currentRegion={region} setRegion={(r) => { setRegion(r); setMobileMenuOpen(false); }} currentTopic={topic} setTopic={(t) => { setTopic(t); setMobileMenuOpen(false); }} setSubView={(v) => { setSubView(v); setMobileMenuOpen(false); }} activeSubView={subView} />
             {onLogout && (
               <div className="p-4 border-t mt-4">
                 <button onClick={onLogout} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2">
                   <LogOut size={18} /> 登出帳戶 / LOGOUT
                 </button>
               </div>
             )}
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          {subView === ForumSubView.FEED && (
            <Feed supabase={supabase} session={session} region={region} topic={topic} searchTerm={searchTerm} userProfile={userProfile} updatePoints={updatePoints} />
          )}

          {subView === ForumSubView.AI_CHAT && <AIChat />}
          {subView === ForumSubView.GAMES_HUB && <Casino userProfile={userProfile} updatePoints={updatePoints} onSelectGame={setSubView} isMuted={isMuted} setIsMuted={setIsMuted} />}
          {subView === ForumSubView.FORTUNE_HUB && <FortuneHub onSelect={setSubView} />}

          {subView === ForumSubView.FORTUNE_AI && <FortuneAI userProfile={userProfile} />}
          {subView === ForumSubView.PRAYER && <DigitalPrayer userProfile={userProfile} updatePoints={updatePoints} />}
          {subView === ForumSubView.ZIWEI && <ZiWeiGame />}
          {subView === ForumSubView.TAROT && <TarotGame />}
          {subView === ForumSubView.FORTUNE_TELLER && <FortuneTeller />}

          {subView === ForumSubView.BLACKJACK && <BlackjackAI onClose={handleBack} userProfile={userProfile} updatePoints={updatePoints} isMuted={isMuted} setIsMuted={setIsMuted} />}
          {subView === ForumSubView.BACCARAT && <BaccaratAI onClose={handleBack} userProfile={userProfile} updatePoints={updatePoints} isMuted={isMuted} setIsMuted={setIsMuted} />}
          {subView === ForumSubView.ROULETTE && <RouletteAI onClose={handleBack} userProfile={userProfile} updatePoints={updatePoints} isMuted={isMuted} setIsMuted={setIsMuted} />}
          {subView === ForumSubView.SLOTS && <LuckySlots onClose={handleBack} userProfile={userProfile} updatePoints={updatePoints} isMuted={isMuted} setIsMuted={setIsMuted} />}
          {subView === ForumSubView.FISH_PRAWN_CRAB && <FishPrawnCrab onClose={handleBack} userProfile={userProfile} updatePoints={updatePoints} isMuted={isMuted} setIsMuted={setIsMuted} />}
          {subView === ForumSubView.LITTLE_MARY && <LittleMary onClose={handleBack} userProfile={userProfile} updatePoints={updatePoints} isMuted={isMuted} setIsMuted={setIsMuted} />}

          {subView === ForumSubView.PROFILE && userProfile && <UserProfileSettings supabase={supabase} userProfile={userProfile} onClose={() => setSubView(ForumSubView.FEED)} onRefresh={refreshProfile} />}
          {subView === ForumSubView.ADMIN && isAdmin && <AdminPanel supabase={supabase} />}
        </main>
      </div>
    </div>
  );
};

export default ForumApp;
