import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Cpu, Activity, Heart, Briefcase, 
  TrendingUp, AlertTriangle, Terminal, Lock, MapPin, 
  Wifi, BarChart3, ShieldAlert
} from 'lucide-react';

interface FortuneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Engineering Utilities ---

// Pseudo-random number generator based on seed (Name + Date)
class SeededRNG {
  private seed: number;

  constructor(seedStr: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
    }
    this.seed = h;
  }

  // Returns float between 0 and 1
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Returns int between min and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick random element from array
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}

// --- Data Constants for AI Generation ---

const CAREER_ADVICE = [
  "重構當前工作流程，降低技術債。", "系統顯示適合嘗試跨部門協作。", 
  "當前版本穩定，建議進行功能迭代（升級技能）。", "檢測到職場人際通訊協定異常，建議開啟防火牆（保持距離）。",
  "適合進行壓力測試，承接高難度專案。", "數據顯示行業景氣度上升，適合部署跳槽計畫。"
];

const LOVE_STATUS = [
  "連線逾時 (Timeout)，建議重試。", "TCP 三向交手成功，連結建立中。", 
  "通訊加密中，關係穩定且私密。", "發現多個連線請求 (DDoS?)，請篩選流量。",
  "依戀風格分析：焦慮型附件，需增加心跳包頻率。", "Ping 值過高，遠距離戀愛風險增加。"
];

const WEALTH_STRATEGY = [
  "建議採納防禦性資產配置。", "波動率高，適合高頻交易策略。", 
  "正財輸入穩定，偏財端口已關閉。", "檢測到資金流出漏洞，請審查訂閱服務。",
  "槓桿率過高，建議去槓桿化。", "市場情緒指數恐慌，適合逢低佈局。"
];

const DOOM_WARNINGS = [
  "系統運作正常 (Nominal)。", "系統運作正常 (Nominal)。", "系統運作正常 (Nominal)。", // Higher chance of safety
  "【警告】檢測到水星逆行干擾，通訊層可能丟包。", 
  "【嚴重】歲運並臨，系統負載達到臨界值，建議開啟安全模式（多靜少動）。",
  "【注意】火星磁場躁動，情緒模組易過熱，請冷卻處理。"
];

const LUCKY_ITEMS = ["機械鍵盤", "降噪耳機", "黑咖啡", "維生素B群", "藍光眼鏡", "人體工學椅"];

// --- Component ---

