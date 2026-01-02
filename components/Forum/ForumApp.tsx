
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, Search, Menu, X, Gamepad2, Shield, User, Coins, 
  Sparkles, Globe, Settings, Bell, CreditCard, ChevronDown, Hand, Compass, Zap, Flame, Cpu, ArrowLeft
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
import { scoutAutomatedNews } from '../../services/gemini';
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

const ForumApp: React.FC<ForumAppProps> = ({ 
  supabase, session, userProfile, updatePoints, setView, refreshProfile, onLogout
}) => {
  const [subView, setSubView] = useState<ForumSubView>(ForumSubView.FEED);
  const [region, setRegion] = useState('All');
  const [topic, setTopic] = useState('All'); // 默認設置為 All (全部主題)
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // --- 自動發帖引擎 (Engineering Fix: Robust Interval & Content Consistency) ---
  useEffect(() => {
    // 定義機械人工作邏輯
    const runBot = async () => {
      // 只有在有 session 或特殊配置下才運行，以確保 RLS 通過
      
      console.log("🤖 HKER Bot: Scouting for news...");
      
      // 隨機選擇主題與地區，模擬真實用戶興趣
      const randomRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      
      try {
        const news = await scoutAutomatedNews(randomRegion, randomTopic);
        
        if (news && news.source_url && news.title && news.summary_points) {
          const botPost = {
            title: `[${randomTopic}重點] ${news.title}`,
            content: news.summary_points, // 這裡是重點摘要，確保內容不完全複製
            author_name: "HKER_AUTO_SCOUT",
            author_avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=NexusRobot&backgroundColor=b6e3f4",
            region: randomRegion,
            topic: randomTopic,
            is_bot: true,
            is_readonly: true,
            source_name: news.source_name,
            source_url: news.source_url,
            original_lang: news.lang,
            likes: 0,
            hearts: 0,
            // CRITICAL FIX: Attach current user ID if available to pass RLS 'Authenticated' policies
            user_id: session?.user?.id || null 
          };
          
          const { error } = await supabase.from('posts').insert([botPost]);
          if (error) {
            console.error("🤖 Bot Post Error:", error.message, error.details || '');
          } else {
            console.log("🤖 Bot Posted Successfully:", news.title);
          }
        } else {
           console.log("🤖 Bot: No valid news found or incomplete data.");
        }
      } catch (err: any) {
        console.error("🤖 Bot Critical Failure:", err.message || err);
      }
    };

    // 1. 組件掛載後 5 秒立即執行一次
    const initialTimer = setTimeout(runBot, 5000);

    // 2. 設定循環定時器 (每 120 秒執行一次，給予 AI 足夠時間生成高質量改寫內容)
    const newsInterval = setInterval(runBot, 120000); 

    return () => {
      clearTimeout(initialTimer);
      clearInterval(newsInterval);
    };
  }, [supabase, session]); // Add session to dependency array

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
              <span className="font-black text-2xl text-slate-900 tracking-tighter hidden sm:block italic">HKER NEXUS</span>
            </div>
            
            {showBackButton && (
              <button onClick={handleBack} className="ml-4 flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full text-xs font-black text-slate-600 hover:bg-slate-200 transition-all">
                <ArrowLeft size={14} /> 返回中樞
              </button>
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
               <span className="font-bold text-lg">Nexus Menu</span>
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
          {subView === ForumSubView.GAMES_HUB && <Casino userProfile={userProfile} updatePoints={updatePoints} onSelectGame={setSubView} />}
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
