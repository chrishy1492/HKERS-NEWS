
import React, { useState, useEffect } from 'react';
import { X, Coins, Volume2, VolumeX, Info, RotateCw, Trophy, Zap } from 'lucide-react';
import { UserProfile } from '../../types';

interface FishPrawnCrabProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const SYMBOLS = [
  { id: 'fish', name: '魚', icon: '🐟', color: 'bg-red-500' },
  { id: 'prawn', name: '蝦', icon: '🦐', color: 'bg-green-500' },
  { id: 'crab', name: '蟹', icon: '🦀', color: 'bg-emerald-600' },
  { id: 'coin', name: '金錢', icon: '💰', color: 'bg-amber-500' },
  { id: 'gourd', name: '葫蘆', icon: '🍶', color: 'bg-blue-500' },
  { id: 'rooster', name: '雞', icon: '🐔', color: 'bg-rose-500' }
];

const FishPrawnCrab: React.FC<FishPrawnCrabProps> = ({ onClose, userProfile, updatePoints, isMuted, setIsMuted }) => {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [isRolling, setIsRolling] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [message, setMessage] = useState('請選擇圖案下注 / PLACE YOUR BETS');
  const [chipValue, setChipValue] = useState(1000);
  const [winSymbols, setWinSymbols] = useState<string[]>([]);

  const placeBet = (id: string) => {
    if (isRolling) return;
    const currentTotal = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if ((userProfile?.points || 0) < currentTotal + chipValue) return alert("系統提示：積分不足！");
    
    setBets(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + chipValue
    }));
  };

  const clearBets = () => {
    if (isRolling) return;
    setBets({});
    setWinSymbols([]);
  };

  const handleRoll = () => {
    const totalBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (totalBet === 0) return alert("請先進行下注！");
    
    setIsRolling(true);
    setMessage('量子隨機數運算中...');
    setResults([]);
    setWinSymbols([]);

    setTimeout(() => {
      const newResults = [
        SYMBOLS[Math.floor(Math.random() * 6)].id,
        SYMBOLS[Math.floor(Math.random() * 6)].id,
        SYMBOLS[Math.floor(Math.random() * 6)].id
      ];
      setResults(newResults);
      setWinSymbols(newResults);
      calculatePayout(newResults, totalBet);
      setIsRolling(false);
    }, 750);
  };

  const calculatePayout = (finalResults: string[], totalBet: number) => {
    let winAmount = 0;
    Object.entries(bets).forEach(([betId, amount]) => {
      const hits = finalResults.filter(r => r === betId).length;
      if (hits > 0) {
        // 1中1賠1(回2), 1中2賠2(回3), 1中3賠3(回4)
        winAmount += (amount as number) * (hits + 1);
      }
    });

    const netResult = Math.floor(winAmount - totalBet);
    updatePoints(netResult);

    if (netResult > 0) {
      setMessage(`🎉 恭喜勝出！淨利：+${netResult.toLocaleString()}`);
    } else if (netResult < 0) {
      setMessage(`📉 損益結算：${netResult.toLocaleString()}`);
    } else {
      setMessage('😐 本局打平 / PUSH');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 md:p-8 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X /></button>
          <div>
            <h2 className="text-2xl font-black text-emerald-400 italic tech-font">HOO HEY HOW AI</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">傳統魚蝦蟹 v4.0.1 PRO</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex flex-col items-end backdrop-blur-md">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CREDITS</span>
             <span className="font-mono font-black text-amber-400 text-xl">{userProfile?.points?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        <div className="flex gap-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-28 h-28 md:w-36 md:h-36 bg-white rounded-[40px] shadow-2xl flex items-center justify-center text-5xl md:text-7xl border-8 border-slate-200 transition-all ${isRolling ? 'animate-bounce' : 'rotate-3'}`}>
              {results[i] ? SYMBOLS.find(s => s.id === results[i])?.icon : '❔'}
            </div>
          ))}
        </div>

        <div className={`px-10 py-3 rounded-full font-black text-lg uppercase tracking-widest transition-all ${message.includes('恭喜') ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
          {message}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
          {SYMBOLS.map(symbol => (
            <button 
              key={symbol.id}
              onClick={() => placeBet(symbol.id)}
              disabled={isRolling}
              className={`relative h-32 md:h-44 rounded-[40px] ${symbol.color} border-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden flex flex-col items-center justify-center ${winSymbols.includes(symbol.id) ? 'border-white ring-8 ring-white/20 z-10' : 'border-white/10'}`}
            >
              <span className="text-5xl md:text-6xl drop-shadow-md">{symbol.icon}</span>
              <span className="mt-2 font-black text-white text-lg tracking-tighter uppercase">{symbol.name}</span>
              {bets[symbol.id] > 0 && (
                <div className="absolute top-4 right-4 bg-white text-slate-900 text-[10px] font-black px-3 py-1 rounded-full shadow-xl animate-in zoom-in">
                  {(bets[symbol.id]/1000).toFixed(1)}K
                </div>
              )}
              {winSymbols.includes(symbol.id) && !isRolling && (
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        <div className="w-full max-w-2xl bg-white/5 p-6 rounded-[48px] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-2">
            {[1000, 5000, 10000, 50000].map(val => (
              <button 
                key={val}
                onClick={() => setChipValue(val)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full font-black text-[10px] transition-all border-4 ${chipValue === val ? 'bg-emerald-500 border-white text-slate-900 scale-110' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              >
                {val >= 10000 ? `${val/1000}K` : val}
              </button>
            ))}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={clearBets} className="flex-1 md:flex-none px-8 py-4 bg-slate-800 text-white rounded-3xl font-black text-xs uppercase flex items-center gap-2">
              <RotateCw size={16} /> 重設
            </button>
            <button 
              onClick={handleRoll}
              disabled={isRolling}
              className="flex-[2] md:flex-none px-16 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-3xl font-black text-xl uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isRolling ? '...' : '搖骰開局'}
            </button>
          </div>
        </div>
      </div>
      <style>{`.tech-font { font-family: 'Orbitron', sans-serif; }`}</style>
    </div>
  );
};

export default FishPrawnCrab;
