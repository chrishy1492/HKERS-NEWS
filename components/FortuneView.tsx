
import React, { useState } from 'react';
import { Moon, Sparkles, Clock, History } from 'lucide-react';
import { LUI_REN_RESULTS } from '../constants';

const FortuneView: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const getShichenIndex = (hour: number) => (Math.floor((hour + 1) / 2) % 12) + 1;

  const calculateLuck = () => {
    setLoading(true);
    // 模擬深度測算動效
    setTimeout(() => {
      const selectedDate = new Date(date);
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      const hour = new Date().getHours();
      const shichenIndex = getShichenIndex(hour);
      
      // 小六壬公式: (月 + 日 + 時 - 2) % 6
      const resIndex = (month + day + shichenIndex - 2) % 6;
      const finalResult = LUI_REN_RESULTS[resIndex];
      
      const shichens = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
      
      setResult({
        ...finalResult,
        shichen: shichens[shichenIndex - 1],
        date: date
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
       <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10 text-center space-y-4">
             <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/20">
                <Moon size={40} className="text-slate-900" />
             </div>
             <h2 className="text-4xl font-black tracking-tighter italic">掐指一算</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">玄學智慧 • 洞悉先機</p>
          </div>
       </div>

       <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2">
                   <Clock size={12}/> 選擇測算日期
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-500 font-bold transition-all" 
                />
             </div>
             <div className="flex items-end">
                <button 
                  onClick={calculateLuck}
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {loading ? '正在感應天地氣場...' : '開始掐指測算'}
                </button>
             </div>
          </div>

          {result && !loading && (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[2.5rem] border border-yellow-100 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                     <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-yellow-200">
                        <p className="text-[10px] text-slate-400 font-black">當前時辰</p>
                        <p className="font-black text-slate-900 text-xl">{result.shichen}時</p>
                     </div>
                     <div className={`px-6 py-2 rounded-full font-black text-sm border ${
                        result.luck === '大吉' ? 'bg-green-100 border-green-200 text-green-700' : 
                        result.luck === '吉' || result.luck === '小吉' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                        'bg-red-100 border-red-200 text-red-700'
                     }`}>
                        {result.luck}
                     </div>
                  </div>
                  
                  <div className="text-center space-y-6">
                     <h3 className="text-5xl font-black text-slate-900 tracking-tighter">【{result.name}】</h3>
                     <p className="text-xl font-serif text-slate-700 leading-relaxed italic px-4">
                        「{result.poem}」
                     </p>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-yellow-200 flex justify-center gap-4">
                     <div className="flex items-center gap-2 text-yellow-700 font-black text-xs uppercase">
                        <Sparkles size={14}/> 適合今日發帖互動
                     </div>
                  </div>
               </div>
            </div>
          )}
          
          <div className="mt-12 text-center text-slate-300 font-bold text-[10px] uppercase tracking-[0.3em]">
             Traditional Oracle Protocol v1.0
          </div>
       </div>
    </div>
  );
};

export default FortuneView;
