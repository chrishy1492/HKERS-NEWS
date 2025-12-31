
import React, { useState } from 'react';
import { Solar } from 'lunar-javascript';
import { Hand, Sparkles, Sun } from 'lucide-react';
import { FORTUNE_POEMS, SHICHEN_MAPPING } from '../constants';

export const FingerFortuneGame: React.FC = () => {
  const [dateTime, setDateTime] = useState(""); 
  const [result, setResult] = useState<{
    lunarStr: string;
    shichen: string;
    conclusion: string;
    poem: string[];
  } | null>(null);

  const handleCalculate = () => {
    if (!dateTime) return alert("請輸入日期和時間");
    
    const d = new Date(dateTime);
    const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0);
    const lunar = solar.getLunar();

    const lMonth = lunar.getMonth();
    const lDay = lunar.getDay();
    const hour = d.getHours();
    
    const shichenIndex = Math.floor((hour + 1) / 2) % 12;
    const shichenName = SHICHEN_MAPPING[shichenIndex];
    const sIndexForCalc = shichenIndex + 1;

    const results = ["空亡", "大安", "留連", "速喜", "赤口", "小吉"];
    let resIndex = (lMonth + lDay + sIndexForCalc - 2) % 6;
    if (resIndex < 0) resIndex += 6;

    const conclusion = results[resIndex];
    const poem = FORTUNE_POEMS[conclusion as keyof typeof FORTUNE_POEMS] || [];

    setResult({
      lunarStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      shichen: `${shichenName}時`,
      conclusion,
      poem
    });
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-yellow-600/30 min-h-[500px] text-slate-200 font-sans max-w-4xl mx-auto flex flex-col items-center relative overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
         <Hand size={300} />
      </div>

      <div className="w-full flex justify-center items-center mb-8 border-b border-yellow-600/30 pb-4 z-10">
        <h2 className="text-3xl font-bold text-yellow-500 flex items-center gap-3">
           <Sparkles className="animate-pulse" /> 掐指一算
        </h2>
      </div>

      {/* Optimized Input for Mobile (Requirement 58, 75) */}
      <div className="w-full max-w-lg bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl z-10 backdrop-blur-sm">
         <div className="space-y-6">
            <div>
               <label className="text-yellow-100/70 text-sm font-bold mb-2 flex items-center gap-2">
                  <Sun size={16} /> 選擇日期與時間
               </label>
               <input 
                 type="datetime-local" 
                 value={dateTime} 
                 onChange={e => setDateTime(e.target.value)}
                 className="w-full bg-white text-slate-900 border border-slate-600 rounded-xl p-4 text-lg font-bold shadow-inner outline-none focus:ring-4 focus:ring-yellow-500/50 appearance-none cursor-pointer"
               />
            </div>

            <button 
              onClick={handleCalculate}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold text-xl rounded-xl shadow-lg transform transition-all active:scale-95 flex justify-center items-center gap-2"
            >
               <Hand size={24} /> 誠心占卜
            </button>
         </div>
      </div>

      {result && (
        <div className="w-full max-w-2xl mt-8 animate-fade-in z-10">
           <div className="bg-slate-800/90 border-2 border-yellow-500/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-600 text-center">
                 <div>
                    <div className="text-xs text-slate-400 mb-1">農曆</div>
                    <div className="text-lg font-bold text-white">{result.lunarStr}</div>
                 </div>
                 <div>
                    <div className="text-xs text-slate-400 mb-1">時辰</div>
                    <div className="text-lg font-bold text-white">{result.shichen}</div>
                 </div>
              </div>

              <div className="text-center mb-6">
                 <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                    {result.conclusion}
                 </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                 {result.poem.map((line, i) => (
                    <p key={i} className="text-lg text-slate-300 leading-loose font-serif">
                       {line}
                    </p>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
