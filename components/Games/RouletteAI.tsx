
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Coins, Volume2, VolumeX, Info, ArrowLeft, 
  Zap, Shield, Target, History, Trophy, RotateCw 
} from 'lucide-react';
import { UserProfile } from '../../types';

// --- 工程師配置: 核心數據 ---
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const COLORS = { cyan: '#22d3ee', rose: '#f43f5e', slate: '#0f172a', amber: '#fbbf24', green: '#10b981' };

interface RouletteAIProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export default function RouletteAI({ onClose, userProfile, updatePoints, isMuted, setIsMuted }: RouletteAIProps) {
  const [balance, setBalance] = useState(userProfile?.points || 0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentBet, setCurrentBet] = useState<{ val: string | number, odds: number } | null>(null);
  const [betAmount, setBetAmount] = useState(1000);
  const [history, setHistory] = useState<number[]>([]);
  const [message, setMessage] = useState('初始化系統... 請下注');
  const [showRules, setShowRules] = useState(false);
  const [winStatus, setWinStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'); 
      audioRef.current.loop = true;
      audioRef.current.volume = 0.1;
    }
    if (!isMuted) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [isMuted]);

  useEffect(() => {
    if (userProfile) setBalance(userProfile.points);
  }, [userProfile]);

  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;
    const innerRadius = 140;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製背景粒子感 (靜態)
    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
    for(let i=0; i<30; i++) {
       ctx.beginPath();
       ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
       ctx.fill();
    }

    const segments = WHEEL_NUMBERS.length;
    const segmentAngle = (2 * Math.PI) / segments;

    for (let i = 0; i < segments; i++) {
        const startAngle = (i * segmentAngle) + angle - Math.PI/2 - segmentAngle/2;
        const endAngle = startAngle + segmentAngle;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        
        const num = WHEEL_NUMBERS[i];
        if (num === 0) ctx.fillStyle = COLORS.green;
        else if (RED_NUMBERS.includes(num)) ctx.fillStyle = COLORS.rose;
        else ctx.fillStyle = COLORS.slate;
        
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle/2);
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "bold 10px Orbitron";
        ctx.fillText(num.toString(), radius - 20, 4);
        ctx.restore();
    }

    // 中心核心
    ctx.shadowBlur = 40;
    ctx.shadowColor = COLORS.cyan;
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.cyan;
    ctx.textAlign = 'center';
    ctx.font = "black 16px Orbitron";
    ctx.fillText("AI CORE", centerX, centerY + 6);

    // 指針
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.cyan;
    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 12, centerY - radius - 35);
    ctx.lineTo(centerX + 12, centerY - radius - 35);
    ctx.fill();
  }, []);

  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  const spin = () => {
    if (isSpinning || !currentBet) return;
    if (balance < betAmount) return alert("系統提示：積分不足");

    setIsSpinning(true);
    setWinStatus(null);
    setMessage('量子脈衝發射中...');
    updatePoints(-betAmount);

    let currentRotation = rotationRef.current;
    let targetSpeed = 0.5 + Math.random() * 0.3;
    let speed = targetSpeed;
    let startTime = performance.now();
    let duration = 4000 + Math.random() * 1000; // 4-5 秒，比普通快一倍

    const animate = (time: number) => {
      let progress = time - startTime;
      if (progress < duration) {
        if (progress > duration * 0.6) {
          speed *= 0.985; // 擬真減速
        }
        currentRotation += speed;
        rotationRef.current = currentRotation;
        drawWheel(currentRotation);
        requestAnimationFrame(animate);
      } else {
        finalize(currentRotation);
      }
    };
    requestAnimationFrame(animate);
  };

  const finalize = (finalRotation: number) => {
    setIsSpinning(false);
    const totalSegments = WHEEL_NUMBERS.length;
    const segmentAngle = (2 * Math.PI) / totalSegments;
    
    let normalized = (finalRotation % (2 * Math.PI));
    let index = Math.floor(((2 * Math.PI - normalized) % (2 * Math.PI)) / segmentAngle);
    
    const resultNum = WHEEL_NUMBERS[index];
    const isRed = RED_NUMBERS.includes(resultNum);
    const resultColor = resultNum === 0 ? 'GREEN' : (isRed ? 'RED' : 'BLACK');
    const resultOddEven = resultNum % 2 === 0 ? 'EVEN' : 'ODD';
    
    setHistory(prev => [resultNum, ...prev].slice(0, 8));

    let won = false;
    if (typeof currentBet?.val === 'number') {
      if (currentBet.val === resultNum) won = true;
    } else {
      if (currentBet?.val === resultColor || currentBet?.val === resultOddEven) won = true;
    }

    if (won) {
      const winVal = Math.floor(betAmount * currentBet!.odds);
      updatePoints(winVal);
      setWinStatus('WIN');
      setMessage(`恭喜獲勝！獲得 ${winVal.toLocaleString()} 積分`);
    } else {
      setWinStatus('LOSE');
      setMessage(`結果為 ${resultNum} (${resultColor})，系統已回收。`);
    }
    
    setCurrentBet(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white noto-font overflow-hidden flex flex-col p-4 select-none">
      <div className="absolute inset-0 pointer-events-none opacity-20 z-50 scanline-overlay"></div>
      
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center z-10 mb-4 sm:mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase text-cyan-400 tech-font">Quantum Pulse Roulette</h1>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase tech-font">HKER Engineering v4.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl">
            {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-cyan-400" />}
          </button>
          <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex flex-col items-end backdrop-blur-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest tech-font">Current Credits</span>
             <span className="text-xl font-black text-amber-400 tech-font">{balance.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowRules(true)} className="p-3 bg-cyan-600/20 text-cyan-400 rounded-2xl border border-cyan-500/20">
            <Info size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-10 relative z-10 overflow-y-auto pb-10">
        
        {/* 左側: 輪盤視覺與歷史 */}
        <div className="flex flex-col items-center gap-6">
           <div className="relative">
              <canvas ref={canvasRef} width={450} height={450} className="max-w-[320px] sm:max-w-full drop-shadow-[0_0_50px_rgba(34,211,238,0.2)]" />
              {winStatus && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className={`text-4xl font-black tech-font italic animate-ping ${winStatus === 'WIN' ? 'text-cyan-400' : 'text-rose-600'}`}>
                      {winStatus}
                   </div>
                </div>
              )}
           </div>
           
           <div className="w-full bg-white/5 p-4 rounded-3xl border border-white/5 flex gap-2 overflow-x-auto">
              <History size={16} className="text-slate-500 mt-1" />
              {history.length > 0 ? history.map((h, i) => (
                <span key={i} className={`px-3 py-1 rounded-lg font-black tech-font text-xs ${RED_NUMBERS.includes(h) ? 'bg-rose-600' : (h === 0 ? 'bg-emerald-600' : 'bg-slate-900')} animate-in slide-in-from-left-2`}>{h}</span>
              )) : <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest pt-1">No Quantum Records</span>}
           </div>
        </div>

        {/* 右側: 投注與操作 */}
        <div className="w-full max-w-2xl flex flex-col gap-6">
           <div className="bg-slate-900/80 p-6 sm:p-10 rounded-[48px] border border-white/10 backdrop-blur-3xl shadow-2xl space-y-8">
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] tech-font">Number Selector (x35 Odds)</span>
                    {currentBet && <span className="text-xs font-black text-cyan-400 animate-pulse uppercase">Target: {currentBet.val}</span>}
                 </div>
                 <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-2 bg-black/40 rounded-3xl border border-white/5">
                    {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
                       <button 
                         key={num}
                         disabled={isSpinning}
                         onClick={() => setCurrentBet({ val: num, odds: 36 })}
                         className={`h-10 rounded-xl font-black tech-font text-xs transition-all border ${currentBet?.val === num ? 'bg-cyan-500 border-white text-black scale-110 shadow-lg z-10' : RED_NUMBERS.includes(num) ? 'bg-rose-900/40 border-rose-500/50 text-rose-400 hover:bg-rose-800' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                       >
                         {num}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <button onClick={() => setCurrentBet({ val: 'RED', odds: 1.9 })} disabled={isSpinning} className={`p-4 rounded-3xl border-2 font-black tech-font text-sm transition-all ${currentBet?.val === 'RED' ? 'bg-rose-600 border-white shadow-lg' : 'bg-rose-900/20 border-rose-600/30 text-rose-400 hover:bg-rose-900/40'}`}>RED 紅</button>
                 <button onClick={() => setCurrentBet({ val: 'BLACK', odds: 1.9 })} disabled={isSpinning} className={`p-4 rounded-3xl border-2 font-black tech-font text-sm transition-all ${currentBet?.val === 'BLACK' ? 'bg-slate-700 border-white shadow-lg' : 'bg-slate-800/20 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>BLACK 黑</button>
                 <button onClick={() => setCurrentBet({ val: 'ODD', odds: 1.9 })} disabled={isSpinning} className={`p-4 rounded-3xl border-2 font-black tech-font text-sm transition-all ${currentBet?.val === 'ODD' ? 'bg-cyan-600 border-white shadow-lg' : 'bg-cyan-900/20 border-cyan-600/30 text-cyan-400 hover:bg-cyan-900/40'}`}>ODD 單</button>
                 <button onClick={() => setCurrentBet({ val: 'EVEN', odds: 1.9 })} disabled={isSpinning} className={`p-4 rounded-3xl border-2 font-black tech-font text-sm transition-all ${currentBet?.val === 'EVEN' ? 'bg-indigo-600 border-white shadow-lg' : 'bg-indigo-900/20 border-indigo-600/30 text-indigo-400 hover:bg-indigo-900/40'}`}>EVEN 雙</button>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-center border-t border-white/5 pt-8">
                 <div className="flex-1 space-y-2 w-full">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2 tech-font">Bet Amount</span>
                    <div className="flex gap-2">
                       {[100, 1000, 5000].map(amt => (
                         <button key={amt} onClick={() => setBetAmount(amt)} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all border ${betAmount === amt ? 'bg-amber-500 border-white text-black' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>+{amt}</button>
                       ))}
                    </div>
                 </div>
                 <button 
                   onClick={spin}
                   disabled={isSpinning || !currentBet}
                   className="w-full sm:w-auto px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[32px] font-black text-2xl uppercase italic tracking-tighter shadow-2xl shadow-cyan-500/20 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-3 tech-font"
                 >
                   <Zap size={24} fill="white" className={isSpinning ? 'animate-bounce' : ''} />
                   <span>{isSpinning ? 'SYNCING...' : 'SPIN'}</span>
                 </button>
              </div>
           </div>
           
           <p className="text-center tech-font font-black text-xs text-cyan-400 italic animate-pulse">{message}</p>
        </div>
      </div>

      {/* 規則彈窗 */}
      {showRules && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-cyan-500/50 w-full max-w-xl rounded-[48px] p-8 sm:p-12 shadow-2xl relative">
            <button onClick={() => setShowRules(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={32} /></button>
            <h2 className="text-3xl font-black italic tracking-tighter mb-8 flex items-center gap-4 text-cyan-400 uppercase tech-font">
              <Shield /> Roulette Protocol v4.0
            </h2>
            <div className="space-y-8 text-slate-300 text-sm">
               <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                  <h3 className="font-black text-cyan-400 uppercase tracking-widest text-xs mb-4 tech-font">PAYOUT ARCHITECTURE</h3>
                  <div className="space-y-3 font-bold font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>STRAIGHT UP (NUMBER)</span> <span className="text-white">1 : 35</span></div>
                    <div className="flex justify-between"><span>COLOR / ODD-EVEN</span> <span className="text-cyan-400">1 : 1.9</span></div>
                  </div>
               </div>
               <div className="space-y-4 font-medium leading-relaxed opacity-80">
                  <p>• 系統基於歐式 37 槽架構。粒子物理模擬旋轉路徑，結果絕對不可預測。</p>
                  <p>• <span className="text-cyan-400 font-bold">2.0x 極速模式：</span>大幅縮減無效發牌等待時間，最高效率對戰。</p>
                  <p>• 本遊戲僅供 HKER 虛擬積分娛樂，博盡無悔，量力而為。</p>
               </div>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-10 py-5 bg-cyan-600 rounded-[24px] font-black text-lg uppercase tracking-widest text-white shadow-xl tech-font">
              ACKNOWLEDGE PROTOCOL
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scanline-overlay {
          background: linear-gradient(to bottom, transparent 50%, rgba(34, 211, 238, 0.05) 50%);
          background-size: 100% 4px;
          animation: scanline 10s linear infinite;
        }
        @keyframes scanline { from { background-position: 0 0; } to { background-position: 0 100%; } }
        .tech-font { font-family: 'Orbitron', sans-serif; }
      `}</style>
    </div>
  );
}
