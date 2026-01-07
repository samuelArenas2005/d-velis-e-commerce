
import React, { useState } from 'react';

const MagicCandle: React.FC = () => {
  const [isLit, setIsLit] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div 
        onClick={() => setIsLit(!isLit)}
        className="relative cursor-pointer group transition-transform hover:scale-105"
        title={isLit ? "Click para apagar" : "Click para encender"}
      >
        {/* Glow effect */}
        {isLit && (
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl animate-pulse" />
        )}

        {/* Flame */}
        <div className={`absolute top-[-35px] left-1/2 -translate-x-1/2 transition-all duration-500 ${isLit ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
          <div className="relative w-4 h-10">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-t from-orange-600 via-yellow-400 to-white rounded-full blur-[1px] animate-flicker origin-bottom" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-4 bg-white/40 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Wick (Pabilo) */}
        <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-1 h-3 bg-gray-800 rounded-full" />

        {/* Candle Body (3D Cylinder) */}
        <div className="relative w-16 h-32">
          {/* Top surface */}
          <div className="absolute top-[-6px] left-0 w-full h-4 bg-[#EADED2] rounded-[100%] border-b border-black/5 shadow-inner" />
          
          {/* Main Body */}
          <div className="w-full h-full bg-gradient-to-r from-[#D7C4B1] via-[#EADED2] to-[#C5B19D] rounded-b-xl shadow-lg border-x border-[#D7C4B1]" />
          
          {/* Bottom Shadow */}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-[110%] h-4 bg-black/10 rounded-[100%] blur-sm" />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[#7C5E47] font-serif italic text-lg">
          {isLit ? "Nuestra luz siempre brilla para ti" : "Haz click para encender nuestra magia"}
        </p>
        <span className="text-[10px] text-[#8C7A6B] font-bold uppercase tracking-widest mt-2 block">
          Interacción D'Velis
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flicker {
          0%, 100% { transform: translateX(-50%) scaleY(1) rotate(-1deg); }
          25% { transform: translateX(-50%) scaleY(1.1) rotate(1deg); }
          50% { transform: translateX(-50%) scaleY(0.9) rotate(-0.5deg); }
          75% { transform: translateX(-50%) scaleY(1.05) rotate(0.5deg); }
        }
        .animate-flicker {
          animation: flicker 0.6s infinite alternate;
        }
      `}} />
    </div>
  );
};

export default MagicCandle;
