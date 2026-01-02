
import React, { useState, useEffect, useRef } from 'react';
import { Coins, Volume2, VolumeX, Gamepad2, Play, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { UserProfile, ForumSubView } from '../../types';
import FishPrawnCrab from './FishPrawnCrab';
import LittleMary from './LittleMary';
import LuckySlots from './LuckySlots';
import BlackjackAI from './BlackjackAI';
import BaccaratAI from './BaccaratAI';
import RouletteAI from './RouletteAI';

interface CasinoProps {
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  onSelectGame: (view: ForumSubView) => void;
}

const Casino: React.FC<CasinoProps> = ({ userProfile, updatePoints, onSelectGame }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'); 
      audioRef.current.loop = true;
      audioRef.current.volume = 0.2;
    }
    
    if (!isMuted) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }

    return () => audioRef.current?.pause();
  }, [isMuted]);

  const games = [
    { id: ForumSubView.ROULETTE, name: '量子脈衝輪盤', icon: '🌀', color: 'from-cyan-600 to-slate-900', desc: 'AI 物理模擬，極速結算' },
    { id: ForumSubView.BACCARAT, name: '極速百家樂', icon: '💎', color: 'from-emerald-600 to-slate-900', desc: '專業規律算法，雙倍加速' },
    { id: ForumSubView.BLACKJACK, name: '閃擊 21 點', icon: '🃏', color: 'from-indigo-600 to-slate-800', desc: '與 AI 莊家展開策略對決' },
    { id: ForumSubView.SLOTS, name: '幸運老虎機', icon: '🎰', color: 'from-amber-500 to-orange-600', desc: '經典高賠率，旋轉驚喜' },
    { id: ForumSubView.FISH_PRAWN_CRAB, name: '魚蝦蟹 (HOO HEY HOW)', icon: '🦐', color: 'from-red-600 to-slate-900', desc: '傳統民間博彩，極速開局' },
    { id: ForumSubView.LITTLE_MARY, name: '小瑪莉 (Fruit Slot)', icon: '🍎', color: 'from-pink-600 to-slate-900', desc: '復古街機經典，送燈快感' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 animate-in fade-in duration-500">
      <div className="bg-slate-950 rounded-[48px] p-8 md:p-16 text-white border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
            <div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-white to-orange-500 uppercase leading-none">
                GAME ZONE
              </h1>
              <p className="text-slate-400 font-bold mt-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                <Shield size={16} className="text-amber-500" /> Nexus Gaming Infrastructure v4.0
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/10 transition-all"
              >
                {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-amber-400" />}
              </button>
              
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 px-8 py-4 rounded-[32px] flex items-center gap-5">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                  <Coins size={24} className="text-amber-400" />
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">CREDITS</span>
                  <span className="text-2xl font-black text-white font-mono">{userProfile?.points?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map(game => (
              <button 
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className={`relative group p-8 rounded-[40px] bg-gradient-to-br ${game.color} border border-white/10 shadow-xl transition-all hover:scale-105 active:scale-95 overflow-hidden text-left h-full flex flex-col justify-between`}
              >
                <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform -mr-4 -mt-4">{game.icon}</div>
                <div>
                  <div className="text-4xl bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner mb-6">
                    {game.icon}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight leading-tight">{game.name}</h3>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-2 leading-relaxed">{game.desc}</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                  <Play size={12} fill="white" /> 立即開局 / START
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Casino;
