
import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Info, Zap, Shield, Coins, XCircle, Trophy } from 'lucide-react';
import { UserProfile } from '../types';

interface BlackjackViewProps {
  supabase: any;
  userProfile: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

// --- 遊戲常數 ---
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEALER_STAND_ON = 17;
const ANIMATION_SPEED = 300; // 2x 極速延遲

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
      if (['J', 'Q', 'K'].reverse().includes(value)) weight = 10;
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

// Fix: Added optional key property to props type to resolve TypeScript error when used in JSX lists
const Card = ({ card, hidden, index }: { card: CardType, hidden?: boolean, index: number, key?: string | number }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  if (hidden) {
    return (
      <div className="w-20 h-28 sm:w-24 sm:h-36 bg-slate-800 border-2 border-indigo-500 rounded-xl shadow-2xl flex items-center justify-center transform transition-all animate-in zoom-in duration-300">
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 rounded-lg flex items-center justify-center">
          <Zap className="text-indigo-400 animate-pulse" size={32} />
        </div>
      </div>
    );
  }
  return (
    <div className={`w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-xl shadow-xl flex flex-col justify-between p-3 border border-slate-100 transform transition-all hover:-translate-y-2 animate-in slide-in-from-bottom-4 duration-300 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
      <div className="text-lg font-black font-mono leading-none">{card.value}</div>
      <div className="self-center text-4xl">{card.suit}</div>
      <div className="text-lg font-black font-mono leading-none transform rotate-180">{card.value}</div>
    </div>
  );
};

const BlackjackView: React.FC<BlackjackViewProps> = ({ supabase, userProfile, showNotification }) => {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [currentBet, setCurrentBet] = useState(1000);
  const [message, setMessage] = useState('');
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const updatePoints = async (profit: number) => {
    if (!userProfile) return;
    const { data } = await supabase.from('profiles').update({ points: userProfile.points + profit }).eq('id', userProfile.id).select().single();
    return data;
  };

  const handleBet = (amount: number) => {
    if (amount === -1) setCurrentBet(userProfile?.points || 0);
    else setCurrentBet(prev => Math.min(prev + amount, userProfile?.points || 0));
  };

  const dealGame = async () => {
    if (!userProfile || userProfile.points < currentBet) {
      showNotification("餘額不足以進行下注", "error");
      return;
    }
    if (currentBet <= 0) return showNotification("請選擇投注金額", "error");

    // 即時扣除積分 (Bet Phase)
    await updatePoints(-currentBet);
    
    const newDeck = deck.length < 10 ? createDeck() : [...deck];
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);
    setGameState('PLAYING');
    setMessage('');

    if (calculateScore(pHand) === 21) {
      finalizeGame(pHand, dHand, true);
    }
  };

  const hit = () => {
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);

    if (calculateScore(newHand) > 21) {
      finalizeGame(newHand, dealerHand);
    } else if (newHand.length === 5) {
      finalizeGame(newHand, dealerHand);
    }
  };

  const stand = async () => {
    setGameState('DEALER_TURN');
    let tempDeck = [...deck];
    let tempDealerHand = [...dealerHand];
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    await sleep(ANIMATION_SPEED); 
    
    while (calculateScore(tempDealerHand) < DEALER_STAND_ON) {
      tempDealerHand.push(tempDeck.pop()!);
      setDealerHand([...tempDealerHand]);
      setDeck([...tempDeck]);
      await sleep(ANIMATION_SPEED);
    }
    finalizeGame(playerHand, tempDealerHand);
  };

  const finalizeGame = async (pHand: CardType[], dHand: CardType[], isBlackjack = false) => {
    setGameState('DEALER_TURN');
    await new Promise(r => setTimeout(r, 400));
    setGameState('GAME_OVER');
    
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    let winAmount = 0;
    let resultMsg = '';

    if (pScore > 21) {
      resultMsg = '爆牌 (BUST)！莊家獲勝';
    } else if (pHand.length === 5 && pScore <= 21) {
      winAmount = currentBet * 4; // 賠率 3:1 + 本金
      resultMsg = '五龍護體 (5-CARD CHARLIE)！獲得 3:1 獎金';
    } else if (isBlackjack) {
      if (dScore === 21) {
        winAmount = currentBet;
        resultMsg = '平手 (PUSH)';
      } else {
        winAmount = Math.floor(currentBet * 2.5); // 賠率 3:2 + 本金
        resultMsg = 'BLACKJACK！獲得 3:2 獎金';
      }
    } else if (dScore > 21) {
      winAmount = currentBet * 2;
      resultMsg = '莊家爆牌！你贏了';
    } else if (pScore > dScore) {
      winAmount = currentBet * 2;
      resultMsg = '點數大於莊家！你贏了';
    } else if (pScore < dScore) {
      resultMsg = '點數小於莊家，再接再厲';
    } else {
      winAmount = currentBet;
      resultMsg = '平手 (PUSH)';
    }

    if (winAmount > 0) {
      await updatePoints(winAmount);
      showNotification(`獲得 ${winAmount.toLocaleString()} HKER Token`, "info");
    }
    setMessage(resultMsg);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 relative pb-20">
      {/* 頂部導航 */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Zap className="text-indigo-400 animate-pulse" size={32}/>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">AI CYBER 21</h1>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Neural Dealer Engine v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-slate-800/80 px-8 py-3 rounded-2xl border border-white/5 text-center shadow-inner">
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Your HKER Tokens</p>
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-500" size={14}/>
                <span className="font-mono font-black text-white text-xl">{userProfile?.points.toLocaleString()}</span>
              </div>
           </div>
           <button onClick={() => setShowRules(true)} className="p-4 rounded-2xl bg-slate-800 text-slate-300 hover:text-white transition-all"><Info size={24}/></button>
        </div>
      </div>

      {/* 牌桌區域 */}
      <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-[4rem] p-8 md:p-12 shadow-2xl border-b-[12px] border-slate-900 relative overflow-hidden flex flex-col gap-12 min-h-[500px] justify-center items-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30" />
        
        {/* 莊家手牌 */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-4 py-1 rounded-full border border-white/5">
            <Shield size={12}/> AI Dealer {dealerHand.length > 0 && <span>• {gameState === 'PLAYING' ? '??' : calculateScore(dealerHand)}</span>}
          </div>
          <div className="flex -space-x-12 sm:-space-x-16">
            {dealerHand.map((card, i) => (
              <Card key={card.id} card={card} index={i} hidden={gameState === 'PLAYING' && i === 1} />
            ))}
            {dealerHand.length === 0 && <div className="h-28 sm:h-36 w-20 sm:w-24 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-800 font-black italic">STANDBY</div>}
          </div>
        </div>

        {/* 訊息顯示 */}
        <div className="h-12 flex items-center justify-center">
          {message && (
            <div className="bg-indigo-500 text-white px-8 py-2 rounded-full font-black text-lg shadow-lg animate-bounce border border-indigo-400">
              {message}
            </div>
          )}
        </div>

        {/* 玩家手牌 */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex -space-x-12 sm:-space-x-16">
            {playerHand.map((card, i) => (
              <Card key={card.id} card={card} index={i} />
            ))}
            {playerHand.length === 0 && <div className="h-28 sm:h-36 w-20 sm:w-24 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-800 font-black italic">EMPTY</div>}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-1 rounded-full border border-indigo-500/20">
            Player Hand {playerHand.length > 0 && <span>• {calculateScore(playerHand)}</span>}
          </div>
        </div>
      </div>

      {/* 控制面板 */}
      <div className="max-w-md mx-auto w-full bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100">
        {gameState === 'BETTING' || gameState === 'GAME_OVER' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Current Bet Selection</p>
              <p className="text-3xl font-mono font-black text-slate-900">{currentBet.toLocaleString()} <span className="text-xs text-indigo-500">PT</span></p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, -1].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleBet(amt)}
                  className="py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all font-mono text-sm font-black text-slate-600 active:scale-95"
                >
                  {amt === -1 ? 'ALL IN' : `+${amt/1000}K`}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setCurrentBet(0); setGameState('BETTING'); setPlayerHand([]); setDealerHand([]); setMessage(''); }} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-400 font-black text-sm hover:bg-slate-200 active:scale-95 transition-all">RESET</button>
              <button 
                onClick={dealGame} 
                className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Play size={20} fill="currentColor"/> DEAL CARDS
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={hit} 
                disabled={gameState !== 'PLAYING'} 
                className="py-6 rounded-2xl bg-green-500 text-white font-black text-2xl shadow-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50"
              >
                HIT
              </button>
              <button 
                onClick={stand} 
                disabled={gameState !== 'PLAYING'} 
                className="py-6 rounded-2xl bg-red-500 text-white font-black text-2xl shadow-lg hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
              >
                STAND
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest animate-pulse">Decision Phase Active...</p>
          </div>
        )}
      </div>

      {/* 規則彈窗 */}
      {showRules && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
            <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><XCircle size={32}/></button>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <Trophy className="text-yellow-500"/> 遊戲規則與獎勵
            </h2>
            <div className="space-y-6 text-sm text-slate-600 font-medium">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="font-black text-slate-900 mb-3 uppercase text-xs tracking-widest text-indigo-500">賠率說明 (PAYOUTS)</p>
                <ul className="space-y-2">
                  <li className="flex justify-between"><span>Blackjack (起手21點)</span> <span className="font-black text-slate-900">3 : 2</span></li>
                  <li className="flex justify-between"><span>五龍 (手拿5張牌未爆)</span> <span className="font-black text-slate-900">3 : 1</span></li>
                  <li className="flex justify-between"><span>普通獲勝 (Win)</span> <span className="font-black text-slate-900">1 : 1</span></li>
                </ul>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                <li>莊家點數不足 <span className="text-indigo-600 font-bold">17點</span> 必須強制加牌。</li>
                <li>為加快遊戲節奏，本系統<span className="text-red-500 font-bold">不支援分牌(Split)</span>。</li>
                <li>A 可自動判定為 1點 或 11點。</li>
                <li>所有積分變動即時儲存至 HKER 帳戶。</li>
              </ul>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-600 transition-all">準備好贏錢了</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlackjackView;
