import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, RotateCcw, Cpu, Zap, AlertTriangle, PlayCircle, Lock, Moon, Binary, CloudSun } from 'lucide-react';
// @ts-ignore
import { Solar } from 'lunar-javascript';
import ZiWeiEngine from './ZiWeiEngine';
import OracleEngine from './OracleEngine';
import TempleEngine from './TempleEngine';

// --- Shared Types ---
interface ResultData {
  name: string;
  poem: string[];
  description: string;
  lunarDateStr: string;
  shichenStr: string;
  inputDateStr: string;
}

// --- Xiao Liu Ren Data ---
const SHICHENS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const FORTUNE_DATA = [
  { name: "空亡", description: "空亡事不祥，陰人多乖張，求財無利益，行人有災殃。失物尋不見，官事有刑傷，病人逢暗鬼，解禳保安康。", poem: ["空亡空亡事不祥，陰人多乖張", "求財無利益，行人有災殃", "失物尋不見，官事有刑傷", "病人逢暗鬼，解禳保安康"], summary: "大凶。諸事不宜，保守為上。" },
  { name: "大安", description: "大安事事昌，求財在坤方，失物去不遠，宅舍保安康。行人身未動，病者主無妨，將軍回田野，仔細更推詳。", poem: ["大安大安事事昌，求財在坤方", "失物去不遠，宅舍保安康", "行人身未動，病者主無妨", "將軍回田野，仔細更推詳"], summary: "大吉。萬事順遂，身心安泰。" },
  { name: "留連", description: "留連事難成，求謀日未明，官事凡宜緩，去者未回程。失物南方見，急討方心稱，更須防口舌，人口且平平。", poem: ["留連留連事難成，求謀日未明", "官事凡宜緩，去者未回程", "失物南方見，急討方心稱", "更須防口舌，人口且平平"], summary: "中凶。阻礙拖延，需耐心等待。" },
  { name: "速喜", description: "速喜喜來臨，求財向南行，失物申未午，逢人路上尋。官事有福德，病者無禍侵，田宅六畜吉，行人有信音。", poem: ["速喜速喜喜來臨，求財向南行", "失物申未午，逢人路上尋", "官事有福德，病者無禍侵", "田宅六畜吉，行人有信音"], summary: "中吉。喜訊將至，速戰速決。" },
  { name: "赤口", description: "赤口主口舌，官非切宜防，失物速速討，行人有驚慌。六畜多作怪，病者出西方，更須防咀咒，誠恐染瘟皇。", poem: ["赤口赤口主口舌，官非切宜防", "失物速速討，行人有驚慌", "六畜多作怪，病者出西方", "更須防咀咒，誠恐染瘟皇"], summary: "小凶。謹防口角，諸事小心。" },
  { name: "小吉", description: "小吉最吉昌，路上好商量，陰人來報喜，失物在坤方。行人即便至，交關甚是強，凡事皆和合，病者叩窮蒼。", poem: ["小吉小吉最吉昌，路上好商量", "陰人來報喜，失物在坤方", "行人即便至，交關甚是強", "凡事皆和合，病者叩窮蒼"], summary: "小吉。貴人相助，和氣生財。" }
];

