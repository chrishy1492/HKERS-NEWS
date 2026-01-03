
import React, { useState, useEffect, useRef } from 'react';
import { X, Coins, Volume2, VolumeX, RotateCw, Sparkles, Trophy, Play, Zap, Info } from 'lucide-react';
import { UserProfile } from '../../types';

interface LuckySlotsProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

// 符號配置與權重 (權重越高越容易出現)
const SYMBOLS = [
  { id: 'diamond', char: '💎', label: 'Diamond', weight: 5, multiplier: 50 },
  { id: 'bell', char: '🔔', label: 'Bell', weight: 12, multiplier: 20 },
  { id: 'watermelon', char: '🍉', label: 'Watermelon', weight: 20, multiplier: 10 },
  { id: 'cherry', char: '🍒', label: 'Cherry', weight: 30, multiplier: 5 },
  { id: 'lemon', char: '🍋', label: 'Lemon', weight: 45, multiplier: 2 },
];

const LuckySlots: React.FC<LuckySlotsProps> = ({ onClose, userProfile, updatePoints, isMuted, setIsMuted }) => {
  const [reels, setReels] = useState<string[][]>([
    ['🍒', '🍋', '🍉'],
    ['💎', '🔔', '🍒'],
    ['🍉', '🍋', '🔔']
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [betPerLine, setBetPerLine] = useState(100);
  const [message, setMessage] = useState('準備博盡無悔 / READY TO SPIN');
  const [winLines, setWinLines] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 背景音樂控制
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // 舒服舒緩音樂
      audioRef.current.loop = true;
      audioRef.current.volume = 0.1;
    }
    if (!isMuted) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [isMuted]);

  const generateSymbol = () => {
    const totalWeight = SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const s of SYMBOLS) {
      if (rand < s.weight) return s.char;
      rand -= s.weight;
    }
    return SYMBOLS[SYMBOLS.length - 1].char;
  };

  const spin = async () => {
    const totalBet = betPerLine * 5; // 5 條中獎線
    if ((userProfile?.points || 0) < totalBet) return alert("積分不足！");
    
    setIsSpinning(true);
    setWinLines([]);
    setMessage('轉動中 / SPINNING...');
    
    // 扣除本金
    updatePoints(-totalBet);

    // 動畫效果：隨機變換符號 (加速 2x)
    const spinInterval = setInterval(() => {
      setReels([
        [generateSymbol(), generateSymbol(), generateSymbol()],
        [generateSymbol(), generateSymbol(), generateSymbol()],
        [generateSymbol(), generateSymbol(), generateSymbol()]
      ]);
    }, 40); // 40ms 變換一次，極速感

    // 隨機旋轉時間 (加速 2x：原本 2-3秒 縮短為 0.8-1.2秒)
    setTimeout(() => {
      clearInterval(spinInterval);
      const finalReels = [
        [generateSymbol(), generateSymbol(), generateSymbol()],
        [generateSymbol(), generateSymbol(), generateSymbol()],
        [generateSymbol(), generateSymbol(), generateSymbol()]
      ];
      setReels(finalReels);
      checkWinnings(finalReels);
      setIsSpinning(false);
    }, 800 + Math.random() * 400);
  };

  const checkWinnings = (result: string[][]) => {
    let totalWin = 0;
    const currentWinLines: number[] = [];

    // 中獎線定義 (row, col)
    const paylines = [
      [ [0,0], [0,1], [0,2] ], // 橫 1 (頂)
      [ [1,0], [1,1], [1,2] ], // 橫 2 (中)
      [ [2,0], [2,1], [2,2] ], // 橫 3 (底)
      [ [0,0], [1,1], [2,2] ], // 斜 1 (左上到右下)
      [ [0,2], [1,1], [2,0] ]  // 斜 2 (右上到左下)
    ];

    paylines.forEach((line, index) => {
      const symbolsOnLine = line.map(([r, c]) => result[c][r]);
      if (symbolsOnLine[0] === symbolsOnLine[1] && symbolsOnLine[1] === symbolsOnLine[2]) {
        const symbolData = SYMBOLS.find(s => s.char === symbolsOnLine[0]);
        if (symbolData) {
          totalWin += symbolData.multiplier * betPerLine;
          currentWinLines.push(index);
        }
      }
    });

    if (totalWin > 0) {
      updatePoints(totalWin);
      setWinLines(currentWinLines);
      setMessage(`恭喜！贏得 ${totalWin.toLocaleString()} 積分！`);
    } else {
      setMessage('再接再厲 / TRY AGAIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 md:p-8 animate-in fade-in zoom-in duration-300 overflow-y-auto">
      {/* 頂部導航 */}
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X /></button>
          <div>
            <h2 className="text-2xl font-black text-amber-400 italic flex items-center gap-2">
              <Zap size={24} fill="#fbbf24" className="animate-pulse" /> 幸運老虎機
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HKER Lucky Slots v2.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl">
            {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-amber-400" />}
          </button>
          <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex flex-col items-end backdrop-blur-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">現有積分</span>
             <span className="font-mono font-black text-white text-xl">{userProfile?.points?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-10">
        
        {/* 老虎機本體 */}
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 p-6 md:p-10 rounded-[64px] border-8 border-slate-700 shadow-[0_0_100px_rgba(251,191,36,0.1)] w-full max-w-2xl">
          {/* 裝飾燈 */}
          <div className="absolute inset-0 flex justify-between p-4 pointer-events-none">
            <div className="flex flex-col justify-between h-full py-10">
              {[1,2,3,4,5].map(i => <div key={i} className={`w-3 h-3 rounded-full ${isSpinning ? 'animate-pulse bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-slate-600'}`}></div>)}
            </div>
            <div className="flex flex-col justify-between h-full py-10">
              {[1,2,3,4,5].map(i => <div key={i} className={`w-3 h-3 rounded-full ${isSpinning ? 'animate-pulse bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-slate-600'}`}></div>)}
            </div>
          </div>

          {/* 滾輪區域 */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 bg-black/50 p-6 rounded-[40px] border-4 border-slate-950 shadow-inner h-64 md:h-80 items-center overflow-hidden">
            {reels.map((col, cIdx) => (
              <div key={cIdx} className="space-y-4 md:space-y-6 flex flex-col items-center">
                {col.map((symbol, rIdx) => {
                  // 判斷是否在中獎線上
                  const isWinningSymbol = winLines.some(lineIdx => {
                    const paylines = [
                      [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]], [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
                    ];
                    return paylines[lineIdx].some(([r, c]) => r === rIdx && c === cIdx);
                  });

                  return (
                    <div 
                      key={rIdx} 
                      className={`text-6xl md:text-8xl transition-all duration-100 ${isWinningSymbol ? 'scale-125 brightness-125 filter drop-shadow-[0_0_15px_#fbbf24] animate-bounce' : ''}`}
                    >
                      {symbol}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* 中獎線指示器 (手機隱藏) */}
          <div className="absolute left-0 inset-y-0 -ml-8 flex flex-col justify-center gap-16 md:flex hidden">
             <div className={`w-6 h-6 rounded-full border-2 border-amber-500 flex items-center justify-center text-[10px] font-black ${winLines.includes(0) ? 'bg-amber-500 text-black scale-125' : 'text-amber-500'}`}>1</div>
             <div className={`w-6 h-6 rounded-full border-2 border-amber-500 flex items-center justify-center text-[10px] font-black ${winLines.includes(1) ? 'bg-amber-500 text-black scale-125' : 'text-amber-500'}`}>2</div>
             <div className={`w-6 h-6 rounded-full border-2 border-amber-500 flex items-center justify-center text-[10px] font-black ${winLines.includes(2) ? 'bg-amber-500 text-black scale-125' : 'text-amber-500'}`}>3</div>
          </div>
        </div>

        <div className="text-xl md:text-2xl font-black text-amber-400 uppercase tracking-widest text-center animate-pulse">
          {message}
        </div>

        {/* 控制面板 */}
        <div className="w-full max-w-2xl bg-white/5 p-8 rounded-[48px] border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">單線賭注 / BET PER LINE</span>
             <div className="flex gap-2">
               {[10, 100, 500, 1000].map(val => (
                 <button 
                  key={val}
                  onClick={() => setBetPerLine(val)}
                  disabled={isSpinning}
                  className={`w-14 h-14 rounded-2xl font-black transition-all border-2 ${betPerLine === val ? 'bg-amber-400 border-white text-slate-950 scale-110 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                 >
                   {val}
                 </button>
               ))}
             </div>
             <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase">總投注: {(betPerLine * 5).toLocaleString()} (5 條線)</div>
          </div>

          <button 
            onClick={spin}
            disabled={isSpinning}
            className="w-full md:w-48 h-24 bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 rounded-[32px] font-black text-2xl uppercase shadow-[0_20px_40px_rgba(245,158,11,0.2)] transition-all active:scale-95 disabled:opacity-50 group flex items-center justify-center gap-3"
          >
            {isSpinning ? <RotateCw className="animate-spin" size={32} /> : <Play size={32} fill="currentColor" />}
            <span>{isSpinning ? '' : '開局'}</span>
          </button>
        </div>

        {/* 賠率表說明 */}
        <div className="grid grid-cols-5 gap-4 w-full max-w-2xl">
           {SYMBOLS.map(s => (
             <div key={s.id} className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                <div className="text-2xl mb-1">{s.char}</div>
                <div className="text-[10px] font-black text-amber-500">x{s.multiplier}</div>
             </div>
           ))}
        </div>
      </div>
      
      {/* 底部免責 */}
      <div className="max-w-4xl mx-auto w-full mt-10 p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex items-start gap-4">
        {/* Fixed missing import for Info icon */}
        <Info className="text-slate-500 mt-1 flex-shrink-0" size={16} />
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
          幸運老虎機為 HKER 虛擬積分遊戲。請謹記「博盡無悔，量力而為」。獅子山精神的核心是創造價值與守望相助。如有沉迷傾向，請尋求社區幫助。祝願大家好運！
        </p>
      </div>
    </div>
  );
};

export default LuckySlots;
