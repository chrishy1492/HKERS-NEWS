
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../../types';
import { Coins, Play, Trash2, Info, XCircle, Activity, Zap, CreditCard } from 'lucide-react';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

// --- Configuration ---
const CHIPS = [100, 500, 1000, 5000, 'ALL'];
const ODDS = {
  PLAYER: 1,      // 1:1
  BANKER: 0.95,   // 1:0.95 (5% Commission)
  TIE: 8          // 1:8
};

// --- Types ---
type BetType = 'PLAYER' | 'BANKER' | 'TIE';
interface Card {
  suit: string;
  value: string;
  point: number;
}

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// --- Helper Functions ---
const getCardPoint = (val: string) => {
  if (['10', 'J', 'Q', 'K'].includes(val)) return 0;
  if (val === 'A') return 1;
  return parseInt(val);
};

const createShoe = () => {
  const shoe: Card[] = [];
  // 8 Decks standard for Baccarat
  for (let i = 0; i < 8; i++) {
    for (const suit of SUITS) {
      for (const val of VALUES) {
        shoe.push({ suit, value: val, point: getCardPoint(val) });
      }
    }
  }
  return shoe.sort(() => Math.random() - 0.5);
};

const getHandValue = (hand: Card[]) => {
  const sum = hand.reduce((acc, card) => acc + card.point, 0);
  return sum % 10;
};

