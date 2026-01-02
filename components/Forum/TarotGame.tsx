
import React, { useState, useEffect } from 'react';
import { Sparkles, Hexagon, Info, Loader2, RefreshCw, ChevronRight, Eye } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TAROT_CATEGORIES = ['工作', '愛情', '財富', '家庭', '學業', '生活', '人緣', '朋友', '運程', '健康'];

const MAJOR_ARCANA = [
  { id: 0, name: "愚者 (The Fool)", keyword: "開端、冒險、純真" },
  { id: 1, name: "魔術師 (The Magician)", keyword: "創造力、技能、意志" },
  { id: 2, name: "女祭司 (The High Priestess)", keyword: "直覺、潛意識、智慧" },
  { id: 3, name: "皇后 (The Empress)", keyword: "豐饒、母性、感官" },
  { id: 4, name: "皇帝 (The Emperor)", keyword: "權威、結構、穩定" },
  { id: 5, name: "教皇 (The Hierophant)", keyword: "傳統、精神引導、體制" },
  { id: 6, name: "戀人 (The Lovers)", keyword: "選擇、結合、價值觀" },
  { id: 7, name: "戰車 (The Chariot)", keyword: "意志力、勝利、自我控制" },
  { id: 8, name: "力量 (Strength)", keyword: "內在勇氣、慈悲、耐心" },
  { id: 9, name: "隱士 (The Hermit)", keyword: "內省、尋求、孤獨" },
  { id: 10, name: "命運之輪 (Wheel of Fortune)", keyword: "命運、轉折、循環" },
  { id: 11, name: "正義 (Justice)", keyword: "因果、真相、平衡" },
  { id: 12, name: "倒吊人 (The Hanged Man)", keyword: "視角轉換、犧牲、等待" },
  { id: 13, name: "死神 (Death)", keyword: "結束、轉化、新生" },
  { id: 14, name: "節制 (Temperance)", keyword: "平衡、融合、節制" },
  { id: 15, name: "惡魔 (The Devil)", keyword: "束縛、物質主義、成癮" },
  { id: 16, name: "高塔 (The Tower)", keyword: "突變、災難、覺醒" },
  { id: 17, name: "星星 (The Star)", keyword: "希望、啟發、寧靜" },
  { id: 18, name: "月亮 (The Moon)", keyword: "幻想、恐懼、潛意識" },
  { id: 19, name: "太陽 (The Sun)", keyword: "活力、成功、純真" },
  { id: 20, name: "審判 (Judgement)", keyword: "召喚、重生、評價" },
  { id: 21, name: "世界 (The World)", keyword: "圓滿、成就、旅程" }
];

