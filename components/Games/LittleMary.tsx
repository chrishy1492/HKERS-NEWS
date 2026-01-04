
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../../types';
import { Coins, RefreshCw, Trophy, Volume2, VolumeX, AlertCircle, Play, ChevronRight } from 'lucide-react';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

// Configuration
const GRID_SIZE = 24;
const BASE_SPEED = 15; // Accelerated Speed (Lower is faster)
const ITEMS = {
  BAR: { name: 'BAR', odds: 100, color: 'bg-red-600', text: 'text-red-100', icon: '💎' },
  SEVEN: { name: '77', odds: 40, color: 'bg-orange-600', text: 'text-orange-100', icon: '7️⃣' },
  STAR: { name: '星星', odds: 30, color: 'bg-yellow-500', text: 'text-yellow-900', icon: '⭐' },
  WATERMELON: { name: '西瓜', odds: 20, color: 'bg-green-600', text: 'text-green-100', icon: '🍉' },
  BELL: { name: '鈴鐺', odds: 15, color: 'bg-amber-400', text: 'text-amber-900', icon: '🔔' },
  MANGO: { name: '芒果', odds: 10, color: 'bg-yellow-400', text: 'text-yellow-900', icon: '🥭' },
  ORANGE: { name: '橘子', odds: 5, color: 'bg-orange-400', text: 'text-orange-900', icon: '🍊' },
  APPLE: { name: '蘋果', odds: 2, color: 'bg-red-400', text: 'text-red-900', icon: '🍎' },
  LUCKY: { name: '送燈', odds: 0, color: 'bg-purple-600', text: 'text-purple-100', icon: '💡' }, // Represents "Blank/Send Light"
};

// Physical Layout (24 Slots)
// Counts: BAR(1), 77(1), Star(2), Watermelon(2), Bell(3), Mango(3), Orange(5), Apple(6)+Lucky(1)=7
const GRID_LAYOUT = [
  ITEMS.ORANGE,      // 0
  ITEMS.APPLE,       // 1
  ITEMS.MANGO,       // 2
  ITEMS.BAR,         // 3 (Top Center)
  ITEMS.APPLE,       // 4
  ITEMS.STAR,        // 5
  ITEMS.ORANGE,      // 6
  ITEMS.APPLE,       // 7 (Right)
  ITEMS.BELL,        // 8
  ITEMS.MANGO,       // 9
  ITEMS.APPLE,       // 10
  ITEMS.SEVEN,       // 11
  ITEMS.ORANGE,      // 12 (Bottom Right)
  ITEMS.APPLE,       // 13
  ITEMS.BELL,        // 14
  ITEMS.WATERMELON,  // 15
  ITEMS.ORANGE,      // 16
  ITEMS.LUCKY,       // 17 (Replaces 1 Apple for logic)
  ITEMS.MANGO,       // 18 (Bottom Left)
  ITEMS.ORANGE,      // 19 (Left)
  ITEMS.BELL,        // 20
  ITEMS.APPLE,       // 21
  ITEMS.WATERMELON,  // 22
  ITEMS.STAR         // 23
];

// Exact Weight Table (Sum = 1000)
const WEIGHTS = [
  { item: ITEMS.BAR, weight: 5 },       // 0.5%
  { item: ITEMS.SEVEN, weight: 15 },    // 1.5%
  { item: ITEMS.STAR, weight: 25 },     // 2.5%
  { item: ITEMS.WATERMELON, weight: 40 }, // 4.0%
  { item: ITEMS.BELL, weight: 60 },     // 6.0%
  { item: ITEMS.MANGO, weight: 100 },   // 10.0%
  { item: ITEMS.ORANGE, weight: 200 },  // 20.0%
  { item: ITEMS.APPLE, weight: 485 },   // 48.5%
  { item: ITEMS.LUCKY, weight: 70 },    // 7.0% (Blank/Send Light)
];

const BET_OPTIONS = [ITEMS.BAR, ITEMS.SEVEN, ITEMS.STAR, ITEMS.WATERMELON, ITEMS.BELL, ITEMS.MANGO, ITEMS.ORANGE, ITEMS.APPLE];

