
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../../types';
import { Coins, Play, Trash2, Info, XCircle, Activity, Zap, RotateCcw } from 'lucide-react';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

// --- Constants ---
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const COLORS = {
  red: '#ef4444', // Tailwind red-500
  black: '#1f2937', // Tailwind gray-800
  green: '#10b981', // Tailwind emerald-500
  gold: '#f59e0b', // Tailwind amber-500
  cyan: '#06b6d4', // Tailwind cyan-500
};

const CHIPS = [100, 500, 1000, 5000];

const Roulette: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [totalBet, setTotalBet] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [resultMsg, setResultMsg] = useState('');
  const [selectedChip, setSelectedChip] = useState(100);
  const [history, setHistory] = useState<number[]>([]);
  const [showRules, setShowRules] = useState(false);

  // Animation Refs
  const reqRef = useRef<number>();
  const speedRef = useRef(0);
  const rotationRef = useRef(0);

  // Audio
  const spinAudio = useRef<HTMLAudioElement | null>(null);
  const winAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    spinAudio.current = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_736881729b.mp3'); // Mechanical Spin
    winAudio.current = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c153e2.mp3'); // Win Chime
    
    // Initial Draw
    drawWheel(0);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  // --- Drawing Logic ---
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width * 0.45;
    const innerRadius = radius * 0.7;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.cyan;

    const segments = WHEEL_NUMBERS.length;
    const segmentAngle = (2 * Math.PI) / segments;

    for (let i = 0; i < segments; i++) {
      // Rotate counter-clockwise visually to match clockwise spin logic
      const startAngle = (i * segmentAngle) + angle - Math.PI / 2 - segmentAngle / 2;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);

      const num = WHEEL_NUMBERS[i];
      if (num === 0) ctx.fillStyle = COLORS.green;
      else if (RED_NUMBERS.includes(num)) ctx.fillStyle = COLORS.red;
      else ctx.fillStyle = COLORS.black;

      ctx.fill();
      ctx.stroke(); // Outline

      // Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.fillText(num.toString(), radius - 10, 5);
      ctx.restore();
    }

    // Inner Core
    ctx.shadowBlur = 30;
    ctx.shadowColor = COLORS.cyan;
    ctx.fillStyle = '#0f172a'; // Slate-950
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Core Decoration
    ctx.shadowBlur = 10;
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.cyan;
    ctx.font = "bold 16px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = 'transparent';
    ctx.fillText("AI CORE", centerX, centerY);

    // Pointer (Top Center)
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.gold;
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 10, centerY - radius - 30);
    ctx.lineTo(centerX + 10, centerY - radius - 30);
    ctx.fill();
  };

  // --- Game Logic ---

  const handleBet = (key: string) => {
    if (isSpinning) return;
    if (!profile) return alert('請先登入');
    if (profile.points < totalBet + selectedChip) return alert('積分不足');

    const currentAmt = bets[key] || 0;
    setBets({ ...bets, [key]: currentAmt + selectedChip });
    setTotalBet(prev => prev + selectedChip);
  };

  const clearBets = () => {
    if (isSpinning) return;
    setBets({});
    setTotalBet(0);
  };

  const spin = async () => {
    if (isSpinning) return;
    if (totalBet === 0) return alert('請先下注');
    if (!profile || profile.points < totalBet) return alert('積分不足');

    setIsSpinning(true);
    setResultMsg('');
    setLastWin(0);

    // Deduct
    await supabase.from('profiles').update({ points: profile.points - totalBet }).eq('id', profile.id);
    onUpdate();

    // Physics Simulation
    let speed = 0.5 + Math.random() * 0.3; // Initial high speed
    speedRef.current = speed;
    let currentRotation = rotationRef.current;
    const duration = 4000; // 4 seconds (Fast)
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < duration) {
        // Friction decay
        if (progress > duration * 0.6) {
           speedRef.current *= 0.98; // Slow down
        }
        currentRotation += speedRef.current;
        rotationRef.current = currentRotation;
        drawWheel(currentRotation);
        reqRef.current = requestAnimationFrame(animate);
      } else {
        finalizeSpin(currentRotation);
      }
    };

    reqRef.current = requestAnimationFrame(animate);
  };

  const finalizeSpin = async (finalRotation: number) => {
    setIsSpinning(false);
    
    // Calculate result based on angle
    const segments = WHEEL_NUMBERS.length;
    const segmentAngle = (2 * Math.PI) / segments;
    
    // Normalize to 0-2PI
    const normalizedRotation = finalRotation % (2 * Math.PI);
    // Determine index under pointer (Top is -PI/2 relative to start)
    // Formula inversion to find index
    let index = Math.floor(((2 * Math.PI - normalizedRotation) % (2 * Math.PI)) / segmentAngle);
    // Align index
    index = (index + 0) % segments;

    const winningNum = WHEEL_NUMBERS[index];
    setHistory(prev => [winningNum, ...prev].slice(0, 10));

    // Calculate Payout
    let winTotal = 0;
    const isRed = RED_NUMBERS.includes(winningNum);
    const isBlack = !isRed && winningNum !== 0;
    const isOdd = winningNum !== 0 && winningNum % 2 !== 0;
    const isEven = winningNum !== 0 && winningNum % 2 === 0;

    // Check Number Bets
    if (bets[winningNum.toString()]) {
        winTotal += bets[winningNum.toString()] * 36; // 35:1 + bet returned conceptually
    }

    // Check Color
    if (isRed && bets['RED']) winTotal += bets['RED'] * 2;
    if (isBlack && bets['BLACK']) winTotal += bets['BLACK'] * 2;

    // Check Odd/Even
    if (isOdd && bets['ODD']) winTotal += bets['ODD'] * 2;
    if (isEven && bets['EVEN']) winTotal += bets['EVEN'] * 2;

    if (winTotal > 0) {
        setResultMsg(`WINNER: ${winningNum} (${isRed ? 'RED' : winningNum === 0 ? 'GREEN' : 'BLACK'})! +${winTotal}`);
        setLastWin(winTotal);
        winAudio.current?.play().catch(() => {});
        // Update DB
        const { data } = await supabase.from('profiles').select('points').eq('id', profile!.id).single();
        if (data) {
            await supabase.from('profiles').update({ points: data.points + winTotal }).eq('id', profile!.id);
        }
        onUpdate();
    } else {
        setResultMsg(`RESULT: ${winningNum}. Try Again.`);
    }
  };

  const renderNumberBtn = (num: number) => {
    const isRed = RED_NUMBERS.includes(num);
    const colorClass = num === 0 ? 'bg-green-600 border-green-400' : isRed ? 'bg-red-600 border-red-400' : 'bg-slate-700 border-slate-500';
    
    return (
        <button
            key={num}
            disabled={isSpinning}
            onClick={() => handleBet(num.toString())}
            className={`relative w-8 h-10 md:w-10 md:h-12 flex items-center justify-center text-xs md:text-sm font-bold text-white rounded border active:scale-95 transition-all
                ${colorClass} ${bets[num.toString()] ? 'ring-2 ring-yellow-400 z-10 scale-110' : ''}
            `}
        >
            {num}
            {bets[num.toString()] && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] px-1 rounded-full font-black">
                    {bets[num.toString()] >= 1000 ? `${bets[num.toString()]/1000}k` : bets[num.toString()]}
                </div>
            )}
        </button>
    );
  };

  return (
    <div className="flex flex-col items-center bg-slate-950 min-h-[600px] w-full max-w-5xl mx-auto rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden font-sans selection:bg-cyan-500">
      
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 shadow-[0_0_20px_#06b6d4]" />

      {/* Header */}
      <div className="w-full p-6 flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center space-x-3">
          <Activity className="text-cyan-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white">
              QUANTUM <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ROULETTE</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">AI Physics Engine v1.5</p>
          </div>
        </div>
        
        {/* History */}
        <div className="hidden md:flex gap-1 items-center bg-slate-900 px-3 py-1 rounded-full border border-white/5">
            {history.map((n, i) => {
                const color = n === 0 ? 'text-green-500' : RED_NUMBERS.includes(n) ? 'text-red-500' : 'text-slate-400';
                return <span key={i} className={`font-mono font-bold ${color}`}>{n}</span>
            })}
            {history.length === 0 && <span className="text-xs text-slate-600">NO DATA</span>}
        </div>

        <div className="flex items-center gap-4">
            <button onClick={() => setShowRules(true)} className="text-slate-400 hover:text-white"><Info size={20} /></button>
            <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
                <Coins size={14} className="text-yellow-400" />
                <span className="font-mono text-lg text-white font-bold">{profile?.points.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-center relative z-10 p-4 gap-8">
        
        {/* Wheel Section */}
        <div className="relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none">
                {resultMsg && (
                    <div className="bg-slate-900/90 text-cyan-400 border border-cyan-500/50 px-6 py-2 rounded-xl font-black text-lg animate-bounce shadow-[0_0_20px_#06b6d4]">
                        {resultMsg}
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} width={350} height={350} className="max-w-[300px] md:max-w-[400px] aspect-square rounded-full shadow-[0_0_50px_rgba(6,182,212,0.2)]" />
        </div>

        {/* Betting Panel */}
        <div className="flex-1 w-full max-w-xl bg-slate-900/80 backdrop-blur rounded-3xl border border-white/10 p-6 flex flex-col gap-6">
            
            {/* Numbers Grid */}
            <div className="space-y-1">
                <div className="flex justify-center">
                    {renderNumberBtn(0)}
                </div>
                <div className="grid grid-cols-12 gap-1 md:gap-2">
                    {/* Rows 1-36 */}
                    {Array.from({length: 36}, (_, i) => i + 1).map(num => renderNumberBtn(num))}
                </div>
            </div>

            {/* Quick Bets */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
                {['RED', 'BLACK', 'ODD', 'EVEN'].map(type => (
                    <button
                        key={type}
                        disabled={isSpinning}
                        onClick={() => handleBet(type)}
                        className={`py-3 rounded-xl font-black text-xs md:text-sm border-2 transition-all active:scale-95
                            ${type === 'RED' ? 'bg-red-900/30 border-red-500 text-red-400' : 
                              type === 'BLACK' ? 'bg-slate-800 border-slate-500 text-slate-400' :
                              'bg-cyan-900/30 border-cyan-500 text-cyan-400'
                            }
                            ${bets[type] ? 'ring-2 ring-white scale-105' : ''}
                        `}
                    >
                        {type}
                        {bets[type] && <span className="block text-[9px] text-white">{bets[type]}</span>}
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="bg-slate-950 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
                {/* Chips */}
                <div className="flex gap-2">
                    {CHIPS.map(val => (
                        <button
                            key={val}
                            onClick={() => setSelectedChip(val)}
                            className={`w-10 h-10 rounded-full font-bold text-[10px] flex items-center justify-center border-2 transition-all
                                ${selectedChip === val ? 'bg-yellow-500 border-yellow-300 text-black scale-110 shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}
                            `}
                        >
                            {val}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={clearBets}
                        disabled={isSpinning || totalBet === 0}
                        className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button 
                        onClick={spin}
                        disabled={isSpinning || totalBet === 0}
                        className={`flex-1 px-8 py-3 rounded-xl font-black text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${isSpinning ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 active:scale-[0.98] shadow-cyan-600/30'}
                        `}
                    >
                        {isSpinning ? <Zap size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                        {isSpinning ? 'SPINNING...' : `SPIN (${totalBet})`}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <XCircle size={28} />
            </button>
            
            <h2 className="text-2xl font-black text-white mb-6 flex items-center">
              <Info className="mr-2 text-cyan-400" /> 
              GAME PROTOCOL
            </h2>
            
            <div className="space-y-4 text-slate-300 text-sm">
              <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-cyan-500">
                <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Payout Ratio</h3>
                <ul className="space-y-1 font-mono text-xs">
                  <li className="flex justify-between"><span>Single Number</span> <span className="text-cyan-400">35 : 1</span></li>
                  <li className="flex justify-between"><span>Red / Black</span> <span className="text-white">1 : 1</span></li>
                  <li className="flex justify-between"><span>Odd / Even</span> <span className="text-white">1 : 1</span></li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Physics Engine</h3>
                <ul className="list-disc pl-4 space-y-1 marker:text-blue-500 text-xs leading-relaxed">
                  <li>AI 模擬物理摩擦與慣性，速度加快 2 倍。</li>
                  <li>單零歐式輪盤 (Single Zero European Wheel)。</li>
                  <li>每次旋轉皆為獨立隨機事件。</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => setShowRules(false)}
              className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-black text-white hover:opacity-90 transition-opacity shadow-lg"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roulette;
