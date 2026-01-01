
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Heart, Zap, RefreshCw, ChevronRight, ShieldAlert } from 'lucide-react';
import { DEITIES, BLESSINGS_DATA } from '../constants';

const PrayView: React.FC = () => {
  const [selectedDeity, setSelectedDeity] = useState<any>(null);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'setup' | 'praying' | 'result'>('setup');
  const [resultBlessings, setResultBlessings] = useState<{ cat: string, text: string }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 音樂控制
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.2;
    }
    
    if (!isMuted && status !== 'setup') {
      audioRef.current.play().catch(() => console.log("Audio deferred"));
    } else {
      audioRef.current.pause();
    }
    
    return () => audioRef.current?.pause();
  }, [isMuted, status]);

  const toggleCat = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const handlePray = async () => {
    if (!selectedDeity || selectedCats.length === 0) return;
    setStatus('praying');
    
    // 模擬誠心跪拜
    await new Promise(r => setTimeout(r, 2000));
    
    const results = selectedCats.map(cat => {
      const phrases = BLESSINGS_DATA[cat];
      const randomText = phrases[Math.floor(Math.random() * phrases.length)];
      return { cat, text: randomText };
    });
    
    setResultBlessings(results);
    setStatus('result');
  };

  const reset = () => {
    setSelectedDeity(null);
    setSelectedCats([]);
    setResultBlessings([]);
    setStatus('setup');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 頂部導航與音效控制 */}
      <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
            <Sparkles className="text-yellow-500" size={20}/>
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter">VIRTUAL BLESSING</h1>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">雲端祈福系統 v1.0</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className={`p-4 rounded-2xl transition-all active:scale-90 ${isMuted ? 'bg-slate-800 text-slate-500' : 'bg-yellow-500 text-black shadow-lg'}`}
        >
          {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
        </button>
      </div>

      {status === 'setup' && (
        <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 space-y-10 animate-in slide-in-from-bottom-8">
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-900 border-l-4 border-yellow-500 pl-4 uppercase tracking-tighter">STEP 1: 選擇感應之神祇</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DEITIES.map(d => (
                <button 
                  key={d.id}
                  onClick={() => setSelectedDeity(d)}
                  className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all active:scale-95 group ${
                    selectedDeity?.id === d.id ? 'bg-yellow-500 border-yellow-500 text-black shadow-xl scale-105' : 'bg-slate-50 border-transparent hover:border-yellow-200'
                  }`}
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{d.icon}</span>
                  <span className="text-sm font-black tracking-tighter">{d.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-900 border-l-4 border-yellow-500 pl-4 uppercase tracking-tighter">STEP 2: 選擇祈福事項 (可多選)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(BLESSINGS_DATA).map(cat => (
                <button 
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className={`py-4 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${
                    selectedCats.includes(cat) ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center pt-6">
            <button 
              onClick={handlePray}
              disabled={!selectedDeity || selectedCats.length === 0}
              className={`group px-16 py-6 rounded-full font-black text-xl transition-all shadow-2xl flex items-center gap-4 ${
                selectedDeity && selectedCats.length > 0 ? 'bg-yellow-500 text-black hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              誠心跪拜領取願福語 <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em]">誠心則靈 • 日行一善 • 福報自來</p>
          </div>
        </section>
      )}

      {status === 'praying' && (
        <section className="bg-slate-900 p-24 rounded-[3.5rem] flex flex-col items-center justify-center gap-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent animate-pulse" />
          <div className="w-32 h-32 bg-yellow-500/20 rounded-full flex items-center justify-center animate-bounce border border-yellow-500/30">
            <Sparkles size={64} className="text-yellow-500 animate-pulse" />
          </div>
          <div className="text-center space-y-4 relative z-10">
            <p className="text-yellow-500 font-black text-2xl tracking-widest animate-pulse italic">正在感應 {selectedDeity?.title}...</p>
            <div className="w-48 bg-slate-800 h-1 rounded-full overflow-hidden mx-auto">
              <div className="bg-yellow-500 h-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
            </div>
          </div>
        </section>
      )}

      {status === 'result' && (
        <section className="space-y-8 animate-in zoom-in-95 duration-700 pb-20">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-1 rounded-[3.5rem] shadow-2xl">
            <div className="bg-white rounded-[3.4rem] p-10 md:p-14 text-center space-y-8">
              <div className="inline-block p-6 bg-yellow-50 rounded-[2.5rem] border border-yellow-100 mb-4">
                <span className="text-7xl">{selectedDeity?.icon}</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">✨ {selectedDeity?.title} ✨</h2>
                <p className="text-yellow-600 font-black text-xs uppercase tracking-[0.5em]">給您的專屬願福語</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {resultBlessings.map((b, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-yellow-50 hover:border-yellow-200 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 uppercase">{b.cat}</span>
                    </div>
                    <p className="text-slate-800 font-bold leading-relaxed">{b.text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4">
                <div className="flex items-center justify-center gap-2 text-yellow-500">
                  <Heart size={20} fill="currentColor" />
                  <p className="font-black italic text-lg tracking-tighter">大師開示</p>
                </div>
                <p className="text-slate-300 font-medium leading-relaxed italic">
                  「心誠則靈，日行一善，助人為快樂之本。勇於面對困難，熱愛家人與朋友，福報自會降臨您的身邊。」
                </p>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-center gap-2 text-red-600 font-black text-xs uppercase">
                  <ShieldAlert size={16}/> 系統提示 (SYSTEM NOTICE)
                </div>
                <p className="text-slate-400 font-bold text-xs leading-relaxed">
                  以上資訊只供參考，不可盡信。祝願大家好運和健康！<br/>
                  Virtual Blessing data generated for entertainment purposes only.
                </p>
                <button 
                  onClick={reset}
                  className="mt-6 px-12 py-5 rounded-full bg-slate-100 text-slate-400 font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-200 hover:text-slate-900 transition-all mx-auto"
                >
                  <RefreshCw size={18}/> 重新初始化祈福
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

export default PrayView;