export const FortuneModal: React.FC<FortuneModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'INPUT' | 'PROCESSING' | 'DASHBOARD'>('INPUT');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setName('');
      setBirthDate('');
      setLogs([]);
      setProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runSimulation = () => {
    if (!name || !birthDate) return;
    setStep('PROCESSING');
    
    // Simulate AI Processing
    const logMessages = [
      "初始化量子隨機矩陣...",
      `載入用戶向量 [${name}]...`,
      "校準星盤經緯度數據...",
      "執行生肖衝煞演算法...",
      "分析依戀人格模型...",
      "評估市場情緒風險參數...",
      "生成避險指南...",
      "編譯最終報告..."
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logMessages.length) {
        setLogs(prev => [...prev, `> ${logMessages[currentLog]}`]);
        setProgress(((currentLog + 1) / logMessages.length) * 100);
        currentLog++;
      } else {
        clearInterval(interval);
        generateResult();
      }
    }, 600);
  };

  const generateResult = () => {
    // Unique seed based on Name + BirthDate + Today's Date (So outcome is fixed per day)
    const today = new Date().toISOString().split('T')[0];
    const seedStr = `${name}-${birthDate}-${today}`;
    const rng = new SeededRNG(seedStr);

    const luckScore = rng.nextInt(40, 99);
    const doom = rng.pick(DOOM_WARNINGS);
    
    setResult({
      dailyEfficiency: luckScore,
      luckyTime: `${rng.nextInt(9, 16)}:00 - ${rng.nextInt(17, 22)}:00`,
      luckyItem: rng.pick(LUCKY_ITEMS),
      luckyDirection: rng.pick(["北 N", "南 S", "西 W", "東 E", "東北 NE", "西南 SW"]),
      loveAnalysis: rng.pick(LOVE_STATUS),
      compatibility: rng.nextInt(30, 100),
      careerAdvice: rng.pick(CAREER_ADVICE),
      careerTrend: rng.nextInt(0, 100) > 50 ? 'UP' : 'DOWN',
      wealthGuide: rng.pick(WEALTH_STRATEGY),
      mainIncome: rng.nextInt(1, 10), // 1-10 scale
      sideIncome: rng.nextInt(1, 10),
      doomWarning: doom,
      isDoom: doom !== "系統運作正常 (Nominal)。"
    });

    setTimeout(() => setStep('DASHBOARD'), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Engineering Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Cpu className="text-blue-500 animate-pulse" size={24} />
            <div>
              <h2 className="text-lg font-bold text-slate-200 tracking-wider">QUANTUM FATE ENGINE <span className="text-xs bg-blue-600 text-white px-1 rounded">v4.0</span></h2>
              <p className="text-[10px] text-slate-500 uppercase">AI-Powered Predictive Modeling System</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* STEP 1: INPUT */}
          {step === 'INPUT' && (
            <div className="flex flex-col items-center justify-center h-full py-10 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">身分識別與參數校準</h3>
                <p className="text-slate-400 text-sm">請輸入基礎參數以初始化命理運算矩陣</p>
              </div>

              <div className="w-full max-w-md space-y-4 bg-slate-800/50 p-8 rounded-xl border border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-blue-400 mb-2 uppercase">User Identifier (Name)</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none font-sans"
                    placeholder="輸入姓名..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-400 mb-2 uppercase">Initialization Date (Birthday)</label>
                  <input 
                    type="date" 
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none font-sans"
                  />
                </div>
                <button 
                  onClick={runSimulation}
                  disabled={!name || !birthDate}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded flex items-center justify-center gap-2 mt-4 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                >
                  <Terminal size={18} /> 執行分析 (EXECUTE)
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROCESSING */}
          {step === 'PROCESSING' && (
            <div className="flex flex-col h-full justify-center max-w-2xl mx-auto">
              <div className="bg-black border border-slate-700 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto mb-4 shadow-inner">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-green-500 mb-1">{log}</div>
                ))}
                <div className="animate-pulse text-green-500">_</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>SYSTEM LOAD</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DASHBOARD */}
          {step === 'DASHBOARD' && result && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              
              {/* 1. Daily Fortune (System Status) */}
              <div className="col-span-1 lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-5 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={100} />
                </div>
                <h3 className="text-blue-400 font-bold text-sm mb-4 flex items-center gap-2">
                  <Activity size={16}/> 今日運程 (SYSTEM STATUS)
                </h3>
                <div className="flex items-end gap-4 mb-4">
                   <div>
                      <div className="text-xs text-slate-500 mb-1">能量運轉效率</div>
                      <div className={`text-4xl font-black ${result.dailyEfficiency > 80 ? 'text-green-400' : result.dailyEfficiency > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {result.dailyEfficiency}%
                      </div>
                   </div>
                   <div className="h-10 w-px bg-slate-700 mx-2"></div>
                   <div className="space-y-1">
                      <div className="text-xs text-slate-400 flex items-center gap-2"><MapPin size={12}/> 吉利方位: <span className="text-white">{result.luckyDirection}</span></div>
                      <div className="text-xs text-slate-400 flex items-center gap-2"><Lock size={12}/> 幸運物: <span className="text-white">{result.luckyItem}</span></div>
                      <div className="text-xs text-slate-400 flex items-center gap-2"><BarChart3 size={12}/> 最佳時段: <span className="text-white">{result.luckyTime}</span></div>
                   </div>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                   <div className={`h-full ${result.dailyEfficiency > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${result.dailyEfficiency}%`}}></div>
                </div>
              </div>

              {/* 5. DOOM WARNING (Alert System) - Prominent if dangerous */}
              <div className={`col-span-1 border rounded-xl p-5 relative ${result.isDoom ? 'bg-red-900/20 border-red-500 animate-pulse' : 'bg-slate-800/50 border-slate-700'}`}>
                 <h3 className={`${result.isDoom ? 'text-red-400' : 'text-green-400'} font-bold text-sm mb-4 flex items-center gap-2`}>
                    {result.isDoom ? <ShieldAlert size={16}/> : <ShieldAlert size={16}/>} 
                    {result.isDoom ? '系統警報 (ALERT)' : '系統通知 (NOTICE)'}
                 </h3>
                 <div className={`text-sm font-bold leading-relaxed ${result.isDoom ? 'text-white' : 'text-slate-400'}`}>
                    {result.doomWarning}
                 </div>
                 {result.isDoom && (
                   <div className="mt-4 text-xs bg-red-950 text-red-300 p-2 rounded border border-red-900">
                      避險指南：建議開啟飛行模式，減少對外接口。
                   </div>
                 )}
              </div>

              {/* 2. Love Navigation */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-pink-500/50 transition-colors">
                <h3 className="text-pink-400 font-bold text-sm mb-4 flex items-center gap-2">
                  <Heart size={16}/> 戀愛導航 (CONNECTION)
                </h3>
                <div className="mb-3">
                   <span className="text-xs text-slate-500 block mb-1">契合度係數</span>
                   <div className="w-full bg-slate-700 h-2 rounded-full mb-1">
                      <div className="h-full bg-pink-500" style={{width: `${result.compatibility}%`}}></div>
                   </div>
                   <div className="text-right text-xs text-pink-300">{result.compatibility}/100</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-700 pt-3 mt-3">
                  <span className="text-pink-500 font-bold mr-2">&gt;</span>
                  {result.loveAnalysis}
                </p>
              </div>

              {/* 3. Career */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-cyan-500/50 transition-colors">
                 <h3 className="text-cyan-400 font-bold text-sm mb-4 flex items-center gap-2">
                    <Briefcase size={16}/> 工作事業 (WORKFLOW)
                 </h3>
                 <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-400">行業趨勢:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${result.careerTrend === 'UP' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                       {result.careerTrend === 'UP' ? 'Bullish (看漲)' : 'Bearish (看跌)'}
                    </span>
                 </div>
                 <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-700 pt-3">
                   <span className="text-cyan-500 font-bold mr-2">&gt;</span>
                   {result.careerAdvice}
                 </p>
              </div>

              {/* 4. Wealth */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-amber-500/50 transition-colors">
                 <h3 className="text-amber-400 font-bold text-sm mb-4 flex items-center gap-2">
                    <TrendingUp size={16}/> 財富指引 (ASSETS)
                 </h3>
                 <div className="flex gap-2 mb-4">
                    <div className="flex-1 bg-slate-900 p-2 rounded text-center border border-slate-700">
                       <div className="text-[10px] text-slate-500">正財 (Main)</div>
                       <div className="text-white font-bold">LV.{result.mainIncome}</div>
                    </div>
                    <div className="flex-1 bg-slate-900 p-2 rounded text-center border border-slate-700">
                       <div className="text-[10px] text-slate-500">偏財 (Side)</div>
                       <div className={`font-bold ${result.sideIncome > 7 ? 'text-amber-400' : 'text-slate-400'}`}>LV.{result.sideIncome}</div>
                    </div>
                 </div>
                 <p className="text-sm text-slate-300 leading-relaxed">
                   <span className="text-amber-500 font-bold mr-2">&gt;</span>
                   {result.wealthGuide}
                 </p>
              </div>

            </div>
          )}
        </div>
        
        {/* Footer */}
        {step === 'DASHBOARD' && (
           <div className="bg-slate-800 p-4 border-t border-slate-700 text-center">
              <p className="text-[10px] text-slate-500 mb-2">
                 Disclaimer: Results generated by stochastic algorithms. Not financial or life advice.
              </p>
              <button 
                onClick={() => setStep('INPUT')}
                className="text-xs text-blue-500 hover:text-blue-400 hover:underline"
              >
                 重新初始化 (REBOOT SYSTEM)
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
