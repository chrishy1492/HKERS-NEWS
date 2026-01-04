
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../../types';
import { RefreshCw, Play, Volume2, VolumeX, AlertCircle, Trash2, Box } from 'lucide-react';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

// Configuration
const SYMBOLS = [
  { id: 'fish', name: '魚', color: 'bg-red-600', text: 'text-red-100', icon: '🐟', odds: '1:1' },
  { id: 'prawn', name: '蝦', color: 'bg-emerald-600', text: 'text-emerald-100', icon: '🦐', odds: '1:1' },
  { id: 'crab', name: '蟹', color: 'bg-emerald-600', text: 'text-emerald-100', icon: '🦀', odds: '1:1' },
  { id: 'coin', name: '金錢', color: 'bg-blue-600', text: 'text-blue-100', icon: '💰', odds: '1:1' },
  { id: 'gourd', name: '葫蘆', color: 'bg-blue-600', text: 'text-blue-100', icon: '🏺', odds: '1:1' },
  { id: 'rooster', name: '雞', color: 'bg-red-600', text: 'text-red-100', icon: '🐓', odds: '1:1' },
];

const CHIPS = [100, 500, 1000, 5000];

const FishPrawnCrab: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [totalBet, setTotalBet] = useState(0);
  const [dice, setDice] = useState<string[]>(['fish', 'prawn', 'crab']);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('請下注');
  const [selectedChip, setSelectedChip] = useState(100);
  
  // Audio State
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Soft ambient music (Public domain or placeholder)
    audioRef.current = new Audio('https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3'); 
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(() => {}); // Handle autoplay blocks
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  const handleBet = (symbolId: string) => {
    if (isRolling) return;
    if (!profile) return alert('請先登入');
    if (profile.points < totalBet + selectedChip) return alert('積分不足');

    const currentBet = bets[symbolId] || 0;
    setBets({ ...bets, [symbolId]: currentBet + selectedChip });
    setTotalBet(prev => prev + selectedChip);
  };

  const clearBets = () => {
    if (isRolling) return;
    setBets({});
    setTotalBet(0);
  };

  const rollDice = async () => {
    if (isRolling) return;
    if (totalBet === 0) return alert('請先下注');
    if (!profile || profile.points < totalBet) return alert('積分不足');

    setIsRolling(true);
    setLastWin(0);
    setMessage('搖骰中...');

    // Deduct
    const { error } = await supabase.from('profiles').update({
      points: profile.points - totalBet
    }).eq('id', profile.id);

    if (error) {
      setIsRolling(false);
      return alert('扣款失敗');
    }

    // Animation Loop (Accelerated: 1.5s total)
    const interval = setInterval(() => {
      setDice([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id
      ]);
    }, 80);

    // Final Result
    setTimeout(() => {
      clearInterval(interval);
      finalizeResult();
    }, 1500); // Fast speed
  };

  const finalizeResult = async () => {
    const finalDice = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id,
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id,
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id
    ];
    setDice(finalDice);
    setIsRolling(false);

    // Calculate Payout
    let payout = 0;
    let winCount = 0;

    // Count occurrences of each symbol in the result
    const counts: Record<string, number> = {};
    finalDice.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    // Check bets
    Object.keys(bets).forEach(symbolId => {
      const betAmount = bets[symbolId];
      const matchCount = counts[symbolId] || 0;

      if (matchCount > 0) {
        // Standard Rules:
        // 1 match: Bet + Bet*1
        // 2 match: Bet + Bet*2
        // 3 match: Bet + Bet*3
        payout += betAmount + (betAmount * matchCount);
        winCount++;
      }
    });

    if (payout > 0) {
      setMessage(`🎉 恭喜！贏得 ${payout} 積分！`);
      setLastWin(payout);
      // Update DB with winnings
      const { data } = await supabase.from('profiles').select('points').eq('id', profile!.id).single();
      if (data) {
        await supabase.from('profiles').update({ points: data.points + payout }).eq('id', profile!.id);
      }
    } else {
      setMessage('😢 再接再厲！');
    }
    onUpdate();
  };

  return (
    <div className="flex flex-col items-center bg-slate-950 p-4 rounded-[2rem] border border-slate-800 shadow-2xl max-w-4xl mx-auto min-h-[600px]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            魚蝦蟹
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hoo Hey How • Speed x2</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${!isMuted ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase">Balance</p>
            <p className="text-2xl font-black text-yellow-500">{profile?.points.toLocaleString()} PTS</p>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 w-full max-w-3xl flex flex-col gap-6">
        
        {/* Dice Bowl (Result Area) */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-inner flex flex-col items-center justify-center relative min-h-[200px]">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] animate-pulse pointer-events-none" />
          
          <div className="flex gap-4 md:gap-8 relative z-10">
            {dice.map((symbolId, idx) => {
              const symbol = SYMBOLS.find(s => s.id === symbolId);
              return (
                <div key={idx} className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl ${symbol?.color} flex items-center justify-center text-5xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-b-4 border-black/20 transform transition-all ${isRolling ? 'animate-bounce' : ''}`}>
                  {symbol?.icon}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 bg-black/40 px-6 py-2 rounded-full border border-white/10">
            <span className={`font-black text-lg ${lastWin > 0 ? 'text-green-400' : 'text-slate-300'}`}>
              {message}
            </span>
          </div>
        </div>

        {/* Betting Board */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {SYMBOLS.map((s) => (
              <button
                key={s.id}
                disabled={isRolling}
                onClick={() => handleBet(s.id)}
                className={`relative h-28 md:h-32 rounded-xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 group
                  ${bets[s.id] ? `${s.color} border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]` : 'bg-slate-900 border-slate-700 hover:border-slate-500'}
                `}
              >
                <span className="text-4xl mb-2 filter drop-shadow-lg transform group-hover:scale-110 transition-transform">{s.icon}</span>
                <span className={`font-black ${bets[s.id] ? 'text-white' : 'text-slate-400'}`}>{s.name}</span>
                <span className="text-[10px] opacity-70 mt-1 font-mono">1:1 ~ 1:3</span>
                
                {bets[s.id] && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black font-black text-xs px-2 py-1 rounded-full shadow-lg">
                    {bets[s.id]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Chip Selection */}
          <div className="flex gap-2">
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedChip(chip)}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[10px] border-2 transition-all
                  ${selectedChip === chip 
                    ? 'bg-yellow-500 border-yellow-300 text-black scale-110 shadow-[0_0_10px_rgba(234,179,8,0.5)]' 
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'}
                `}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={clearBets}
              disabled={isRolling || totalBet === 0}
              className="px-6 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} /> 清除
            </button>
            <button 
              onClick={rollDice}
              disabled={isRolling || totalBet === 0}
              className={`flex-1 md:flex-none md:w-48 py-3 rounded-xl font-black text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                ${isRolling ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] shadow-blue-600/30'}
              `}
            >
              {isRolling ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
              {isRolling ? '開盅...' : `下注 (${totalBet})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishPrawnCrab;
