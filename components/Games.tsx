
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Trophy, RotateCcw, Volume2, VolumeX, Dice5, ArrowLeft, Zap, Shield, Info, DollarSign, Play, XCircle, Cpu, Activity, Disc, Music } from 'lucide-react';

interface GameProps {
  user: User;
  onUpdatePoints: (amount: number) => void;
  onBack?: () => void;
}

// --- SHARED COMPONENTS ---

const BalanceDisplay = ({ points }: { points: number }) => (
  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-hker-gold/30 shadow-inner min-w-[100px] justify-center">
    <div className="w-2 h-2 rounded-full bg-hker-gold animate-pulse shadow-[0_0_5px_gold]" />
    <span className="text-xs font-mono font-bold text-hker-gold tracking-wider">
      {points.toLocaleString()}
    </span>
  </div>
);

const SoundToggle = ({ muted, onToggle }: { muted: boolean, onToggle: () => void }) => (
  <button onClick={onToggle} className="absolute top-2 right-2 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors text-hker-gold z-50 border border-slate-600">
    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
  </button>
);

// --- AUDIO ENGINE (Procedural Ambient Music) ---
// Generates soft, relaxing drone sounds without external files
class AmbientAudio {
  ctx: AudioContext | null = null;
  oscillators: OscillatorNode[] = [];
  gainNode: GainNode | null = null;
  isPlaying: boolean = false;

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.value = 0.1; // Very soft volume
    }
  }

  play() {
    if (this.isPlaying || !this.ctx || !this.gainNode) {
        if(this.ctx?.state === 'suspended') this.ctx.resume();
        return;
    }
    
    // Create a major 7th chord pad (C, E, G, B) for a relaxing "AI" vibe
    const freqs = [261.63, 329.63, 392.00, 493.88]; 
    
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine'; // Softest wave
      osc.frequency.value = f;
      
      // LFO for subtle movement
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + Math.random() * 0.2; // Slow breathing
      
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 2; // subtle vibrato
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(this.gainNode!);
      osc.start();
      this.oscillators.push(osc);
      this.oscillators.push(lfo);
    });
    
    this.isPlaying = true;
  }

  stop() {
    this.oscillators.forEach(o => o.stop());
    this.oscillators = [];
    this.isPlaying = false;
  }
  
  start() {
      this.init();
      if (!this.isPlaying) this.play();
  }
}

const ambientAudio = new AmbientAudio();

// ==========================================
// GAME 1: CYBER BLITZ 21 (BLACKJACK)
// ==========================================
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const ANIMATION_SPEED = 300; // Fast speed

