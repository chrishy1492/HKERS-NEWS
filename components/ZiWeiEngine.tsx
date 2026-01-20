import React, { useState } from 'react';
import { Sparkles, Moon, Activity, Database, Server, Terminal, Lock, Eye, RefreshCw, ChevronRight } from 'lucide-react';

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC_PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];

// Simplified mapping for prototype
const FIVE_ELEMENTS_MAP: Record<string, number> = {
  '水': 2, '木': 3, '金': 4, '土': 5, '火': 6
};

interface ChartResult {
  mingGongIndex: number;
  shenGongIndex: number;
  fiveElement: string;
  bureau: number;
  ziWeiIndex: number;
  stars: Record<number, string[]>;
  analysis: string;
}

const calculateZiWeiChart = (birthDate: Date, hourIndex: number): ChartResult => {
  const lunarMonth = birthDate.getMonth() + 1; 
  const lunarDay = birthDate.getDate();
  const yearStemIndex = (birthDate.getFullYear() - 4) % 10; 

  const baseIndex = 2; // Yin
  const monthPos = (baseIndex + (lunarMonth - 1)) % 12;
  
  const mingGongIndex = (monthPos - hourIndex + 12) % 12;
  const shenGongIndex = (monthPos + hourIndex) % 12;

  const tigerStartStem = (yearStemIndex % 5) * 2 + 2; 
  const offsetFromYin = (mingGongIndex - 2 + 12) % 12;
  const mingGongStemIndex = (tigerStartStem + offsetFromYin) % 10;
  
  const elements = ['水', '木', '金', '土', '火'];
  const fiveElement = elements[(mingGongIndex + mingGongStemIndex) % 5];
  const bureau = FIVE_ELEMENTS_MAP[fiveElement];

  const ziWeiIndex = (mingGongIndex + lunarDay) % 12; 

  const stars: Record<number, string[]> = {};
  for(let i=0; i<12; i++) stars[i] = [];
  
  stars[ziWeiIndex].push('紫微(帝)');
  stars[(ziWeiIndex - 1 + 12) % 12].push('天機');
  stars[(ziWeiIndex - 3 + 12) % 12].push('太陽');
  stars[(ziWeiIndex - 4 + 12) % 12].push('武曲');
  stars[(ziWeiIndex - 5 + 12) % 12].push('天同');
  stars[(ziWeiIndex - 8 + 12) % 12].push('廉貞');

  const tianFuIndex = (12 - ziWeiIndex + 2) % 12; 
  stars[tianFuIndex].push('天府(令)');
  stars[(tianFuIndex + 1) % 12].push('太陰');
  stars[(tianFuIndex + 2) % 12].push('貪狼');
  stars[(tianFuIndex + 3) % 12].push('巨門');
  stars[(tianFuIndex + 4) % 12].push('天相');
  stars[(tianFuIndex + 5) % 12].push('天梁');
  stars[(tianFuIndex + 6) % 12].push('七殺');
  stars[(tianFuIndex + 10) % 12].push('破軍');

  const analysisTemplates = [
    `[System Audit]: 檢測到命宮位於${EARTHLY_BRANCHES[mingGongIndex]}位。核心處理器（紫微）運作於${EARTHLY_BRANCHES[ziWeiIndex]}區塊。\n[Optimization]: 當前五行局為${fiveElement}${bureau}局，建議針對情緒模組進行負載平衡。\n[Patch]: 未來十年大運顯示流量激增，建議擴容心智帶寬。`,
    `[Kernel Log]: 系統初始化完成。您的命盤架構屬於「殺破狼」動態編譯型，具有高並發處理能力。\n[Warning]: 遷移宮偵測到潛在的 Exception，外出需注意異常處理。\n[Action]: 建議重構人際關係接口，降低耦合度。`,
    `[Architecture View]: 典型的機月同梁格，適合後端邏輯處理與穩定運維。\n[Performance]: 財帛宮吞吐量穩定，但需注意緩存溢出（漏財）。\n[Strategy]: 建議採用保守迭代策略，避免激進的版本更新。`
  ];
  const analysis = analysisTemplates[mingGongIndex % 3];

  return {
    mingGongIndex,
    shenGongIndex,
    fiveElement,
    bureau,
    ziWeiIndex,
    stars,
    analysis
  };
};

const ZiWeiEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intro' | 'app'>('intro');
  const [birthDate, setBirthDate] = useState<string>('');
  const [birthHour, setBirthHour] = useState<number>(0);
  const [result, setResult] = useState<ChartResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = () => {
    if (!birthDate) return;
    setLoading(true);
    setTimeout(() => {
      const date = new Date(birthDate);
      const res = calculateZiWeiChart(date, birthHour);
      setResult(res);
      setLoading(false);
    }, 1200);
  };

  const ChartDisplay = ({ data }: { data: ChartResult }) => (
    <div className="mt-8 space-y-6 animate-fade-in-up text-left">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400">命宮 (Core)</div>
          <div className="text-xl font-bold text-purple-400">{EARTHLY_BRANCHES[data.mingGongIndex]}宮</div>
        </div>
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400">五行局 (Element)</div>
          <div className="text-xl font-bold text-amber-400">{data.fiveElement}{data.bureau}局</div>
        </div>
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400">紫微 (Emperor)</div>
          <div className="text-xl font-bold text-indigo-400">在{EARTHLY_BRANCHES[data.ziWeiIndex]}</div>
        </div>
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400">身宮 (Body)</div>
          <div className="text-xl font-bold text-slate-300">{EARTHLY_BRANCHES[data.shenGongIndex]}宮</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 md:gap-2 aspect-square md:aspect-video border-4 border-slate-800 bg-slate-900 p-1 rounded-lg">
        {[5, 6, 7, 8, 4, -1, -1, 9, 3, -1, -1, 10, 2, 1, 0, 11].map((idx, gridPos) => {
          if (idx === -1) {
             if (gridPos === 5) return (
               <div key={gridPos} className="col-span-2 row-span-2 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded">
                  <Moon className="w-12 h-12 text-purple-600 mb-2 opacity-50" />
                  <span className="text-slate-600 font-serif tracking-widest text-xs">ZiWei.Core</span>
               </div>
             );
             return null;
          }

          const isMing = idx === data.mingGongIndex;
          const starsInPalace = data.stars[idx];
          
          return (
            <div key={gridPos} className={`relative p-1 border border-slate-700 rounded flex flex-col justify-between ${isMing ? 'bg-purple-900/30 ring-1 ring-purple-500' : 'bg-slate-800/50'}`}>
              <div className="text-[10px] text-slate-500 flex justify-between">
                 <span>{EARTHLY_BRANCHES[idx]}</span>
                 {isMing && <span className="text-red-400 font-bold bg-red-900/20 px-1 rounded">命</span>}
              </div>
              <div className="flex flex-wrap gap-0.5 mt-1 content-start h-full overflow-hidden">
                {starsInPalace.map(star => (
                  <span key={star} className={`text-[9px] md:text-[10px] px-1 rounded whitespace-nowrap ${star.includes('紫微') ? 'text-amber-300 font-bold bg-amber-900/30' : 'text-purple-300'}`}>
                    {star}
                  </span>
                ))}
              </div>
              <div className="text-[9px] text-slate-600 text-right mt-auto hidden md:block">
                 {ZODIAC_PALACES[(idx - data.mingGongIndex + 12) % 12]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-black/40 border border-green-900/50 rounded-lg p-4 font-mono text-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3 border-b border-green-900/50 pb-2">
              <Terminal className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-bold">AI_Oracle_v2.log</span>
          </div>
          <div className="text-green-400 space-y-2 leading-relaxed whitespace-pre-line">
              {data.analysis}
          </div>
          <div className="mt-4 flex gap-2">
               <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Latency: 45ms</span>
               <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Confidence: 98.2%</span>
          </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-slate-200 min-h-[600px] flex flex-col">
      {/* Engine Header */}
      <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-2 text-purple-400 font-bold text-lg">
          <Database className="w-5 h-5" />
          <span>ZiWei.AI</span>
          <span className="text-[10px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700">Engineering Edition</span>
        </div>
        {activeTab === 'app' && (
          <button onClick={() => setActiveTab('intro')} className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
             Back to Root
          </button>
        )}
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === 'intro' ? (
          <div className="h-full flex flex-col items-center justify-center space-y-10 animate-fade-in text-center">
            <div className="space-y-4 max-w-lg">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                命運算法工程
              </h1>
              <p className="text-slate-400">
                Deconstructing destiny into deterministic code. <br/>
                An astrological debugging tool for engineers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left w-full max-w-3xl">
               <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-colors">
                 <Server className="w-6 h-6 text-indigo-500 mb-2" />
                 <h3 className="font-bold text-white mb-1">安星算法</h3>
                 <p className="text-xs text-slate-400">Algorithm based on Lunar celestial mapping logic.</p>
               </div>
               <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-colors">
                 <Eye className="w-6 h-6 text-amber-500 mb-2" />
                 <h3 className="font-bold text-white mb-1">工程師視角</h3>
                 <p className="text-xs text-slate-400">Translating fate into System Status, Bugs & Patches.</p>
               </div>
               <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-colors">
                 <Lock className="w-6 h-6 text-pink-500 mb-2" />
                 <h3 className="font-bold text-white mb-1">隱私加密</h3>
                 <p className="text-xs text-slate-400">Client-side processing. No data leaves your machine.</p>
               </div>
            </div>

            <button 
              onClick={() => setActiveTab('app')}
              className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-300 bg-indigo-600 rounded-full hover:bg-indigo-700 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950"
            >
              <span className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 
                啟動紫微排盤引擎 (Initialize)
                <ChevronRight size={16} />
              </span>
            </button>
            
            <div className="text-[10px] text-slate-600 font-mono pt-8">
               v0.9.1-beta | Built on React Core
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                輸入參數 (Input Parameters)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date of Birth</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Time of Birth</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none"
                    value={birthHour}
                    onChange={(e) => setBirthHour(Number(e.target.value))}
                  >
                    {EARTHLY_BRANCHES.map((branch, idx) => (
                      <option key={idx} value={idx}>
                        {branch}時 ({(idx * 2 + 23) % 24}:00 - {(idx * 2 + 1) % 24}:00)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleCalculate}
                  disabled={!birthDate || loading}
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all text-sm
                    ${!birthDate || loading 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'}`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Run Compilation
                    </>
                  )}
                </button>
              </div>
            </div>

            {!result && (
               <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg text-amber-500/60 text-[10px] font-mono">
                 [DISCLAIMER]: System output is for testing purposes only. Deterministic algorithms may not reflect the stochastic nature of reality.
               </div>
            )}

            {result && <ChartDisplay data={result} />}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ZiWeiEngine;