// --- Tarot Data ---
const TAROT_CARDS = [
  { name: "愚者 (The Fool)", emoji: "🃏", keyword: "冒險、開端、不確定性", meaning: "新的機會但缺乏規劃，需要勇氣面對未知。" },
  { name: "魔術師 (The Magician)", emoji: "🪄", keyword: "創造力、技能、資源", meaning: "展現專業能力的時刻，資源已備齊。" },
  { name: "女祭司 (The High Priestess)", emoji: "🌙", keyword: "直覺、潛意識、靜止", meaning: "等待最佳時機，傾聽內在的聲音。" },
  { name: "皇后 (The Empress)", emoji: "👑", keyword: "豐饒、母性、感官", meaning: "創意開花結果，享受豐盛的成果。" },
  { name: "皇帝 (The Emperor)", emoji: "👑", keyword: "權威、結構、控制", meaning: "建立秩序與規則，展現領導力。" },
  { name: "教皇 (The Hierophant)", emoji: "📜", keyword: "傳統、信仰、學習", meaning: "尋求精神指引，遵循傳統價值。" },
  { name: "戀人 (The Lovers)", emoji: "💕", keyword: "愛、選擇、結合", meaning: "面臨重要的關係抉擇，和諧的連結。" },
  { name: "戰車 (The Chariot)", emoji: "🛒", keyword: "意志、勝利、行動", meaning: "克服障礙，堅持到底獲得勝利。" },
  { name: "力量 (Strength)", emoji: "🦁", keyword: "勇氣、耐心、控制", meaning: "以柔克剛，內在的力量勝過外在。" },
  { name: "隱士 (The Hermit)", emoji: "🕯️", keyword: "內省、孤獨、指引", meaning: "暫時退隱，尋求內在的真理。" },
  { name: "命運之輪 (Wheel of Fortune)", emoji: "🎡", keyword: "輪迴、契機、轉折", meaning: "順應命運的改變，把握轉機。" },
  { name: "正義 (Justice)", emoji: "⚖️", keyword: "公平、決策、因果", meaning: "理性的判斷，承擔行為的後果。" },
  { name: "吊人 (The Hanged Man)", emoji: "🦇", keyword: "犧牲、新視角、等待", meaning: "換個角度看世界，以退為進。" },
  { name: "死神 (Death)", emoji: "💀", keyword: "結束、轉化、新生", meaning: "徹底的改變，告別過去迎向未來。" },
  { name: "節制 (Temperance)", emoji: "🏺", keyword: "平衡、調和、耐心", meaning: "尋求中庸之道，自我療癒的過程。" },
  { name: "惡魔 (The Devil)", emoji: "😈", keyword: "束縛、誘惑、物質", meaning: "面對內心的恐懼與慾望，尋求解放。" },
  { name: "高塔 (The Tower)", emoji: "⚡", keyword: "劇變、覺醒、崩潰", meaning: "突如其來的變故，打破舊有結構。" },
  { name: "星星 (The Star)", emoji: "🌟", keyword: "希望、靈感、寧靜", meaning: "重拾希望，心靈的淨化與指引。" },
  { name: "月亮 (The Moon)", emoji: "🌙", keyword: "不安、幻象、潛意識", meaning: "面對內心的恐懼，看清迷霧中的真相。" },
  { name: "太陽 (The Sun)", emoji: "☀️", keyword: "成功、喜悅、光明", meaning: "充滿活力與自信，光明的未來。" },
  { name: "審判 (Judgement)", emoji: "🎺", keyword: "覺醒、召喚、重生", meaning: "回應內在的召喚，做出關鍵決定。" },
  { name: "世界 (The World)", emoji: "🌍", keyword: "完成、整合、旅行", meaning: "達成目標，完美的結局與新開始。" }
];

