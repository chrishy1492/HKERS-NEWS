
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, RefreshCw, AlertTriangle, Cpu, Layers, Eye, Zap, Search } from 'lucide-react';
import { Profile } from '../../types';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

const TOPICS = ['工作', '愛情', '財富', '家庭', '學業', '生活', '人緣', '朋友', '運程', '健康'];

const MAJOR_ARCANA = [
  { name: "0 愚者 (The Fool)", icon: "🤡", meaning: "冒險、新的開始、無畏" },
  { name: "I 魔術師 (The Magician)", icon: "🪄", meaning: "創造力、技能、意志力" },
  { name: "II 女祭司 (The High Priestess)", icon: "🌙", meaning: "直覺、潛意識、神秘" },
  { name: "III 皇后 (The Empress)", icon: "👑", meaning: "豐饒、母性、感官享受" },
  { name: "IV 皇帝 (The Emperor)", icon: "🏰", meaning: "權威、結構、父性" },
  { name: "V 教皇 (The Hierophant)", icon: "📜", meaning: "傳統、信仰、學習" },
  { name: "VI 戀人 (The Lovers)", icon: "💕", meaning: "愛、和諧、選擇" },
  { name: "VII 戰車 (The Chariot)", icon: "🛒", meaning: "意志力、勝利、控制" },
  { name: "VIII 力量 (Strength)", icon: "🦁", meaning: "勇氣、耐心、控制" },
  { name: "IX 隱士 (The Hermit)", icon: "🕯️", meaning: "內省、孤獨、指引" },
  { name: "X 命運之輪 (Wheel of Fortune)", icon: "🎡", meaning: "週期、命運、轉折點" },
  { name: "XI 正義 (Justice)", icon: "⚖️", meaning: "公平、真理、法律" },
  { name: "XII 倒吊人 (The Hanged Man)", icon: "🦇", meaning: "犧牲、新視角、等待" },
  { name: "XIII 死神 (Death)", icon: "💀", meaning: "結束、轉變、新生" },
  { name: "XIV 節制 (Temperance)", icon: "🥛", meaning: "平衡、適度、耐心" },
  { name: "XV 惡魔 (The Devil)", icon: "😈", meaning: "束縛、物質主義、誘惑" },
  { name: "XVI 高塔 (The Tower)", icon: "⚡", meaning: "劇變、災難、覺醒" },
  { name: "XVII 星星 (The Star)", icon: "🌟", meaning: "希望、靈感、寧靜" },
  { name: "XVIII 月亮 (The Moon)", icon: "🌒", meaning: "幻覺、恐懼、潛意識" },
  { name: "XIX 太陽 (The Sun)", icon: "☀️", meaning: "快樂、成功、活力" },
  { name: "XX 審判 (Judgement)", icon: "📯", meaning: "重生、呼喚、寬恕" },
  { name: "XXI 世界 (The World)", icon: "🌍", meaning: "完成、整合、旅行" }
];

