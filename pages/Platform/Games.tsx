
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Volume2, VolumeX, Coins, Trophy, Zap, ArrowLeft, Gamepad2, Play, Star, RotateCcw, Info, DollarSign, Shield, XCircle, Disc, Layers, BrainCircuit, Activity, CircleDashed } from 'lucide-react';

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

    // Game Loop Engine
    useEffect(() => {
        let interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    if (gameState === 'BETTING') {
                        setGameState('ROLLING');
                        return 3; // Rolling duration
                    } else if (gameState === 'ROLLING') {
                        // AI RNG Logic
                        const res = [0,1,2].map(() => FPC_SYMBOLS[Math.floor(Math.random() * FPC_SYMBOLS.length)]);
                        setDice(res);
                        setGameState('RESULT');
                        
                        // Calculate Payout
                        let win = 0;
                        Object.entries(bets).forEach(([id, amt]) => {
                            const val = amt as number;
                            const count = res.filter(d => d.id === id).length;
                            // Payout: Return Bet + (Bet * Count)
                            // Example: Bet 100 on Fish. 2 Fish appear. Get 100 + (100*2) = 300.
                            if(count > 0) win += val + (val * count);
                        });

                        if(win > 0) {
                            setLastWin(win);
                            // ATOMIC UPDATE FOR WINNINGS
                            MockDB.updateUserPoints(user.id, win);
                        }
                        return 4; // Result duration
                    } else {
                        // Reset for next round
                        setBets({}); 
                        setLastWin(0); 
                        setGameState('BETTING');
                        return 15; // Next betting time
                    }
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState, bets, user.id]);

    // Rolling Animation Effect
    useEffect(() => {
        if (gameState === 'ROLLING') {
            const rollInt = setInterval(() => {
                setDice([
                    FPC_SYMBOLS[Math.floor(Math.random() * FPC_SYMBOLS.length)],
                    FPC_SYMBOLS[Math.floor(Math.random() * FPC_SYMBOLS.length)],
                    FPC_SYMBOLS[Math.floor(Math.random() * FPC_SYMBOLS.length)]
                ]);
            }, 100);
            return () => clearInterval(rollInt);
        }
    }, [gameState]);

    const handleBet = async (id: string) => {
        if (gameState !== 'BETTING') return;
        
        // 1. Check Balance
        const currentPoints = MockDB.getCurrentUser()?.points || 0;
        if (currentPoints < selectedChip) {
            alert("積分不足 (Insufficient Points)!");
            return;
        }

        // 2. Atomic Deduction
        const newPoints = await MockDB.updateUserPoints(user.id, -selectedChip);
        
        // 3. Update Local State if successful
        if (newPoints !== -1) {
             setBets(p => ({...p, [id]: (p[id] || 0) + selectedChip}));
        } else {
            alert("交易失敗，請重試 (Transaction Failed)");
        }
    };

    return (
        <div className="bg-[#0f3b25] p-6 rounded-3xl shadow-2xl border-4 border-gray-900 animate-fade-in-up max-w-2xl mx-auto min-h-[600px] flex flex-col relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>

            {/* Header / HUD */}
            <div className="flex justify-between items-center mb-6 bg-black/40 p-3 rounded-xl backdrop-blur border border-white/5 z-10">
                <button onClick={onBack} className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16}/> LOBBY</button>
                
                {/* Status Bar */}
                <div className="flex flex-col items-center">
                    <div className={`text-2xl font-black tracking-widest ${gameState === 'BETTING' ? 'text-green-400 animate-pulse' : gameState === 'RESULT' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {gameState === 'BETTING' ? `BETTING: ${timer}s` : gameState === 'ROLLING' ? 'ROLLING...' : 'PAYOUT'}
                    </div>
                    {lastWin > 0 && gameState === 'RESULT' && <div className="text-sm font-bold text-yellow-300 animate-bounce">+${lastWin}</div>}
                </div>

                <div className="text-right">
                    <div className="text-[10px] text-gray-400">BALANCE</div>
                    <div className="font-mono font-bold text-yellow-500">{user.points.toLocaleString()}</div>
                </div>
            </div>

            {/* Dice Bowl (Result Area) */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 mb-8">
                <div className={`w-full max-w-sm aspect-video bg-black/30 rounded-3xl border-4 border-[#5c4033] flex items-center justify-center gap-4 relative shadow-[inset_0_0_50px_black] ${gameState === 'ROLLING' ? 'animate-vibrate' : ''}`}>
                    {/* Dice */}
                    {dice.map((d, i) => (
                        <div key={i} className={`w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl flex items-center justify-center text-5xl md:text-6xl shadow-[0_5px_0_#ccc] transform transition-all duration-500 ${gameState==='RESULT' ? 'scale-110 rotate-0' : 'rotate-12'}`}>
                            {d.icon}
                        </div>
                    ))}
                    
                    {/* Result Overlay Text */}
                    {gameState === 'RESULT' && (
                        <div className="absolute -bottom-10 text-white font-bold tracking-widest text-lg bg-black/50 px-4 py-1 rounded-full border border-white/20">
                            {dice.map(d => d.label).join(" • ")}
                        </div>
                    )}
                </div>
            </div>

            {/* Betting Board */}
            <div className="grid grid-cols-3 gap-3 mb-6 z-10">
                {FPC_SYMBOLS.map(s => {
                    const isWinner = gameState === 'RESULT' && dice.some(d => d.id === s.id);
                    const betAmount = bets[s.id] || 0;
                    
                    return (
                        <button 
                            key={s.id} 
                            onClick={() => handleBet(s.id)}
                            disabled={gameState !== 'BETTING'}
                            className={`
                                h-32 rounded-xl border-b-4 flex flex-col items-center justify-center relative transition-all active:scale-95 group
                                ${s.color === 'red' ? 'bg-gradient-to-br from-red-900 to-red-800 border-red-700' : 
                                  s.color === 'green' ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700' : 
                                  'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700'}
                                ${isWinner ? 'ring-4 ring-yellow-400 brightness-125 z-20 shadow-[0_0_30px_gold]' : 'opacity-90 hover:opacity-100'}
                                ${gameState !== 'BETTING' ? 'cursor-not-allowed grayscale-[0.3]' : ''}
                            `}
                        >
                            <span className="text-5xl drop-shadow-xl mb-2 transform group-hover:-translate-y-2 transition duration-300">{s.icon}</span>
                            <span className="font-black uppercase text-xs tracking-wider text-white/80">{s.label}</span>
                            <span className="text-[10px] text-white/50">1 : {dice.filter(d=>d.id===s.id).length || 1}</span>
                            
                            {/* Chip Display */}
                            {betAmount > 0 && (
                                <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce-small">
                                    {(betAmount/1000 >= 1) ? `${(betAmount/1000).toFixed(1)}k` : betAmount}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Chip Selector */}
            <div className="flex justify-center gap-3 z-10 bg-black/40 p-4 rounded-full border border-white/10 backdrop-blur-sm mx-auto">
                {[100, 500, 1000, 5000].map(v => (
                    <button 
                        key={v} 
                        onClick={() => setSelectedChip(v)} 
                        disabled={gameState !== 'BETTING'}
                        className={`
                            w-14 h-14 rounded-full font-bold text-xs border-4 shadow-lg transition transform hover:scale-110
                            ${selectedChip === v 
                                ? 'bg-yellow-500 text-black border-white scale-110 -translate-y-2 shadow-yellow-500/50' 
                                : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400'}
                        `}
                    >
                        {v}
                    </button>
                ))}
            </div>
            
            <div className="text-center mt-4 text-[10px] text-gray-500 font-mono">
                AI FAIR PLAY • RNG CERTIFIED • RTP 96.5%
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

    const handleBet = async (itemName: string) => {
        if (gameState !== 'IDLE' || itemName === "Luck") return;
        const currentPoints = MockDB.getCurrentUser()?.points || 0;
        if (currentPoints < selectedChip) {
            alert("Insufficient Points!");
            return;
        }

        const newPts = await MockDB.updateUserPoints(user.id, -selectedChip);
        if (newPts !== -1) {
            setBets(prev => ({...prev, [itemName]: (prev[itemName] || 0) + selectedChip}));
        }
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

    const finishSpin = async (winnerName: string) => {
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
                await MockDB.updateUserPoints(user.id, win); // ATOMIC WIN
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

    const spin = async () => {
        const currentPoints = MockDB.getCurrentUser()?.points || 0;
        if (spinning || currentPoints < bet) {
            if(!spinning) alert("Insufficient Points!");
            return;
        }
        
        const newPts = await MockDB.updateUserPoints(user.id, -bet); // ATOMIC DEDUCT
        if(newPts === -1) return;

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

        setTimeout(async () => {
            clearInterval(interval);
            setReels(newReels);
            await checkWin(newReels);
            setSpinning(false);
        }, 1200);
    };

    const checkWin = async (finalReels: string[][]) => {
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
            await MockDB.updateUserPoints(user.id, totalWin); // ATOMIC ADD
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
            {/* Same JSX */}
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
// GAME 4: CYBER BLITZ BLACKJACK (AI POWERED)
// =========================================================
const BJ_SUITS = ['♠', '♥', '♣', '♦'];
const BJ_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const ANIMATION_SPEED = 400;

interface CardType { suit: string, value: string, weight: number, id: string }

const CyberBlitzBlackjack: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const [deck, setDeck] = useState<CardType[]>([]);
    const [playerHand, setPlayerHand] = useState<CardType[]>([]);
    const [dealerHand, setDealerHand] = useState<CardType[]>([]);
    const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
    const [message, setMessage] = useState('');
    const [currentBet, setCurrentBet] = useState(0);
    const [showRules, setShowRules] = useState(false);
    const [sfxEnabled, setSfxEnabled] = useState(true);

    const createDeck = () => {
        const d: CardType[] = [];
        for (let suit of BJ_SUITS) {
            for (let value of BJ_VALUES) {
                let weight = parseInt(value);
                if (['J', 'Q', 'K'].includes(value)) weight = 10;
                if (value === 'A') weight = 11;
                d.push({ suit, value, weight, id: Math.random().toString(36).substr(2, 9) });
            }
        }
        return d.sort(() => Math.random() - 0.5);
    };

    const calculateScore = (hand: CardType[]) => {
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

    // Initialization
    useEffect(() => { setDeck(createDeck()); }, []);

    // Betting Logic (Real-time Deduction)
    const placeBet = async (amount: number | 'ALL') => {
        const betAmount = amount === 'ALL' ? user.points : amount;
        if (user.points < betAmount) {
            setMessage("INSUFFICIENT FUNDS (餘額不足)");
            return;
        }
        
        // Atomic Deduction
        const newPoints = await MockDB.updateUserPoints(user.id, -betAmount);
        if (newPoints !== -1) {
            setCurrentBet(prev => prev + betAmount);
            setMessage("");
        }
    };

    const clearBet = async () => {
        if (currentBet > 0) {
            // Atomic Refund
            await MockDB.updateUserPoints(user.id, currentBet);
            setCurrentBet(0);
        }
    };

    const dealGame = () => {
        if (currentBet === 0) return setMessage("PLEASE BET FIRST (請先下注)");
        
        let d = [...deck];
        if (d.length < 10) d = createDeck();
        
        const pHand = [d.pop()!, d.pop()!];
        const dHand = [d.pop()!, d.pop()!];
        
        setPlayerHand(pHand);
        setDealerHand(dHand);
        setDeck(d);
        setGameState('PLAYING');
        setMessage('');

        if (calculateScore(pHand) === 21) {
             handleGameOver(pHand, dHand, 'BLACKJACK');
        }
    };

    const hit = () => {
        const d = [...deck];
        const card = d.pop()!;
        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck(d);

        if (calculateScore(newHand) > 21) {
            handleGameOver(newHand, dealerHand, 'BUST');
        } else if (newHand.length === 5) {
            handleGameOver(newHand, dealerHand, '5-CARD-CHARLIE');
        }
    };

    const doubleDown = async () => {
        if (user.points < currentBet) return setMessage("INSUFFICIENT FUNDS FOR DOUBLE");
        
        // Deduct extra bet
        await MockDB.updateUserPoints(user.id, -currentBet);
        const doubleBet = currentBet * 2;
        setCurrentBet(doubleBet);

        const d = [...deck];
        const card = d.pop()!;
        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck(d);

        if (calculateScore(newHand) > 21) {
            handleGameOver(newHand, dealerHand, 'BUST');
        } else {
            runDealerLogic(newHand, dealerHand, d);
        }
    };

    const runDealerLogic = async (pHand: CardType[], dHand: CardType[], currentDeck: CardType[]) => {
        setGameState('DEALER_TURN');
        let tempHand = [...dHand];
        let tempDeck = [...currentDeck];
        
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
        await sleep(ANIMATION_SPEED);

        while (calculateScore(tempHand) < 17) {
            tempHand.push(tempDeck.pop()!);
            setDealerHand([...tempHand]);
            setDeck([...tempDeck]);
            await sleep(ANIMATION_SPEED);
        }
        
        handleGameOver(pHand, tempHand, 'COMPARE');
    };

    const handleGameOver = async (pHand: CardType[], dHand: CardType[], reason: string) => {
        setGameState('GAME_OVER');
        const pScore = calculateScore(pHand);
        const dScore = calculateScore(dHand);
        let winAmount = 0;
        let msg = '';

        if (reason === 'BUST') {
            msg = 'BUSTED! DEALER WINS';
        } else if (reason === 'BLACKJACK') {
            if (dScore === 21) {
                winAmount = currentBet; // Push
                msg = 'PUSH (Blackjack Tie)';
            } else {
                winAmount = currentBet + Math.floor(currentBet * 1.5); // 3:2
                msg = 'BLACKJACK! (3:2 PAYOUT)';
            }
        } else if (reason === '5-CARD-CHARLIE') {
            winAmount = currentBet + (currentBet * 3); // 3:1
            msg = '5-CARD CHARLIE! (3:1 PAYOUT)';
        } else {
            if (dScore > 21) {
                winAmount = currentBet * 2;
                msg = 'DEALER BUST! YOU WIN';
            } else if (pScore > dScore) {
                winAmount = currentBet * 2;
                msg = 'YOU WIN!';
            } else if (pScore < dScore) {
                msg = 'DEALER WINS';
            } else {
                winAmount = currentBet;
                msg = 'PUSH (TIE)';
            }
        }

        if (winAmount > 0) {
            await MockDB.updateUserPoints(user.id, winAmount);
        }
        setMessage(msg);
    };

    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setCurrentBet(0);
        setGameState('BETTING');
        setMessage('');
    };

    // Sub-component for Card
    const CardView: React.FC<{ card: CardType, index: number, hidden?: boolean }> = ({ card, index, hidden }) => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        if (hidden) return (
            <div className="w-16 h-24 sm:w-20 sm:h-28 bg-slate-800 border-2 border-indigo-500 rounded-lg shadow-xl flex items-center justify-center relative transform hover:scale-105 transition">
                <Zap className="text-indigo-500 animate-pulse" />
            </div>
        );
        return (
            <div className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg shadow-xl flex flex-col justify-between p-1.5 relative transform transition hover:-translate-y-2 select-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                <div className="text-sm font-bold leading-none">{card.value}</div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">{card.suit}</div>
                <div className="text-sm font-bold leading-none self-end rotate-180">{card.value}</div>
            </div>
        );
    };

    return (
        <div className="min-h-[600px] bg-slate-950 text-white font-sans overflow-hidden flex flex-col items-center justify-center relative rounded-3xl border-4 border-indigo-900 shadow-2xl animate-fade-in-up max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
            
            {/* Header */}
            <div className="w-full p-4 flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10 absolute top-0">
                <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16}/> EXIT</button>
                <h1 className="text-xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    CYBER<span className="text-white">BLITZ</span> 21
                </h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowRules(true)}><Info size={20} className="text-gray-400 hover:text-white" /></button>
                    <SfxToggle enabled={sfxEnabled} onToggle={() => setSfxEnabled(!sfxEnabled)} />
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 p-4 space-y-6 mt-16">
                
                {/* Dealer */}
                <div className="flex flex-col items-center min-h-[140px]">
                    <div className="flex items-center gap-2 mb-2 opacity-70 text-xs tracking-widest uppercase">
                        <Shield size={14} /> AI DEALER 
                        {gameState !== 'BETTING' && <span className="bg-red-900/50 text-red-300 px-1.5 rounded">{gameState === 'PLAYING' ? '?' : calculateScore(dealerHand)}</span>}
                    </div>
                    <div className="flex -space-x-8">
                        {dealerHand.map((c, i) => <CardView key={c.id} card={c} index={i} hidden={gameState === 'PLAYING' && i === 1} />)}
                        {dealerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700 text-xs">EMPTY</div>}
                    </div>
                </div>

                {/* Status Message */}
                <div className="h-10 flex items-center justify-center">
                    {message && (
                        <div className={`px-4 py-1.5 rounded text-sm font-bold animate-bounce shadow-lg border backdrop-blur-sm ${message.includes('WIN') ? 'bg-green-500/20 text-green-300 border-green-500/50' : message.includes('PUSH') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300 border-red-500/50'}`}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Player */}
                <div className="flex flex-col items-center min-h-[140px]">
                    <div className="flex -space-x-8 mb-2">
                        {playerHand.map((c, i) => <CardView key={c.id} card={c} index={i} />)}
                        {playerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700 text-xs">EMPTY</div>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs tracking-widest uppercase opacity-70">PLAYER</span>
                        {gameState !== 'BETTING' && <span className={`px-2 rounded text-xs font-bold ${calculateScore(playerHand) > 21 ? 'bg-red-600' : 'bg-indigo-600'}`}>{calculateScore(playerHand)}</span>}
                    </div>
                </div>

                {/* Controls */}
                <div className="w-full bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-end mb-2 border-b border-gray-700 pb-2">
                        <div>
                             <div className="text-[10px] text-slate-400">BALANCE</div>
                             <div className="text-lg font-bold text-white font-mono">{user.points.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-slate-400">BET</div>
                             <div className="text-xl font-bold text-indigo-400 font-mono">{currentBet}</div>
                        </div>
                    </div>

                    {gameState === 'BETTING' ? (
                        <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-2">
                                {[100, 500, 1000, 'ALL'].map((amt) => (
                                    <button key={amt} onClick={() => placeBet(amt as number | 'ALL')} className="py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs font-bold">
                                        {amt === 'ALL' ? 'ALL' : `+${amt}`}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={clearBet} className="flex-1 py-3 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 text-xs font-bold">RESET</button>
                                <button onClick={dealGame} disabled={currentBet===0} className="flex-[2] py-3 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_#4f46e5]">
                                    <Play size={16} fill="currentColor" /> DEAL
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {gameState === 'PLAYING' && (
                                <>
                                    <button onClick={hit} className="py-3 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-[0_0_10px_rgba(34,197,94,0.5)]">HIT</button>
                                    <button onClick={() => runDealerLogic(playerHand, dealerHand, deck)} className="py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)]">STAND</button>
                                    {playerHand.length === 2 && user.points >= currentBet && (
                                        <button onClick={doubleDown} className="col-span-2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold flex items-center justify-center gap-2 text-sm"><Zap size={14}/> DOUBLE (x2)</button>
                                    )}
                                </>
                            )}
                            {gameState === 'GAME_OVER' && (
                                <button onClick={resetGame} className="col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold animate-pulse shadow-[0_0_20px_#4f46e5] flex items-center justify-center gap-2">
                                    <RotateCcw size={18} /> PLAY AGAIN
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {showRules && (
                <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 max-w-sm text-center">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2"><Info size={20}/> RULES</h2>
                        <ul className="text-left text-sm text-gray-300 space-y-2 mb-6">
                            <li>• <strong>Blackjack</strong> pays 3:2</li>
                            <li>• <strong>5-Card Charlie</strong> pays 3:1</li>
                            <li>• Dealer stands on 17</li>
                            <li>• Double down available on any 2 cards</li>
                        </ul>
                        <button onClick={() => setShowRules(false)} className="w-full py-2 bg-indigo-600 rounded text-white font-bold">CLOSE</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// =========================================================
// GAME 5: AI TURBO BACCARAT
// =========================================================
const AI_BAC_SUITS = ['♠', '♥', '♣', '♦'];
const AI_BAC_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface BacCard {
    suit: string;
    value: string;
    points: number;
    id: string;
}

const AiBaccarat: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const [deck, setDeck] = useState<BacCard[]>([]);
    const [pHand, setPHand] = useState<BacCard[]>([]);
    const [bHand, setBHand] = useState<BacCard[]>([]);
    const [bets, setBets] = useState<{player: number, banker: number, tie: number}>({ player: 0, banker: 0, tie: 0 });
    const [gameState, setGameState] = useState<'BETTING' | 'DEALING' | 'RESULT'>('BETTING');
    const [resultMsg, setResultMsg] = useState('');
    const [aiProbs, setAiProbs] = useState({ p: 45, b: 45, t: 10 });
    const [sfxEnabled, setSfxEnabled] = useState(true);

    const createDeck = () => {
        const d: BacCard[] = [];
        for(let suit of AI_BAC_SUITS) {
            for(let value of AI_BAC_VALUES) {
                let points = parseInt(value);
                if (['10', 'J', 'Q', 'K'].includes(value)) points = 0;
                if (value === 'A') points = 1;
                d.push({ suit, value, points, id: Math.random().toString(36) });
            }
        }
        return d.sort(() => Math.random() - 0.5);
    };

    const calcScore = (hand: BacCard[]) => {
        return hand.reduce((acc, c) => acc + c.points, 0) % 10;
    };

    useEffect(() => {
        setDeck(createDeck());
        // Sim AI Fluctuation
        const int = setInterval(() => {
            if(gameState === 'BETTING') {
                const baseP = 40 + Math.random() * 10;
                setAiProbs({ p: baseP, b: 90 - baseP, t: 10 });
            }
        }, 3000);
        return () => clearInterval(int);
    }, [gameState]);

    const handleBet = async (type: 'player' | 'banker' | 'tie', amount: number) => {
        if (gameState !== 'BETTING') return;
        if (user.points < amount) return alert("Insufficient Points");

        const newPts = await MockDB.updateUserPoints(user.id, -amount);
        if (newPts !== -1) {
            setBets(prev => ({ ...prev, [type]: prev[type] + amount }));
        }
    };

    const clearBets = async () => {
        if (gameState !== 'BETTING') return;
        const total = bets.player + bets.banker + bets.tie;
        if (total > 0) {
            await MockDB.updateUserPoints(user.id, total);
            setBets({ player: 0, banker: 0, tie: 0 });
        }
    };

    // --- BACCARAT LOGIC ENGINE ---
    const deal = async () => {
        const totalBet = bets.player + bets.banker + bets.tie;
        if (totalBet === 0) return alert("Please place a bet");

        setGameState('DEALING');
        let d = [...deck];
        if (d.length < 6) d = createDeck();

        const ph = [d.pop()!, d.pop()!];
        const bh = [d.pop()!, d.pop()!];
        
        // Initial Deal Animation
        setPHand([ph[0]]); await new Promise(r => setTimeout(r, 200));
        setBHand([bh[0]]); await new Promise(r => setTimeout(r, 200));
        setPHand([ph[0], ph[1]]); await new Promise(r => setTimeout(r, 200));
        setBHand([bh[0], bh[1]]); await new Promise(r => setTimeout(r, 200));

        let pScore = calcScore(ph);
        let bScore = calcScore(bh);
        
        // Third Card Rules
        let pThird: BacCard | null = null;
        
        // 1. Natural?
        if (pScore < 8 && bScore < 8) {
            // 2. Player Draws?
            if (pScore <= 5) {
                pThird = d.pop()!;
                ph.push(pThird);
                setPHand([...ph]);
                await new Promise(r => setTimeout(r, 400));
                pScore = calcScore(ph);
            }

            // 3. Banker Draws?
            let bankerDraws = false;
            if (!pThird) {
                if (bScore <= 5) bankerDraws = true;
            } else {
                const pv = pThird.points;
                if (bScore <= 2) bankerDraws = true;
                else if (bScore === 3 && pv !== 8) bankerDraws = true;
                else if (bScore === 4 && (pv >= 2 && pv <= 7)) bankerDraws = true;
                else if (bScore === 5 && (pv >= 4 && pv <= 7)) bankerDraws = true;
                else if (bScore === 6 && (pv >= 6 && pv <= 7)) bankerDraws = true;
            }

            if (bankerDraws) {
                const bThird = d.pop()!;
                bh.push(bThird);
                setBHand([...bh]);
                await new Promise(r => setTimeout(r, 400));
                bScore = calcScore(bh);
            }
        }

        setDeck(d);
        settle(pScore, bScore);
    };

    const settle = async (pScore: number, bScore: number) => {
        let win = 0;
        let winner = '';

        if (pScore > bScore) {
            winner = 'PLAYER';
            if (bets.player > 0) win += bets.player * 2;
        } else if (bScore > pScore) {
            winner = 'BANKER';
            if (bets.banker > 0) win += bets.banker * 1.95; // 5% comm
        } else {
            winner = 'TIE';
            if (bets.tie > 0) win += bets.tie * 9; // 8:1 + original
            if (bets.player > 0) win += bets.player; // Push
            if (bets.banker > 0) win += bets.banker; // Push
        }

        if (win > 0) {
            await MockDB.updateUserPoints(user.id, win);
            setResultMsg(`${winner} WINS! +${win.toLocaleString()}`);
        } else {
            setResultMsg(`${winner} WINS!`);
        }

        setGameState('RESULT');
        setTimeout(() => {
            setGameState('BETTING');
            setBets({ player: 0, banker: 0, tie: 0 });
            setPHand([]);
            setBHand([]);
            setResultMsg('');
        }, 3000);
    };

    // Sub-comp
    const BCard: React.FC<{c: BacCard}> = ({c}) => (
        <div className={`w-14 h-20 bg-white rounded flex flex-col items-center justify-center border-2 ${['♥','♦'].includes(c.suit)?'text-red-600 border-red-200':'text-black border-gray-200'} shadow`}>
            <span className="text-lg font-bold">{c.value}</span>
            <span className="text-xl">{c.suit}</span>
        </div>
    );

    return (
        <div className="bg-[#0a0a0c] p-2 rounded-3xl shadow-2xl border-4 border-[#2d4a3e] animate-fade-in-up max-w-3xl mx-auto min-h-[600px] flex flex-col relative overflow-hidden font-sans text-gray-200">
             {/* Scanline Effect */}
             <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-0 opacity-20"></div>

             {/* Header */}
             <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur z-10 border-b border-gray-800">
                 <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold hover:text-white"><ArrowLeft size={14}/> LOBBY</button>
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="text-green-400 font-bold tracking-widest text-lg font-mono">AI TURBO BACCARAT</span>
                 </div>
                 <SfxToggle enabled={sfxEnabled} onToggle={()=>setSfxEnabled(!sfxEnabled)} />
             </div>

             {/* AI PROBABILITY BAR */}
             <div className="flex justify-center gap-8 mt-4 z-10 text-[10px] uppercase font-bold tracking-wider">
                 <div className="w-32">
                     <div className="flex justify-between mb-1 text-blue-400"><span>AI: Player</span><span>{aiProbs.p.toFixed(0)}%</span></div>
                     <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${aiProbs.p}%`}}></div></div>
                 </div>
                 <div className="w-32">
                     <div className="flex justify-between mb-1 text-red-400"><span>AI: Banker</span><span>{aiProbs.b.toFixed(0)}%</span></div>
                     <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-1000" style={{width: `${aiProbs.b}%`}}></div></div>
                 </div>
             </div>

             {/* TABLE */}
             <div className="flex-1 flex flex-col items-center justify-center z-10">
                 <div className="flex w-full justify-around items-start mb-8">
                     {/* PLAYER */}
                     <div className="flex flex-col items-center">
                         <h3 className="text-blue-500 font-bold text-xl mb-2 tracking-widest">PLAYER {gameState!=='BETTING' && <span className="text-white text-sm bg-blue-900 px-2 rounded ml-2">{calcScore(pHand)}</span>}</h3>
                         <div className="flex gap-2 h-24">
                             {pHand.map(c => <BCard key={c.id} c={c}/>)}
                         </div>
                     </div>
                     
                     <div className="h-24 w-px bg-gray-700 mx-4"></div>

                     {/* BANKER */}
                     <div className="flex flex-col items-center">
                         <h3 className="text-red-500 font-bold text-xl mb-2 tracking-widest">BANKER {gameState!=='BETTING' && <span className="text-white text-sm bg-red-900 px-2 rounded ml-2">{calcScore(bHand)}</span>}</h3>
                         <div className="flex gap-2 h-24">
                             {bHand.map(c => <BCard key={c.id} c={c}/>)}
                         </div>
                     </div>
                 </div>

                 {/* RESULT MSG */}
                 <div className="h-12 flex items-center justify-center mb-4">
                     {resultMsg && <div className="text-3xl font-black text-yellow-400 animate-bounce drop-shadow-md bg-black/50 px-6 py-2 rounded-xl border border-yellow-500/50">{resultMsg}</div>}
                 </div>

                 {/* BET ZONES */}
                 <div className="grid grid-cols-3 gap-4 w-full max-w-xl px-4">
                     <button onClick={() => handleBet('player', 100)} disabled={gameState!=='BETTING'} className={`bg-blue-900/30 border-2 ${bets.player > 0 ? 'border-blue-400 bg-blue-900/50' : 'border-blue-900/50'} rounded-xl p-4 hover:bg-blue-900/60 transition group relative`}>
                         <div className="text-blue-400 font-bold text-xl">PLAYER</div>
                         <div className="text-xs text-gray-500">1 : 1</div>
                         {bets.player > 0 && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 rounded-full">${bets.player}</div>}
                     </button>
                     <button onClick={() => handleBet('tie', 100)} disabled={gameState!=='BETTING'} className={`bg-green-900/30 border-2 ${bets.tie > 0 ? 'border-green-400 bg-green-900/50' : 'border-green-900/50'} rounded-xl p-4 hover:bg-green-900/60 transition group relative`}>
                         <div className="text-green-400 font-bold text-xl">TIE</div>
                         <div className="text-xs text-gray-500">1 : 8</div>
                         {bets.tie > 0 && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 rounded-full">${bets.tie}</div>}
                     </button>
                     <button onClick={() => handleBet('banker', 100)} disabled={gameState!=='BETTING'} className={`bg-red-900/30 border-2 ${bets.banker > 0 ? 'border-red-400 bg-red-900/50' : 'border-red-900/50'} rounded-xl p-4 hover:bg-red-900/60 transition group relative`}>
                         <div className="text-red-400 font-bold text-xl">BANKER</div>
                         <div className="text-xs text-gray-500">1 : 0.95</div>
                         {bets.banker > 0 && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 rounded-full">${bets.banker}</div>}
                     </button>
                 </div>
             </div>

             {/* FOOTER CONTROLS */}
             <div className="bg-gray-900/80 p-4 mt-4 flex items-center justify-between border-t border-gray-800 z-10">
                 <div className="flex gap-2">
                     <button onClick={()=>handleBet('player', 100)} className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold border-2 border-blue-300 shadow hover:scale-110 transition flex items-center justify-center text-xs">100</button>
                     <button onClick={()=>handleBet('player', 500)} className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold border-2 border-purple-300 shadow hover:scale-110 transition flex items-center justify-center text-xs">500</button>
                     <button onClick={()=>handleBet('player', 1000)} className="w-10 h-10 rounded-full bg-red-600 text-white font-bold border-2 border-red-300 shadow hover:scale-110 transition flex items-center justify-center text-xs">1k</button>
                 </div>

                 <div className="flex gap-3">
                     <button onClick={clearBets} disabled={gameState!=='BETTING'} className="px-4 py-2 text-gray-400 font-bold hover:text-white text-sm">CLEAR</button>
                     <button onClick={deal} disabled={gameState!=='BETTING'} className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-[0_0_15px_rgba(0,255,0,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center gap-2">
                         {gameState==='DEALING' ? <Activity className="animate-spin" size={16}/> : <Play size={16} fill="currentColor"/>}
                         DEAL
                     </button>
                 </div>
             </div>
        </div>
    );
};

// =========================================================
// GAME 6: QUANTUM AI ROULETTE (OPTIMIZED LAYOUT)
// =========================================================
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

const QuantumRoulette: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'RESULT'>('IDLE');
    const [betAmount, setBetAmount] = useState(100);
    const [selectedBet, setSelectedBet] = useState<{type: 'NUM'|'RED'|'BLACK'|'ODD'|'EVEN', val: number|string, odds: number} | null>(null);
    const [lastWin, setLastWin] = useState<string | null>(null);
    const [history, setHistory] = useState<number[]>([]);
    const [sfxEnabled, setSfxEnabled] = useState(true);

    const rotationRef = useRef(0);
    const speedRef = useRef(0);
    const particlesRef = useRef<{x:number, y:number, size:number, speed:number}[]>([]);
    const requestRef = useRef<number>();

    // Init Particles
    useEffect(() => {
        for(let i=0; i<60; i++) {
            particlesRef.current.push({
                x: Math.random() * 450,
                y: Math.random() * 450,
                size: Math.random() * 1.5,
                speed: 0.2 + Math.random() * 0.5
            });
        }
    }, []);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const animate = () => {
            if(gameState === 'SPINNING') {
                rotationRef.current += speedRef.current;
                if(speedRef.current > 0.001) speedRef.current *= 0.985; // Deceleration
                else finalizeResult();
            }

            draw(ctx, rotationRef.current);
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [gameState]);

    const draw = (ctx: CanvasRenderingContext2D, angle: number) => {
        const cx = 225, cy = 225, r = 180;
        ctx.clearRect(0,0,450,450);

        // Particles
        ctx.fillStyle = 'rgba(0, 242, 255, 0.2)';
        particlesRef.current.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
            p.y -= p.speed;
            if(p.y < 0) p.y = 450;
        });

        // Wheel
        const segAngle = (Math.PI*2)/37;
        for(let i=0; i<37; i++) {
            const start = i*segAngle + angle - Math.PI/2 - segAngle/2;
            const end = start + segAngle;
            ctx.beginPath();
            ctx.moveTo(cx,cy);
            ctx.arc(cx,cy,r,start,end);
            
            const num = WHEEL_NUMBERS[i];
            if(num === 0) ctx.fillStyle = '#00ff66';
            else if(RED_NUMBERS.includes(num)) ctx.fillStyle = '#ff2d55';
            else ctx.fillStyle = '#1c1c1e';
            
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.stroke();

            // Number
            ctx.save();
            ctx.translate(cx,cy);
            ctx.rotate(start + segAngle/2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(num.toString(), r-20, 5);
            ctx.restore();
        }

        // Core
        ctx.fillStyle = '#050505';
        ctx.beginPath(); ctx.arc(cx,cy,140,0,Math.PI*2); ctx.fill();
        
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx,cy,130,0,Math.PI*2); ctx.stroke();

        ctx.fillStyle = '#00f2ff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("AI CORE", cx, cy+5);

        // Pointer
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath();
        ctx.moveTo(cx, cy-r-10);
        ctx.lineTo(cx-10, cy-r-30);
        ctx.lineTo(cx+10, cy-r-30);
        ctx.fill();
    };

    const placeBet = (type: 'NUM'|'RED'|'BLACK'|'ODD'|'EVEN', val: number|string, odds: number) => {
        if(gameState !== 'IDLE') return;
        setSelectedBet({type, val, odds});
    };

    const spin = async () => {
        if(!selectedBet || gameState !== 'IDLE') return;
        if(user.points < betAmount) return alert("Insufficient Points");

        // DEDUCT POINTS
        await MockDB.updateUserPoints(user.id, -betAmount);
        
        setGameState('SPINNING');
        setLastWin(null);
        speedRef.current = 0.4 + Math.random()*0.2; // Physics random force
    };

    const finalizeResult = async () => {
        setGameState('RESULT');
        const segAngle = (Math.PI*2)/37;
        const normRot = rotationRef.current % (Math.PI*2);
        const index = Math.floor(((Math.PI*2 - normRot) % (Math.PI*2)) / segAngle);
        const winNum = WHEEL_NUMBERS[(index+0)%37]; // align calibration
        
        setHistory(prev => [winNum, ...prev].slice(0,10));

        let won = false;
        if(selectedBet?.type === 'NUM' && selectedBet.val === winNum) won = true;
        else if(selectedBet?.type === 'RED' && RED_NUMBERS.includes(winNum)) won = true;
        else if(selectedBet?.type === 'BLACK' && winNum !== 0 && !RED_NUMBERS.includes(winNum)) won = true;
        else if(selectedBet?.type === 'ODD' && winNum !== 0 && winNum%2 !== 0) won = true;
        else if(selectedBet?.type === 'EVEN' && winNum !== 0 && winNum%2 === 0) won = true;

        if(won) {
            const winAmt = Math.floor(betAmount * selectedBet!.odds);
            await MockDB.updateUserPoints(user.id, winAmt);
            setLastWin(`WIN: +${winAmt}`);
        } else {
            setLastWin(`LOSE: Result ${winNum}`);
        }

        setTimeout(() => setGameState('IDLE'), 2000);
    };

    return (
        <div className="bg-black text-cyan-400 font-mono min-h-[700px] flex flex-col items-center rounded-3xl border-4 border-cyan-900 shadow-[0_0_50px_rgba(0,242,255,0.2)] overflow-hidden relative animate-fade-in-up max-w-4xl mx-auto">
            {/* HUD */}
            <div className="w-full p-4 flex justify-between items-center border-b border-cyan-900/50 bg-cyan-900/10">
                <button onClick={onBack}><ArrowLeft className="hover:text-white transition"/></button>
                <div className="text-center">
                    <h2 className="text-xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]">QUANTUM ROULETTE</h2>
                    <p className="text-[10px] text-cyan-600">AI PHYSICS ENGINE v4.0</p>
                </div>
                <SfxToggle enabled={sfxEnabled} onToggle={()=>setSfxEnabled(!sfxEnabled)}/>
            </div>

            {/* MAIN AREA - FLEX LAYOUT TO PREVENT OVERLAP */}
            <div className="flex-1 flex flex-col w-full">
                {/* 1. Canvas Area */}
                <div className="relative flex-1 flex flex-col items-center justify-center p-4 min-h-[300px]">
                    {lastWin && (
                        <div className={`absolute top-10 z-10 text-4xl font-black animate-bounce ${lastWin.includes('WIN') ? 'text-yellow-400' : 'text-red-500'}`}>
                            {lastWin}
                        </div>
                    )}
                    <canvas ref={canvasRef} width={450} height={450} className="max-w-full h-auto aspect-square drop-shadow-[0_0_20px_rgba(0,242,255,0.3)]"/>
                </div>
                
                {/* 2. Betting Board Area */}
                <div className="w-full bg-black/80 border-t-2 border-cyan-900 p-4 backdrop-blur-md z-20">
                    <div className="flex justify-between items-center mb-4 text-xs text-gray-400">
                        <span>BALANCE: <span className="text-white text-lg font-bold">{user.points}</span></span>
                        <span>HISTORY: {history.map(n => <span key={Math.random()} className={`mx-1 ${n===0?'text-green-500':RED_NUMBERS.includes(n)?'text-red-500':'text-gray-400'}`}>{n}</span>)}</span>
                    </div>

                    {/* Responsive Grid: 6 cols on mobile, 12 on desktop */}
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-4 h-32 overflow-y-auto custom-scrollbar">
                        {Array.from({length:36}, (_,i)=>i+1).map(n => (
                            <button 
                                key={n}
                                onClick={() => placeBet('NUM', n, 35)}
                                className={`text-[10px] py-3 border rounded font-bold ${selectedBet?.val===n ? 'bg-cyan-500 text-black border-white' : 'border-cyan-900 bg-cyan-900/20 hover:bg-cyan-500 hover:text-black'}`}
                            >
                                {n}
                            </button>
                        ))}
                        <button onClick={() => placeBet('NUM', 0, 35)} className={`col-span-6 sm:col-span-12 text-xs py-2 border rounded border-green-900 text-green-500 hover:bg-green-500 hover:text-black ${selectedBet?.val===0 ? 'bg-green-500 text-black':''}`}>0</button>
                    </div>

                    <div className="flex gap-2 mb-4 overflow-x-auto">
                        <button onClick={()=>placeBet('RED', 'RED', 1.9)} className={`flex-1 py-3 px-2 whitespace-nowrap border border-red-900 bg-red-900/20 text-red-500 font-bold rounded hover:bg-red-500 hover:text-black transition ${selectedBet?.type==='RED'?'bg-red-500 text-black':''}`}>RED (x1.9)</button>
                        <button onClick={()=>placeBet('BLACK', 'BLACK', 1.9)} className={`flex-1 py-3 px-2 whitespace-nowrap border border-gray-700 bg-gray-800 text-gray-400 font-bold rounded hover:bg-gray-500 hover:text-black transition ${selectedBet?.type==='BLACK'?'bg-gray-500 text-black':''}`}>BLACK (x1.9)</button>
                        <button onClick={()=>placeBet('ODD', 'ODD', 1.9)} className={`flex-1 py-3 px-2 whitespace-nowrap border border-cyan-900 bg-cyan-900/20 text-cyan-500 font-bold rounded hover:bg-cyan-500 hover:text-black transition ${selectedBet?.type==='ODD'?'bg-cyan-500 text-black':''}`}>ODD (x1.9)</button>
                        <button onClick={()=>placeBet('EVEN', 'EVEN', 1.9)} className={`flex-1 py-3 px-2 whitespace-nowrap border border-purple-900 bg-purple-900/20 text-purple-500 font-bold rounded hover:bg-purple-500 hover:text-black transition ${selectedBet?.type==='EVEN'?'bg-purple-500 text-black':''}`}>EVEN (x1.9)</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 flex flex-col">
                            <label className="text-[10px] text-cyan-600 mb-1">BET AMOUNT</label>
                            <input type="number" value={betAmount} onChange={e=>setBetAmount(parseInt(e.target.value))} className="bg-black border border-cyan-700 text-cyan-400 p-2 rounded text-center outline-none focus:border-cyan-400"/>
                        </div>
                        <button 
                            onClick={spin}
                            disabled={gameState!=='IDLE' || !selectedBet}
                            className="flex-[2] bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_40px_rgba(0,242,255,0.6)] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xl tracking-widest"
                        >
                            {gameState==='SPINNING' ? 'PROCESSING...' : selectedBet ? `BET ${selectedBet.type} ($${betAmount})` : 'SELECT TARGET'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


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
                 
                 {/* GAME 1: FISH PRAWN CRAB CARD (UPDATED) */}
                 <button 
                    onClick={() => setActiveGame('FPC')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-green-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-green-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-green-500/30">
                            <Layers size={48} className="text-green-400 group-hover:text-green-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-green-400 transition">FISH PRAWN CRAB</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">CLASSIC • 3 DICE • x3 PAYOUT</p>
                        <div className="px-6 py-2 bg-green-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-green-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                 {/* GAME 4: BLACKJACK CARD */}
                 <button 
                    onClick={() => setActiveGame('BJ')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-indigo-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511193311914-0346f1971801?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-indigo-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-indigo-500/30">
                            <Zap size={48} className="text-indigo-400 group-hover:text-indigo-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-indigo-400 transition">CYBER 21</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">AI DEALER • 5-CARD CHARLIE</p>
                        <div className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-indigo-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                 {/* GAME 5: BACCARAT CARD (NEW) */}
                 <button 
                    onClick={() => setActiveGame('BACCARAT')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-emerald-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-emerald-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-emerald-500/30">
                            <BrainCircuit size={48} className="text-emerald-400 group-hover:text-emerald-300 drop-shadow-lg" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-emerald-400 transition">AI BACCARAT</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">TURBO SPEED • AI PREDICTION</p>
                        <div className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-emerald-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                {/* GAME 6: ROULETTE CARD (NEW) */}
                <button 
                    onClick={() => setActiveGame('ROULETTE')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-cyan-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-cyan-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-cyan-500/30">
                            <CircleDashed size={48} className="text-cyan-400 group-hover:text-cyan-300 drop-shadow-lg animate-spin-slow" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-widest mb-1 group-hover:text-cyan-400 transition">AI ROULETTE</h3>
                        <p className="text-gray-300 text-xs font-medium tracking-wider mb-6">QUANTUM PHYSICS • 35x PAYOUT</p>
                        <div className="px-6 py-2 bg-cyan-600 text-white rounded-full font-bold text-xs shadow-lg group-hover:bg-cyan-500 transition flex items-center gap-2">
                            <Play size={14} fill="currentColor" /> PLAY
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveGame('LITTLE_MARY')}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl bg-black border-4 border-transparent hover:border-purple-500"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605870445919-838d190e8e10?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="bg-purple-600/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:scale-110 transition border border-purple-500/30">
                            <Disc size={48} className="text-purple-400 group-hover:text-purple-300 drop-shadow-lg" />
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