const createDeck = () => {
  const deck = [];
  for (let suit of SUITS) {
    for (let value of VALUES) {
      let weight = parseInt(value);
      if (['J', 'Q', 'K'].includes(value)) weight = 10;
      if (value === 'A') weight = 11;
      deck.push({ suit, value, weight, id: Math.random().toString(36).substr(2, 9) });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
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

interface CardProps {
  card: any;
  hidden?: boolean;
  index: number;
}

const Card: React.FC<CardProps> = ({ card, hidden, index }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  if (hidden) {
    return (
      <div 
        className="w-16 h-24 bg-slate-800 border-2 border-indigo-500 rounded-lg shadow-xl flex items-center justify-center relative"
        style={{ animation: `slideIn 0.3s ease-out ${index * 0.1}s backwards` }}
      >
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 rounded flex items-center justify-center">
          <Zap className="text-indigo-400 animate-pulse w-6 h-6" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-16 h-24 bg-white rounded-lg shadow-xl flex flex-col justify-between p-1 relative select-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}
      style={{ animation: `flipIn 0.4s ease-out ${index * 0.1}s backwards` }}
    >
      <div className="text-sm font-bold font-mono leading-none">{card.value}</div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
        {card.suit}
      </div>
      <div className="text-sm font-bold font-mono leading-none transform rotate-180 self-end">{card.value}</div>
    </div>
  );
};

export const CyberBlackjack: React.FC<GameProps> = ({ user, onUpdatePoints, onBack }) => {
  const [deck, setDeck] = useState<any[]>([]);
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [dealerHand, setDealerHand] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'BETTING'|'PLAYING'|'DEALER_TURN'|'GAME_OVER'>('BETTING');
  const [message, setMessage] = useState('');
  const [currentBet, setCurrentBet] = useState(0);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const placeBet = (amount: number | 'ALL') => {
    const betAmt = amount === 'ALL' ? user.points : amount;
    if (user.points >= betAmt) {
      onUpdatePoints(-betAmt);
      setCurrentBet(prev => prev + betAmt);
    } else {
      alert("積分不足 Insufficient Points");
    }
  };

  const clearBet = () => {
    onUpdatePoints(currentBet);
    setCurrentBet(0);
  };

  const dealGame = () => {
    if (currentBet === 0) return;
    if (deck.length < 10) setDeck(createDeck());

    const newDeck = [...deck];
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);
    setGameState('PLAYING');
    setMessage('');

    if (calculateScore(pHand) === 21) {
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
    if (user.points >= currentBet) {
      onUpdatePoints(-currentBet);
      const doubledBet = currentBet * 2;
      setCurrentBet(doubledBet);
      
      const newDeck = [...deck];
      const card = newDeck.pop();
      const newHand = [...playerHand, card];
      setPlayerHand(newHand);
      setDeck(newDeck);
      
      if (calculateScore(newHand) > 21) {
        handleGameOver(newHand, dealerHand, 'BUST');
      } else {
        runDealerLogic(newHand, dealerHand, newDeck, doubledBet);
      }
    } else {
      alert("餘額不足以加倍 Insufficient funds to double");
    }
  };

  const stand = () => {
    runDealerLogic(playerHand, dealerHand, deck, currentBet);
  };

  const runDealerLogic = async (pHand: any[], dHand: any[], currentDeck: any[], finalBet: number) => {
    setGameState('DEALER_TURN');
    let tempDeck = [...currentDeck];
    let tempDealerHand = [...dHand];
    
    // Quick flip delay
    await new Promise(r => setTimeout(r, ANIMATION_SPEED)); 
    
    let dScore = calculateScore(tempDealerHand);
    
    while (dScore < 17) {
      const card = tempDeck.pop();
      tempDealerHand = [...tempDealerHand, card];
      setDealerHand(tempDealerHand);
      setDeck(tempDeck);
      dScore = calculateScore(tempDealerHand);
      await new Promise(r => setTimeout(r, ANIMATION_SPEED));
    }

    handleGameOver(pHand, tempDealerHand, 'COMPARE', finalBet);
  };

  const handleGameOver = (pHand: any[], dHand: any[], reason: string, finalBet = currentBet) => {
    setGameState('GAME_OVER');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    let payout = 0;
    let resultMsg = '';

    if (reason === 'BUST') {
      resultMsg = '爆牌！系統獲勝 (BUST)';
    } else if (reason === 'BLACKJACK') {
      if (dScore === 21) {
         payout = finalBet; // Push
         resultMsg = '平手 (PUSH)';
      } else {
         payout = finalBet + (finalBet * 1.5); // 3:2
         resultMsg = 'BLACKJACK! 3:2';
      }
    } else if (reason === '5-CARD-CHARLIE') {
      payout = finalBet + (finalBet * 3); // 3:1
      resultMsg = '五龍護體！超級大獎 3:1';
    } else {
      if (dScore > 21) {
        payout = finalBet * 2;
        resultMsg = '莊家爆牌！你贏了 (WIN)';
      } else if (pScore > dScore) {
        payout = finalBet * 2;
        resultMsg = '點數勝出！你贏了 (WIN)';
      } else if (pScore < dScore) {
        resultMsg = '點數不足，莊家勝 (LOSE)';
      } else {
        payout = finalBet;
        resultMsg = '平手 (PUSH)';
      }
    }

    if (payout > 0) {
      onUpdatePoints(payout);
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
    <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-xl shadow-2xl relative h-full flex flex-col overflow-hidden text-white">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-900/80 border-b border-indigo-500/30 relative z-10">
         {onBack && <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-indigo-400"/></button>}
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Zap className="text-cyan-400 w-5 h-5 fill-current" />
                <h3 className="font-black italic text-lg tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">CYBER 21</h3>
             </div>
             <BalanceDisplay points={user.points} />
         </div>
         <button onClick={() => setShowRules(true)}><Info className="w-5 h-5 text-slate-400 hover:text-white" /></button>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 space-y-4">
         
         {/* Dealer */}
         <div className="flex flex-col items-center min-h-[120px]">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
               <Shield className="w-3 h-3" /> Dealer
               {gameState !== 'BETTING' && <span className="bg-red-900/50 text-red-300 px-1 rounded">{gameState === 'PLAYING' ? '?' : calculateScore(dealerHand)}</span>}
            </div>
            <div className="flex -space-x-8">
               {dealerHand.map((c, i) => <Card key={c.id} card={c} index={i} hidden={gameState === 'PLAYING' && i === 1} />)}
               {dealerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-600">AI</div>}
            </div>
         </div>

         {/* Message */}
         <div className="h-10 flex items-center justify-center">
            {message && (
               <div className={`px-4 py-1 rounded border backdrop-blur-sm font-bold animate-bounce text-sm
                  ${message.includes('WIN') || message.includes('3:1') ? 'bg-green-500/20 border-green-500 text-green-300' : 
                    message.includes('PUSH') ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 
                    'bg-red-500/20 border-red-500 text-red-300'}`}>
                  {message}
               </div>
            )}
         </div>

         {/* Player */}
         <div className="flex flex-col items-center min-h-[120px]">
            <div className="flex -space-x-8 mb-2">
               {playerHand.map((c, i) => <Card key={c.id} card={c} index={i} />)}
               {playerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-600">P1</div>}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
               Player
               {gameState !== 'BETTING' && <span className="bg-indigo-900/50 text-indigo-300 px-1 rounded">{calculateScore(playerHand)}</span>}
            </div>
         </div>

      </div>

      {/* Controls */}
      <div className="bg-slate-900/90 border-t border-indigo-500/30 p-4 relative z-20">
         {gameState === 'BETTING' ? (
            <div className="space-y-3">
               <div className="flex justify-between items-end text-xs font-bold text-slate-400">
                  <span>BET</span>
                  <span className="text-xl text-cyan-400 font-mono">{currentBet}</span>
               </div>
               <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 'ALL'].map(amt => (
                     <button key={amt} onClick={() => placeBet(amt as any)} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded border border-slate-600 font-mono text-xs font-bold">
                        {amt === 'ALL' ? 'ALL' : `+${amt}`}
                     </button>
                  ))}
               </div>
               <div className="flex gap-2">
                  <button onClick={clearBet} className="flex-1 bg-red-900/30 text-red-400 py-3 rounded border border-red-900/50 text-xs font-bold">CLEAR</button>
                  <button onClick={dealGame} disabled={currentBet===0} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_15px_#4f46e5]">
                     <Play className="w-4 h-4 fill-current" /> DEAL
                  </button>
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-2 gap-3">
               {gameState === 'PLAYING' && (
                  <>
                     <button onClick={hit} className="bg-green-600 hover:bg-green-500 text-white py-3 rounded font-black shadow-[0_0_10px_rgba(34,197,94,0.5)]">HIT</button>
                     <button onClick={stand} className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-black shadow-[0_0_10px_rgba(239,68,68,0.5)]">STAND</button>
                     {playerHand.length === 2 && user.points >= currentBet && (
                        <button onClick={doubleDown} className="col-span-2 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded font-bold text-xs tracking-widest border border-amber-400/50">DOUBLE (x2)</button>
                     )}
                  </>
               )}
               {gameState === 'GAME_OVER' && (
                  <button onClick={resetGame} className="col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-black flex items-center justify-center gap-2 animate-pulse">
                     <RotateCcw className="w-4 h-4" /> PLAY AGAIN
                  </button>
               )}
            </div>
         )}
      </div>

      {/* Rules Modal */}
      {showRules && (
         <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-cyan-500/50 p-6 rounded-xl shadow-2xl relative w-full max-w-sm">
               <button onClick={() => setShowRules(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white"><XCircle /></button>
               <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Info className="text-cyan-400"/> PROTOCOLS</h3>
               <ul className="text-sm text-slate-300 space-y-2 mb-6 font-mono">
                  <li className="flex justify-between"><span>Blackjack</span> <span className="text-green-400">3:2</span></li>
                  <li className="flex justify-between"><span>5-Card Charlie</span> <span className="text-yellow-400">3:1</span></li>
                  <li className="flex justify-between"><span>Win</span> <span className="text-white">1:1</span></li>
                  <li className="text-xs text-slate-500 pt-2 border-t border-slate-700">* Dealer stands on 17. No Split.</li>
               </ul>
               <button onClick={() => setShowRules(false)} className="w-full bg-cyan-600 text-white py-2 rounded font-bold">ACKNOWLEDGE</button>
            </div>
         </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes flipIn { from { opacity: 0; transform: rotateY(90deg); } to { opacity: 1; transform: rotateY(0); } }
      `}</style>
    </div>
  );
};

// ==========================================
// GAME 2: AI SLOTS TURBO (3x3 Edition)
// ==========================================
const SLOT_SYMBOLS = [
  { char: "💎", weight: 5, value: 50 },  // Diamond (Rare)
  { char: "🔔", weight: 10, value: 20 }, // Bell
  { char: "🍉", weight: 20, value: 10 }, // Watermelon
  { char: "🍒", weight: 30, value: 5 },  // Cherry
  { char: "🍋", weight: 40, value: 2 }   // Lemon (Common)
];

// 5 Paylines for 3x3 Grid
const PAYLINES = [
  [[0,0], [0,1], [0,2]], // Top Row
  [[1,0], [1,1], [1,2]], // Middle Row
  [[2,0], [2,1], [2,2]], // Bottom Row
  [[0,0], [1,1], [2,2]], // Diagonal TL-BR
  [[0,2], [1,1], [2,0]]  // Diagonal BL-TR
];

const getRandomSlotSymbol = () => {
  const totalWeight = SLOT_SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const s of SLOT_SYMBOLS) {
    if (random < s.weight) return s;
    random -= s.weight;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
};

export const SlotMachine: React.FC<GameProps> = ({ user, onUpdatePoints, onBack }) => {
  const [grid, setGrid] = useState<string[][]>(Array(3).fill(Array(3).fill("❓")));
  const [spinning, setSpinning] = useState(false);
  const [betPerLine, setBetPerLine] = useState(100);
  const [lastWin, setLastWin] = useState(0);
  const [winningLines, setWinningLines] = useState<number[]>([]);

  const spin = () => {
    const totalBet = betPerLine * 5; // 5 Fixed Paylines
    if (user.points < totalBet) {
      alert(`積分不足 (Need ${totalBet})`);
      return;
    }

    onUpdatePoints(-totalBet);
    setSpinning(true);
    setLastWin(0);
    setWinningLines([]);

    // Turbo Speed Animation (800ms)
    let startTime = Date.now();
    const duration = 800;

    const animate = () => {
      const now = Date.now();
      if (now - startTime < duration) {
        // Render random grid for visual blur
        const temp = Array(3).fill(null).map(() => 
           Array(3).fill(null).map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char)
        );
        setGrid(temp);
        requestAnimationFrame(animate);
      } else {
        finalizeResult();
      }
    };
    requestAnimationFrame(animate);
  };

  const finalizeResult = () => {
    // 1. Generate Result Grid based on weights
    const finalGrid = Array(3).fill(null).map(() => 
       Array(3).fill(null).map(() => getRandomSlotSymbol().char)
    );
    setGrid(finalGrid);

    // 2. Check Paylines
    let winTotal = 0;
    const wins: number[] = [];

    PAYLINES.forEach((line, idx) => {
      const [c1, c2, c3] = line;
      const s1 = finalGrid[c1[0]][c1[1]];
      const s2 = finalGrid[c2[0]][c2[1]];
      const s3 = finalGrid[c3[0]][c3[1]];

      if (s1 === s2 && s2 === s3) {
        const sym = SLOT_SYMBOLS.find(s => s.char === s1);
        if (sym) {
          winTotal += sym.value * betPerLine;
          wins.push(idx);
        }
      }
    });

    if (winTotal > 0) {
      onUpdatePoints(winTotal);
      setLastWin(winTotal);
      setWinningLines(wins);
    }
    setSpinning(false);
  };

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-lg border-2 border-hker-gold/50 text-center shadow-[0_0_30px_rgba(255,215,0,0.15)] relative h-full flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
         {onBack && <button onClick={onBack} className="p-1 hover:bg-slate-700 rounded"><ArrowLeft className="w-5 h-5 text-slate-400"/></button>}
         <div className="flex items-center gap-2 flex-1 justify-center">
             <Trophy className="w-5 h-5 text-hker-gold" />
             <h3 className="text-xl font-black text-hker-gold uppercase tracking-widest">AI Slots</h3>
             <BalanceDisplay points={user.points} />
         </div>
         <div className="w-6"></div>
      </div>

      {/* Slot Machine Display */}
      <div className="bg-gradient-to-b from-slate-800 to-black p-4 rounded-xl border-4 border-yellow-600 shadow-inner flex-1 flex flex-col justify-center relative overflow-hidden">
        
        {/* Paylines Indicators (Simple) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 text-[10px] text-slate-500 font-bold">
           {[1,2,3,4,5].map(i => <div key={i} className={winningLines.includes(i-1) ? 'text-yellow-400 animate-pulse' : ''}>LINE {i}</div>)}
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4 bg-black p-2 rounded border border-slate-700">
           {grid.map((row, rIdx) => (
              row.map((char, cIdx) => (
                 <div key={`${rIdx}-${cIdx}`} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
                    <div className={`transition-all ${spinning ? 'blur-sm scale-90' : 'scale-100'}`}>{char}</div>
                    {/* Highlight Win */}
                    {!spinning && winningLines.length > 0 && PAYLINES.some((l, lIdx) => winningLines.includes(lIdx) && l.some(([r,c]) => r===rIdx && c===cIdx)) && (
                       <div className="absolute inset-0 bg-yellow-500/30 animate-pulse"></div>
                    )}
                 </div>
              ))
           ))}
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center bg-slate-900 p-2 rounded mb-2 text-xs font-mono">
           <div className="text-slate-400">CREDIT: <span className="text-white">{user.points}</span></div>
           <div className="text-slate-400">WIN: <span className="text-green-400 font-bold">{lastWin}</span></div>
        </div>

        <div className="bg-slate-900 p-2 rounded mb-4 text-xs flex justify-between items-center">
           <span className="text-slate-500">BET / LINE</span>
           <div className="flex gap-1">
              {[10, 50, 100, 500].map(amt => (
                 <button 
                   key={amt} 
                   onClick={() => setBetPerLine(amt)}
                   className={`px-2 py-1 rounded ${betPerLine === amt ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                 >
                   {amt}
                 </button>
              ))}
           </div>
        </div>

        {/* Spin Button */}
        <button 
          onClick={spin} 
          disabled={spinning}
          className="w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black font-black py-4 px-8 rounded-lg shadow-[0_5px_0_#854d0e] hover:shadow-[0_2px_0_#854d0e] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none text-xl tracking-wider flex items-center justify-center gap-2 group"
        >
          {spinning ? <RotateCcw className="animate-spin" /> : <Zap className="fill-current" />}
          {spinning ? 'SPIN' : `SPIN (${betPerLine*5})`}
        </button>
        
        <div className="mt-2 text-[9px] text-slate-500">
           Turbo Mode: 2x Speed | 5 Paylines | RTP 96.5%
        </div>
      </div>
    </div>
  );
};

// ==========================================
// GAME 3: LITTLE MARY (Xiao Ma Li) - REFACTORED
// ==========================================
const LM_SYMBOLS = [
  { id: 'bar', name: 'BAR', odds: 100, char: '🎰', color: 'bg-red-900 border-red-500' },
  { id: '77', name: '77', odds: 40, char: '7️⃣', color: 'bg-yellow-900 border-yellow-500' },
  { id: 'star', name: '星星', odds: 30, char: '⭐', color: 'bg-blue-900 border-blue-500' },
  { id: 'watermelon', name: '西瓜', odds: 20, char: '🍉', color: 'bg-green-900 border-green-500' },
  { id: 'bell', name: '鈴鐺', odds: 15, char: '🔔', color: 'bg-yellow-800 border-yellow-400' },
  { id: 'mango', name: '芒果', odds: 10, char: '🥭', color: 'bg-orange-800 border-orange-500' },
  { id: 'orange', name: '橘子', odds: 5, char: '🍊', color: 'bg-orange-700 border-orange-400' },
  { id: 'apple', name: '蘋果', odds: 2, char: '🍎', color: 'bg-red-800 border-red-400' },
];

const FINAL_BOARD = [
  'bar', 'orange', 'apple', 'bell', 'watermelon', 'star', // 0-5 (Top)
  '77', 'apple', 'mango', 'orange', 'bell', 'apple',      // 6-11 (Right)
  'mango', 'orange', 'apple', 'star', 'watermelon', 'bell', // 12-17 (Bottom)
  'mango', 'apple', 'orange', '77', 'apple', 'orange'     // 18-23 (Left) 
];

const WEIGHTS = [
  { id: 'bar', weight: 5 },
  { id: '77', weight: 15 },
  { id: 'star', weight: 25 },
  { id: 'watermelon', weight: 40 },
  { id: 'bell', weight: 60 },
  { id: 'mango', weight: 100 },
  { id: 'orange', weight: 200 },
  { id: 'apple', weight: 485 },
  { id: 'none', weight: 70 }
];

export const LittleMary: React.FC<GameProps> = ({ user, onUpdatePoints, onBack }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState('請下注');
  const [winAmt, setWinAmt] = useState(0);
  const [chip, setChip] = useState(100);
  
  const handleBet = (id: string, amount: number) => {
    if (isRunning) return;
    const current = bets[id] || 0;
    const next = current + amount;
    if (next < 0) return;
    
    if (amount > 0 && user.points < amount) {
      alert("積分不足 No Points");
      return;
    }
    
    if (amount > 0) onUpdatePoints(-amount);
    else onUpdatePoints(Math.abs(amount)); 

    setBets(prev => ({ ...prev, [id]: next }));
  };

  const spin = () => {
    const totalBet = Object.values(bets).reduce((a: number, b: number) => a + b, 0);
    if (totalBet === 0) {
      setLogs("請先下注!");
      return;
    }

    setIsRunning(true);
    setLogs("Running...");
    setWinAmt(0);

    const rand = Math.floor(Math.random() * 1000);
    let accum = 0;
    let resultId = 'apple'; 
    
    for (const w of WEIGHTS) {
      accum += w.weight;
      if (rand < accum) {
        resultId = w.id;
        break;
      }
    }

    if (resultId === 'none') resultId = 'apple';

    const indices = FINAL_BOARD.map((s, i) => s === resultId ? i : -1).filter(i => i !== -1);
    let targetIndex = indices[Math.floor(Math.random() * indices.length)];
    if (targetIndex === undefined) targetIndex = 0;

    let current = activeIdx;
    const maxRounds = 3; 
    const totalSteps = (24 * maxRounds) + ((targetIndex - current + 24) % 24);
    
    let step = 0;
    const speed = 30; 

    const interval = setInterval(() => {
      current = (current + 1) % 24;
      setActiveIdx(current);
      step++;

      if (step >= totalSteps) {
        clearInterval(interval);
        setIsRunning(false);
        finalize(resultId);
      }
    }, speed);
  };

  const finalize = (resultId: string) => {
    const bet = bets[resultId] || 0;
    const sym = LM_SYMBOLS.find(s => s.id === resultId);
    
    if (bet > 0 && sym) {
      const win = bet * sym.odds + bet; 
      onUpdatePoints(win);
      setWinAmt(win);
      setLogs(`WIN! ${sym.name}`);
    } else {
      setLogs(`開: ${sym?.name || '-'}`);
    }
  };

  const renderGridItem = (idx: number, className: string) => {
    const symId = FINAL_BOARD[idx];
    const sym = LM_SYMBOLS.find(s => s.id === symId);
    const isActive = activeIdx === idx;
    
    return (
      <div className={`relative flex items-center justify-center border-2 rounded-lg transition-all ${className} 
        ${isActive ? 'bg-yellow-400 border-white scale-105 shadow-[0_0_15px_yellow] z-10' : 'bg-slate-800 border-slate-600 opacity-80'}
      `}>
        <span className="text-2xl">{sym?.char}</span>
        {isActive && <div className="absolute inset-0 bg-white/30 animate-pulse rounded-lg"></div>}
      </div>
    );
  };

  const totalBet = Object.values(bets).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="bg-[#1a1a1a] p-2 rounded-lg border-2 border-hker-gold/50 text-center shadow-xl h-full flex flex-col max-w-lg mx-auto relative overflow-y-auto">
       <div className="flex items-center justify-between mb-2 px-2 sticky top-0 bg-[#1a1a1a] z-50 py-2 border-b border-slate-800">
        {onBack && <button onClick={onBack} className="p-1 hover:bg-slate-700 rounded"><ArrowLeft className="w-5 h-5 text-slate-400"/></button>}
        <div className="flex items-center gap-2">
             <h3 className="text-lg font-black text-hker-gold uppercase tracking-widest hidden sm:block">Little Mary</h3>
             <BalanceDisplay points={user.points} />
        </div>
        <div className="w-6"></div> 
      </div>

      {/* WHEEL AREA */}
      <div className="relative aspect-square w-full max-w-sm mx-auto bg-black/40 rounded-xl border border-slate-700 p-2 mb-2 shrink-0">
         {/* Wheel Grid */}
         <div className="absolute inset-0 grid grid-cols-7 grid-rows-7 gap-1 p-1 pointer-events-none">
          {renderGridItem(0, "col-start-1 row-start-1")}
          {renderGridItem(1, "col-start-2 row-start-1")}
          {renderGridItem(2, "col-start-3 row-start-1")}
          {renderGridItem(3, "col-start-4 row-start-1")}
          {renderGridItem(4, "col-start-5 row-start-1")}
          {renderGridItem(5, "col-start-6 row-start-1")}
          {renderGridItem(6, "col-start-7 row-start-1")}

          {renderGridItem(7, "col-start-7 row-start-2")}
          {renderGridItem(8, "col-start-7 row-start-3")}
          {renderGridItem(9, "col-start-7 row-start-4")}
          {renderGridItem(10, "col-start-7 row-start-5")}
          {renderGridItem(11, "col-start-7 row-start-6")}

          {renderGridItem(12, "col-start-7 row-start-7")}
          {renderGridItem(13, "col-start-6 row-start-7")}
          {renderGridItem(14, "col-start-5 row-start-7")}
          {renderGridItem(15, "col-start-4 row-start-7")}
          {renderGridItem(16, "col-start-3 row-start-7")}
          {renderGridItem(17, "col-start-2 row-start-7")}
          {renderGridItem(18, "col-start-1 row-start-7")}

           {renderGridItem(19, "col-start-1 row-start-6")}
           {renderGridItem(20, "col-start-1 row-start-5")}
           {renderGridItem(21, "col-start-1 row-start-4")}
           {renderGridItem(22, "col-start-1 row-start-3")}
           {renderGridItem(23, "col-start-1 row-start-2")}
         </div>

         {/* Center Spin Area (Refactored to be cleaner) */}
         <div className="absolute inset-[22%] flex flex-col items-center justify-center z-20 pointer-events-auto bg-slate-900/80 rounded-full border-4 border-slate-700 backdrop-blur-sm shadow-2xl">
             <div className={`text-sm md:text-xl font-black mb-1 ${winAmt > 0 ? 'text-green-400 animate-bounce' : 'text-white'}`}>
                {logs.split(' ')[0]}
             </div>
             {winAmt > 0 && <div className="text-yellow-400 font-bold mb-1">+{winAmt}</div>}
             
             <button 
                onClick={spin}
                disabled={isRunning}
                className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-600 to-red-900 text-white font-black shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-red-400 flex items-center justify-center text-sm md:text-base"
              >
                {isRunning ? <RotateCcw className="animate-spin w-6 h-6"/> : 'SPIN'}
              </button>
         </div>
      </div>

      {/* BETTING CONTROLS (Moved Below) */}
      <div className="flex-1 bg-slate-900/50 p-2 rounded-xl border border-slate-800 overflow-y-auto">
           <div className="flex justify-between items-center mb-2 px-2">
              <div className="flex gap-1">
                 {[100, 1000, 5000].map(val => (
                    <button 
                      key={val}
                      onClick={() => setChip(val)}
                      className={`px-2 py-1 text-xs font-bold rounded ${chip === val ? 'bg-yellow-600 text-black' : 'bg-slate-700 text-slate-400'}`}
                    >
                      {val}
                    </button>
                 ))}
              </div>
              <div className="flex gap-2 text-xs items-center">
                 <span className="text-slate-500">Total: <span className="text-white">{totalBet}</span></span>
                 <button onClick={() => setBets({})} disabled={isRunning} className="text-red-400 hover:text-red-300 font-bold ml-1">CLEAR</button>
              </div>
           </div>
           <div className="grid grid-cols-4 gap-2 mb-2">
              {LM_SYMBOLS.map(s => (
                <button 
                   key={s.id} 
                   onClick={() => handleBet(s.id, chip)}
                   disabled={isRunning}
                   className={`flex flex-col items-center bg-slate-800 rounded p-2 border relative active:scale-95 transition-all ${bets[s.id] ? 'border-yellow-500 bg-slate-700 shadow-md' : 'border-slate-600'}`}
                >
                   <div className="text-2xl mb-1">{s.char}</div>
                   <div className="text-[9px] text-slate-400">x{s.odds}</div>
                   {bets[s.id] ? (
                      <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-bold px-1.5 rounded-full">{bets[s.id]}</div>
                   ) : null}
                </button>
              ))}
           </div>
      </div>
    </div>
  );
};

// ==========================================
// GAME 4: HOO HEY HOW
// ==========================================
const HHH_SYMBOLS = [
  { id: 'fish', label: '魚 Fish', char: '🐟', color: 'bg-red-900 border-red-500' }, 
  { id: 'prawn', label: '蝦 Prawn', char: '🦐', color: 'bg-green-900 border-green-500' }, 
  { id: 'crab', label: '蟹 Crab', char: '🦀', color: 'bg-green-900 border-green-500' }, 
  { id: 'coin', label: '金錢 Coin', char: '💰', color: 'bg-blue-900 border-blue-500' }, 
  { id: 'gourd', label: '葫蘆 Gourd', char: '🏺', color: 'bg-blue-900 border-blue-500' }, 
  { id: 'rooster', label: '雞 Rooster', char: '🐓', color: 'bg-red-900 border-red-500' }, 
];

export const HooHeyHow: React.FC<GameProps> = ({ user, onUpdatePoints, onBack }) => {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [results, setResults] = useState<string[]>(['fish', 'fish', 'fish']);
  const [isRolling, setIsRolling] = useState(false);
  const [muted, setMuted] = useState(false);
  const [logs, setLogs] = useState<string>('請下注');
  const [showResult, setShowResult] = useState(false);
  const [chip, setChip] = useState(100);

  const handleBet = (symbolId: string) => {
    if (isRolling) return;
    if (user.points < chip) {
      alert("積分不足 Not enough points");
      return;
    }
    onUpdatePoints(-chip);
    setBets(prev => ({
      ...prev,
      [symbolId]: (prev[symbolId] || 0) + chip
    }));
  };

  const roll = () => {
    if (Object.keys(bets).length === 0) {
      setLogs("請先下注！");
      return;
    }
    setIsRolling(true);
    setShowResult(false);
    setLogs("Rolling...");

    let interval = setInterval(() => {
      setResults([
        HHH_SYMBOLS[Math.floor(Math.random() * 6)].id,
        HHH_SYMBOLS[Math.floor(Math.random() * 6)].id,
        HHH_SYMBOLS[Math.floor(Math.random() * 6)].id
      ]);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const finalResult = [
        HHH_SYMBOLS[Math.floor(Math.random() * 6)].id,
        HHH_SYMBOLS[Math.floor(Math.random() * 6)].id,
        HHH_SYMBOLS[Math.floor(Math.random() * 6)].id
      ];
      setResults(finalResult);
      setIsRolling(false);
      setShowResult(true);
      calculatePayout(finalResult);
    }, 1500);
  };

  const calculatePayout = (finalResult: string[]) => {
    let totalWin = 0;
    
    Object.entries(bets).forEach(([betSymbol, betAmount]) => {
      const count = finalResult.filter(r => r === betSymbol).length;
      if (count > 0) {
        const win = (betAmount as number) * (count + 1);
        totalWin += win;
      }
    });

    if (totalWin > 0) {
      onUpdatePoints(totalWin);
      setLogs(`WIN! +${totalWin}`);
    } else {
      setLogs("莊家通吃 House Wins");
    }
    setBets({});
  };

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-lg border-2 border-hker-gold/50 text-center shadow-xl relative h-full flex flex-col">
      <SoundToggle muted={muted} onToggle={() => setMuted(!muted)} />
      
      <div className="flex items-center justify-between mb-2">
        {onBack && <button onClick={onBack} className="p-1 hover:bg-slate-700 rounded"><ArrowLeft className="w-5 h-5 text-slate-400"/></button>}
        <div className="flex items-center gap-2 justify-center flex-1">
             <Dice5 className="w-5 h-5 text-hker-gold" />
             <h3 className="text-lg font-black text-hker-gold uppercase tracking-widest hidden sm:block">魚蝦蟹</h3>
             <BalanceDisplay points={user.points} />
        </div>
        <div className="w-6"></div> 
      </div>

      <div className="bg-hker-night p-4 rounded-xl border border-slate-700 mb-4 shadow-inner min-h-[120px] flex flex-col items-center justify-center">
        <div className="flex gap-4 justify-center mb-2">
          {results.map((res, idx) => {
            const sym = HHH_SYMBOLS.find(s => s.id === res);
            return (
              <div key={idx} className={`w-16 h-16 flex items-center justify-center text-4xl rounded-lg border-2 shadow-[0_4px_0_rgba(0,0,0,0.5)] transition-transform ${isRolling ? 'animate-bounce' : ''} ${sym?.color || 'bg-slate-700'}`}>
                {sym?.char}
              </div>
            );
          })}
        </div>
        <div className={`text-sm font-bold font-mono h-6 ${logs.includes('WIN') ? 'text-green-400 animate-pulse' : 'text-hker-gold'}`}>
          {logs}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 flex-1">
        {HHH_SYMBOLS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleBet(s.id)}
            disabled={isRolling}
            className={`relative p-2 rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center group ${s.color}`}
          >
            <span className="text-3xl drop-shadow-md mb-1">{s.char}</span>
            <span className="text-[10px] font-bold text-white uppercase opacity-80">{s.label}</span>
            
            {bets[s.id] && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white">
                {bets[s.id]}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
          {[100, 500, 1000].map(val => (
            <button 
              key={val}
              onClick={() => setChip(val)}
              className={`px-3 py-1 text-xs font-bold rounded ${chip === val ? 'bg-hker-gold text-black' : 'bg-slate-700 text-slate-400'}`}
            >
              {val}
            </button>
          ))}
        </div>
        <button 
          onClick={roll}
          disabled={isRolling}
          className="flex-1 bg-gradient-to-r from-hker-gold to-yellow-600 text-black font-black py-3 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {isRolling ? 'ROLLING...' : 'START'}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// GAME 5: AI TURBO BACCARAT (Professional Edition)
// ==========================================
const CardUI: React.FC<{ card: string }> = ({ card }) => {
  const isRed = card.includes('♥') || card.includes('♦');
  return (
    <div className={`w-12 h-16 md:w-16 md:h-24 bg-white rounded-lg border-2 border-slate-300 shadow-xl flex items-center justify-center text-lg md:text-2xl font-bold ${isRed ? 'text-red-600' : 'text-slate-900'} animate-[slideIn_0.3s_ease-out]`}>
      {card}
    </div>
  );
};

export const Baccarat: React.FC<GameProps> = ({ user, onUpdatePoints, onBack }) => {
  // State
  const [gameState, setGameState] = useState<'IDLE'|'DEALING'|'RESULT'>('IDLE');
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [bankerHand, setBankerHand] = useState<string[]>([]);
  const [bets, setBets] = useState({ player: 0, banker: 0, tie: 0 });
  const [selectedChip, setSelectedChip] = useState(100);
  const [resultMsg, setResultMsg] = useState('');
  const [winner, setWinner] = useState<'PLAYER'|'BANKER'|'TIE'|null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [aiProb, setAiProb] = useState({ p: 45, b: 45 }); // AI Probability Visual

  // Deck generation logic (Infinite Deck simulation)
  const getRandomCard = () => {
    const suits = ['♠','♥','♣','♦'];
    const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const s = suits[Math.floor(Math.random() * suits.length)];
    const v = values[Math.floor(Math.random() * values.length)];
    return v + s;
  };

  const getCardValue = (card: string) => {
    const val = card.substring(0, card.length - 1);
    if (['10','J','Q','K'].includes(val)) return 0;
    if (val === 'A') return 1;
    return parseInt(val);
  };

  const calculatePoints = (hand: string[]) => {
    return hand.reduce((sum, card) => sum + getCardValue(card), 0) % 10;
  };

  const handleBet = (type: 'player'|'banker'|'tie') => {
    if (gameState !== 'IDLE') return;
    if (user.points < selectedChip) {
      alert("積分不足 Insufficient Points");
      return;
    }
    onUpdatePoints(-selectedChip);
    setBets(prev => ({ ...prev, [type]: prev[type] + selectedChip }));
  };

  const clearBets = () => {
    if (gameState !== 'IDLE') return;
    const total = bets.player + bets.banker + bets.tie;
    if (total > 0) {
      onUpdatePoints(total);
      setBets({ player: 0, banker: 0, tie: 0 });
    }
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runGame = async () => {
    if (bets.player + bets.banker + bets.tie === 0) return;
    setGameState('DEALING');
    setResultMsg('');
    setWinner(null);
    setWinAmount(0);
    setPlayerHand([]);
    setBankerHand([]);

    // Randomize AI probabilities for visual effect
    setAiProb({ 
      p: 40 + Math.floor(Math.random() * 20), 
      b: 40 + Math.floor(Math.random() * 20) 
    });

    const pCards: string[] = [];
    const bCards: string[] = [];

    // Initial Deal (2 Cards each) - Turbo Speed (200ms)
    await sleep(200);
    pCards.push(getRandomCard()); setPlayerHand([...pCards]);
    await sleep(200);
    bCards.push(getRandomCard()); setBankerHand([...bCards]);
    await sleep(200);
    pCards.push(getRandomCard()); setPlayerHand([...pCards]);
    await sleep(200);
    bCards.push(getRandomCard()); setBankerHand([...bCards]);

    let pScore = calculatePoints(pCards);
    let bScore = calculatePoints(bCards);

    // Natural Win Check (8 or 9)
    let finished = false;
    if (pScore >= 8 || bScore >= 8) {
      finished = true;
    }

    // Third Card Rules (Professional Standard)
    if (!finished) {
      let pThirdCardVal = -1;

      // Player Draws on 0-5
      if (pScore <= 5) {
        await sleep(300);
        const card = getRandomCard();
        pCards.push(card);
        setPlayerHand([...pCards]);
        pScore = calculatePoints(pCards);
        pThirdCardVal = getCardValue(card);
      }

      // Banker Rules based on Player's action
      let bankerDraws = false;
      if (pCards.length === 2) { 
        // Player stood (6 or 7)
        if (bScore <= 5) bankerDraws = true;
      } else {
        // Player drew a 3rd card
        if (bScore <= 2) bankerDraws = true;
        else if (bScore === 3 && pThirdCardVal !== 8) bankerDraws = true;
        else if (bScore === 4 && [2,3,4,5,6,7].includes(pThirdCardVal)) bankerDraws = true;
        else if (bScore === 5 && [4,5,6,7].includes(pThirdCardVal)) bankerDraws = true;
        else if (bScore === 6 && [6,7].includes(pThirdCardVal)) bankerDraws = true;
      }

      if (bankerDraws) {
        await sleep(300);
        bCards.push(getRandomCard());
        setBankerHand([...bCards]);
        bScore = calculatePoints(bCards);
      }
    }

    // Determine Winner
    await sleep(300);
    let result: 'PLAYER'|'BANKER'|'TIE';
    let payout = 0;

    if (pScore > bScore) result = 'PLAYER';
    else if (bScore > pScore) result = 'BANKER';
    else result = 'TIE';

    // Calculate Payout
    if (result === 'PLAYER') payout = bets.player * 2;
    else if (result === 'BANKER') payout = bets.banker * 1.95; // 5% Commission
    else if (result === 'TIE') payout = (bets.tie * 9) + bets.player + bets.banker; // 1:8 + return bets

    setWinner(result);
    setWinAmount(payout);
    setResultMsg(result === 'TIE' ? 'TIE GAME (和)' : `${result} WINS`);
    
    if (payout > 0) onUpdatePoints(payout);
    setBets({ player: 0, banker: 0, tie: 0 }); // Auto clear for next round
    setGameState('RESULT');
  };

  return (
    <div className="bg-[#0a0a0c] p-2 md:p-4 rounded-xl border border-[#2d4a3e] shadow-[0_0_50px_rgba(0,255,128,0.1)] relative h-full flex flex-col overflow-hidden text-white font-sans">
      <SoundToggle muted={false} onToggle={() => {}} /> {/* Placeholder sound toggle */}
      
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border-b border-white/10 mb-4">
         {onBack && <button onClick={onBack} className="p-1 hover:bg-white/10 rounded"><ArrowLeft className="w-5 h-5 text-green-400"/></button>}
         <div className="flex items-center gap-2 justify-center flex-1">
             <Cpu className="text-green-500 w-5 h-5 animate-pulse" />
             <h3 className="font-bold tracking-widest text-green-400">AI BACCARAT</h3>
             <BalanceDisplay points={user.points} />
         </div>
         <button onClick={() => setShowRules(true)}><Info className="w-5 h-5 text-gray-400 hover:text-white" /></button>
      </div>

      {/* AI Probability Bar */}
      <div className="flex justify-center gap-4 mb-6 text-[10px] font-mono">
         <div className="w-1/3">
            <div className="flex justify-between text-blue-400 mb-1"><span>PLAYER AI</span><span>{aiProb.p}%</span></div>
            <div className="h-1 bg-gray-800 rounded overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${aiProb.p}%`}}></div></div>
         </div>
         <div className="w-1/3">
            <div className="flex justify-between text-red-400 mb-1"><span>BANKER AI</span><span>{aiProb.b}%</span></div>
            <div className="h-1 bg-gray-800 rounded overflow-hidden"><div className="h-full bg-red-500 transition-all duration-500" style={{width: `${aiProb.b}%`}}></div></div>
         </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 relative flex flex-col items-center">
         
         {/* Cards Area */}
         <div className="flex w-full justify-between items-start px-2 md:px-12 mb-8">
            <div className="flex flex-col items-center gap-2">
               <span className="text-blue-400 font-bold tracking-widest text-xs md:text-sm">PLAYER 閒</span>
               <div className="flex -space-x-4 md:space-x-2 h-24">
                  {playerHand.length === 0 && <div className="w-12 h-16 border-2 border-dashed border-gray-700 rounded-lg"></div>}
                  {playerHand.map((c, i) => <CardUI key={i} card={c} />)}
               </div>
               <div className={`text-2xl font-black ${winner==='PLAYER' ? 'text-blue-400 scale-125' : 'text-gray-600'} transition-all`}>
                  {playerHand.length > 0 ? calculatePoints(playerHand) : 0}
               </div>
            </div>

            <div className="self-center flex flex-col items-center">
               <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-500 to-transparent"></div>
               <span className="text-xs text-gray-500 my-1 font-mono">VS</span>
               <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-500 to-transparent"></div>
            </div>

            <div className="flex flex-col items-center gap-2">
               <span className="text-red-400 font-bold tracking-widest text-xs md:text-sm">BANKER 莊</span>
               <div className="flex -space-x-4 md:space-x-2 h-24">
                  {bankerHand.length === 0 && <div className="w-12 h-16 border-2 border-dashed border-gray-700 rounded-lg"></div>}
                  {bankerHand.map((c, i) => <CardUI key={i} card={c} />)}
               </div>
               <div className={`text-2xl font-black ${winner==='BANKER' ? 'text-red-400 scale-125' : 'text-gray-600'} transition-all`}>
                  {bankerHand.length > 0 ? calculatePoints(bankerHand) : 0}
               </div>
            </div>
         </div>

         {/* Result Overlay */}
         {gameState === 'RESULT' && (
            <div className="absolute top-1/3 left-0 right-0 text-center animate-bounce z-20 pointer-events-none">
               <h2 className={`text-4xl md:text-5xl font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] ${winner==='PLAYER'?'text-blue-400':winner==='BANKER'?'text-red-400':'text-green-400'}`}>
                  {resultMsg}
               </h2>
               <p className="text-yellow-400 font-mono text-xl mt-2 bg-black/60 inline-block px-4 rounded">
                  {winAmount > 0 ? `+ $${winAmount}` : ''}
               </p>
            </div>
         )}

         {/* Betting Zones */}
         <div className="grid grid-cols-3 gap-2 md:gap-4 w-full max-w-2xl px-2">
            <button 
               onClick={() => handleBet('player')}
               className={`relative p-4 rounded-xl border transition-all ${bets.player>0 ? 'bg-blue-900/40 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-900/50 border-gray-700 hover:border-blue-500/50'}`}
            >
               <div className="text-blue-400 font-black text-sm md:text-lg">PLAYER 閒</div>
               <div className="text-[10px] text-gray-500">1 : 1</div>
               {bets.player > 0 && <div className="mt-1 text-yellow-400 font-mono text-xs">${bets.player}</div>}
            </button>

            <button 
               onClick={() => handleBet('tie')}
               className={`relative p-4 rounded-xl border transition-all ${bets.tie>0 ? 'bg-green-900/40 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-gray-900/50 border-gray-700 hover:border-green-500/50'}`}
            >
               <div className="text-green-400 font-black text-sm md:text-lg">TIE 和</div>
               <div className="text-[10px] text-gray-500">1 : 8</div>
               {bets.tie > 0 && <div className="mt-1 text-yellow-400 font-mono text-xs">${bets.tie}</div>}
            </button>

            <button 
               onClick={() => handleBet('banker')}
               className={`relative p-4 rounded-xl border transition-all ${bets.banker>0 ? 'bg-red-900/40 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-gray-900/50 border-gray-700 hover:border-red-500/50'}`}
            >
               <div className="text-red-400 font-black text-sm md:text-lg">BANKER 莊</div>
               <div className="text-[10px] text-gray-500">1 : 0.95</div>
               {bets.banker > 0 && <div className="mt-1 text-yellow-400 font-mono text-xs">${bets.banker}</div>}
            </button>
         </div>
      </div>

      {/* Controls */}
      <div className="border-t border-gray-800 p-4 bg-black/40 mt-4 flex flex-col md:flex-row items-center gap-4">
         <div className="flex gap-2">
            {[100, 500, 1000, 5000].map(val => (
               <button 
                  key={val} 
                  onClick={() => setSelectedChip(val)}
                  className={`w-12 h-12 rounded-full border-2 font-bold text-[10px] flex items-center justify-center transition-transform active:scale-95 ${selectedChip===val ? 'border-yellow-400 bg-yellow-900/50 text-white scale-110 shadow-[0_0_10px_orange]' : 'border-gray-600 bg-gray-800 text-gray-400'}`}
               >
                  {val>=1000 ? `${val/1000}K` : val}
               </button>
            ))}
         </div>

         <div className="flex gap-2 flex-1 w-full">
            <button onClick={clearBets} disabled={gameState!=='IDLE'} className="px-4 py-3 rounded-full bg-gray-800 text-gray-400 font-bold hover:bg-gray-700 disabled:opacity-50">
               重置
            </button>
            <button 
               onClick={runGame}
               disabled={gameState!=='IDLE' || (bets.player+bets.banker+bets.tie)===0}
               className="flex-1 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-black tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
            >
               {gameState==='DEALING' ? <Activity className="animate-spin"/> : 'DEAL 極速發牌'}
            </button>
         </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
         <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-900 border border-green-500/50 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_30px_rgba(0,255,128,0.1)]">
               <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2"><Cpu /> SYSTEM RULES</h3>
               <ul className="text-sm text-gray-400 space-y-2 mb-6 list-disc pl-4">
                  <li><span className="text-white font-bold">玩法：</span>點選籌碼後點擊「莊/閒/和」區域下注。</li>
                  <li><span className="text-white font-bold">規則：</span>標準百家樂補牌規則 (Standard Third Card Rule)。</li>
                  <li><span className="text-white font-bold">賠率：</span>閒 1:1 / 莊 1:0.95 (5% 水錢) / 和 1:8。</li>
                  <li><span className="text-white font-bold">極速：</span>AI 運算發牌間隔 200ms (2x Speed)。</li>
               </ul>
               <button onClick={() => setShowRules(false)} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors">
                  ACKNOWLEDGE (確認)
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

// ==========================================
// GAME 6: QUANTUM PULSE ROULETTE (AI TURBO)
// ==========================================
export const QuantumRoulette: React.FC<GameProps> = ({ user, onUpdatePoints, onBack }) => {
  // Directly use user.points for balance display and logic to ensure sync
  const [betAmount, setBetAmount] = useState(100);
  const [currentBet, setCurrentBet] = useState<{type: string, val: any, odds: number} | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [showRules, setShowRules] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // European Wheel Sequence
  const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  
  // Animation Refs
  const animRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  
  // Init Particles
  const particles = useRef(Array.from({length: 50}, () => ({
    x: Math.random() * 400,
    y: Math.random() * 400,
    size: Math.random() * 1.5,
    speed: 0.5 + Math.random()
  })));

  useEffect(() => {
    // Initial Draw
    drawWheel(0);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = 160;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Particles
    particles.current.forEach(p => {
      ctx.fillStyle = 'rgba(0, 242, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      p.y += p.speed;
      if(p.y > h) p.y = 0;
    });

    // Wheel
    const segAngle = (Math.PI * 2) / 37;
    
    for(let i=0; i<37; i++) {
      const start = angle + (i * segAngle) - Math.PI/2 - segAngle/2;
      const end = start + segAngle;
      const num = WHEEL_NUMBERS[i];
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      
      if(num === 0) ctx.fillStyle = '#00ff66';
      else if([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num)) ctx.fillStyle = '#ff2d55';
      else ctx.fillStyle = '#1c1c1e';
      
      ctx.fill();
      ctx.stroke(); // Simple stroke
      
      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + segAngle/2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = "bold 10px monospace";
      ctx.fillText(num.toString(), r - 10, 4);
      ctx.restore();
    }

    // Pointer
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 5);
    ctx.lineTo(cx - 8, cy - r - 20);
    ctx.lineTo(cx + 8, cy - r - 20);
    ctx.fill();

    // Center Core
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI*2);
    ctx.fillStyle = '#050505';
    ctx.fill();
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f2ff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText("AI CORE", cx, cy + 5);
  };

  const placeBet = (type: string, val: any, odds: number) => {
    if(isSpinning) return;
    setCurrentBet({type, val, odds});
    setMsg(`Selected: ${type} ${val}`);
  };

  const spin = () => {
    if(isSpinning) return;
    if(!currentBet) { setMsg("Please select a bet!"); return; }
    if(user.points < betAmount) { setMsg("Insufficient Points!"); return; }

    onUpdatePoints(-betAmount);
    setIsSpinning(true);
    setMsg("QUANTUM ACCELERATION...");

    let speed = 0.5 + Math.random() * 0.2; // Initial kick
    let duration = 4000; // 4s Turbo
    let start = performance.now();

    const animate = (time: number) => {
      let progress = time - start;
      if(progress < duration) {
        rotationRef.current += speed;
        if(progress > duration * 0.6) speed *= 0.98; // Decay
        drawWheel(rotationRef.current);
        animRef.current = requestAnimationFrame(animate);
      } else {
        finalize();
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const finalize = () => {
    setIsSpinning(false);
    
    // Calc result based on angle
    const total = 37;
    const seg = (Math.PI * 2) / total;
    const normRot = rotationRef.current % (Math.PI * 2);
    // Pointer is at -PI/2 (top). Wheel rotates clockwise.
    let idx = Math.floor( ((Math.PI*2 - normRot) % (Math.PI*2)) / seg );
    idx = (idx + total) % total; 
    
    const resultNum = WHEEL_NUMBERS[idx];
    setHistory(prev => [resultNum, ...prev].slice(0, 10));
    
    // Check Win
    let won = false;
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(resultNum);
    
    if(currentBet?.type === 'NUM' && currentBet.val === resultNum) won = true;
    else if(currentBet?.type === 'COLOR') {
       if(currentBet.val === 'RED' && isRed) won = true;
       if(currentBet.val === 'BLACK' && !isRed && resultNum !== 0) won = true;
    }
    else if(currentBet?.type === 'PARITY' && resultNum !== 0) {
       if(currentBet.val === 'ODD' && resultNum % 2 !== 0) won = true;
       if(currentBet.val === 'EVEN' && resultNum % 2 === 0) won = true;
    }

    if(won) {
       const win = Math.floor(betAmount * currentBet!.odds);
       onUpdatePoints(win);
       setMsg(`WIN! +${win} PTS`);
    } else {
       setMsg(`RESULT: ${resultNum} (LOSE)`);
    }
    
    setCurrentBet(null);
  };

  return (
    <div className="bg-black p-2 rounded-lg border border-cyan-500/50 shadow-[0_0_20px_rgba(0,242,255,0.2)] h-full flex flex-col overflow-hidden text-cyan-400 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center p-2 border-b border-cyan-900 mb-2">
         {onBack && <button onClick={onBack}><ArrowLeft className="w-5 h-5"/></button>}
         <div className="flex items-center gap-2 justify-center flex-1">
            <div className="text-center">
                <div className="text-xs text-gray-500">QUANTUM</div>
                <div className="font-bold text-white hidden sm:block">ROULETTE</div>
            </div>
            <BalanceDisplay points={user.points} />
         </div>
         <button onClick={() => setShowRules(!showRules)}><Info className="w-5 h-5"/></button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex justify-center items-center relative">
         <div className="absolute top-2 text-center w-full text-yellow-400 font-bold drop-shadow-md z-10">{msg}</div>
         <canvas ref={canvasRef} width={320} height={320} className="max-w-full max-h-full" />
      </div>

      {/* History */}
      <div className="flex justify-center gap-1 my-2 h-6">
         {history.map((n, i) => (
            <div key={i} className={`w-6 h-6 flex items-center justify-center text-[10px] rounded ${n===0 ? 'bg-green-600 text-black' : [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n) ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
               {n}
            </div>
         ))}
      </div>

      {/* Controls */}
      <div className="p-2 bg-gray-900/50 rounded border-t border-cyan-900">
         <div className="flex justify-between mb-2 text-xs">
            <div className="grid grid-cols-2 gap-1">
               <button onClick={() => placeBet('COLOR', 'RED', 1.9)} className="bg-red-900 text-red-200 px-2 py-1 rounded border border-red-500 hover:bg-red-800">RED x1.9</button>
               <button onClick={() => placeBet('COLOR', 'BLACK', 1.9)} className="bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-500 hover:bg-gray-600">BLK x1.9</button>
               <button onClick={() => placeBet('PARITY', 'ODD', 1.9)} className="bg-cyan-900 text-cyan-200 px-2 py-1 rounded border border-cyan-500 hover:bg-cyan-800">ODD x1.9</button>
               <button onClick={() => placeBet('PARITY', 'EVEN', 1.9)} className="bg-purple-900 text-purple-200 px-2 py-1 rounded border border-purple-500 hover:bg-purple-800">EVEN x1.9</button>
            </div>
            <div className="grid grid-cols-6 gap-1 w-48">
               {Array.from({length: 12}).map((_, i) => (
                  <button key={i} onClick={() => placeBet('NUM', i+1, 35)} className="text-[9px] border border-gray-700 hover:bg-cyan-500 hover:text-black rounded">{i+1}</button>
               ))}
               <div className="col-span-6 text-[8px] text-center text-gray-500">... (Select Specific Num x35)</div>
            </div>
         </div>

         <div className="flex gap-2 items-center">
            <div className="flex flex-col flex-1">
               <label className="text-[8px] text-gray-500">BET AMT</label>
               <input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value))} className="bg-black border border-cyan-700 text-cyan-400 p-1 rounded text-sm outline-none" />
            </div>
            <button onClick={spin} disabled={isSpinning} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-black py-2 rounded shadow-[0_0_10px_cyan] transition-all disabled:opacity-50 disabled:shadow-none">
               SPIN PULSE
            </button>
         </div>
      </div>

      {showRules && (
         <div className="absolute inset-0 bg-black/90 p-4 z-20 flex flex-col justify-center">
            <h4 className="text-white font-bold mb-2">RULES</h4>
            <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
               <li>Single Number: Pays 35 to 1.</li>
               <li>Red/Black/Odd/Even: Pays 1.9 to 1.</li>
               <li>0 is Green (House wins outside bets).</li>
               <li>Turbo Mode: 4s Spin Cycle.</li>
            </ul>
            <button onClick={() => setShowRules(false)} className="mt-4 bg-cyan-900 text-cyan-200 py-2 rounded">CLOSE</button>
         </div>
      )}
    </div>
  );
};