const TarotGame: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [step, setStep] = useState<'topic' | 'shuffling' | 'result'>('topic');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState<any>(null);

  const startReading = async (topic: string) => {
    if (!profile) return alert('請先登入系統以存取神經網絡數據。');
    
    // 1. Deduct points logic (Optional, based on requirements, assuming free or points)
    // Let's assume it costs 50 points per read to be "Professional"
    if (profile.points < 50) return alert('積分不足 (需要 50 PTS)');

    const confirm = window.confirm(`確認啟動 AI 塔羅分析引擎？將扣除 50 積分。\n目標維度：${topic}`);
    if (!confirm) return;

    setSelectedTopic(topic);
    setStep('shuffling');
    setLoadingMsg('正在初始化量子隨機矩陣...');

    // Deduct
    await supabase.from('profiles').update({ points: profile.points - 50 }).eq('id', profile.id);
    onUpdate();

    // Simulation of Shuffling
    setTimeout(() => setLoadingMsg('正在連接大語言模型神經網絡...'), 1000);
    setTimeout(() => setLoadingMsg('正在掃描命運數據庫...'), 2000);
    setTimeout(() => {
        performDivination(topic);
    }, 3000);
  };

  const performDivination = async (topic: string) => {
    try {
      // 1. Draw Card
      const cardIndex = Math.floor(Math.random() * MAJOR_ARCANA.length);
      const isUpright = Math.random() > 0.3; // 70% chance upright
      const card = MAJOR_ARCANA[cardIndex];
      const orientation = isUpright ? '正位 (Upright)' : '逆位 (Reversed)';

      // 2. AI Interpretation
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Role: Expert Tarot Analyst & Data Engineer.
        Action: Interpret a Tarot reading.
        
        Context:
        - Topic: ${topic}
        - Card: ${card.name}
        - Position: ${orientation}
        - Card Essence: ${card.meaning}

        Output Requirements:
        1. Tone: Professional, Analytical, yet Mystical. Use "System Analysis" metaphors where appropriate.
        2. Content:
           - Explain the card's core energy in the context of ${topic}.
           - Provide actionable advice (The "Patch Note" or "Optimization Strategy").
           - Give a "System Status" summary (e.g., Stable, Critical Error, Reboot Required).
        3. Language: Traditional Chinese (Hong Kong style).
        4. Length: Approx 150-200 words.
        
        Format: Plain text, separate paragraphs.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setResult({
        card: card,
        isUpright: isUpright,
        orientation: orientation,
        analysis: response.text || "訊號干擾，無法解讀。請重試。",
      });
      setStep('result');
    } catch (err) {
      alert('AI 連線失敗，請稍後再試。');
      setStep('topic');
    }
  };

  const reset = () => {
    setStep('topic');
    setResult(null);
    setSelectedTopic('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-500">
      
      {step === 'topic' && (
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl text-center">
          <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(124,58,237,0.3)] border border-purple-500/30">
            <Eye className="text-purple-500" size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">AI 塔羅運算引擎</h2>
          <p className="text-slate-400 text-sm mb-10 font-mono">v3.0.1 • Neural Network Divination</p>

          <p className="text-slate-300 font-bold mb-6">請選擇運算目標維度 (Context):</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => startReading(topic)}
                className="group relative overflow-hidden bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white p-4 rounded-xl transition-all duration-300"
              >
                <span className="relative z-10 font-black tracking-widest text-sm">{topic}</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            ))}
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
             <Cpu size={12} />
             <span>System Ready</span>
             <span>|</span>
             <span>Cost: 50 PTS/Req</span>
          </div>
        </div>
      )}

      {step === 'shuffling' && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-[2.5rem] border border-slate-800">
          <div className="relative w-32 h-48 mb-8">
            <div className="absolute inset-0 bg-purple-600 rounded-xl border-2 border-white/20 animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 rounded-xl border-2 border-purple-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-pulse">
                <span className="text-4xl">🔮</span>
            </div>
          </div>
          <p className="text-purple-400 font-bold text-lg animate-pulse">{loadingMsg}</p>
          <div className="w-64 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-purple-500 w-1/2 animate-[shimmer_1s_infinite_linear]" style={{ transform: 'translateX(-100%)' }}></div>
          </div>
          <style>{`
            @keyframes shimmer {
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      )}

      {step === 'result' && result && (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-500">
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-4 text-center border-b border-white/5">
             <span className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">Analysis Complete</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Card Visual */}
            <div className="p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 bg-slate-950/50">
              <div className={`relative w-48 h-80 rounded-2xl border-4 ${result.isUpright ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.3)]' : 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]'} bg-slate-900 flex flex-col items-center justify-center transition-all duration-1000 transform ${result.isUpright ? '' : 'rotate-180'}`}>
                <div className="text-8xl mb-4">{result.card.icon}</div>
                <div className={`absolute bottom-4 left-0 w-full text-center font-black text-white text-sm px-2 ${result.isUpright ? '' : 'rotate-180'}`}>
                  {result.card.name}
                </div>
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-black text-white mb-1">{result.card.name.split(' ')[1]}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.isUpright ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>
                  {result.orientation}
                </span>
              </div>
            </div>

            {/* Analysis Text */}
            <div className="col-span-2 p-10 flex flex-col justify-between bg-slate-900">
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Layers className="text-purple-400" /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    {selectedTopic} • 深度解析報告
                  </span>
                </h3>
                
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-4">
                   {result.analysis.split('\n').map((line: string, i: number) => (
                     <p key={i}>{line}</p>
                   ))}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start mb-6">
                   <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                   <div>
                     <p className="text-red-400 font-bold text-xs uppercase mb-1">Disclaimer / 免責聲明</p>
                     <p className="text-red-300/70 text-[10px]">
                       本運算結果僅供娛樂參考，AI 生成內容不代表絕對事實。請勿過度迷信，人生決策應掌握在自己手中。<br/>
                       Result is for entertainment purposes only. Do not rely on it for critical life decisions.
                     </p>
                   </div>
                </div>

                <button 
                  onClick={reset}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> 重啟系統 (New Reading)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotGame;
