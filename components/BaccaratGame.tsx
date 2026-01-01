
import React, { useState, useEffect, useContext } from 'react';
import { RotateCcw, Play, Info, Cpu, Activity } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';

const DELAY_MS = 200; 

type Suit = '♠' | '♥' | '♣' | '♦';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  id: string;
}

const createDeck = (): Card[] => {
  const suits: Suit[] = ['♠', '♥', '♣', '♦'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck: Card[] = [];
  
  for (let d = 0; d < 6; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank);
        if (rank === 'A') value = 1;
        if (['10', 'J', 'Q', 'K'].includes(rank)) value = 0;
        deck.push({ suit, rank, value, id: `${d}-${suit}-${rank}-${Math.random()}` });
      }
    }
  }
  
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
};

const getPoints = (cards: Card[]) => {
  const sum = cards.reduce((acc, card) => acc + card.value, 0);
  return sum % 10;
};

export const BaccaratGame: React.FC = () => {
  const { currentUser, updatePoints } = useContext(DataContext);
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'DEALING' | 'RESULT'>('BETTING');
  const [resultMessage, setResultMessage] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  
  const [bets, setBets] = useState({ player: 0, banker: 0, tie: 0 });
  const [selectedChip, setSelectedChip] = useState(100);
  
  const [showRules, setShowRules] = useState(false);
  const [aiProb, setAiProb] = useState({ p: 45, b: 45 }); 
  
  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const placeBet = (type: 'player' | 'banker' | 'tie') => {
    if (gameState !== 'BETTING') return;
    if (!currentUser || currentUser.points < selectedChip) {
      alert("積分不足 (Insufficient Funds)");
      return;
    }
    
    updatePoints(currentUser.id, -selectedChip);
    setBets(prev => ({ ...prev, [type]: prev[type] + selectedChip }));
    
    setAiProb({
      p: 40 + Math.random() * 10,
      b: 40 + Math.random() * 10
    });
  };

  const clearBets = () => {
    if (gameState !== 'BETTING') return;
    const total = bets.player + bets.banker + bets.tie;
    if (total > 0 && currentUser) {
      updatePoints(currentUser.id, total);
      setBets({ player: 0, banker: 0, tie: 0 });
    }
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const dealGame = async () => {
    const totalBet = bets.player + bets.banker + bets.tie;
    if (totalBet === 0) return alert("請先下注 (Place your bet)");
    
    let currentDeck = [...deck];
    if (currentDeck.length < 10) currentDeck = createDeck();

    setGameState('DEALING');
    setPlayerCards([]);
    setBankerCards([]);
    setResultMessage('');
    setWinAmount(0);

    const pHand: Card[] = [];
    const bHand: Card[] = [];

    await wait(DELAY_MS);
    pHand.push(currentDeck.pop()!);
    setPlayerCards([...pHand]);
    
    await wait(DELAY_MS);
    bHand.push(currentDeck.pop()!);
    setBankerCards([...bHand]);

    await wait(DELAY_MS);
    pHand.push(currentDeck.pop()!);
    setPlayerCards([...pHand]);

    await wait(DELAY_MS);
    bHand.push(currentDeck.pop()!);
    setBankerCards([...bHand]);

    let pScore = getPoints(pHand);
    let bScore = getPoints(bHand);

    let gameOver = false;
    if (pScore >= 8 || bScore >= 8) {
      gameOver = true;
    }

    if (!gameOver) {
      let playerDrewCard: Card | null = null;

      if (pScore <= 5) {
        await wait(DELAY_MS);
        const card = currentDeck.pop()!;
        pHand.push(card);
        playerDrewCard = card;
        setPlayerCards([...pHand]);
        pScore = getPoints(pHand);
      }

      let bankerDraws = false;
      if (!playerDrewCard) {
        if (bScore <= 5) bankerDraws = true;
      } else {
        const p3Val = playerDrewCard.value;
        if (bScore <= 2) bankerDraws = true;
        else if (bScore === 3 && p3Val !== 8) bankerDraws = true;
        else if (bScore === 4 && [2,3,4,5,6,7].includes(p3Val)) bankerDraws = true;
        else if (bScore === 5 && [4,5,6,7].includes(p3Val)) bankerDraws = true;
        else if (bScore === 6 && [6,7].includes(p3Val)) bankerDraws = true;
      }

      if (bankerDraws) {
        await wait(DELAY_MS);
        bHand.push(currentDeck.pop()!);
        setBankerCards([...bHand]);
        bScore = getPoints(bHand);
      }
    }

    setDeck(currentDeck);
    determineWinner(pScore, bScore);
  };

  const determineWinner = (pScore: number, bScore: number) => {
    let winner: 'player' | 'banker' | 'tie' = 'tie';
    let payout = 0;

    if (pScore > bScore) winner = 'player';
    else if (bScore > pScore) winner = 'banker';

    if (winner === 'player') {
      payout += bets.player * 2; 
    } else if (winner === 'banker') {
      payout += Math.floor(bets.banker * 1.95); 
    } else {
      payout += bets.tie * 9; 
      payout += bets.player; 
      payout += bets.banker; 
    }

    if (payout > 0 && currentUser) {
      updatePoints(currentUser.id, payout);
      setWinAmount(payout);
    }

    setResultMessage(
      winner === 'tie' 
        ? `和局 TIE (${pScore} - ${bScore})` 
        : `${winner === 'player' ? '閒家' : '莊家'} 勝 (${pScore} - ${bScore})`
    );
    setGameState('RESULT');
  };

  const resetRound = () => {
    setBets({ player: 0, banker: 0, tie: 0 });
    setGameState('BETTING');
    setWinAmount(0);
    setResultMessage('');
    setPlayerCards([]);
    setBankerCards([]);
  };

  const renderCard = (card: Card, index: number) => {
    const isRed = ['♥', '♦'].includes(card.suit);
    return (
      <div 
        key={card.id}
        className={`
          w-16 h-24 md:w-20 md:h-28 bg-white rounded-lg border-2 border-gray-300 shadow-xl flex flex-col items-center justify-between p-1
          transform transition-all duration-300 animate-fade-in hover:-translate-y-2
          ${isRed ? 'text-red-600' : 'text-slate-900'}
        `}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="font-bold font-mono text-lg self-start">{card.rank}</div>
        <div className="text-3xl">{card.suit}</div>
        <div className="font-bold font-mono text-lg self-end transform rotate-180">{card.rank}</div>
      </div>
    );
  };

  if (!currentUser) return <div>Please Login</div>;

  return (
    <div className="relative bg-[#0a0a0c] text-slate-200 font-sans min-h-[700px] rounded-xl overflow-hidden shadow-2xl border-2 border-slate-800 flex flex-col">
      
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
      <div className="absolute top-0 w-full h-1 bg-green-500/50 shadow-[0_0_20px_#22c55e] animate-pulse z-10"></div>

      <div className="relative z-10 bg-black/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-green-900/30">
        <div className="flex items-center gap-3">
          <Activity className="text-green-500 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent italic">
            AI TURBO <span className="text-white not-italic">BACCARAT</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-xs text-slate-500">BALANCE</div>
            <div className="text-xl font-mono text-yellow-400 font-bold">${currentUser.points.toLocaleString()}</div>
          </div>
          <button onClick={() => setShowRules(true)} className="p-2 hover:text-green-400 transition"><Info /></button>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start p-4 bg-[radial-gradient(circle_at_center,#1a2a24_0%,#050a08_100%)]">
        
        <div className="w-full max-w-2xl flex justify-between items-center mb-8 px-8 opacity-80">
           <div className="text-center w-1/3">
              <div className="text-[10px] text-blue-400 mb-1 flex items-center justify-center gap-1"><Cpu size={10}/> AI PROB (P)</div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${aiProb.p}%` }}></div>
              </div>
           </div>
           <div className="text-center w-1/3">
              <div className="text-[10px] text-red-400 mb-1 flex items-center justify-center gap-1"><Cpu size={10}/> AI PROB (B)</div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${aiProb.b}%` }}></div>
              </div>
           </div>
        </div>

        <div className="flex w-full max-w-4xl justify-around items-start mb-8 min-h-[200px]">
            <div className="flex flex-col items-center">
                <h2 className="text-blue-400 font-bold tracking-widest mb-4 text-lg border-b-2 border-blue-500/30 pb-1 px-4">PLAYER 閒</h2>
                <div className="flex gap-2">
                    {playerCards.length === 0 && <div className="w-16 h-24 border-2 border-slate-700 border-dashed rounded-lg flex items-center justify-center text-slate-700">EMPTY</div>}
                    {playerCards.map((c, i) => renderCard(c, i))}
                </div>
                {gameState !== 'BETTING' && (
                    <div className="mt-4 text-3xl font-mono font-bold text-blue-100 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        {getPoints(playerCards)}
                    </div>
                )}
            </div>

            <div className="self-center flex flex-col items-center">
                <div className="h-16 w-px bg-gradient-to-b from-transparent via-slate-500 to-transparent"></div>
                <span className="font-black text-slate-600 text-xl my-2">VS</span>
                <div className="h-16 w-px bg-gradient-to-b from-transparent via-slate-500 to-transparent"></div>
            </div>

            <div className="flex flex-col items-center">
                <h2 className="text-red-400 font-bold tracking-widest mb-4 text-lg border-b-2 border-red-500/30 pb-1 px-4">BANKER 莊</h2>
                <div className="flex gap-2">
                    {bankerCards.length === 0 && <div className="w-16 h-24 border-2 border-slate-700 border-dashed rounded-lg flex items-center justify-center text-slate-700">EMPTY</div>}
                    {bankerCards.map((c, i) => renderCard(c, i))}
                </div>
                {gameState !== 'BETTING' && (
                    <div className="mt-4 text-3xl font-mono font-bold text-red-100 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        {getPoints(bankerCards)}
                    </div>
                )}
            </div>
        </div>

        <div className={`absolute top-1/3 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-500 ${gameState === 'RESULT' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-black/80 backdrop-blur-lg px-12 py-6 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] text-center transform scale-110">
                <h2 className={`text-4xl font-black italic mb-2 ${resultMessage.includes('閒') ? 'text-blue-400' : resultMessage.includes('莊') ? 'text-red-400' : 'text-green-400'}`}>
                    {resultMessage}
                </h2>
                {winAmount > 0 ? (
                    <p className="text-2xl text-yellow-400 font-mono font-bold animate-bounce">+${winAmount}</p>
                ) : (
                    <p className="text-slate-400">TRY AGAIN</p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-3xl mt-auto">
            <button 
                onClick={() => placeBet('player')}
                disabled={gameState !== 'BETTING'}
                className={`
                    relative group border-2 rounded-xl p-6 transition-all duration-200
                    ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-900/20 active:scale-95'}
                    ${bets.player > 0 ? 'border-blue-500 bg-blue-900/10 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' : 'border-slate-700 bg-slate-900/50'}
                `}
            >
                <div className="text-blue-400 font-bold text-xl mb-1 group-hover:text-blue-300">PLAYER (閒)</div>
                <div className="text-xs text-slate-500">1 : 1</div>
                {bets.player > 0 && <div className="mt-2 text-yellow-400 font-mono font-bold text-lg">${bets.player}</div>}
            </button>

            <button 
                onClick={() => placeBet('tie')}
                disabled={gameState !== 'BETTING'}
                className={`
                    relative group border-2 rounded-xl p-6 transition-all duration-200
                    ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-900/20 active:scale-95'}
                    ${bets.tie > 0 ? 'border-green-500 bg-green-900/10 shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]' : 'border-slate-700 bg-slate-900/50'}
                `}
            >
                <div className="text-green-400 font-bold text-xl mb-1 group-hover:text-green-300">TIE (和)</div>
                <div className="text-xs text-slate-500">1 : 8</div>
                {bets.tie > 0 && <div className="mt-2 text-yellow-400 font-mono font-bold text-lg">${bets.tie}</div>}
            </button>

            <button 
                onClick={() => placeBet('banker')}
                disabled={gameState !== 'BETTING'}
                className={`
                    relative group border-2 rounded-xl p-6 transition-all duration-200
                    ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-900/20 active:scale-95'}
                    ${bets.banker > 0 ? 'border-red-500 bg-red-900/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : 'border-slate-700 bg-slate-900/50'}
                `}
            >
                <div className="text-red-400 font-bold text-xl mb-1 group-hover:text-red-300">BANKER (莊)</div>
                <div className="text-xs text-slate-500">1 : 0.95</div>
                {bets.banker > 0 && <div className="mt-2 text-yellow-400 font-mono font-bold text-lg">${bets.banker}</div>}
            </button>
        </div>
      </div>

      <div className="bg-black p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800 z-10 relative">
         <div className="flex gap-2">
            {[100, 500, 1000, 5000].map(val => (
                <button
                    key={val}
                    onClick={() => setSelectedChip(val)}
                    disabled={gameState !== 'BETTING'}
                    className={`
                        w-14 h-14 rounded-full font-bold border-2 shadow-lg flex items-center justify-center transition-transform hover:scale-110
                        ${selectedChip === val ? 'bg-yellow-500 text-black border-white ring-2 ring-yellow-500/50 scale-110' : 'bg-slate-800 text-slate-300 border-slate-600'}
                    `}
                >
                    {val < 1000 ? val : `${val/1000}k`}
                </button>
            ))}
         </div>

         <div className="flex gap-3 w-full md:w-auto">
            {gameState === 'BETTING' ? (
                <>
                    <button 
                        onClick={clearBets}
                        className="px-6 py-3 rounded-full bg-slate-800 text-slate-400 font-bold border border-slate-600 hover:bg-slate-700 transition"
                    >
                        RESET
                    </button>
                    <button 
                        onClick={dealGame}
                        className="flex-1 px-12 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg shadow-[0_0_20px_#10b981] hover:shadow-[0_0_30px_#10b981] hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        <Play fill="currentColor" /> DEAL
                    </button>
                </>
            ) : gameState === 'RESULT' ? (
                <button 
                    onClick={resetRound}
                    className="flex-1 px-12 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-[0_0_20px_#2563eb] animate-pulse flex items-center justify-center gap-2"
                >
                    <RotateCcw /> PLAY AGAIN
                </button>
            ) : (
                <div className="text-slate-400 font-mono animate-pulse">AI CALCULATING...</div>
            )}
         </div>
      </div>

      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-green-500/50 max-w-md w-full p-6 rounded-2xl shadow-2xl">
                <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center"><Cpu className="mr-2"/> PROTOCOL: BACCARAT</h3>
                <div className="space-y-3 text-sm text-slate-300">
                    <div className="p-3 bg-slate-800 rounded border-l-4 border-green-500">
                        <p className="font-bold text-white mb-1">目標 Objective</p>
                        <p>點數總和取個位數，最接近 9 為勝。A=1, 10/J/Q/K=0。</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded border-l-4 border-blue-500">
                        <p className="font-bold text-white mb-1">賠率 Payouts</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><span className="text-blue-400">閒 Player</span>: 1 賠 1</li>
                            <li><span className="text-red-400">莊 Banker</span>: 1 賠 0.95 (5% 佣金)</li>
                            <li><span className="text-green-400">和 Tie</span>: 1 賠 8</li>
                        </ul>
                    </div>
                    <div className="p-3 bg-slate-800 rounded border-l-4 border-yellow-500">
                        <p className="font-bold text-white mb-1">補牌規則 Third Card</p>
                        <p>AI 自動根據標準百家樂規則進行補牌。若首兩張點數和為 8 或 9 (天牌)，直接定勝負。</p>
                    </div>
                </div>
                <button onClick={() => setShowRules(false)} className="w-full mt-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition">
                    I UNDERSTAND (確認)
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
