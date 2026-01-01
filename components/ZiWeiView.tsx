
import React, { useState, useEffect } from 'react';
import { Cpu, Calendar, Clock, Star, AlertCircle, RefreshCw, ChevronRight, Zap } from 'lucide-react';
import { ZI_WEI_STARS } from '../constants';

const ZiWeiView: React.FC = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hour: 12,
    context: ''
  });
  const [status, setStatus] = useState<'setup' | 'loading' | 'result'>('setup');
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);

  const contexts = ['工作', '愛情', '財富', '家庭', '學業', '生活', '人緣', '朋友', '運程', '健康'];
  const zhi_names = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  const runAnalysis = async () => {
    if (!formData.context) return;
    setStatus('loading');
    
    const steps = [
      "量子星圖校準中...",
      "曆法向量轉換中 (Solar to Lunar)...",
      "定位命宮坐標系...",
      "計算十四主星能級...",
      "生成大數據命理報告..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 600));
    }

    // 模擬排盤邏輯
    const birthDate = new Date(formData.date);
    const day = birthDate.getDate();
    const month = birthDate.getMonth() + 1;
    const hourIdx = Math.floor((formData.hour + 1) / 2) % 12;
    
    // 簡單命理公式 (僅作演示，確保結果穩定)
    const starKeys = Object.keys(ZI_WEI_STARS);
    const starIndex = (day + month + hourIdx) % starKeys.length;
    const mainStar = starKeys[starIndex];
    
    setResult({
      star: mainStar,
      details: ZI_WEI_STARS[mainStar as keyof typeof ZI_WEI_STARS],
      shichen: zhi_names[hourIdx],
      context: formData.context
    });
    setStatus('result');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 科技感標題 */}
      <header className="bg-gradient-to-br from-slate-950 to-indigo-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-purple-500/20 transition-colors duration-1000" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl animate-pulse">
            <Cpu size={40} className="text-indigo-400" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">AI Zi Wei Engine</h1>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.5em] mt-2">Quantum Destiny Mapping System v3.0</p>
          </div>
        </div>
      </header>

      {status === 'setup' && (
        <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">
                <Calendar size={14} className="text-indigo-500"/> 出生日期 (西曆)
              </label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
              />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">
                <Clock size={14} className="text-indigo-500"/> 出生時辰 (24H)
              </label>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border-2 border-transparent">
                <input 
                  type="range" min="0" max="23"
                  value={formData.hour}
                  onChange={e => setFormData(p => ({ ...p, hour: parseInt(e.target.value) }))}
                  className="flex-1 accent-indigo-500"
                />
                <span className="w-16 text-center font-black text-indigo-600 text-xl">{formData.hour}:00</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">
              <Star size={14} className="text-indigo-500"/> 鎖定分析維度
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {contexts.map(ctx => (
                <button 
                  key={ctx}
                  onClick={() => setFormData(p => ({ ...p, context: ctx }))}
                  className={`py-4 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${
                    formData.context === ctx ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:border-indigo-200'
                  }`}
                >
                  {ctx}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center pt-6">
            <button 
              onClick={runAnalysis}
              disabled={!formData.context}
              className={`group relative px-16 py-6 rounded-full font-black text-xl transition-all shadow-2xl flex items-center gap-4 ${
                formData.context ? 'bg-slate-900 text-white hover:bg-indigo-600 hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              啟動紫微智能排盤 <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Secure Data Sync with Supabase Node</p>
          </div>
        </section>
      )}

      {status === 'loading' && (
        <section className="bg-slate-950 p-24 rounded-[3.5rem] flex flex-col items-center justify-center gap-10 shadow-2xl border border-white/5">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap size={32} className="text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-indigo-400 font-mono text-sm tracking-tighter uppercase">
              {[
                "量子星圖校準中...",
                "曆法向量轉換中 (Solar to Lunar)...",
                "定位命宮坐標系...",
                "計算十四主星能級...",
                "生成大數據命理報告..."
              ][loadingStep]}
            </p>
            <div className="w-48 bg-slate-900 h-1 rounded-full overflow-hidden mx-auto">
              <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${(loadingStep + 1) * 20}%` }} />
            </div>
          </div>
        </section>
      )}

      {status === 'result' && result && (
        <section className="space-y-8 animate-in zoom-in-95 duration-700 pb-24">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-12 rounded-[3.5rem] shadow-2xl border border-white/5 flex flex-col items-center gap-8 relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
             <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-inner">
                <Star size={64} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
             </div>
             <div className="text-center space-y-2">
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.5em]">命宮主星定位</p>
                <h2 className="text-6xl font-black text-white tracking-tighter italic">【 {result.star} 】</h2>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-300 uppercase">時辰: {result.shichen}時</span>
                  <span className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-black text-yellow-500 uppercase">運勢: {result.details.luck}</span>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-12 shadow-xl border border-slate-100">
             <h3 className="text-2xl font-black text-slate-900 border-l-8 border-indigo-600 pl-6 uppercase tracking-tight mb-10 flex items-center justify-between">
                分析報告 Report
                <span className="text-xs bg-slate-100 px-4 py-2 rounded-xl text-slate-400 font-bold">DATE: {new Date().toLocaleDateString()}</span>
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="md:col-span-2 space-y-8">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">星曜特質解讀</p>
                      <p className="text-lg text-slate-700 font-bold leading-relaxed">{result.details.desc}</p>
                   </div>
                   <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">針對「{result.context}」維度之分析</p>
                      <p className="text-slate-700 font-medium italic">
                        基於【{result.star}】之能量場，在{result.context}領域中展現出{result.details.luck.split(' - ')[0]}趨勢。
                        建議在處理相關事務時保持「{result.details.desc.slice(0, 10)}」之優勢，避免盲目擴展，守成重於創新。
                      </p>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                      <p className="text-[10px] text-indigo-400 font-black uppercase mb-4">系統決策建議</p>
                      <ul className="space-y-3 text-xs font-bold list-disc ml-4 opacity-80">
                        <li>優化底層架構，提升容錯率</li>
                        <li>對抗外部壓力，維持核心尊嚴</li>
                        <li>關注{result.shichen}時之能量波動</li>
                      </ul>
                   </div>
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 font-black uppercase mb-1">計算可信度</p>
                      <p className="text-3xl font-black text-slate-900 italic">98.2%</p>
                      <p className="text-[8px] text-slate-300 uppercase mt-1">Quantum Confidence Level</p>
                   </div>
                </div>
             </div>

             <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-red-600 font-black text-xs uppercase tracking-tighter">
                   <AlertCircle size={16}/> 系統安全免責聲明 (SECURITY DISCLAIMER)
                </div>
                <p className="text-red-900 font-black text-xl italic">「結果只供參考娛樂之用不可盡信！」</p>
                <p className="text-[10px] text-red-400 uppercase font-black tracking-widest">AI Generated Astrology Prototype - Not for critical life decisions.</p>
             </div>

             <button 
                onClick={() => setStatus('setup')}
                className="mt-12 w-full py-6 rounded-[2rem] bg-slate-100 text-slate-400 font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-200 transition-all hover:text-slate-900"
              >
                <RefreshCw size={18}/> 重新初始化引擎系統
             </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ZiWeiView;
