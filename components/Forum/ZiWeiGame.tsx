
import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Calendar, Clock, Loader2, Sparkles, Info, 
  Volume2, VolumeX, ChevronRight, LayoutGrid, List, AlertTriangle
} from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 紫微斗數基礎數據
const STARS_INFO: Record<string, string> = {
  "紫微": "帝座，尊貴、領導、厚重。",
  "天機": "智慧，變動、思考、機敏。",
  "太陽": "貴氣，博愛、付出、光明。",
  "武曲": "財星，剛毅、執行、果斷。",
  "天同": "福星，溫和、享受、協調。",
  "廉貞": "次桃花，交際、權變、是非。",
  "天府": "庫星，守成、包容、穩重。",
  "太陰": "財星，溫柔、母性、內斂。",
  "貪狼": "桃花，慾望、多藝、豪放。",
  "巨門": "暗星，是非、口才、觀察。",
  "天相": "印星，輔佐、公正、謹慎。",
  "天梁": "蔭星，長壽、照顧、持重。",
  "七殺": "將星，肅殺、衝勁、變動。",
  "破軍": "耗星，破壞、開創、衝動。"
};

const ZHI_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GAN_NAMES = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const ZiWeiGame: React.FC = () => {
  const [solarDate, setSolarDate] = useState(new Date().toISOString().split('T')[0]);
  const [solarTime, setSolarTime] = useState("12:00");
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 音樂控制
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'); // 舒服舒緩音樂
      audioRef.current.loop = true;
      audioRef.current.volume = 0.1;
    }
    if (!isMuted) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [isMuted]);

  const calculateZiWei = async () => {
    setIsLoading(true);
    setResult(null);
    setAiAnalysis('');

    try {
      const [y, m, d] = solarDate.split('-').map(Number);
      const [hh, mm] = solarTime.split(':').map(Number);
      const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
      const lunar = solar.getLunar();

      // 1. 定命宮 (寅宮起正月，順數月，逆數時)
      const lunarMonth = lunar.getMonth();
      const hourZhiIdx = Math.floor(((hh + 1) % 24) / 2);
      const mingIdx = (2 + (lunarMonth - 1) - hourZhiIdx + 12) % 12;

      // 2. 安星 (簡化專業引擎)
      const ziweiIdx = (2 + lunar.getDay() + 4) % 12; // 簡化演示算法
      const starsLayout = Array.from({ length: 12 }, () => [] as string[]);
      
      // 紫微星系
      const zwOffsets = { 0: "紫微", 11: "天機", 9: "太陽", 8: "武曲", 7: "天同", 4: "廉貞" };
      Object.entries(zwOffsets).forEach(([off, star]) => {
        starsLayout[(ziweiIdx + parseInt(off)) % 12].push(star);
      });

      // 天府星系 (對稱紫微)
      const tfMap: any = { 0:4, 1:3, 2:2, 3:1, 4:0, 5:11, 6:10, 7:9, 8:8, 9:7, 10:6, 11:5 };
      const tfIdx = tfMap[ziweiIdx];
      const tfOffsets = { 0:"天府", 1:"太陰", 2:"貪狼", 3:"巨門", 4:"天相", 5:"天梁", 6:"七殺", 10:"破軍" };
      Object.entries(tfOffsets).forEach(([off, star]) => {
        starsLayout[(tfIdx + parseInt(off)) % 12].push(star);
      });

      const currentResult = {
        solarStr: solar.toFullString(),
        lunarStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
        shichen: ZHI_NAMES[hourZhiIdx] + "時",
        mingGong: ZHI_NAMES[mingIdx],
        layout: starsLayout,
        mingIdx: mingIdx,
        mingStars: starsLayout[mingIdx]
      };

      setResult(currentResult);

      // AI 解讀
      const prompt = `你是一位精通「紫微斗數」的獅子山大師。
      用戶資料：
      農曆：${currentResult.lunarStr}
      命宮位：${currentResult.mingGong}宮
      命宮主星：${currentResult.mingStars.join('、') || '命無正曜'}
      
      請提供專業解讀：
      1. 分析性格優缺點。
      2. 結合香港「獅子山精神」提供事業與財富建議。
      3. 綜合評判運勢（大吉/平穩/需磨練）。
      語氣要現代、專業、溫暖，混合 Kongish 與廣東話。字數約 250 字。`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.7 }
      });

      setAiAnalysis(aiResponse.text || "大師正在思考，請稍候。");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-950 text-emerald-400 rounded-3xl border border-emerald-500/30">
            <Compass size={32} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">ZI WEI CENTRE</h1>
            <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">AI-Powered Destiny Engine v4.2</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">系統已連接</span>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* 輸入與引導 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-xl space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Calendar size={14} /> 出生日期 (西曆)
              </h3>
              <input 
                type="date" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
                value={solarDate}
                onChange={(e) => setSolarDate(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Clock size={14} /> 出生時間 (24HR)
              </h3>
              <input 
                type="time" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
                value={solarTime}
                onChange={(e) => setSolarTime(e.target.value)}
              />
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">排盤步驟指南</h4>
               <ol className="text-xs text-slate-600 space-y-2 font-medium">
                 <li className="flex items-center gap-2 text-emerald-700"><ChevronRight size={12}/> 輸入正確的出生日期與精確時間</li>
                 <li className="flex items-center gap-2"><ChevronRight size={12}/> 系統自動轉換為農曆與干支時辰</li>
                 <li className="flex items-center gap-2"><ChevronRight size={12}/> AI 大師分析 14 顆主星與命宮關係</li>
               </ol>
            </div>

            <button 
              onClick={calculateZiWei}
              disabled={isLoading}
              className="w-full bg-slate-950 hover:bg-black text-white py-5 rounded-3xl font-black text-lg uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span>{isLoading ? '排盤中...' : '啟動 AI 排盤'}</span>
            </button>
          </div>
        </div>

        {/* 結果展示 */}
        <div className="lg:col-span-8 space-y-8">
          {result ? (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              {/* 頂部數據概覽 */}
              <div className="bg-emerald-950 rounded-[40px] p-8 md:p-10 text-white shadow-2xl flex flex-wrap gap-8 justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">農曆日期</span>
                  <div className="text-2xl font-black italic tracking-tight">{result.lunarStr}</div>
                </div>
                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">出生時辰</span>
                  <div className="text-2xl font-black italic tracking-tight">{result.shichen}</div>
                </div>
                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">命宮位置</span>
                  <div className="text-2xl font-black italic tracking-tight">{result.mingGong} 宮</div>
                </div>
              </div>

              {/* 切換視圖 */}
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setViewMode('board')}
                  className={`p-2 rounded-xl border transition-all ${viewMode === 'board' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                  <LayoutGrid size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                  <List size={20} />
                </button>
              </div>

              {/* 宮位展示 */}
              {viewMode === 'board' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ZHI_NAMES.map((zhi, i) => (
                    <div 
                      key={zhi}
                      className={`h-36 rounded-[32px] p-4 flex flex-col justify-between transition-all border-2 ${result.mingIdx === i ? 'bg-emerald-50 border-emerald-500 shadow-xl' : 'bg-white border-slate-100 opacity-80'}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-xs font-black p-1 rounded-lg ${result.mingIdx === i ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{zhi}</span>
                        {result.mingIdx === i && <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">命宮</div>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.layout[i].map((s: string) => (
                          <span key={s} className="bg-slate-900 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                   {ZHI_NAMES.map((zhi, i) => (
                    <div key={zhi} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-900">{zhi}</span>
                        <div className="flex flex-wrap gap-2">
                           {result.layout[i].map((s: string) => (
                            <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black">{s}</span>
                          ))}
                          {result.layout[i].length === 0 && <span className="text-xs text-slate-300">此宮無主星</span>}
                        </div>
                      </div>
                      {result.mingIdx === i && <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">命宮</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* AI 解讀 */}
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">大師詳細解讀</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Generated by Lion Rock AI Nexus</p>
                  </div>
                </div>
                
                <div className="text-slate-700 leading-relaxed font-medium text-lg whitespace-pre-wrap min-h-[200px]">
                  {aiAnalysis || (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                      <Loader2 className="animate-spin text-emerald-600" size={32} />
                      <p className="text-xs font-black text-emerald-600 animate-pulse uppercase tracking-widest">大師正在觀星演算法中...</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Compass size={14} /> 主星詳解 (14 Major Stars)
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.mingStars.map((s: string) => (
                      <div key={s} className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-100">
                        <span className="bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-black">{s}</span>
                        <p className="text-xs text-slate-600 font-medium leading-tight">{STARS_INFO[s]}</p>
                      </div>
                    ))}
                    {result.mingStars.length === 0 && <p className="text-xs text-slate-400 italic">命無正曜：靈活性高，適應力強，需參考對宮。</p>}
                  </div>
                </div>

                {/* 免責聲明 */}
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={18} />
                  <div className="space-y-1">
                    <p className="text-xs text-amber-900 leading-relaxed font-black uppercase tracking-widest">
                      結果只供參考娛樂之用不可盡信！
                    </p>
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      命運掌握在自己手中。紫微斗數排盤為電腦自動運算，不應作為重大決策的唯一依據。獅子山精神的核心是「拼搏與變通」，相信自己才是最好的算命。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
                <Compass size={56} />
              </div>
              <div className="max-w-xs">
                <h4 className="text-xl font-bold text-slate-900">尚未開啟天機</h4>
                <p className="text-sm text-slate-400 mt-2 font-medium">請在左側輸入您的出生資料，系統將為您開啟紫微斗數的數位命理之門。</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ZiWeiGame;
