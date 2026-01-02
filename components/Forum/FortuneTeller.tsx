
import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, Hand, Info, Loader2, Send, History } from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SIX_LIUREN = [
  { name: "空亡", poem: "空亡事不祥，陰人多乖張，求財無利益，行人有災殃。失物尋不見，官事有刑傷，病人逢暗鬼，解禳保安康。", meaning: "大凶，代表事情落空、虛假、不安。" },
  { name: "大安", poem: "大安事事昌，求財在坤方，失物去不遠，宅舍保安康。行人身未動，病者主無妨，將軍回田野，仔細更推詳。", meaning: "大吉，代表事情平穩、長久、吉祥。" },
  { name: "留連", poem: "留連事難成，求謀日未明，官事凡宜緩，去者未回程。失物南方見，急討方心稱，更須防口舌，人口且平平。", meaning: "中下，代表事情停滯、糾纏、猶豫。" },
  { name: "速喜", poem: "速喜喜來臨，求財向南行，失物申未午，逢人路上尋。官事有福德，病者無禍侵，田宅六畜吉，行人有信音。", meaning: "中上，代表喜事臨門、迅速、有利。" },
  { name: "赤口", poem: "赤口主口舌，官非切宜防，失物速速討，行人有驚慌。六畜多作怪，病者出西方，更須防咀咒，誠恐染瘟皇。", meaning: "凶，代表口舌是非、衝突、驚擾。" },
  { name: "小吉", poem: "小吉最吉昌，路上好商量，陰人來報喜，失物在坤方。行人即便至，交關甚是強，凡事皆和合，病者叩窮蒼。", meaning: "小吉，代表事情和合、有貴人、順利。" }
];

const SHICHEN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const FortuneTeller: React.FC = () => {
  const [solarDate, setSolarDate] = useState(new Date().toISOString().split('T')[0]);
  const [solarTime, setSolarTime] = useState(new Date().toTimeString().slice(0, 5));
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 當日期或時間改變時，自動計算農曆與時辰
  const [lunarInfo, setLunarInfo] = useState<any>(null);

  useEffect(() => {
    const [year, month, day] = solarDate.split('-').map(Number);
    const [hour, min] = solarTime.split(':').map(Number);
    const solar = Solar.fromYmdHms(year, month, day, hour, min, 0);
    const lunar = solar.getLunar();
    
    // 時辰序數 (1-12)
    const shichenIdx = Math.floor(((hour + 1) % 24) / 2);
    const shichenName = SHICHEN[shichenIdx];

    setLunarInfo({
      lunarDateStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      lunarMonth: lunar.getMonth(),
      lunarDay: lunar.getDay(),
      shichenIdx: shichenIdx + 1,
      shichenName: shichenName
    });
  }, [solarDate, solarTime]);

  const calculateFortune = async () => {
    if (!lunarInfo) return;
    setIsLoading(true);
    setAiInsight('');

    // 小六壬計算法: (月 + 日 + 時 - 2) % 6
    const hexIndex = (lunarInfo.lunarMonth + lunarInfo.lunarDay + lunarInfo.shichenIdx - 2) % 6;
    const finalHex = SIX_LIUREN[hexIndex];
    setResult(finalHex);

    try {
      const prompt = `你是一位精通易經與小六壬的「獅子山命理大師」。
      現在使用者占卜出卦象：【${finalHex.name}】。
      使用者詢問的問題是：「${query || '當前運勢'}」。
      農曆日期：${lunarInfo.lunarDateStr}，時辰：${lunarInfo.shichenName}時。
      請針對這個卦象與問題，給出一段結合「獅子山精神」的解卦建議。
      語氣要專業、親切，混合廣東話與英文 (Kongish) 更有共鳴。
      字數約 150 字。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.8 }
      });
      setAiInsight(response.text || "大師暫時閉關，請參考卦詩內容。");
    } catch (err) {
      console.error(err);
      setAiInsight("AI 連線失敗，請以傳統卦詩為準。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* 標題區域 */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-purple-100 text-purple-600 rounded-2xl mb-4">
          <Hand size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">掐指一算 AI 占卜</h1>
        <p className="text-slate-500 font-medium">Lion Rock AI 結合傳統「小六壬」預測前程</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 輸入區域 */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Calendar size={14} /> 選擇西曆日期與時間
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="date" 
                className="premium-input" 
                value={solarDate} 
                onChange={(e) => setSolarDate(e.target.value)}
              />
              <input 
                type="time" 
                className="premium-input" 
                value={solarTime} 
                onChange={(e) => setSolarTime(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
            <h4 className="text-xs font-black uppercase text-purple-400 tracking-widest mb-3">自動轉換結果</h4>
            {lunarInfo && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">農曆：</span>
                  <span className="text-sm font-black text-purple-700">{lunarInfo.lunarDateStr}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">時辰：</span>
                  <span className="text-sm font-black text-purple-700">{lunarInfo.shichenName} 時</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Sparkles size={14} /> 請問大師何事？ (選填)
            </h3>
            <textarea 
              className="premium-input min-h-[100px] py-4"
              placeholder="例如：搵工順唔順利？搬屋好唔好？或者直接留空看整體運勢..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={calculateFortune}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-[24px] shadow-xl shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Hand size={20} />}
            <span>{isLoading ? '大師計算中...' : '開始掐指占卜'}</span>
          </button>
        </div>

        {/* 結果區域 */}
        <div className="space-y-6">
          {result ? (
            <div className="bg-slate-900 rounded-[40px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              
              <div className="relative z-10 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-200 text-[10px] font-black uppercase tracking-widest">
                  占卜結果 / Divination Result
                </div>
                
                <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  {result.name}
                </h2>
                
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm italic text-slate-300 leading-relaxed text-lg">
                  「{result.poem}」
                </div>

                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">大師解說 / AI Insight</span>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-slate-200 leading-relaxed">
                    {aiInsight || (
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin text-purple-400" size={16} />
                        <span>AI 大師正在解讀卦象...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Hand size={40} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-400">尚未起卦</h4>
                <p className="text-sm text-slate-400">請在左側輸入資料並點擊開始占卜</p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
            <Info className="text-amber-500 flex-shrink-0 mt-1" size={18} />
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              <strong>小六壬說明：</strong> 小六壬為傳統民間簡易占卜法，以月、日、時推算。結果僅供參考，正所謂「命由天定，運由人改」，凡事應以平常心對待，努力不懈方為獅子山精神之本。
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .premium-input {
          width: 100%;
          background-color: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 16px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          transition: all 0.2s;
        }
        .premium-input:focus {
          border-color: #9333ea;
          outline: none;
          background-color: white;
          box-shadow: 0 0 0 5px rgba(147, 51, 234, 0.1);
        }
      `}</style>
    </div>
  );
};

export default FortuneTeller;
