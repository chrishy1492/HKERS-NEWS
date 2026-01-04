
import React, { useState, useContext } from 'react';
import { RotateCcw, Zap } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import { LITTLE_MARY_SYMBOLS, LITTLE_MARY_GRID_LAYOUT } from '../constants';

type GameState = 'IDLE' | 'SPINNING' | 'WIN';

export const LittleMaryGame: React.FC = () => {
  const { currentUser, updatePoints } = useContext(DataContext);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  
  const [bets, setBets] = useState<Record<string, number>>({});
  const [selectedChip, setSelectedChip] = useState(10);
  
  const [activeLightIndex, setActiveLightIndex] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [lastWinSymbol, setLastWinSymbol] = useState<string | null>(null);

  const handleBet = (symbolId: string) => {
    if (gameState !== 'IDLE') return;
    if (!currentUser || currentUser.points < selectedChip) {
      alert("積分不足！");
      return;
    }

    updatePoints(currentUser.id, -selectedChip);
    setBets(prev => ({
      ...prev,
      [symbolId]: (prev[symbolId] || 0) + selectedChip
    }));
  };

  const handleClear = () => {
    if (gameState !== 'IDLE') return;
    const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet > 0 && currentUser) {
        updatePoints(currentUser.id, totalBet);
        setBets({});
    }
  };

  const calculateWinner = (): number => {
    const rand = Math.random() * 1000;
    let cumulativeWeight = 0;
    let winningSymbolId = 'apple';

    for (const sym of LITTLE_MARY_SYMBOLS) {
      cumulativeWeight += sym.weight;
      if (rand < cumulativeWeight) {
        winningSymbolId = sym.id;
        break;
      }
    }

    const possibleIndices: number[] = [];
    LITTLE_MARY_GRID_LAYOUT.forEach((id, index) => {
      if (id === winningSymbolId) possibleIndices.push(index);
    });

    if (possibleIndices.length === 0) return 0;
    return possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
  };

  const handleSpin = () => {
    const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return alert("請先下注！");

    setGameState('SPINNING');
    setWinAmount(0);
    setLastWinSymbol(null);

    const targetIndex = calculateWinner();
    
    let currentIdx = activeLightIndex;
    let speed = 20; 
    let rounds = 0;
    const minRounds = 3; 
    
    const spinLoop = () => {
      currentIdx = (currentIdx + 1) % 24;
      setActiveLightIndex(currentIdx);

      if (currentIdx === 0) rounds++;

      if (rounds >= minRounds) {
        const distance = (targetIndex - currentIdx + 24) % 24;
        if (distance < 10) speed += 30; 
        else if (distance < 5) speed += 60;
        else speed += 5; 

        if (currentIdx === targetIndex && speed > 100) {
           finishSpin(targetIndex);
           return;
        }
      }
      setTimeout(spinLoop, speed);
    };
    spinLoop();
  };

  const finishSpin = (finalIndex: number) => {
    const symbolId = LITTLE_MARY_GRID_LAYOUT[finalIndex];
    const symbolData = LITTLE_MARY_SYMBOLS.find(s => s.id === symbolId);
    
    if (symbolData) {
        setLastWinSymbol(symbolId);
        const betOnSymbol = bets[symbolId] || 0;
        if (betOnSymbol > 0) {
            const win = betOnSymbol * symbolData.odds;
            setWinAmount(win);
            if (currentUser) updatePoints(currentUser.id, win);
        }
    }
    setGameState('WIN');
    setTimeout(() => setGameState('IDLE'), 3000); 
  };

  const renderCell = (loopIndex: number) => {
    const symbolId = LITTLE_MARY_GRID_LAYOUT[loopIndex];
    const symbol = LITTLE_MARY_SYMBOLS.find(s => s.id === symbolId);
    if (!symbol) return null;

    const isActive = activeLightIndex === loopIndex;
    const isWinFlash = gameState === 'WIN' && loopIndex === activeLightIndex;

    return (
      <div 
        key={loopIndex}
        className={`
          relative flex items-center justify-center rounded-lg border-2 shadow-sm transition-all duration-100
          ${isActive 
            ? 'bg-yellow-300 border-yellow-500 scale-105 z-10 shadow-[0_0_15px_rgba(250,204,21,0.8)]' 
            : 'bg-white border-slate-200'
          }
          ${isWinFlash ? 'animate-pulse bg-red-400 border-red-600' : ''}
        `}
        style={{ width: '100%', height: '100%' }}
      >
        <div className="text-3xl">{symbol.icon}</div>
      </div>
    );
  };

  const getGridStyle = (index: number) => {
    let row = 1, col = 1;
    if (index <= 6) { row = 1; col = index + 1; } 
    else if (index <= 11) { row = index - 5; col = 7; } 
    else if (index <= 18) { row = 7; col = 7 - (index - 12); } 
    else { row = 7 - (index - 18); col = 1; }
    return { gridRow: row, gridColumn: col };
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border-2 border-slate-700 max-w-4xl mx-auto font-sans text-white select-none">
      
      <div className="flex justify-between items-center mb-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
         <div className="flex items-center gap-2">
             <div className="bg-pink-500 text-white px-3 py-1 rounded font-bold shadow">小瑪莉</div>
             <div className="text-xs text-slate-400">Turbo Mode: ON</div>
         </div>
         <div className="text-right">
             <div className="text-xs text-slate-400">贏分</div>
             <div className={`text-2xl font-mono font-bold ${winAmount > 0 ? 'text-yellow-400 animate-bounce' : 'text-white'}`}>
                {winAmount}
             </div>
         </div>
      </div>

      <div className="relative bg-slate-800 rounded-xl p-4 shadow-inner border border-slate-600 mb-6" style={{ height: '500px' }}>
          <div className="grid grid-cols-7 grid-rows-7 gap-2 w-full h-full relative z-10">
              {/* Center Panel */}
              <div className="col-start-2 col-end-7 row-start-2 row-end-7 bg-slate-900 rounded-lg border border-slate-700 p-4 flex flex-col justify-center items-center z-0">
                  {gameState === 'WIN' && lastWinSymbol && (
                      <div className="text-center animate-fade-in-up mb-4">
                          <div className="text-6xl mb-2">{LITTLE_MARY_SYMBOLS.find(s=>s.id===lastWinSymbol)?.icon}</div>
                          <div className="text-2xl font-bold text-yellow-400">WIN!</div>
                      </div>
                  )}
                  {gameState === 'SPINNING' && (
                      <div className="text-4xl animate-spin mb-4">⚙️</div>
                  )}
                  {gameState === 'IDLE' && !lastWinSymbol && (
                      <div className="text-slate-500 text-sm mb-4">準備開始...</div>
                  )}

                  <div className="grid grid-cols-4 gap-2 w-full max-w-md">
                      {LITTLE_MARY_SYMBOLS.map(sym => (
                          <div key={sym.id} className="relative">
                            <button
                                onClick={() => handleBet(sym.id)}
                                disabled={gameState !== 'IDLE'}
                                className={`
                                    w-full h-20 rounded border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center
                                    ${sym.color} hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <div className="text-2xl shadow-sm">{sym.icon}</div>
                                <div className="text-[10px] font-bold mt-1 bg-black/20 px-1 rounded">x{sym.odds}</div>
                            </button>
                            {(bets[sym.id] || 0) > 0 && (
                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 font-bold text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                                    {bets[sym.id]}
                                </div>
                            )}
                          </div>
                      ))}
                  </div>
              </div>

              {Array.from({ length: 24 }).map((_, i) => {
                  const style = getGridStyle(i);
                  return (
                      <div key={i} style={style} className="w-full h-full">
                          {renderCell(i)}
                      </div>
                  );
              })}
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">籌碼:</span>
              {[10, 50, 100, 500].map(v => (
                  <button 
                    key={v}
                    onClick={() => setSelectedChip(v)}
                    className={`w-10 h-10 rounded-full font-bold text-xs border-2 ${selectedChip === v ? 'bg-yellow-500 text-black border-white scale-110' : 'bg-slate-700 text-slate-300 border-slate-600'}`}
                  >
                      {v}
                  </button>
              ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={handleClear}
                disabled={gameState !== 'IDLE' || Object.keys(bets).length === 0}
                className="flex-1 md:flex-none px-4 py-3 rounded bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                  <RotateCcw size={18}/>
              </button>
              
              <button 
                onClick={handleSpin}
                disabled={gameState !== 'IDLE' || Object.keys(bets).length === 0}
                className={`
                    flex-1 md:flex-none px-12 py-3 rounded font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                    ${gameState === 'IDLE' 
                        ? 'bg-gradient-to-b from-green-500 to-green-700 text-white hover:from-green-400 hover:to-green-600 active:scale-95 border-b-4 border-green-800 active:border-b-0 active:translate-y-1' 
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    }
                `}
              >
                 <Zap size={20} className={gameState === 'SPINNING' ? 'animate-pulse' : ''} />
                 {gameState === 'SPINNING' ? '運轉中...' : '開始 (START)'}
              </button>
          </div>
      </div>
    </div>
  );
};
