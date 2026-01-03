
import React, { useState, useEffect, useRef } from 'react';
import { X, Coins, Volume2, VolumeX, RotateCw, Sparkles, Trophy, Play, Zap, Info } from 'lucide-react';
import { UserProfile } from '../../types';

interface LittleMaryProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

// 符號配置
const SYMBOLS = [
  { id: 'apple', char: '🍎', label: 'Apple', odds: 5, color: 'bg-red-500' },
  { id: 'orange', char: '🍊', label: 'Orange', odds: 10, color: 'bg-orange-500' },
  { id: 'mango', char: '🥭', label: 'Mango', odds: 15, color: 'bg-amber-500' },
  { id: 'bell', char: '🔔', label: 'Bell', odds: 20, color: 'bg-yellow-500' },
  { id: 'watermelon', char: '🍉', label: 'Melon', odds: 20, color: 'bg-green-500' },
  { id: 'star', char: '⭐', label: 'Star', odds: 30, color: 'bg-purple-500' },
  { id: 'seven', char: '7️⃣', label: '777', odds: 40, color: 'bg-blue-600' },
  { id: 'bar', char: '🎰', label: 'BAR', odds: 100, color: 'bg-slate-900' },
];

// 跑馬燈佈局 (24格)
// 7x7 Grid Perimeter
// Top (0-6), Right (7-11), Bottom (12-18), Left (19-23)
const BOARD_LAYOUT = [
  { idx: 0, sym: 'orange' }, { idx: 1, sym: 'bell' }, { idx: 2, sym: 'bar' }, { idx: 3, sym: 'bar' }, { idx: 4, sym: 'seven' }, { idx: 5, sym: 'seven' }, { idx: 6, sym: 'apple' },
  { idx: 23, sym: 'apple' },                                                                                                                            { idx: 7, sym: 'apple' },
  { idx: 22, sym: 'orange' },                                                                                                                           { idx: 8, sym: 'mango' },
  { idx: 21, sym: 'mango' },                                                                                                                            { idx: 9, sym: 'watermelon' },
  { idx: 20, sym: 'bell' },                                                                                                                             { idx: 10, sym: 'seven' },
  { idx: 19, sym: 'apple' },                                                                                                                            { idx: 11, sym: 'apple' },
  { idx: 18, sym: 'apple' }, { idx: 17, sym: 'orange' }, { idx: 16, sym: 'mango' }, { idx: 15, sym: 'bell' }, { idx: 14, sym: 'star' }, { idx: 13, sym: 'star' }, { idx: 12, sym: 'watermelon' }
];