// Defined outside to avoid recreation and type issues
const CardView: React.FC<{ card: Card }> = ({ card }) => (
    <div className={`w-16 h-24 md:w-20 md:h-28 bg-white rounded-lg shadow-xl flex flex-col items-center justify-between p-2 border-2 border-slate-200 animate-in zoom-in duration-300 ${['♥','♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
       <div className="text-lg font-black self-start leading-none">{card.value}</div>
       <div className="text-3xl">{card.suit}</div>
       <div className="text-lg font-black self-end leading-none rotate-180">{card.value}</div>
    </div>
);

const Baccarat: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [shoe, setShoe] = useState<Card[]>([]);
  const [bets, setBets] = useState<{ [key in BetType]: number }>({ PLAYER: 0, BANKER: 0, TIE: 0 });
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'DEALING' | 'RESULT'>('BETTING');
  const [resultMsg, setResultMsg] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [history, setHistory] = useState<string[]>([]); // Simple roadmap: P, B, T
  const [aiProb, setAiProb] = useState({ p: 45, b: 45, t: 10 }); // Dummy AI visualization

  // Audio
  const winAudio = useRef<HTMLAudioElement | null>(null);
  const chipAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setShoe(createShoe());
    winAudio.current = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c153e2.mp3');
    chipAudio.current = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_736881729b.mp3');
  }, []);

  // AI Probability Animation
  useEffect(() => {
    if (gameState === 'BETTING') {
        const interval = setInterval(() => {
            const r = Math.random();
            setAiProb({
                p: 40 + Math.floor(r * 10),
                b: 40 + Math.floor((1-r) * 10),
                t: 10 + Math.floor(Math.random() * 5)
            });
        }, 2000);
        return () => clearInterval(interval);
    }
  }, [gameState]);

  const placeBet = (type: BetType, amount: any) => {
    if (!profile) return alert('請先登入');
    if (gameState !== 'BETTING') return;

    // Fix: Explicitly handle betAmt as number
    let betAmt: number = typeof amount === 'number' ? amount : 0;
    
    // Fix: Explicitly cast Object.values to number[] to solve 'unknown' + 'unknown'
    const currentBetsValues = Object.values(bets) as number[];

    if (amount === 'ALL') {
       const currentTotal = currentBetsValues.reduce((a, b) => a + b, 0);
       betAmt = profile.points - currentTotal;
       if (betAmt <= 0) return;
    }

    const currentTotal = currentBetsValues.reduce((a, b) => a + b, 0);
    if (profile.points < currentTotal + betAmt) {
      // Allow max bet if close
      return alert('積分不足');
    }

    setBets(prev => ({ ...prev, [type]: prev[type] + betAmt }));
    chipAudio.current?.play().catch(() => {});
  };

  const clearBets = () => {
    if (gameState !== 'BETTING') return;
    setBets({ PLAYER: 0, BANKER: 0, TIE: 0 });
  };

  const deal = async () => {
    const currentBetsValues = Object.values(bets) as number[];
    const totalBet = currentBetsValues.reduce((a, b) => a + b, 0);
    
    if (totalBet === 0) return alert('請先下注');
    if (!profile || profile.points < totalBet) return alert('積分不足');

    // 1. Deduct Points
    const { error } = await supabase.from('profiles').update({
        points: profile.points - totalBet
    }).eq('id', profile.id);

    if (error) return alert('交易失敗');
    onUpdate();

    setGameState('DEALING');
    setResultMsg('');
    setPlayerHand([]);
    setBankerHand([]);

    // 2. Logic (Automated & Accelerated)
    let currentShoe = [...shoe];
    if (currentShoe.length < 10) currentShoe = createShoe();

    const pCards = [currentShoe.pop()!, currentShoe.pop()!];
    const bCards = [currentShoe.pop()!, currentShoe.pop()!];

    // Visual Deal Delay (Fast)
    await new Promise(r => setTimeout(r, 300));
    setPlayerHand([pCards[0]]);
    await new Promise(r => setTimeout(r, 150));
    setBankerHand([bCards[0]]);
    await new Promise(r => setTimeout(r, 150));
    setPlayerHand([pCards[0], pCards[1]]);
    await new Promise(r => setTimeout(r, 150));
    setBankerHand([bCards[0], bCards[1]]);

    let pVal = getHandValue(pCards);
    let bVal = getHandValue(bCards);

    // 3. Third Card Rules
    let finalPCards = [...pCards];
    let finalBCards = [...bCards];

    // Natural Win (8 or 9) - No more cards
    if (pVal < 8 && bVal < 8) {
        // Player draws if 0-5
        let p3: Card | null = null;
        if (pVal <= 5) {
            await new Promise(r => setTimeout(r, 400));
            p3 = currentShoe.pop()!;
            finalPCards.push(p3);
            setPlayerHand([...finalPCards]);
            pVal = getHandValue(finalPCards);
        }

        // Banker draws based on P's 3rd card
        let bankerDraws = false;
        if (!p3) {
            if (bVal <= 5) bankerDraws = true;
        } else {
            const p3Val = p3.point; // Note: In rules, it's point value, not face value for some, but usually simplified to point
            // Standard Baccarat Rules Table
            if (bVal <= 2) bankerDraws = true;
            else if (bVal === 3 && p3Val !== 8) bankerDraws = true;
            else if (bVal === 4 && [2,3,4,5,6,7].includes(p3Val)) bankerDraws = true;
            else if (bVal === 5 && [4,5,6,7].includes(p3Val)) bankerDraws = true;
            else if (bVal === 6 && [6,7].includes(p3Val)) bankerDraws = true;
        }

        if (bankerDraws) {
            await new Promise(r => setTimeout(r, 400));
            finalBCards.push(currentShoe.pop()!);
            setBankerHand([...finalBCards]);
            bVal = getHandValue(finalBCards);
        }
    }

    setShoe(currentShoe);

    // 4. Determine Winner
    let winner: BetType | null = null;
    if (pVal > bVal) winner = 'PLAYER';
    else if (bVal > pVal) winner = 'BANKER';
    else winner = 'TIE';

    setHistory(prev => [...prev, winner === 'PLAYER' ? 'P' : winner === 'BANKER' ? 'B' : 'T'].slice(-12));

    // 5. Calculate Payout
    let totalWin = 0;
    
    if (winner === 'TIE') {
        totalWin += bets.TIE * (1 + ODDS.TIE); // Return bet + win
        // If Tie, usually P/B bets are returned (Push)
        totalWin += bets.PLAYER;
        totalWin += bets.BANKER;
    } else {
        if (winner === 'PLAYER') {
            totalWin += bets.PLAYER * (1 + ODDS.PLAYER);
        } else if (winner === 'BANKER') {
            totalWin += bets.BANKER * (1 + ODDS.BANKER);
        }
        // Tie bet lost
    }

    setGameState('RESULT');
    if (totalWin > 0) {
        setResultMsg(`${winner} WINS! +${Math.floor(totalWin - totalBet)}`);
        winAudio.current?.play().catch(() => {});
        // Update DB
        const { data } = await supabase.from('profiles').select('points').eq('id', profile!.id).single();
        if (data) {
            await supabase.from('profiles').update({ points: (data.points as number) + Math.floor(totalWin) }).eq('id', profile!.id);
        }
    } else {
        setResultMsg(`${winner} WINS! Try Again.`);
    }
    
    onUpdate();

    // Auto reset for fast play
    setTimeout(() => {
        setGameState('BETTING');
        setResultMsg('');
        setPlayerHand([]);
        setBankerHand([]);
        // Optional: Keep bets for repeat? Let's clear to be safe or keep for UX. 
        // Clearing is safer for "AI" control.
        setBets({ PLAYER: 0, BANKER: 0, TIE: 0 });
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center bg-slate-950 min-h-[600px] w-full max-w-5xl mx-auto rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden font-sans selection:bg-emerald-500">
      
      {/* Tech Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 shadow-[0_0_20px_#10b981]" />

      {/* Header */}
      <div className="w-full p-6 flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center space-x-3">
          <Activity className="text-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white">
              AI TURBO <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">BACCARAT</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Neural Network Engine v2.0</p>
          </div>
        </div>
        
        {/* Roadmap (Simple) */}
        <div className="hidden md:flex gap-1 items-center bg-slate-900 px-3 py-1 rounded-full border border-white/5">
            {history.map((r, i) => (
                <div key={i} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white ${r === 'P' ? 'bg-blue-600' : r === 'B' ? 'bg-red-600' : 'bg-green-500'}`}>
                    {r}
                </div>
            ))}
            {history.length === 0 && <span className="text-xs text-slate-600">WAITING FOR DATA...</span>}
        </div>

        <div className="flex items-center gap-4">
            <button onClick={() => setShowRules(true)} className="text-slate-400 hover:text-white"><Info size={20} /></button>
            <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
                <Coins size={14} className="text-yellow-400" />
                <span className="font-mono text-lg text-white font-bold">{profile?.points.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 w-full flex flex-col relative z-10 p-4">
        
        {/* AI Stats Bar */}
        <div className="flex justify-center gap-12 mb-8 opacity-80">
            <div className="text-center">
                <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Player Win Prob</p>
                <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${aiProb.p}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{aiProb.p}%</p>
            </div>
            <div className="text-center">
                <p className="text-[9px] font-bold text-red-400 uppercase mb-1">Banker Win Prob</p>
                <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${aiProb.b}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{aiProb.b}%</p>
            </div>
        </div>

        {/* Cards Area */}
        <div className="flex justify-center items-start gap-8 md:gap-24 mb-4 min-h-[160px]">
            {/* Player Side */}
            <div className="flex flex-col items-center">
                <h3 className="text-blue-400 font-black text-lg mb-4 tracking-widest uppercase">Player 閒</h3>
                <div className="flex -space-x-10">
                    {playerHand.length === 0 ? (
                        <div className="w-16 h-24 md:w-20 md:h-28 rounded-lg border-2 border-dashed border-blue-500/20 flex items-center justify-center text-blue-900 font-bold text-xs">EMPTY</div>
                    ) : (
                        playerHand.map((c, i) => <CardView key={i} card={c} />)
                    )}
                </div>
                {playerHand.length > 0 && (
                    <div className="mt-4 bg-blue-900/20 text-blue-300 px-3 py-1 rounded text-2xl font-black border border-blue-500/30">
                        {getHandValue(playerHand)}
                    </div>
                )}
            </div>

            <div className="h-32 w-px bg-slate-800 self-center mx-4" />

            {/* Banker Side */}
            <div className="flex flex-col items-center">
                <h3 className="text-red-400 font-black text-lg mb-4 tracking-widest uppercase">Banker 莊</h3>
                <div className="flex -space-x-10">
                    {bankerHand.length === 0 ? (
                        <div className="w-16 h-24 md:w-20 md:h-28 rounded-lg border-2 border-dashed border-red-500/20 flex items-center justify-center text-red-900 font-bold text-xs">EMPTY</div>
                    ) : (
                        bankerHand.map((c, i) => <CardView key={i} card={c} />)
                    )}
                </div>
                {bankerHand.length > 0 && (
                    <div className="mt-4 bg-red-900/20 text-red-300 px-3 py-1 rounded text-2xl font-black border border-red-500/30">
                        {getHandValue(bankerHand)}
                    </div>
                )}
            </div>
        </div>

        {/* Result Message */}
        <div className="h-12 flex items-center justify-center mb-4">
            {resultMsg && (
                <div className="bg-emerald-500 text-black px-8 py-2 rounded-full font-black text-lg animate-bounce shadow-[0_0_20px_#10b981]">
                    {resultMsg}
                </div>
            )}
        </div>

        {/* Betting Board */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto w-full mb-6">
            <button 
                onClick={() => placeBet('PLAYER', 100)} // Default increment for click on area
                className={`relative bg-slate-900/80 border-2 rounded-2xl p-6 flex flex-col items-center transition-all active:scale-95 group
                    ${bets.PLAYER > 0 ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-800 hover:border-slate-600'}
                `}
            >
                <span className="text-blue-400 font-black text-xl mb-1">PLAYER (閒)</span>
                <span className="text-slate-500 text-xs font-bold">1 : 1</span>
                {bets.PLAYER > 0 && <div className="mt-2 bg-yellow-500 text-black font-black px-3 py-1 rounded-full shadow-lg">{bets.PLAYER}</div>}
            </button>

            <button 
                className={`relative bg-slate-900/80 border-2 rounded-2xl p-6 flex flex-col items-center transition-all active:scale-95
                    ${bets.TIE > 0 ? 'border-green-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-800 hover:border-slate-600'}
                `}
            >
                <span className="text-green-400 font-black text-xl mb-1">TIE (和)</span>
                <span className="text-slate-500 text-xs font-bold">1 : 8</span>
                {bets.TIE > 0 && <div className="mt-2 bg-yellow-500 text-black font-black px-3 py-1 rounded-full shadow-lg">{bets.TIE}</div>}
            </button>

            <button 
                onClick={() => placeBet('BANKER', 100)}
                className={`relative bg-slate-900/80 border-2 rounded-2xl p-6 flex flex-col items-center transition-all active:scale-95
                    ${bets.BANKER > 0 ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-800 hover:border-slate-600'}
                `}
            >
                <span className="text-red-400 font-black text-xl mb-1">BANKER (莊)</span>
                <span className="text-slate-500 text-xs font-bold">1 : 0.95</span>
                {bets.BANKER > 0 && <div className="mt-2 bg-yellow-500 text-black font-black px-3 py-1 rounded-full shadow-lg">{bets.BANKER}</div>}
            </button>
        </div>

        {/* Actions */}
        <div className="bg-slate-900/90 backdrop-blur rounded-3xl p-4 md:p-6 border border-white/5 max-w-3xl mx-auto w-full">
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                
                {/* Chip Selector / Quick Add */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mr-2">Quick Bet</span>
                    <div className="flex gap-2">
                        {['P', 'B'].map((side) => (
                            CHIPS.slice(0, 3).map(amt => (
                                <button 
                                    key={`${side}-${amt}`}
                                    disabled={gameState !== 'BETTING'}
                                    onClick={() => placeBet(side === 'P' ? 'PLAYER' : 'BANKER', amt)}
                                    className={`px-3 py-2 rounded-lg font-bold text-xs text-white border border-white/10 hover:brightness-110 active:scale-95 transition-all
                                        ${side === 'P' ? 'bg-blue-600' : 'bg-red-600'}
                                    `}
                                >
                                    {side}+{amt}
                                </button>
                            ))
                        ))}
                    </div>
                    {/* Tie Shortcut */}
                    <button 
                        disabled={gameState !== 'BETTING'}
                        onClick={() => placeBet('TIE', 100)}
                        className="px-3 py-2 rounded-lg font-bold text-xs text-white bg-green-600 border border-white/10 hover:brightness-110 active:scale-95"
                    >
                        T+100
                    </button>
                </div>

                {/* Main Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={clearBets}
                        disabled={gameState !== 'BETTING'}
                        className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button 
                        onClick={deal}
                        disabled={gameState !== 'BETTING'}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xl rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {gameState === 'DEALING' ? <Zap className="animate-spin" /> : <Play fill="currentColor" />}
                        {gameState === 'DEALING' ? 'AI CALCULATING...' : 'DEAL NOW'}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <XCircle size={28} />
            </button>
            
            <h2 className="text-2xl font-black text-white mb-6 flex items-center">
              <Info className="mr-2 text-emerald-400" /> 
              GAME PROTOCOL
            </h2>
            
            <div className="space-y-4 text-slate-300 text-sm">
              <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-emerald-500">
                <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Payout Ratio</h3>
                <ul className="space-y-1 font-mono text-xs">
                  <li className="flex justify-between"><span>PLAYER (閒)</span> <span className="text-blue-400">1 : 1</span></li>
                  <li className="flex justify-between"><span>BANKER (莊)</span> <span className="text-red-400">1 : 0.95</span></li>
                  <li className="flex justify-between"><span>TIE (和)</span> <span className="text-green-400">1 : 8</span></li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-teal-500">
                <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">System Logic</h3>
                <ul className="list-disc pl-4 space-y-1 marker:text-teal-500 text-xs leading-relaxed">
                  <li>AI 自動執行第三張牌補牌規則 (Standard 3rd Card Rule)。</li>
                  <li>遊戲速度已優化至 2 倍速 (Turbo Mode)。</li>
                  <li>點數計算：A=1, 10/J/Q/K=0, 其他依牌面。總和取個位數。</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => setShowRules(false)}
              className="w-full mt-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-black text-white hover:opacity-90 transition-opacity shadow-lg"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Baccarat;
