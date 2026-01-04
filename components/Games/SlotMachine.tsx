
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../../types';
import { Play, RotateCw, Volume2, VolumeX, Coins, AlertCircle, Zap } from 'lucide-react';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

// Configuration
const ROWS = 3;
const COLS = 3;

const SYMBOLS = {
  "DIAMOND": { name: '鑽石', weight: 5, value: 50, icon: '💎', color: 'bg-cyan-500/20 text-cyan-300' },
  "BELL": { name: '鈴鐺', weight: 10, value: 20, icon: '🔔', color: 'bg-yellow-500/20 text-yellow-300' },
  "WATERMELON": { name: '西瓜', weight: 20, value: 10, icon: '🍉', color: 'bg-green-500/20 text-green-300' },
  "CHERRY": { name: '櫻桃', weight: 30, value: 5, icon: '🍒', color: 'bg-red-500/20 text-red-300' },
  "LEMON": { name: '檸檬', weight: 40, value: 2, icon: '🍋', color: 'bg-yellow-200/20 text-yellow-100' }
};

const SlotMachine: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [bet, setBet] = useState(10);
  const [lines, setLines] = useState(5);
  const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(Array(COLS).fill('DIAMOND')));
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState<{winnings: number, lines: number[]} | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Casino ambient jazz
    audioRef.current = new Audio('https://cdn.pixabay.com/audio/2022/10/25/audio_51d5423870.mp3'); 
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    return () => { audioRef.current?.pause(); };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.play().catch(() => {});
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  const getRandomSymbol = () => {
    const rand = Math.random() * 105; // Total weight approx sum
    let cumulative = 0;
    for (const [key, data] of Object.entries(SYMBOLS)) {
      cumulative += data.weight;
      if (rand < cumulative) return key;
    }
    return 'LEMON';
  };

  const checkWinnings = (finalGrid: string[][]) => {
    let winnings = 0;
    const winningLines: number[] = [];

    // 5 Paylines Logic (0-based index)
    // 1: Top Row, 2: Middle, 3: Bottom, 4: Diagonal TL-BR, 5: Diagonal BL-TR
    const paylines = [
      [[0,0], [0,1], [0,2]], // Top
      [[1,0], [1,1], [1,2]], // Middle
      [[2,0], [2,1], [2,2]], // Bottom
      [[0,0], [1,1], [2,2]], // Diag 1
      [[0,2], [1,1], [2,0]]  // Diag 2
    ];

    paylines.forEach((coords, idx) => {
        if (idx >= lines) return; // Only check bet lines

        const symbolKey = finalGrid[coords[0][0]][coords[0][1]];
        if (
            finalGrid[coords[1][0]][coords[1][1]] === symbolKey &&
            finalGrid[coords[2][0]][coords[2][1]] === symbolKey
        ) {
            winnings += SYMBOLS[symbolKey as keyof typeof SYMBOLS].value * bet;
            winningLines.push(idx + 1);
        }
    });

    return { winnings, winningLines };
  };

  const spin = async () => {
    const totalBet = bet * lines;
    if (!profile) return alert('請先登入');
    if (profile.points < totalBet) return alert('積分不足');
    if (spinning) return;

    setSpinning(true);
    setWinData(null);

    // Deduct points
    const { error } = await supabase.from('profiles').update({
        points: profile.points - totalBet
    }).eq('id', profile.id);

    if (error) {
        setSpinning(false);
        return alert('扣款失敗');
    }

    // Animation Loop
    let spins = 0;
    const maxSpins = 10; // Speed up animation (Fast)
    const interval = setInterval(() => {
        const newGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null).map(() => getRandomSymbol()));
        setGrid(newGrid);
        spins++;
        if (spins >= maxSpins) {
            clearInterval(interval);
            finalizeSpin(newGrid);
        }
    }, 80); // 80ms is fast
  };

  const finalizeSpin = async (finalGrid: string[][]) => {
    const result = checkWinnings(finalGrid);
    setSpinning(false);
    setWinData({ winnings: result.winnings, lines: result.winningLines });

    if (result.winnings > 0) {
        const { data } = await supabase.from('profiles').select('points').eq('id', profile!.id).single();
        if (data) {
             await supabase.from('profiles').update({ points: data.points + result.winnings }).eq('id', profile!.id);
        }
    }
    onUpdate();
  };

  return (
    <div className="flex flex-col items-center bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl max-w-2xl mx-auto min-h-[600px] relative overflow-hidden">
       {/* Background */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

       {/* Header */}
       <div className="flex justify-between w-full items-center mb-8 relative z-10 px-4">
          <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 italic tracking-tighter">
                  NEON SLOTS
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                 <Zap size={12} className="text-yellow-500" /> Turbo Speed
              </p>
          </div>
          <button onClick={toggleAudio} className={`p-3 rounded-full ${isMuted ? 'bg-slate-800 text-slate-500' : 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]'}`}>
             {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
       </div>

       {/* Slot Grid */}
       <div className="bg-slate-900 p-4 rounded-3xl border-4 border-slate-800 shadow-inner relative z-10 mb-8">
          <div className="grid grid-cols-3 gap-2">
              {/* Transpose grid for display if needed, but simple mapping works */}
              {/* We need to map columns basically. grid[row][col] */}
              {[0, 1, 2].map(row => (
                  <React.Fragment key={row}>
                      {[0, 1, 2].map(col => {
                          const symbolKey = grid[row][col];
                          const symbol = SYMBOLS[symbolKey as keyof typeof SYMBOLS];
                          // Highlight winning cells could be added here
                          return (
                              <div key={`${row}-${col}`} className={`w-24 h-24 md:w-32 md:h-32 rounded-xl flex items-center justify-center text-5xl md:text-6xl border border-white/5 shadow-2xl ${symbol.color} transition-all transform ${spinning ? 'blur-[1px]' : ''}`}>
                                  {symbol.icon}
                              </div>
                          )
                      })}
                  </React.Fragment>
              ))}
          </div>
          
          {/* Win Lines Overlay (Simplified Visual) */}
          {winData && winData.lines.length > 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h1 className="text-6xl md:text-8xl font-black text-yellow-500 drop-shadow-[0_0_20px_rgba(0,0,0,1)] animate-bounce">
                    WIN!
                </h1>
             </div>
          )}
       </div>

       {/* Result Panel */}
       <div className="w-full bg-black/40 rounded-xl p-4 mb-6 border border-white/5 relative z-10 text-center h-20 flex flex-col justify-center">
            {winData ? (
                winData.winnings > 0 ? (
                    <>
                        <p className="text-green-400 font-black text-2xl animate-pulse">🎉 贏得 {winData.winnings} 積分!</p>
                        <p className="text-slate-400 text-xs">中獎線: {winData.lines.join(', ')}</p>
                    </>
                ) : (
                    <p className="text-slate-500 font-bold">未中獎，再來一次！</p>
                )
            ) : (
                <p className="text-slate-400 font-bold">{spinning ? '好運轉動中...' : '準備開始'}</p>
            )}
       </div>

       {/* Controls */}
       <div className="w-full bg-slate-900 p-6 rounded-3xl border border-slate-800 relative z-10">
           <div className="flex justify-between items-center mb-4">
               <div className="text-center">
                   <p className="text-[10px] text-slate-500 uppercase font-black">Line Bet</p>
                   <div className="flex items-center gap-2 mt-1">
                       <button onClick={() => setBet(Math.max(10, bet - 10))} className="bg-slate-800 w-8 h-8 rounded-full text-slate-400 font-bold hover:text-white">-</button>
                       <span className="text-xl font-black text-white w-12 text-center">{bet}</span>
                       <button onClick={() => setBet(bet + 10)} className="bg-slate-800 w-8 h-8 rounded-full text-slate-400 font-bold hover:text-white">+</button>
                   </div>
               </div>
               <div className="text-center">
                   <p className="text-[10px] text-slate-500 uppercase font-black">Lines</p>
                   <span className="text-xl font-black text-purple-400">5 (Fixed)</span>
               </div>
               <div className="text-center">
                   <p className="text-[10px] text-slate-500 uppercase font-black">Total Bet</p>
                   <span className="text-xl font-black text-yellow-500">{bet * lines}</span>
               </div>
           </div>

           <button 
                onClick={spin}
                disabled={spinning}
                className={`w-full py-4 rounded-2xl font-black text-xl shadow-lg transition-all flex items-center justify-center gap-3
                    ${spinning 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-black hover:scale-[1.02] active:scale-[0.98] shadow-orange-500/20'}
                `}
            >
                {spinning ? <RotateCw className="animate-spin" /> : <Play fill="currentColor" />}
                {spinning ? 'SPINNING...' : 'SPIN'}
            </button>
       </div>

    </div>
  );
};

export default SlotMachine;
