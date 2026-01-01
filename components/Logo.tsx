
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <div className={`relative bg-[#8B0000] flex flex-col items-center justify-end rounded-lg overflow-hidden select-none shadow-md border border-[#5c0000] ${className}`}>
    {/* Mountain Path */}
    <svg viewBox="0 0 100 60" className="absolute top-0 left-0 w-full h-full pointer-events-none">
       {/* Rough Mountain Outline */}
       <path 
         d="M -5 50 L 15 45 L 25 20 L 35 25 L 45 15 L 55 20 L 65 10 L 75 30 L 85 25 L 105 50" 
         fill="none" 
         stroke="#FCD34D" 
         strokeWidth="3"
         strokeLinecap="round"
         strokeLinejoin="round"
         className="drop-shadow-md"
       />
    </svg>
    <span className="relative z-10 text-white font-bold tracking-widest mb-1 leading-none drop-shadow-md" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
      HKER
    </span>
  </div>
);
