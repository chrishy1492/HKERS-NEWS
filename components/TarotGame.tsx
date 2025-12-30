
import React, { useState, useRef } from 'react';
import { Brain, Cpu, Sparkles, Activity, Layout, Terminal, RefreshCw } from 'lucide-react';
import { TAROT_CONTEXTS, TAROT_CARDS } from '../constants';
// Import GoogleGenAI to enable real AI interpretations
import { GoogleGenAI } from "@google/genai";

type GameState = 'SETUP' | 'PROCESSING' | 'RESULT';

export const TarotGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [resultCard, setResultCard] = useState<typeof TAROT_CARDS[0] | null>(null);
  const [isUpright, setIsUpright] = useState(true);
  const [aiInterpretation, setAiInterpretation] = useState<string>('');

  const startReading = async () => {
    if (!selectedContext) return;
    
    setGameState('PROCESSING');
    setAiInterpretation('');
    
    const steps = [
      "正在初始化量子隨機數矩陣...",
      "連接大阿爾克那語義網絡...",
      `正在映射 [${selectedContext}] 維度向量...`,
      "執行蒙地卡羅模擬運算...",
      "生成自然語言解讀報告..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(steps[i]);
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise(r => setTimeout(r, 600));
    }

    // Generate Result
    const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    const orientation = Math.random() > 0.3; // 70% Upright
    setResultCard(randomCard);
    setIsUpright(orientation);

    // Integrate real Gemini API for personalized reading
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `你是一位專業的科技塔羅牌占卜師。請為用戶解讀以下結果：
      問題維度：${selectedContext}
      抽中卡片：${randomCard.name}
      位置：${orientation ? '正位' : '逆位'}
      
      請提供約 100 字的深度分析，口吻要專業、帶有一點工程師的科技感（例如使用連線、通訊協定、架構優化等比喻）。請使用繁體中文。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      setAiInterpretation(response.text || '');
    } catch (error) {
      console.error("AI Reading Error:", error);
      setAiInterpretation(getInterpretation(randomCard.name, selectedContext, orientation));
    }

    setGameState('RESULT');
  };

  const getInterpretation = (cardName: string, context: string, upright: boolean): string => {
    const tone = upright ? "系統偵測到正向能量流動。" : "系統偵測到潛在的阻抗與雜訊。";
    const action = upright ? "建議保持當前架構並優化效率。" : "建議重新審視核心代碼與邏輯。";
    
    let specific = "";
    if (context === '愛情') specific = upright ? "情感連結穩定，協議握手成功。" : "通訊協定不匹配，需注意斷線風險。";
    else if (context === '工作') specific = upright ? "專案執行路徑清晰，產能提升。" : "專案需求不明確，可能面臨技術債。";
    else if (context === '財富') specific = upright ? "資產配置健康，回報率符合預期。" : "現金流動性受阻，建議保守操作。";
    else specific = upright ? "整體運作參數正常。" : "外部變數干擾增加。";

    return `${tone} 在【${context}】這個領域中，${specific} ${action}`;
  };

  const resetGame = () => {
    setGameState('SETUP');
    setSelectedContext('');
    setResultCard(null);
    setProgress(0);
    setAiInterpretation('');
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 md:p-8 shadow-2xl border border-slate-700 min-h-[600px] flex flex-col relative overflow-hidden font-mono text-slate-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
         <Cpu size={200} />
      </div>

      {/* Header */}
      <div className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-end z-10">
        <div>
           <h2 className="text-2xl md:text-3xl font-bold text-blue-500 flex items-center gap-2">
             <Brain className="animate-pulse"/> AI TAROT ENGINE
           </h2>
           <p className="text-xs text-slate-500 mt-1">v2.5.0-stable | Neural Link: ACTIVE</p>
        </div>
        {gameState !== 'SETUP' && (
           <button onClick={resetGame} className="text-xs flex items-center hover:text-white transition-colors">
              <RefreshCw size={14} className="mr-1"/> REBOOT
           </button>
        )}
      </div>

      {/* VIEW: SETUP */}
      {gameState === 'SETUP' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in z-10">
           <h3 className="text-xl mb-6 text-slate-200 font-bold">Step 1: 初始化查詢維度</h3>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full max-w-3xl mb-8">
              {TAROT_CONTEXTS.map(ctx => (
                  <button
                    key={ctx}
                    onClick={() => setSelectedContext(ctx)}
                    className={`
                       p-4 rounded border transition-all duration-300 text-sm font-bold tracking-wider
                       ${selectedContext === ctx 
                          ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transform scale-105' 
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}
                    `}
                  >
                    {ctx}
                  </button>
              ))}
           </div>
           
           <div className="h-16 flex items-center justify-center w-full">
              {selectedContext && (
                  <p className="text-blue-400 font-mono mb-4 animate-bounce">
                    &gt; 目標鎖定: [{selectedContext}]
                  </p>
              )}
           </div>

           <button
              onClick={startReading}
              disabled={!selectedContext}
              className={`
                 px-10 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all
                 ${selectedContext 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105 cursor-pointer' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
              `}
           >
              <Terminal size={20} /> 啟動深度運算
           </button>
        </div>
      )}

      {/* VIEW: PROCESSING */}
      {gameState === 'PROCESSING' && (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
           <div className="w-64 h-64 relative mb-8 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-blue-900 rounded-full opacity-30"></div>
              <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
              <Cpu size={64} className="text-blue-400 animate-pulse"/>
           </div>
           
           <div className="w-full max-w-md bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
           </div>
           
           <p className="font-mono text-blue-400 text-sm h-6">
             &gt; {loadingStep}
           </p>
        </div>
      )}

      {/* VIEW: RESULT */}
      {gameState === 'RESULT' && resultCard && (
         <div className="flex-1 flex flex-col md:flex-row gap-8 items-start animate-fade-in z-10">
            {/* Card Visual */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
               <div className="relative w-64 h-96 group perspective-1000">
                  <div className={`
                     relative w-full h-full duration-700 transform-style-3d transition-transform
                     ${isUpright ? '' : 'rotate-180'}
                  `}>
                     <div className={`
                        w-full h-full bg-slate-800 border-4 rounded-2xl flex flex-col items-center justify-center p-6 shadow-2xl
                        ${isUpright ? 'border-blue-500' : 'border-red-500'}
                        ${!isUpright && 'rotate-180'} 
                     `}>
                        <div className="text-8xl mb-6">{resultCard.emoji}</div>
                        <h3 className="text-xl font-bold text-center text-white mb-2">{resultCard.name}</h3>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${isUpright ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}>
                           {isUpright ? '正位 (Upright)' : '逆位 (Reversed)'}
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Interpretation Text */}
            <div className="w-full md:w-2/3 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
               <div className="mb-6">
                  <h4 className="text-blue-400 font-bold mb-2 flex items-center">
                     <Activity size={16} className="mr-2"/> 核心參數 (Keywords)
                  </h4>
                  <p className="text-white text-lg">{resultCard.keywords}</p>
               </div>

               <div className="mb-6">
                  <h4 className="text-blue-400 font-bold mb-2 flex items-center">
                     <Layout size={16} className="mr-2"/> 詳細解讀報告 (Detailed Analysis)
                  </h4>
                  <div className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base border-l-2 border-blue-500 pl-4">
                     <p>
                        <strong className="text-white">維度：{selectedContext}</strong>
                     </p>
                     <p>
                        {resultCard.desc}
                     </p>
                     <div className="mt-4 pt-4 border-t border-slate-700 italic text-slate-400">
                        <span className="block font-bold text-blue-400 mb-2">AI 綜合運算結論：</span>
                        {aiInterpretation || getInterpretation(resultCard.name, selectedContext, isUpright)}
                     </div>
                  </div>
               </div>

               {/* Mandatory Disclaimer */}
               <div className="mt-8 p-3 bg-red-900/20 border border-red-900/50 rounded text-center">
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wider">
                     警告：本運算結果僅供娛樂參考，不可盡信。
                  </p>
                  <p className="text-red-400/60 text-[10px] mt-1">
                     Disclaimer: Generated by AI Engine for entertainment only. Do not rely on this for life decisions.
                  </p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
