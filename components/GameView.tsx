
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { HOO_HEY_HOW_ITEMS, FRUIT_SLOTS, FRUIT_SLOTS_DATA } from '../constants';
import { RotateCcw, Volume2, VolumeX, Zap, Coins, History, Play, Pause } from 'lucide-react';

interface GameViewProps {
  supabase: any;
  userProfile: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

const GameView: React.FC<GameViewProps> = ({ supabase, userProfile, showNotification }) => {
  const [gameMode, setGameMode] = useState<'hooheyhow' | 'mary'>('hooheyhow');
  const [isMuted, setIsMuted] = useState(false);
  const [points, setPoints] = useState(userProfile?.points || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (userProfile) setPoints(userProfile.points);
  }, [userProfile]);

  // 背景音樂控制 - 使用輕柔放鬆的 BGM
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.2;
    }
    
    if (!isMuted) {
      audioRef.current.play().catch(() => console.log("Audio play deferred"));
    } else {
      audioRef.current.pause();
    }

    return () => audioRef.current?.pause();
  }, [isMuted]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
       {/* 豪華版控制台 */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[3rem] border border-white/10 shadow-2xl gap-4">
          <div className="flex gap-2 p-1.5 bg-black/50 rounded-2xl w-full md:w-auto border border-white/5 shadow-inner">
             <button 
               onClick={() => setGameMode('hooheyhow')} 
               className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black transition-all ${gameMode === 'hooheyhow' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105' : 'text-slate-500 hover:text-white'}`}
             >
                魚蝦蟹 PRO
             </button>
             <button 
               onClick={() => setGameMode('mary')} 
               className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black transition-all ${gameMode === 'mary' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105' : 'text-slate-500 hover:text-white'}`}
             >
                小瑪莉 CLASSIC
             </button>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end px-4">
             <div className="flex items-center gap-3 bg-slate-800/60 py-2.5 px-6 rounded-2xl border border-white/5">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Coins className="text-yellow-500" size={20}/>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">錢包餘額</p>
                  <span className="font-mono font-black text-white text-lg">{points.toLocaleString()} <span className="text-[10px] text-yellow-500">PT</span></span>
                </div>
             </div>
             <button 
               onClick={() => setIsMuted(!isMuted)} 
               className={`p-4 rounded-2xl transition-all active:scale-90 ${isMuted ? 'bg-slate-800 text-slate-500' : 'bg-yellow-500 text-black shadow-lg'}`}
             >
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
             </button>
          </div>
       </div>

       {gameMode === 'hooheyhow' ? (
         <HooHeyHowGame supabase={supabase} userProfile={userProfile} onPointsUpdate={setPoints} isMuted={isMuted} showNotification={showNotification} />
       ) : (
         <MaryGame supabase={supabase} userProfile={userProfile} onPointsUpdate={setPoints} isMuted={isMuted} showNotification={showNotification} />
       )}
    </div>
  );
};

// --- 魚蝦蟹 PRO (2x 加速版) ---
const HooHeyHowGame = ({ supabase, userProfile, onPointsUpdate, isMuted, showNotification }: any) => {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [rolling, setRolling] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);

  // Fix: Explicitly wrap the calculation in Number() to ensure totalBet is treated as a number
  const totalBet = Number(Object.values(bets).reduce((acc: number, val: number) => acc + (val as number), 0));

  const placeBet = (id: string) => {
    if (!userProfile) return showNotification("請先登錄遊戲", "error");
    const amount = 1000;
    // Fix: Explicitly wrap totalBet in Number() to satisfy TS arithmetic rules
    if ((Number(userProfile.points) - Number(totalBet)) < amount) return showNotification("積分不足", "error");
    
    if (!isMuted) {
      const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-20.mp3');
      audio.volume = 0.1;
      audio.play();
    }
    setBets(prev => ({ ...prev, [id]: (Number(prev[id]) || 0) + amount }));
  };

  const roll = async () => {
    if (totalBet === 0 || rolling || !userProfile) return;
    setRolling(true);
    setResults([]);

    // 2x 速度控制: 400ms 開獎
    const newResults = Array.from({ length: 3 }, () => {
      return HOO_HEY_HOW_ITEMS[Math.floor(Math.random() * 6)].id;
    });

    setTimeout(async () => {
      setResults(newResults);
      let winAmount = 0;
      Object.entries(bets).forEach(([id, amount]) => {
        const count = newResults.filter(r => r === id).length;
        if (count === 1) winAmount += (amount as number) * 2;
        else if (count === 2) winAmount += (amount as number) * 3;
        else if (count === 3) winAmount += (amount as number) * 11;
      });

      // Fix: Ensure subtraction uses numbers for both sides
      const profit = Number(winAmount) - Number(totalBet);
      // Fix: Ensure addition uses numbers for both sides
      const { data } = await supabase.from('profiles').update({ points: Number(userProfile.points) + Number(profit) }).eq('id', userProfile.id).select().single();
      
      if (data) {
        onPointsUpdate(data.points);
        if (winAmount > 0) showNotification(`🎊 獲勝！贏得 ${winAmount.toLocaleString()} PT`, "info");
      }
      
      setHistory(prev => [newResults, ...prev].slice(0, 10));
      setBets({});
      setRolling(false);
    }, 400); 
  };

  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100 flex flex-col gap-10 animate-in slide-in-from-bottom-5 duration-500">
       <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {HOO_HEY_HOW_ITEMS.map(item => (
            <button 
              key={item.id} 
              onClick={() => placeBet(item.id)}
              disabled={rolling}
              className={`relative h-40 rounded-[2.5rem] border-4 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group overflow-hidden ${
                bets[item.id] ? 'border-yellow-500 bg-yellow-50' : 'border-slate-50 bg-slate-50 hover:bg-slate-100'
              }`}
            >
               <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
               {bets[item.id] && (
                 <div className="absolute top-4 right-4 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black animate-in zoom-in">
                    {bets[item.id].toLocaleString()}
                 </div>
               )}
            </button>
          ))}
       </div>

       <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 w-full bg-slate-950 rounded-[3rem] p-10 flex items-center justify-center gap-8 h-48 shadow-inner border-4 border-slate-900 relative overflow-hidden">
             {rolling ? (
               <div className="flex gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 bg-slate-800 rounded-2xl animate-spin border border-white/5" />)}
               </div>
             ) : (
               results.length > 0 ? (
                 results.map((r, i) => (
                   <div key={i} className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-5xl shadow-2xl animate-in zoom-in-50 duration-200">
                      {HOO_HEY_HOW_ITEMS.find(item => item.id === r)?.icon}
                   </div>
                 ))
               ) : (
                 <p className="text-slate-600 font-black italic uppercase tracking-[0.5em] text-xs">Ready for High-Speed Roll</p>
               )
             )}
          </div>
          
          <div className="flex flex-col gap-3 w-full lg:w-64">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">目前總投注</p>
                <p className="text-2xl font-mono font-black text-slate-900">{totalBet.toLocaleString()}</p>
             </div>
             <button 
               onClick={roll} 
               disabled={rolling || totalBet === 0}
               className="h-24 bg-yellow-500 text-black rounded-[1.5rem] font-black text-2xl shadow-xl hover:bg-yellow-400 active:scale-95 disabled:opacity-50 transition-all border-b-8 border-yellow-700"
             >
                <RotateCcw size={24} className={rolling ? 'animate-spin' : ''}/> 立即開獎
             </button>
             <button onClick={() => setBets({})} className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500">重置下注</button>
          </div>
       </div>

       <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar border-t border-slate-50 pt-6">
          <div className="shrink-0 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase px-4">最近 10 期:</div>
          {history.map((h, i) => (
            <div key={i} className="shrink-0 flex gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 opacity-70">
               {h.map((r, j) => <span key={j} className="text-sm">{HOO_HEY_HOW_ITEMS.find(it => it.id === r)?.icon}</span>)}
            </div>
          ))}
       </div>
    </div>
  );
};

