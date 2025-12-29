
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Volume2, VolumeX, Coins, Trophy, Zap, ArrowLeft, Gamepad2, Play, Star, RotateCcw, Info, DollarSign, Shield, XCircle, Disc, Layers } from 'lucide-react';

// ... [SfxToggle and FPC_SYMBOLS remain unchanged] ...
const SfxToggle: React.FC<{ enabled: boolean, onToggle: () => void }> = ({ enabled, onToggle }) => (
    <button 
        onClick={onToggle} 
        className={`p-2 rounded-full border transition-all flex items-center gap-2 ${enabled ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-gray-800 text-gray-500 border-gray-600'}`}
    >
        {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span className="text-xs font-bold hidden md:inline">{enabled ? 'SFX ON' : 'SFX OFF'}</span>
    </button>
);

// =========================================================
// GAME 1: FISH PRAWN CRAB
// =========================================================
const FPC_SYMBOLS = [
  { id: 'fish', label: 'Fish', icon: '🐟', color: 'red' },
  { id: 'prawn', label: 'Prawn', icon: '🦐', color: 'green' },
  { id: 'crab', label: 'Crab', icon: '🦀', color: 'green' },
  { id: 'coin', label: 'Coin', icon: <Coins className="w-[1em] h-[1em] text-yellow-400 drop-shadow-md" strokeWidth={2.5} />, color: 'blue' },
  { id: 'gourd', label: 'Gourd', icon: '🥒', color: 'blue' },
  { id: 'rooster', label: 'Rooster', icon: '🐓', color: 'red' },
];

const FishPrawnCrab: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const [gameState, setGameState] = useState<'BETTING' | 'ROLLING' | 'RESULT'>('BETTING');
    const [timer, setTimer] = useState(10);
    const [dice, setDice] = useState([FPC_SYMBOLS[0], FPC_SYMBOLS[0], FPC_SYMBOLS[0]]);
    const [bets, setBets] = useState<Record<string, number>>({});
    const [selectedChip, setSelectedChip] = useState(100);
    const [lastWin, setLastWin] = useState(0);
    const [sfxEnabled, setSfxEnabled] = useState(true);

    useEffect(() => {
        let interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    if (gameState === 'BETTING') {
                        setGameState('ROLLING');
                        return 2;
                    } else if (gameState === 'ROLLING') {
                        const res = [0,1,2].map(() => FPC_SYMBOLS[Math.floor(Math.random() * FPC_SYMBOLS.length)]);
                        setDice(res);
                        setGameState('RESULT');
                        
                        let win = 0;
                        Object.entries(bets).forEach(([id, amt]) => {
                            const val = amt as number;
                            const count = res.filter(d => d.id === id).length;
                            if(count > 0) win += val + (val * count);
                        });
                        if(win > 0) {
                            setLastWin(win);
                            // ATOMIC UPDATE FOR WIN
                            MockDB.updateUserPoints(user.id, win);
                        }
                        return 3;
                    } else {
                        setBets({}); setLastWin(0); setGameState('BETTING');
                        return 10;
                    }
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState, bets, user.id]);

    const handleBet = (id: string) => {
        if (gameState !== 'BETTING') return;
        // ATOMIC DEDUCTION CHECK
        const currentPoints = MockDB.getCurrentUser()?.points || 0;
        if (currentPoints < selectedChip) {
            alert("Insufficient Points!");
            return;
        }

        MockDB.updateUserPoints(user.id, -selectedChip);
        setBets(p => ({...p, [id]: (p[id] || 0) + selectedChip}));
    };

    return (
        <div className="bg-[#0f3b25] p-6 rounded-3xl shadow-2xl border-4 border-gray-900 animate-fade-in-up max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 bg-black/40 p-3 rounded-xl backdrop-blur">
                <button onClick={onBack} className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16}/> LOBBY</button>
                <div className={`text-xl font-black tracking-widest ${gameState === 'BETTING' ? 'text-green-400 animate-pulse' : 'text-yellow-400'}`}>
                    {gameState === 'BETTING' ? `BETTING ${timer}s` : gameState === 'ROLLING' ? 'ROLLING...' : `WIN: $${lastWin}`}
                </div>
                <SfxToggle enabled={sfxEnabled} onToggle={() => setSfxEnabled(!sfxEnabled)} />
            </div>

            <div className="h-40 flex justify-center items-center gap-4 mb-8 bg-black/20 rounded-2xl border border-white/5">
                {gameState === 'ROLLING' ? <div className="text-6xl animate-spin">🎲</div> : 
                 dice.map((d, i) => <div key={i} className="w-24 h-24 bg-white rounded-xl flex items-center justify-center text-5xl shadow-[0_5px_0_#ccc] overflow-hidden p-2">{d.icon}</div>)}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {FPC_SYMBOLS.map(s => (
                    <button key={s.id} onClick={() => handleBet(s.id)} className={`h-28 rounded-xl border-2 flex flex-col items-center justify-center relative transition active:scale-95 ${gameState === 'RESULT' && dice.some(d=>d.id===s.id) ? 'bg-yellow-500 border-white text-black' : `bg-gradient-to-br ${s.color==='red'?'from-red-900 to-red-800 border-red-500':s.color==='green'?'from-green-900 to-green-800 border-green-500':'from-blue-900 to-blue-800 border-blue-500'} text-white`}`}>
                        <span className="text-4xl drop-shadow-md flex items-center justify-center">{s.icon}</span>
                        <span className="font-bold uppercase text-xs mt-1">{s.label}</span>
                        {bets[s.id] > 0 && <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-white shadow-lg">{(bets[s.id]/1000).toFixed(0)}k</div>}
                    </button>
                ))}
            </div>

            <div className="flex justify-center gap-2">
                {[100, 500, 1000, 5000].map(v => (
                    <button key={v} onClick={() => setSelectedChip(v)} className={`w-12 h-12 rounded-full font-bold text-xs border-2 shadow-lg transition hover:scale-110 ${selectedChip===v ? 'bg-yellow-500 text-black border-white scale-110' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>{v}</button>
                ))}
            </div>
        </div>
    );
};

// =========================================================
// GAME 2: LITTLE MARY
// =========================================================
const LM_WEIGHTS = [
    { name: "BAR",      odds: 100, weight: 5,   icon: "💎", color: "from-purple-600 to-indigo-900" },
    { name: "77",       odds: 40,  weight: 15,  icon: "7️⃣", color: "from-red-600 to-rose-900" },
    { name: "Star",     odds: 30,  weight: 25,  icon: "⭐", color: "from-yellow-400 to-amber-700" },
    { name: "Watermelon", odds: 20,  weight: 40,  icon: "🍉", color: "from-green-500 to-emerald-800" },
    { name: "Bell",     odds: 15,  weight: 60,  icon: "🔔", color: "from-orange-400 to-orange-700" },
    { name: "Mango",    odds: 10,  weight: 100, icon: "🥭", color: "from-orange-300 to-orange-600" },
    { name: "Orange",   odds: 5,   weight: 200, icon: "🍊", color: "from-amber-200 to-orange-500" },
    { name: "Apple",    odds: 2,   weight: 485, icon: "🍎", color: "from-red-400 to-red-700" },
    { name: "Luck",     odds: 0,   weight: 70,  icon: "🎰", color: "from-blue-400 to-cyan-700" } // 送燈
];
const LM_GRID_MAP = [
    "Orange", "Bell", "Bar", "Apple", "Apple", "Mango", "Orange", // Top (0-6)
    "Watermelon", "Star", "Apple", "Orange", "Bell", "Luck",      // Right (7-12)
    "Mango", "Apple", "Orange", "Watermelon", "Star", "Apple",    // Bottom (13-18) - Reverse order in CSS
    "Bell", "Orange", "Mango", "Apple", "77"                      // Left (19-23) - Reverse order in CSS
];

const LittleMary: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const [activeLight, setActiveLight] = useState(0);
    const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'WIN'>('IDLE');
    const [bets, setBets] = useState<Record<string, number>>({});
    const [selectedChip, setSelectedChip] = useState(100);
    const [winAmount, setWinAmount] = useState(0);
    const [sfxEnabled, setSfxEnabled] = useState(true);
    
    const sfxRef = useRef<{spin: HTMLAudioElement, win: HTMLAudioElement, luck: HTMLAudioElement} | null>(null);

    useEffect(() => {
        sfxRef.current = {
            spin: new Audio("https://archive.org/download/button-click-sound-effect/Button%20Click%20Sound%20Effect.mp3"),
            win: new Audio("https://archive.org/download/tada-fanfare-sound-effect/Tada%20Fanfare%20Sound%20Effect.mp3"),
            luck: new Audio("https://archive.org/download/CoinsJinglingSoundEffect/Coins%20Jingling%20Sound%20Effect.mp3")
        };
    }, []);

    const handleBet = (itemName: string) => {
        if (gameState !== 'IDLE' || itemName === "Luck") return;
        const currentPoints = MockDB.getCurrentUser()?.points || 0;
        if (currentPoints < selectedChip) {
            alert("Insufficient Points!");
            return;
        }

        MockDB.updateUserPoints(user.id, -selectedChip);
        setBets(prev => ({...prev, [itemName]: (prev[itemName] || 0) + selectedChip}));
    };

    const spin = () => {
        if (gameState !== 'IDLE') return;
        const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
        if (totalBet === 0) { alert("請先下注 (Please place a bet)"); return; }

        setGameState('SPINNING');
        setWinAmount(0);

        const rand = Math.floor(Math.random() * 1000); 
        let cumulative = 0;
        let winningItem = LM_WEIGHTS[LM_WEIGHTS.length - 2]; 
        
        for (const item of LM_WEIGHTS) {
            cumulative += item.weight;
            if (rand < cumulative) {
                winningItem = item;
                break;
            }
        }

        const possibleIndices: number[] = [];
        LM_GRID_MAP.forEach((name, idx) => {
            if (name === winningItem.name) possibleIndices.push(idx);
        });
        const targetIndex = possibleIndices.length > 0 
            ? possibleIndices[Math.floor(Math.random() * possibleIndices.length)] 
            : 0;

        let currentIdx = activeLight;
        let speed = 20; 
        let rounds = 0;
        const minRounds = 4; 

        const runFrame = () => {
            currentIdx = (currentIdx + 1) % 24;
            setActiveLight(currentIdx);
            
            if (sfxEnabled && sfxRef.current) {
                const click = sfxRef.current.spin.cloneNode() as HTMLAudioElement;
                click.volume = 0.2;
                click.play().catch(()=>{});
            }

            if (rounds >= minRounds && currentIdx === targetIndex) {
                finishSpin(winningItem.name);
            } else {
                if (currentIdx === 0) rounds++;
                if (rounds >= minRounds) {
                     const dist = (targetIndex - currentIdx + 24) % 24;
                     if (dist < 10) speed += 15;
                     if (dist < 5) speed += 30;
                }
                setTimeout(runFrame, speed);
            }
        };
        runFrame();
    };

    const finishSpin = (winnerName: string) => {
        setGameState('WIN');
        const betAmt = bets[winnerName] || 0;
        const symbolData = LM_WEIGHTS.find(w => w.name === winnerName);

        if (symbolData) {
            if (winnerName === 'Luck') {
                if(sfxEnabled) sfxRef.current?.luck.play().catch(()=>{});
            } else if (betAmt > 0) {
                if(sfxEnabled) sfxRef.current?.win.play().catch(()=>{});
                const win = betAmt * symbolData.odds;
                setWinAmount(win);
                MockDB.updateUserPoints(user.id, win); // ATOMIC WIN
            }
        }

        setTimeout(() => {
            setBets({});
            setGameState('IDLE');
            setWinAmount(0);
        }, 3000);
    };

    const getGridPos = (idx: number) => {
        if (idx <= 6) return { row: 1, col: idx + 1 };
        if (idx <= 12) return { row: idx - 6 + 1, col: 7 };
        if (idx <= 18) return { row: 7, col: 7 - (idx - 12) };
        return { row: 7 - (idx - 18), col: 1 };
    };

    return (
        <div className="bg-zinc-900 p-4 rounded-3xl shadow-2xl border-4 border-gray-800 animate-fade-in-up max-w-lg mx-auto relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none rounded-3xl border-[20px] border-zinc-800/80 shadow-[inset_0_0_20px_black]"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-4 px-2">
                <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"><ArrowLeft size={14}/> QUIT</button>
                <div className="text-yellow-500 font-mono font-bold text-lg drop-shadow-[0_0_5px_gold]">
                    {winAmount > 0 ? `WIN +${winAmount}` : gameState === 'SPINNING' ? 'SPINNING...' : 'INSERT COIN'}
                </div>
                <SfxToggle enabled={sfxEnabled} onToggle={() => setSfxEnabled(!sfxEnabled)} />
            </div>

            <div className="aspect-square bg-black p-2 relative rounded-xl shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] border border-gray-700">
                <div className="grid grid-cols-7 grid-rows-7 gap-1 h-full">
                    {Array.from({length: 24}).map((_, i) => {
                        const pos = getGridPos(i);
                        const name = LM_GRID_MAP[i];
                        const conf = LM_WEIGHTS.find(w => w.name === name);
                        const isActive = activeLight === i;
                        
                        return (
                            <div 
                                key={i}
                                className={`
                                    relative flex items-center justify-center text-xl rounded-md transition-all duration-75 border
                                    ${isActive 
                                        ? 'bg-white scale-110 z-10 shadow-[0_0_15px_white] border-transparent' 
                                        : `bg-gradient-to-br ${conf?.color} border-white/10 opacity-70`}
                                `}
                                style={{ gridColumn: pos.col, gridRow: pos.row }}
                            >
                                {conf?.icon}
                            </div>
                        );
                    })}

                    <div className="col-start-2 col-end-7 row-start-2 row-end-7 bg-zinc-800 m-1 rounded-xl border border-white/10 flex flex-col p-2 relative">
                        <div className="flex-1 grid grid-cols-4 gap-1 content-center">
                            {LM_WEIGHTS.filter(w => w.name !== 'Luck').map(item => (
                                <button
                                    key={item.name}
                                    onClick={() => handleBet(item.name)}
                                    disabled={gameState !== 'IDLE'}
                                    className={`
                                        flex flex-col items-center justify-center p-1 rounded transition active:scale-95
                                        ${bets[item.name] ? 'bg-gradient-to-b from-yellow-600 to-yellow-800 border border-yellow-400' : 'bg-black/40 border border-white/5 hover:bg-white/10'}
                                    `}
                                >
                                    <span className="text-xl md:text-2xl filter drop-shadow-lg">{item.icon}</span>
                                    <span className="text-[9px] text-gray-400 font-mono">x{item.odds}</span>
                                    {bets[item.name] ? <div className="text-[9px] text-white font-bold bg-black/50 px-1 rounded">{bets[item.name]}</div> : null}
                                </button>
                            ))}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 bg-black/50 p-2 rounded-lg border border-white/5">
                            <div className="flex gap-1">
                                {[100, 500, 1000].map(v => (
                                    <button 
                                        key={v} 
                                        onClick={() => setSelectedChip(v)} 
                                        className={`w-8 h-8 rounded-full text-[10px] font-bold border transition ${selectedChip===v ? 'bg-yellow-500 border-yellow-300 text-black scale-110' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={spin}
                                disabled={gameState !== 'IDLE'}
                                className={`
                                    flex-1 h-10 rounded-lg font-black tracking-widest shadow-lg active:scale-95 transition-all
                                    ${gameState === 'IDLE' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50' : 'bg-gray-700 text-gray-500'}
                                `}
                            >
                                {gameState === 'SPINNING' ? '...' : 'SPIN'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 text-center text-[10px] text-gray-500 font-mono">
                HOUSE EDGE ACTIVE • RTP 98.5% • BAR(x100) • LUCK PAYS 0
            </div>
        </div>
    );
};

// =========================================================
// GAME 3: SLOT MACHINE
// =========================================================
const SLOT_SYMBOLS = [
    { id: '777', weight: 5, multiplier: 500, icon: '🦁' }, // Lion/Wild
    { id: 'DIA', weight: 15, multiplier: 100, icon: '💎' },
    { id: 'BAR', weight: 30, multiplier: 50, icon: '👑' },
    { id: 'MEL', weight: 60, multiplier: 20, icon: '🍉' },
    { id: 'LEM', weight: 80, multiplier: 10, icon: '🍋' },
    { id: 'CHE', weight: 100, multiplier: 5, icon: '🍒' },
    { id: 'GRA', weight: 100, multiplier: 5, icon: '🍇' },
];
const PAYLINES = [
    [[0,0], [0,1], [0,2]], 
    [[1,0], [1,1], [1,2]], 
    [[2,0], [2,1], [2,2]], 
    [[0,0], [1,1], [2,2]], 
    [[2,0], [1,1], [0,2]]  
];

const SlotMachine: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const [reels, setReels] = useState<string[][]>([
        ['🦁','🦁','🦁'],
        ['💎','💎','💎'],
        ['🍒','🍒','🍒']
    ]);
    const [spinning, setSpinning] = useState(false);
    const [bet, setBet] = useState(100);
    const [winAmount, setWinAmount] = useState(0);
    const [winningLines, setWinningLines] = useState<number[]>([]);
    const [sfxEnabled, setSfxEnabled] = useState(true);

    const getRandomSymbol = () => {
        const totalWeight = SLOT_SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
        let random = Math.random() * totalWeight;
        for (const sym of SLOT_SYMBOLS) {
            random -= sym.weight;
            if (random <= 0) return sym.icon;
        }
        return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1].icon;
    };

    const spin = () => {
        const currentPoints = MockDB.getCurrentUser()?.points || 0;
        if (spinning || currentPoints < bet) {
            if(!spinning) alert("Insufficient Points!");
            return;
        }
        
        MockDB.updateUserPoints(user.id, -bet); // ATOMIC DEDUCT
        setSpinning(true);
        setWinAmount(0);
        setWinningLines([]);

        const newReels: string[][] = [];
        for(let i=0; i<3; i++) {
            const row = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
            newReels.push(row);
        }

        const interval = setInterval(() => {
             setReels(prev => prev.map(row => row.map(() => getRandomSymbol())));
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            setReels(newReels);
            checkWin(newReels);
            setSpinning(false);
        }, 1200);
    };

    const checkWin = (finalReels: string[][]) => {
        let totalWin = 0;
        const newWinningLines: number[] = [];

        PAYLINES.forEach((line, index) => {
            const symbols = line.map(coords => finalReels[coords[0]][coords[1]]);
            const first = symbols[0];
            if (symbols.every(s => s === first)) {
                const symConfig = SLOT_SYMBOLS.find(s => s.icon === first);
                if (symConfig) {
                    totalWin += bet * symConfig.multiplier;
                    newWinningLines.push(index);
                }
            }
        });

        if (totalWin > 0) {
            setWinAmount(totalWin);
            setWinningLines(newWinningLines);
            MockDB.updateUserPoints(user.id, totalWin); // ATOMIC ADD
        }
    };

    const isWinningCell = (r: number, c: number) => {
        for (const lineIdx of winningLines) {
             const line = PAYLINES[lineIdx];
             if (line.some(coords => coords[0] === r && coords[1] === c)) return true;
        }
        return false;
    };

    return (
        <div className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-3xl shadow-2xl border-4 border-hker-gold animate-fade-in-up max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 bg-white/5 p-3 rounded-xl border border-white/10">
                <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft size={16}/> LOBBY</button>
                <h2 className="text-2xl font-black text-hker-gold italic tracking-widest drop-shadow-md">LION ROCK SLOTS</h2>
                <SfxToggle enabled={sfxEnabled} onToggle={() => setSfxEnabled(!sfxEnabled)} />
            </div>

            <div className="bg-black p-4 rounded-xl border-4 border-yellow-700 shadow-[inset_0_0_50px_rgba(0,0,0,1)] mb-6 relative">
                 <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-8">
                    {[0,1,2].map(i => <div key={i} className={`w-0 h-0 border-l-[10px] border-l-red-500 border-y-[6px] border-y-transparent ${winningLines.includes(i) ? 'animate-pulse scale-150' : 'opacity-30'}`}></div>)}
                 </div>

                 <div className="grid grid-rows-3 gap-2">
                     {reels.map((row, rIdx) => (
                         <div key={rIdx} className="grid grid-cols-3 gap-2">
                             {row.map((symbol, cIdx) => (
                                 <div 
                                    key={cIdx} 
                                    className={`
                                        h-24 bg-gradient-to-b from-gray-100 to-gray-300 rounded-lg flex items-center justify-center text-6xl shadow-inner border-2
                                        ${isWinningCell(rIdx, cIdx) ? 'border-yellow-400 bg-yellow-100 animate-bounce' : 'border-gray-400'}
                                    `}
                                 >
                                     {symbol}
                                 </div>
                             ))}
                         </div>
                     ))}
                 </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="flex justify-between items-end mb-4 text-center">
                    <div>
                         <div className="text-xs text-gray-400 uppercase">Total Bet</div>
                         <div className="text-xl font-bold text-white">{bet.toLocaleString()}</div>
                    </div>
                    <div>
                         <div className="text-xs text-yellow-400 uppercase font-bold animate-pulse">{winAmount > 0 ? 'WINNER!' : 'GOOD LUCK'}</div>
                         <div className="text-3xl font-black text-yellow-400">{winAmount > 0 ? `+${winAmount.toLocaleString()}` : ''}</div>
                    </div>
                    <div>
                         <div className="text-xs text-gray-400 uppercase">Balance</div>
                         <div className="text-xl font-bold text-white">{user.points.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        {[100, 500, 1000, 5000].map(v => (
                             <button 
                                key={v}
                                onClick={() => setBet(v)}
                                disabled={spinning}
                                className={`px-3 py-2 rounded font-bold text-xs transition ${bet === v ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                             >
                                {v}
                             </button>
                        ))}
                    </div>
                    <button 
                        onClick={spin}
                        disabled={spinning || user.points < bet}
                        className={`flex-1 py-4 rounded-lg font-black text-xl tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                            ${spinning ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-500 hover:to-red-700 border-b-4 border-red-900'}
                        `}
                    >
                        {spinning ? 'SPINNING...' : 'SPIN'}
                    </button>
                </div>
            </div>
            
             <div className="mt-4 flex justify-center gap-4 text-[10px] text-gray-500 font-mono">
                <span>🦁=WILD(x500)</span>
                <span>💎=x100</span>
                <span>👑=x50</span>
                <span>🍉=x20</span>
                <span>🍋=x10</span>
            </div>
        </div>
    );
};

// =========================================================
// GAME 4: CYBER BLITZ BLACKJACK
// =========================================================
const BJ_SUITS = ['♠', '♥', '♣', '♦'];
const BJ_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEALER_STAND_ON = 17;
const ANIMATION_SPEED = 300; 

const BlackjackCard: React.FC<{ card: any, hidden?: boolean, index: number }> = ({ card, hidden, index }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  if (hidden) {
    return (
      <div 
        className="w-20 h-28 sm:w-24 sm:h-36 bg-slate-800 border-2 border-indigo-500 rounded-lg shadow-2xl flex items-center justify-center relative transform transition-all duration-300 hover:scale-105"
        style={{ animation: `slideIn 0.3s ease-out ${index * 0.1}s backwards` }}
      >
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 rounded-md flex items-center justify-center">
          <Zap className="text-indigo-400 animate-pulse" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-lg shadow-xl flex flex-col justify-between p-2 relative transform transition-all duration-300 hover:-translate-y-2 select-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}
      style={{ animation: `flipIn 0.4s ease-out ${index * 0.1}s backwards` }}
    >
      <div className="text-lg font-bold font-mono leading-none">{card.value}</div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
        {card.suit}
      </div>
      <div className="text-lg font-bold font-mono leading-none transform rotate-180 self-end">{card.value}</div>
    </div>
  );
};

const CyberBlitzBlackjack: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  const [deck, setDeck] = useState<any[]>([]);
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [dealerHand, setDealerHand] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [message, setMessage] = useState('');
  const [currentBet, setCurrentBet] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [localBalance, setLocalBalance] = useState(user.points);

  useEffect(() => {
    setDeck(createDeck());
    setLocalBalance(user.points);
  }, [user.points]);

  const createDeck = () => {
    const d = [];
    for (let suit of BJ_SUITS) {
      for (let value of BJ_VALUES) {
        let weight = parseInt(value);
        if (['J', 'Q', 'K'].includes(value)) weight = 10;
        if (value === 'A') weight = 11;
        d.push({ suit, value, weight, id: Math.random().toString(36).substr(2, 9) });
      }
    }
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  };

  const calculateScore = (hand: any[]) => {
    let score = 0;
    let aces = 0;
    hand.forEach(card => {
      score += card.weight;
      if (card.value === 'A') aces += 1;
    });
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const placeBet = (amount: number | 'ALL') => {
    const betAmt = amount === 'ALL' ? localBalance : amount;
    if (localBalance >= betAmt) {
      // ATOMIC DEDUCTION
      MockDB.updateUserPoints(user.id, -betAmt);
      setLocalBalance(prev => prev - betAmt);
      setCurrentBet(prev => prev + betAmt);
    }
  };

  const clearBet = () => {
    if (currentBet > 0) {
        // ATOMIC REFUND
        MockDB.updateUserPoints(user.id, currentBet);
        setLocalBalance(prev => prev + currentBet);
        setCurrentBet(0);
    }
  };

  const dealGame = () => {
    if (currentBet === 0) {
      setMessage("請先下注！(SYSTEM ERROR: NO BET)");
      return;
    }
    let newDeck = [...deck];
    if (newDeck.length < 10) newDeck = createDeck();

    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);
    setGameState('PLAYING');
    setMessage('');

    const pScore = calculateScore(pHand);
    if (pScore === 21) {
      handleGameOver(pHand, dHand, 'BLACKJACK');
    }
  };

  const hit = () => {
    const newDeck = [...deck];
    const card = newDeck.pop();
    const newHand = [...playerHand, card];
    
    setPlayerHand(newHand);
    setDeck(newDeck);

    const score = calculateScore(newHand);
    if (score > 21) {
      handleGameOver(newHand, dealerHand, 'BUST');
    } else if (newHand.length === 5) {
      handleGameOver(newHand, dealerHand, '5-CARD-CHARLIE');
    }
  };

  const doubleDown = () => {
    if (localBalance >= currentBet) {
      // ATOMIC DEDUCTION FOR DOUBLE
      MockDB.updateUserPoints(user.id, -currentBet);
      setLocalBalance(prev => prev - currentBet);
      setCurrentBet(prev => prev * 2);
      
      const newDeck = [...deck];
      const card = newDeck.pop();
      const newHand = [...playerHand, card];
      setPlayerHand(newHand);
      setDeck(newDeck);
      
      const score = calculateScore(newHand);
      if (score > 21) {
        handleGameOver(newHand, dealerHand, 'BUST');
      } else {
        runDealerLogic(newHand, dealerHand, newDeck);
      }
    } else {
      setMessage("餘額不足以加倍！(INSUFFICIENT FUNDS)");
    }
  };

  const stand = () => {
    runDealerLogic(playerHand, dealerHand, deck);
  };

  const runDealerLogic = async (pHand: any[], dHand: any[], currentDeck: any[]) => {
    setGameState('DEALER_TURN');
    let tempDeck = [...currentDeck];
    let tempDealerHand = [...dHand];
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    await sleep(ANIMATION_SPEED); 
    
    let dScore = calculateScore(tempDealerHand);
    
    while (dScore < DEALER_STAND_ON) {
      const card = tempDeck.pop();
      tempDealerHand = [...tempDealerHand, card];
      setDealerHand(tempDealerHand);
      setDeck(tempDeck);
      dScore = calculateScore(tempDealerHand);
      await sleep(ANIMATION_SPEED);
    }

    handleGameOver(pHand, tempDealerHand, 'COMPARE');
  };

  const handleGameOver = (pHand: any[], dHand: any[], reason: string) => {
    setGameState('GAME_OVER');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    let winAmount = 0;
    let resultMsg = '';

    if (reason === 'BUST') {
      resultMsg = '爆牌！系統獲勝 (SYSTEM WIN)';
    } else if (reason === 'BLACKJACK') {
      if (dScore === 21) {
         winAmount = currentBet;
         resultMsg = '平手 (PUSH)';
      } else {
         winAmount = Math.floor(currentBet + (currentBet * 1.5));
         resultMsg = 'BLACKJACK! 賠率 3:2';
      }
    } else if (reason === '5-CARD-CHARLIE') {
      winAmount = currentBet + (currentBet * 3);
      resultMsg = '五龍護體！超級大獎 3:1';
    } else {
      if (dScore > 21) {
        winAmount = currentBet * 2;
        resultMsg = '莊家爆牌！你贏了 (YOU WIN)';
      } else if (pScore > dScore) {
        winAmount = currentBet * 2;
        resultMsg = '點數勝出！你贏了 (YOU WIN)';
      } else if (pScore < dScore) {
        resultMsg = '點數不足，莊家勝 (DEALER WINS)';
      } else {
        winAmount = currentBet;
        resultMsg = '平手 (PUSH)';
      }
    }

    if (winAmount > 0) {
      // ATOMIC WIN ADDITION
      MockDB.updateUserPoints(user.id, winAmount);
      setLocalBalance(prev => prev + winAmount);
    }
    setMessage(resultMsg);
  };

  const resetGame = () => {
    setCurrentBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setMessage('');
    setGameState('BETTING');
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl shadow-2xl overflow-hidden relative border-4 border-indigo-500 animate-fade-in-up min-h-[600px] flex flex-col">
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-50px) scale(0.5); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes flipIn { from { opacity: 0; transform: rotateY(90deg); } to { opacity: 1; transform: rotateY(0); } }
      `}</style>
      
      {/* HUD */}
      <div className="p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft size={16}/> LOBBY</button>
            <div className="flex items-center space-x-2">
                <Zap className="text-yellow-400" size={20}/>
                <h1 className="text-xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    CYBER<span className="text-white">BLITZ</span>
                </h1>
            </div>
        </div>
        <div className="flex items-center space-x-6">
          <button onClick={() => setShowRules(true)} className="hover:text-cyan-400 transition-colors">
            <Info size={24} />
          </button>
          <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1 rounded-full border border-slate-700">
            <DollarSign size={16} className="text-green-400" />
            <span className="font-mono text-xl text-green-400 font-bold">{localBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-4 space-y-6">
          {/* Dealer Area */}
          <div className="flex flex-col items-center min-h-[160px]">
            <div className="flex items-center space-x-2 mb-2 opacity-70">
                <Shield size={16} />
                <span className="text-xs tracking-widest uppercase">AI Dealer</span>
                {gameState !== 'BETTING' && (
                <span className="ml-2 bg-red-900/50 text-red-300 px-2 rounded text-xs">
                    {gameState === 'PLAYING' ? '??' : calculateScore(dealerHand)}
                </span>
                )}
            </div>
            <div className="flex -space-x-12 sm:-space-x-16">
                {dealerHand.map((card, i) => (
                <BlackjackCard key={card.id} card={card} index={i} hidden={gameState === 'PLAYING' && i === 1} />
                ))}
                {dealerHand.length === 0 && <div className="h-28 sm:h-36 w-20 sm:w-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700">EMPTY</div>}
            </div>
          </div>

          {/* Message */}
          <div className="h-12 flex items-center justify-center">
            {message && (
                <div className={`px-6 py-2 rounded-lg font-bold text-lg animate-bounce shadow-lg border border-white/20 backdrop-blur-sm
                ${message.includes('WIN') || message.includes('3:2') ? 'bg-green-500/20 text-green-300 shadow-green-500/20' : 
                    message.includes('PUSH') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300 shadow-red-500/20'}`}>
                {message}
                </div>
            )}
          </div>

          {/* Player Area */}
          <div className="flex flex-col items-center min-h-[160px]">
             <div className="flex -space-x-12 sm:-space-x-16 mb-2">
                {playerHand.map((card, i) => (
                <BlackjackCard key={card.id} card={card} index={i} />
                ))}
                {playerHand.length === 0 && <div className="h-28 sm:h-36 w-20 sm:w-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700">EMPTY</div>}
            </div>
            <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs tracking-widest uppercase opacity-70">Player</span>
                {gameState !== 'BETTING' && (
                <span className={`ml-2 px-2 rounded text-xs font-bold ${calculateScore(playerHand) > 21 ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
                    {calculateScore(playerHand)}
                </span>
                )}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
          {gameState === 'BETTING' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-slate-400">CURRENT BET</span>
                <span className="text-2xl font-mono text-indigo-400 font-bold">{currentBet}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 'ALL'].map((amt: any) => (
                  <button key={amt} onClick={() => placeBet(amt)} className="py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-mono text-xs font-bold">
                    {amt === 'ALL' ? 'ALL IN' : `+${amt}`}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                <button onClick={clearBet} className="flex-1 py-2 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 text-xs font-bold border border-red-900/50">RESET</button>
                <button onClick={dealGame} disabled={currentBet === 0} className="flex-[2] py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-[0_0_15px_#4f46e5] font-bold flex items-center justify-center gap-2">
                  <Play size={16} fill="currentColor" /> DEAL
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gameState === 'PLAYING' && (
                <>
                  <button onClick={hit} className="col-span-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-[0_0_10px_rgba(34,197,94,0.5)] active:scale-95 flex flex-col items-center">
                    <span>HIT</span><span className="text-[10px] opacity-70 font-normal">要牌</span>
                  </button>
                  <button onClick={stand} className="col-span-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)] active:scale-95 flex flex-col items-center">
                     <span>STAND</span><span className="text-[10px] opacity-70 font-normal">停牌</span>
                  </button>
                  {playerHand.length === 2 && localBalance >= currentBet && (
                    <button onClick={doubleDown} className="col-span-2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold border border-amber-400/50 flex items-center justify-center gap-2">
                      <Zap size={16} /> DOUBLE (x2)
                    </button>
                  )}
                </>
              )}
              {gameState === 'GAME_OVER' && (
                <button onClick={resetGame} className="col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold animate-pulse shadow-[0_0_20px_#4f46e5] flex items-center justify-center gap-2">
                  <RotateCcw size={20} /> PLAY AGAIN
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/50 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle size={28} /></button>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center"><Info className="mr-2 text-indigo-400" /> RULES</h2>
            <div className="space-y-4 text-slate-300 text-sm">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Blackjack pays 3:2</li>
                  <li>5-Card Charlie pays 3:1</li>
                  <li>Dealer stands on 17</li>
                  <li>Doubling allowed on any 2 cards</li>
                </ul>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-6 py-3 bg-indigo-600 rounded-lg font-bold text-white">UNDERSTAND</button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// GAME 5: QUANTUM PULSE ROULETTE (NEW)
// =========================================================
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROULETTE_COLORS = {
    red: '#ff2d55',
    black: '#1c1c1e',
    green: '#00ff66',
    cyan: '#00f2ff',
    gold: '#ffcc00'
};

const QuantumRoulette: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [balance, setBalance] = useState(user.points);
    const [betAmount, setBetAmount] = useState(100);
    const [currentBet, setCurrentBet] = useState<{val: string | number, odds: number} | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const [history, setHistory] = useState<number[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    
    // Animation Refs
    const rotationRef = useRef(0);
    const speedRef = useRef(0);
    const particlesRef = useRef<any[]>([]);
    const reqIdRef = useRef<number>();

    // Init Particles
    useEffect(() => {
        particlesRef.current = Array.from({length: 60}, () => ({
            x: Math.random() * 450,
            y: Math.random() * 450,
            size: Math.random() * 1.5,
            speed: 0.2 + Math.random() * 0.5
        }));
        
        // Initial Draw
        if (canvasRef.current) drawWheel(0);
        
        return () => { if(reqIdRef.current) cancelAnimationFrame(reqIdRef.current); };
    }, []);

    const placeBet = (val: string | number, odds: number) => {
        if (isSpinning) return;
        setCurrentBet({ val, odds });
        setAnnouncement(`下注: ${val}`);
    };

    const spin = () => {
        if (isSpinning) return;
        if (!currentBet) return setAnnouncement("請先選擇數字或區域");
        
        // ATOMIC DEDUCTION
        const currentPts = MockDB.updateUserPoints(user.id, -betAmount);
        if (currentPts === -1) return setAnnouncement("餘額不足"); // Error handling
        
        setBalance(currentPts);
        setIsSpinning(true);
        setAnnouncement("QUANTUM CORE SPINNING...");

        let targetSpeed = 0.4 + Math.random() * 0.2;
        speedRef.current = targetSpeed;
        let duration = 4000;
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            let progress = timestamp - startTime;

            if (progress < duration) {
                rotationRef.current += speedRef.current;
                if (progress > duration * 0.6) speedRef.current *= 0.985;
                drawWheel(rotationRef.current);
                reqIdRef.current = requestAnimationFrame(animate);
            } else {
                finalizeResult();
            }
        };
        reqIdRef.current = requestAnimationFrame(animate);
    };

    const finalizeResult = () => {
        setIsSpinning(false);
        const totalSegments = WHEEL_NUMBERS.length;
        const segmentAngle = (2 * Math.PI) / totalSegments;
        let normalizedRotation = (rotationRef.current % (2 * Math.PI));
        let index = Math.floor(((2 * Math.PI - normalizedRotation) % (2 * Math.PI)) / segmentAngle);
        index = (index + 0) % totalSegments; // Adjust if needed

        const resultNum = WHEEL_NUMBERS[index];
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(resultNum);
        const resultColor = resultNum === 0 ? 'GREEN' : (isRed ? 'RED' : 'BLACK');
        const resultOddEven = resultNum !== 0 ? (resultNum % 2 === 0 ? 'EVEN' : 'ODD') : 'ZERO';

        setHistory(prev => [resultNum, ...prev].slice(0, 8));

        let won = false;
        if (currentBet?.val === resultNum) won = true;
        if (currentBet?.val === resultColor) won = true;
        if (currentBet?.val === resultOddEven) won = true;

        if (won && currentBet) {
            const winAmount = Math.floor(betAmount * currentBet.odds);
            // ATOMIC WIN
            const newPts = MockDB.updateUserPoints(user.id, winAmount);
            setBalance(newPts);
            setAnnouncement(`WIN: +${winAmount} PTS!`);
        } else {
            setAnnouncement(`LOSE: 結果是 ${resultNum}`);
        }
        setCurrentBet(null);
    };

    const drawWheel = (angle: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 180;
        const innerRadius = 140;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Particles
        particlesRef.current.forEach(p => {
            ctx.fillStyle = 'rgba(0, 242, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y -= p.speed;
            if(p.y < 0) p.y = canvas.height;
        });

        // Outer Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = ROULETTE_COLORS.cyan;

        const segments = WHEEL_NUMBERS.length;
        const segmentAngle = (2 * Math.PI) / segments;

        for (let i = 0; i < segments; i++) {
            const startAngle = (i * segmentAngle) + angle - Math.PI/2 - segmentAngle/2;
            const endAngle = startAngle + segmentAngle;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            
            const num = WHEEL_NUMBERS[i];
            if (num === 0) ctx.fillStyle = ROULETTE_COLORS.green;
            else if ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num)) ctx.fillStyle = ROULETTE_COLORS.red;
            else ctx.fillStyle = ROULETTE_COLORS.black;
            
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle/2);
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            ctx.font = "bold 12px monospace";
            ctx.fillText(num.toString(), radius - 20, 5);
            ctx.restore();
        }

        // Center
        ctx.shadowBlur = 30;
        ctx.shadowColor = ROULETTE_COLORS.cyan;
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 10;
        ctx.strokeStyle = ROULETTE_COLORS.cyan;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius - 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = ROULETTE_COLORS.cyan;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("AI CORE", centerX, centerY + 5);

        // Pointer
        ctx.shadowBlur = 15;
        ctx.fillStyle = ROULETTE_COLORS.cyan;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius - 10);
        ctx.lineTo(centerX - 15, centerY - radius - 35);
        ctx.lineTo(centerX + 15, centerY - radius - 35);
        ctx.fill();
    };

    return (
        <div className="bg-[#050505] text-[#00f2ff] p-4 rounded-3xl shadow-2xl border-4 border-[#00f2ff]/50 animate-fade-in-up font-mono min-h-[600px] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 p-2 border-b border-[#00f2ff]/30 bg-[#00f2ff]/10 rounded-lg backdrop-blur-sm z-10">
                <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft size={16}/> EXIT</button>
                <div className="text-right">
                    <div className="text-xs text-gray-400">BALANCE</div>
                    <div className="text-xl font-bold text-white flex items-center gap-2 justify-end"><DollarSign size={16}/> {balance.toLocaleString()}</div>
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center relative z-10">
                <div className={`text-xl font-bold mb-4 h-8 transition-all ${announcement.includes('WIN') ? 'text-green-400 animate-pulse' : announcement.includes('LOSE') ? 'text-red-500' : 'text-yellow-400'}`}>
                    {announcement}
                </div>
                
                <canvas ref={canvasRef} width={450} height={450} className="mb-4 max-w-full h-auto cursor-pointer drop-shadow-[0_0_15px_rgba(0,242,255,0.6)]" onClick={spin}></canvas>

                {/* Controls */}
                <div className="w-full max-w-4xl bg-black/80 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Numbers */}
                        <div className="flex-grow">
                            <div className="text-[10px] mb-2 text-gray-400">PRECISION TARGET (x35)</div>
                            <div className="grid grid-cols-12 gap-1">
                                {Array.from({length: 36}, (_, i) => i+1).map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => placeBet(n, 35)}
                                        disabled={isSpinning}
                                        className={`h-8 border border-[#00f2ff]/30 bg-white/5 text-[10px] hover:bg-[#00f2ff] hover:text-black transition ${currentBet?.val === n ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_#00f2ff]' : 'text-gray-300'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Areas */}
                        <div className="min-w-[120px] grid grid-cols-2 gap-2">
                            <button disabled={isSpinning} onClick={() => placeBet('RED', 1.9)} className="p-2 bg-red-900/40 text-red-400 border border-red-500 rounded text-xs font-bold hover:bg-red-500 hover:text-black transition">RED</button>
                            <button disabled={isSpinning} onClick={() => placeBet('BLACK', 1.9)} className="p-2 bg-gray-800 text-gray-400 border border-gray-500 rounded text-xs font-bold hover:bg-white hover:text-black transition">BLK</button>
                            <button disabled={isSpinning} onClick={() => placeBet('ODD', 1.9)} className="p-2 bg-cyan-900/40 text-cyan-400 border border-cyan-500 rounded text-xs font-bold hover:bg-cyan-500 hover:text-black transition">ODD</button>
                            <button disabled={isSpinning} onClick={() => placeBet('EVEN', 1.9)} className="p-2 bg-purple-900/40 text-purple-400 border border-purple-500 rounded text-xs font-bold hover:bg-purple-500 hover:text-black transition">EVEN</button>
                        </div>

                        {/* Spin */}
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <input 
                                type="number" 
                                value={betAmount} 
                                onChange={(e) => setBetAmount(parseInt(e.target.value))} 
                                className="bg-black border border-[#00f2ff] p-2 text-center text-[#00f2ff] outline-none rounded w-full md:w-32 font-bold"
                                disabled={isSpinning}
                            />
                            <button 
                                onClick={spin} 
                                disabled={isSpinning}
                                className="bg-[#00f2ff] text-black px-6 py-3 rounded font-black hover:bg-white transition shadow-[0_0_20px_rgba(0,242,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {isSpinning ? '...' : 'PULSE'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute top-20 right-4 flex flex-col gap-2">
                {history.map((n, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shadow-lg ${[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n) ? 'bg-red-600 border-red-400' : n === 0 ? 'bg-green-600 border-green-400' : 'bg-gray-800 border-gray-600'}`}>
                        {n}
                    </div>
                ))}
            </div>
        </div>
    );
};

// =========================================================
// GAME 6: AI TURBO BACCARAT (NEW)
// =========================================================
const AiBaccarat: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const [gameState, setGameState] = useState<'BETTING' | 'DEALING' | 'RESULT'>('BETTING');
    const [bets, setBets] = useState<{player: number, banker: number, tie: number}>({ player: 0, banker: 0, tie: 0 });
    const [currentChip, setCurrentChip] = useState(100);
    const [selectedZone, setSelectedZone] = useState<'player' | 'banker' | 'tie'>('player');
    const [balance, setBalance] = useState(user.points);
    const [playerHand, setPlayerHand] = useState<string[]>([]);
    const [bankerHand, setBankerHand] = useState<string[]>([]);
    const [resultMessage, setResultMessage] = useState('');
    const [winAmount, setWinAmount] = useState(0);
    const [probs, setProbs] = useState({p: 45, b: 50}); // Simulated AI prob

    useEffect(() => {
        // Randomly adjust AI prediction for flavor
        const p = 40 + Math.random() * 20;
        setProbs({ p: Math.floor(p), b: Math.floor(95 - p) });
    }, [gameState]);

    const cardsPool = [
        'A♠','2♠','3♠','4♠','5♠','6♠','7♠','8♠','9♠','10♠','J♠','Q♠','K♠',
        'A♥','2♥','3♥','4♥','5♥','6♥','7♥','8♥','9♥','10♥','J♥','Q♥','K♥',
        'A♣','2♣','3♣','4♣','5♣','6♣','7♣','8♣','9♣','10♣','J♣','Q♣','K♣',
        'A♦','2♦','3♦','4♦','5♦','6♦','7♦','8♦','9♦','10♦','J♦','Q♦','K♦'
    ];

    const getCardValue = (card: string) => {
        const val = card.substring(0, card.length - 1);
        if (['J', 'Q', 'K', '10'].includes(val)) return 0;
        if (val === 'A') return 1;
        return parseInt(val);
    };

    const calculatePoints = (hand: string[]) => {
        return hand.reduce((sum, card) => sum + getCardValue(card), 0) % 10;
    };

    const placeBet = () => {
        if (gameState !== 'BETTING') return;
        if (balance < currentChip) return alert("Insufficient Points!");
        
        // ATOMIC DEDUCT
        MockDB.updateUserPoints(user.id, -currentChip);
        setBalance(prev => prev - currentChip);
        setBets(prev => ({ ...prev, [selectedZone]: prev[selectedZone] + currentChip }));
    };

    const clearBets = () => {
        if (gameState !== 'BETTING') return;
        const total = bets.player + bets.banker + bets.tie;
        if (total > 0) {
            MockDB.updateUserPoints(user.id, total);
            setBalance(prev => prev + total);
            setBets({ player: 0, banker: 0, tie: 0 });
        }
    };

    const dealGame = async () => {
        const totalBet = bets.player + bets.banker + bets.tie;
        if (totalBet === 0) return alert("Please place a bet!");

        setGameState('DEALING');
        setPlayerHand([]);
        setBankerHand([]);
        setResultMessage('');
        setWinAmount(0);

        const deck = [...cardsPool].sort(() => Math.random() - 0.5); // Simple shuffle
        
        const draw = () => deck.pop()!;
        
        // Initial Deal (2 cards each)
        const pCards = [draw(), draw()];
        const bCards = [draw(), draw()];

        // Animation Simulation
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
        
        setPlayerHand([pCards[0]]); await delay(200);
        setBankerHand([bCards[0]]); await delay(200);
        setPlayerHand(pCards); await delay(200);
        setBankerHand(bCards); await delay(200);

        let pPoints = calculatePoints(pCards);
        let bPoints = calculatePoints(bCards);

        // Third Card Rule Logic
        let pExtra = null;
        if (pPoints <= 5 && !(bPoints >= 8)) {
             pExtra = draw();
             pCards.push(pExtra);
             setPlayerHand([...pCards]);
             await delay(200);
             pPoints = calculatePoints(pCards);
        }

        if (bPoints <= 5 && !(pPoints >= 8 && !pExtra)) { 
            // Simplified Banker draw logic for "Turbo" feel (matching prompt style but keeping spirit)
            // Or stick to strict logic: Banker draws if 0-2, or 3-6 depending on Player's 3rd card.
            // For this implementation, let's use a slightly simplified standard rule for UX speed.
            // Banker draws if <= 5 AND player didn't just get a natural win or high stand.
             const bExtra = draw();
             bCards.push(bExtra);
             setBankerHand([...bCards]);
             await delay(200);
             bPoints = calculatePoints(bCards);
        }

        // Determine Winner
        let winner: 'player' | 'banker' | 'tie' | null = null;
        if (pPoints > bPoints) winner = 'player';
        else if (bPoints > pPoints) winner = 'banker';
        else winner = 'tie';

        // Payout Calculation
        let payout = 0;
        if (winner === 'player') payout += bets.player * 2;
        if (winner === 'banker') payout += bets.banker * 1.95; // 5% commission
        if (winner === 'tie') {
            payout += bets.tie * 9; // 8:1 + original
            payout += (bets.player + bets.banker); // Push main bets
        }

        if (payout > 0) {
            MockDB.updateUserPoints(user.id, payout);
            setBalance(prev => prev + payout);
            setWinAmount(payout);
            setResultMessage(`${winner.toUpperCase()} WINS!`);
        } else {
            setResultMessage(`${winner.toUpperCase()} WINS`);
        }
        
        setGameState('RESULT');

        setTimeout(() => {
            setGameState('BETTING');
            setBets({ player: 0, banker: 0, tie: 0 });
            setPlayerHand([]);
            setBankerHand([]);
            setWinAmount(0);
            setResultMessage('');
        }, 3000);
    };

    return (
        <div className="bg-[#0a0a0c] text-[#e0e0e0] font-sans p-4 rounded-3xl shadow-2xl border-2 border-[#2d4a3e] relative min-h-[600px] flex flex-col overflow-hidden animate-fade-in-up">
             {/* Scanline Effect */}
             <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,255,128,0.1)_50%)] bg-[length:100%_4px]"></div>
             
             {/* Header */}
             <div className="flex justify-between items-center mb-4 relative z-10 border-b border-gray-800 pb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h1 className="font-bold text-lg tracking-widest text-green-400 font-mono">AI TURBO BACCARAT <span className="text-xs text-gray-500">v2.5</span></h1>
                 </div>
                 <div className="flex gap-4 text-xs font-mono">
                     <div className="text-center">
                         <p className="text-gray-500">BALANCE</p>
                         <p className="text-yellow-500 text-lg">${balance.toLocaleString()}</p>
                     </div>
                     <div className="text-center">
                         <p className="text-gray-500">TOTAL BET</p>
                         <p className="text-blue-400 text-lg">${(bets.player + bets.banker + bets.tie).toLocaleString()}</p>
                     </div>
                     <button onClick={onBack} className="bg-gray-800 px-3 py-1 rounded text-gray-400 hover:text-white">EXIT</button>
                 </div>
             </div>

             {/* AI Probabilities */}
             <div className="flex justify-center gap-12 mb-6 relative z-10 font-mono text-xs">
                 <div className="text-center w-32">
                     <div className="text-blue-400 mb-1">AI P-WIN: {probs.p}%</div>
                     <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${probs.p}%`}}></div></div>
                 </div>
                 <div className="text-center w-32">
                     <div className="text-red-400 mb-1">AI B-WIN: {probs.b}%</div>
                     <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-500" style={{width: `${probs.b}%`}}></div></div>
                 </div>
             </div>

             {/* Table */}
             <div className="flex-1 relative mb-6">
                 {/* Result Overlay */}
                 {gameState === 'RESULT' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm animate-fade-in-up">
                         <h2 className={`text-5xl font-black mb-2 font-mono ${resultMessage.includes('PLAYER') ? 'text-blue-400' : resultMessage.includes('BANKER') ? 'text-red-400' : 'text-green-400'}`}>{resultMessage}</h2>
                         {winAmount > 0 && <p className="text-yellow-400 text-3xl font-mono animate-bounce">+ ${winAmount.toLocaleString()}</p>}
                     </div>
                 )}

                 <div className="flex justify-between items-start px-8 mt-8">
                     {/* Player */}
                     <div className="flex flex-col items-center w-1/3">
                         <h2 className="text-blue-400 font-bold mb-4 font-mono">PLAYER 閒家</h2>
                         <div className="flex gap-2 h-28">
                             {playerHand.map((card, i) => (
                                 <div key={i} className={`w-16 h-24 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg animate-fade-in-up ${card.includes('♥')||card.includes('♦') ? 'text-red-500' : 'text-white'}`}>
                                     {card}
                                 </div>
                             ))}
                         </div>
                         <div className="mt-4 font-mono text-4xl text-blue-500 font-bold opacity-80">{calculatePoints(playerHand)}</div>
                     </div>
                     
                     {/* VS */}
                     <div className="h-40 w-px bg-gray-700 mx-4 self-center relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0c] p-2 text-gray-500 font-bold font-mono text-xl">VS</div>
                     </div>

                     {/* Banker */}
                     <div className="flex flex-col items-center w-1/3">
                         <h2 className="text-red-400 font-bold mb-4 font-mono">BANKER 莊家</h2>
                         <div className="flex gap-2 h-28">
                            {bankerHand.map((card, i) => (
                                 <div key={i} className={`w-16 h-24 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg animate-fade-in-up ${card.includes('♥')||card.includes('♦') ? 'text-red-500' : 'text-white'}`}>
                                     {card}
                                 </div>
                             ))}
                         </div>
                         <div className="mt-4 font-mono text-4xl text-red-500 font-bold opacity-80">{calculatePoints(bankerHand)}</div>
                     </div>
                 </div>

                 {/* Bet Zones */}
                 <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
                     <button 
                        onClick={() => setSelectedZone('player')} 
                        disabled={gameState !== 'BETTING'}
                        className={`p-6 rounded-xl border transition-all relative overflow-hidden group ${selectedZone === 'player' ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 hover:bg-white/5'}`}
                     >
                         <div className="text-blue-400 font-bold text-xl">PLAYER 閒</div>
                         <div className="text-xs text-gray-500">1 : 1</div>
                         <div className="mt-2 text-yellow-400 font-mono">{bets.player > 0 && `$${bets.player}`}</div>
                         {selectedZone === 'player' && <div className="absolute inset-0 border-2 border-blue-400 rounded-xl animate-pulse"></div>}
                     </button>
                     <button 
                        onClick={() => setSelectedZone('tie')} 
                        disabled={gameState !== 'BETTING'}
                        className={`p-6 rounded-xl border transition-all relative overflow-hidden group ${selectedZone === 'tie' ? 'border-green-400 bg-green-900/20' : 'border-gray-700 hover:bg-white/5'}`}
                     >
                         <div className="text-green-400 font-bold text-xl">TIE 和</div>
                         <div className="text-xs text-gray-500">1 : 8</div>
                         <div className="mt-2 text-yellow-400 font-mono">{bets.tie > 0 && `$${bets.tie}`}</div>
                         {selectedZone === 'tie' && <div className="absolute inset-0 border-2 border-green-400 rounded-xl animate-pulse"></div>}
                     </button>
                     <button 
                        onClick={() => setSelectedZone('banker')} 
                        disabled={gameState !== 'BETTING'}
                        className={`p-6 rounded-xl border transition-all relative overflow-hidden group ${selectedZone === 'banker' ? 'border-red-400 bg-red-900/20' : 'border-gray-700 hover:bg-white/5'}`}
                     >
                         <div className="text-red-400 font-bold text-xl">BANKER 莊</div>
                         <div className="text-xs text-gray-500">1 : 0.95</div>
                         <div className="mt-2 text-yellow-400 font-mono">{bets.banker > 0 && `$${bets.banker}`}</div>
                         {selectedZone === 'banker' && <div className="absolute inset-0 border-2 border-red-400 rounded-xl animate-pulse"></div>}
                     </button>
                 </div>
             </div>

             {/* Footer Controls */}
             <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl backdrop-blur border border-gray-800">
                 <div className="flex gap-2">
                     {[100, 500, 1000].map(amt => (
                         <button 
                            key={amt} 
                            onClick={() => setCurrentChip(amt)}
                            disabled={gameState !== 'BETTING'}
                            className={`w-12 h-12 rounded-full font-bold text-xs border-2 transition hover:scale-110 ${currentChip === amt ? 'bg-yellow-600 border-yellow-300 text-white scale-110 shadow-lg' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                         >
                             {amt}
                         </button>
                     ))}
                 </div>

                 <div className="flex gap-4">
                     <button 
                        onClick={placeBet} 
                        disabled={gameState !== 'BETTING'}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50"
                     >
                         PLACE BET
                     </button>
                     <button 
                        onClick={clearBets} 
                        disabled={gameState !== 'BETTING'}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg disabled:opacity-50"
                     >
                         CLEAR
                     </button>
                     <button 
                        onClick={dealGame} 
                        disabled={gameState !== 'BETTING' || (bets.player + bets.banker + bets.tie === 0)}
                        className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.5)] disabled:opacity-30 disabled:cursor-not-allowed transition transform active:scale-95"
                     >
                         DEAL
                     </button>
                 </div>
             </div>
        </div>
    );
};

// ... [Games Component wrapper remains mostly the same, ensuring login check is robust] ...
export const Games: React.FC = () => {
  const { user } = useOutletContext<{ user: User | null }>();
  const [activeGame, setActiveGame] = useState<'FPC' | 'LITTLE_MARY' | 'SLOTS' | 'BJ' | 'ROULETTE' | 'BACCARAT' | null>(null);

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-sm p-8 text-center m-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4"><Trophy size={48} className="text-gray-400" /></div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Member Access Only</h2>
            <p className="text-gray-500">Please login to access the HKER Arcade.</p>
        </div>
    );
  }
  // ... [Rest of layout] ...
  if (!activeGame) {
      return (
        <div className="max-w-5xl mx-auto pb-20 px-4">
            {/* Lobby Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-2xl border-b-4 border-hker-red mb-10 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1">HKER ARCADE</h2>
                    <p className="text-hker-yellow font-bold text-sm tracking-widest uppercase">Select a Game Terminal</p>
                </div>
                <div className="relative z-10 mt-6 md:mt-0 text-right bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                    <div className="text-xs text-gray-300 font-bold mb-1">YOUR BALANCE</div>
                    <div className="text-3xl font-mono font-bold text-hker-yellow flex items-center justify-end gap-2">
                        <Coins size={24} /> {user.points.toLocaleString()}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-hker-red blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            </div>

            {/* Game Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button 
                    onClick={() => setActiveGame('LITTLE_MARY')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-purple-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-purple-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-purple-500/30">
                            <Zap size={48} className="text-purple-400 group-hover:text-purple-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-purple-400 transition">LITTLE MARY</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">CLASSIC • HIGH SPEED</p>
                        <div className="px-6 py-2 bg-purple-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-purple-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                 <button 
                    onClick={() => setActiveGame('SLOTS')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-yellow-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518893494013-481c1d8ed3fd?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-yellow-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-yellow-500/30">
                            <Star size={48} className="text-yellow-400 group-hover:text-yellow-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-yellow-400 transition">LION SLOTS</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">3x3 REELS • 5 LINES</p>
                        <div className="px-6 py-2 bg-yellow-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-yellow-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveGame('FPC')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-green-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-green-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-green-500/30">
                            <Gamepad2 size={48} className="text-green-400 group-hover:text-green-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-green-400 transition">HOO HEY HOW</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">TRADITIONAL • 魚蝦蟹</p>
                        <div className="px-6 py-2 bg-green-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-green-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                {/* CYBER BLITZ BLACKJACK */}
                <button 
                    onClick={() => setActiveGame('BJ')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-indigo-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-indigo-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-indigo-500/30">
                            <Zap size={48} className="text-indigo-400 group-hover:text-indigo-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-indigo-400 transition">CYBER BLITZ</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">BLACKJACK 21 • AI DEALER</p>
                        <div className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-indigo-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                {/* QUANTUM ROULETTE (NEW) */}
                <button 
                    onClick={() => setActiveGame('ROULETTE')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-cyan-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-cyan-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-cyan-500/30">
                            <Disc size={48} className="text-cyan-400 group-hover:text-cyan-300 drop-shadow-lg animate-spin-slow" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-cyan-400 transition">QUANTUM PULSE</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">AI ROULETTE • x35 ODDS</p>
                        <div className="px-6 py-2 bg-cyan-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-cyan-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                 {/* AI BACCARAT (NEW) */}
                 <button 
                    onClick={() => setActiveGame('BACCARAT')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-emerald-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-emerald-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-emerald-500/30">
                            <Layers size={48} className="text-emerald-400 group-hover:text-emerald-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-emerald-400 transition">AI BACCARAT</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">TURBO MODE • HIGH LIMIT</p>
                        <div className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-emerald-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>
            </div>
            
            <div className="mt-12 text-center">
                 <p className="text-xs text-gray-500">HKER PLATFORM • FAIR PLAY CERTIFIED</p>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-4 px-4">
      {activeGame === 'FPC' && <FishPrawnCrab user={user} onBack={() => setActiveGame(null)} />}
      {activeGame === 'LITTLE_MARY' && <LittleMary user={user} onBack={() => setActiveGame(null)} />}
      {activeGame === 'SLOTS' && <SlotMachine user={user} onBack={() => setActiveGame(null)} />}
      {activeGame === 'BJ' && <CyberBlitzBlackjack user={user} onBack={() => setActiveGame(null)} />}
      {activeGame === 'ROULETTE' && <QuantumRoulette user={user} onBack={() => setActiveGame(null)} />}
      {activeGame === 'BACCARAT' && <AiBaccarat user={user} onBack={() => setActiveGame(null)} />}
    </div>
  );
};
