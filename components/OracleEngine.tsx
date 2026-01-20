import React, { useState, useEffect } from 'react';
import { 
  Cpu, Heart, Briefcase, TrendingUp, AlertTriangle, 
  MapPin, Zap, Shield, Search, Power, Terminal, 
  UserCheck, Lock
} from 'lucide-react';

/**
 * Project Oracle - Frontend Prototype
 * 模擬 AI 運算的命理平台 (Engineer Edition)
 */

// 模擬 AI 生成的數據
const SIMULATION_DATA = {
  daily: {
    score: 85,
    advice: "今日邏輯迴路清晰，適合重構代碼或進行深度決策。",
    luckyTime: "14:00 - 16:00",
    luckyColor: "#10b981" // Emerald
  },
  love: {
    status: "Searching...",
    matchRate: 72,
    prediction: "下個季度社交圈擴展，可能遇到 INTJ 型人格的對象。",
    action: "建議優化個人 Profile，增加展示生活趣味的參數。"
  },
  career: {
    trend: "Upward",
    opportunity: "高",
    keyword: "跨域整合",
    advice: "當前職位已進入舒適區，建議啟動 Side Project 測試新技能。"
  },
  wealth: {
    riskLevel: "Medium",
    focus: "正財為主",
    allocation: "建議 70% 投入本業精進，30% 進行防禦性資產配置。",
    signal: "Wait"
  },
  disaster: {
    active: false,
    warning: "目前運行平穩，無重大 Bug (厄運) 檢測。",
    mitigation: "保持規律作息即可維持系統穩定。"
  }
};

