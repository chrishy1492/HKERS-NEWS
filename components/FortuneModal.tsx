
import React, { useState, useEffect } from 'react';
import { X, Cpu, Activity, MapPin, Lock, BarChart3, ShieldAlert, Terminal, Clock } from 'lucide-react';

interface FortuneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAREER_ADVICE = ["重構工作流程，降低技術債。", "系統顯示適合跨部門協作。", "適合部署跳槽計畫。"];
const LOVE_STATUS = ["連線逾時，建議重試。", "TCP 三向交手成功，連結建立中。", "Ping 值過高，遠距離風險增加。"];
const DOOM_WARNINGS = ["系統運作正常 (Nominal)。", "系統運作正常 (Nominal)。", "【警告】水星逆行干擾，通訊可能丟包。"];

export const FortuneModal: React.FC<FortuneModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'INPUT' | 'PROCESSING' | 'DASHBOARD'>('INPUT');
  const [name, setName] = useState('');
  const [birthDateTime, setBirthDateTime] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runSimulation = () => {
    if (!name || !birthDateTime) return;
    setStep('PROCESSING');
    
    let cur = 0;
    const interval = setInterval(() => {
      if (cur < 100) {
        cur += 5;
        setProgress(cur);
      } else {
        clearInterval(interval);
        generateResult();
      }
    }, 100);
  };

  const generateResult = () => {
    const score = 60 + Math.floor(Math.random() * 39);
    setResult({
      dailyEfficiency: score,
      luckyTime: "12:00 - 15:00",
      luckyItem: "機械鍵盤",
      loveAnalysis: LOVE_STATUS[Math.floor(Math.random() * LOVE_STATUS.length)],
      careerAdvice: CAREER_ADVICE[Math.floor(Math.random() * CAREER_ADVICE.length)],
      doomWarning: DOOM_WARNINGS[Math.floor(Math.random() * DOOM_WARNINGS.length)]
    });
    setStep('DASHBOARD');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-mono">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-700 flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Cpu className="text-blue-500 animate-pulse" />
            <h2 className="text-lg font-black text-slate-200 tracking-tighter uppercase">AI Quantum Fate Engine <span className="text-[10px] bg-blue-600 px-1.5 rounded">v4.0</span></h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X/></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 'INPUT' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="w-full max-w-md space-y-4 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
                <div>
                  <label className="block text-[10px] font-black text-blue-400 mb-2 uppercase">用戶標識 (Name)</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-sans" placeholder="輸入姓名..."/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-400 mb-2 uppercase">初始化時間軸 (Birth Date & Time)</label>
                  {/* Optimized Mobile Input (Requirement 58) */}
                  <input type="datetime-local" value={birthDateTime} onChange={e=>setBirthDateTime(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-sans cursor-pointer"/>
                </div>
                <button onClick={runSimulation} disabled={!name || !birthDateTime} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
                  <Terminal size={18}/> 執行 AI 分析
                </button>
              </div>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-blue-500 transition-all" style={{width:`${progress}%`}}></div>
               </div>
               <p className="text-blue-400 text-xs animate-pulse">正在透過量子矩陣計算命運曲線...</p>
            </div>
          )}

          {step === 'DASHBOARD' && result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-blue-400 font-black text-xs mb-4 flex items-center gap-2"><Activity size={14}/> 今日運程系統狀態</h3>
                <div className="text-4xl font-black text-green-400 mb-2">{result.dailyEfficiency}%</div>
                <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700 pt-3">{result.careerAdvice}</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-pink-400 font-black text-xs mb-4 flex items-center gap-2"><Clock size={14}/> 戀愛導航參數</h3>
                <p className="text-sm text-slate-200 mb-2">{result.loveAnalysis}</p>
                <div className="text-[10px] text-slate-500">吉時: {result.luckyTime} | 吉物: {result.luckyItem}</div>
              </div>
              <div className={`col-span-full p-5 rounded-xl border-2 ${result.doomWarning.includes('正常') ? 'border-green-900 bg-green-900/10' : 'border-red-900 bg-red-900/10 animate-pulse'}`}>
                 <h3 className="text-white font-black text-xs mb-2 flex items-center gap-2"><ShieldAlert size={14}/> 安全防護建議</h3>
                 <p className="text-sm font-bold text-slate-300">{result.doomWarning}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
