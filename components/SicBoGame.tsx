
import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../contexts/DataContext';
import { HOO_HEY_HOW_SYMBOLS } from '../constants';

type GameState = 'BETTING' | 'ROLLING' | 'RESULT';

export const SicBoGame: React.FC = () => {
  const { currentUser, updatePoints } = useContext(DataContext);
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(8); 
  const [bets, setBets] = useState<Record<string, number>>({});
  const [selectedChip, setSelectedChip] = useState(100);
  const [diceResult, setDiceResult] = useState<string[]>(['fish', 'fish', 'fish']);
  const [lastWin, setLastWin] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameState === 'BETTING') {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      } else {
        handleRoll();
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  const placeBet = (symbolId: string) => {
    if (gameState !== 'BETTING') return;
    if (!currentUser || currentUser.points < selectedChip) {
      alert("積分不足！");
      return;
    }
    updatePoints(currentUser.id, -selectedChip); // Deduct immediately
    setBets(prev => ({ ...prev, [symbolId]: (prev[symbolId] || 0) + selectedChip }));
  };

  const handleRoll = () => {
    setGameState('ROLLING');
    setTimeout(() => {
      const newResult = [
        HOO_HEY_HOW_SYMBOLS[Math.floor(Math.random() * 6)].id,
        HOO_HEY_HOW_SYMBOLS[Math.floor(Math.random() * 6)].id,
        HOO_HEY_HOW_SYMBOLS[Math.floor(Math.random() * 6)].id,
      ];
      setDiceResult(newResult);

      let totalWin = 0;
      const counts: Record<string, number> = {};
      newResult.forEach(s => counts[s] = (counts[s] || 0) + 1);

      Object.keys(bets).forEach(betSymbol => {
        const betAmount = bets[betSymbol];
        const hitCount = counts[betSymbol] || 0;
        if (hitCount > 0) {
          totalWin += betAmount + (betAmount * hitCount); // Principal + Win (1:1, 1:2, 1:3 odds roughly)
        }
      });

      if (currentUser && totalWin > 0) {
        updatePoints(currentUser.id, totalWin);
      }
      setLastWin(totalWin);
      setGameState('RESULT');

      setTimeout(() => {
        setBets({});
        setLastWin(0);
        setTimeLeft(8);
        setGameState('BETTING');
      }, 3000);
    }, 1500);
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border-2 border-slate-700 text-white font-sans max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-slate-800 p-3 rounded-lg">
        <div className="font-bold text-amber-500">魚蝦蟹 (Hoo Hey How)</div>
        <div className="text-xl font-bold">{gameState === 'BETTING' ? `下注: ${timeLeft}s` : '開彩中...'}</div>
        <div className={`font-bold text-xl ${lastWin > 0 ? 'text-yellow-400' : 'text-slate-200'}`}>+{lastWin}</div>
      </div>

      <div className="flex justify-center gap-4 mb-8 h-24">
         {gameState === 'ROLLING' ? <div className="text-4xl animate-spin">🎲</div> : 
            diceResult.map((s, i) => (
                <div key={i} className="w-20 h-20 bg-white rounded flex items-center justify-center text-4xl shadow">
                    {HOO_HEY_HOW_SYMBOLS.find(sym => sym.id === s)?.icon}
                </div>
            ))
         }
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {HOO_HEY_HOW_SYMBOLS.map(symbol => (
            <button key={symbol.id} onClick={() => placeBet(symbol.id)} className={`h-32 rounded-xl border-b-8 ${symbol.color} flex flex-col items-center justify-center relative`}>
                <div className="text-5xl">{symbol.icon}</div>
                {bets[symbol.id] > 0 && <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 rounded-full font-bold">{bets[symbol.id]}</div>}
            </button>
        ))}
      </div>

      <div className="flex gap-2 justify-center">
         {[100, 500, 1000].map(v => (
             <button key={v} onClick={() => setSelectedChip(v)} className={`w-12 h-12 rounded-full border-2 ${selectedChip===v ? 'bg-yellow-500 text-black' : 'bg-slate-700'}`}>{v}</button>
         ))}
      </div>
    </div>
  );
};
