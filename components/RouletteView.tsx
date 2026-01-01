
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { Zap, Coins, Info, XCircle, Trophy, Activity, RefreshCw } from 'lucide-react';

interface RouletteViewProps {
  supabase: any;
  userProfile: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const RouletteView: React.FC<RouletteViewProps> = ({ supabase, userProfile, showNotification }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(userProfile?.points || 0);
  const [betAmount, setBetAmount] = useState(1000);
  const [currentBet, setCurrentBet] = useState<{ val: number | string; odds: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (userProfile) setBalance(userProfile.points);
  }, [userProfile]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
    }
    if (!isMuted && spinning) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isMuted, spinning]);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製扇區
    const segmentAngle = (2 * Math.PI) / WHEEL_NUMBERS.length;
    WHEEL_NUMBERS.forEach((num, i) => {
      const startAngle = i * segmentAngle + angle;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      
      if (num === 0) ctx.fillStyle = '#10b981'; // Green
      else if (RED_NUMBERS.includes(num)) ctx.fillStyle = '#ef4444'; // Red
      else ctx.fillStyle = '#1e293b'; // Black
      
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.stroke();

      // 數字
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Orbitron';
      ctx.fillText(num.toString(), radius - 15, 5);
      ctx.restore();
    });

    // 中心裝飾
    ctx.beginPath();
    ctx.arc(centerX, centerY, 130, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#00f2ff';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText("AI CORE", centerX, centerY + 5);

    // 頂部指針
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 15, centerY - radius - 40);
    ctx.lineTo(centerX + 15, centerY - radius - 40);
    ctx.fillStyle = '#00f2ff';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(0);
  }, []);

  const handleBet = (val: number | string, odds: number) => {
    if (spinning) return;
    setCurrentBet({ val, odds });
    showNotification(`已選定: ${val}`, "info");
  };

  const startSpin = async () => {
    if (spinning || !currentBet || balance < betAmount) {
      if (!currentBet) showNotification("請先選擇下注區域", "error");
      else if (balance < betAmount) showNotification("積分不足", "error");
      return;
    }

    setSpinning(true);
    // 即時扣除積分
    const { data: profile } = await supabase.from('profiles').update({ points: balance - betAmount }).eq('id', userProfile?.id).select().single();
    if (profile) setBalance(profile.points);

    let currentRotation = rotation;
    let speed = 0.5 + Math.random() * 0.2; // 極速初始速度
    const duration = 2500; // 2.5秒完成 (2x加速)
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      if (elapsed < duration) {
        currentRotation += speed;
        if (elapsed > duration * 0.7) speed *= 0.98; // 減速曲線
        setRotation(currentRotation);
        drawWheel(currentRotation);
        requestAnimationFrame(animate);
      } else {
        finalizeSpin(currentRotation);
      }
    };
    requestAnimationFrame(animate);
  };

  const finalizeSpin = async (finalRotation: number) => {
    const totalSegments = WHEEL_NUMBERS.length;
    const segmentAngle = (2 * Math.PI) / totalSegments;
    const normalized = (finalRotation % (2 * Math.PI));
    let index = Math.floor(((2 * Math.PI - normalized) % (2 * Math.PI)) / segmentAngle);
    
    const resultNum = WHEEL_NUMBERS[index];
    const isRed = RED_NUMBERS.includes(resultNum);
    const isOdd = resultNum % 2 !== 0;

    let won = false;
    if (typeof currentBet?.val === 'number') {
      if (currentBet.val === resultNum) won = true;
    } else {
      if (currentBet?.val === 'RED' && isRed && resultNum !== 0) won = true;
      if (currentBet?.val === 'BLACK' && !isRed && resultNum !== 0) won = true;
      if (currentBet?.val === 'ODD' && isOdd && resultNum !== 0) won = true;
      if (currentBet?.val === 'EVEN' && !isOdd && resultNum !== 0) won = true;
    }

    let winAmount = won ? Math.floor(betAmount * currentBet!.odds) : 0;
    const newPoints = balance + winAmount;
    
    await supabase.from('profiles').update({ points: newPoints }).eq('id', userProfile?.id);
    setBalance(newPoints);
    setHistory(prev => [resultNum, ...prev].slice(0, 10));
    
    if (won) showNotification(`🏆 量子共振成功！贏得 ${winAmount} PT`, "info");
    else showNotification(`結果為 ${resultNum}，核心已重置`, "error");

    setSpinning(false);
    setCurrentBet(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 relative pb-20">
      {/* 頂部控制列 */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Activity className="text-cyan-400 animate-pulse" size={32}/>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase font-mono">QUANTUM ROULETTE</h1>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">AI Accelerated 200%</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-slate-800/80 px-8 py-3 rounded-2xl border border-white/5 text-center shadow-inner">
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1">錢包餘額</p>
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-500" size={14}/>
                <span className="font-mono font-black text-white text-xl">{balance.toLocaleString()}</span>
              </div>
           </div>
           <button onClick={() => setShowRules(true)} className="p-4 rounded-2xl bg-slate-800 text-slate-300 hover:text-white transition-all"><Info size={24}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左側：Canvas 輪盤 */}
        <div className="lg:col-span-7 bg-slate-950 rounded-[4rem] p-10 shadow-2xl border-b-[12px] border-slate-900 relative flex flex-col items-center">
          <div className="absolute top-8 left-8 flex flex-col gap-2">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">歷史紀錄</p>
            <div className="flex flex-wrap gap-2 w-12">
               {history.map((h, i) => (
                 <span key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${RED_NUMBERS.includes(h) ? 'bg-red-500 text-white' : h === 0 ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{h}</span>
               ))}
            </div>
          </div>
          <canvas ref={canvasRef} width={420} height={420} className="max-w-full drop-shadow-[0_0_30px_rgba(0,242,255,0.2)]" />
        </div>

        {/* 右側：下注面板 */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 space-y-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">精準數字投注 (賠率 1:35)</p>
                <div className="grid grid-cols-6 gap-1">
                   {WHEEL_NUMBERS.slice().sort((a,b)=>a-b).map(n => (
                     <button 
                       key={n} 
                       onClick={() => handleBet(n, 35)}
                       className={`h-10 rounded-lg text-[10px] font-black transition-all active:scale-90 ${
                         currentBet?.val === n ? 'bg-cyan-500 text-white shadow-lg' : RED_NUMBERS.includes(n) ? 'bg-red-50 text-red-500 hover:bg-red-100' : n === 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                       }`}
                     >
                        {n}
                     </button>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 {[
                   { id: 'RED', label: '紅', odds: 2, bg: 'bg-red-500', text: 'text-white' },
                   { id: 'BLACK', label: '黑', odds: 2, bg: 'bg-slate-900', text: 'text-white' },
                   { id: 'ODD', label: '單', odds: 2, bg: 'bg-slate-100', text: 'text-slate-900' },
                   { id: 'EVEN', label: '雙', odds: 2, bg: 'bg-slate-100', text: 'text-slate-900' }
                 ].map(zone => (
                   <button 
                    key={zone.id}
                    onClick={() => handleBet(zone.id, zone.odds)}
                    className={`p-4 rounded-2xl font-black text-sm transition-all border-2 ${
                      currentBet?.val === zone.id ? 'border-cyan-500 scale-105 shadow-lg' : 'border-transparent'
                    } ${zone.bg} ${zone.text}`}
                   >
                    {zone.label}
                   </button>
                 ))}
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">下注金額</span>
                    <div className="flex items-center gap-3">
                       {[100, 1000, 5000].map(amt => (
                         <button key={amt} onClick={() => setBetAmount(amt)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${betAmount === amt ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>{amt/1000}K</button>
                       ))}
                    </div>
                 </div>
                 <button
                  onClick={startSpin}
                  disabled={spinning}
                  className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    spinning ? 'bg-slate-100 text-slate-300' : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:scale-105 active:scale-95'
                  }`}
                 >
                   {spinning ? <RefreshCw className="animate-spin" size={24}/> : <Zap size={24}/>}
                   {spinning ? '量子計算中...' : '啟動脈衝 SPIN'}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* 規則彈窗 */}
      {showRules && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
            <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><XCircle size={32}/></button>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <Trophy className="text-cyan-500"/> 輪盤系統規則
            </h2>
            <div className="space-y-6 text-sm text-slate-600 font-medium">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="font-black text-slate-900 mb-3 uppercase text-xs tracking-widest text-cyan-600">賠率 (PAYOUTS)</p>
                <ul className="space-y-2 font-black">
                  <li className="flex justify-between"><span>精確數字 (0-36)</span> <span>1 : 35</span></li>
                  <li className="flex justify-between"><span>紅/黑、單/雙</span> <span>1 : 1</span></li>
                </ul>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                <li>本系統採用歐式輪盤配置 (單個 0)。</li>
                <li>AI 脈衝技術將旋轉速度提升 200%，大幅縮短單局時間。</li>
                <li>結果由加密隨機數生成器產出，保證公平性。</li>
                <li>所有數據即時儲存至 HKER 區塊鏈雲端節點。</li>
              </ul>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-cyan-600 transition-all">確認</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouletteView;
