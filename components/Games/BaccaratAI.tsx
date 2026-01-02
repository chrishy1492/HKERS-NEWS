
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Coins, Volume2, VolumeX, Info, RotateCw, Play, 
  ArrowLeft, Zap, Shield, TrendingUp, Sparkles, Trophy 
} from 'lucide-react';
import { UserProfile } from '../../types';

// --- 工程師配置: 極速發牌參數 ---
const DEAL_DELAY = 220; // 毫秒，極速體驗
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface BaccaratAIProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

// Fix: explicitly include 'key' in props type to resolve React/TS assignment errors in JSX
const CardView = ({ card, side, index }: { card: any, side: string, index: number, key?: React.Key }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div 
      className={`w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-2 border-slate-200 flex flex-col justify-between p-3 relative animate-in zoom-in slide-in-from-bottom-20 duration-300 transform hover:-translate-y-2 transition-transform`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`text-sm font-black tech-font leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>{card.value}</div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>{card.suit}</div>
      <div className={`text-sm font-black tech-font leading-none self-end rotate-180 ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>{card.value}</div>
    </div>
  );
};

export default function BaccaratAI({ onClose, userProfile, updatePoints, isMuted, setIsMuted }: BaccaratAIProps) {
  const [balance, setBalance] = useState(userProfile?.points || 0);
  const [bets, setBets] = useState<{ player: number, banker: number, tie: number }>({ player: 0, banker: 0, tie: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [bankerHand, setBankerHand] = useState<any[]>([]);
  const [playerPoint, setPlayerPoint] = useState<number | null>(null);
  const [bankerPoint, setBankerPoint] = useState<number | null>(null);
  const [message, setMessage] = useState('初始化系統... 請下注');
  const [showRules, setShowRules] = useState(false);
  const [chipValue, setChipValue] = useState(1000);
  const [winStatus, setWinStatus] = useState<string | null>(null);
  const [aiProbs, setAiProbs] = useState({ p: 45, b: 45 });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'); 
      audioRef.current.loop = true;
      audioRef.current.volume = 0.1;
    }
    if (!isMuted) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [isMuted]);

  useEffect(() => {
    if (userProfile) setBalance(userProfile.points);
  }, [userProfile]);

  useEffect(() => {
    if (!isPlaying) {
      const timer = setInterval(() => {
        const p = 40 + Math.random() * 20;
        setAiProbs({ p: Math.floor(p), b: Math.floor(100 - p - 5) });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isPlaying]);

  const addChip = (side: 'player' | 'banker' | 'tie') => {
    if (isPlaying) return;
    if (balance < chipValue) return alert("系統提示：積分不足");
    setBets(prev => ({ ...prev, [side]: prev[side] + chipValue }));
    updatePoints(-chipValue);
  };

  const clearBets = () => {
    if (isPlaying) return;
    const totalBet = bets.player + bets.banker + bets.tie;
    if (totalBet > 0) {
      updatePoints(totalBet);
      setBets({ player: 0, banker: 0, tie: 0 });
    }
  };

  const getCardValue = (val: string) => {
    if (['10', 'J', 'Q', 'K'].includes(val)) return 0;
    if (val === 'A') return 1;
    return parseInt(val);
  };

  const generateCard = () => ({
    suit: SUITS[Math.floor(Math.random() * 4)],
    value: VALUES[Math.floor(Math.random() * 13)]
  });

  const runGame = async () => {
    const totalBet = bets.player + bets.banker + bets.tie;
    if (totalBet === 0) return;

    setIsPlaying(true);
    setWinStatus(null);
    setPlayerHand([]);
    setBankerHand([]);
    setPlayerPoint(null);
    setBankerPoint(null);
    setMessage('QUANTUM COMPUTING...');

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const p1 = generateCard();
    const b1 = generateCard();
    const p2 = generateCard();
    const b2 = generateCard();

    setPlayerHand([p1]); await sleep(DEAL_DELAY);
    setBankerHand([b1]); await sleep(DEAL_DELAY);
    setPlayerHand([p1, p2]); await sleep(DEAL_DELAY);
    setBankerHand([b1, b2]); await sleep(DEAL_DELAY);

    let pPts = (getCardValue(p1.value) + getCardValue(p2.value)) % 10;
    let bPts = (getCardValue(b1.value) + getCardValue(b2.value)) % 10;

    if (pPts <= 5 && bPts < 8) {
      const p3 = generateCard();
      setPlayerHand([p1, p2, p3]);
      pPts = (pPts + getCardValue(p3.value)) % 10;
      await sleep(DEAL_DELAY);
    }

    if (bPts <= 5 && pPts < 8) {
      const b3 = generateCard();
      setBankerHand([b1, b2, b3]);
      bPts = (bPts + getCardValue(b3.value)) % 10;
      await sleep(DEAL_DELAY);
    }

    setPlayerPoint(pPts);
    setBankerPoint(bPts);
    handleResult(pPts, bPts);
  };

  const handleResult = (p: number, b: number) => {
    let result = '';
    let winAmount = 0;

    if (p > b) {
      result = 'PLAYER';
      winAmount = bets.player * 2;
    } else if (b > p) {
      result = 'BANKER';
      winAmount = bets.banker * 1.95;
    } else {
      result = 'TIE';
      winAmount = bets.tie * 9;
      winAmount += (bets.player + bets.banker);
    }

    if (winAmount > 0) {
      updatePoints(winAmount);
      setWinStatus(result);
      setMessage(`${result === 'TIE' ? '和局' : (result === 'PLAYER' ? '閒家' : '莊家')}大獲全勝`);
    } else {
      setWinStatus('LOSE');
      setMessage('偵測到系統盈餘，請再接再厲');
    }

    setTimeout(() => {
      setIsPlaying(false);
      setBets({ player: 0, banker: 0, tie: 0 });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white noto-font overflow-hidden flex flex-col p-4 select-none">
      {/* 掃描線特效 */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-50 scanline-overlay"></div>
      
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center z-10 mb-4 sm:mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase text-emerald-400 tech-font">Turbo Baccarat AI</h1>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase tech-font">Quantum Engine v2.5</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl">
            {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-emerald-400" />}
          </button>
          <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex flex-col items-end backdrop-blur-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest tech-font">Balance</span>
             <span className="text-xl font-black text-amber-400 tech-font">{balance.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowRules(true)} className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Info size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-6 sm:gap-12 relative z-10">
        
        {/* AI 預測勝率條 */}
        <div className="flex gap-12 sm:gap-20 text-center opacity-80 tech-font">
           <div className="space-y-2">
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI PLAYER PROB</span>
             <div className="w-32 sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${aiProbs.p}%` }}></div>
             </div>
           </div>
           <div className="space-y-2">
             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">AI BANKER PROB</span>
             <div className="w-32 sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <div className="h-full bg-rose-500 transition-all duration-1000 ease-out" style={{ width: `${aiProbs.b}%` }}></div>
             </div>
           </div>
        </div>

        {/* 遊戲桌面區域 */}
        <div className="w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 sm:p-10 rounded-[48px] sm:rounded-[64px] border-2 border-white/10 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent"></div>
          
          <div className="flex justify-around items-start min-h-[160px] sm:min-h-[220px] relative z-10">
            {/* Player Side */}
            <div className="text-center w-5/12 flex flex-col items-center gap-4">
              <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2 tech-font">
                <Shield size={16} /> PLAYER 閒
              </h2>
              <div className="flex -space-x-8 sm:-space-x-12 min-h-[100px] sm:min-h-[144px] items-center">
                {playerHand.length > 0 ? playerHand.map((c, i) => <CardView key={i} card={c} index={i} side="p" />) : <div className="w-16 h-24 sm:w-24 sm:h-36 border-2 border-dashed border-slate-800 rounded-xl opacity-20"></div>}
              </div>
              {playerPoint !== null && (
                <div className="text-4xl sm:text-6xl font-black text-blue-400 tech-font animate-in zoom-in drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{playerPoint}</div>
              )}
            </div>

            {/* VS Divider */}
            <div className="self-center opacity-30">
               <div className="h-20 sm:h-32 w-px bg-gradient-to-b from-transparent via-white to-transparent"></div>
               <div className="tech-font text-[10px] text-white/50 my-2 text-center">VS</div>
               <div className="h-20 sm:h-32 w-px bg-gradient-to-b from-transparent via-white to-transparent"></div>
            </div>

            {/* Banker Side */}
            <div className="text-center w-5/12 flex flex-col items-center gap-4">
              <h2 className="text-xs font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-2 tech-font">
                <Shield size={16} /> BANKER 莊
              </h2>
              <div className="flex -space-x-8 sm:-space-x-12 min-h-[100px] sm:min-h-[144px] items-center">
                {bankerHand.length > 0 ? bankerHand.map((c, i) => <CardView key={i} card={c} index={i} side="b" />) : <div className="w-16 h-24 sm:w-24 sm:h-36 border-2 border-dashed border-slate-800 rounded-xl opacity-20"></div>}
              </div>
              {bankerPoint !== null && (
                <div className="text-4xl sm:text-6xl font-black text-rose-400 tech-font animate-in zoom-in drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">{bankerPoint}</div>
              )}
            </div>
          </div>

          {/* 勝負顯示層 */}
          {winStatus && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xl z-20 animate-in fade-in duration-500 rounded-[48px] sm:rounded-[64px]">
               <div className="text-center space-y-4 p-8">
                 <h3 className={`text-5xl sm:text-8xl font-black italic tracking-tighter uppercase tech-font ${winStatus === 'PLAYER' ? 'text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]' : (winStatus === 'BANKER' ? 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]' : (winStatus === 'TIE' ? 'text-emerald-400' : 'text-slate-500'))}`}>
                   {winStatus === 'TIE' ? 'TIE和局' : `${winStatus} WINS`}
                 </h3>
                 <p className="text-amber-400 font-black text-xl sm:text-2xl uppercase tech-font tracking-widest animate-pulse">
                   {winStatus === 'LOSE' ? 'SYSTEM PROFIT SECURED' : 'CREDITS SYNCED'}
                 </p>
               </div>
            </div>
          )}

          {/* 下注區域 */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full mt-10 relative z-10">
            <button 
              onClick={() => addChip('player')}
              className={`border-2 rounded-[32px] p-6 transition-all duration-300 relative group ${bets.player > 0 ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 hover:border-blue-500/50'}`}
            >
              <p className="text-blue-400 font-black text-lg sm:text-2xl tech-font">PLAYER</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tech-font">PAY 1 : 1</p>
              <div className="mt-4 h-8 flex items-center justify-center">
                {bets.player > 0 && <span className="bg-blue-500 text-white px-4 py-1 rounded-full font-black text-xs sm:text-sm shadow-lg animate-bounce">{(bets.player/1000).toFixed(1)}K</span>}
              </div>
            </button>
            <button 
              onClick={() => addChip('tie')}
              className={`border-2 rounded-[32px] p-6 transition-all duration-300 relative group ${bets.tie > 0 ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 hover:border-emerald-500/50'}`}
            >
              <p className="text-emerald-400 font-black text-lg sm:text-2xl tech-font">TIE 和</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tech-font">PAY 1 : 8</p>
              <div className="mt-4 h-8 flex items-center justify-center">
                {bets.tie > 0 && <span className="bg-emerald-500 text-white px-4 py-1 rounded-full font-black text-xs sm:text-sm shadow-lg animate-bounce">{(bets.tie/1000).toFixed(1)}K</span>}
              </div>
            </button>
            <button 
              onClick={() => addChip('banker')}
              className={`border-2 rounded-[32px] p-6 transition-all duration-300 relative group ${bets.banker > 0 ? 'bg-rose-600/20 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'bg-white/5 border-white/10 hover:border-rose-500/50'}`}
            >
              <p className="text-rose-400 font-black text-lg sm:text-2xl tech-font">BANKER</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tech-font">PAY 1 : 0.95</p>
              <div className="mt-4 h-8 flex items-center justify-center">
                {bets.banker > 0 && <span className="bg-rose-500 text-white px-4 py-1 rounded-full font-black text-xs sm:text-sm shadow-lg animate-bounce">{(bets.banker/1000).toFixed(1)}K</span>}
              </div>
            </button>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 w-full md:w-auto">
            {[100, 500, 1000, 5000, 10000].map(val => (
              <button 
                key={val}
                onClick={() => setChipValue(val)}
                className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full font-black text-[10px] transition-all border-4 shadow-xl ${chipValue === val ? 'bg-emerald-500 border-white text-slate-900 scale-110' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
              >
                {val >= 1000 ? `${val/1000}K` : val}
              </button>
            ))}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={clearBets}
              disabled={isPlaying}
              className="flex-1 md:flex-none px-6 py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 tech-font"
            >
              <RotateCw size={16} /> RESET
            </button>
            <button 
              onClick={runGame}
              disabled={isPlaying || (bets.player + bets.banker + bets.tie) === 0}
              className="flex-[2] md:flex-none px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black text-xl uppercase tracking-tighter shadow-[0_15px_40px_rgba(16,185,129,0.3)] disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-3 tech-font"
            >
              <Play size={24} fill="white" />
              <span>{isPlaying ? 'ENGINE RUNNING' : 'DEAL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 規則彈窗 */}
      {showRules && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-emerald-500/50 w-full max-w-xl rounded-[48px] p-8 sm:p-12 shadow-2xl relative">
            <button onClick={() => setShowRules(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={32} /></button>
            <h2 className="text-3xl font-black italic tracking-tighter mb-8 flex items-center gap-4 text-emerald-400 uppercase tech-font">
              <Zap /> SYSTEM PROTOCOL v2.5
            </h2>
            <div className="space-y-8 text-slate-300 text-sm sm:text-base">
               <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                  <h3 className="font-black text-emerald-400 uppercase tracking-widest text-xs mb-4 tech-font">PAYOUT SCHEME</h3>
                  <div className="space-y-3 font-bold font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>PLAYER 閒</span> <span className="text-white">1 : 1</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>BANKER 莊</span> <span className="text-emerald-400">1 : 0.95</span></div>
                    <div className="flex justify-between"><span>TIE 和局</span> <span className="text-amber-400">1 : 8</span></div>
                  </div>
               </div>
               <div className="space-y-4 font-medium leading-relaxed opacity-80">
                  <p>• 系統取點數個位數為最終結果，最接近 <span className="text-emerald-400 font-bold">9點</span> 者為系統獲勝方。</p>
                  <p>• 10, J, Q, K 等牌值計為 <span className="text-emerald-400 font-bold">0點</span>，A 始終計為 <span className="text-emerald-400 font-bold">1點</span>。</p>
                  <p>• 補牌邏輯遵循國際標準百家樂規則，並由 AI 自動演算。</p>
                  <p>• <span className="text-amber-500 font-bold">加速模式：</span>發牌與結算動畫已全面優化至原速 2 倍。</p>
               </div>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-10 py-5 bg-emerald-600 rounded-[24px] font-black text-lg uppercase tracking-widest text-white shadow-xl tech-font">
              ACKNOWLEDGE & AGREE
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scanline-overlay {
          background: linear-gradient(to bottom, transparent 50%, rgba(16, 185, 129, 0.05) 50%);
          background-size: 100% 4px;
          animation: scanline 10s linear infinite;
        }
        @keyframes scanline {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
        .tech-font { font-family: 'Orbitron', sans-serif; }
      `}</style>
    </div>
  );
}