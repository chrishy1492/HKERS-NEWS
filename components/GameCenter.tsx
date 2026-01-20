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
const SYMBOL_NAMES_HHH = { '🐟': '魚', '🦐': '蝦', '🦀': '蟹', '💰': '金錢', '🏺': '葫蘆', '🐓': '雞' };

// --- Little Mary Constants ---
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

// --- Pro Slots Constants (3x3) ---
const SLOT_SYMBOLS = [
  { icon: '💎', weight: 5, value: 50 },  // Diamond
  { icon: '🔔', weight: 10, value: 20 }, // Bell
  { icon: '🍉', weight: 20, value: 10 }, // Watermelon
  { icon: '🍒', weight: 30, value: 5 },  // Cherry
  { icon: '🍋', weight: 40, value: 2 }   // Lemon
];

// Paylines (Row, Col)
const SLOT_PAYLINES = [
  [[0,0], [0,1], [0,2]], // Top Row
  [[1,0], [1,1], [1,2]], // Middle Row
  [[2,0], [2,1], [2,2]], // Bottom Row
  [[0,0], [1,1], [2,2]], // Diagonal TL-BR
  [[0,2], [1,1], [2,0]]  // Diagonal TR-BL
];

// --- Blackjack Constants ---
const BJ_SUITS = ['♠', '♥', '♣', '♦'];
const BJ_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEALER_STAND_ON = 17;
const BJ_ANIMATION_SPEED = 200; // Hyper fast

