
import React, { useState } from 'react';
import { Solar } from 'lunar-javascript';
import { Hand, Sparkles, Sun, Clock } from 'lucide-react';
import { FORTUNE_POEMS, SHICHEN_MAPPING } from '../constants';

export const FingerFortuneGame: React.FC = () => {
  const [dateTime, setDateTime] = useState(""); 
  const [result, setResult] = useState<any>(null);

  const handleCalculate = () => {
    if (!dateTime) return alert("請輸入出生日期時間。");
    const d = new Date(dateTime);
    const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0);
    const lunar = solar.getLunar();

    const results = ["空亡", "大安", "留連", "速喜", "赤口", "小吉"];
    const shichenIdx = Math.floor((d.getHours() + 1) / 2) % 12;
    const resIdx = (lunar.getMonth() + lunar.getDay() + shichenIdx) % 6;

    const conclusion = results[resIdx];
    setResult({
      lunar: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      shichen: `${SHICHEN_MAPPING[shichenIdx]}時`,
      conclusion,
      poem: FORTUNE_POEMS[conclusion as keyof typeof FORTUNE_POEMS] || []
    });
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-yellow-600/30 text-slate-200 font-mono">
      <div className="flex items-center gap-3 mb-8 border-b border-yellow-600/20 pb-4">
        <Hand className="text-yellow-500 animate-bounce" />
        <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-tighter italic">掐指一算 (Divine Calculation)</h2>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
           <label className="block text-[10px] font-black text-yellow-500/50 mb-3 uppercase flex items-center gap-2">
             <Clock size={12}/> 初始化時間選取 (Native Picker)
           </label>
           <input 
             type="datetime-local" 
             value={dateTime} 
             onChange={e => setDateTime(e.target.value)}
             className="w-full bg-white text-slate-950 rounded-xl p-4 text-lg font-bold outline-none focus:ring-4 focus:ring-yellow-500/50 cursor-pointer"
           />
           <button onClick={handleCalculate} className="w-full mt-6 py-4 bg-yellow-600 text-white font-black text-xl rounded-xl shadow-lg hover:bg-yellow-500 active:scale-95 transition-all">
             立即開卦 (EXECUTE)
           </button>
        </div>

        {result && (
          <div className="bg-slate-800 border-2 border-yellow-500/50 rounded-2xl p-6 animate-fade-in text-center">
             <div className="text-xs text-slate-400 mb-2">{result.lunar} {result.shichen}</div>
             <div className="text-6xl font-black text-yellow-500 mb-6 drop-shadow-xl">{result.conclusion}</div>
             <div className="space-y-2 py-4 border-t border-slate-700 italic text-slate-300">
                {result.poem.map((p: string, i: number) => <p key={i}>{p}</p>)}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
