
import React from 'react';
import { Layout, Coins, ArrowRight } from 'lucide-react';
import Logo from './Logo';

interface Props {
  onSelect: (view: 'news' | 'token') => void;
}

const LandingPage: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white overflow-hidden font-sans">
      {/* News Section */}
      <div 
        onClick={() => onSelect('news')}
        className="group relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-1000 ease-out hover:flex-[1.6] bg-slate-950 border-b md:border-b-0 md:border-r border-white/5"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="absolute inset-0 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl scale-150" />
        </div>

        <div className="relative z-10 flex flex-col items-center transform group-hover:scale-105 transition-all duration-700">
          <div className="w-24 h-24 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-400/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_70px_rgba(59,130,246,0.3)] group-hover:-rotate-3 transition-all duration-700">
            <Layout size={44} className="text-blue-400" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-center leading-none">
            HKER<br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">NEWS</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium tracking-wide opacity-60 group-hover:opacity-100 transition-opacity text-center px-12">
            獅子山下的新聞、資訊、社群
          </p>

          <div className="mt-12 flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-3xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100 backdrop-blur-xl">
             <span className="font-black text-sm uppercase tracking-widest">進入論壇</span>
             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Token Section */}
      <div 
        onClick={() => onSelect('token')}
        className="group relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-1000 ease-out hover:flex-[1.6] bg-slate-950"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="absolute inset-0 overflow-hidden">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl scale-150" />
        </div>

        <div className="relative z-10 flex flex-col items-center transform group-hover:scale-105 transition-all duration-700">
          <div className="w-24 h-24 bg-purple-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-purple-400/20 shadow-[0_0_50px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_70px_rgba(168,85,247,0.3)] group-hover:rotate-3 transition-all duration-700">
            <Coins size={44} className="text-purple-400" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-center leading-none">
            HKER<br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">TOKEN</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium tracking-wide opacity-60 group-hover:opacity-100 transition-opacity text-center px-12">
            專屬積分、遊戲與價值中心
          </p>

          <div className="mt-12 flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-3xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100 backdrop-blur-xl">
             <span className="font-black text-sm uppercase tracking-widest">積分遊戲</span>
             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
      
      {/* Central Branding Hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:block">
        <div className="relative p-6">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-90 group-hover:scale-100 transition-transform duration-1000" />
          <Logo size="lg" className="relative z-10 p-2" />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
