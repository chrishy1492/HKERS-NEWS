
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Volume2, VolumeX, Info, Play, ArrowLeft, 
  Zap, Shield, Trophy, Cpu, History, RotateCcw
} from 'lucide-react';
import { UserProfile } from '../../types';

// --- 工程師配置: 極速發牌參數 ---
const DEAL_DELAY = 200; // 200ms 極速發牌
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface BaccaratAIProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

// 科技感卡牌組件
const CardView = ({ card, side, index }: { card: any, side: string, index: number, key?: React.Key }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div 
      className={`
        w-16 h-24 sm:w-24 sm:h-36 bg-slate-100 rounded-xl 
        shadow-[0_0_20px_rgba(0,255,128,0.15)] border-2 border-slate-300 
        flex flex-col justify-between p-2 sm:p-3 relative 
        animate-in zoom-in slide-in-from-bottom-10 duration-300 transform hover:-translate-y-1 transition-transform
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* 科技紋路背景 */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-lg pointer-events-none"></div>
      
      <div className={`text-base sm:text-xl font-black tech-font leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.value}</div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</div>
      <div className={`text-base sm:text-xl font-black tech-font leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.value}</div>
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
  const [message, setMessage] = useState('SYSTEM READY // WAITING FOR BETS');
  const [showRules, setShowRules] = useState(false);
  const [chipValue, setChipValue] = useState(1000);
  const [winStatus, setWinStatus] = useState<string | null>(null);
  const [aiProbs, setAiProbs] = useState({ p: 45, b: 45, t: 10 });
  const [history, setHistory] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化音效
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

  // 同步積分
  useEffect(() => {
    if (userProfile) setBalance(userProfile.points);
  }, [userProfile]);

  // AI 概率波動模擬
  useEffect(() => {
    if (!isPlaying) {
      const timer = setInterval(() => {
        const p = 42 + Math.random() * 6; // 42-48%
        const b = 42 + Math.random() * 6; // 42-48%
        const t = 100 - p - b;
        setAiProbs({ p, b, t });
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isPlaying]);

  const addChip = (side: 'player' | 'banker' | 'tie') => {
    if (isPlaying) return;
    if (balance < chipValue) return alert("系統提示：積分不足 / INSUFFICIENT FUNDS");
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
    value: VALUES[Math.floor(Math.random() * 13)],
    id: Math.random().toString(36).substr(2, 9)
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
    setMessage('AI COMPUTING RESULTS...');

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 生成卡牌
    const p1 = generateCard();
    const b1 = generateCard();
    const p2 = generateCard();
    const b2 = generateCard();

    // 發牌動畫序列
    setPlayerHand([p1]); await sleep(DEAL_DELAY);
    setBankerHand([b1]); await sleep(DEAL_DELAY);
    setPlayerHand([p1, p2]); await sleep(DEAL_DELAY);
    setBankerHand([b1, b2]); await sleep(DEAL_DELAY);

    let pPts = (getCardValue(p1.value) + getCardValue(p2.value)) % 10;
    let bPts = (getCardValue(b1.value) + getCardValue(b2.value)) % 10;

    // 簡易補牌規則 (Simplified Rules for Speed)
    // 閒家小於6點補牌
    if (pPts <= 5 && bPts < 8) {
      const p3 = generateCard();
      setPlayerHand([p1, p2, p3]);
      pPts = (pPts + getCardValue(p3.value)) % 10;
      await sleep(DEAL_DELAY);
    }

    // 莊家小於6點且閒家小於8點補牌
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
      winAmount += (bets.player + bets.banker); // 和局退還本金
    }

    if (winAmount > 0) {
      updatePoints(winAmount);
      setWinStatus(result);
      setMessage(`${result === 'TIE' ? 'TIE 和局' : (result === 'PLAYER' ? 'PLAYER 閒家勝' : 'BANKER 莊家勝')}`);
    } else {
      setWinStatus('LOSE');
      setMessage('SYSTEM WINS // 系統獲勝');
    }

    // 更新歷史記錄
    setHistory(prev => [result.charAt(0), ...prev].slice(0, 10));

    setTimeout(() => {
      setIsPlaying(false);
      setBets({ player: 0, banker: 0, tie: 0 });
      setMessage('PLACE YOUR BETS // 請下注');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white font-sans overflow-hidden flex flex-col p-4 select-none">
      {/* 掃描線特效 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      
      {/* 頂部導航 */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center z-10 mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase text-emerald-400 tech-font flex items-center gap-2">
              <Cpu size={24} className="animate-pulse" /> AI Turbo Baccarat
            </h1>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase tech-font">Protocol v2.5 // Extreme Speed</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl">
            {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-emerald-400" />}
          </button>
          <div className="bg-slate-900 border border-emerald-500/30 px-6 py-2 rounded-2xl flex flex-col items-end shadow-[0_0_15px_rgba(16,185,129,0.2)]">
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest tech-font">Balance</span>
             <span className="text-xl font-black text-white tech-font">{balance.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowRules(true)} className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Info size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-6 relative z-10">
        
        {/* AI 預測勝率條 */}
        <div className="w-full flex justify-between items-center gap-4 px-4 sm:px-12 opacity-90 tech-font">
           <div className="w-full">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
               <span className="text-blue-400">AI Player Prob</span>
               <span className="text-blue-400">{aiProbs.p.toFixed(1)}%</span>
             </div>
             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${aiProbs.p}%` }}></div>
             </div>
           </div>
           
           <div className="shrink-0 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-500">TIE</span>
              <span className="text-xs font-black text-amber-500">{aiProbs.t.toFixed(1)}%</span>
           </div>

           <div className="w-full">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
               <span className="text-red-400">{aiProbs.b.toFixed(1)}%</span>
               <span className="text-red-400">AI Banker Prob</span>
             </div>
             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex justify-end">
                <div className="h-full bg-red-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${aiProbs.b}%` }}></div>
             </div>
           </div>
        </div>

        {/* 遊戲桌面區域 */}
        <div className="w-full bg-[#0a0f0d] p-6 sm:p-8 rounded-[48px] border-2 border-emerald-900/50 shadow-[0_0_60px_rgba(16,185,129,0.05)] relative overflow-hidden">
          {/* 中心裝飾 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-around items-start min-h-[180px] sm:min-h-[240px] relative z-10">
            {/* Player Side */}
            <div className="text-center w-5/12 flex flex-col items-center gap-4">
              <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2 tech-font bg-blue-950/30 px-4 py-1 rounded-full border border-blue-500/20">
                <Shield size={14} /> PLAYER 閒
              </h2>
              <div className="flex -space-x-4 sm:-space-x-6 min-h-[100px] sm:min-h-[144px] items-center justify-center">
                {playerHand.length > 0 ? playerHand.map((c, i) => <CardView key={c.id} card={c} index={i} side="p" />) : <div className="w-16 h-24 sm:w-24 sm:h-36 border-2 border-dashed border-slate-800 rounded-xl opacity-20 flex items-center justify-center"><span className="text-xs text-slate-700 font-bold">EMPTY</span></div>}
              </div>
              <div className={`text-4xl sm:text-6xl font-black tech-font transition-all duration-300 ${playerPoint !== null ? 'text-blue-400 scale-100 opacity-100 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'scale-50 opacity-0'}`}>
                {playerPoint}
              </div>
            </div>

            {/* VS Divider */}
            <div className="self-center flex flex-col items-center gap-2 opacity-40">
               <div className="h-16 w-0.5 bg-gradient-to-b from-transparent via-emerald-500 to-transparent"></div>
               <div className="tech-font text-xs font-black text-emerald-500">VS</div>
               <div className="h-16 w-0.5 bg-gradient-to-b from-transparent via-emerald-500 to-transparent"></div>
            </div>

            {/* Banker Side */}
            <div className="text-center w-5/12 flex flex-col items-center gap-4">
              <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-2 tech-font bg-red-950/30 px-4 py-1 rounded-full border border-red-500/20">
                <Shield size={14} /> BANKER 莊
              </h2>
              <div className="flex -space-x-4 sm:-space-x-6 min-h-[100px] sm:min-h-[144px] items-center justify-center">
                {bankerHand.length > 0 ? bankerHand.map((c, i) => <CardView key={c.id} card={c} index={i} side="b" />) : <div className="w-16 h-24 sm:w-24 sm:h-36 border-2 border-dashed border-slate-800 rounded-xl opacity-20 flex items-center justify-center"><span className="text-xs text-slate-700 font-bold">EMPTY</span></div>}
              </div>
              <div className={`text-4xl sm:text-6xl font-black tech-font transition-all duration-300 ${bankerPoint !== null ? 'text-red-400 scale-100 opacity-100 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'scale-50 opacity-0'}`}>
                {bankerPoint}
              </div>
            </div>
          </div>

          {/* 勝負顯示層 */}
          {winStatus && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20 animate-in fade-in zoom-in duration-300">
               <div className="text-center space-y-2 p-8 border-y-2 border-emerald-500/50 bg-emerald-900/10 w-full">
                 <h3 className={`text-6xl sm:text-8xl font-black italic tracking-tighter uppercase tech-font ${winStatus === 'PLAYER' ? 'text-blue-500' : (winStatus === 'BANKER' ? 'text-red-500' : (winStatus === 'TIE' ? 'text-amber-400' : 'text-slate-500'))}`}>
                   {winStatus === 'TIE' ? 'TIE' : `${winStatus}`}
                 </h3>
                 <p className="text-white font-bold text-xl uppercase tech-font tracking-[0.5em]">
                   {winStatus === 'TIE' ? '和局返還' : 'WINS 勝出'}
                 </p>
                 {winStatus !== 'LOSE' && <p className="text-amber-400 font-mono text-lg mt-2">+ CREDITS</p>}
               </div>
            </div>
          )}

          {/* 歷史記錄條 */}
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-1 opacity-60">
             {history.map((res, i) => (
               <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${res === 'P' ? 'bg-blue-600 text-white' : res === 'B' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'}`}>
                 {res}
               </div>
             ))}
          </div>
        </div>

        {/* 狀態訊息 */}
        <div className={`text-center font-black text-sm uppercase tracking-[0.2em] tech-font transition-colors ${winStatus === 'LOSE' ? 'text-slate-500' : 'text-emerald-400 animate-pulse'}`}>
           {message}
        </div>

        {/* 下注區域 */}
        <div className="w-full max-w-4xl grid grid-cols-3 gap-4 sm:gap-8 px-2 relative z-10">
          <button 
            onClick={() => addChip('player')}
            className={`
              relative h-28 sm:h-36 rounded-3xl border-2 transition-all duration-200 group overflow-hidden
              ${bets.player > 0 ? 'bg-blue-900/30 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50'}
            `}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-blue-500 font-black text-2xl sm:text-4xl tech-font group-hover:scale-110 transition-transform">PLAYER</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">1 : 1</span>
            </div>
            {bets.player > 0 && <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full font-black text-xs shadow-lg animate-in zoom-in">{(bets.player/1000).toFixed(1)}K</div>}
          </button>

          <button 
            onClick={() => addChip('tie')}
            className={`
              relative h-28 sm:h-36 rounded-3xl border-2 transition-all duration-200 group overflow-hidden
              ${bets.tie > 0 ? 'bg-amber-900/30 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'bg-slate-900/50 border-slate-800 hover:border-amber-500/50'}
            `}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-amber-500 font-black text-2xl sm:text-4xl tech-font group-hover:scale-110 transition-transform">TIE</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">1 : 8</span>
            </div>
            {bets.tie > 0 && <div className="absolute top-2 right-2 bg-amber-500 text-black px-3 py-1 rounded-full font-black text-xs shadow-lg animate-in zoom-in">{(bets.tie/1000).toFixed(1)}K</div>}
          </button>

          <button 
            onClick={() => addChip('banker')}
            className={`
              relative h-28 sm:h-36 rounded-3xl border-2 transition-all duration-200 group overflow-hidden
              ${bets.banker > 0 ? 'bg-red-900/30 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-slate-900/50 border-slate-800 hover:border-red-500/50'}
            `}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-red-500 font-black text-2xl sm:text-4xl tech-font group-hover:scale-110 transition-transform">BANKER</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">1 : 0.95</span>
            </div>
            {bets.banker > 0 && <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full font-black text-xs shadow-lg animate-in zoom-in">{(bets.banker/1000).toFixed(1)}K</div>}
          </button>
        </div>

        {/* 底部控制 */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 w-full md:w-auto justify-center">
            {[100, 1000, 5000, 10000].map(val => (
              <button 
                key={val}
                onClick={() => setChipValue(val)}
                className={`
                  flex-shrink-0 w-14 h-14 rounded-full font-black text-[10px] transition-all border-2 
                  ${chipValue === val ? 'bg-emerald-500 border-white text-black scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-emerald-500/50'}
                `}
              >
                {val >= 1000 ? `${val/1000}K` : val}
              </button>
            ))}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={clearBets}
              disabled={isPlaying}
              className="flex-1 md:flex-none px-8 py-5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 tech-font"
            >
              <RotateCcw size={16} /> RESET
            </button>
            <button 
              onClick={runGame}
              disabled={isPlaying || (bets.player + bets.banker + bets.tie) === 0}
              className="flex-[2] md:flex-none px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-black text-xl uppercase tracking-tighter shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-3 tech-font"
            >
              <Zap size={24} fill="white" />
              <span>{isPlaying ? 'RUNNING...' : 'TURBO DEAL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 規則彈窗 */}
      {showRules && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-lg rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={28} /></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Info /></div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tech-font text-white">System Protocol</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Baccarat Rules v2.5</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
               <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h3 className="font-black text-emerald-400 uppercase tracking-widest text-xs mb-3 tech-font">賠率表 / ODDS</h3>
                  <div className="space-y-2 font-bold font-mono">
                    <div className="flex justify-between"><span>PLAYER (閒)</span> <span className="text-white">1 : 1</span></div>
                    <div className="flex justify-between"><span>BANKER (莊)</span> <span className="text-emerald-400">1 : 0.95</span></div>
                    <div className="flex justify-between"><span>TIE (和)</span> <span className="text-amber-400">1 : 8</span></div>
                  </div>
               </div>
               
               <div className="space-y-3 font-medium leading-relaxed opacity-80 text-xs">
                  <p>• 點數計算：A=1, 2-9=點數, 10/J/Q/K=0。總和取個位數。</p>
                  <p>• 補牌規則：閒小於6點補牌；莊依據閒家補牌結果決定是否補牌 (AI 自動演算)。</p>
                  <p>• <span className="text-emerald-400 font-bold">極速模式：</span>動畫速度提升 200%，請留意下注時間。</p>
               </div>
            </div>

            <button onClick={() => setShowRules(false)} className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-sm uppercase tracking-widest text-white shadow-lg tech-font transition-all">
              I Understand / 我明白了
            </button>
          </div>
        </div>
      )}

      <style>{`
        .tech-font { font-family: 'Orbitron', sans-serif; }
      `}</style>
    </div>
  );
}
