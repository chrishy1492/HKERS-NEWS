
import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Info, Zap, Shield, DollarSign, XCircle, Hand } from 'lucide-react';
import { Profile } from '../../types';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

// --- Constants & Config ---
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEALER_STAND_ON = 17;
const ANIMATION_SPEED = 300; // Accelerated Speed

// Types
interface CardType {
  suit: string;
  value: string;
  weight: number;
  id: string;
}

// Helper: Create Deck
const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  for (let suit of SUITS) {
    for (let value of VALUES) {
      let weight = parseInt(value);
      if (['J', 'Q', 'K'].includes(value)) weight = 10;
      if (value === 'A') weight = 11;
      deck.push({ suit, value, weight, id: Math.random().toString(36).substr(2, 9) });
    }
  }
  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Helper: Calculate Score
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

// --- Component: Card ---
const Card: React.FC<{ card: CardType, hidden?: boolean, index: number }> = ({ card, hidden, index }) => {
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

const Blackjack: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [message, setMessage] = useState('');
  const [currentBet, setCurrentBet] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  // --- Actions ---

  const addToBet = (amount: number) => {
    if (!profile) return;
    // Check local limit first for UX, actual check on deal
    if (profile.points < currentBet + amount) return alert('積分不足');
    setCurrentBet(prev => prev + amount);
  };

  const clearBet = () => {
    setCurrentBet(0);
  };

  const dealGame = async () => {
    if (!profile) return alert('請先登入');
    if (currentBet === 0) {
      setMessage("請先下注！(SYSTEM ERROR: NO BET)");
      return;
    }
    if (profile.points < currentBet) return alert('積分不足');

    setProcessing(true);

    // 1. Deduct Points via Supabase
    const { error } = await supabase.from('profiles').update({
        points: profile.points - currentBet
    }).eq('id', profile.id);

    if (error) {
        setProcessing(false);
        return alert('交易失敗，請重試');
    }
    onUpdate(); // Update header balance

    // 2. Deal Logic
    let newDeck = [...deck];
    if (newDeck.length < 10) newDeck = createDeck(); // Reshuffle if low

    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);
    setGameState('PLAYING');
    setMessage('');
    setLastWin(0);
    setProcessing(false);

    // Check Instant Blackjack
    const pScore = calculateScore(pHand);
    if (pScore === 21) {
      // Need to pass the latest state, so we pass it directly
      handleGameOver(pHand, dHand, 'BLACKJACK', currentBet); 
    }
  };

  const hit = () => {
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    
    setPlayerHand(newHand);
    setDeck(newDeck);

    const score = calculateScore(newHand);
    if (score > 21) {
      handleGameOver(newHand, dealerHand, 'BUST', currentBet);
    } else if (newHand.length === 5) {
      handleGameOver(newHand, dealerHand, '5-CARD-CHARLIE', currentBet); // 5-Card Charlie Rule
    }
  };

  const doubleDown = async () => {
    if (!profile) return;
    if (profile.points < currentBet) {
      setMessage("餘額不足以加倍！(INSUFFICIENT FUNDS)");
      return;
    }

    setProcessing(true);
    // Deduct extra bet
    const { error } = await supabase.from('profiles').update({
        points: profile.points - currentBet
    }).eq('id', profile.id);

    if (error) {
        setProcessing(false);
        return alert('交易失敗');
    }
    onUpdate();

    const doubledBet = currentBet * 2;
    setCurrentBet(doubledBet); // Visual update only, logic uses local var

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);
    
    const score = calculateScore(newHand);
    if (score > 21) {
      handleGameOver(newHand, dealerHand, 'BUST', doubledBet);
    } else {
      // Force Dealer Turn after Double
      runDealerLogic(newHand, dealerHand, newDeck, doubledBet);
    }
    setProcessing(false);
  };

  const stand = () => {
    runDealerLogic(playerHand, dealerHand, deck, currentBet);
  };

  const runDealerLogic = async (pHand: CardType[], dHand: CardType[], currentDeck: CardType[], finalBetAmount: number) => {
    setGameState('DEALER_TURN');
    let tempDeck = [...currentDeck];
    let tempDealerHand = [...dHand];
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    // Reveal delay
    await sleep(ANIMATION_SPEED); 
    
    let dScore = calculateScore(tempDealerHand);
    
    // AI Logic: Dealer MUST stand on 17+
    while (dScore < DEALER_STAND_ON) {
      const card = tempDeck.pop()!;
      tempDealerHand = [...tempDealerHand, card];
      setDealerHand(tempDealerHand); // Visual update
      setDeck(tempDeck);
      dScore = calculateScore(tempDealerHand);
      await sleep(ANIMATION_SPEED); 
    }

    handleGameOver(pHand, tempDealerHand, 'COMPARE', finalBetAmount);
  };

  const handleGameOver = async (pHand: CardType[], dHand: CardType[], reason: string, betAmount: number) => {
    setGameState('GAME_OVER');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    let winAmount = 0;
    let resultMsg = '';

    if (reason === 'BUST') {
      resultMsg = '💥 爆牌！系統獲勝 (SYSTEM WIN)';
    } else if (reason === 'BLACKJACK') {
      // Check if dealer also has BJ
      if (dScore === 21 && dHand.length === 2) {
         winAmount = betAmount; // Push returns bet
         resultMsg = '🤝 平手 (PUSH)';
      } else {
         winAmount = betAmount + (betAmount * 1.5); // 3:2 Payout
         resultMsg = '✨ BLACKJACK! 賠率 3:2';
      }
    } else if (reason === '5-CARD-CHARLIE') {
      winAmount = betAmount + (betAmount * 3); // 3:1 Payout
      resultMsg = '🐉 五龍護體！超級大獎 3:1';
    } else {
      // Compare
      if (dScore > 21) {
        winAmount = betAmount * 2;
        resultMsg = '🎉 莊家爆牌！你贏了 (YOU WIN)';
      } else if (pScore > dScore) {
        winAmount = betAmount * 2;
        resultMsg = '🏆 點數勝出！你贏了 (YOU WIN)';
      } else if (pScore < dScore) {
        resultMsg = '🤖 點數不足，莊家勝 (DEALER WINS)';
      } else {
        winAmount = betAmount;
        resultMsg = '🤝 平手 (PUSH)';
      }
    }

    if (winAmount > 0) {
      // Add winnings to DB
      const { data } = await supabase.from('profiles').select('points').eq('id', profile!.id).single();
      if (data) {
         await supabase.from('profiles').update({ points: data.points + winAmount }).eq('id', profile!.id);
      }
      onUpdate();
      setLastWin(winAmount - betAmount); // Show net profit
    } else {
      setLastWin(-betAmount);
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
    <div className="flex flex-col items-center bg-slate-950 min-h-[600px] w-full max-w-4xl mx-auto rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden font-sans selection:bg-indigo-500">
      
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 shadow-[0_0_10px_#6366f1]" />

      {/* Top Bar */}
      <div className="w-full p-6 flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Zap className="text-yellow-400" />
          <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            CYBER<span className="text-white">BLITZ</span> 21
          </h1>
        </div>
        <div className="flex items-center space-x-6">
          <button onClick={() => setShowRules(true)} className="hover:text-cyan-400 transition-colors">
            <Info size={24} />
          </button>
          <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1 rounded-full border border-slate-700">
            <DollarSign size={16} className="text-green-400" />
            <span className="font-mono text-xl text-green-400 font-bold">{profile?.points.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 p-4 space-y-8">
        
        {/* Dealer Area */}
        <div className="flex flex-col items-center min-h-[160px]">
          <div className="flex items-center space-x-2 mb-2 opacity-70">
            <Shield size={16} />
            <span className="text-xs tracking-widest uppercase">AI Dealer System</span>
            {gameState !== 'BETTING' && (
               <span className="ml-2 bg-red-900/50 text-red-300 px-2 rounded text-xs">
                 {gameState === 'PLAYING' ? '??' : calculateScore(dealerHand)}
               </span>
            )}
          </div>
          <div className="flex -space-x-12 sm:-space-x-16">
            {dealerHand.map((card, i) => (
              <Card 
                key={card.id} 
                card={card} 
                index={i} 
                hidden={gameState === 'PLAYING' && i === 1} 
              />
            ))}
            {dealerHand.length === 0 && <div className="h-28 sm:h-36 w-20 sm:w-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700 text-xs font-bold">DEALER</div>}
          </div>
        </div>

        {/* Message / Status */}
        <div className="h-16 flex items-center justify-center">
          {message && (
            <div className={`px-6 py-3 rounded-xl font-black text-lg md:text-xl animate-in zoom-in duration-300 shadow-lg border border-white/10 backdrop-blur-md
              ${message.includes('WIN') || message.includes('3:2') || message.includes('3:1') ? 'bg-green-500/20 text-green-300 shadow-green-500/20' : 
                message.includes('PUSH') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300 shadow-red-500/20'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center min-h-[160px]">
          <div className="flex -space-x-12 sm:-space-x-16 mb-2">
            {playerHand.map((card, i) => (
              <Card key={card.id} card={card} index={i} />
            ))}
            {playerHand.length === 0 && <div className="h-28 sm:h-36 w-20 sm:w-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700 text-xs font-bold">PLAYER</div>}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs tracking-widest uppercase opacity-70">Player 01</span>
            {gameState !== 'BETTING' && (
               <span className={`ml-2 px-2 rounded text-xs font-bold ${calculateScore(playerHand) > 21 ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
                 {calculateScore(playerHand)}
               </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
          {gameState === 'BETTING' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Current Bet</span>
                <span className="text-3xl font-mono text-indigo-400 font-black">{currentBet}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => addToBet(amt)}
                    className="py-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors font-mono text-xs font-bold text-white active:scale-95"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button 
                  onClick={clearBet} 
                  className="flex-1 py-4 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors text-sm font-bold border border-red-900/30"
                >
                  RESET
                </button>
                <button 
                  onClick={dealGame} 
                  disabled={currentBet === 0 || processing}
                  className="flex-[2] py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all font-black flex items-center justify-center space-x-2 text-lg active:scale-[0.98]"
                >
                  {processing ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white" /> : <><Play size={20} fill="currentColor" /> <span>DEAL CARDS</span></>}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gameState === 'PLAYING' && (
                <>
                  <button 
                    onClick={hit}
                    className="col-span-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all active:scale-95 flex flex-col items-center border border-green-400/30"
                  >
                    <span className="flex items-center gap-1"><Hand size={18} /> HIT</span>
                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">要牌</span>
                  </button>
                  <button 
                    onClick={stand}
                    className="col-span-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95 flex flex-col items-center border border-red-400/30"
                  >
                     <span className="flex items-center gap-1"><XCircle size={18} /> STAND</span>
                     <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">停牌</span>
                  </button>
                  
                  {playerHand.length === 2 && profile && profile.points >= currentBet && (
                    <button 
                      onClick={doubleDown}
                      disabled={processing}
                      className="col-span-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold tracking-widest transition-all border border-amber-400/50 flex items-center justify-center space-x-2 shadow-lg active:scale-95"
                    >
                      <Zap size={16} fill="currentColor" />
                      <span>DOUBLE DOWN (x2)</span>
                    </button>
                  )}
                </>
              )}
              
              {gameState === 'GAME_OVER' && (
                <button 
                  onClick={resetGame}
                  className="col-span-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-lg animate-pulse shadow-[0_0_25px_rgba(79,70,229,0.5)] flex items-center justify-center space-x-2"
                >
                  <RotateCcw size={20} />
                  <span>PLAY AGAIN</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info/Rules Modal */}
      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/50 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <XCircle size={28} />
            </button>
            
            <h2 className="text-2xl font-black text-white mb-6 flex items-center">
              <Info className="mr-2 text-indigo-400" /> 
              ENGINEER'S PROTOCOL
            </h2>
            
            <div className="space-y-4 text-slate-300 text-sm">
              <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-indigo-500">
                <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Payout Algorithm</h3>
                <ul className="space-y-1 font-mono text-xs">
                  <li className="flex justify-between"><span>Blackjack (Initial 21)</span> <span className="text-green-400">3:2</span></li>
                  <li className="flex justify-between"><span>5-Card Charlie (Win)</span> <span className="text-yellow-400">3:1</span></li>
                  <li className="flex justify-between"><span>Normal Win</span> <span className="text-white">1:1</span></li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-cyan-500">
                <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">System Core Rules</h3>
                <ul className="list-disc pl-4 space-y-1 marker:text-cyan-500 text-xs leading-relaxed">
                  <li>AI Dealer MUST stand on <span className="text-cyan-400 font-bold">17</span> or higher.</li>
                  <li>Split function disabled for speed optimization.</li>
                  <li>Double Down available on any first two cards (1 card only).</li>
                  <li>Ace calculates dynamically as 1 or 11.</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => setShowRules(false)}
              className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl font-black text-white hover:opacity-90 transition-opacity shadow-lg"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-50px) scale(0.5); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes flipIn {
          from { opacity: 0; transform: rotateY(90deg); }
          to { opacity: 1; transform: rotateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Blackjack;
