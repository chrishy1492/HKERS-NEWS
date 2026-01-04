
import React, { useState } from 'react';
import { Sparkles, Moon, Sun, Scroll, RefreshCw, Calendar, Clock, ChevronRight, Fingerprint, Eye, Compass, Star, Cpu, Hand } from 'lucide-react';
import { Profile } from '../types';
import { Solar } from 'lunar-javascript';
import { GoogleGenAI } from "@google/genai";
import TarotGame from './games/TarotGame';
import ZiWeiDouShu from './games/ZiWeiDouShu';
import AIFortune from './games/AIFortune';
import Worship from './games/Worship';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

// Xiao Liu Ren Results
const RESULTS = [
  { 
    name: "空亡", 
    type: "凶", 
    color: "text-slate-400", 
    poem: "空亡事不祥，陰人多乖張，求財無利益，行人有災殃。失物尋不見，官事有刑傷，病人逢暗鬼，解禳保安康。" 
  },
  { 
    name: "大安", 
    type: "大吉", 
    color: "text-green-500", 
    poem: "大安事事昌，求財在坤方，失物去不遠，宅舍保安康。行人身未動，病者主無妨，將軍回田野，仔細更推詳。" 
  },
  { 
    name: "留連", 
    type: "凶", 
    color: "text-slate-500", 
    poem: "留連事難成，求謀日未明，官事凡宜緩，去者未回程。失物南方見，急討方心稱，更須防口舌，人口且平平。" 
  },
  { 
    name: "速喜", 
    type: "上吉", 
    color: "text-red-500", 
    poem: "速喜喜來臨，求財向南行，失物申未午，逢人路上尋。官事有福德，病者無禍侵，田宅六畜吉，行人有信音。" 
  },
  { 
    name: "赤口", 
    type: "凶", 
    color: "text-orange-600", 
    poem: "赤口主口舌，官非切宜防，失物速速討，行人有驚慌。六畜多作怪，病者出西方，更須防咀咒，誠恐染瘟皇。" 
  },
  { 
    name: "小吉", 
    type: "吉", 
    color: "text-yellow-500", 
    poem: "小吉最吉昌，路上好商量，陰人來報喜，失物在坤方。行人即便至，交關甚是強，凡事皆和合，病者叩窮蒼。" 
  },
];