const LittleMary: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [activeLight, setActiveLight] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [totalBet, setTotalBet] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('請下注並開始');
  
  const speedRef = useRef(BASE_SPEED);
  const stepRef = useRef(0);
  const targetRef = useRef(0);
  const timerRef = useRef<any>(null);

  const handleBet = (itemName: string) => {
    if (isRunning) return;
    if (!profile) return alert('請先登入');
    if (profile.points < totalBet + 10) return alert('積分不足');

    const currentBet = bets[itemName] || 0;
    const newBets = { ...bets, [itemName]: currentBet + 10 };
    setBets(newBets);
    setTotalBet(prev => prev + 10);
  };

  const clearBets = () => {
    if (isRunning) return;
    setBets({});
    setTotalBet(0);
  };

  // RNG Logic
  const determineResult = () => {
    const rand = Math.floor(Math.random() * 1000);
    let cumulative = 0;
    let selectedItem = ITEMS.APPLE;
    
    for (const w of WEIGHTS) {
      cumulative += w.weight;
      if (rand < cumulative) {
        selectedItem = w.item;
        break;
      }
    }

    // Find physical slots for this item
    const possibleIndices: number[] = [];
    GRID_LAYOUT.forEach((item, index) => {
      if (item.name === selectedItem.name) possibleIndices.push(index);
    });

    if (possibleIndices.length === 0) {
      // Fallback for safety, though layout covers all
      return { item: ITEMS.APPLE, index: 1 };
    }

    const targetIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
    return { item: selectedItem, index: targetIndex };
  };

  const startGame = async () => {
    if (isRunning) return;
    if (totalBet === 0) return alert('請先下注');
    if (!profile || profile.points < totalBet) return alert('積分不足');

    setIsRunning(true);
    setLastWin(0);
    setMessage('運轉中...');

    // Deduct points
    const { error } = await supabase.from('profiles').update({
      points: profile.points - totalBet
    }).eq('id', profile.id);

    if (error) {
      setIsRunning(false);
      return alert('扣款失敗');
    }

    const { item: resultItem, index: targetIndex } = determineResult();
    
    // Animation math
    const currentPos = activeLight;
    const distance = (targetIndex - currentPos + GRID_SIZE) % GRID_SIZE;
    // Faster loop: 2 rounds + distance
    const totalSteps = (GRID_SIZE * 2) + distance; 

    stepRef.current = 0;
    targetRef.current = totalSteps;
    speedRef.current = BASE_SPEED;

    const runLoop = () => {
      setActiveLight(prev => (prev + 1) % GRID_SIZE);
      stepRef.current += 1;

      // Aggressive deceleration
      if (targetRef.current - stepRef.current < 20) {
        speedRef.current += 10;
      } else if (targetRef.current - stepRef.current < 10) {
        speedRef.current += 30;
      } else if (targetRef.current - stepRef.current < 5) {
        speedRef.current += 60;
      }

      if (stepRef.current < targetRef.current) {
        timerRef.current = setTimeout(runLoop, speedRef.current);
      } else {
        finishGame(resultItem);
      }
    };

    runLoop();
  };

  const finishGame = async (resultItem: any) => {
    setIsRunning(false);
    
    let payout = 0;
    let bonusMessage = '';

    if (resultItem.name === '送燈') {
        bonusMessage = '✨ 獲得送燈獎勵！(此版本為幸運圖標)';
        // Special case: Lucky typically doesn't multiply bet unless specified. 
        // Based on "Odds: 0", it's a non-win in terms of direct bet multiplication for this spec,
        // or we could treat it as a "Push" (return bet). 
        // Let's treat it as a "Small Luck" - maybe return bet?
        // Prompt says "Odds 0", so we payout 0.
        payout = 0;
    } else {
        const userBet = bets[resultItem.name] || 0;
        payout = userBet * resultItem.odds;
    }

    if (payout > 0) {
      setMessage(`🎉 恭喜！中獎 ${resultItem.name}，贏得 ${payout} 積分！`);
      setLastWin(payout);
      
      const { data } = await supabase.from('profiles').select('points').eq('id', profile!.id).single();
      if (data) {
         await supabase.from('profiles').update({ points: data.points + payout }).eq('id', profile!.id);
      }
    } else {
      setMessage(resultItem.name === '送燈' ? `💡 哎呀！中了送燈但未中獎。` : '😢 未中獎，再接再厲！');
    }
    onUpdate();
  };

  // Grid styling helper (Maps 0-23 to 7x7 Grid coordinates)
  const getGridStyle = (index: number) => {
    // Top Row (0-6) -> Row 1, Col 1-7
    if (index <= 6) return { gridRow: 1, gridColumn: index + 1 };
    // Right Col (7-11) -> Row 2-6, Col 7
    if (index <= 11) return { gridRow: index - 5, gridColumn: 7 };
    // Bottom Row (12-18) -> Row 7, Col 7-1 (Reverse)
    if (index <= 18) return { gridRow: 7, gridColumn: 7 - (index - 12) };
    // Left Col (19-23) -> Row 6-2, Col 1 (Reverse)
    return { gridRow: 7 - (index - 18), gridColumn: 1 };
  };

  const renderCell = (index: number) => {
    const item = GRID_LAYOUT[index];
    const isActive = activeLight === index;
    
    return (
      <div 
        key={index}
        className={`relative rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-75
          ${isActive 
            ? 'border-white bg-white scale-110 shadow-[0_0_25px_rgba(255,255,255,0.9)] z-20' 
            : `border-slate-800 ${item.color} opacity-60 grayscale-[0.3]`
          }
        `}
        style={{ aspectRatio: '1/1' }}
      >
        <span className={`text-2xl md:text-3xl font-black ${isActive ? 'animate-bounce' : ''}`}>
          {item.icon}
        </span>
        <span className={`text-[9px] font-bold mt-1 uppercase ${isActive ? 'text-black' : 'text-white'}`}>{item.name}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center bg-slate-950 p-4 rounded-[2rem] border border-slate-800 shadow-2xl max-w-4xl mx-auto">
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
            LITTLE MARY
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Speed x1.5 • 24 Slots</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-bold uppercase">Balance</p>
          <p className="text-2xl font-black text-yellow-500">{profile?.points.toLocaleString()} PTS</p>
        </div>
      </div>

      {/* Game Grid */}
      <div className="relative w-full max-w-[600px] aspect-square bg-slate-900 rounded-[2rem] p-3 border-4 border-slate-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-7 grid-rows-7 gap-1.5 h-full w-full">
          {GRID_LAYOUT.map((_, i) => (
            <div key={i} style={getGridStyle(i)} className="w-full h-full">
              {renderCell(i)}
            </div>
          ))}

          {/* Center Control Panel */}
          <div className="col-start-2 col-end-7 row-start-2 row-end-7 bg-slate-950 rounded-xl m-1 border border-slate-800 p-3 flex flex-col justify-between relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-slate-950 to-slate-950 pointer-events-none" />
            
            {/* Result Display */}
            <div className="bg-black/60 backdrop-blur rounded-lg p-2 text-center border border-white/5 h-16 flex flex-col justify-center relative z-10">
              <p className={`font-black text-base md:text-lg ${lastWin > 0 ? 'text-green-400 animate-pulse' : 'text-slate-200'}`}>
                {message}
              </p>
              {lastWin > 0 && <p className="text-yellow-500 font-bold text-xs">+{lastWin}</p>}
            </div>

            {/* Betting Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-2 relative z-10">
              {BET_OPTIONS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleBet(item.name)}
                  disabled={isRunning}
                  className={`relative p-1.5 rounded-lg border flex flex-col items-center transition-all active:scale-95
                    ${bets[item.name] ? 'bg-indigo-600/30 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}
                  `}
                >
                  <span className="text-[10px] text-slate-400 font-bold mb-0.5">x{item.odds}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${item.color} text-white shadow-lg ring-1 ring-white/10`}>
                     {item.icon}
                  </div>
                  {bets[item.name] && (
                    <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md border border-yellow-300">
                      {bets[item.name]/10}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex gap-2 mt-3 relative z-10">
              <button 
                onClick={clearBets}
                disabled={isRunning || totalBet === 0}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold py-2 disabled:opacity-50 transition-colors text-xs"
              >
                CLEAR
              </button>
              <button 
                onClick={startGame}
                disabled={isRunning || totalBet === 0}
                className={`flex-[2] rounded-xl font-black py-2 text-white text-base shadow-lg flex items-center justify-center gap-2 transition-all
                  ${isRunning ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 active:scale-[0.98] shadow-pink-600/20'}
                `}
              >
                {isRunning ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                {isRunning ? 'RUNNING' : 'START'}
              </button>
            </div>
            
            <div className="text-center mt-1 relative z-10">
               <span className="text-[10px] text-slate-500 font-bold uppercase">Total Bet: </span>
               <span className="text-white font-bold text-xs">{totalBet}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-[10px] text-slate-500 uppercase font-bold tracking-wider">
         <span className="flex items-center gap-1"><AlertCircle size={12} /> Fair Odds (1000 Weight)</span>
         <span>•</span>
         <span>Classic 24 Grid</span>
      </div>
    </div>
  );
};

export default LittleMary;
