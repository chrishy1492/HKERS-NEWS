
import React, { useState, useEffect, useRef, useContext } from 'react';
import { RotateCcw, Zap, Target, Layers } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const COLORS = {
    red: '#ff2d55',
    black: '#1c1c1e',
    green: '#00ff66',
    cyan: '#00f2ff',
    gold: '#ffcc00'
};

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

interface Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
}

export const RouletteGame: React.FC = () => {
    const { currentUser, updatePoints } = useContext(DataContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentBet, setCurrentBet] = useState<{type: string, val: string | number, odds: number} | null>(null);
    const [betAmount, setBetAmount] = useState(100);
    const [history, setHistory] = useState<number[]>([]);
    const [message, setMessage] = useState("SYSTEM READY");
    const [winAmount, setWinAmount] = useState(0);

    const rotationRef = useRef(0);
    const speedRef = useRef(0);
    const particlesRef = useRef<Particle[]>([]);
    const reqRef = useRef<number>();

    useEffect(() => {
        for(let i=0; i<60; i++) {
            particlesRef.current.push({
                x: Math.random() * 450,
                y: Math.random() * 450,
                size: Math.random() * 1.5,
                speed: 0.2 + Math.random() * 0.5
            });
        }

        const animate = () => {
            draw();
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, []);

    const placeBet = (type: string, val: string | number, odds: number) => {
        if (isSpinning) return;
        setCurrentBet({ type, val, odds });
        setMessage(`BET LOCKED: ${type === 'NUMBER' ? val : val} (x${odds})`);
        setWinAmount(0);
    };

    const handleSpin = () => {
        if (isSpinning) return;
        if (!currentUser || currentUser.points < betAmount) return alert("積分不足 (Insufficient Funds)");
        if (!currentBet) return alert("請先下注 (Place a bet first)");

        setIsSpinning(true);
        updatePoints(currentUser.id, -betAmount);
        setMessage("QUANTUM ENGINE SPINNING...");
        setWinAmount(0);

        speedRef.current = 0.4 + Math.random() * 0.2; 
        let duration = 2000; 
        let startTime = performance.now();

        const spinLoop = (time: number) => {
            let progress = time - startTime;

            if (progress < duration) {
                if (progress > duration * 0.6) {
                    speedRef.current *= 0.98;
                }
                rotationRef.current += speedRef.current;
                reqRef.current = requestAnimationFrame(spinLoop);
            } else {
                finalizeResult();
            }
        };
        reqRef.current = requestAnimationFrame(spinLoop);
    };

    const finalizeResult = () => {
        setIsSpinning(false);
        speedRef.current = 0;

        const totalSegments = WHEEL_NUMBERS.length;
        const segmentAngle = (2 * Math.PI) / totalSegments;
        
        let currentRotation = rotationRef.current % (2 * Math.PI);
        
        let index = Math.floor(((2 * Math.PI - currentRotation) % (2 * Math.PI)) / segmentAngle);
        index = (index + totalSegments) % totalSegments; 

        const resultNum = WHEEL_NUMBERS[index];
        const isRed = RED_NUMBERS.includes(resultNum);
        const resultColor = resultNum === 0 ? 'GREEN' : (isRed ? 'RED' : 'BLACK');
        const resultOddEven = resultNum !== 0 ? (resultNum % 2 === 0 ? 'EVEN' : 'ODD') : 'ZERO';

        let won = false;
        if (currentBet?.type === 'NUMBER') {
            if (currentBet.val === resultNum) won = true;
        } else if (currentBet?.type === 'COLOR') {
            if (currentBet.val === resultColor) won = true;
        } else if (currentBet?.type === 'ODDEVEN') {
            if (currentBet.val === resultOddEven) won = true;
        }

        setHistory(prev => [resultNum, ...prev.slice(0, 9)]);

        if (won) {
            const payout = Math.floor(betAmount * currentBet!.odds);
            updatePoints(currentUser.id, payout);
            setWinAmount(payout);
            setMessage(`WINNER! RESULT: ${resultNum}`);
        } else {
            setMessage(`LOSS. RESULT: ${resultNum} (${resultColor})`);
        }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = 180;

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(0, 242, 255, 0.2)';
        particlesRef.current.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y -= p.speed;
            if (p.y < 0) p.y = h;
        });

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotationRef.current);
        ctx.translate(-cx, -cy);

        const segments = WHEEL_NUMBERS.length;
        const arc = (2 * Math.PI) / segments;

        for (let i = 0; i < segments; i++) {
            const angle = i * arc - Math.PI / 2 - arc / 2; 
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, angle, angle + arc);
            ctx.closePath();

            const num = WHEEL_NUMBERS[i];
            if (num === 0) ctx.fillStyle = COLORS.green;
            else if (RED_NUMBERS.includes(num)) ctx.fillStyle = COLORS.red;
            else ctx.fillStyle = COLORS.black;

            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px Arial";
            ctx.fillText(num.toString(), radius - 10, 5);
            ctx.restore();
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, 130, 0, 2 * Math.PI);
        ctx.fillStyle = '#050505';
        ctx.fill();
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = "center";
        ctx.font = "bold 20px 'Courier New'"; 
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.cyan;
        ctx.fillText("AI CORE", cx, cy + 5);
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(cx, cy - radius - 5);
        ctx.lineTo(cx - 10, cy - radius - 25);
        ctx.lineTo(cx + 10, cy - radius - 25);
        ctx.closePath();
        ctx.fillStyle = COLORS.cyan;
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.cyan;
    };

    if (!currentUser) return <div className="text-center text-white p-10">Please Login</div>;

    return (
        <div className="bg-[#050505] min-h-[700px] flex flex-col font-mono text-cyan-400 relative overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
                .font-orbitron { font-family: 'Orbitron', sans-serif; }
            `}</style>

            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase">Balance</div>
                        <div className="text-xl text-white font-bold tracking-wider">{currentUser.points} <span className="text-xs text-cyan-500">PTS</span></div>
                    </div>
                    <div className="hidden md:block">
                        <div className="text-[10px] text-gray-500 uppercase">AI Status</div>
                        <div className="text-green-400 text-xs font-bold animate-pulse">ONLINE (200% SPEED)</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] text-gray-500">History</div>
                        <div className="flex gap-1">
                            {history.map((h, i) => (
                                <span key={i} className={`text-xs font-bold ${RED_NUMBERS.includes(h) ? 'text-red-500' : h===0 ? 'text-green-500' : 'text-slate-400'}`}>{h}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative p-4">
                
                <div className={`absolute top-6 z-20 text-2xl font-orbitron font-bold tracking-widest text-center transition-all ${winAmount > 0 ? 'text-yellow-400 scale-110' : 'text-white'}`}>
                    {message}
                    {winAmount > 0 && <div className="text-sm text-cyan-300 mt-1">+{winAmount} PTS</div>}
                </div>

                <canvas 
                    ref={canvasRef} 
                    width={450} 
                    height={450} 
                    className="max-w-full h-auto drop-shadow-[0_0_20px_rgba(0,242,255,0.3)] mb-6 cursor-pointer"
                    onClick={handleSpin}
                />

                <div className="w-full max-w-4xl bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end z-10 backdrop-blur-sm">
                    
                    <div className="flex-1 w-full">
                        <div className="text-[10px] text-gray-500 mb-2 flex justify-between">
                            <span>GRID BET (x35)</span>
                            <span>SELECTED: <span className="text-white">{currentBet?.type === 'NUMBER' ? currentBet.val : '--'}</span></span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                            {Array.from({length: 36}, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    disabled={isSpinning}
                                    onClick={() => placeBet('NUMBER', num, 35)}
                                    className={`
                                        h-8 flex items-center justify-center text-xs font-bold rounded border transition-all
                                        ${RED_NUMBERS.includes(num) ? 'border-red-900 bg-red-900/20 text-red-400' : 'border-slate-700 bg-slate-800/50 text-slate-400'}
                                        ${currentBet?.type === 'NUMBER' && currentBet.val === num ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_#00f2ff]' : 'hover:bg-white/10'}
                                    `}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                disabled={isSpinning}
                                onClick={() => placeBet('NUMBER', 0, 35)}
                                className={`col-span-12 h-6 flex items-center justify-center text-xs font-bold rounded border border-green-900 bg-green-900/20 text-green-400 mt-1
                                    ${currentBet?.type === 'NUMBER' && currentBet.val === 0 ? 'bg-green-500 text-black' : 'hover:bg-green-900/40'}
                                `}
                            >
                                0
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px] w-full md:w-auto">
                        <div className="text-[10px] text-gray-500 text-right">QUICK BET (x1.9)</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => placeBet('COLOR', 'RED', 1.9)} className={`p-2 text-xs font-bold border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-black ${currentBet?.val === 'RED' ? 'bg-red-500 text-black' : 'bg-transparent'}`}>RED</button>
                            <button onClick={() => placeBet('COLOR', 'BLACK', 1.9)} className={`p-2 text-xs font-bold border border-slate-500 text-slate-400 rounded hover:bg-slate-500 hover:text-black ${currentBet?.val === 'BLACK' ? 'bg-slate-500 text-black' : 'bg-transparent'}`}>BLACK</button>
                            <button onClick={() => placeBet('ODDEVEN', 'ODD', 1.9)} className={`p-2 text-xs font-bold border border-cyan-500 text-cyan-500 rounded hover:bg-cyan-500 hover:text-black ${currentBet?.val === 'ODD' ? 'bg-cyan-500 text-black' : 'bg-transparent'}`}>ODD</button>
                            <button onClick={() => placeBet('ODDEVEN', 'EVEN', 1.9)} className={`p-2 text-xs font-bold border border-purple-500 text-purple-500 rounded hover:bg-purple-500 hover:text-black ${currentBet?.val === 'EVEN' ? 'bg-purple-500 text-black' : 'bg-transparent'}`}>EVEN</button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto min-w-[120px]">
                        <div>
                            <div className="text-[10px] text-gray-500">AMOUNT</div>
                            <input 
                                type="number" 
                                value={betAmount} 
                                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value)))}
                                className="w-full bg-slate-900 border border-slate-600 text-white text-center p-2 rounded focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleSpin}
                            disabled={isSpinning}
                            className={`
                                py-3 px-4 font-bold text-sm rounded shadow-lg transition-all flex items-center justify-center gap-2
                                ${isSpinning ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,242,255,0.5)]'}
                            `}
                        >
                            {isSpinning ? <RotateCcw className="animate-spin" size={16}/> : <Zap size={16}/>}
                            SPIN
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-black/80 p-3 grid grid-cols-3 gap-4 text-[10px] text-slate-500 border-t border-slate-800">
                <div>
                    <span className="text-slate-300 font-bold block mb-1 flex items-center"><Layers size={10} className="mr-1"/> RULESET</span>
                    Standard EU Roulette. AI Physics Engine active. Spin duration accelerated (2s).
                </div>
                <div>
                    <span className="text-slate-300 font-bold block mb-1 flex items-center"><Target size={10} className="mr-1"/> ODDS</span>
                    Number: 1:35 | Color/Parity: 1:1.9
                </div>
                <div>
                    <span className="text-slate-300 font-bold block mb-1">DISCLAIMER</span>
                    Results generated by pseudo-random algorithm. For entertainment only.
                </div>
            </div>
        </div>
    );
};
