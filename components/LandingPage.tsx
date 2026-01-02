
import React from 'react';
import { MessageSquare, DollarSign } from 'lucide-react';
import { ViewState } from '../types';
import { Logo } from './Logo';

interface LandingPageProps {
  onSelect: (view: ViewState) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-900 text-white overflow-hidden">
      
      {/* Absolute Header Logo */}
      <div className="absolute top-6 left-6 z-50 animate-fade-in">
         <Logo className="w-16 h-16 shadow-lg border-2 border-white/20" />
      </div>

      {/* Left: Forum */}
      <div 
        onClick={() => onSelect('forum')}
        className="flex-1 flex flex-col items-center justify-center p-10 cursor-pointer hover:bg-slate-800 transition-all border-b md:border-b-0 md:border-r border-slate-700 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors"></div>
        <div className="p-6 rounded-full bg-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(37,99,235,0.5)] z-10">
          <MessageSquare size={64} />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center z-10">HKER 論壇</h1>
        <p className="text-slate-400 text-center max-w-md z-10">
          連結全球港人，分享生活、時事與娛樂。<br/>
          即時同步，Web3 積分系統。
        </p>
      </div>

      {/* Right: Token */}
      <div 
        onClick={() => onSelect('token')}
        className="flex-1 flex flex-col items-center justify-center p-10 cursor-pointer hover:bg-slate-800 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
        <div className="p-6 rounded-full bg-amber-500 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.5)] z-10">
          <DollarSign size={64} />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center text-amber-500 z-10">HKER Token</h1>
        <p className="text-slate-400 text-center max-w-md z-10">
          獅子山精神數位象徵。<br/>
          無需註冊即可查看流動性池與交易資訊。
        </p>
      </div>
    </div>
  );
};