const Fortune: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'xiaoliuren' | 'tarot' | 'ziwei' | 'oracle' | 'temple'>('xiaoliuren');

  // --- Xiao Liu Ren State ---
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [timeInput, setTimeInput] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [xlrResult, setXlrResult] = useState<ResultData | null>(null);
  const [xlrLoading, setXlrLoading] = useState(false);

  // --- Tarot State ---
  const [tarotContext, setTarotContext] = useState<string | null>(null);
  const [tarotStep, setTarotStep] = useState<'setup' | 'loading' | 'result'>('setup');
  const [loadingText, setLoadingText] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [tarotResult, setTarotResult] = useState<{card: typeof TAROT_CARDS[0], isUpright: boolean} | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);

  // --- Xiao Liu Ren Functions ---
  const getShichen = (hour: number) => {
    const index = Math.floor((hour + 1) / 2) % 12;
    return { formulaIndex: index + 1, name: SHICHENS[index] };
  };

  const handleXlrCalculate = () => {
    setXlrLoading(true);
    setXlrResult(null);
    setTimeout(() => {
      try {
        const [year, month, day] = dateInput.split('-').map(Number);
        const [hourStr] = timeInput.split(':');
        const hour = parseInt(hourStr, 10);
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        const lMonth = Math.abs(lunar.getMonth());
        const lDay = lunar.getDay();
        const shichen = getShichen(hour);
        const resIndex = (lMonth + lDay + shichen.formulaIndex - 2) % 6;
        const fortune = FORTUNE_DATA[resIndex];

        setXlrResult({
          name: fortune.name,
          poem: fortune.poem,
          description: fortune.summary,
          lunarDateStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
          shichenStr: `${shichen.name}時`,
          inputDateStr: `${year}-${month}-${day} ${timeInput}`
        });
      } catch (e) {
        alert("Error in calculation.");
      } finally {
        setXlrLoading(false);
      }
    }, 800);
  };

  // --- Tarot Functions ---
  const startTarotReading = async () => {
    if (!tarotContext) return;
    setTarotStep('loading');
    setCardFlipped(false);
    
    const tasks = [
      "正在初始化隨機數生成矩陣...",
      "正在加載 78 張塔羅大數據...",
      `正在映射 [${tarotContext}] 語義維度...`,
      "正在執行蒙地卡羅模擬占卜...",
      "正在生成詳細解讀報告..."
    ];

    for (let i = 0; i < tasks.length; i++) {
      setLoadingText(tasks[i]);
      setLoadingProgress((i + 1) * 20);
      await new Promise(r => setTimeout(r, 600));
    }

    const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    const isUpright = Math.random() > 0.3; // 70% chance upright

    setTarotResult({ card: randomCard, isUpright });
    setTarotStep('result');
    setTimeout(() => setCardFlipped(true), 300);
  };

  const resetTarot = () => {
    setTarotStep('setup');
    setTarotContext(null);
    setTarotResult(null);
    setCardFlipped(false);
  };

  const getTarotAnalysis = (card: typeof TAROT_CARDS[0], isUpright: boolean, ctx: string) => {
    const status = isUpright ? "正位 (Upright)" : "逆位 (Reversed)";
    const energy = isUpright ? "正向流動" : "受阻/反向";
    
    // Simple generative logic simulation
    let advice = "";
    if (ctx === "工作" || ctx === "學業" || ctx === "財富") {
       advice = isUpright 
         ? "當前架構穩定，建議保持執行力，利用現有資源擴大優勢。" 
         : "系統偵測到潛在風險，建議重新評估當前策略，避免盲目投入。";
    } else {
       advice = isUpright
         ? "情感連結訊號強烈，適合坦誠溝通，建立更深層的信任。"
         : "內部存在未解的矛盾，建議暫時冷靜，釐清內在需求後再行動。";
    }

    return (
      <div className="space-y-4 text-left text-sm md:text-base font-mono">
        <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
           <span className="text-blue-400 font-bold block mb-1">【核心參數】</span>
           <p className="text-gray-300">{card.keyword} | {status} | 能量：{energy}</p>
        </div>
        <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
           <span className="text-purple-400 font-bold block mb-1">【{ctx}維度：深度解析】</span>
           <p className="text-gray-300">{card.meaning}</p>
           <p className="text-gray-400 mt-2 text-xs">系統分析顯示：{advice}</p>
        </div>
        <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
           <span className="text-green-400 font-bold block mb-1">【建議策略】</span>
           <ul className="list-disc ml-4 text-gray-300 space-y-1">
             <li>{isUpright ? "保持現狀，穩步推進。" : "暫停並檢查系統漏洞。"}</li>
             <li>關注細節變量，保持靈活。</li>
             <li>{ctx}方面需多加留意長期趨勢。</li>
           </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 md:p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      
      {/* Mode Switcher */}
      <div className="flex justify-center gap-2 md:gap-4 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('xiaoliuren')}
          className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-bold transition-all shadow-md whitespace-nowrap ${activeTab === 'xiaoliuren' ? 'bg-yellow-500 text-white scale-105' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          <Sparkles size={18} /> 掐指一算
        </button>
        <button 
          onClick={() => setActiveTab('tarot')}
          className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-bold transition-all shadow-md whitespace-nowrap ${activeTab === 'tarot' ? 'bg-[#0d1117] text-blue-400 border border-blue-500/50 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          <Cpu size={18} /> AI Tarot
        </button>
        <button 
          onClick={() => setActiveTab('ziwei')}
          className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-bold transition-all shadow-md whitespace-nowrap ${activeTab === 'ziwei' ? 'bg-slate-900 text-purple-400 border border-purple-500/50 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          <Moon size={18} /> 紫微斗數
        </button>
        <button 
          onClick={() => setActiveTab('oracle')}
          className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-bold transition-all shadow-md whitespace-nowrap ${activeTab === 'oracle' ? 'bg-indigo-900 text-indigo-200 border border-indigo-500/50 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          <Binary size={18} /> Project Oracle
        </button>
        <button 
          onClick={() => setActiveTab('temple')}
          className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-bold transition-all shadow-md whitespace-nowrap ${activeTab === 'temple' ? 'bg-amber-800 text-amber-200 border border-amber-500/50 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          <CloudSun size={18} /> 拜神祈福
        </button>
      </div>

      {/* --- XIAO LIU REN VIEW --- */}
      {activeTab === 'xiaoliuren' && (
        <div className="flex flex-col items-center animate-fade-in text-center">
          <div className="mb-6 flex flex-col items-center">
             <div className="bg-yellow-100 p-4 rounded-full mb-4 border-2 border-yellow-400 shadow-lg">
                <RotateCcw size={40} className="text-yellow-600" />
             </div>
             <h2 className="text-4xl font-black text-gray-800 tracking-tight">時空神數</h2>
             <p className="text-gray-500 text-sm mt-2">傳統術數 • 趨吉避凶</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-lg w-full border border-gray-200 relative overflow-hidden">
            {!xlrResult ? (
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-left text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                    <Calendar size={16} /> 西曆日期 (Solar Date)
                  </label>
                  <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none font-mono text-lg transition-all" />
                </div>
                <div>
                  <label className="block text-left text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                    <Clock size={16} /> 時間 (Time)
                  </label>
                  <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none font-mono text-lg transition-all" />
                </div>
                <div className="pt-4">
                  <button onClick={handleXlrCalculate} disabled={xlrLoading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white text-lg font-bold py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition shadow-lg transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2">
                    {xlrLoading ? <>計算中...</> : <>開始占卜 <span className="text-red-200 text-sm font-normal">(100 pts)</span></>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in relative z-10">
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-left">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400 block text-xs">輸入時間</span><span className="font-mono text-gray-700 font-bold">{xlrResult.inputDateStr}</span></div>
                    <div><span className="text-gray-400 block text-xs">農曆轉換</span><span className="font-serif text-gray-700 font-bold">{xlrResult.lunarDateStr}</span></div>
                    <div className="col-span-2 border-t border-gray-200 pt-2 mt-2"><span className="text-gray-400 block text-xs">對應時辰</span><span className="font-serif text-purple-600 font-bold text-lg">{xlrResult.shichenStr}</span></div>
                  </div>
                </div>
                <div className="mb-8">
                   <div className="inline-block px-6 py-2 bg-yellow-100 text-yellow-800 rounded-full font-black text-3xl mb-4 border border-yellow-300 shadow-sm">{xlrResult.name}</div>
                   <p className="text-gray-600 font-bold mb-6">{xlrResult.description}</p>
                   <div className="bg-red-50 p-6 rounded-xl border border-red-100 relative">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-red-400 text-xs font-bold tracking-widest border border-red-100 rounded">籤詩</div>
                      <div className="space-y-2 font-serif text-gray-800 text-lg leading-relaxed">{xlrResult.poem.map((line, i) => <p key={i}>{line}</p>)}</div>
                   </div>
                </div>
                <button onClick={() => setXlrResult(null)} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 mx-auto transition"><RotateCcw size={16} /> 再算一次</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- AI TAROT VIEW --- */}
      {activeTab === 'tarot' && (
        <div className="flex flex-col items-center w-full animate-fade-in">
          <div className="max-w-4xl w-full bg-[#0d1117] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden min-h-[600px] flex flex-col relative text-gray-300 font-mono">
             {/* Terminal Header */}
             <div className="bg-[#161b22] p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Cpu size={20} className="text-blue-500 animate-pulse" />
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI TAROT ENGINE</span>
                  <span className="text-xs text-gray-600 border border-gray-700 px-1 rounded">v2.5.0</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 animate-pulse"></div>
                </div>
             </div>

             {/* Content Area */}
             <div className="p-6 md:p-10 flex-1 flex flex-col items-center justify-center">
                
                {/* STEP 1: SETUP */}
                {tarotStep === 'setup' && (
                   <div className="w-full max-w-2xl animate-fade-in">
                      <h3 className="text-xl text-blue-400 font-bold mb-6 text-center flex items-center justify-center gap-2">
                        <Zap size={20} /> 初始化占卜參數 (Initialize Context)
                      </h3>
                      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                        {['工作', '愛情', '財富', '家庭', '學業', '生活', '人緣', '朋友', '健康'].map(ctx => (
                          <button 
                            key={ctx}
                            onClick={() => setTarotContext(ctx)}
                            className={`p-4 rounded-xl border transition-all duration-300 font-bold ${tarotContext === ctx 
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                              : 'bg-[#21262d] border-gray-700 hover:border-gray-500 hover:bg-[#30363d]'}`}
                          >
                            {ctx}
                          </button>
                        ))}
                      </div>
                      
                      <div className="text-center h-12">
                        {tarotContext && (
                          <p className="text-yellow-500 font-mono animate-bounce text-sm">
                             目標維度已鎖定：[{tarotContext}]
                          </p>
                        )}
                      </div>

                      <button 
                        onClick={startTarotReading}
                        disabled={!tarotContext}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
                      >
                         <PlayCircle size={20} /> 啟動深度神經占卜
                      </button>
                   </div>
                )}

                {/* STEP 2: LOADING */}
                {tarotStep === 'loading' && (
                  <div className="w-full max-w-md text-center animate-fade-in">
                     <div className="mb-8 relative">
                       <div className="w-24 h-32 bg-[#21262d] border border-gray-700 rounded-lg mx-auto animate-pulse flex items-center justify-center">
                          <span className="text-4xl">?</span>
                       </div>
                     </div>
                     <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                       <div 
                         className="bg-blue-500 h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_#3b82f6]" 
                         style={{ width: `${loadingProgress}%` }}
                       ></div>
                     </div>
                     <p className="text-xs text-blue-400 font-mono animate-pulse">{loadingText}</p>
                  </div>
                )}

                {/* STEP 3: RESULT */}
                {tarotStep === 'result' && tarotResult && (
                  <div className="w-full animate-fade-in flex flex-col md:flex-row gap-8 items-start">
                     {/* Left: Card Visual */}
                     <div className="w-full md:w-1/3 flex flex-col items-center">
                        <div className="relative perspective-1000 w-48 h-80 mb-4 group cursor-pointer" onClick={() => setCardFlipped(!cardFlipped)}>
                           <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${cardFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                              {/* Back */}
                              <div className="absolute w-full h-full backface-hidden rounded-xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border-2 border-gray-700 flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                                 <div className="w-32 h-48 border border-gray-600 rounded flex items-center justify-center opacity-30">
                                   <Cpu size={40} />
                                 </div>
                              </div>
                              {/* Front */}
                              <div className={`absolute w-full h-full backface-hidden [transform:rotateY(180deg)] rounded-xl bg-[#0d1117] border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center p-4 text-center ${tarotResult.isUpright ? '' : 'rotate-180'}`}>
                                 <div className="text-6xl mb-4">{tarotResult.card.emoji}</div>
                                 <h3 className="text-lg font-bold text-white mb-2">{tarotResult.card.name.split(' (')[0]}</h3>
                                 <p className="text-[10px] text-gray-500 uppercase">{tarotResult.card.name.split('(')[1].replace(')', '')}</p>
                              </div>
                           </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{cardFlipped ? (tarotResult.isUpright ? '正位 Upright' : '逆位 Reversed') : '點擊翻牌'}</p>
                     </div>

                     {/* Right: Interpretation */}
                     <div className="w-full md:w-2/3">
                        <div className="bg-[#161b22]/80 p-6 rounded-xl border-l-4 border-blue-500 backdrop-blur-sm">
                           <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                             <span>📝</span> 詳細解讀報告 (Analysis)
                           </h2>
                           {getTarotAnalysis(tarotResult.card, tarotResult.isUpright, tarotContext!)}
                        </div>
                        
                        <div className="mt-6 p-4 border border-dashed border-red-900/50 rounded-lg bg-red-900/10 text-center">
                            <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase mb-1">
                               <AlertTriangle size={12} />
                               Warning: Simulation Only
                            </div>
                            <p className="text-gray-500 text-[10px]">
                               本結果由 AI 引擎生成，僅供娛樂參考。命運掌握在自己手中。<br/>
                               The result is for entertainment purposes only. Do not rely on it for critical decisions.
                            </p>
                        </div>

                        <button onClick={resetTarot} className="mt-6 w-full py-3 border border-gray-700 hover:bg-gray-800 text-gray-400 rounded-lg transition text-sm">
                           重新啟動系統 (Reboot System)
                        </button>
                     </div>
                  </div>
                )}

             </div>
          </div>
          <p className="mt-4 text-xs text-gray-400 font-mono">
             *AI Tarot Engine v2.5.0 | Powered by Gemini Core Logic
          </p>
        </div>
      )}

      {/* --- AI ZI WEI VIEW --- */}
      {activeTab === 'ziwei' && (
        <div className="flex flex-col items-center w-full animate-fade-in">
           <div className="max-w-4xl w-full">
              <ZiWeiEngine />
           </div>
        </div>
      )}

      {/* --- AI ORACLE VIEW --- */}
      {activeTab === 'oracle' && (
        <div className="flex flex-col items-center w-full animate-fade-in">
           <div className="max-w-4xl w-full">
              <OracleEngine />
           </div>
        </div>
      )}

      {/* --- TEMPLE VIEW --- */}
      {activeTab === 'temple' && (
        <div className="flex flex-col items-center w-full animate-fade-in">
           <div className="max-w-4xl w-full">
              <TempleEngine />
           </div>
        </div>
      )}

    </div>
  );
};

export default Fortune;