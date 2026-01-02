
import React, { useState, useEffect, useRef } from 'react';
import { X, Coins, Volume2, VolumeX, RotateCw, Sparkles, Trophy, Play, Zap } from 'lucide-react';
import { UserProfile } from '../../types';

interface LittleMaryProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const ITEMS = [
  { id: 'bar', name: 'BAR', icon: '🎰', odds: 100, weight: 5 },
  { id: '77', name: '77', icon: '💎', odds: 40, weight: 15 },
  { id: 'star', name: '星星', icon: '⭐', odds: 30, weight: 25 },
  { id: 'watermelon', name: '西瓜', icon: '🍉', odds: 20, weight: 40 },
  { id: 'bell', name: '鈴鐺', icon: '🔔', odds: 15, weight: 60 },
  { id: 'mango', name: '芒果', icon: '🥭', odds: 10, weight: 100 },
  { id: 'orange', name: '橘子', icon: '🍊', odds: 5, weight: 200 },
  { id: 'apple', name: '蘋果', icon: '🍎', odds: 2, weight: 485 },
  { id: 'blank', name: '送燈', icon: '✨', odds: 0, weight: 70 },
];

const RUNWAY = [
  ITEMS[7], ITEMS[6], ITEMS[5], ITEMS[4], ITEMS[3], ITEMS[2], ITEMS[1], ITEMS[0],
  ITEMS[7], ITEMS[8], ITEMS[6], ITEMS[5], ITEMS[4], ITEMS[7], ITEMS[2], ITEMS[3],
  ITEMS[7], ITEMS[6], ITEMS[5], ITEMS[4], ITEMS[7], ITEMS[2], ITEMS[1], ITEMS[8]
];

