
import React, { useState } from 'react';
import { Sparkles, Cpu, ShieldAlert, RefreshCw, ChevronRight } from 'lucide-react';
import { TAROT_CARDS } from '../constants';

const TarotView: React.FC = () => {
  const [context, setContext] = useState<string>('');
  const [status, setStatus] = useState<'setup' | 'loading' | 'result'>('setup');
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const contexts = ['工作', '愛情', '財富', '家庭', '學業', '生活', '人緣', '朋友', '運程', '健康'];

  const startReading = async () => {
    if (!context) return;
    setStatus('loading');
    
    const tasks = [
      "正在初始化隨機數生成矩陣...",
      "正在加載 78 張塔羅大數據...",
      "正在映射用戶語義維度...",
      "正在執行蒙地卡羅模擬占卜...",
      "正在生成詳細解讀報告..."
    ];

    for (let i = 0; i < tasks.length; i++) {
      setLoadingText(tasks[i]);
      setProgress(((i + 1) * 20));
      await new Promise(r => setTimeout(r, 600));
    }

    const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    const isUpright = Math.random() > 0.3;
    
    setResult({
      card,
      isUpright,
      context
    });
    setStatus('result');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 頂部標題 */}
      <header className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 text-center space-y-2">
          <h1 className="text-4xl font-black italic tracking-tighter text-white">AI TAROT ENGINE</h1>
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
            <Cpu size={12}/> v2.8.5 STABLE • NEURAL MAPPING ACTIVE
          </div>
        </div>
      </header>

      {status === 'setup' && (
        <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 animate-in slide-in-from-bottom-8">
          <h2 className="text-xl font-black mb-8 text-slate-900 border-l-4 border-blue-500 pl-4 uppercase">STEP 1: 鎖定占卜維度</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {contexts.map(ctx => (
              <button 
                key={ctx}
                onClick={() => setContext(ctx)}
                className={`p-5 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                  context === ctx ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {ctx}
              </button>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {context ? `[維度已鎖定: ${context}]` : "請選擇一個關注的生命領域"}
            </p>
            <button 
              onClick={startReading}
              disabled={!context}
              className={`px-12 py-5 rounded-full font-black text-lg transition-all shadow-2xl flex items-center gap-3 ${
                context ? 'bg-slate-900 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              啟動深度神經占卜 <ChevronRight size={20}/>
            </button>
          </div>
        </section>
      )}

      {status === 'loading' && (
        <section className="bg-slate-900 p-20 rounded-[3rem] flex flex-col items-center justify-center gap-8 shadow-2xl">
          <div className="w-full max-w-sm bg-slate-800 h-1 rounded-full overflow-hidden shadow-inner">
             <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-blue-400 font-mono text-sm animate-pulse tracking-tight">{loadingText}</p>
        </section>
      )}

      {status === 'result' && result && (
        <section className="space-y-8 animate-in zoom-in-95 duration-700 pb-20">
          <div className="flex justify-center">
            <div className="w-64 h-96 bg-slate-900 rounded-[2.5rem] p-2 border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] group transition-all">
              <div className="w-full h-full bg-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                <span className="text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{result.card.emoji}</span>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-white">{result.card.name}</h3>
                  <span className={`inline-block mt-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    result.isUpright ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {result.isUpright ? "正位 (UPRIGHT)" : "逆位 (REVERSED)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
            <h2 className="text-xl font-black mb-6 text-slate-900 border-l-4 border-blue-500 pl-4 uppercase flex items-center gap-3">
               <Sparkles size={20} className="text-blue-500"/> 詳細解讀報告 (ANALYSIS)
            </h2>
            
            <div className="space-y-8 text-slate-600 leading-relaxed font-medium">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">核心意涵</p>
                  <p className="text-lg text-slate-800 font-bold">{result.card.keyword}</p>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">針對「{result.context}」的深度映射</p>
                  <p className="text-slate-700">
                    {result.card.meanings[result.context] || "數據模型分析中，請參考基本牌意。"}
                    {!result.isUpright && " 由於目前處於逆位狀態，暗示能量流動受阻，需警惕過度極端或溝通誤會。"}
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">建議策略</p>
                    <ul className="list-disc ml-5 space-y-1 text-sm font-bold">
                      <li>保持系統資訊透明，降低對接成本。</li>
                      <li>{result.isUpright ? "維持現有架構優化，不宜大規模重構。" : "考慮進行架構層級的回顧與修復。"}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">環境變數</p>
                    <p className="text-sm font-bold text-slate-500 italic">當前環境噪音較低，數據可信度：HIGH</p>
                  </div>
               </div>
            </div>

            <div className="mt-12 p-6 bg-red-50 rounded-3xl border border-red-100 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-red-600 font-black text-xs uppercase tracking-tighter">
                <ShieldAlert size={16}/> 系統提示 (SYSTEM NOTICE)
              </div>
              <p className="text-red-900 font-black text-base italic">「結果只供參考娛樂之用不可盡信！」</p>
              <p className="text-[9px] text-red-400 uppercase font-black">AI Generated entertainment data - Not for financial or legal decisions.</p>
            </div>

            <button 
              onClick={() => setStatus('setup')}
              className="mt-8 w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
            >
              <RefreshCw size={18}/> 重新初始化占卜引擎
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default TarotView;