export default function OracleEngine() {
  const [systemState, setSystemState] = useState<'IDLE' | 'BOOTING' | 'ANALYZING' | 'READY'>('IDLE');
  const [activeModule, setActiveModule] = useState<string>('daily');
  const [logs, setLogs] = useState<string[]>([]);

  // 模擬啟動過程
  const handleSystemStart = () => {
    setSystemState('BOOTING');
    setLogs([]); // Clear logs
    addLog("Initializing Project Oracle Kernel v2.4.0...");
    
    setTimeout(() => {
      setSystemState('ANALYZING');
      addLog("Connecting to Celestial Database...");
      addLog("Fetching User Geolocation & Biometrics...");
      addLog("Running Neural Network Inference...");
    }, 1500);

    setTimeout(() => {
      setSystemState('READY');
      addLog("Analysis Complete. Dashboard Rendered.");
    }, 3500);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // 模組內容渲染器
  const renderModuleContent = () => {
    switch(activeModule) {
      case 'daily':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500">
              <div>
                <h3 className="text-slate-400 text-xs uppercase tracking-wider">System Status (今日運程)</h3>
                <div className="text-3xl font-bold text-white mt-1">{SIMULATION_DATA.daily.score}/100</div>
              </div>
              <ActivityGraph />
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Actionable Insight
              </h4>
              <p className="text-slate-300 text-sm">{SIMULATION_DATA.daily.advice}</p>
              <div className="mt-4 flex gap-2">
                 <Badge icon={<Zap className="w-3 h-3" />} text={`巔峰時段: ${SIMULATION_DATA.daily.luckyTime}`} color="bg-yellow-900/50 text-yellow-400 border-yellow-700" />
                 <Badge icon={<MapPin className="w-3 h-3" />} text="方位: 西北 (Server Room)" color="bg-blue-900/50 text-blue-400 border-blue-700" />
              </div>
            </div>
          </div>
        );
      case 'love':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-pink-950/30 p-4 rounded-lg border border-pink-900">
                 <div className="text-pink-400 text-xs mb-1">Compatibility (契合度)</div>
                 <div className="text-2xl font-bold text-white">{SIMULATION_DATA.love.matchRate}%</div>
                 <div className="w-full bg-slate-700 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div className="bg-pink-500 h-full" style={{width: `${SIMULATION_DATA.love.matchRate}%`}}></div>
                 </div>
               </div>
               <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                 <div className="text-slate-400 text-xs mb-1">Target Profile</div>
                 <div className="text-lg font-bold text-white">INTJ / Engineer</div>
               </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
               <h4 className="text-pink-400 font-bold mb-2">Algorithm Prediction</h4>
               <p className="text-slate-300 text-sm">{SIMULATION_DATA.love.prediction}</p>
               <div className="mt-3 p-3 bg-slate-900 rounded text-xs text-slate-400 font-mono">
                 Suggested_Action: {SIMULATION_DATA.love.action}
               </div>
            </div>
          </div>
        );
      case 'career':
        return (
          <div className="space-y-4 animate-fade-in">
             <div className="flex gap-4">
               <div className="flex-1 bg-slate-800 p-4 rounded-lg border-t-4 border-blue-500">
                  <div className="text-blue-400 font-bold mb-1">Trend Analysis</div>
                  <div className="text-white text-sm">市場需求: <span className="text-green-400">High</span></div>
                  <div className="text-white text-sm">技能匹配: <span className="text-yellow-400">Optimizing</span></div>
               </div>
             </div>
             <div className="bg-slate-800 p-4 rounded-lg">
                <h4 className="text-blue-400 font-bold mb-2">Career Pivot Strategy</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{SIMULATION_DATA.career.advice}</p>
             </div>
          </div>
        );
      case 'wealth':
         return (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Risk Assessment</div>
                  <div className="text-xl font-bold text-yellow-500">{SIMULATION_DATA.wealth.riskLevel}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Signal</div>
                  <div className="text-xl font-bold text-white px-3 py-1 bg-slate-700 rounded">{SIMULATION_DATA.wealth.signal}</div>
                </div>
             </div>
             <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h4 className="text-yellow-400 font-bold mb-2">Portfolio Logic</h4>
                <p className="text-slate-300 text-sm">{SIMULATION_DATA.wealth.allocation}</p>
             </div>
          </div>
         );
      case 'disaster':
        return (
           <div className="space-y-4 animate-fade-in">
              <div className="bg-red-950/20 p-6 rounded-lg border border-red-900/50 flex flex-col items-center text-center">
                 <Shield className="w-12 h-12 text-green-500 mb-4" />
                 <h3 className="text-white font-bold text-lg">System Integrity: Stable</h3>
                 <p className="text-slate-400 text-sm mt-2">{SIMULATION_DATA.disaster.warning}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                 <h4 className="text-slate-400 text-xs uppercase mb-2">Mitigation Protocol</h4>
                 <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                    <li>定期備份重要數據 (Data Backup)</li>
                    <li>避免衝動性 Git Push (重大決策)</li>
                    <li>{SIMULATION_DATA.disaster.mitigation}</li>
                 </ul>
              </div>
           </div>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-slate-200 min-h-[600px] flex flex-col p-4 md:p-8">
      
      {/* 1. Header Area */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="text-white w-6 h-6" />
           </div>
           <div>
             <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Project Oracle</h1>
             <p className="text-xs text-slate-500 font-mono">AI-Driven Destiny Computation Engine</p>
           </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Server Online</span>
           <span>v2.4.0 (Stable)</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* 2. Main Dashboard (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
           {systemState !== 'READY' ? (
             <div className="h-full min-h-[400px] bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden p-8">
                {systemState === 'IDLE' ? (
                   <div className="text-center space-y-4">
                      <Lock className="w-16 h-16 text-slate-700 mx-auto" />
                      <p className="text-slate-500">System Locked. Authentication Required.</p>
                      <p className="text-xs text-slate-600">Please activate via Feng Shui Zone.</p>
                   </div>
                ) : (
                   <div className="w-full max-w-md font-mono text-xs text-green-500 space-y-1">
                      {logs.map((log, i) => (
                        <div key={i} className="opacity-80">{log}</div>
                      ))}
                      <div className="animate-pulse">_</div>
                   </div>
                )}
             </div>
           ) : (
             <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl h-full">
                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
                   <TabButton active={activeModule === 'daily'} onClick={() => setActiveModule('daily')} icon={<MapPin size={16}/>} label="今日運程" />
                   <TabButton active={activeModule === 'love'} onClick={() => setActiveModule('love')} icon={<Heart size={16}/>} label="戀愛導航" />
                   <TabButton active={activeModule === 'career'} onClick={() => setActiveModule('career')} icon={<Briefcase size={16}/>} label="工作事業" />
                   <TabButton active={activeModule === 'wealth'} onClick={() => setActiveModule('wealth')} icon={<TrendingUp size={16}/>} label="財富指引" />
                   <TabButton active={activeModule === 'disaster'} onClick={() => setActiveModule('disaster')} icon={<AlertTriangle size={16}/>} label="厄運預警" />
                </div>
                
                {/* Content Area */}
                <div className="p-6">
                   {renderModuleContent()}
                </div>
             </div>
           )}
        </div>

        {/* 3. Sidebar & Feng Shui Zone (Right 1/3) */}
        <div className="space-y-6">
           
           {/* User Profile Summary (Placeholder) */}
           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <UserCheck className="text-slate-400 w-5 h-5" />
                 </div>
                 <div>
                    <div className="text-sm font-bold text-white">Guest Engineer</div>
                    <div className="text-xs text-slate-500">ID: #9821-X</div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                 <div className="bg-slate-950 p-2 rounded">LOC: 25.03°N</div>
                 <div className="bg-slate-950 p-2 rounded">TZ: GMT+8</div>
              </div>
           </div>

           {/* The Feng Shui Zone (Requested Button) */}
           <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900 ring-1 ring-slate-800 rounded-2xl p-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                       <Search className="w-4 h-4 text-purple-400" />
                       風水算命區
                    </h3>
                    <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full border border-purple-800">ZONE-A</span>
                 </div>
                 
                 <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    啟動神經網絡模型，連結大數據與傳統命理算法。
                    <br/><span className="text-slate-600">Power consumption: 1.2GW</span>
                 </p>

                 <button 
                    onClick={handleSystemStart}
                    disabled={systemState !== 'IDLE' && systemState !== 'READY'}
                    className="w-full relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-indigo-500/50"
                 >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="flex items-center justify-center gap-2">
                       <Power className={`w-4 h-4 ${systemState === 'BOOTING' ? 'animate-pulse' : ''}`} />
                       {systemState === 'IDLE' || systemState === 'READY' ? '啟動全系統掃描' : '系統運算中...'}
                    </div>
                 </button>
              </div>
           </div>

        </div>

      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Components
const TabButton = ({active, onClick, icon, label}: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
      ${active ? 'text-white border-b-2 border-indigo-500 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
  >
    {icon} {label}
  </button>
);

const Badge = ({icon, text, color}: any) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
    {icon} {text}
  </span>
);

const ActivityGraph = () => (
  <div className="flex items-end gap-1 h-8">
     {[40, 60, 30, 80, 100, 70, 50].map((h, i) => (
       <div key={i} className="w-1 bg-emerald-500/50 rounded-t-sm hover:bg-emerald-400 transition-colors" style={{height: `${h}%`}}></div>
     ))}
  </div>
);