const LittleMary: React.FC<LittleMaryProps> = ({ onClose, userProfile, updatePoints, isMuted, setIsMuted }) => {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('請選擇圖案下注 / PLACE YOUR BETS');
  const [chipValue, setChipValue] = useState(100);
  const [flash, setFlash] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  const placeBet = (id: string) => {
    if (isRunning || id === 'blank') return;
    const currentTotal = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if ((userProfile?.points || 0) < currentTotal + chipValue) return alert("系統提示：積分不足！");
    
    setBets(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + chipValue
    }));
  };

  const handleStart = () => {
    const totalBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (totalBet === 0) return alert("請先進行下注！");
    
    setIsRunning(true);
    setMessage('數據演算中...');

    const totalWeight = ITEMS.reduce((a, b) => a + b.weight, 0);
    let random = Math.random() * totalWeight;
    let targetItem = ITEMS[ITEMS.length - 1];
    for (const item of ITEMS) {
      if (random < item.weight) {
        targetItem = item;
        break;
      }
      random -= item.weight;
    }

    const possibleIndices = RUNWAY.map((item, idx) => item.id === targetItem.id ? idx : -1).filter(idx => idx !== -1);
    const targetIdx = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];

    let currentPos = currentIndex;
    let steps = 48 + targetIdx - currentIndex; 
    let speed = 30;

    const run = () => {
      currentPos = (currentPos + 1) % 24;
      setCurrentIndex(currentPos);
      steps--;

      if (steps > 0) {
        if (steps < 12) speed += 35;
        timerRef.current = window.setTimeout(run, speed);
      } else {
        setIsRunning(false);
        calculatePayout(RUNWAY[currentPos], totalBet);
      }
    };

    run();
  };

  const calculatePayout = (winItem: any, totalBet: number) => {
    const betAmount = (bets[winItem.id] || 0) as number;
    let winAmount = 0;

    if (betAmount > 0) {
      winAmount = Math.floor(betAmount * (winItem.odds as number));
      setMessage(`🎰 中獎！獲得：${winAmount.toLocaleString()}`);
      if (winItem.odds >= 30) {
        setFlash(true);
        setTimeout(() => setFlash(false), 1000);
      }
    } else if (winItem.id === 'blank') {
      setMessage('✨ 送燈！可惜本局無人中獎');
    } else {
      setMessage(`開出【${winItem.name}】，請再接再厲`);
    }

    const netResult = winAmount - totalBet;
    updatePoints(netResult);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 md:p-8 animate-in fade-in zoom-in duration-300 ${flash ? 'ring-[20px] ring-pink-500 ring-inset' : ''}`}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X /></button>
          <div>
            <h2 className="text-2xl font-black text-pink-500 italic tech-font">FRUIT NEXUS</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">復古小瑪莉 v3.2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex flex-col items-end backdrop-blur-md">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CREDITS</span>
             <span className="font-mono font-black text-white text-xl">{userProfile?.points?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12">
        <div className="grid grid-cols-7 grid-rows-5 gap-2 p-6 bg-slate-900 rounded-[56px] border-[12px] border-slate-800 shadow-2xl relative w-full max-w-2xl aspect-square">
          <div className="col-start-2 col-end-7 row-start-2 row-end-5 flex flex-col items-center justify-center bg-black/40 rounded-[48px] border-4 border-slate-800">
             <div className="text-8xl mb-4 drop-shadow-lg">{RUNWAY[currentIndex].icon}</div>
             <div className="text-3xl font-black text-pink-500 tech-font tracking-[0.2em] uppercase">{RUNWAY[currentIndex].name}</div>
             <div className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{message}</div>
          </div>

          {RUNWAY.map((item, idx) => {
            let posClass = "";
            if (idx < 7) posClass = `col-start-${idx+1} row-start-1`;
            else if (idx < 11) posClass = `col-start-7 row-start-${idx-5}`;
            else if (idx < 18) posClass = `col-start-${18-idx} row-start-5`;
            else posClass = `col-start-1 row-start-${23-idx}`;

            return (
              <div 
                key={idx}
                className={`flex items-center justify-center rounded-2xl text-3xl border-4 transition-all duration-75 ${posClass} ${currentIndex === idx ? 'bg-pink-500 border-white scale-110 z-10 shadow-[0_0_25px_rgba(236,72,153,0.8)]' : 'bg-slate-800 border-slate-700 opacity-40'}`}
              >
                {item.icon}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-6 w-full max-w-md">
          <div className="grid grid-cols-4 gap-3">
            {ITEMS.slice(0, 8).map(item => (
              <button 
                key={item.id}
                onClick={() => placeBet(item.id)}
                disabled={isRunning}
                className={`bg-slate-800 border-2 p-4 rounded-3xl flex flex-col items-center transition-all active:scale-95 disabled:opacity-50 relative ${bets[item.id] > 0 ? 'border-pink-500 shadow-lg shadow-pink-500/10' : 'border-slate-700 hover:border-pink-500/50'}`}
              >
                <span className="text-4xl mb-1">{item.icon}</span>
                <span className="text-[10px] font-black text-pink-500">{item.odds}X</span>
                {bets[item.id] > 0 && (
                  <div className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl">
                    {bets[item.id]}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 p-8 rounded-[48px] border border-white/5 space-y-8">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">下注額度 / CHIPS</span>
               <div className="flex gap-2">
                 {[100, 500, 1000].map(val => (
                   <button 
                    key={val}
                    onClick={() => setChipValue(val)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all ${chipValue === val ? 'bg-pink-500 border-white text-white scale-105' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                   >
                     {val}
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex gap-4">
               <button 
                onClick={() => setBets({})}
                disabled={isRunning}
                className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl font-black text-xs uppercase transition-all"
               >
                 清空
               </button>
               <button 
                onClick={handleStart}
                disabled={isRunning}
                className="flex-[2] py-5 bg-pink-600 hover:bg-pink-500 text-white rounded-3xl font-black text-xl uppercase shadow-2xl shadow-pink-600/20 active:scale-95 transition-all"
              >
                 {isRunning ? '...' : '啟動開跑'}
               </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`.tech-font { font-family: 'Orbitron', sans-serif; }`}</style>
    </div>
  );
};

export default LittleMary;