const SHICHEN_MAPPING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const FortuneTelling: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [mode, setMode] = useState<'ancient' | 'tarot' | 'ziwei' | 'quantum' | 'worship'>('ancient');
  
  // Xiao Liu Ren State
  const [loading, setLoading] = useState(false);
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputTime, setInputTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  
  const [resultData, setResultData] = useState<{
    lunarStr: string;
    shichen: string;
    result: typeof RESULTS[0];
    aiInterpretation: string;
  } | null>(null);

  const calculateFortune = async () => {
    if (!profile) return alert('請先登入！');
    if (profile.points < 100) return alert('積分不足 (每次需要 100 積分)');

    setLoading(true);
    setResultData(null);

    try {
      const { error } = await supabase.from('profiles').update({
        points: profile.points - 100
      }).eq('id', profile.id);

      if (error) throw error;
      onUpdate();

      const dateParts = inputDate.split('-').map(Number);
      const timeParts = inputTime.split(':').map(Number);
      
      const solar = Solar.fromYmd(dateParts[0], dateParts[1], dateParts[2]);
      const lunar = solar.getLunar();
      
      const lMonth = lunar.getMonth();
      const lDay = lunar.getDay();
      
      const shichenIndex = Math.floor((timeParts[0] + 1) / 2) % 12; 
      const shichenName = SHICHEN_MAPPING[shichenIndex];
      const shichenNum = shichenIndex + 1;

      // Small Six Ren Formula
      let resIndex = (lMonth + lDay + shichenNum - 2) % 6;
      if (resIndex < 0) resIndex += 6; // Handle JS modulo on negatives if any logic changes
      
      const resultItem = RESULTS[resIndex];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Role: Master Fortune Teller (算命大師).
        Task: Interpret a "Small Six Ren" (小六壬) divination result.
        
        Input Context:
        - Gregorian: ${inputDate} ${inputTime}
        - Lunar: ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}
        - Shichen: ${shichenName}時
        - Result: ${resultItem.name} (${resultItem.type})
        - Poem: ${resultItem.poem}
        
        Instruction:
        Provide a concise, mystical, yet warm interpretation in Traditional Chinese (Cantonese flavor acceptable).
        Explain what "${resultItem.name}" means for the user's current situation (General luck, Wealth, or Safety).
        Limit to 100 words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const interpretation = response.text || "天機不可洩漏，請自行參悟詩句。";

      setResultData({
        lunarStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
        shichen: shichenName,
        result: resultItem,
        aiInterpretation: interpretation
      });

    } catch (err) {
      console.error(err);
      alert('運算過程中發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* Mode Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-white/10 flex gap-2 flex-wrap justify-center">
           <button 
             onClick={() => setMode('ancient')}
             className={`px-4 md:px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${mode === 'ancient' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Compass size={16} /> 古法小六壬
           </button>
           <button 
             onClick={() => setMode('tarot')}
             className={`px-4 md:px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${mode === 'tarot' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Eye size={16} /> AI 塔羅引擎
           </button>
           <button 
             onClick={() => setMode('ziwei')}
             className={`px-4 md:px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${mode === 'ziwei' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Star size={16} /> 紫微斗數 (New)
           </button>
           <button 
             onClick={() => setMode('quantum')}
             className={`px-4 md:px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${mode === 'quantum' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Cpu size={16} /> AI 量子命理
           </button>
           <button 
             onClick={() => setMode('worship')}
             className={`px-4 md:px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${mode === 'worship' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Hand size={16} /> 拜神祈福
           </button>
        </div>
      </div>

      {mode === 'tarot' && <TarotGame profile={profile} supabase={supabase} onUpdate={onUpdate} />}
      
      {mode === 'ziwei' && <ZiWeiDouShu profile={profile} supabase={supabase} onUpdate={onUpdate} />}

      {mode === 'quantum' && <AIFortune profile={profile} supabase={supabase} onUpdate={onUpdate} />}
      
      {mode === 'worship' && <Worship profile={profile} supabase={supabase} onUpdate={onUpdate} />}

      {mode === 'ancient' && (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl relative max-w-4xl mx-auto">
          {/* Decorative Background for Ancient Mode */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-amber-600/20 to-orange-600/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-amber-500/30 mx-auto rotate-3 hover:rotate-0 transition-transform duration-500">
              <Fingerprint className="text-amber-500" size={40} />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4">AI 掐指一算 • 小六壬</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              輸入西曆日期與時間，系統自動轉換農曆與時辰，結合古法「小六壬」算法與現代 AI 進行吉凶占卜。每次測算扣除 100 積分。
            </p>
          </div>

          <div className="p-8 md:p-12 bg-slate-950/50">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1">
                  <Calendar size={12} /> 選擇日期 (Date)
                </label>
                <input 
                  type="date" 
                  value={inputDate}
                  onChange={e => setInputDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1">
                  <Clock size={12} /> 選擇時間 (Time)
                </label>
                <input 
                  type="time" 
                  value={inputTime}
                  onChange={e => setInputTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {!resultData ? (
              <button 
                onClick={calculateFortune}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(217,119,6,0.2)] hover:shadow-[0_15px_40px_rgba(217,119,6,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 text-lg"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                {loading ? '大師推算中...' : '立即掐指一算 (100 pts)'}
              </button>
            ) : (
              <div className="animate-in zoom-in duration-500">
                <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 text-9xl text-white/5 font-black select-none pointer-events-none">
                    {resultData.result.name}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-slate-800 pb-8">
                    <div>
                      <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">轉換結果</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl">
                          <span className="text-slate-400 text-xs">農曆日期</span>
                          <span className="text-white font-bold">{resultData.lunarStr}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl">
                          <span className="text-slate-400 text-xs">對應時辰</span>
                          <span className="text-amber-500 font-bold">{resultData.shichen}時</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">卦象結果</h3>
                      <div className="text-center">
                        <div className={`text-6xl font-black mb-2 ${resultData.result.color}`}>{resultData.result.name}</div>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-white">{resultData.result.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Scroll size={16} className="text-amber-500" />
                        <span className="font-bold text-white">古訣</span>
                      </div>
                      <p className="text-slate-400 italic bg-slate-950/50 p-4 rounded-xl text-sm leading-relaxed border-l-2 border-slate-700">
                        "{resultData.result.poem}"
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-indigo-400" />
                        <span className="font-bold text-white">AI 大師解讀</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {resultData.aiInterpretation}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setResultData(null)}
                    className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    重新測算
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FortuneTelling;
