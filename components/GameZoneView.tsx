
import React, { useState } from 'react';
import { GameSubView } from '../types';
import { LayoutGrid, Spade, Activity, Compass, Dices, Zap, ChevronLeft, Trophy } from 'lucide-react';
import BlackjackView from './BlackjackView';
import BaccaratView from './BaccaratView';
import RouletteView from './RouletteView';
import SlotView from './SlotView';
import GameView from './GameView'; // 魚蝦蟹 & 小瑪莉

interface GameZoneViewProps {
  supabase: any;
  userProfile: any;
  showNotification: any;
}

const GameZoneView: React.FC<GameZoneViewProps> = ({ supabase, userProfile, showNotification }) => {
  const [subView, setSubView] = useState<GameSubView>('lobby');

  if (subView === 'lobby') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/20">
            <Trophy className="text-yellow-500" size={20} />
            <span className="text-xs font-black text-yellow-500 uppercase tracking-[0.3em]">HKER Global Game Zone</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900">極速娛樂大廳</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI 加速引擎已就緒 • 實時結算</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <GameCard 
            title="AI 21點" 
            desc="Cyber Blackjack" 
            icon={<Spade size={40}/>} 
            color="from-indigo-600 to-blue-700"
            onClick={() => setSubView('blackjack')} 
          />
          <GameCard 
            title="極速百家樂" 
            desc="Turbo Baccarat" 
            icon={<Activity size={40}/>} 
            color="from-emerald-600 to-teal-700"
            onClick={() => setSubView('baccarat')} 
          />
          <GameCard 
            title="量子輪盤" 
            desc="Quantum Roulette" 
            icon={<Compass size={40}/>} 
            color="from-cyan-600 to-indigo-700"
            onClick={() => setSubView('roulette')} 
          />
          <GameCard 
            title="超級老虎機" 
            desc="Mega Slots" 
            icon={<Zap size={40}/>} 
            color="from-orange-600 to-red-700"
            onClick={() => setSubView('slot')} 
          />
          <GameCard 
            title="經典博弈" 
            desc="Classic Collection" 
            icon={<Dices size={40}/>} 
            color="from-slate-700 to-slate-900"
            onClick={() => setSubView('classic')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => setSubView('lobby')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest group transition-all"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回遊戲大廳
      </button>
      {subView === 'blackjack' && <BlackjackView supabase={supabase} userProfile={userProfile} showNotification={showNotification} />}
      {subView === 'baccarat' && <BaccaratView supabase={supabase} userProfile={userProfile} showNotification={showNotification} />}
      {subView === 'roulette' && <RouletteView supabase={supabase} userProfile={userProfile} showNotification={showNotification} />}
      {subView === 'slot' && <SlotView supabase={supabase} userProfile={userProfile} showNotification={showNotification} />}
      {subView === 'classic' && <GameView supabase={supabase} userProfile={userProfile} showNotification={showNotification} />}
    </div>
  );
};

const GameCard = ({ title, desc, icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`relative h-64 rounded-[3rem] p-10 overflow-hidden group transition-all hover:scale-105 active:scale-95 shadow-2xl text-left ${color}`}
  >
    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
      {icon}
    </div>
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="p-4 bg-white/10 rounded-2xl w-fit backdrop-blur-md">
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-black text-white italic tracking-tighter">{title}</h3>
        <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-1">{desc}</p>
      </div>
    </div>
  </button>
);

export default GameZoneView;
