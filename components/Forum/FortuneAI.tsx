
import React, { useState, useEffect } from 'react';
import { 
  Zap, Heart, Briefcase, TrendingUp, AlertTriangle, 
  Loader2, Sparkles, MapPin, Calendar, Clock, ChevronRight,
  Info, ShieldAlert, BarChart3, Fingerprint, Globe
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UserProfile } from '../../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface FortuneResult {
  daily: string;
  love: string;
  career: string;
  wealth: string;
  warning: string;
  isUpward: boolean;
}

const FortuneAI: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [birthTime, setBirthTime] = useState('12:00');
  const [location, setLocation] = useState('香港 (Hong Kong)');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [activeTab, setActiveTab] = useState<keyof FortuneResult>('daily');

  const runAnalysis = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const prompt = `你是一位精通量子命理與現代大數據的「獅子山 AI 終端」。
      用戶資料：
      出生日期：${birthDate}
      出生時間：${birthTime}
      當前位置：${location}
      性別：${userProfile?.gender || '保密'}
      
      請根據當前星象、地理位置座標以及即時市場景氣大數據，進行以下五大模組的深度分析。
      
      輸出格式必須為嚴格的 JSON：
      {
        "daily": "今日運程：包括每小時運勢曲線趨勢解讀與宜忌。",
        "love": "戀愛導航：依戀人格分析與正緣出現時機預測。",
        "career": "工作事業：職涯天賦分析與跳槽/晉升時機建議。",
        "wealth": "財富指引：正財與偏財強弱分析，包含保守/進取理財策略。",
        "warning": "厄運預警：識別低谷期並提供避險指南。",
        "isUpward": true
      }
      
      語氣要專業工程師風格，結合 Kongish 與廣東話，保持科技感與玄學深度。字數每項約 150 字。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      setResult(parsed as FortuneResult);
    } catch (err) {
      console.error("AI Fortune Analysis Error:", err);
      // Fallback
      setResult({
        daily: "大數據連線異常，建議今日多靜少動，保持核心系統穩定。",
        love: "暫時無法觀測感情波動，建議先愛自己，優化內部程式碼。",
        career: "職場景氣波動較大，目前適合進行技能重構 (Skill Refactoring)。",
        wealth: "偏財位處於離線狀態，建議採取保守理財協議。",
        warning: "偵測到數據溢出風險，請注意口舌是非引起的 Bug。",
        isUpward: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'daily', label: '今日運程', icon: <Calendar size={18} />, color: 'bg-indigo-500' },
    { id: 'love', label: '戀愛導航', icon: <Heart size={18} />, color: 'bg-pink-500' },
    { id: 'career', label: '工作事業', icon: <Briefcase size={18} />, color: 'bg-blue-500' },
    { id: 'wealth', label: '財富指引', icon: <TrendingUp size={18} />, color: 'bg-amber-500' },
    { id: 'warning', label: '厄運預警', icon: <ShieldAlert size={18} />, color: 'bg-red-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-slate-900 rounded-[32px] border border-fuchsia-500/30 shadow-[0_0_30px_rgba(192,38,211,0.2)]">
            <Zap size={36} className="text-fuchsia-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">QUANTUM FORTUNE AI</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">獅子山 AI 命理終端 v5.0.1 Stable</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-6 py-3 rounded-2xl">
           <Globe size={14} className="text-blue-500" />
           <span>加密連接：端對端數據映射中</span>
        </div>
      </div>

      {!result && !isLoading ? (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[48px] border border-slate-200 p-10 shadow-2xl relative overflow-hidden group transition-all hover:shadow-fuchsia-500/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Fingerprint size={16} className="text-fuchsia-500" /> 初始化數據 / Identity Input
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-2">出生日期 (SOLAR DATE)</label>
                      <input 
                        type="date" 
                        value={birthDate} 
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:border-fuchsia-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-2">出生時間 (BIRTH TIME)</label>
                      <input 
                        type="time" 
                        value={birthTime} 
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:border-fuchsia-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-2">當前地理位置 (LOCATION)</label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={location} 
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-bold text-slate-900 focus:border-fuchsia-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={runAnalysis}
                  className="w-full bg-slate-950 hover:bg-black text-white py-6 rounded-3xl font-black text-lg uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-4 group"
                >
                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform text-fuchsia-400" />
                  <span>量子運算初始化</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-6 text-slate-300 space-y-4 border border-white/5">
               <div className="flex items-center gap-3 text-fuchsia-400">
                 <Info size={18} />
                 <span className="text-xs font-black uppercase tracking-widest">系統引導指南</span>
               </div>
               <p className="text-xs font-medium leading-relaxed">
                 獅子山 AI 終端不僅計算先天命盤，更會掛接 Google 即時大數據分析市場景氣與星象波動。建議每日登入進行數據同步，獲取最精確的避險建議。
               </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex items-center justify-center">
             <div className="text-center space-y-6">
                <div className="w-64 h-64 mx-auto bg-slate-100 rounded-[64px] flex items-center justify-center text-slate-200 border-4 border-dashed border-slate-200 relative">
                   <Zap size={80} className="opacity-20" />
                   <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/5 to-blue-500/5 rounded-[64px]"></div>
                </div>
                <div className="max-w-xs mx-auto">
                   <h4 className="text-2xl font-black text-slate-900">天機系統未啟動</h4>
                   <p className="text-sm text-slate-400 font-medium mt-2">請輸入您的原始數據碼，讓 AI 終端為您映射未來維度。</p>
                </div>
             </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="min-h-[500px] flex flex-col items-center justify-center space-y-8 bg-white rounded-[64px] shadow-2xl border border-slate-100">
           <div className="relative">
             <div className="w-24 h-24 border-8 border-slate-100 border-t-fuchsia-500 rounded-full animate-spin"></div>
             <Zap size={32} className="absolute inset-0 m-auto text-fuchsia-500 animate-pulse" />
           </div>
           <div className="text-center">
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter">系統正在獲取量子態數據...</h3>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">正在同步 Google 市場大數據與星象相位座標</p>
           </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10 animate-in zoom-in duration-500">
          {/* 左側：模組切換 */}
          <div className="lg:col-span-4 space-y-3">
             {tabs.map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as keyof FortuneResult)}
                 className={`w-full flex items-center gap-5 p-6 rounded-[32px] transition-all border-2 group ${activeTab === tab.id ? 'bg-white border-fuchsia-500 shadow-xl shadow-fuchsia-500/10 scale-105 z-10' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'}`}
               >
                 <div className={`p-3 rounded-2xl ${activeTab === tab.id ? tab.color : 'bg-slate-200'} text-white transition-colors`}>
                   {tab.icon}
                 </div>
                 <div className="text-left">
                   <span className={`block font-black text-lg ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400'}`}>{tab.label}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Module Analysis</span>
                 </div>
                 <ChevronRight size={20} className={`ml-auto transition-transform ${activeTab === tab.id ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
               </button>
             ))}

             <div className="mt-8 p-6 bg-slate-950 rounded-[32px] text-white">
                <div className="flex items-center gap-3 mb-4">
                   <BarChart3 className="text-fuchsia-400" size={18} />
                   <span className="text-xs font-black uppercase tracking-widest">當前大數據能量場</span>
                </div>
                <div className="space-y-4">
                   <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-fuchsia-500 w-[78%]"></div>
                   </div>
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <span>陽性/剛強</span>
                      <span>陰性/柔美</span>
                   </div>
                </div>
                <button 
                  onClick={() => setResult(null)}
                  className="w-full mt-6 py-3 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  重新啟動計算系統
                </button>
             </div>
          </div>

          {/* 右側：詳細分析內容 */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[56px] border border-slate-200 p-8 md:p-14 shadow-2xl relative overflow-hidden h-full min-h-[600px] flex flex-col">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[100px] -mr-64 -mt-64"></div>
              
              <div className="relative z-10 space-y-10 flex-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                  <div className="flex items-center gap-5">
                     <div className={`p-4 rounded-[24px] ${tabs.find(t => t.id === activeTab)?.color} text-white shadow-lg`}>
                       {tabs.find(t => t.id === activeTab)?.icon}
                     </div>
                     <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight">{tabs.find(t => t.id === activeTab)?.label}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">AI 終端：深度映射解讀報告</p>
                     </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">生成維度</span>
                    <span className="text-xs font-bold text-fuchsia-600">Quantum Node #772</span>
                  </div>
                </div>

                <div className="text-slate-700 leading-relaxed text-xl md:text-2xl font-medium whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {result ? (result as any)[activeTab] : "數據解構中..."}
                </div>
              </div>

              {/* 底部警告 */}
              <div className="relative z-10 mt-12 bg-red-50 border border-red-100 p-8 rounded-[36px] flex items-start gap-5">
                 <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                 <div className="space-y-1">
                   <p className="text-xs text-red-900 leading-relaxed font-black uppercase tracking-[0.2em]">
                     工程警告：本結果只供參考娛樂之用不可盡信！
                   </p>
                   <p className="text-[10px] text-red-600 font-medium leading-relaxed">
                     Disclaimer: Generated by AI Engine for entertainment only. Do not make critical life decisions based solely on automated divination. 命運掌握在自己手中，拼搏才是硬道理。
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default FortuneAI;
