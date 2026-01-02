
import React from 'react';

interface HKERLogoProps {
  className?: string;
  size?: number;
}

const HKERLogo: React.FC<HKERLogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div 
      className={`relative rounded-full flex items-center justify-center overflow-hidden shadow-lg ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: '#B91C1C',
        border: `${size * 0.05}px solid #991B1B`
      }}
    >
      {/* 金色山脈線條 */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full opacity-80"
        style={{ transform: 'translateY(10%)' }}
      >
        <path 
          d="M10,60 Q30,20 50,45 T90,30" 
          fill="none" 
          stroke="#FCD34D" 
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      
      {/* HKER 文字 */}
      <span 
        className="relative z-10 font-black text-white italic tracking-tighter"
        style={{ fontSize: size * 0.35 }}
      >
        HKER
      </span>
      
      {/* 光澤效果 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
    </div>
  );
};

export default HKERLogo;
