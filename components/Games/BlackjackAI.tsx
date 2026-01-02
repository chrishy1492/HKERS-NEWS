
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, RotateCcw, Info, Zap, Shield, DollarSign, 
  XCircle, Volume2, VolumeX, ArrowLeft, Trophy 
} from 'lucide-react';
import { UserProfile } from '../../types';

// --- 核心配置 ---
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEALER_STAND_ON = 17;
const ANIMATION_SPEED = 280; // 加速體驗

interface BlackjackAIProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

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

// Fix: explicitly include 'key' in props type to resolve React/TS assignment errors in JSX
const CardView = ({ card, hidden, index }: { card: any, hidden?: boolean, index: number, key?: React.Key }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  if (hidden) {
    return (
      <div 
        className="w-16 h-24 sm:w-28 sm:h-40 bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center relative transform transition-all duration-300"
        style={{ animation: `slideIn 0.3s ease-out ${index * 0.1}s backwards`, perspective: '1000px' }}
      >
        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-40 absolute inset-0 rounded-xl"></div>
        <Zap className="text-indigo-400 animate-pulse relative z-10" size={32} />
      </div>
    );
  }

  return (
    <div 
      className={`w-16 h-24 sm:w-28 sm:h-40 bg-white rounded-2xl shadow-2xl flex flex-col justify-between p-4 relative transform transition-all duration-300 hover:-translate-y-4 select-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}
      style={{ animation: `flipIn 0.4s ease-out ${index * 0.1}s backwards` }}
    >
      <div className="text-lg sm:text-2xl font-black tech-font leading-none">{card.value}</div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-6xl opacity-90">
        {card.suit}
      </div>
      <div className="text-lg sm:text-2xl font-black tech-font leading-none transform rotate-180 self-end">{card.value}</div>
    </div>
  );
};

export default function BlackjackAI({ onClose, userProfile, updatePoints, isMuted, setIsMuted }: BlackjackAIProps) {
  const [deck, setDeck] = useState<any[]>([]);
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [dealerHand, setDealerHand] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [message, setMessage] = useState('');
  const [currentBet, setCurrentBet] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'); 
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
    }
    if (!isMuted) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [isMuted]);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const placeBet = (amount: number) => {
    if (gameState !== 'BETTING') return;
    const points = userProfile?.points || 0;
    if (points >= amount) {
      setCurrentBet(prev => prev + amount);
      updatePoints(-amount);
    }
  };

  const clearBet = () => {
    if (gameState !== 'BETTING') return;
    updatePoints(currentBet);
    setCurrentBet(0);
  };

  const dealGame = () => {
    if (currentBet === 0) return;
    const newDeck = deck.length < 10 ? createDeck() : [...deck];
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);
    setGameState('PLAYING');
    setMessage('');
    setLastWin(0);

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

    if (calculateScore(newHand) > 21) {
      handleGameOver(newHand, dealerHand, 'BUST');
    } else if (newHand.length === 5) {
      handleGameOver(newHand, dealerHand, '5-CARD-CHARLIE');
    }
  };

  const doubleDown = () => {
    const points = userProfile?.points || 0;
    if (points >= currentBet) {
      updatePoints(-currentBet);
      const newBet = currentBet * 2;
      setCurrentBet(newBet);
      
      const newDeck = [...deck];
      const card = newDeck.pop();
      const newHand = [...playerHand, card];
      setPlayerHand(newHand);
      setDeck(newDeck);
      
      if (calculateScore(newHand) > 21) {
        handleGameOver(newHand, dealerHand, 'BUST');
      } else {
        runDealerLogic(newHand, dealerHand, newDeck, newBet);
      }
    }
  };

  const stand = () => {
    runDealerLogic(playerHand, dealerHand, deck, currentBet);
  };

  const runDealerLogic = async (pHand: any[], dHand: any[], currentDeck: any[], finalBet: number) => {
    setGameState('DEALER_TURN');
    let tempDeck = [...currentDeck];
    let tempDealerHand = [...dHand];
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    await sleep(ANIMATION_SPEED); 
    
    let dScore = calculateScore(tempDealerHand);
    while (dScore < DEALER_STAND_ON) {
      const card = tempDeck.pop();
      tempDealerHand = [...tempDealerHand, card];
      setDealerHand([...tempDealerHand]);
      setDeck([...tempDeck]);
      dScore = calculateScore(tempDealerHand);
      await sleep(ANIMATION_SPEED); 
    }

    handleGameOver(pHand, tempDealerHand, 'COMPARE', finalBet);
  };

  const handleGameOver = (pHand: any[], dHand: any[], reason: string, finalBet?: number) => {
    const bet = finalBet || currentBet;
    setGameState('GAME_OVER');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    let winAmount = 0;
    let resultMsg = '';

    if (reason === 'BUST') {
      resultMsg = 'BUST! 系統獲勝';
    } else if (reason === 'BLACKJACK') {
      if (dScore === 21) {
         winAmount = bet;
         resultMsg = '平手 (PUSH)';
      } else {
         winAmount = bet + (bet * 1.5); 
         resultMsg = 'BLACKJACK! 3:2';
      }
    } else if (reason === '5-CARD-CHARLIE') {
      winAmount = bet + (bet * 3); 
      resultMsg = '五龍護體 3:1';
    } else {
      if (dScore > 21) {
        winAmount = bet * 2;
        resultMsg = '莊家爆牌！你贏了';
      } else if (pScore > dScore) {
        winAmount = bet * 2;
        resultMsg = '點數勝出！';
      } else if (pScore < dScore) {
        resultMsg = '點數不足，莊家勝';
      } else {
        winAmount = bet;
        resultMsg = '平手 (PUSH)';
      }
    }

    if (winAmount > 0) {
      updatePoints(winAmount);
      setLastWin(winAmount);
    }
    setMessage(resultMsg);
  };

  const resetGame = () => {
    setCurrentBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setMessage('');
    setGameState('BETTING');
    setLastWin(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white noto-font overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950" />
      
      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10 mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Zap className="text-indigo-400 animate-pulse" />
            <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase tech-font">CyberBlitz 21</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl">
            {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-indigo-400" />}
          </button>
          <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex flex-col items-end backdrop-blur-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest tech-font">Credits</span>
             <span className="text-xl font-black text-indigo-400 tech-font">{userProfile?.points?.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowRules(true)} className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl">
            <Info size={24} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-12 relative z-10">
        
        {/* Dealer */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] bg-slate-900/50 px-6 py-1.5 rounded-full border border-white/5 tech-font">
            <Shield size={14} className="text-indigo-500" /> AI DEALER 莊
            {gameState !== 'BETTING' && (
               <span className="ml-2 text-indigo-400 font-black">
                 [ {gameState === 'PLAYING' ? '??' : calculateScore(dealerHand)} ]
               </span>
            )}
          </div>
          <div className="flex -space-x-12 sm:-space-x-20 min-h-[140px] sm:min-h-[180px] items-center">
            {dealerHand.length > 0 ? (
              dealerHand.map((card, i) => (
                <CardView key={card.id} card={card} index={i} hidden={gameState === 'PLAYING' && i === 1} />
              ))
            ) : (
              <div className="w-24 h-36 sm:w-28 sm:h-40 border-4 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-800 tech-font font-black">WAIT</div>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="h-20 flex items-center justify-center">
          {message ? (
            <div className="px-10 py-4 bg-indigo-600 rounded-[32px] font-black text-3xl uppercase italic tracking-tighter shadow-[0_0_60px_rgba(79,70,229,0.6)] animate-bounce tech-font">
              {message}
            </div>
          ) : lastWin > 0 && (
            <div className="flex items-center gap-4 text-amber-400 text-3xl font-black animate-pulse tech-font">
               <Trophy size={32} /> +{lastWin.toLocaleString()}
            </div>
          )}
        </div>

        {/* Player */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex -space-x-12 sm:-space-x-20 min-h-[140px] sm:min-h-[180px] items-center">
             {playerHand.length > 0 ? (
                playerHand.map((card, i) => (
                  <CardView key={card.id} card={card} index={i} />
                ))
             ) : (
               <div className="w-24 h-36 sm:w-28 sm:h-40 border-4 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-800 tech-font font-black">PLAY</div>
             )}
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] tech-font">PLAYER 閒</span>
             {gameState !== 'BETTING' && (
               <div className="bg-indigo-600 px-4 py-1.5 rounded-full font-black text-lg tech-font shadow-lg">
                 {calculateScore(playerHand)}
               </div>
             )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-md bg-slate-900/80 p-8 rounded-[40px] border border-white/10 backdrop-blur-3xl shadow-2xl">
          {gameState === 'BETTING' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] tech-font">BET AMOUNT</span>
                 <div className="flex items-center gap-2">
                   <DollarSign size={14} className="text-amber-500" />
                   <span className="text-4xl font-black text-amber-500 tech-font">{currentBet.toLocaleString()}</span>
                 </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[100, 1000, 5000, 10000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => placeBet(amt)}
                    className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all font-black text-xs tech-font"
                  >
                    +{amt >= 1000 ? `${amt/1000}K` : amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={clearBet}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs uppercase transition-all tech-font"
                >
                  RESET
                </button>
                <button 
                  onClick={dealGame}
                  disabled={currentBet === 0}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-indigo-600/20 tech-font transition-all active:scale-95"
                >
                  START DEAL
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {gameState === 'PLAYING' && (
                <>
                  <button 
                    onClick={hit}
                    className="py-6 bg-green-600 hover:bg-green-500 text-white rounded-[24px] font-black text-2xl uppercase shadow-lg active:scale-95 transition-all tech-font"
                  >
                    HIT
                  </button>
                  <button 
                    onClick={stand}
                    className="py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-[24px] font-black text-2xl uppercase shadow-lg active:scale-95 transition-all tech-font"
                  >
                    STAND
                  </button>
                  {playerHand.length === 2 && (userProfile?.points || 0) >= currentBet && (
                    <button 
                      onClick={doubleDown}
                      className="col-span-2 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-[24px] font-black text-lg uppercase shadow-xl transition-all tech-font"
                    >
                      DOUBLE DOWN x2
                    </button>
                  )}
                </>
              )}
              {gameState === 'GAME_OVER' && (
                <button 
                  onClick={resetGame}
                  className="col-span-2 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[32px] font-black text-2xl uppercase shadow-2xl animate-pulse tech-font"
                >
                  REPLAY AGAIN
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rules */}
      {showRules && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-indigo-500/50 w-full max-w-xl rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowRules(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><XCircle size={32} /></button>
            <h2 className="text-3xl font-black italic tracking-tighter mb-8 flex items-center gap-4 tech-font">
              <Shield className="text-indigo-400" /> SYSTEM PROTOCOL v3.0
            </h2>
            <div className="space-y-8 text-slate-300">
               <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                  <h3 className="font-black text-indigo-400 uppercase tracking-widest text-xs mb-4 tech-font">PAYOUT SCHEME</h3>
                  <div className="space-y-2 font-bold font-mono">
                    <div className="flex justify-between"><span>WIN 一般勝出</span> <span className="text-white">1 : 1</span></div>
                    <div className="flex justify-between"><span>BLACKJACK (21)</span> <span className="text-amber-400">3 : 2</span></div>
                    <div className="flex justify-between"><span>5-CARD CHARLIE</span> <span className="text-green-400">3 : 1</span></div>
                  </div>
               </div>
               <div className="space-y-4 text-sm font-medium leading-relaxed opacity-80">
                  <p>• 莊家在 <span className="text-white font-bold">17點</span> 或以上必須停牌。</p>
                  <p>• A 可靈活計算為 1 點或 11 點。系統將自動優化。</p>
                  <p>• <span className="text-indigo-400 font-bold">加速模式：</span>發牌間隔縮短至 280ms，適合極速對戰。</p>
                  <p>• 任何兩張手牌皆可執行加倍 (Double Down)。</p>
               </div>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-10 py-5 bg-indigo-600 rounded-[24px] font-black text-lg uppercase tracking-widest text-white shadow-xl tech-font">
              I AGREE
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-100px) rotate(10deg); }
          to { opacity: 1; transform: translateY(0) rotate(0deg); }
        }
        @keyframes flipIn {
          from { opacity: 0; transform: rotateY(90deg); }
          to { opacity: 1; transform: rotateY(0deg); }
        }
        .tech-font { font-family: 'Orbitron', sans-serif; }
      `}</style>
    </div>
  );
}