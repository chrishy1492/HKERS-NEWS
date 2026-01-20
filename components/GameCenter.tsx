import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Dices, Disc, Fish, Volume2, VolumeX, RotateCcw, DollarSign, Cherry, Zap, Grid3x3, Play, Shield, Info, XCircle, BrainCircuit, Gem, Activity, TrendingUp, Cpu, RefreshCw, Aperture } from 'lucide-react';

interface GameCenterProps {
  userProfile: UserProfile;
  updatePoints: (amount: number) => Promise<void>;
}

type GameType = 'slots' | 'roulette' | 'hhh' | 'mary' | 'blackjack' | 'baccarat';

// --- Shared Constants ---
const SYMBOLS_HHH = ['🐟', '🦐', '🦀', '💰', '🏺', '🐓'];
const MARY_TRACK = [
  '🍊', '🔔', '🎰', '🍊', '🍎', '🍎', '🍇', // Top Row (0-6)
  '🍉', '🍎', '🍎', '🍊', '🔔',           // Right Col (7-11)
  '7️⃣', '🍎', '🍎', '🍇', '🎰', '🍎', '🍎', // Bottom Row (12-18)
  '🔔', '🍊', '🍊', '🍎', '🍉'            // Left Col (19-23)
];
const MARY_CONFIG = [
  { name: '🎰', label: 'BAR',  odds: 100, weight: 5 },
  { name: '7️⃣', label: '77',   odds: 40,  weight: 15 },
  { name: '⭐', label: '星星', odds: 30,  weight: 25 }, 
  { name: '🍉', label: '西瓜', odds: 20,  weight: 40 },
  { name: '🔔', label: '鈴鐺', odds: 15,  weight: 60 },
  { name: '🍇', label: '芒果', odds: 10,  weight: 100 }, 
  { name: '🍊', label: '橘子', odds: 5,   weight: 200 },
  { name: '🍎', label: '蘋果', odds: 2,   weight: 485 },
  { name: 'LOST', label: '空白', odds: 0,   weight: 70 }
];
const MARY_BET_OPTIONS = MARY_CONFIG.filter(c => c.name !== 'LOST');
const SLOT_SYMBOLS = [
  { icon: '💎', weight: 5, value: 50 },  // Diamond
  { icon: '🔔', weight: 10, value: 20 }, // Bell
  { icon: '🍉', weight: 20, value: 10 }, // Watermelon
  { icon: '🍒', weight: 30, value: 5 },  // Cherry
  { icon: '🍋', weight: 40, value: 2 }   // Lemon
];
const SLOT_PAYLINES = [
  [[0,0], [0,1], [0,2]], [[1,0], [1,1], [1,2]], [[2,0], [2,1], [2,2]],
  [[0,0], [1,1], [2,2]], [[0,2], [1,1], [2,0]]
];
const BJ_SUITS = ['♠', '♥', '♣', '♦'];
const BJ_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEALER_STAND_ON = 17;
const BJ_ANIMATION_SPEED = 200;
const BAC_SUITS = ['♠', '♥', '♣', '♦'];
const BAC_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROULETTE_RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const GameCenter: React.FC<GameCenterProps> = ({ userProfile, updatePoints }) => {
  const [activeGame, setActiveGame] = useState<GameType>('mary');
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [slotGrid, setSlotGrid] = useState<string[][]>([['💎', '🔔', '🍒'],['🍋', '🍉', '🍋'],['🍒', '💎', '🔔']]);
  const [slotWinningLines, setSlotWinningLines] = useState<number[]>([]);
  const [slotMessage, setSlotMessage] = useState('準備開始');
  const [slotSpinning, setSlotSpinning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rouletteBet, setRouletteBet] = useState<{type: 'NUMBER'|'COLOR'|'PARITY', value: number|string, amount: number} | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteHistory, setRouletteHistory] = useState<number[]>([]);
  const [rouletteMessage, setRouletteMessage] = useState('等待指令 (Waiting)');
  const [rouletteChip, setRouletteChip] = useState(100);
  const [hhhBets, setHhhBets] = useState<Record<string, number>>({});
  const [hhhDice, setHhhDice] = useState(['❓', '❓', '❓']);
  const [hhhRolling, setHhhRolling] = useState(false);
  const [hhhMessage, setHhhMessage] = useState('請下注圖案');
  const [hhhHistory, setHhhHistory] = useState<string[][]>([]);
  const [maryBets, setMaryBets] = useState<Record<string, number>>({});
  const [maryActiveIndex, setMaryActiveIndex] = useState<number>(0); 
  const [maryRunning, setMaryRunning] = useState(false);
  const [maryMessage, setMaryMessage] = useState('準備開始');
  const [maryWinAmount, setMaryWinAmount] = useState(0);
  const [bjDeck, setBjDeck] = useState<any[]>([]);
  const [bjPlayerHand, setBjPlayerHand] = useState<any[]>([]);
  const [bjDealerHand, setBjDealerHand] = useState<any[]>([]);
  const [bjGameState, setBjGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [bjBet, setBjBet] = useState(0);
  const [bjMessage, setBjMessage] = useState('');
  const [bjShowRules, setBjShowRules] = useState(false);
  const [bacGameState, setBacGameState] = useState<'BETTING' | 'DEALING' | 'RESULT'>('BETTING');
  const [bacPlayerHand, setBacPlayerHand] = useState<any[]>([]);
  const [bacBankerHand, setBacBankerHand] = useState<any[]>([]);
  const [bacBet, setBacBet] = useState<{type: 'PLAYER'|'BANKER'|'TIE', amount: number} | null>(null);
  const [bacHistory, setBacHistory] = useState<('P'|'B'|'T')[]>([]);
  const [bacMessage, setBacMessage] = useState('');
  const [bacShowRules, setBacShowRules] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      if (musicEnabled) audioRef.current.play().catch(e => console.log(e));
      else audioRef.current.pause();
    }
  }, [musicEnabled]);

  useEffect(() => {
    if (activeGame !== 'roulette') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let rotation = 0;
    let speed = 0;
    let isDecelerating = false;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const outerRadius = 160;
      const segmentAngle = (2 * Math.PI) / ROULETTE_NUMBERS.length;
      ROULETTE_NUMBERS.forEach((num, i) => {
         const startAngle = (i * segmentAngle) + rotation;
         const endAngle = startAngle + segmentAngle;
         ctx.beginPath();
         ctx.moveTo(centerX, centerY);
         ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
         if (num === 0) ctx.fillStyle = '#10b981';
         else if (ROULETTE_RED.includes(num)) ctx.fillStyle = '#ef4444';
         else ctx.fillStyle = '#1e293b';
         ctx.fill(); ctx.stroke();
         ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(startAngle + segmentAngle / 2);
         ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
         ctx.fillText(num.toString(), outerRadius - 10, 4); ctx.restore();
      });
      ctx.beginPath(); ctx.arc(centerX, centerY, 120, 0, 2 * Math.PI); ctx.fillStyle = '#020617'; ctx.fill();
      ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(centerX, centerY, 115, rotation * -2, rotation * -2 + Math.PI); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 16px monospace'; ctx.fillText('QUANTUM', centerX, centerY - 10); ctx.fillText('CORE', centerX, centerY + 15);
      ctx.beginPath(); ctx.moveTo(centerX, centerY - outerRadius - 10); ctx.lineTo(centerX - 10, centerY - outerRadius - 25); ctx.lineTo(centerX + 10, centerY - outerRadius - 25); ctx.fillStyle = '#eab308'; ctx.fill();
    };
    const animate = () => {
      if (rouletteSpinning) {
         rotation += speed;
         if (isDecelerating) {
            speed *= 0.985;
            if (speed < 0.002) { setRouletteSpinning(false); speed = 0; finalizeRoulette(rotation); }
         }
         render(); animationFrameId = requestAnimationFrame(animate);
      } else { render(); }
    };
    if (rouletteSpinning) { speed = 0.4; isDecelerating = false; setTimeout(() => { isDecelerating = true; }, 1000 + Math.random() * 1000); animate(); } else { render(); }
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeGame, rouletteSpinning]);

  const spinRoulette = async () => {
    if (!rouletteBet) return alert("請先下注");
    if (userProfile.hker_token < rouletteBet.amount) return alert("積分不足");
    await updatePoints(-rouletteBet.amount);
    setRouletteSpinning(true);
    setRouletteMessage('CALCULATING...');
  };
  const finalizeRoulette = (finalRotation: number) => {
     const segmentAngle = (2 * Math.PI) / ROULETTE_NUMBERS.length;
     let normalizedRotation = finalRotation % (2 * Math.PI);
     if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
     let rawIndex = ((1.5 * Math.PI - normalizedRotation) / segmentAngle);
     while (rawIndex < 0) rawIndex += ROULETTE_NUMBERS.length;
     const winningIndex = Math.floor(rawIndex) % ROULETTE_NUMBERS.length;
     const winNum = ROULETTE_NUMBERS[winningIndex];
     setRouletteHistory(prev => [winNum, ...prev].slice(0, 10));
     let won = false; let payout = 0;
     const isRed = ROULETTE_RED.includes(winNum);
     if (rouletteBet?.type === 'NUMBER' && rouletteBet.value === winNum) { won = true; payout = rouletteBet.amount * 36; }
     else if (rouletteBet?.type === 'COLOR' && ((rouletteBet.value === 'RED' && isRed) || (rouletteBet.value === 'BLACK' && !isRed && winNum!==0))) { won = true; payout = rouletteBet.amount * 2; }
     else if (rouletteBet?.type === 'PARITY' && ((rouletteBet.value === 'ODD' && winNum!==0 && winNum%2!==0) || (rouletteBet.value === 'EVEN' && winNum!==0 && winNum%2===0))) { won = true; payout = rouletteBet.amount * 2; }
     if (won) { setRouletteMessage(`RESULT: ${winNum} | WIN! +${payout}`); updatePoints(payout); } else { setRouletteMessage(`RESULT: ${winNum} | LOST`); }
  };

  const createBacDeck = () => { const d=[]; for(let s of BAC_SUITS) for(let v of BAC_VALUES) { let w=parseInt(v); if(['J','Q','K','10'].includes(v)) w=0; if(v==='A') w=1; d.push({suit:s,value:v,weight:w,id:Math.random().toString()}); } return d.sort(()=>Math.random()-0.5); };
  const getBacScore = (h:any[]) => h.reduce((s,c)=>s+c.weight,0)%10;
  const playBacDeal = async () => {
    if(!bacBet || bacBet.amount<=0 || userProfile.hker_token<bacBet.amount) return alert("Check Bet/Points");
    await updatePoints(-bacBet.amount); setBacGameState('DEALING'); setBacMessage('...');
    const d=createBacDeck(); const p=[d.pop(),d.pop()]; const b=[d.pop(),d.pop()];
    setBacPlayerHand(p); setBacBankerHand(b);
    let ps=getBacScore(p); let bs=getBacScore(b);
    if(ps<8 && bs<8) { if(ps<=5) p.push(d.pop()); if(bs<=5) b.push(d.pop()); }
    setBacPlayerHand([...p]); setBacBankerHand([...b]);
    ps=getBacScore(p); bs=getBacScore(b);
    let r:'PLAYER'|'BANKER'|'TIE' = ps>bs?'PLAYER':bs>ps?'BANKER':'TIE';
    let win=0; if(r===bacBet.type) { win = r==='TIE'?bacBet.amount*9 : (r==='BANKER'?Math.floor(bacBet.amount*1.95):bacBet.amount*2); updatePoints(win); setBacMessage(`${r} WIN +${win}`); } else setBacMessage(`${r} WINS`);
    setBacGameState('RESULT');
  };
  const BacCard = ({card,type}:any) => ( <div className={`w-14 h-20 md:w-20 md:h-28 bg-white border rounded shadow flex flex-col items-center justify-center ${['♥','♦'].includes(card.suit)?'text-red-600':'text-black'}`}><span className="text-2xl">{card.suit}</span><span className="font-bold">{card.value}</span></div> );

  const createBjDeck = () => { const d=[]; for(let s of BJ_SUITS) for(let v of BJ_VALUES) { let w=parseInt(v); if(['J','Q','K'].includes(v)) w=10; if(v==='A') w=11; d.push({suit:s,value:v,weight:w}); } return d.sort(()=>Math.random()-0.5); };
  const calcBjScore = (h:any[]) => { let s=0,a=0; h.forEach(c=>{s+=c.weight; if(c.value==='A') a++;}); while(s>21 && a>0) {s-=10;a--;} return s; };
  const playBjDeal = async () => { if(bjBet<=0 || userProfile.hker_token<bjBet) return alert("Check Bet"); await updatePoints(-bjBet); const d=createBjDeck(); const p=[d.pop(),d.pop()]; const dl=[d.pop(),d.pop()]; setBjPlayerHand(p); setBjDealerHand(dl); setBjDeck(d); setBjGameState('PLAYING'); if(calcBjScore(p)===21) handleBjEnd(p,dl,'BJ'); };
  const playBjHit = () => { const d=[...bjDeck]; const p=[...bjPlayerHand,d.pop()]; setBjPlayerHand(p); setBjDeck(d); if(calcBjScore(p)>21) handleBjEnd(p,bjDealerHand,'BUST'); };
  const playBjStand = async () => { let d=[...bjDeck], dl=[...bjDealerHand]; while(calcBjScore(dl)<17) dl.push(d.pop()); setBjDealerHand(dl); handleBjEnd(bjPlayerHand,dl,'COMPARE'); };
  const handleBjEnd = (p:any[], d:any[], r:string) => { setBjGameState('GAME_OVER'); const ps=calcBjScore(p), ds=calcBjScore(d); let w=0;
    if(r!=='BUST' && (ds>21 || ps>ds)) w=bjBet*2; else if(ps===ds && r!=='BJ') w=bjBet; else if(r==='BJ' && ds!==21) w=Math.floor(bjBet*2.5);
    if(w>0) { updatePoints(w); setBjMessage(`WIN +${w}`); } else setBjMessage('LOSE');
  };
  const BjCard = ({card,hidden}:any) => hidden ? <div className="w-16 h-24 bg-blue-900 rounded border border-blue-500"></div> : <div className={`w-16 h-24 bg-white rounded border flex flex-col items-center justify-center ${['♥','♦'].includes(card.suit)?'text-red-600':'text-black'}`}><span className="text-2xl">{card.suit}</span><span>{card.value}</span></div>;

  const playSlot = async () => { if(userProfile.hker_token<500) return alert("Need 500"); await updatePoints(-500); setSlotSpinning(true); setSlotMessage('...'); setTimeout(()=>{ 
    const g=Array(3).fill(0).map(()=>Array(3).fill(0).map(()=>SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)].icon));
    setSlotGrid(g); setSlotSpinning(false);
    let win=0; SLOT_PAYLINES.forEach(l=>{ if(g[l[0][0]][l[0][1]]===g[l[1][0]][l[1][1]] && g[l[1][0]][l[1][1]]===g[l[2][0]][l[2][1]]) win+=1000; });
    if(win>0) {updatePoints(win); setSlotMessage(`WIN +${win}`);} else setSlotMessage('LOST');
  }, 500); };

  const addHhhBet = (s:string) => !hhhRolling && setHhhBets(p=>({...p,[s]:(p[s]||0)+100}));
  const playHhh = async () => { const t=Object.values(hhhBets).reduce((a:number,b:number)=>a+b,0); if(t<=0 || userProfile.hker_token<t) return alert("Check Bet"); await updatePoints(-t); setHhhRolling(true); setTimeout(()=>{
    const r=[0,1,2].map(()=>SYMBOLS_HHH[Math.floor(Math.random()*6)]); setHhhDice(r); setHhhRolling(false);
    let w=0; r.forEach(s=>{ if(hhhBets[s]) w+=hhhBets[s]*2; });
    if(w>0) {updatePoints(w); setHhhMessage(`WIN +${w}`);} else setHhhMessage('LOST');
  }, 1000); };

  const addMaryBet = (s:string) => !maryRunning && setMaryBets(p=>({...p,[s]:(p[s]||0)+10));
  const playMary = async () => { const t=Object.values(maryBets).reduce((a:number,b:number)=>a+b,0); if(t<=0 || userProfile.hker_token<t) return alert("Check Bet"); await updatePoints(-t); setMaryRunning(true); setTimeout(()=>{
    const winIdx=Math.floor(Math.random()*24); setMaryActiveIndex(winIdx); setMaryRunning(false);
    const sym=MARY_TRACK[winIdx]; const cfg=MARY_CONFIG.find(c=>c.name===sym); const w=(maryBets[sym]||0)*(cfg?.odds||0);
    if(w>0) {updatePoints(w); setMaryMessage(`WIN +${w}`);} else setMaryMessage('LOST');
  }, 2000); };
  const renderMaryCell = (i:number) => <div className={`flex items-center justify-center border h-full w-full ${maryActiveIndex===i?'bg-yellow-300':'bg-gray-100'}`}>{MARY_TRACK[i]}</div>;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] max-w-7xl mx-auto p-2 md:p-4 gap-4">
      <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" />
      
      {/* Main Game Area */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-gray-200 h-full">
        <div className="bg-gray-900 text-white p-3 flex justify-between items-center z-10 shrink-0">
           <div className="flex items-center gap-3">
             <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-sm">{userProfile.hker_token.toLocaleString()} PTS</div>
             <button onClick={() => setMusicEnabled(!musicEnabled)} className="p-2 rounded-full bg-gray-700">{musicEnabled?<Volume2 size={16}/>:<VolumeX size={16}/>}</button>
           </div>
           <div className="font-bold">{activeGame.toUpperCase()}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-slate-100 relative">
           {activeGame === 'mary' && (
             <div className="grid grid-cols-7 grid-rows-7 gap-1 w-full max-w-md aspect-square bg-gray-800 p-2 rounded-xl">
               {Array.from({length:7}).map((_,i)=><div key={`t-${i}`} className="col-span-1 row-span-1">{renderMaryCell(i)}</div>)}
               <div className="col-start-7 row-start-2">{renderMaryCell(7)}</div>
               <div className="col-start-7 row-start-3">{renderMaryCell(8)}</div>
               <div className="col-start-7 row-start-4">{renderMaryCell(9)}</div>
               <div className="col-start-7 row-start-5">{renderMaryCell(10)}</div>
               <div className="col-start-7 row-start-6">{renderMaryCell(11)}</div>
               <div className="col-start-7 row-start-7">{renderMaryCell(12)}</div>
               <div className="col-start-6 row-start-7">{renderMaryCell(13)}</div>
               <div className="col-start-5 row-start-7">{renderMaryCell(14)}</div>
               <div className="col-start-4 row-start-7">{renderMaryCell(15)}</div>
               <div className="col-start-3 row-start-7">{renderMaryCell(16)}</div>
               <div className="col-start-2 row-start-7">{renderMaryCell(17)}</div>
               <div className="col-start-1 row-start-7">{renderMaryCell(18)}</div>
               <div className="col-start-1 row-start-6">{renderMaryCell(19)}</div>
               <div className="col-start-1 row-start-5">{renderMaryCell(20)}</div>
               <div className="col-start-1 row-start-4">{renderMaryCell(21)}</div>
               <div className="col-start-1 row-start-3">{renderMaryCell(22)}</div>
               <div className="col-start-1 row-start-2">{renderMaryCell(23)}</div>
               <div className="col-start-2 col-end-7 row-start-2 row-end-7 bg-gray-900 p-2 flex flex-col justify-between">
                  <div className="text-yellow-400 text-center font-bold text-xl">{maryMessage}</div>
                  <div className="grid grid-cols-4 gap-1">{MARY_BET_OPTIONS.map(o=><button key={o.name} onClick={()=>addMaryBet(o.name)} className="bg-gray-700 text-white p-1 rounded flex flex-col items-center"><span className="text-lg">{o.name}</span><span className="text-[9px]">x{o.odds}</span><span className="text-green-400 text-xs">{maryBets[o.name]||0}</span></button>)}</div>
                  <button onClick={playMary} disabled={maryRunning} className="bg-yellow-600 text-white py-2 rounded font-bold w-full">START</button>
               </div>
             </div>
           )}

           {activeGame === 'hhh' && (
             <div className="w-full max-w-md text-center">
                <div className="flex justify-center gap-4 text-6xl mb-6">{hhhDice.map((d,i)=><div key={i} className="bg-white p-4 rounded shadow border">{d}</div>)}</div>
                <div className="text-xl font-bold mb-4">{hhhMessage}</div>
                <div className="grid grid-cols-3 gap-2 mb-4">{SYMBOLS_HHH.map(s=><button key={s} onClick={()=>addHhhBet(s)} className="bg-white p-4 rounded shadow text-4xl hover:bg-gray-50 relative">{s}<span className="absolute top-0 right-0 text-sm bg-yellow-400 px-1 rounded-bl">{hhhBets[s]||0}</span></button>)}</div>
                <button onClick={playHhh} disabled={hhhRolling} className="bg-green-600 text-white py-3 w-full rounded font-bold text-xl">ROLL</button>
             </div>
           )}

           {activeGame === 'slots' && (
             <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-yellow-400 text-center w-full max-w-sm">
                <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-100 p-2 rounded">{slotGrid.map((r,i)=>r.map((s,j)=><div key={`${i}-${j}`} className="aspect-square flex items-center justify-center text-4xl bg-white rounded shadow">{s}</div>))}</div>
                <div className="text-xl font-bold text-red-500 mb-4">{slotMessage}</div>
                <button onClick={playSlot} disabled={slotSpinning} className="bg-yellow-500 text-white py-3 w-full rounded font-bold text-xl">SPIN (500)</button>
             </div>
           )}

           {activeGame === 'roulette' && (
             <div className="flex flex-col items-center w-full h-full bg-slate-900 text-cyan-400 p-2 overflow-y-auto">
               <canvas ref={canvasRef} width={300} height={300} className="mb-4 rounded-full shadow-[0_0_20px_cyan]"></canvas>
               <div className="text-xl font-bold mb-2">{rouletteMessage}</div>
               <div className="grid grid-cols-6 gap-1 mb-2 max-w-md">{ROULETTE_NUMBERS.slice(0,18).map(n=><button key={n} onClick={()=>setRouletteBet({type:'NUMBER',value:n,amount:100})} className={`text-xs border p-1 ${n===0?'text-green-500':ROULETTE_RED.includes(n)?'text-red-500':'text-gray-400'}`}>{n}</button>)}</div>
               <div className="flex gap-2"><button onClick={()=>setRouletteBet({type:'COLOR',value:'RED',amount:100})} className="bg-red-900 text-red-200 px-3 py-1 rounded">RED</button><button onClick={()=>setRouletteBet({type:'COLOR',value:'BLACK',amount:100})} className="bg-gray-800 text-gray-200 px-3 py-1 rounded">BLACK</button><button onClick={spinRoulette} disabled={rouletteSpinning} className="bg-cyan-600 text-white px-6 py-1 rounded font-bold">SPIN</button></div>
             </div>
           )}

           {activeGame === 'blackjack' && (
             <div className="w-full h-full bg-green-900 p-4 flex flex-col justify-between text-white relative rounded-xl">
               <div className="flex justify-center -space-x-4">{bjDealerHand.map((c,i)=><BjCard key={i} card={c} hidden={i===1 && bjGameState==='PLAYING'} />)}</div>
               <div className="text-center font-bold text-xl my-4">{bjMessage || 'BLACKJACK'}</div>
               <div className="flex justify-center -space-x-4">{bjPlayerHand.map((c,i)=><BjCard key={i} card={c} />)}</div>
               <div className="flex justify-center gap-2 mt-4">
                 {bjGameState==='BETTING' ? <><button onClick={()=>setBjBet(p=>p+100)} className="bg-yellow-600 px-4 py-2 rounded">+100</button><button onClick={playBjDeal} className="bg-blue-600 px-4 py-2 rounded">DEAL</button></> : 
                  bjGameState==='PLAYING' ? <><button onClick={playBjHit} className="bg-green-600 px-4 py-2 rounded">HIT</button><button onClick={playBjStand} className="bg-red-600 px-4 py-2 rounded">STAND</button></> :
                  <button onClick={()=>{setBjBet(0);setBjGameState('BETTING');setBjPlayerHand([]);setBjDealerHand([]);}} className="bg-blue-600 px-4 py-2 rounded">AGAIN</button>}
               </div>
             </div>
           )}

           {activeGame === 'baccarat' && (
             <div className="w-full h-full bg-red-900 p-4 flex flex-col items-center justify-between text-white rounded-xl">
               <div className="flex justify-between w-full max-w-md"><div>P: {getBacScore(bacPlayerHand)}</div><div>B: {getBacScore(bacBankerHand)}</div></div>
               <div className="flex gap-8"><div className="flex -space-x-6">{bacPlayerHand.map((c,i)=><BacCard key={i} card={c} />)}</div><div className="flex -space-x-6">{bacBankerHand.map((c,i)=><BacCard key={i} card={c} />)}</div></div>
               <div className="text-2xl font-bold">{bacMessage}</div>
               {bacGameState==='BETTING' ? <div className="flex gap-2"><button onClick={()=>setBacBet({type:'PLAYER',amount:100})} className="bg-blue-600 px-4 py-2 rounded">PLAYER</button><button onClick={()=>setBacBet({type:'BANKER',amount:100})} className="bg-red-600 px-4 py-2 rounded">BANKER</button><button onClick={playBacDeal} disabled={!bacBet} className="bg-green-600 px-4 py-2 rounded">DEAL</button></div> : <button onClick={()=>{setBacGameState('BETTING');setBacBet(null);setBacPlayerHand([]);setBacBankerHand([]);}} className="bg-blue-600 px-4 py-2 rounded">NEXT</button>}
             </div>
           )}
        </div>
      </div>

      {/* Game Selector Sidebar */}
      <div className="bg-white p-2 rounded-3xl shadow-lg w-full md:w-20 flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible no-scrollbar h-20 md:h-full">
         {['mary','hhh','slots','roulette','blackjack','baccarat'].map(g => (
           <button key={g} onClick={()=>setActiveGame(g as GameType)} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition ${activeGame===g?'bg-purple-100 text-purple-700':'text-gray-400'}`}>
             {g==='mary'?<Cherry/>:g==='hhh'?<Fish/>:g==='slots'?<Grid3x3/>:g==='roulette'?<Disc/>:g==='blackjack'?<Zap/>:<Gem/>}
             <span className="text-[9px] font-bold uppercase">{g.substring(0,3)}</span>
           </button>
         ))}
      </div>
    </div>
  );
};

export default GameCenter;