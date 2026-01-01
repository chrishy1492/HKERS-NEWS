
import React, { useState } from 'react';
import { FengShuiSubView } from '../types';
import { Moon, Sparkles, Zap, Flower, ChevronLeft, Star } from 'lucide-react';
import FortuneView from './FortuneView';
import TarotView from './TarotView';
import ZiWeiView from './ZiWeiView';
import PrayView from './PrayView';

interface FengShuiZoneViewProps {
  supabase: any;
  userProfile: any;
  showNotification: any;
}

const FengShuiZoneView: React.FC<FengShuiZoneViewProps> = ({ supabase, userProfile, showNotification }) => {
  const [subView, setSubView] = useState<FengShuiSubView>('lobby');

  if (subView === 'lobby') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <Star className="text-indigo-500" size={20} />
            <span className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Feng Shui & Destiny Hub</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">風水算命區</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">傳統智慧 • AI 映射 • 雲端加持</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FengShuiCard 
            title="小六壬測算" 
            desc="Lui Ren Oracle" 
            icon={<Moon size={40}/>} 
            color="bg-slate-900"
            onClick={() => setSubView('fortune')} 
          />
          <FengShuiCard 
            title="AI 塔羅引擎" 
            desc="Tarot Neural Engine" 
            icon={<Sparkles size={40}/>} 
            color="bg-indigo-900"
            onClick={() => setSubView('tarot')} 
          />
          <FengShuiCard 
            title="紫微斗數" 
            desc="Zi Wei Destiny" 
            icon={<Zap size={40}/>} 
            color="bg-purple-900"
            onClick={() => setSubView('ziwei')} 
          />
          <FengShuiCard 
            title="雲端祈福" 
            desc="Virtual Blessing" 
            icon={<Flower size={40}/>} 
            color="bg-rose-900"
            onClick={() => setSubView('pray')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => setSubView('lobby')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest group transition-all"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回風水大廳
      </button>
      {subView === 'fortune' && <FortuneView />}
      {subView === 'tarot' && <TarotView />}
      {subView === 'ziwei' && <ZiWeiView />}
      {subView === 'pray' && <PrayView />}
    </div>
  );
};

const FengShuiCard = ({ title, desc, icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`relative h-56 rounded-[3rem] p-10 overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl text-left ${color}`}
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
      {icon}
    </div>
    <div className="relative z-10 flex items-center gap-8 h-full">
      <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="text-3xl font-black text-white tracking-tight">{title}</h3>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">{desc}</p>
      </div>
    </div>
  </button>
);

export default FengShuiZoneView;