// --- Baccarat Constants ---
const BAC_SUITS = ['♠', '♥', '♣', '♦'];
const BAC_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// --- Roulette Constants ---
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROULETTE_RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const GameCenter: React.FC<GameCenterProps> = ({ userProfile, updatePoints }) => {
  const [activeGame, setActiveGame] = useState<GameType>('mary');
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Slots State ---
  const [slotGrid, setSlotGrid] = useState<string[][]>([
    ['💎', '🔔', '🍒'],
    ['🍋', '🍉', '🍋'],
    ['🍒', '💎', '🔔']
  ]);
  const [slotWinningLines, setSlotWinningLines] = useState<number[]>([]);
  const [slotMessage, setSlotMessage] = useState('準備開始');
  const [slotSpinning, setSlotSpinning] = useState(false);

  // --- Roulette State (Quantum) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rouletteBet, setRouletteBet] = useState<{type: 'NUMBER'|'COLOR'|'PARITY', value: number|string, amount: number} | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteHistory, setRouletteHistory] = useState<number[]>([]);
  const [rouletteMessage, setRouletteMessage] = useState('等待指令 (Waiting)');
  const [rouletteChip, setRouletteChip] = useState(100);

  // --- Hoo Hey How State ---
  const [hhhBets, setHhhBets] = useState<Record<string, number>>({});
  const [hhhDice, setHhhDice] = useState(['❓', '❓', '❓']);
  const [hhhRolling, setHhhRolling] = useState(false);
  const [hhhMessage, setHhhMessage] = useState('請下注圖案');
  const [hhhHistory, setHhhHistory] = useState<string[][]>([]);

  // --- Little Mary State ---
  const [maryBets, setMaryBets] = useState<Record<string, number>>({});
  const [maryActiveIndex, setMaryActiveIndex] = useState<number>(0); 
  const [maryRunning, setMaryRunning] = useState(false);
  const [maryMessage, setMaryMessage] = useState('準備開始');
  const [maryWinAmount, setMaryWinAmount] = useState(0);

  // --- Blackjack State ---
  const [bjDeck, setBjDeck] = useState<any[]>([]);
  const [bjPlayerHand, setBjPlayerHand] = useState<any[]>([]);
  const [bjDealerHand, setBjDealerHand] = useState<any[]>([]);
  const [bjGameState, setBjGameState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [bjBet, setBjBet] = useState(0);
  const [bjMessage, setBjMessage] = useState('');
  const [bjShowRules, setBjShowRules] = useState(false);

  // --- Baccarat State ---
  const [bacGameState, setBacGameState] = useState<'BETTING' | 'DEALING' | 'RESULT'>('BETTING');
  const [bacPlayerHand, setBacPlayerHand] = useState<any[]>([]);
  const [bacBankerHand, setBacBankerHand] = useState<any[]>([]);
  const [bacBet, setBacBet] = useState<{type: 'PLAYER'|'BANKER'|'TIE', amount: number} | null>(null);
  const [bacHistory, setBacHistory] = useState<('P'|'B'|'T')[]>([]); // Roadmap
  const [bacMessage, setBacMessage] = useState('');
  const [bacShowRules, setBacShowRules] = useState(false);


  // Music Logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      if (musicEnabled) {
        audioRef.current.play().catch(e => console.log(e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [musicEnabled]);

  // --- Roulette Logic (Canvas Animation) ---
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
    
    // Draw Function
    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const outerRadius = 160;
      const innerRadius = 120;
      
      // Draw Wheel Segments
      const segmentAngle = (2 * Math.PI) / ROULETTE_NUMBERS.length;
      
      ROULETTE_NUMBERS.forEach((num, i) => {
         const startAngle = (i * segmentAngle) + rotation;
         const endAngle = startAngle + segmentAngle;
         
         ctx.beginPath();
         ctx.moveTo(centerX, centerY);
         ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
         
         if (num === 0) ctx.fillStyle = '#10b981'; // Green
         else if (ROULETTE_RED.includes(num)) ctx.fillStyle = '#ef4444'; // Red
         else ctx.fillStyle = '#1e293b'; // Black (Slate-800)
         
         ctx.fill();
         ctx.stroke(); // Divider

         // Numbers
         ctx.save();
         ctx.translate(centerX, centerY);
         ctx.rotate(startAngle + segmentAngle / 2);
         ctx.textAlign = 'right';
         ctx.fillStyle = '#fff';
         ctx.font = 'bold 12px monospace';
         ctx.fillText(num.toString(), outerRadius - 10, 4);
         ctx.restore();
      });

      // Inner Core (Quantum Engine Look)
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#020617'; // Slate-950
      ctx.fill();
      
      // Rotating Glow
      ctx.strokeStyle = '#06b6d4'; // Cyan
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius - 5, rotation * -2, rotation * -2 + Math.PI);
      ctx.stroke();

      // Center Text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('QUANTUM', centerX, centerY - 10);
      ctx.fillText('CORE', centerX, centerY + 15);

      // Pointer (Static)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - outerRadius - 10);
      ctx.lineTo(centerX - 10, centerY - outerRadius - 25);
      ctx.lineTo(centerX + 10, centerY - outerRadius - 25);
      ctx.fillStyle = '#eab308'; // Yellow
      ctx.fill();

      // Ball (White Particle)
      // For simplicity in this React render loop, we rotate the wheel against a static pointer logic visually, 
      // but physically we often rotate a ball. Here we rotate the wheel.
    };

    // Animation Loop
    const animate = () => {
      if (rouletteSpinning) {
         rotation += speed;
         if (isDecelerating) {
            speed *= 0.985; // Deceleration friction
            if (speed < 0.002) {
               setRouletteSpinning(false);
               speed = 0;
               finalizeRoulette(rotation);
            }
         }
         render();
         animationFrameId = requestAnimationFrame(animate);
      } else {
         render();
      }
    };

    if (rouletteSpinning) {
      speed = 0.4; // Initial high speed (Turbo)
      isDecelerating = false;
      // Start deceleration after random time (1-2s for Turbo feel)
      setTimeout(() => { isDecelerating = true; }, 1000 + Math.random() * 1000);
      animate();
    } else {
      render(); // Static render
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [activeGame, rouletteSpinning]);

  const spinRoulette = async () => {
    if (!rouletteBet) return alert("請先下注 (Place Bet)");
    if (userProfile.hker_token < rouletteBet.amount) return alert("積分不足");
    
    await updatePoints(-rouletteBet.amount);
    setRouletteSpinning(true);
    setRouletteMessage('CALCULATING TRAJECTORY...');
  };

  const finalizeRoulette = (finalRotation: number) => {
     // Calculate winning number based on rotation
     // Pointer is at 12 o'clock (-PI/2). Wheel rotated clockwise.
     // We need to find which segment is at -PI/2.
     const segmentAngle = (2 * Math.PI) / ROULETTE_NUMBERS.length;
     
     // Normalize rotation
     let normalizedRotation = finalRotation % (2 * Math.PI);
     if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
     
     // The wheel creates an offset. 
     // Pointer index = TotalSegments - (Rotation / SegmentAngle)
     let index = Math.floor(((2 * Math.PI) - normalizedRotation) / segmentAngle) % ROULETTE_NUMBERS.length;
     // Adjust for index 0 alignment if needed, but 0 index is usually at angle 0 in drawing.
     // Let's refine: drawing starts 0 at 3 o'clock. Pointer is at 12 o'clock (270 deg / -90 deg).
     // 12 o'clock is 3/4 circle away from 3 o'clock counter-clockwise.
     const pointerOffset = Math.floor((Math.PI * 1.5) / segmentAngle); // Offset to top
     let winningIndex = (ROULETTE_NUMBERS.length - index + pointerOffset) % ROULETTE_NUMBERS.length;
     
     // Fix logic: simplest way is random number generation "backend" style, then rotate wheel to match. 
     // But since we did physics first, we map physics to number.
     // Let's use a simpler mapping approximation for visual sync:
     // Just pick a random winner for logic, and "snap" the wheel visually? 
     // No, the engineer way is to read the physics.
     // Let's assume the calculation above is rough. 
     // For this React demo, let's use the visual calculation:
     // Angle 0 (East) is index 0. Top (North) is index X.
     // Rotation moves Angle 0 clockwise.
     // We need the index where: (IndexAngle + Rotation) % 2PI approx equals 3PI/2 (North).
     // (i * seg + rot) = 1.5PI
     // i * seg = 1.5PI - rot
     // i = (1.5PI - rot) / seg
     
     let rawIndex = ((1.5 * Math.PI - normalizedRotation) / segmentAngle);
     // Normalize rawIndex to 0-36 range
     while (rawIndex < 0) rawIndex += ROULETTE_NUMBERS.length;
     winningIndex = Math.floor(rawIndex) % ROULETTE_NUMBERS.length;
     
     const winNum = ROULETTE_NUMBERS[winningIndex];
     setRouletteHistory(prev => [winNum, ...prev].slice(0, 10));

     // Check Win
     let won = false;
     let payout = 0;
     const isRed = ROULETTE_RED.includes(winNum);
     const isBlack = !isRed && winNum !== 0;
     const isOdd = winNum !== 0 && winNum % 2 !== 0;
     const isEven = winNum !== 0 && winNum % 2 === 0;

     if (rouletteBet?.type === 'NUMBER' && rouletteBet.value === winNum) {
        won = true;
        payout = rouletteBet.amount * 36; // 35:1 + stake
     } else if (rouletteBet?.type === 'COLOR') {
        if (rouletteBet.value === 'RED' && isRed) won = true;
        if (rouletteBet.value === 'BLACK' && isBlack) won = true;
        if (won) payout = rouletteBet.amount * 2;
     } else if (rouletteBet?.type === 'PARITY') {
        if (rouletteBet.value === 'ODD' && isOdd) won = true;
        if (rouletteBet.value === 'EVEN' && isEven) won = true;
        if (won) payout = rouletteBet.amount * 2;
     }

     if (won) {
        setRouletteMessage(`RESULT: ${winNum} | WIN! +${payout}`);
        updatePoints(payout);
     } else {
        setRouletteMessage(`RESULT: ${winNum} | SYSTEM WINS`);
     }
  };


  // --- Baccarat Logic ---
  const createBacDeck = () => {
    const deck = [];
    for (let suit of BAC_SUITS) {
      for (let value of BAC_VALUES) {
        let weight = parseInt(value);
        if (['J', 'Q', 'K', '10'].includes(value)) weight = 0;
        if (value === 'A') weight = 1;
        deck.push({ suit, value, weight, id: Math.random().toString(36).substr(2, 9) });
      }
    }
    // Simple shuffle
    return deck.sort(() => Math.random() - 0.5);
  };

  const getBacScore = (hand: any[]) => {
    const total = hand.reduce((sum, card) => sum + card.weight, 0);
    return total % 10;
  };

  const playBacDeal = async () => {
    if (!bacBet || bacBet.amount <= 0) return alert("請先下注 (Place Bet)");
    if (userProfile.hker_token < bacBet.amount) return alert("積分不足");

    // Deduct immediately
    await updatePoints(-bacBet.amount);
    setBacGameState('DEALING');
    setBacMessage('AI Computing...');
    setBacPlayerHand([]);
    setBacBankerHand([]);

    const deck = createBacDeck();
    const pHand = [deck.pop(), deck.pop()];
    const bHand = [deck.pop(), deck.pop()];

    // Turbo Animation
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    // Initial Deal
    setBacPlayerHand([pHand[0]]); await sleep(200);
    setBacBankerHand([bHand[0]]); await sleep(200);
    setBacPlayerHand([pHand[0], pHand[1]]); await sleep(200);
    setBacBankerHand([bHand[0], bHand[1]]); await sleep(200);

    let pScore = getBacScore(pHand);
    let bScore = getBacScore(bHand);

    // Third Card Rules (Complex)
    let pThird = null;
    
    // Natural Win Check (8 or 9)
    if (pScore < 8 && bScore < 8) {
       // Player Draws? (0-5)
       if (pScore <= 5) {
          pThird = deck.pop();
          pHand.push(pThird);
          setBacPlayerHand([...pHand]);
          await sleep(200);
          pScore = getBacScore(pHand);
       }

       // Banker Draws?
       let bankerDraws = false;
       if (bScore <= 2) bankerDraws = true;
       else if (bScore === 3 && (!pThird || pThird.weight !== 8)) bankerDraws = true;
       else if (bScore === 4 && (!pThird || [2,3,4,5,6,7].includes(pThird.weight))) bankerDraws = true;
       else if (bScore === 5 && (!pThird || [4,5,6,7].includes(pThird.weight))) bankerDraws = true;
       else if (bScore === 6 && (pThird && [6,7].includes(pThird.weight))) bankerDraws = true;

       if (bankerDraws) {
          const bThird = deck.pop();
          bHand.push(bThird);
          setBacBankerHand([...bHand]);
          await sleep(200);
          bScore = getBacScore(bHand);
       }
    }

    // Determine Winner
    let result: 'PLAYER' | 'BANKER' | 'TIE' = 'TIE';
    if (pScore > bScore) result = 'PLAYER';
    else if (bScore > pScore) result = 'BANKER';

    // Update History
    setBacHistory(prev => [...prev, result === 'PLAYER' ? 'P' : result === 'BANKER' ? 'B' : 'T'].slice(-18));

    // Calculate Payout
    let winAmount = 0;
    if (result === bacBet.type) {
       if (result === 'PLAYER') winAmount = bacBet.amount * 2;
       if (result === 'TIE') winAmount = bacBet.amount * 9; // 1:8 odds means you get back 9x
       if (result === 'BANKER') winAmount = Math.floor(bacBet.amount * 1.95); // 5% commission
       setBacMessage(`${result} WIN! +${winAmount}`);
       updatePoints(winAmount);
    } else {
       setBacMessage(`${result} WINS (YOU LOST)`);
    }

    setBacGameState('RESULT');
  };

  const BacCard = ({ card, type }: any) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className={`w-14 h-20 md:w-20 md:h-28 bg-gradient-to-br from-gray-100 to-gray-300 rounded-lg shadow-2xl flex flex-col justify-between p-2 border border-gray-400 transform transition-all animate-fade-in ${type === 'P' ? 'hover:-translate-y-1' : 'hover:translate-y-1'}`}>
         <span className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.value}</span>
         <span className={`text-2xl md:text-4xl text-center ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</span>
         <span className={`text-sm font-bold text-right transform rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.value}</span>
      </div>
    );
  };


  // --- Blackjack Logic ---
  const createBjDeck = () => {
    const deck = [];
    for (let suit of BJ_SUITS) {
      for (let value of BJ_VALUES) {
        let weight = parseInt(value);
        if (['J', 'Q', 'K'].includes(value)) weight = 10;
        if (value === 'A') weight = 11;
        deck.push({ suit, value, weight, id: Math.random().toString(36).substr(2, 9) });
      }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const calcBjScore = (hand: any[]) => {
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

  const playBjDeal = async () => {
    if (bjBet <= 0) return alert("請先下注 (Please Bet First)");
    if (userProfile.hker_token < bjBet) return alert("積分不足 (Insufficient Funds)");
    
    // Deduct points immediately
    await updatePoints(-bjBet);

    let currentDeck = [...bjDeck];
    if (currentDeck.length < 10) currentDeck = createBjDeck();

    const pHand = [currentDeck.pop(), currentDeck.pop()];
    const dHand = [currentDeck.pop(), currentDeck.pop()];

    setBjPlayerHand(pHand);
    setBjDealerHand(dHand);
    setBjDeck(currentDeck);
    setBjGameState('PLAYING');
    setBjMessage('');

    // Check Natural Blackjack
    if (calcBjScore(pHand) === 21) {
      handleBjGameOver(pHand, dHand, 'BLACKJACK');
    }
  };

  const playBjHit = () => {
    const newDeck = [...bjDeck];
    const card = newDeck.pop();
    const newHand = [...bjPlayerHand, card];
    setBjPlayerHand(newHand);
    setBjDeck(newDeck);

    if (calcBjScore(newHand) > 21) {
      handleBjGameOver(newHand, bjDealerHand, 'BUST');
    } else if (newHand.length === 5) {
      handleBjGameOver(newHand, bjDealerHand, '5-CARD-CHARLIE');
    }
  };

  const playBjDouble = async () => {
    if (userProfile.hker_token < bjBet) return alert("積分不足以加倍 (Insufficient Funds)");
    
    await updatePoints(-bjBet); // Deduct the extra bet
    const doubledBet = bjBet * 2;
    setBjBet(doubledBet);

    const newDeck = [...bjDeck];
    const card = newDeck.pop();
    const newHand = [...bjPlayerHand, card];
    setBjPlayerHand(newHand);
    setBjDeck(newDeck);

    if (calcBjScore(newHand) > 21) {
      handleBjGameOver(newHand, bjDealerHand, 'BUST');
    } else {
      runBjDealerLogic(newHand, bjDealerHand, newDeck, doubledBet);
    }
  };

  const playBjStand = () => {
    runBjDealerLogic(bjPlayerHand, bjDealerHand, bjDeck, bjBet);
  };

  const runBjDealerLogic = async (pHand: any[], dHand: any[], currentDeck: any[], finalBet: number) => {
    setBjGameState('DEALER_TURN');
    let tempDeck = [...currentDeck];
    let tempDealerHand = [...dHand];
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    await sleep(BJ_ANIMATION_SPEED);

    let dScore = calcBjScore(tempDealerHand);
    while (dScore < DEALER_STAND_ON) {
      const card = tempDeck.pop();
      tempDealerHand = [...tempDealerHand, card];
      setBjDealerHand(tempDealerHand); // Visual update
      setBjDeck(tempDeck);
      dScore = calcBjScore(tempDealerHand);
      await sleep(BJ_ANIMATION_SPEED);
    }
    handleBjGameOver(pHand, tempDealerHand, 'COMPARE', finalBet);
  };

  const handleBjGameOver = (pHand: any[], dHand: any[], reason: string, finalBet = bjBet) => {
    setBjGameState('GAME_OVER');
    const pScore = calcBjScore(pHand);
    const dScore = calcBjScore(dHand);
    let winAmount = 0;
    let resultMsg = '';

    if (reason === 'BUST') {
      resultMsg = '系統偵測：玩家爆牌 (BUST)';
    } else if (reason === 'BLACKJACK') {
      if (dScore === 21) {
        winAmount = finalBet; // Push (return bet)
        resultMsg = '平手 (PUSH)';
      } else {
        winAmount = finalBet + Math.floor(finalBet * 1.5); // 3:2 payout
        resultMsg = 'BLACKJACK! 賠率 3:2';
      }
    } else if (reason === '5-CARD-CHARLIE') {
      winAmount = finalBet + (finalBet * 3); // 3:1 payout
      resultMsg = '五龍護體！超級大獎 3:1';
    } else {
      if (dScore > 21) {
        winAmount = finalBet * 2;
        resultMsg = '莊家爆牌！你贏了 (YOU WIN)';
      } else if (pScore > dScore) {
        winAmount = finalBet * 2;
        resultMsg = '點數勝出！你贏了 (YOU WIN)';
      } else if (pScore < dScore) {
        resultMsg = '點數不足，莊家勝 (DEALER WINS)';
      } else {
        winAmount = finalBet;
        resultMsg = '平手 (PUSH)';
      }
    }

    if (winAmount > 0) {
      updatePoints(winAmount);
      setBjMessage(`${resultMsg} +${winAmount}`);
    } else {
      setBjMessage(resultMsg);
    }
  };

  const BjCard = ({ card, hidden, index }: any) => {
    if (hidden) {
       return (
         <div className="w-16 h-24 md:w-20 md:h-28 bg-slate-800 border border-indigo-500/50 rounded flex items-center justify-center shadow-lg relative" style={{ animation: `pulse 2s infinite` }}>
            <div className="text-indigo-500/50"><BrainCircuit size={24} /></div>
         </div>
       );
    }
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className={`
        w-16 h-24 md:w-20 md:h-28 bg-white rounded shadow-xl flex flex-col justify-between p-1 md:p-2 
        relative transform transition-transform hover:-translate-y-1 select-none
        ${isRed ? 'text-red-600' : 'text-slate-900'}
      `} style={{ animation: 'fade-in 0.3s ease-out' }}>
        <div className="text-sm font-bold font-mono leading-none">{card.value}</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl md:text-3xl">
          {card.suit}
        </div>
        <div className="text-sm font-bold font-mono leading-none transform rotate-180 self-end">{card.value}</div>
      </div>
    );
  };


  // --- Slots Logic (3x3 Professional) ---
  const playSlot = async () => {
    const BET_PER_LINE = 100;
    const LINES = 5;
    const TOTAL_BET = BET_PER_LINE * LINES;

    if (userProfile.hker_token < TOTAL_BET) return alert(`積分不足 (需 ${TOTAL_BET})`);
    if (slotSpinning) return;
    
    setSlotSpinning(true);
    setSlotMessage('旋轉中...');
    setSlotWinningLines([]);
    await updatePoints(-TOTAL_BET);

    // Weighted Random Generator
    const getRandomSymbol = () => {
       const totalWeight = SLOT_SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
       let rand = Math.random() * totalWeight;
       for (const s of SLOT_SYMBOLS) {
          if (rand < s.weight) return s.icon;
          rand -= s.weight;
       }
       return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1].icon;
    };

    // Spin Animation (Speed Up 2x: 25ms interval, fewer steps)
    let count = 0;
    const interval = setInterval(() => {
       const newGrid = Array(3).fill(null).map(() => 
         Array(3).fill(null).map(() => getRandomSymbol())
       );
       setSlotGrid(newGrid);
       count++;
       if (count > 8) { // Shortened animation steps
         clearInterval(interval);
         finalizeSlot3x3(newGrid, BET_PER_LINE);
       }
    }, 30); // Fast interval
  };

  const finalizeSlot3x3 = (grid: string[][], betPerLine: number) => {
    let totalWin = 0;
    const winningLines: number[] = [];

    SLOT_PAYLINES.forEach((line, index) => {
       const [p1, p2, p3] = line;
       const s1 = grid[p1[0]][p1[1]];
       const s2 = grid[p2[0]][p2[1]];
       const s3 = grid[p3[0]][p3[1]];

       if (s1 === s2 && s2 === s3) {
          const symbolData = SLOT_SYMBOLS.find(s => s.icon === s1);
          if (symbolData) {
             totalWin += symbolData.value * betPerLine;
             winningLines.push(index);
          }
       }
    });

    setSlotWinningLines(winningLines);
    setSlotSpinning(false);

    if (totalWin > 0) {
       setSlotMessage(`中獎! +${totalWin}`);
       updatePoints(totalWin);
    } else {
       setSlotMessage('再接再厲');
    }
  };

  // --- Hoo Hey How Logic ---
  const addHhhBet = (symbol: string) => {
    if (hhhRolling) return;
    setHhhBets(prev => ({ ...prev, [symbol]: (prev[symbol] || 0) + 100 }));
  };
  const clearHhhBets = () => !hhhRolling && setHhhBets({});

  const playHhh = async () => {
    const totalBet = (Object.values(hhhBets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return alert('請先下注！');
    if (userProfile.hker_token < totalBet) return alert('積分不足！');
    if (hhhRolling) return;
    setHhhRolling(true);
    setHhhMessage('搖骰中...');
    await updatePoints(-totalBet);

    let count = 0;
    const interval = setInterval(() => {
      setHhhDice([
        SYMBOLS_HHH[Math.floor(Math.random() * 6)],
        SYMBOLS_HHH[Math.floor(Math.random() * 6)],
        SYMBOLS_HHH[Math.floor(Math.random() * 6)]
      ]);
      count++;
      if (count > 10) {
        clearInterval(interval);
        finalizeHhh(totalBet);
      }
    }, 80);
  };

  const finalizeHhh = (totalBet: number) => {
    const r1 = SYMBOLS_HHH[Math.floor(Math.random() * 6)];
    const r2 = SYMBOLS_HHH[Math.floor(Math.random() * 6)];
    const r3 = SYMBOLS_HHH[Math.floor(Math.random() * 6)];
    const result = [r1, r2, r3];
    setHhhDice(result);
    setHhhRolling(false);
    setHhhHistory(prev => [result, ...prev].slice(0, 10));

    let winnings = 0;
    const counts: Record<string, number> = {};
    result.forEach(s => counts[s] = (counts[s] || 0) + 1);

    Object.entries(hhhBets).forEach(([symbol, betAmount]) => {
      const amount = betAmount as number;
      if (counts[symbol]) {
        winnings += amount + (amount * counts[symbol]);
      }
    });

    if (winnings > 0) {
      updatePoints(winnings);
      setHhhMessage(`中獎! +${winnings}`);
    } else {
      setHhhMessage('全軍覆沒');
    }
  };

  // --- Little Mary Logic ---
  const addMaryBet = (symbol: string) => {
    if (maryRunning) return;
    setMaryBets(prev => ({ ...prev, [symbol]: (prev[symbol] || 0) + 10 }));
  };

  const clearMaryBets = () => !maryRunning && setMaryBets({});

  const playMary = async () => {
    const totalBet = (Object.values(maryBets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return alert('請先下注 (10pts起)');
    if (userProfile.hker_token < totalBet) return alert('積分不足');
    if (maryRunning) return;

    setMaryRunning(true);
    setMaryWinAmount(0);
    setMaryMessage('跑燈中...');
    await updatePoints(-totalBet);

    const rand = Math.random() * 1000;
    let accumulatedWeight = 0;
    let winningConfig = MARY_CONFIG[MARY_CONFIG.length - 1]; 

    for (const config of MARY_CONFIG) {
      accumulatedWeight += config.weight;
      if (rand <= accumulatedWeight) {
        winningConfig = config;
        break;
      }
    }

    let targetIndex = -1;
    const matchingIndices = MARY_TRACK.map((s, i) => s === winningConfig.name ? i : -1).filter(i => i !== -1);
    
    if (matchingIndices.length > 0) {
      targetIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
    } else {
      targetIndex = Math.floor(Math.random() * 24);
    }

    let currentIdx = maryActiveIndex;
    let rounds = 3; 
    let totalSteps = (rounds * 24) + ((targetIndex - currentIdx + 24) % 24);
    let stepCount = 0;
    
    const runStep = () => {
      stepCount++;
      currentIdx = (currentIdx + 1) % 24;
      setMaryActiveIndex(currentIdx);

      if (stepCount < totalSteps) {
        let delay = 20; 
        if (stepCount > totalSteps - 10) delay += (stepCount - (totalSteps - 10)) * 30; 
        setTimeout(runStep, delay);
      } else {
        finishMary(winningConfig.name === 'LOST' ? 'LOST' : MARY_TRACK[currentIdx]);
      }
    };

    runStep();
  };

  const finishMary = (resultSymbol: string) => {
    setMaryRunning(false);
    
    const betAmount = maryBets[resultSymbol] || 0;
    const config = MARY_CONFIG.find(c => c.name === resultSymbol);
    const odds = config ? config.odds : 0;
    const win = betAmount * odds;

    if (win > 0) {
      updatePoints(win);
      setMaryWinAmount(win);
      setMaryMessage(`中獎! ${config?.label} x${odds} = ${win}`);
    } else {
      setMaryWinAmount(0);
      setMaryMessage('沒中獎，再接再厲');
    }
  };

  const renderMaryCell = (trackIndex: number) => {
    const symbol = MARY_TRACK[trackIndex];
    const isActive = maryActiveIndex === trackIndex;
    return (
      <div className={`
        relative flex items-center justify-center rounded-lg border-2 shadow-inner transition-all duration-75
        ${isActive ? 'bg-yellow-300 border-red-500 scale-105 z-10 shadow-[0_0_15px_rgba(255,215,0,0.8)]' : 'bg-gray-100 border-gray-300'}
        w-full h-full text-2xl md:text-3xl select-none
      `}>
        {symbol}
        {isActive && <div className="absolute inset-0 bg-white/30 animate-pulse rounded-lg"></div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full max-w-6xl mx-auto p-4 gap-4">
      <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />

      {/* Main Game Area */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col relative border border-gray-200">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center z-10 shadow-md">
           <div className="flex items-center gap-3">
             <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-sm shadow">
               {userProfile.hker_token.toLocaleString()} PTS
             </div>
             <button onClick={() => setMusicEnabled(!musicEnabled)} className={`p-2 rounded-full transition ${musicEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
               {musicEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
             </button>
           </div>
           <div className="font-bold text-lg tracking-wider">
             {activeGame === 'mary' && '小瑪莉 (Little Mary)'}
             {activeGame === 'hhh' && '魚蝦蟹 (Hoo Hey How)'}
             {activeGame === 'slots' && '幸運老虎機 (Pro Slots)'}
             {activeGame === 'roulette' && '量子輪盤 (Quantum Roulette)'}
             {activeGame === 'blackjack' && <span className="flex items-center gap-2 text-indigo-400">CyberBlitz 21 <Zap size={16} fill="currentColor"/></span>}
             {activeGame === 'baccarat' && <span className="flex items-center gap-2 text-green-400">AI Turbo Baccarat <Activity size={16} /></span>}
           </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 flex items-center justify-center ${activeGame === 'blackjack' || activeGame === 'baccarat' || activeGame === 'roulette' ? 'bg-slate-950' : 'bg-gradient-to-b from-gray-100 to-gray-300'}`}>
          
          {/* --- LITTLE MARY --- */}
          {activeGame === 'mary' && (
            <div className="w-full max-w-lg aspect-square bg-gray-800 p-3 rounded-xl shadow-2xl border-4 border-yellow-600 relative">
              <div className="absolute top-0 left-0 w-full h-full grid grid-cols-7 grid-rows-7 gap-1 p-1">
                {/* Top Row */}
                {Array.from({length:7}).map((_, i) => <div key={`t-${i}`} className="col-span-1 row-span-1">{renderMaryCell(i)}</div>)}
                
                {/* Right Col */}
                <div className="col-start-7 row-start-2">{renderMaryCell(7)}</div>
                <div className="col-start-7 row-start-3">{renderMaryCell(8)}</div>
                <div className="col-start-7 row-start-4">{renderMaryCell(9)}</div>
                <div className="col-start-7 row-start-5">{renderMaryCell(10)}</div>
                <div className="col-start-7 row-start-6">{renderMaryCell(11)}</div>

                {/* Bottom Row */}
                <div className="col-start-7 row-start-7">{renderMaryCell(12)}</div>
                <div className="col-start-6 row-start-7">{renderMaryCell(13)}</div>
                <div className="col-start-5 row-start-7">{renderMaryCell(14)}</div>
                <div className="col-start-4 row-start-7">{renderMaryCell(15)}</div>
                <div className="col-start-3 row-start-7">{renderMaryCell(16)}</div>
                <div className="col-start-2 row-start-7">{renderMaryCell(17)}</div>
                <div className="col-start-1 row-start-7">{renderMaryCell(18)}</div>

                {/* Left Col */}
                <div className="col-start-1 row-start-6">{renderMaryCell(19)}</div>
                <div className="col-start-1 row-start-5">{renderMaryCell(20)}</div>
                <div className="col-start-1 row-start-4">{renderMaryCell(21)}</div>
                <div className="col-start-1 row-start-3">{renderMaryCell(22)}</div>
                <div className="col-start-1 row-start-2">{renderMaryCell(23)}</div>

                {/* CENTER CONTROL PANEL */}
                <div className="col-start-2 col-end-7 row-start-2 row-end-7 bg-gray-900 rounded-lg p-2 flex flex-col justify-between border border-gray-700">
                   <div className="text-center">
                     <div className={`text-2xl font-black ${maryWinAmount > 0 ? 'text-yellow-400 animate-bounce' : 'text-blue-400'}`}>
                       {maryMessage}
                     </div>
                   </div>

                   <div className="grid grid-cols-4 gap-2 my-2">
                      {MARY_BET_OPTIONS.map((opt) => (
                        <button 
                          key={opt.name}
                          disabled={maryRunning}
                          onClick={() => addMaryBet(opt.name)}
                          className="flex flex-col items-center bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded p-1 border border-gray-600 transition"
                        >
                           <span className="text-xl">{opt.name}</span>
                           <span className="text-[10px] text-yellow-500">x{opt.odds}</span>
                           <div className="bg-black w-full text-center text-xs font-mono text-green-400 rounded mt-1">
                             {maryBets[opt.name] || 0}
                           </div>
                        </button>
                      ))}
                   </div>

                   <div className="flex gap-2">
                      <button onClick={clearMaryBets} disabled={maryRunning} className="bg-red-900/50 text-red-300 px-3 rounded text-xs border border-red-800 hover:bg-red-900">
                        清除
                      </button>
                      <button 
                        onClick={playMary} 
                        disabled={maryRunning}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded shadow-lg disabled:opacity-50 active:scale-95 transition flex items-center justify-center gap-2"
                      >
                         <Zap size={16} fill="currentColor" /> 
                         {maryRunning ? 'RUNNING' : 'START'}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* --- FISH PRAWN CRAB GAME --- */}
          {activeGame === 'hhh' && (
            <div className="w-full max-w-2xl">
              <div className="bg-red-800 rounded-full p-6 mb-8 shadow-2xl border-8 border-yellow-600 mx-auto w-64 h-64 flex items-center justify-center relative">
                 <div className="absolute inset-0 rounded-full border-4 border-black/20"></div>
                 <div className="flex gap-2 justify-center items-center">
                    {hhhDice.map((d, i) => (
                      <div key={i} className={`text-5xl bg-white rounded-xl w-14 h-14 flex items-center justify-center shadow-inner border-2 border-gray-300 ${hhhRolling ? 'animate-bounce' : ''}`} style={{animationDelay: `${i * 0.1}s`}}>
                        {d}
                      </div>
                    ))}
                 </div>
              </div>
              <div className="text-center mb-4">
                <div className="text-xl font-bold text-gray-800 h-8">{hhhMessage}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {SYMBOLS_HHH.map(symbol => (
                  <button 
                    key={symbol}
                    onClick={() => addHhhBet(symbol)}
                    disabled={hhhRolling}
                    className="relative bg-white p-4 rounded-xl shadow-md hover:shadow-lg border-b-4 border-gray-200 group"
                  >
                    <div className="text-5xl mb-1 transform group-hover:scale-110 transition">{symbol}</div>
                    {hhhBets[symbol] > 0 && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow border border-yellow-600">
                        {hhhBets[symbol]}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                 <button onClick={clearHhhBets} disabled={hhhRolling} className="bg-gray-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 disabled:opacity-50"><RotateCcw size={20} /></button>
                 <button onClick={playHhh} disabled={hhhRolling} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold py-3 rounded-xl shadow-lg disabled:opacity-50">開 骰 !</button>
              </div>
            </div>
          )}

          {/* --- SLOTS GAME (3x3 Professional) --- */}
          {activeGame === 'slots' && (
             <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border-4 border-yellow-400 text-center w-full max-w-lg">
                <div className="mb-4 text-xs text-gray-500 uppercase tracking-widest font-bold">Paylines: 5 | Cost: 500</div>
                
                {/* 3x3 Grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8 bg-gray-100 p-4 rounded-xl shadow-inner relative">
                  {/* Payline Indicators (Simplified Visuals) */}
                  {slotWinningLines.map(lineIdx => (
                    <div key={lineIdx} className="absolute inset-0 pointer-events-none border-4 border-red-500/50 rounded-xl animate-pulse"></div>
                  ))}

                  {slotGrid.map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                      {row.map((symbol, cIdx) => {
                         // Check if this cell is part of a winning line
                         let isWinner = false;
                         slotWinningLines.forEach(lIdx => {
                           const lineCoords = SLOT_PAYLINES[lIdx];
                           if (lineCoords.some(c => c[0] === rIdx && c[1] === cIdx)) isWinner = true;
                         });

                         return (
                           <div key={`${rIdx}-${cIdx}`} className={`
                             w-full aspect-square flex items-center justify-center text-4xl md:text-5xl 
                             bg-white border-4 rounded-lg shadow-sm transition-transform
                             ${isWinner ? 'border-red-500 scale-105 bg-yellow-50 z-10' : 'border-gray-200'}
                             ${slotSpinning ? 'blur-[2px]' : ''}
                           `}>
                             {symbol}
                           </div>
                         );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                <div className="h-12 flex items-center justify-center">
                   <div className={`text-2xl font-black ${slotWinningLines.length > 0 ? 'text-red-500 animate-bounce' : 'text-gray-400'}`}>
                     {slotMessage}
                   </div>
                </div>

                <button 
                  onClick={playSlot} 
                  disabled={slotSpinning} 
                  className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 text-white text-2xl font-bold py-4 rounded-full hover:from-yellow-500 hover:to-yellow-700 shadow-lg disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   <Dices size={28} /> SPIN (500)
                </button>

                <div className="mt-4 grid grid-cols-5 text-center text-[10px] text-gray-400">
                   {SLOT_SYMBOLS.map(s => (
                     <div key={s.icon}>
                       <div>{s.icon}</div>
                       <div>x{s.value}</div>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* --- QUANTUM ROULETTE --- */}
          {activeGame === 'roulette' && (
             <div className="w-full h-full flex flex-col items-center justify-center font-mono">
                {/* Status Bar */}
                <div className="w-full max-w-4xl bg-[#020617] border-b border-cyan-900/50 flex justify-between items-center p-2 mb-4 text-xs text-cyan-400">
                   <div className="flex gap-2 items-center"><Aperture size={14} className="animate-spin-slow"/> <span>QUANTUM ENGINE v3.0</span></div>
                   <div>HISTORY: <span className="text-pink-500 font-bold">{rouletteHistory.map(n => n + ' ').slice(0,8)}</span></div>
                </div>

                <canvas ref={canvasRef} width={340} height={340} className="rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-6 cursor-pointer hover:scale-105 transition-transform duration-500"></canvas>
                
                <div className="h-8 text-center mb-2">
                   <span className={`text-lg font-bold ${rouletteMessage.includes('WIN') ? 'text-green-400 animate-bounce' : 'text-slate-400'}`}>
                     {rouletteMessage}
                   </span>
                </div>

                {/* Cyber Betting Matrix */}
                <div className="bg-[#0f172a]/90 p-4 rounded-xl border border-slate-700 w-full max-w-3xl shadow-2xl backdrop-blur-md">
                   <div className="flex flex-col md:flex-row gap-4">
                      {/* Number Grid */}
                      <div className="flex-1">
                         <div className="text-[10px] text-slate-500 mb-1 flex justify-between">
                            <span>MATRIX INPUT (x36)</span>
                            <span className="text-cyan-600">0-36 SELECTED</span>
                         </div>
                         <div className="grid grid-cols-12 gap-1">
                            {ROULETTE_NUMBERS.slice().sort((a,b)=>a-b).map(num => (
                              <button 
                                key={num} 
                                onClick={() => !rouletteSpinning && setRouletteBet({type: 'NUMBER', value: num, amount: rouletteChip})}
                                className={`
                                   h-8 text-xs font-bold border transition-all hover:bg-cyan-400 hover:text-black
                                   ${num === 0 ? 'text-green-400 border-green-900' : ROULETTE_RED.includes(num) ? 'text-red-400 border-red-900' : 'text-slate-300 border-slate-700'}
                                   ${rouletteBet?.type === 'NUMBER' && rouletteBet.value === num ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-[#1e293b]'}
                                `}
                              >
                                {num}
                              </button>
                            ))}
                         </div>
                      </div>

                      {/* Area Bets */}
                      <div className="flex flex-col gap-2 min-w-[120px]">
                         <div className="text-[10px] text-slate-500 text-right">SECTORS (x2)</div>
                         <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => !rouletteSpinning && setRouletteBet({type: 'COLOR', value: 'RED', amount: rouletteChip})} className={`p-2 text-xs font-bold border border-red-900 rounded ${rouletteBet?.value==='RED'?'bg-red-600 text-white':'bg-red-950/30 text-red-500'}`}>RED</button>
                            <button onClick={() => !rouletteSpinning && setRouletteBet({type: 'COLOR', value: 'BLACK', amount: rouletteChip})} className={`p-2 text-xs font-bold border border-slate-600 rounded ${rouletteBet?.value==='BLACK'?'bg-slate-600 text-white':'bg-slate-900 text-slate-400'}`}>BLACK</button>
                            <button onClick={() => !rouletteSpinning && setRouletteBet({type: 'PARITY', value: 'ODD', amount: rouletteChip})} className={`p-2 text-xs font-bold border border-cyan-900 rounded ${rouletteBet?.value==='ODD'?'bg-cyan-600 text-white':'bg-cyan-950/30 text-cyan-500'}`}>ODD</button>
                            <button onClick={() => !rouletteSpinning && setRouletteBet({type: 'PARITY', value: 'EVEN', amount: rouletteChip})} className={`p-2 text-xs font-bold border border-purple-900 rounded ${rouletteBet?.value==='EVEN'?'bg-purple-600 text-white':'bg-purple-950/30 text-purple-500'}`}>EVEN</button>
                         </div>
                      </div>
                   </div>

                   {/* Controls */}
                   <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-end">
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] text-slate-500">CHIP VALUE</span>
                         <div className="flex gap-1">
                            {[100, 500, 1000, 5000].map(v => (
                               <button key={v} onClick={() => setRouletteChip(v)} className={`px-2 py-1 text-xs rounded border ${rouletteChip === v ? 'bg-yellow-600 text-black border-yellow-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{v}</button>
                            ))}
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="text-right">
                            <div className="text-[10px] text-slate-500">CURRENT BET</div>
                            <div className="text-xl text-yellow-500 font-bold">{rouletteBet ? rouletteBet.amount : 0}</div>
                         </div>
                         <button 
                           onClick={spinRoulette}
                           disabled={rouletteSpinning || !rouletteBet}
                           className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow-[0_0_20px_rgba(8,145,178,0.4)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                         >
                            {rouletteSpinning ? 'SPINNING...' : 'SPIN'}
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* --- BLACKJACK (CYBER BLITZ 21) --- */}
          {activeGame === 'blackjack' && (
            <div className="w-full h-full flex flex-col items-center justify-center relative p-4 text-white font-mono">
               {/* Cyberpunk Background FX */}
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none" />
               <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 shadow-[0_0_10px_#6366f1]" />
               
               <div className="z-10 w-full max-w-2xl space-y-6">
                  {/* Dealer Section */}
                  <div className="flex flex-col items-center min-h-[140px]">
                     <div className="flex items-center gap-2 mb-2 opacity-80">
                        <Shield size={14} className="text-cyan-400" />
                        <span className="text-xs tracking-[0.2em] text-cyan-200">AI DEALER SYSTEM</span>
                        {bjGameState !== 'BETTING' && bjGameState !== 'PLAYING' && (
                          <span className="ml-2 bg-red-900 text-red-100 text-[10px] px-2 py-0.5 rounded font-bold">
                             {calcBjScore(bjDealerHand)}
                          </span>
                        )}
                     </div>
                     <div className="flex -space-x-10">
                        {bjDealerHand.map((card, i) => (
                           <BjCard key={card.id || i} card={card} hidden={bjGameState === 'PLAYING' && i === 1} index={i} />
                        ))}
                        {bjDealerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-slate-700 rounded flex items-center justify-center text-xs text-slate-700">EMPTY</div>}
                     </div>
                  </div>

                  {/* Message Center */}
                  <div className="h-12 flex items-center justify-center">
                    {bjMessage && (
                      <div className={`px-4 py-2 rounded border backdrop-blur-md animate-bounce
                        ${bjMessage.includes('WIN') ? 'bg-green-500/20 border-green-500 text-green-300' : 
                          bjMessage.includes('PUSH') ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'bg-red-500/20 border-red-500 text-red-300'}
                      `}>
                         {bjMessage}
                      </div>
                    )}
                  </div>

                  {/* Player Section */}
                  <div className="flex flex-col items-center min-h-[140px]">
                     <div className="flex -space-x-10 mb-2">
                        {bjPlayerHand.map((card, i) => (
                           <BjCard key={card.id || i} card={card} index={i} />
                        ))}
                        {bjPlayerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-slate-700 rounded flex items-center justify-center text-xs text-slate-700">EMPTY</div>}
                     </div>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs tracking-[0.2em] text-indigo-200">PLAYER 01</span>
                        {bjGameState !== 'BETTING' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${calcBjScore(bjPlayerHand) > 21 ? 'bg-red-600' : 'bg-indigo-600'}`}>
                             {calcBjScore(bjPlayerHand)}
                          </span>
                        )}
                     </div>
                  </div>

                  {/* Controls */}
                  <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                     {bjGameState === 'BETTING' ? (
                       <div className="space-y-3">
                          <div className="flex justify-between items-end">
                             <span className="text-xs text-slate-400">CURRENT BET</span>
                             <span className="text-2xl font-mono text-cyan-400 font-bold">{bjBet}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                             {[100, 500, 1000, 5000].map(amt => (
                               <button key={amt} onClick={() => setBjBet(prev => prev + amt)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded text-xs font-mono border border-slate-600">+{amt}</button>
                             ))}
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setBjBet(0)} className="flex-1 bg-red-900/40 text-red-400 py-2 rounded border border-red-900 hover:bg-red-900/60 text-xs font-bold">RESET</button>
                             <button onClick={playBjDeal} disabled={bjBet === 0} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold shadow-[0_0_15px_#4f46e5] flex items-center justify-center gap-2 disabled:opacity-50">
                               <Play size={16} /> DEAL
                             </button>
                          </div>
                       </div>
                     ) : (
                       <div className="grid grid-cols-2 gap-3">
                          {bjGameState === 'PLAYING' && (
                            <>
                              <button onClick={playBjHit} className="py-3 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-[0_0_10px_rgba(34,197,94,0.4)]">HIT (要牌)</button>
                              <button onClick={playBjStand} className="py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-[0_0_10px_rgba(239,68,68,0.4)]">STAND (停牌)</button>
                              {bjPlayerHand.length === 2 && (
                                <button onClick={playBjDouble} className="col-span-2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-xs flex items-center justify-center gap-2 border border-amber-400">
                                   <Zap size={14} /> DOUBLE DOWN (加倍 x2)
                                </button>
                              )}
                            </>
                          )}
                          {bjGameState === 'GAME_OVER' && (
                             <button onClick={() => { setBjBet(0); setBjGameState('BETTING'); setBjMessage(''); setBjPlayerHand([]); setBjDealerHand([]); }} className="col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold animate-pulse shadow-[0_0_20px_#4f46e5]">
                                PLAY AGAIN (再玩一局)
                             </button>
                          )}
                       </div>
                     )}
                  </div>
               </div>

               {/* Info Button */}
               <button onClick={() => setBjShowRules(!bjShowRules)} className="absolute top-4 right-4 text-slate-500 hover:text-cyan-400 transition-colors">
                  <Info size={24} />
               </button>

               {/* Rules Modal */}
               {bjShowRules && (
                 <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-cyan-500/50 max-w-sm w-full p-6 rounded-2xl relative shadow-2xl">
                       <button onClick={() => setBjShowRules(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle /></button>
                       <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2"><BrainCircuit size={20}/> ENGINEER'S PROTOCOL</h3>
                       <ul className="text-sm text-slate-300 space-y-2 font-mono">
                          <li className="flex justify-between border-b border-slate-800 pb-1"><span>Blackjack</span> <span className="text-green-400">3:2</span></li>
                          <li className="flex justify-between border-b border-slate-800 pb-1"><span>5-Card Charlie</span> <span className="text-yellow-400">3:1</span></li>
                          <li className="flex justify-between border-b border-slate-800 pb-1"><span>Win</span> <span className="text-white">1:1</span></li>
                          <li className="pt-2 text-xs text-slate-500">
                             System Logic:<br/>
                             - Dealer Stands on 17+<br/>
                             - Double Down available on any 2 cards<br/>
                             - Speed Mode Active (200ms)
                          </li>
                       </ul>
                    </div>
                 </div>
               )}
            </div>
          )}

           {/* --- AI TURBO BACCARAT --- */}
           {activeGame === 'baccarat' && (
            <div className="w-full h-full flex flex-col items-center justify-center relative p-4 font-mono text-white bg-black">
               {/* Background Scanline FX */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,128,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

               <div className="z-10 w-full max-w-4xl space-y-4">
                  {/* AI Prediction Header */}
                  <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-800 pb-2">
                     <div className="flex items-center gap-2">
                        <Activity size={14} className="text-green-500 animate-pulse" />
                        AI PREDICTION
                     </div>
                     <div className="flex gap-4">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> P: {(45 + Math.random()*5).toFixed(1)}%</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> B: {(45 + Math.random()*5).toFixed(1)}%</div>
                     </div>
                  </div>

                  {/* Main Table */}
                  <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                     {/* Roadmap (Bead Plate) */}
                     <div className="absolute top-2 right-4 flex gap-1 opacity-50">
                        {bacHistory.map((res, i) => (
                           <div key={i} className={`w-3 h-3 rounded-full ${res==='P'?'bg-blue-500':res==='B'?'bg-red-500':'bg-green-500'}`}></div>
                        ))}
                     </div>

                     <div className="flex justify-between items-start mt-4">
                        {/* Player Side */}
                        <div className="flex-1 flex flex-col items-center">
                           <h3 className="text-blue-400 font-bold tracking-widest text-lg mb-2">PLAYER</h3>
                           <div className="flex -space-x-8 h-28 md:h-36">
                              {bacPlayerHand.map((c,i) => <BacCard key={i} card={c} type='P' />)}
                           </div>
                           <div className={`mt-2 text-2xl font-bold ${getBacScore(bacPlayerHand)>7 ? 'text-yellow-400 animate-pulse':'text-blue-300'}`}>
                             {bacPlayerHand.length > 0 ? getBacScore(bacPlayerHand) : '-'}
                           </div>
                        </div>

                        {/* VS Divider */}
                        <div className="mx-4 h-32 w-px bg-gradient-to-b from-transparent via-slate-500 to-transparent flex items-center justify-center">
                           <div className="bg-black border border-slate-600 rounded-full w-8 h-8 flex items-center justify-center text-xs text-slate-400">VS</div>
                        </div>

                        {/* Banker Side */}
                        <div className="flex-1 flex flex-col items-center">
                           <h3 className="text-red-400 font-bold tracking-widest text-lg mb-2">BANKER</h3>
                           <div className="flex -space-x-8 h-28 md:h-36">
                              {bacBankerHand.map((c,i) => <BacCard key={i} card={c} type='B' />)}
                           </div>
                           <div className={`mt-2 text-2xl font-bold ${getBacScore(bacBankerHand)>7 ? 'text-yellow-400 animate-pulse':'text-red-300'}`}>
                             {bacBankerHand.length > 0 ? getBacScore(bacBankerHand) : '-'}
                           </div>
                        </div>
                     </div>

                     {/* Result Overlay */}
                     <div className="h-10 flex items-center justify-center mt-4">
                        <span className={`text-xl font-black uppercase tracking-widest transition-all ${bacMessage.includes('WIN') ? 'text-green-400 scale-110' : 'text-slate-500'}`}>
                           {bacMessage}
                        </span>
                     </div>
                  </div>

                  {/* Betting Controls */}
                  <div className="grid grid-cols-3 gap-4">
                     {/* Player Bet Zone */}
                     <button 
                        onClick={() => { if(bacGameState === 'BETTING') setBacBet({type: 'PLAYER', amount: (bacBet?.type==='PLAYER'?bacBet.amount:0)+100}) }}
                        disabled={bacGameState !== 'BETTING'}
                        className={`bg-blue-900/30 border border-blue-600/50 rounded-xl p-4 hover:bg-blue-900/50 transition-all ${bacBet?.type==='PLAYER'?'ring-2 ring-blue-400 bg-blue-800/50':''}`}
                     >
                        <div className="text-blue-400 font-bold text-lg">PLAYER (閒)</div>
                        <div className="text-xs text-blue-200/50">1 : 1</div>
                        {bacBet?.type==='PLAYER' && <div className="mt-1 text-yellow-400 font-bold">${bacBet.amount}</div>}
                     </button>

                     {/* Tie Bet Zone */}
                     <button 
                        onClick={() => { if(bacGameState === 'BETTING') setBacBet({type: 'TIE', amount: (bacBet?.type==='TIE'?bacBet.amount:0)+100}) }}
                        disabled={bacGameState !== 'BETTING'}
                        className={`bg-green-900/30 border border-green-600/50 rounded-xl p-4 hover:bg-green-900/50 transition-all ${bacBet?.type==='TIE'?'ring-2 ring-green-400 bg-green-800/50':''}`}
                     >
                        <div className="text-green-400 font-bold text-lg">TIE (和)</div>
                        <div className="text-xs text-green-200/50">1 : 8</div>
                        {bacBet?.type==='TIE' && <div className="mt-1 text-yellow-400 font-bold">${bacBet.amount}</div>}
                     </button>

                     {/* Banker Bet Zone */}
                     <button 
                        onClick={() => { if(bacGameState === 'BETTING') setBacBet({type: 'BANKER', amount: (bacBet?.type==='BANKER'?bacBet.amount:0)+100}) }}
                        disabled={bacGameState !== 'BETTING'}
                        className={`bg-red-900/30 border border-red-600/50 rounded-xl p-4 hover:bg-red-900/50 transition-all ${bacBet?.type==='BANKER'?'ring-2 ring-red-400 bg-red-800/50':''}`}
                     >
                        <div className="text-red-400 font-bold text-lg">BANKER (莊)</div>
                        <div className="text-xs text-red-200/50">1 : 0.95</div>
                        {bacBet?.type==='BANKER' && <div className="mt-1 text-yellow-400 font-bold">${bacBet.amount}</div>}
                     </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                     <button 
                        onClick={() => setBacBet(null)} 
                        disabled={bacGameState !== 'BETTING'}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold border border-slate-600"
                     >
                        CLEAR
                     </button>
                     <button 
                        onClick={playBacDeal} 
                        disabled={bacGameState !== 'BETTING' || !bacBet}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xl py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                     >
                        <Zap className={bacGameState === 'DEALING' ? 'animate-pulse' : ''} />
                        {bacGameState === 'DEALING' ? 'COMPUTING...' : 'DEAL (極速發牌)'}
                     </button>
                     <button onClick={() => { setBacGameState('BETTING'); setBacBet(null); setBacMessage(''); setBacPlayerHand([]); setBacBankerHand([]); }} disabled={bacGameState !== 'RESULT'} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-30">
                        NEXT
                     </button>
                  </div>

                  {/* Info Trigger */}
                  <button onClick={() => setBacShowRules(!bacShowRules)} className="absolute top-0 right-0 p-2 text-slate-500 hover:text-green-400"><Info size={20}/></button>

                  {/* Rules Modal */}
                  {bacShowRules && (
                    <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
                       <div className="max-w-md w-full border border-green-500/50 rounded-xl p-6 bg-slate-900">
                          <h3 className="text-green-400 font-bold text-xl mb-4 flex items-center gap-2"><BrainCircuit/> AI PROTOCOL</h3>
                          <ul className="text-sm text-slate-300 space-y-2 mb-6">
                             <li>• Player (閒) 1:1 payout</li>
                             <li>• Banker (莊) 0.95:1 payout (5% comm)</li>
                             <li>• Tie (和) 1:8 payout</li>
                             <li>• Speed Mode: 2x faster animations</li>
                             <li>• AI automatically handles 3rd card rules</li>
                          </ul>
                          <button onClick={() => setBacShowRules(false)} className="w-full bg-green-600 text-white py-3 rounded font-bold">CLOSE</button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
           )}

        </div>
      </div>

      {/* Right Side Game Selector */}
      <div className="bg-white p-2 rounded-3xl shadow-lg w-full md:w-24 flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible no-scrollbar">
         <button 
           onClick={() => setActiveGame('mary')}
           className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition hover:bg-gray-100 ${activeGame === 'mary' ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500' : 'text-gray-400'}`}
         >
           <Cherry size={24} />
           <span className="text-[10px] font-bold whitespace-nowrap">小瑪莉</span>
         </button>

         <button 
           onClick={() => setActiveGame('hhh')}
           className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition hover:bg-gray-100 ${activeGame === 'hhh' ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'text-gray-400'}`}
         >
           <Fish size={24} />
           <span className="text-[10px] font-bold whitespace-nowrap">魚蝦蟹</span>
         </button>

         <button 
           onClick={() => setActiveGame('slots')}
           className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition hover:bg-gray-100 ${activeGame === 'slots' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500' : 'text-gray-400'}`}
         >
           <Grid3x3 size={24} />
           <span className="text-[10px] font-bold whitespace-nowrap">老虎機</span>
         </button>

         <button 
           onClick={() => setActiveGame('roulette')}
           className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition hover:bg-gray-100 ${activeGame === 'roulette' ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'text-gray-400'}`}
         >
           <Disc size={24} />
           <span className="text-[10px] font-bold whitespace-nowrap">量子輪盤</span>
         </button>

         <button 
           onClick={() => setActiveGame('blackjack')}
           className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition hover:bg-gray-100 ${activeGame === 'blackjack' ? 'bg-indigo-950 text-indigo-400 ring-2 ring-indigo-500' : 'text-gray-400'}`}
         >
           <Zap size={24} />
           <span className="text-[10px] font-bold whitespace-nowrap">21點</span>
         </button>

         <button 
           onClick={() => setActiveGame('baccarat')}
           className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition hover:bg-gray-100 ${activeGame === 'baccarat' ? 'bg-emerald-950 text-emerald-400 ring-2 ring-emerald-500' : 'text-gray-400'}`}
         >
           <Gem size={24} />
           <span className="text-[10px] font-bold whitespace-nowrap">百家樂</span>
         </button>
      </div>
    </div>
  );
};

export default GameCenter;