
import React, { useState, useEffect, useContext } from 'react';
import { Play, RotateCcw, Info, Zap, Shield, DollarSign, XCircle, Cpu } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEALER_STAND_ON = 17;
const ANIMATION_SPEED = 200; 

interface CardType {
  suit: string;
  value: string;
  weight: number;
  id: string;
}

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
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
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

interface CardProps {
  card: CardType;
  hidden?: boolean;
  index: number;
}

const Card: React.FC<CardProps> = ({ card, hidden, index }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  if (hidden) {
    return (
      <div 
        className="w-16 h-24 sm:w-24 sm:h-36 bg-slate-800 border-2 border-indigo-500/50 rounded-lg shadow-2xl flex items-center justify-center relative transform transition-all duration-300 hover:scale-105"
        style={{ animation: `slideIn 0.3s ease-out ${index * 0.1}s backwards` }}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/50 to-slate-950 rounded-md flex items-center justify-center">
          <Shield className="text-indigo-500/50 animate-pulse" size={24} />
        </div>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>
    );
  }

  return (
    <div 
      className={`w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-lg shadow-xl flex flex-col justify-between p-2 relative transform transition-all duration-300 hover:-translate-y-2 select-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}
      style={{ animation: `flipIn 0.4s ease-out ${index * 0.1}s backwards` }}
    >
      <div className="text-base sm:text-lg font-bold font-mono leading-none">{card.value}</div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl sm:text-4xl">
        {card.suit}
      </div>
      <div className="text-base sm:text-lg font-bold font-mono leading-none transform rotate-180 self-end">{card.value}</div>
    </div>
  );
};

export const BlackjackGame: React.FC = () => {
  const { currentUser, updatePoints } = useContext(DataContext);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [message, setMessage] = useState('');
  const [currentBet, setCurrentBet] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  
  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const placeBet = (amount: number) => {
    if (!currentUser) return;
    if (currentUser.points >= amount) {
      updatePoints(currentUser.id, -amount); 
      setCurrentBet(prev => prev + amount);
    } else {
      alert("積分不足 (INSUFFICIENT TOKENS)");
    }
  };

  const clearBet = () => {
    if (!currentUser || currentBet === 0) return;
    updatePoints(currentUser.id, currentBet); 
    setCurrentBet(0);
  };

  const dealGame = () => {
    if (currentBet === 0) {
      setMessage("請先下注！(SYSTEM ERROR: NO BET)");
      return;
    }
    if (deck.length < 10) setDeck(createDeck()); 

    const newDeck = [...deck];
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);
    setGameState('PLAYING');
    setMessage('');
    setLastWin(0);

    const pScore = calculateScore(pHand);
    if (pScore === 21) {
      handleGameOver(pHand, dHand, 'BLACKJACK');
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
      handleGameOver(newHand, dealerHand, 'BUST');
    } else if (newHand.length === 5) {
      handleGameOver(newHand, dealerHand, '5-CARD-CHARLIE');
    }
  };

  const doubleDown = () => {
    if (!currentUser) return;
    if (currentUser.points >= currentBet) {
      updatePoints(currentUser.id, -currentBet); 
      setCurrentBet(prev => prev * 2);
      
      const newDeck = [...deck];
      const card = newDeck.pop()!;
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

  const runDealerLogic = async (pHand: CardType[], dHand: CardType[], currentDeck: CardType[]) => {
    setGameState('DEALER_TURN');
    let tempDeck = [...currentDeck];
    let tempDealerHand = [...dHand];
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    await sleep(ANIMATION_SPEED); 
    
    let dScore = calculateScore(tempDealerHand);
    
    while (dScore < DEALER_STAND_ON) {
      const card = tempDeck.pop()!;
      tempDealerHand = [...tempDealerHand, card];
      setDealerHand(tempDealerHand);
      setDeck(tempDeck);
      dScore = calculateScore(tempDealerHand);
      await sleep(ANIMATION_SPEED);
    }

    handleGameOver(pHand, tempDealerHand, 'COMPARE');
  };

  const handleGameOver = (pHand: CardType[], dHand: CardType[], reason: string) => {
    setGameState('GAME_OVER');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    let winAmount = 0;
    let resultMsg = '';

    if (reason === 'BUST') {
      resultMsg = '爆牌！系統獲勝 (SYSTEM WIN)';
    } else if (reason === 'BLACKJACK') {
      if (dScore === 21) {
         winAmount = currentBet; // Push
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

    if (currentUser && winAmount > 0) {
      updatePoints(currentUser.id, winAmount);
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

  if (!currentUser) return <div>Please Login</div>;

  return (
    <div className="bg-slate-950 rounded-xl shadow-2xl border border-slate-700 font-sans selection:bg-indigo-500 overflow-hidden flex flex-col items-center justify-center relative min-h-[600px] max-w-5xl mx-auto">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 shadow-[0_0_10px_#6366f1]" />

      <div className="w-full p-4 flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Zap className="text-yellow-400" />
          <h1 className="text-xl md:text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            CYBER<span className="text-white">BLITZ</span> 21
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowRules(true)} className="hover:text-cyan-400 transition-colors">
            <Info size={24} />
          </button>
          <div className="hidden md:flex items-center space-x-2 bg-slate-800 px-4 py-1 rounded-full border border-slate-700">
            <DollarSign size={16} className="text-green-400" />
            <span className="font-mono text-xl text-green-400 font-bold">{currentUser.points.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 p-4 space-y-6">
        
        <div className="flex flex-col items-center min-h-[140px]">
          <div className="flex items-center space-x-2 mb-2 opacity-70">
            <Cpu size={16} />
            <span className="text-xs tracking-widest uppercase">AI Dealer System</span>
            {gameState !== 'BETTING' && (
               <span className="ml-2 bg-red-900/50 text-red-300 px-2 rounded text-xs font-mono">
                 {gameState === 'PLAYING' ? '??' : calculateScore(dealerHand)}
               </span>
            )}
          </div>
          <div className="flex -space-x-10 sm:-space-x-12">
            {dealerHand.map((card, i) => (
              <Card 
                key={card.id} 
                card={card} 
                index={i} 
                hidden={gameState === 'PLAYING' && i === 1} 
              />
            ))}
            {dealerHand.length === 0 && <div className="h-24 sm:h-36 w-16 sm:w-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700 text-xs">EMPTY</div>}
          </div>
        </div>

        <div className="h-14 flex items-center justify-center w-full">
          {message && (
            <div className={`px-6 py-2 rounded-lg font-bold text-lg animate-bounce shadow-lg border border-white/20 backdrop-blur-sm
              ${message.includes('WIN') || message.includes('3:2') || message.includes('3:1') ? 'bg-green-500/20 text-green-300 shadow-green-500/20' : 
                message.includes('PUSH') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300 shadow-red-500/20'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center min-h-[140px]">
          <div className="flex -space-x-10 sm:-space-x-12 mb-2">
            {playerHand.map((card, i) => (
              <Card key={card.id} card={card} index={i} />
            ))}
            {playerHand.length === 0 && <div className="h-24 sm:h-36 w-16 sm:w-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700 text-xs">EMPTY</div>}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs tracking-widest uppercase opacity-70">Player</span>
            {gameState !== 'BETTING' && (
               <span className={`ml-2 px-2 rounded text-xs font-bold font-mono ${calculateScore(playerHand) > 21 ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
                 {calculateScore(playerHand)}
               </span>
            )}
          </div>
        </div>

        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
          {gameState === 'BETTING' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-slate-400">CURRENT BET</span>
                <span className="text-3xl font-mono text-indigo-400 font-bold">{currentBet}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => placeBet(amt)}
                    className="py-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors font-mono text-sm font-bold text-cyan-300"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button 
                  onClick={clearBet} 
                  disabled={currentBet === 0}
                  className="flex-1 py-3 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors text-sm font-bold border border-red-900/50 disabled:opacity-30"
                >
                  RESET
                </button>
                <button 
                  onClick={dealGame} 
                  disabled={currentBet === 0}
                  className="flex-[2] py-3 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-[0_0_15px_#4f46e5] transition-all font-bold flex items-center justify-center space-x-2"
                >
                  <Play size={18} fill="currentColor" />
                  <span>DEAL CARDS</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gameState === 'PLAYING' && (
                <>
                  <button 
                    onClick={hit}
                    className="col-span-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-lg shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all active:scale-95 flex flex-col items-center"
                  >
                    <span>HIT (要牌)</span>
                  </button>
                  <button 
                    onClick={stand}
                    className="col-span-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-lg shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all active:scale-95 flex flex-col items-center"
                  >
                     <span>STAND (停牌)</span>
                  </button>
                  
                  {playerHand.length === 2 && currentUser.points >= currentBet && (
                    <button 
                      onClick={doubleDown}
                      className="col-span-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold tracking-widest transition-all border border-amber-400/50 flex items-center justify-center space-x-2"
                    >
                      <Zap size={16} />
                      <span>DOUBLE DOWN (加倍 x2)</span>
                    </button>
                  )}
                </>
              )}
              
              {gameState === 'GAME_OVER' && (
                <button 
                  onClick={resetGame}
                  className="col-span-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-lg animate-pulse shadow-[0_0_20px_#4f46e5] flex items-center justify-center space-x-2"
                >
                  <RotateCcw size={20} />
                  <span>PLAY AGAIN</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/50 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <XCircle size={28} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Info className="mr-2 text-indigo-400" /> 
              ENGINEER'S PROTOCOL
            </h2>
            <div className="space-y-4 text-slate-300 text-sm">
              <div className="bg-slate-800/50 p-3 rounded border-l-4 border-indigo-500">
                <h3 className="text-white font-bold mb-1">極速賠率表 (Payout Logic)</h3>
                <ul className="space-y-1">
                  <li className="flex justify-between"><span>Blackjack (起手21)</span> <span className="text-green-400 font-mono">3:2</span></li>
                  <li className="flex justify-between"><span>5-Card Charlie (五龍)</span> <span className="text-yellow-400 font-mono">3:1</span></li>
                  <li className="flex justify-between"><span>一般勝出 (Win)</span> <span className="text-white font-mono">1:1</span></li>
                </ul>
              </div>
              <div className="bg-slate-800/50 p-3 rounded border-l-4 border-cyan-500">
                <h3 className="text-white font-bold mb-1">系統核心規則 (Core Rules)</h3>
                <ul className="list-disc pl-4 space-y-1 marker:text-cyan-500">
                  <li>AI 莊家在 <span className="text-cyan-400">17點</span> 或以上必須停牌。</li>
                  <li>為了遊戲流暢度，<span className="text-red-400">禁用分牌 (Split)</span>。</li>
                  <li>任何兩張手牌皆可執行 <span className="text-amber-400">加倍 (Double)</span>。</li>
                  <li>加倍後僅再發 <span className="font-bold text-white">1</span> 張牌。</li>
                  <li>A 可視為 1 或 11 點 (動態運算)。</li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setShowRules(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg font-bold text-white hover:opacity-90 transition-opacity"
            >
              I UNDERSTAND (確認)
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