const TarotGame: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const drawCard = async () => {
    if (!selectedCategory) return;
    setIsDrawing(true);
    setIsAiLoading(true);
    setResult(null);
    setIsFlipped(false);
    setAiAnalysis('');

    // High-tech ritual delay
    await new Promise(r => setTimeout(r, 1200));

    const card = MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)];
    const isUpright = Math.random() > 0.3; // 70% chance for upright
    
    setResult({ card, isUpright });
    setIsDrawing(false);

    // AI Interpretation via Gemini 3 Pro
    try {
      const prompt = `你是一位精通塔羅與神經網路占卜的「獅子山塔羅大師」。
      現在使用者占卜關於【${selectedCategory}】的問題。
      抽出卡片：【${card.name}】，方向：【${isUpright ? '正位' : '逆位'}】。
      這張牌的核心關鍵字是：${card.keyword}。
      
      請提供專業且詳細的解讀：
      1. 解釋這張牌在${selectedCategory}方面的深層意涵。
      2. 結合香港「獅子山精神」提供具體的執行建議。
      語氣要科技感十足但充滿智慧，混合廣東話與 English (Kongish) 更有共鳴。
      回覆字數約 200 字。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { temperature: 0.8 }
      });
      setAiAnalysis(response.text || "大師正在重新整理數據，請稍候。");
    } catch (err) {
      console.error(err);
      setAiAnalysis("AI Engine 數據連線異常，請根據牌面關鍵字自行領悟。");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-1000">
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 bg-indigo-950 text-indigo-400 rounded-3xl border border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
          <Hexagon size={40} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">AI Tarot Engine</h1>
          <p className="text-indigo-600 font-bold tracking-widest text-xs uppercase mt-2">v3.0.0 Stable | Lion Rock Cyber-Occult</p>
        </div>
      </header>

      {!result ? (
        <div className="bg-white rounded-[48px] border border-slate-200 shadow-2xl p-8 md:p-12 space-y-10">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <Eye size={24} className="text-indigo-600" /> 選擇占卜維度 / Select Dimension
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TAROT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-4 rounded-2xl font-black text-sm transition-all border-2 ${selectedCategory === cat ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20 scale-105' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={drawCard}
            disabled={!selectedCategory || isDrawing}
            className="w-full bg-slate-950 hover:bg-black text-white py-6 rounded-3xl font-black text-lg uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
          >
            {isDrawing ? <Loader2 className="animate-spin" /> : <Sparkles className="group-hover:rotate-12 transition-transform" />}
            <span>啟動深度神經占卜 / Start AI Reading</span>
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Card Visual Column */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-8">
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="tarot-card-container w-64 h-[448px] cursor-pointer"
            >
              <div className={`tarot-card-inner h-full transition-transform duration-1000 relative preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Back of Card */}
                <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-[32px] border-4 border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-2xl">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
                   <Hexagon size={120} className="text-indigo-500/20" />
                   <div className="absolute bottom-6 text-[10px] font-black text-indigo-500/40 uppercase tracking-[0.4em]">Nexus Card</div>
                </div>

                {/* Front of Card */}
                <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[32px] border-4 border-indigo-600 flex flex-col items-center p-8 shadow-2xl overflow-hidden ${!result.isUpright ? 'rotate-180' : ''}`}>
                  <div className="absolute inset-0 bg-indigo-50/30"></div>
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Major Arcana</span>
                    <div className="flex-1 flex items-center justify-center text-8xl grayscale hover:grayscale-0 transition-all">
                       {getTarotEmoji(result.card.id)}
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black text-slate-900">{result.card.name}</h3>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{result.isUpright ? 'Upright 正位' : 'Reversed 逆位'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full font-bold text-sm hover:bg-indigo-200 transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} /> 翻轉卡片 / Flip Card
            </button>
          </div>

          {/* Interpretation Column */}
          <div className="lg:col-span-7 space-y-8 animate-in slide-in-from-right-10 duration-700">
             <div className="bg-slate-900 rounded-[48px] p-8 md:p-12 text-white shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]">解讀報告 / AI Interpretation</span>
                      <h2 className="text-3xl font-black tracking-tight mt-1">關於「{selectedCategory}」</h2>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-indigo-400">
                      <Sparkles size={24} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">卦象核心 / Card Essence</span>
                       <p className="text-xl font-bold text-indigo-300 italic">「{result.card.keyword}」</p>
                    </div>

                    <div className="space-y-4">
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">大師建議 / Master Insight</span>
                       <div className="text-slate-200 leading-relaxed text-sm md:text-base font-medium bg-white/5 p-6 rounded-3xl border border-white/5 min-h-[150px]">
                         {isAiLoading ? (
                           <div className="flex flex-col items-center justify-center py-10 space-y-4">
                             <Loader2 className="animate-spin text-indigo-400" size={32} />
                             <p className="text-xs font-bold text-indigo-400 animate-pulse uppercase tracking-widest">正在執行神經網絡解卦 / Syncing Akasha Records...</p>
                           </div>
                         ) : (
                           <div className="whitespace-pre-wrap">{aiAnalysis}</div>
                         )}
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => { setResult(null); setSelectedCategory(null); }}
                      className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      重新起卦 / New Reading
                    </button>
                  </div>
                </div>
             </div>

             <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start gap-4">
                <Info className="text-red-500 flex-shrink-0 mt-1" size={18} />
                <div className="space-y-1">
                  <p className="text-xs text-red-700 leading-relaxed font-black uppercase tracking-widest">
                    警告：本結果只供參考娛樂之用不可盡信！
                  </p>
                  <p className="text-[10px] text-red-600 font-medium">
                    Disclaimer: This AI engine is for entertainment purposes only. Do not make critical life decisions based solely on automated divination.
                  </p>
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .tarot-card-container { perspective: 1200px; }
      `}</style>
    </div>
  );
};

// Map card IDs to Emojis (Visual representation of Major Arcana)
const getTarotEmoji = (id: number) => {
  const emojis = [
    '🤡', '🪄', '🌙', '👑', '🏛️', '⛪', '💑', '🛡️', 
    '🦁', '🏮', '🎡', '⚖️', '⏳', '💀', '🍷', '👿', 
    '⚡', '⭐', '🌘', '☀️', '🎺', '🌍'
  ];
  return emojis[id] || '🃏';
};

export default TarotGame;
