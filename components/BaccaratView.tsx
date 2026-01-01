
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { Zap, Shield, Coins, Info, XCircle, Trophy, Activity } from 'lucide-react';

interface BaccaratViewProps {
  supabase: any;
  userProfile: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

const CARDS_POOL = [
  'A♠','2♠','3♠','4♠','5♠','6♠','7♠','8♠','9♠','10♠','J♠','Q♠','K♠',
  'A♥','2♥','3♥','4♥','5♥','6♥','7♥','8♥','9♥','10♥','J♥','Q♥','K♥',
  'A♣','2♣','3♣','4♣','5♣','6♣','7♣','8♣','9♣','10♣','J♣','Q♣','K♣',
  'A♦','2♦','3♦','4♦','5♦','6♦','7♦','8♦','9♦','10♦','J♦','Q♦','K♦'
];

const BaccaratView: React.FC<BaccaratViewProps> = ({ supabase, userProfile, showNotification }) => {
  const [balance, setBalance] = useState(userProfile?.points || 0);
  const [bets, setBets] = useState({ player: 0, banker: 0, tie: 0 });
  const [currentBetType, setCurrentBetType] = useState<'player' | 'banker' | 'tie'>('player');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [bankerCards, setBankerCards] = useState<string[]>([]);
  const [showResult, setShowResult] = useState<{ winner: string; amount: number } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [prob, setProb] = useState({ player: 48, banker: 52 });

  useEffect(() => {
    if (userProfile) setBalance(userProfile.points);
  }, [userProfile]);

  const getCardValue = (card: string) => {
    const val = card.substring(0, card.length - 1);
    if (['J', 'Q', 'K', '10'].includes(val)) return 0;
    if (val === 'A') return 1;
    return parseInt(val);
  };

  const calculatePoints = (cards: string[]) => {
    const sum = cards.reduce((acc, c) => acc + getCardValue(c), 0);
    return sum % 10;
  };

  const addBet = (amount: number) => {
    if (isPlaying) return;
    if (balance < amount) return showNotification("積分不足", "error");
    setBalance(prev => prev - amount);
    setBets(prev => ({ ...prev, [currentBetType]: prev[currentBetType] + amount }));
  };

  const clearBet = () => {
    if (isPlaying) return;
    setBalance(prev => prev + bets.player + bets.banker + bets.tie);
    setBets({ player: 0, banker: 0, tie: 0 });
  };

  const startGame = async () => {
    const totalBet = bets.player + bets.banker + bets.tie;
    if (totalBet === 0 || isPlaying) return;

    // 先在 Supabase 扣除總投注 (專業工程師做法：交易先扣除)
    await supabase.from('profiles').update({ points: balance }).eq('id', userProfile?.id);

    setIsPlaying(true);
    setShowResult(null);
    setPlayerCards([]);
    setBankerCards([]);
    
    // AI 概率閃爍動畫
    setProb({ player: 40 + Math.random() * 20, banker: 40 + Math.random() * 20 });

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
    const draw = () => CARDS_POOL[Math.floor(Math.random() * 52)];

    // 第一輪發牌 (加速至 200ms)
    const p1 = draw(); const b1 = draw();
    await wait(200); setPlayerCards([p1]);
    await wait(200); setBankerCards([b1]);
    
    const p2 = draw(); const b2 = draw();
    await wait(200); setPlayerCards([p1, p2]);
    await wait(200); setBankerCards([b1, b2]);

    let pPoints = (getCardValue(p1) + getCardValue(p2)) % 10;
    let bPoints = (getCardValue(b1) + getCardValue(b2)) % 10;

    // 補牌邏輯
    if (pPoints < 6 && bPoints < 8) {
      const p3 = draw();
      await wait(200); setPlayerCards(p => [...p, p3]);
      pPoints = (pPoints + getCardValue(p3)) % 10;
    }
    if (bPoints < 6 && pPoints < 8) {
      const b3 = draw();
      await wait(200); setBankerCards(b => [...b, b3]);
      bPoints = (bPoints + getCardValue(b3)) % 10;
    }

    await wait(400);
    finalize(pPoints, bPoints);
  };

  const finalize = async (p: number, b: number) => {
    let winner = '';
    let winAmount = 0;

    if (p > b) {
      winner = 'PLAYER';
      winAmount = bets.player * 2;
    } else if (b > p) {
      winner = 'BANKER';
      winAmount = Math.floor(bets.banker * 1.95);
    } else {
      winner = 'TIE';
      winAmount = bets.tie * 9 + (bets.player + bets.banker);
    }

    const newBalance = balance + winAmount;
    await supabase.from('profiles').update({ points: newBalance }).eq('id', userProfile?.id);
    
    setShowResult({ winner, amount: winAmount });
    setBalance(newBalance);
    setBets({ player: 0, banker: 0, tie: 0 });
    setIsPlaying(false);

    if (winAmount > 0) showNotification(`🏆 獲勝！贏得 ${winAmount.toLocaleString()} PT`, "info");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 relative pb-20">
      {/* 掃描線動畫背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="w-full h-1 bg-green-500 animate-[scan_4s_linear_infinite]" />
      </div>

      {/* 頂部資訊列 */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
            <Activity className="text-green-500 animate-pulse" size={32}/>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase font-mono">AI TURBO BACCARAT</h1>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em]">Quantum Simulation Active</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-slate-800/80 px-8 py-3 rounded-2xl border border-white/5 text-center shadow-inner">
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1">錢包總額</p>
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-500" size={14}/>
                <span className="font-mono font-black text-white text-xl">{balance.toLocaleString()}</span>
              </div>
           </div>
           <button onClick={() => setShowRules(true)} className="p-4 rounded-2xl bg-slate-800 text-slate-300 hover:text-white transition-all"><Info size={24}/></button>
        </div>
      </div>

      {/* AI 勝率預測 */}
      <div className="flex justify-center gap-20 py-4 px-10 bg-slate-950/50 rounded-full border border-white/5 backdrop-blur-md">
        <div className="flex-1 max-w-xs space-y-2">
          <p className="text-[9px] font-black text-blue-400 uppercase text-center tracking-widest">閒家預測勝率 {prob.player}%</p>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${prob.player}%` }} />
          </div>
        </div>
        <div className="flex-1 max-w-xs space-y-2">
          <p className="text-[9px] font-black text-red-400 uppercase text-center tracking-widest">莊家預測勝率 {prob.banker}%</p>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${prob.banker}%` }} />
          </div>
        </div>
      </div>

      {/* 核心牌桌 */}
      <div className="bg-gradient-to-b from-[#1a2a24] to-[#050a08] rounded-[4rem] p-10 md:p-16 shadow-2xl border-b-[12px] border-[#0c1a15] relative overflow-hidden flex flex-col gap-16 min-h-[450px] justify-center items-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-20" />
        
        <div className="flex w-full justify-around items-center">
          {/* 閒家區 */}
          <div className="text-center space-y-6">
            <h2 className="text-blue-400 font-black tracking-widest uppercase text-xs opacity-50">PLAYER 閒家</h2>
            <div className="flex -space-x-12 min-h-[144px]">
               {playerCards.map((c, i) => (
                 <div key={i} className="w-24 h-36 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-4xl font-bold shadow-2xl animate-in zoom-in-75 duration-300">
                    <span className={c.includes('♥') || c.includes('♦') ? 'text-red-500' : 'text-white'}>{c}</span>
                 </div>
               ))}
               {playerCards.length === 0 && <div className="w-24 h-36 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-white/5 font-black">WAIT</div>}
            </div>
            {playerCards.length > 0 && <div className="text-3xl font-black text-blue-400 font-mono animate-in fade-in">{calculatePoints(playerCards)} 點</div>}
          </div>

          <div className="text-slate-800 font-black text-4xl italic opacity-20">VS</div>

          {/* 莊家區 */}
          <div className="text-center space-y-6">
            <h2 className="text-red-400 font-black tracking-widest uppercase text-xs opacity-50">BANKER 莊家</h2>
            <div className="flex -space-x-12 min-h-[144px]">
               {bankerCards.map((c, i) => (
                 <div key={i} className="w-24 h-36 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-4xl font-bold shadow-2xl animate-in zoom-in-75 duration-300">
                    <span className={c.includes('♥') || c.includes('♦') ? 'text-red-500' : 'text-white'}>{c}</span>
                 </div>
               ))}
               {bankerCards.length === 0 && <div className="w-24 h-36 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-white/5 font-black">WAIT</div>}
            </div>
            {bankerCards.length > 0 && <div className="text-3xl font-black text-red-400 font-mono animate-in fade-in">{calculatePoints(bankerCards)} 點</div>}
          </div>
        </div>

        {/* 獲勝遮罩 */}
        {showResult && (
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
              <div className="text-center space-y-4">
                 <h3 className={`text-6xl font-black italic tracking-tighter ${showResult.winner === 'PLAYER' ? 'text-blue-400' : showResult.winner === 'BANKER' ? 'text-red-400' : 'text-green-400'}`}>
                   {showResult.winner === 'TIE' ? '和局 TIE' : `${showResult.winner} WINS`}
                 </h3>
                 <p className="text-2xl font-black text-yellow-500 font-mono">+ {showResult.amount.toLocaleString()} PT</p>
                 <button onClick={() => setShowResult(null)} className="px-10 py-3 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">繼續挑戰</button>
              </div>
           </div>
        )}
      </div>

      {/* 投注與控制區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {(['player', 'tie', 'banker'] as const).map(type => (
              <button
                key={type}
                onClick={() => setCurrentBetType(type)}
                className={`relative p-8 rounded-[2.5rem] border-4 transition-all active:scale-95 flex flex-col items-center justify-center gap-3 overflow-hidden ${
                  currentBetType === type ? 'border-green-500 bg-green-50 shadow-lg scale-105' : 'border-slate-50 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <p className={`font-black text-xl tracking-tighter ${type === 'player' ? 'text-blue-500' : type === 'banker' ? 'text-red-500' : 'text-green-600'}`}>
                  {type === 'player' ? '閒 PLAYER' : type === 'banker' ? '莊 BANKER' : '和 TIE'}
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  賠率 {type === 'player' ? '1:1' : type === 'banker' ? '1:0.95' : '1:8'}
                </p>
                {bets[type] > 0 && (
                  <div className="mt-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black shadow-lg">
                    ${bets[type].toLocaleString()}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[100, 500, 1000, 5000].map(amt => (
              <button key={amt} onClick={() => addBet(amt)} className="w-16 h-16 rounded-full bg-slate-900 text-white border-2 border-white/20 font-black text-[10px] hover:bg-green-600 hover:scale-110 active:scale-90 transition-all shadow-xl">
                {amt >= 1000 ? `${amt/1000}K` : amt}
              </button>
            ))}
            <button onClick={clearBet} className="px-8 h-16 rounded-full bg-slate-100 text-slate-400 font-black text-xs hover:text-red-500 transition-colors uppercase tracking-widest">重置</button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col justify-between shadow-2xl border border-white/5">
           <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">目前總下注金額</p>
              <p className="text-4xl font-mono font-black text-white">{(bets.player + bets.banker + bets.tie).toLocaleString()}</p>
           </div>
           <button
             onClick={startGame}
             disabled={isPlaying || (bets.player + bets.banker + bets.tie) === 0}
             className="w-full h-24 bg-green-500 text-black rounded-[2rem] font-black text-2xl shadow-xl hover:bg-green-400 active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-4 uppercase tracking-tighter"
           >
             <Zap size={28}/> DEAL 極速發牌
           </button>
        </div>
      </div>

      {/* 規則彈窗 */}
      {showRules && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
            <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><XCircle size={32}/></button>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <Trophy className="text-green-500"/> 百家樂規則說明
            </h2>
            <div className="space-y-6 text-sm text-slate-600 font-medium">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="font-black text-slate-900 mb-3 uppercase text-xs tracking-widest text-green-600">賠率 (PAYOUTS)</p>
                <ul className="space-y-2">
                  <li className="flex justify-between"><span>閒家 (PLAYER)</span> <span className="font-black text-slate-900">1 : 1</span></li>
                  <li className="flex justify-between"><span>莊家 (BANKER)</span> <span className="font-black text-slate-900">1 : 0.95</span></li>
                  <li className="flex justify-between"><span>和局 (TIE)</span> <span className="font-black text-slate-900">1 : 8</span></li>
                </ul>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                <li>閒/莊點數最接近 <span className="text-green-600 font-bold">9點</span> 者為勝。</li>
                <li>J, Q, K, 10 計算為 <span className="font-bold">0點</span>，A 計算為 <span className="font-bold">1點</span>。</li>
                <li>若結果為「和局」，下注閒/莊之本金將會<span className="text-green-600 font-bold">原額退回</span>。</li>
                <li>所有積分變動即時與 HKER 雲端帳戶同步。</li>
              </ul>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-green-600 transition-all">我明白了</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          from { transform: translateY(-100vh); }
          to { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};

export default BaccaratView;