// --- 小瑪莉 CLASSIC (2x 極速版) ---
const MaryGame = ({ supabase, userProfile, onPointsUpdate, isMuted, showNotification }: any) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [betAmount, setBetAmount] = useState(1000);

  const spin = async () => {
    if (rolling || !userProfile) return;
    if (Number(userProfile.points) < betAmount) return showNotification("積分不足", "error");

    setRolling(true);
    
    // 專業權重算法
    const totalWeight = FRUIT_SLOTS_DATA.reduce((acc, item) => acc + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let winnerType = FRUIT_SLOTS_DATA[0];
    for (const s of FRUIT_SLOTS_DATA) {
      if (rand < s.weight) { winnerType = s; break; }
      rand -= s.weight;
    }

    // 找到對應類型的格位 (隨機選一個)
    const matchingSlots: number[] = [];
    FRUIT_SLOTS.forEach((s, i) => { if (s.name === winnerType.name) matchingSlots.push(i); });
    const targetIdx = matchingSlots[Math.floor(Math.random() * matchingSlots.length)];
    
    // 2x 速度: 30ms 每格
    const totalSpins = 24 * 3 + targetIdx - activeIdx;
    let current = activeIdx;
    let step = 0;
    
    const interval = setInterval(() => {
      current = (current + 1) % 24;
      setActiveIdx(current);
      step++;
      
      if (step >= totalSpins) {
        clearInterval(interval);
        finalizeMary(FRUIT_SLOTS[current]);
      }
    }, 30); 
  };

  const finalizeMary = async (winner: any) => {
    const odds = Number(winner.odds) || 0;
    const profit = odds > 0 ? betAmount * (odds - 1) : -betAmount;
    // Fix: Ensure points calculation uses Number() for safety in arithmetic operation
    const { data } = await supabase.from('profiles').update({ points: Number(userProfile.points) + Number(profit) }).eq('id', userProfile.id).select().single();
    if (data) onPointsUpdate(data.points);
    if (odds > 0) showNotification(`🏆 命中 ${winner.name}！獲得 ${betAmount * odds} PT`, "info");
    setRolling(false);
  };

  return (
    <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl border-4 border-slate-800 flex flex-col gap-10">
       <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
          {FRUIT_SLOTS.map((s, i) => (
            <div 
              key={i} 
              className={`h-20 rounded-2xl flex items-center justify-center text-2xl transition-all border-2 ${
                activeIdx === i ? 'bg-yellow-500 border-white scale-110 shadow-[0_0_30px_rgba(234,179,8,1)] z-10' : 'bg-slate-800 border-white/5 opacity-30'
              }`}
            >
               {s.icon}
            </div>
          ))}
       </div>

       <div className="flex flex-col md:flex-row items-center gap-10 bg-slate-800/40 p-10 rounded-[3rem] border border-white/5">
          <div className="flex-1 text-center">
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3">設定下注 PT</p>
             <div className="flex items-center justify-center gap-8">
                <button onClick={() => setBetAmount(Math.max(1000, betAmount - 1000))} className="w-14 h-14 flex items-center justify-center text-white bg-slate-700 rounded-2xl hover:bg-slate-600 font-bold transition-all">-</button>
                <span className="text-5xl font-black text-yellow-500 font-mono tracking-tighter">{betAmount.toLocaleString()}</span>
                <button onClick={() => setBetAmount(betAmount + 1000)} className="w-14 h-14 flex items-center justify-center text-white bg-slate-700 rounded-2xl hover:bg-slate-600 font-bold transition-all">+</button>
             </div>
          </div>
          <button 
            onClick={spin}
            disabled={rolling}
            className={`w-full md:w-80 h-28 rounded-[2rem] font-black text-3xl shadow-2xl transition-all flex items-center justify-center gap-4 ${
              rolling ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:scale-105 active:scale-95 border-b-[10px] border-red-800'
            }`}
          >
             <Zap size={32} className={rolling ? 'animate-pulse' : ''}/> {rolling ? '運作中' : '快速拉桿'}
          </button>
       </div>
       
       <div className="grid grid-cols-4 md:grid-cols-9 gap-3">
          {FRUIT_SLOTS_DATA.map(s => (
            <div key={s.name} className="bg-slate-800/80 p-3 rounded-2xl text-center border border-white/5">
               <p className="text-xl mb-1">{s.icon}</p>
               <p className="text-[10px] text-yellow-500 font-black">x{s.odds}</p>
            </div>
          ))}
       </div>
    </div>
  );
};

export default GameView;
