
import React, { useState, useEffect, useContext } from 'react';
import { Zap } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import { SLOT_SYMBOLS } from '../constants';

const ROWS = 3;
const COLS = 3;

export const SlotsGame: React.FC = () => {
  const { currentUser, updatePoints } = useContext(DataContext);
  const [bet, setBet] = useState(10);
  const [grid, setGrid] = useState<string[][]>(Array(3).fill(Array(3).fill("💎")));
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [isTurbo, setIsTurbo] = useState(false);

  const getWeightedSymbol = () => {
    const symbols = Object.keys(SLOT_SYMBOLS);
    const totalWeight = symbols.reduce((acc, sym) => acc + SLOT_SYMBOLS[sym as keyof typeof SLOT_SYMBOLS].weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const sym of symbols) {
      random -= SLOT_SYMBOLS[sym as keyof typeof SLOT_SYMBOLS].weight;
      if (random <= 0) return sym;
    }
    return symbols[0];
  };

  const checkWinnings = (finalGrid: string[][]) => {
    let winnings = 0;
    const lines = [
      [[0,0], [0,1], [0,2]], 
      [[1,0], [1,1], [1,2]], 
      [[2,0], [2,1], [2,2]], 
      [[0,0], [1,1], [2,2]], 
      [[0,2], [1,1], [2,0]] 
    ];

    lines.forEach(line => {
      const s1 = finalGrid[line[0][1]][line[0][0]];
      const s2 = finalGrid[line[1][1]][line[1][0]];
      const s3 = finalGrid[line[2][1]][line[2][0]];

      if (s1 === s2 && s2 === s3) {
        winnings += SLOT_SYMBOLS[s1 as keyof typeof SLOT_SYMBOLS].value * bet;
      }
    });

    return winnings;
  };

  const spin = () => {
    if (!currentUser || currentUser.points < bet * 5) {
      alert("積分不足！需要 " + (bet * 5) + " 積分");
      return;
    }

    setIsSpinning(true);
    setLastWin(0);
    const totalBet = bet * 5;
    updatePoints(currentUser.id, -totalBet);
    
    const duration = isTurbo ? 1000 : 2000; 
    const intervalTime = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      const newGrid = Array(COLS).fill(null).map(() => 
        Array(ROWS).fill(null).map(() => getWeightedSymbol())
      );
      setGrid(newGrid);
      elapsed += intervalTime;

      if (elapsed >= duration) {
        clearInterval(interval);
        
        const finalGrid = Array(COLS).fill(null).map(() => 
            Array(ROWS).fill(null).map(() => getWeightedSymbol())
        );
        
        const displayGrid = [
            [finalGrid[0][0], finalGrid[1][0], finalGrid[2][0]],
            [finalGrid[0][1], finalGrid[1][1], finalGrid[2][1]],
            [finalGrid[0][2], finalGrid[1][2], finalGrid[2][2]]
        ];
        
        const win = checkWinnings(displayGrid); 
        
        setGrid(displayGrid);
        if (win > 0) {
            setLastWin(win);
            updatePoints(currentUser.id, win);
        }
        setIsSpinning(false);
      }
    }, intervalTime);
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border-4 border-slate-700 max-w-4xl mx-auto font-sans text-white relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl border border-slate-600">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-4 py-1 rounded font-black text-xl italic shadow-lg transform -skew-x-12">
            LUCKY SLOTS
          </div>
        </div>
        <div className="text-right">
             <div className="text-xs text-slate-400">WIN</div>
             <div className={`text-2xl font-mono font-bold ${lastWin > 0 ? 'text-yellow-400 animate-bounce' : 'text-slate-600'}`}>
                ${lastWin}
             </div>
        </div>
      </div>

      <div className="bg-slate-800 p-8 rounded-2xl border-4 border-slate-950 shadow-inner mb-6 relative">
          
          <div className={`absolute top-2 right-4 text-xs font-bold flex items-center gap-1 ${isTurbo ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}`}>
             <Zap size={12} fill={isTurbo ? "currentColor" : "none"}/> TURBO
          </div>

          <div className="flex gap-4 justify-center">
             {[0, 1, 2].map(colIdx => (
                 <div key={colIdx} className="flex flex-col gap-4 bg-slate-900 p-2 rounded-lg border-x-4 border-slate-950 shadow-inner">
                     {[0, 1, 2].map(rowIdx => (
                         <div key={rowIdx} className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-5xl shadow-md transform transition-transform hover:scale-105">
                             {grid[rowIdx][colIdx]} 
                         </div>
                     ))}
                 </div>
             ))}
          </div>
          
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-16 opacity-30 pointer-events-none">
             {[1,2,3].map(i => <div key={i} className="w-4 h-1 bg-red-500"></div>)}
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-16 opacity-30 pointer-events-none">
             {[1,2,3].map(i => <div key={i} className="w-4 h-1 bg-red-500"></div>)}
          </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border-t-4 border-slate-600 flex flex-col md:flex-row justify-between items-center gap-4">
         
         <div className="flex items-center gap-4">
             <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-500 block">BET PER LINE</span>
                <span className="font-mono text-xl font-bold text-yellow-400">${bet}</span>
             </div>
             <div className="flex flex-col gap-1">
                <button onClick={() => setBet(prev => Math.min(1000, prev + 10))} className="bg-slate-700 px-2 rounded hover:bg-slate-600">+</button>
                <button onClick={() => setBet(prev => Math.max(10, prev - 10))} className="bg-slate-700 px-2 rounded hover:bg-slate-600">-</button>
             </div>
         </div>

         <div className="bg-slate-900 px-6 py-2 rounded-lg border border-slate-700 min-w-[150px] text-center">
             <span className="text-xs text-slate-500 block">TOTAL BET</span>
             <span className="font-mono text-xl font-bold text-white">${bet * 5}</span>
         </div>

         <div className="flex gap-4 items-center">
             <button 
               onClick={() => setIsTurbo(!isTurbo)} 
               className={`p-4 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center ${isTurbo ? 'bg-yellow-600 border-yellow-800 text-white' : 'bg-slate-700 border-slate-900 text-slate-400'}`}
             >
                <Zap size={20} fill={isTurbo ? "currentColor" : "none"}/>
                <span className="text-[10px] font-bold">TURBO</span>
             </button>

             <button 
               onClick={spin}
               disabled={isSpinning}
               className={`
                 px-10 py-4 rounded-xl font-black text-2xl tracking-widest shadow-lg border-b-8 active:border-b-0 active:translate-y-2 transition-all
                 ${isSpinning 
                   ? 'bg-slate-600 border-slate-800 text-slate-400 cursor-not-allowed' 
                   : 'bg-gradient-to-b from-green-500 to-green-700 border-green-900 text-white hover:from-green-400 hover:to-green-600'
                 }
               `}
             >
               {isSpinning ? '...' : 'SPIN'}
             </button>
         </div>

      </div>

      <div className="text-center mt-4 text-xs text-slate-500 font-mono">
         RTP: 95.5% | LINES: 5 FIXED | DIAMOND PAYS 50x
      </div>
    </div>
  );
};
