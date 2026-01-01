
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative bg-[#A10000] p-1.5 rounded-lg overflow-hidden shadow-2xl border border-white/20 group transition-transform hover:scale-105">
        <svg viewBox="0 0 200 120" className="h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Mountain Path - Styled to match the provided image */}
          <path 
            d="M15 85 C 30 65, 50 35, 65 50 C 80 65, 95 25, 125 40 C 155 55, 175 70, 190 80" 
            stroke="#FBBF24" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          {/* HKER Text - Stylized white text */}
          <text 
            x="50%" 
            y="95" 
            textAnchor="middle" 
            fill="white" 
            style={{ 
              font: 'bold 48px "Brush Script MT", cursive, sans-serif', 
              letterSpacing: '1px',
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))'
            }}
          >
            HKER
          </text>
        </svg>
      </div>
      <span className="text-xl font-black tracking-tighter text-white drop-shadow-md hidden sm:block">FORUM</span>
    </div>
  );
};

export default Logo;
