
import React, { useState } from 'react';
import { GameType, Profile } from '../types';
import { Trophy, Coins, Play, Dice5, RotateCw, RefreshCw, ChevronRight, LayoutGrid } from 'lucide-react';
import LittleMary from './games/LittleMary';
import FishPrawnCrab from './games/FishPrawnCrab';
import SlotMachine from './games/SlotMachine';
import Blackjack from './games/Blackjack';
import Baccarat from './games/Baccarat';
import Roulette from './games/Roulette';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

const GamesHub: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  const games = [
    { type: GameType.LITTLE_MARY, name: '小瑪莉 (Little Mary)', icon: '🍒', color: 'from-pink-600 to-rose-900', hot: true },
    { type: GameType.CRAB_FISH_SHRIMP, name: '魚蝦蟹 (Fish Prawn Crab)', icon: '🦀', color: 'from-blue-600 to-indigo-900', hot: true },
    { type: GameType.SLOTS, name: '老虎機 (Slots)', icon: '🎰', color: 'from-purple-600 to-purple-900', hot: true },
    { type: GameType.BLACKJACK, name: '賭場21點 (Blackjack)', icon: '♠️', color: 'from-slate-600 to-slate-900', hot: true },
    { type: GameType.BACCARAT, name: 'AI 百家樂 (Baccarat)', icon: '🃏', color: 'from-emerald-600 to-teal-900', hot: true },
    { type: GameType.ROULETTE, name: 'AI 彈珠輪盤 (Roulette)', icon: '🎡', color: 'from-cyan-600 to-blue-900', hot: true },
  ];

  if (selectedGame === GameType.LITTLE_MARY) {
    return (
      <div className="h-full">
        <button 
          onClick={() => setSelectedGame(null)}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
        >
          <ChevronRight className="rotate-180" size={20} /> 返回遊戲大廳
        </button>
        <LittleMary profile={profile} supabase={supabase} onUpdate={onUpdate} />
      </div>
    );
  }

  if (selectedGame === GameType.CRAB_FISH_SHRIMP) {
    return (
      <div className="h-full">
        <button 
          onClick={() => setSelectedGame(null)}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
        >
          <ChevronRight className="rotate-180" size={20} /> 返回遊戲大廳
        </button>
        <FishPrawnCrab profile={profile} supabase={supabase} onUpdate={onUpdate} />
      </div>
    );
  }

  if (selectedGame === GameType.SLOTS) {
    return (
      <div className="h-full">
        <button 
          onClick={() => setSelectedGame(null)}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
        >
          <ChevronRight className="rotate-180" size={20} /> 返回遊戲大廳
        </button>
        <SlotMachine profile={profile} supabase={supabase} onUpdate={onUpdate} />
      </div>
    );
  }

  if (selectedGame === GameType.BLACKJACK) {
    return (
      <div className="h-full">
        <button 
          onClick={() => setSelectedGame(null)}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
        >
          <ChevronRight className="rotate-180" size={20} /> 返回遊戲大廳
        </button>
        <Blackjack profile={profile} supabase={supabase} onUpdate={onUpdate} />
      </div>
    );
  }

  if (selectedGame === GameType.BACCARAT) {
    return (
      <div className="h-full">
        <button 
          onClick={() => setSelectedGame(null)}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
        >
          <ChevronRight className="rotate-180" size={20} /> 返回遊戲大廳
        </button>
        <Baccarat profile={profile} supabase={supabase} onUpdate={onUpdate} />
      </div>
    );
  }

  if (selectedGame === GameType.ROULETTE) {
    return (
      <div className="h-full">
        <button 
          onClick={() => setSelectedGame(null)}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
        >
          <ChevronRight className="rotate-180" size={20} /> 返回遊戲大廳
        </button>
        <Roulette profile={profile} supabase={supabase} onUpdate={onUpdate} />
      </div>
    );
  }

  // Generic Placeholder for other games
  if (selectedGame) {
    const game = games.find(g => g.type === selectedGame);
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-300">
        <button 
          onClick={() => setSelectedGame(null)}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
        >
          <ChevronRight className="rotate-180" size={20} /> 返回
        </button>

        <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${game?.color} flex items-center justify-center text-6xl shadow-2xl`}>
          {game?.icon}
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-white">{game?.name}</h2>
          <p className="text-slate-400 mt-2">遊戲開發中，請稍後再來...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex flex-col md:flex-row gap-8 h-full">
      {/* Left: Featured / Promotions */}
      <div className="flex-1 bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-center items-start">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
        <span className="bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 z-10">New Release</span>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 z-10 leading-tight">
          民間經典<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">魚蝦蟹</span>
        </h2>
        <p className="text-slate-400 mb-8 max-w-sm z-10">
          傳統玩法，極速體驗！三顆骰子定輸贏，圍骰高倍率賠付。開啟背景音樂享受沉浸式博弈樂趣。
        </p>
        <button 
          onClick={() => setSelectedGame(GameType.CRAB_FISH_SHRIMP)}
          className="bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] z-10"
        >
          <Play fill="currentColor" /> 立即開始
        </button>
      </div>

      {/* Right: Game List Button Area */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2 px-2">
          <LayoutGrid className="text-slate-400" size={20} />
          <span className="text-sm font-black text-slate-500 uppercase tracking-widest">All Games</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: '600px'}}>
          {games.map(game => (
            <button 
              key={game.type}
              onClick={() => setSelectedGame(game.type)}
              className={`group relative overflow-hidden bg-gradient-to-r ${game.color} rounded-2xl p-4 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl border border-white/10`}
            >
              <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {game.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-white text-sm">{game.name}</span>
                {game.hot && <span className="text-[10px] bg-white/20 px-2 rounded text-white mt-1 animate-pulse">HOT</span>}
              </div>
              <ChevronRight className="ml-auto text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamesHub;
