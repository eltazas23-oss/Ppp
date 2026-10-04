/**
 * TitleScreen.tsx
 * Clean, Minimalist AAA Title Screen for Apex GT.
 * Focused exclusively on the game title and an elegant, subtle start button.
 */

import React, { useEffect, useState } from 'react';
import { playEngineIgnitionRoar, playUiHover, playUiClick } from '../utils/uiAudio';

interface TitleScreenProps {
  onEnter: () => void;
  driverName?: string;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onEnter }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    if (isTransitioning) return;
    playUiClick(850);
    playEngineIgnitionRoar();
    setIsTransitioning(true);
    setTimeout(() => {
      onEnter();
    }, 400);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTransitioning]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-500 ${
        isTransitioning ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(12, 14, 20, 0.45) 0%, rgba(5, 7, 10, 0.78) 60%, rgba(2, 3, 5, 0.92) 100%)',
      }}
    >
      {/* Centerpiece: Clean Title & Subtle Start Button */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-xl mx-auto animate-fade-in">
        {/* Game Title */}
        <h1 className="text-6xl sm:text-8xl font-black tracking-widest uppercase font-mono text-white/95 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
          APEX GT
        </h1>

        <p className="text-xs sm:text-sm font-medium tracking-[0.35em] uppercase text-neutral-400 mt-2 font-mono">
          SQUARE CIRCUIT RACING
        </p>

        {/* Subtle, Elegant Start Button */}
        <div className="mt-12 sm:mt-16 flex flex-col items-center gap-3">
          <button
            onClick={handleStart}
            onMouseEnter={playUiHover}
            className="group relative px-9 py-3 sm:py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 hover:text-white border border-white/20 hover:border-white/50 backdrop-blur-md text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase font-mono transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] active:scale-95 cursor-pointer flex items-center gap-3"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-amber-400 transition-colors duration-300" />
            <span>INICIAR</span>
          </button>

          {/* Subtle Key Hint */}
          <span className="text-[10px] tracking-[0.25em] text-neutral-500 font-mono mt-1">
            [ ESPACIO / ENTER ]
          </span>
        </div>
      </div>
    </div>
  );
};
