
import React from 'react';
import { Sparkles, Zap, Compass, Hexagon, Flame, Hand, Info, ArrowLeft } from 'lucide-react';
import { ForumSubView } from '../../types';

interface FortuneHubProps {
  onSelect: (view: ForumSubView) => void;
}

const FortuneHub: React.FC<FortuneHubProps> = ({ onSelect }) => {
  const tools = [
    { id: ForumSubView.FORTUNE_AI, name: '量子命理 AI', desc: '結合星象大數據的深度運勢分析', icon: <Zap size={28} />, color: 'from-fuchsia-600 to-indigo-900', label: 'Recommended' },
    { id: ForumSubView.PRAYER, name: '雲端祈福 Nexus', desc: '向神祇傳遞您的誠心與祝願', icon: <Flame size={28} />, color: 'from-orange-600 to-red-900', label: 'Spiritual' },
    { id: ForumSubView.ZIWEI, name: '紫微斗數排盤', desc: 'AI 解析十四主星與命宮關係', icon: <Compass size={28} />, color: 'from-emerald-600 to-teal-900', label: 'Academic' },
    { id: ForumSubView.TAROT, name: 'AI 塔羅占卜', desc: '深度神經網絡解讀塔羅密碼', icon: <Hexagon size={28} />, color: 'from-indigo-600 to-slate-900', label: 'Mystical' },
    { id: ForumSubView.FORTUNE_TELLER, name: '掐指一算 (小六壬)', desc: '民間傳統簡易占卜法', icon: <Hand size={28} />, color: 'from-purple-600 to-pink-900', label: 'Classic' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 animate-in fade-in duration-500">
      <div className="bg-slate-950 rounded-[48px] p-8 md:p-16 text-white border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        
        <div className="relative z-10">
          <div className="mb-16">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-fuchsia-500 uppercase leading-none">
              FORTUNE NEXUS
            </h1>
            <p className="text-slate-400 font-bold mt-4 flex items-center gap-2 uppercase tracking-widest text-sm">
              <Sparkles size={16} className="text-indigo-400" /> Lion Rock Cyber-Occult Engine v5.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map(tool => (
              <button 
                key={tool.id}
                onClick={() => onSelect(tool.id)}
                className={`relative group p-8 rounded-[40px] bg-gradient-to-br ${tool.color} border border-white/10 shadow-xl transition-all hover:scale-105 active:scale-95 overflow-hidden text-left h-full flex flex-col justify-between`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <div>
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-6 shadow-inner">
                    {tool.icon}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight leading-tight">{tool.name}</h3>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-2 leading-relaxed">{tool.desc}</p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                    <span>進入探索 / ENTER</span>
                  </div>
                  <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-tighter border border-white/10">{tool.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-16 bg-white/5 p-6 rounded-[32px] border border-white/10 flex items-start gap-4">
             <Info className="text-indigo-400 flex-shrink-0" size={20} />
             <p className="text-xs text-slate-400 font-medium leading-relaxed">
               風水算命與祈福功能為數位化玄學體驗，結合傳統智慧與現代 AI 算法。請謹記「命由天定，運由人改」，凡事應以平常心對待，獅子山精神的核心是創造價值與守望相助。
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FortuneHub;
