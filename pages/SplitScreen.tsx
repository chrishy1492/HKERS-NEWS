
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Using hash router from App

const SplitScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      {/* LEFT: Token Info */}
      <div 
        onClick={() => navigate('/token')}
        className="h-1/2 md:h-full md:w-1/2 bg-black text-hker-yellow flex flex-col items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-500 border-b-4 md:border-b-0 md:border-r-4 border-hker-red p-8 group relative overflow-hidden"
      >
        {/* Updated Background to Lion Rock Night View */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558273618-6225a075d58c?q=80&w=1200')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        
        <div className="z-10 text-center">
          {/* Logo Placeholder (Red Coin Style) */}
          <div className="w-32 h-32 mx-auto mb-6 bg-[#D32F2F] rounded-full border-[4px] border-[#FFD700] flex flex-col items-center justify-center shadow-lg group-hover:rotate-6 transition duration-500 overflow-hidden relative">
               <div className="absolute bottom-6 w-full h-12 border-t-2 border-[#FFD700] rounded-[50%]"></div>
               <div className="text-white font-bold text-4xl tracking-tighter relative z-10" style={{fontFamily: '"Comic Sans MS", cursive'}}>HKER</div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter text-white drop-shadow-lg">獅子山精神</h1>
          <p className="text-lg md:text-xl font-bold tracking-[0.2em] uppercase mb-8 text-hker-red">Lion Rock Spirit</p>
          
          <div className="mt-4 px-8 py-3 bg-hker-red text-white font-bold rounded-full group-hover:bg-white group-hover:text-hker-red transition shadow-lg flex items-center gap-2 mx-auto w-fit">
            ENTER TOKEN SITE
          </div>
        </div>
      </div>

      {/* RIGHT: Platform */}
      <div 
        onClick={() => navigate('/platform')}
        className="h-1/2 md:h-full md:w-1/2 bg-white text-hker-black flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all duration-500 p-8 group relative"
      >
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/hongkong/1200/800')] opacity-10 bg-cover bg-center group-hover:opacity-20 transition-all duration-700"></div>
        <div className="z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter text-hker-red">PLATFORM</h1>
          <p className="text-xl md:text-2xl font-light tracking-widest uppercase mb-8">News • Forum • Games</p>
           <div className="mt-4 px-6 py-3 border-2 border-hker-red rounded-full text-hker-red font-bold group-hover:bg-hker-red group-hover:text-white transition">
            ENTER COMMUNITY
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitScreen;
