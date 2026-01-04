
import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<Props> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizes[size]} ${className}`}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
      
      {/* SVG Icon */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="relative z-10 w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
      >
        {/* Stylized Lion Rock Silhouette */}
        <path 
          d="M10 75C15 65 25 50 40 45C55 40 65 30 75 35C85 40 90 60 90 75H10Z" 
          fill="url(#lion_grad)" 
        />
        <path 
          d="M10 75C15 65 25 50 40 45C55 40 65 30 75 35C85 40 90 60 90 75H10Z" 
          stroke="white" 
          strokeWidth="1" 
          strokeOpacity="0.3"
        />
        
        {/* HK Monogram */}
        <text 
          x="50%" 
          y="70%" 
          dominantBaseline="middle" 
          textAnchor="middle" 
          fill="white" 
          fontSize="24" 
          fontWeight="900" 
          fontFamily="Inter, sans-serif"
          style={{ letterSpacing: '-1px' }}
        >
          HKER
        </text>

        <defs>
          <linearGradient id="lion_grad" x1="10" y1="30" x2="90" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Logo;