const LittleMary: React.FC<LittleMaryProps> = ({ onClose, userProfile, updatePoints, isMuted, setIsMuted }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('請下注 / PLACE BETS');
  const [chipValue, setChipValue] = useState(100);
  const [lastWin, setLastWin] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'); 
      audioRef.current.loop = true;
      audioRef.current.volume = 0.1;
    }
    if (!isMuted) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [isMuted]);

  const handleBet = (symId: string) => {
    if (isSpinning) return;
    const currentTotal = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if ((userProfile?.points || 0) < currentTotal + chipValue) return alert("積分不足！");

    setBets(prev => ({
      ...prev,
      [symId]: (prev[symId] || 0) + chipValue
    }));
    setMessage(`已加注 ${SYMBOLS.find(s => s.id === symId)?.label}`);
  };

  const handleClear = () => {
    if (isSpinning) return;
    setBets({});
    setMessage('下注已清除');
    setLastWin(0);
  };

  const spin = () => {
    const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return alert("請先下注");
    if ((userProfile?.points || 0) < totalBet) return alert("積分不足");

    setIsSpinning(true);
    setLastWin(0);
    setMessage('SPINNING...');
    updatePoints(-totalBet);

    // 決定結果 (簡單隨機)
    const resultIdx = Math.floor(Math.random() * 24);
    const resultSymId = BOARD_LAYOUT.find(b => b.idx === resultIdx)?.sym;

    // 動畫邏輯
    let currentIdx = activeIdx;
    let speed = 50;
    let rounds = 0;
    const maxRounds = 3;
    
    const animate = () => {
      currentIdx = (currentIdx + 1) % 24;
      setActiveIdx(currentIdx);

      if (currentIdx === 0) rounds++;

      if (rounds >= maxRounds && currentIdx === resultIdx) {
        // 停止
        calculateWin(resultSymId!, totalBet);
        setIsSpinning(false);
      } else {
        // 變速效果
        if (rounds >= maxRounds - 1) speed += 15;
        else if (rounds < 1) speed = 40;
        else speed += 2;
        
        setTimeout(animate, speed);
      }
    };
    animate();
  };

  const calculateWin = (resultSymId: string, totalBet: number) => {
    const betOnSym = bets[resultSymId] || 0;
    const symData = SYMBOLS.find(s => s.id === resultSymId);
    
    if (betOnSym > 0 && symData) {
      const win = betOnSym * symData.odds + betOnSym; // 賠率含本金? 傳統是賠率倍數+本金退回，或純賠。
      // 這裡採用純賠率計算: odds * bet.
      const totalPayout = betOnSym * symData.odds;
      updatePoints(totalPayout);
      setLastWin(totalPayout);
      setMessage(`WIN! ${symData.label} x${symData.odds} (+${totalPayout})`);
    } else {
      setMessage(`RESULT: ${symData?.label || 'Loss'}`);
    }
  };

  // 渲染格子的輔助函數
  const renderCell = (idx: number) => {
    const cellData = BOARD_LAYOUT.find(b => b.idx === idx);
    const symData = SYMBOLS.find(s => s.id === cellData?.sym);
    const isActive = activeIdx === idx;

    return (
      <div 
        className={`relative w-full h-full rounded-xl flex flex-col items-center justify-center border-2 transition-all ${isActive ? 'bg-white border-yellow-400 shadow-[0_0_20px_#facc15] scale-105 z-20' : 'bg-slate-800 border-slate-700 opacity-90'}`}
      >
         <span className="text-2xl md:text-3xl filter drop-shadow-md">{symData?.char}</span>
         {isActive && <div className="absolute inset-0 bg-white/40 animate-pulse rounded-xl"></div>}
         {/* 小燈泡 */}
         <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isActive ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-red-900'}`}></div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 animate-in zoom-in duration-300 overflow-hidden">
      {/* 頂部導航 */}
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X /></button>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-pink-500 italic flex items-center gap-2">
              <Zap size={24} fill="#ec4899" className="animate-pulse" /> 小瑪莉 Little Mary
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retro Arcade v1.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl">
            {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-pink-400" />}
          </button>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex flex-col items-end backdrop-blur-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credits</span>
             <span className="font-mono font-black text-white text-lg">{userProfile?.points?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 遊戲機台主體 */}
      <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col items-center justify-center relative">
         <div className="bg-slate-900 p-4 md:p-8 rounded-[40px] border-[12px] border-slate-800 shadow-2xl w-full aspect-square md:aspect-auto md:h-[600px] relative">
            
            {/* 跑馬燈 Grid Layout (7x7) */}
            <div className="grid grid-cols-7 grid-rows-7 gap-2 h-full">
               {/* Row 0 (Top) */}
               {renderCell(0)} {renderCell(1)} {renderCell(2)} {renderCell(3)} {renderCell(4)} {renderCell(5)} {renderCell(6)}
               
               {/* Row 1 */}
               {renderCell(23)} <div className="col-span-5 row-span-5 bg-black/40 rounded-3xl border border-white/5 flex flex-col items-center justify-center p-4 relative">
                  
                  {/* 中央顯示區 */}
                  <div className="text-center space-y-2 mb-6 z-10">
                     <div className="text-pink-500 font-black text-xl md:text-3xl animate-pulse tracking-widest">{message}</div>
                     {lastWin > 0 && (
                       <div className="text-yellow-400 font-black text-lg flex items-center justify-center gap-2 animate-bounce">
                         <Trophy size={20} /> +{lastWin}
                       </div>
                     )}
                  </div>

                  {/* 下注按鈕區 */}
                  <div className="grid grid-cols-4 gap-2 w-full">
                     {SYMBOLS.map(sym => (
                       <button 
                         key={sym.id}
                         onClick={() => handleBet(sym.id)}
                         disabled={isSpinning}
                         className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all active:scale-95 ${bets[sym.id] ? 'bg-pink-900/40 border-pink-500' : 'bg-slate-800 border-slate-700 hover:border-pink-500/50'}`}
                       >
                          <span className="text-2xl">{sym.char}</span>
                          <span className="text-[9px] font-black text-slate-400 mt-1">x{sym.odds}</span>
                          {bets[sym.id] > 0 && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
                              {bets[sym.id]}
                            </div>
                          )}
                       </button>
                     ))}
                  </div>

                  {/* 操作區 */}
                  <div className="flex gap-4 w-full mt-6">
                     <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                        {[10, 100, 500].map(v => (
                          <button 
                            key={v} 
                            onClick={() => setChipValue(v)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black ${chipValue === v ? 'bg-pink-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                          >
                            {v}
                          </button>
                        ))}
                     </div>
                     <button onClick={handleClear} disabled={isSpinning} className="px-4 bg-slate-700 rounded-xl text-slate-300 font-black text-xs hover:bg-slate-600"><RotateCw size={14}/></button>
                     <button 
                       onClick={spin} 
                       disabled={isSpinning}
                       className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-black text-lg uppercase shadow-lg shadow-pink-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        {isSpinning ? <RotateCw className="animate-spin" /> : <Play fill="white" />}
                        <span>GO</span>
                     </button>
                  </div>

               </div> {renderCell(7)}

               {/* Row 2 */}
               {renderCell(22)} {renderCell(8)}
               {/* Row 3 */}
               {renderCell(21)} {renderCell(9)}
               {/* Row 4 */}
               {renderCell(20)} {renderCell(10)}
               {/* Row 5 */}
               {renderCell(19)} {renderCell(11)}

               {/* Row 6 (Bottom) */}
               {renderCell(18)} {renderCell(17)} {renderCell(16)} {renderCell(15)} {renderCell(14)} {renderCell(13)} {renderCell(12)}
            </div>
         </div>
      </div>

      <div className="max-w-2xl mx-auto w-full mt-6 flex justify-center opacity-50">
         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <Info size={12} /> 博盡無悔，量力而為
         </p>
      </div>
    </div>
  );
};

export default LittleMary;
