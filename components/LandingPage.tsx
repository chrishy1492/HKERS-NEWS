
import React, { useState } from 'react';
import { MessageCircle, Coins, ArrowRight } from 'lucide-react';
import { AppView } from '../types';
import HKERLogo from './Common/HKERLogo';

interface LandingPageProps {
  setView: (view: AppView) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-black">
      {/* Left: Forum - Lion Rock Theme */}
      <div 
        onClick={() => setView(AppView.FORUM)}
        className="relative w-full md:w-1/2 h-1/2 md:h-full bg-slate-900 flex items-center justify-center cursor-pointer transition-all duration-700 group border-b md:border-b-0 md:border-r border-white/5"
      >
        {/* 使用高品質獅子山夜景圖作為背景 */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1627664819818-e147d6221422?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20"></div>
        
        <div className="text-center p-8 z-10 transform group-hover:scale-105 transition-transform">
          <div className="mb-6 flex justify-center">
            <HKERLogo size={100} className="group-hover:shadow-[0_0_50px_rgba(185,28,28,0.5)] transition-all duration-500" />
          </div>
          <h1 className="text-6xl font-black text-white mb-4 tracking-tighter italic">HKER News Platform</h1>
          <p className="text-red-200 text-lg font-bold opacity-80 group-hover:opacity-100 transition-opacity tracking-widest uppercase">Lion Rock Community Hub</p>
          <div className="mt-8 inline-flex items-center space-x-3 px-10 py-4 bg-white text-black font-black rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl">
            <span>進入論壇 / ENTER</span>
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>

      {/* Right: Token - Red/Gold Web3 Theme */}
      <div 
        onClick={() => setView(AppView.TOKEN)}
        className="relative w-full md:w-1/2 h-1/2 md:h-full bg-gradient-to-bl from-red-900 via-orange-950 to-black flex items-center justify-center cursor-pointer transition-all duration-700 group"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="absolute inset-0 bg-radial-gradient from-red-600/10 to-transparent"></div>
        
        <div className="text-center p-8 z-10 transform group-hover:scale-105 transition-transform">
          <div className="w-32 h-32 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-red-500/30 group-hover:border-red-500/60 group-hover:shadow-[0_0_80px_rgba(220,38,38,0.4)] transition-all overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent animate-pulse"></div>
            <Coins size={64} className="text-red-400 relative z-10" />
          </div>
          <h1 className="text-6xl font-black text-white mb-4 tracking-tighter italic">HKER TOKEN</h1>
          <p className="text-amber-200 text-lg font-bold opacity-80 group-hover:opacity-100 transition-opacity tracking-widest uppercase">Decentralized Prosperity</p>
          <div className="mt-8 inline-flex items-center space-x-3 px-10 py-4 bg-amber-500 text-black font-black rounded-full hover:bg-white transition-all shadow-xl">
            <span>錢包連結 / WEB3</span>
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
