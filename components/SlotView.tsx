
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { SLOT_SYMBOLS } from '../constants';
import { RotateCcw, Volume2, VolumeX, Sparkles, Coins, Zap, Trophy } from 'lucide-react';

interface SlotViewProps {
  supabase: any;
  userProfile: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

const SlotView: React.FC<SlotViewProps> = ({ supabase, userProfile, showNotification }) => {
  const [reels, setReels] = useState<string[][]>([
    ["🍉", "🍉", "🍉"],
    ["🍉", "🍉", "🍉"],
    ["🍉", "🍉", "🍉"]
  ]);
  const [spinning, setSpinning] = useState(false);
  const [betPerLine, setBetPerLine] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [winTotal, setWinTotal] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Background Music Logic
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
    }
    if (!isMuted && !spinning) {
        audioRef.current.play().catch(() => {});
    } else {
        audioRef.current.pause();
    }
    return () => audioRef.current?.pause();
  }, [isMuted, spinning]);

  const generateReel = () => {
    const allSymbols: string[] = [];
    SLOT_SYMBOLS.forEach(s => {
      for (let i = 0; i < s.weight; i++) allSymbols.push(s.icon);
    });
    return [
      allSymbols[Math.floor(Math.random() * allSymbols.length)],
      allSymbols[Math.floor(Math.random() * allSymbols.length)],
      allSymbols[Math.floor(Math.random() * allSymbols.length)]
    ];
  };

  const handleSpin = async () => {
    if (!userProfile || spinning) return;
    const totalBet = betPerLine * 5;
    if (userProfile.points < totalBet) return showNotification("積分不足", "error");

    setSpinning(true);
    setWinTotal(0);

    // 2x Fast speed animation simulation
    let spinCount = 0;
    const interval = setInterval(() => {
      setReels([generateReel(), generateReel(), generateReel()]);
      spinCount++;
      if (spinCount >= 10) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 50); // Fast interval
  };

  const finalizeSpin = async () => {
    const newReels = [generateReel(), generateReel(), generateReel()];
    setReels(newReels);

    const totalBet = betPerLine * 5;
    let winnings = 0;

    // Rows (0, 1, 2)
    [0, 1, 2].forEach(row => {
      if (newReels[0][row] === newReels[1][row] && newReels[1][row] === newReels[2][row]) {
        const symbol = SLOT_SYMBOLS.find(s => s.icon === newReels[0][row]);
        if (symbol) winnings += symbol.value * betPerLine;
      }
    });

    // Diagonals
    if (newReels[0][0] === newReels[1][1] && newReels[1][1] === newReels[2][2]) {
      const symbol = SLOT_SYMBOLS.find(s => s.icon === newReels[0][0]);
      if (symbol) winnings += symbol.value * betPerLine;
    }
    if (newReels[0][2] === newReels[1][1] && newReels[1][1] === newReels[2][0]) {
      const symbol = SLOT_SYMBOLS.find(s => s.icon === newReels[0][2]);
      if (symbol) winnings += symbol.value * betPerLine;
    }

    const netProfit = winnings - totalBet;
    const { data } = await supabase.from('profiles').update({ 
      points: userProfile!.points + netProfit 
    }).eq('id', userProfile!.id).select().single();

    if (winnings > 0) {
      setWinTotal(winnings);
      showNotification(`🎉 恭喜中獎！獲得 ${winnings.toLocaleString()} PT`, "info");
    }
    setSpinning(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
            <Zap className="text-yellow-500 animate-pulse" size={32}/>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">AI MEGA SLOTS</h1>
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">2X Turbo Speed Active</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-slate-800/80 px-8 py-3 rounded-2xl border border-white/5 text-center shadow-inner">
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Your Balance</p>
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-500" size={14}/>
                <span className="font-mono font-black text-white text-xl">{userProfile?.points.toLocaleString()}</span>
              </div>
           </div>
           <button 
             onClick={() => setIsMuted(!isMuted)} 
             className={`p-4 rounded-2xl transition-all active:scale-90 ${isMuted ? 'bg-slate-800 text-slate-500' : 'bg-yellow-500 text-black shadow-lg'}`}
           >
              {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slot Machine Display */}
        <div className="lg:col-span-2 bg-slate-950 rounded-[4rem] p-10 shadow-2xl border-b-[12px] border-slate-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
          
          <div className="grid grid-cols-3 gap-4 h-[300px] md:h-[400px]">
            {reels.map((reel, colIdx) => (
              <div key={colIdx} className="bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-between py-6 border-2 border-white/5 shadow-inner overflow-hidden">
                {reel.map((symbol, rowIdx) => (
                  <div key={rowIdx} className={`text-6xl md:text-8xl transition-all duration-75 flex items-center justify-center flex-1 w-full ${spinning ? 'blur-sm scale-90 opacity-50 translate-y-4' : 'scale-100 opacity-100'}`}>
                    {symbol}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {winTotal > 0 && !spinning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in zoom-in duration-300 rounded-[4rem]">
               <div className="text-center space-y-4">
                  <div className="bg-yellow-500 text-black px-8 py-3 rounded-full font-black text-2xl shadow-2xl flex items-center gap-3">
                    <Trophy size={28}/> BIG WIN!
                  </div>
                  <p className="text-5xl font-black text-white font-mono drop-shadow-[0_0_20px_rgba(234,179,8,1)]">+{winTotal.toLocaleString()}</p>
               </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
               <RotateCcw size={16} className="text-yellow-500"/> Betting Unit
             </h3>
             <div className="grid grid-cols-2 gap-3">
                {[100, 500, 1000, 5000].map(unit => (
                  <button 
                    key={unit}
                    onClick={() => setBetPerLine(unit)}
                    className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${betPerLine === unit ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                  >
                    {unit.toLocaleString()}
                  </button>
                ))}
             </div>
             <div className="mt-8 pt-8 border-t border-slate-50">
                <div className="flex justify-between items-end mb-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Total Bet (5 Lines)</p>
                   <p className="text-2xl font-black text-slate-900">{(betPerLine * 5).toLocaleString()} <span className="text-xs text-yellow-600">PT</span></p>
                </div>
                <button 
                  onClick={handleSpin}
                  disabled={spinning}
                  className={`w-full py-6 rounded-[2rem] font-black text-2xl transition-all shadow-2xl flex items-center justify-center gap-4 ${spinning ? 'bg-slate-100 text-slate-300' : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:scale-105 active:scale-95 border-b-[8px] border-red-800'}`}
                >
                  <Sparkles size={24}/> {spinning ? 'SPINNING...' : 'SPIN NOW'}
                </button>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-8 text-white">
             <p className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-4">Payout Table (3x Match)</p>
             <div className="grid grid-cols-3 gap-2">
                {SLOT_SYMBOLS.map(s => (
                  <div key={s.name} className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                     <span className="text-2xl block mb-1">{s.icon}</span>
                     <span className="text-[9px] font-black text-slate-400">x{s.value}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotView;
