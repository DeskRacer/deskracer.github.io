/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundEngine } from '../game/audio';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    soundEngine.playCountdownBeep(false);

    const timer1 = setTimeout(() => {
      setCount(2);
      soundEngine.playCountdownBeep(false);
    }, 650);

    const timer2 = setTimeout(() => {
      setCount(1);
      soundEngine.playCountdownBeep(false);
    }, 1300);

    const timer3 = setTimeout(() => {
      setCount(0); // GO!
      soundEngine.playCountdownBeep(true);
    }, 1950);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 2600);

    // Allow player to tap or press gas to start immediately
    const handleSkip = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp', 'Space', 'Enter'].includes(e.code)) {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleSkip);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      window.removeEventListener('keydown', handleSkip);
    };
  }, [onComplete]);

  return (
    // Positioned safely at the TOP of the screen, NEVER on top of the car
    <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none flex flex-col items-center">
      <div className="rounded-2xl border border-white/15 bg-slate-900/95 px-5 sm:px-7 py-2 sm:py-2.5 shadow-2xl shadow-cyan-950/80 flex flex-col items-center gap-1.5">
        {/* F1-Style 3-Light Start Gantry */}
        <div className="flex items-center gap-3 py-1">
          {/* Light 1 */}
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/20 transition-all duration-150 ${
              count === 0
                ? 'bg-emerald-400 shadow-[0_0_15px_#10b981]'
                : count <= 3
                ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                : 'bg-slate-800'
            }`}
          />
          {/* Light 2 */}
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/20 transition-all duration-150 ${
              count === 0
                ? 'bg-emerald-400 shadow-[0_0_15px_#10b981]'
                : count <= 2
                ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                : 'bg-slate-800'
            }`}
          />
          {/* Light 3 */}
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/20 transition-all duration-150 ${
              count === 0
                ? 'bg-emerald-400 shadow-[0_0_15px_#10b981]'
                : count <= 1
                ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                : 'bg-slate-800'
            }`}
          />
        </div>

        {/* Clean Status Text */}
        <div className="font-mono text-xs sm:text-sm font-black uppercase tracking-widest">
          {count === 3 && <span className="text-rose-400">READY</span>}
          {count === 2 && <span className="text-rose-400">SET</span>}
          {count === 1 && <span className="text-amber-300">REVVING...</span>}
          {count === 0 && <span className="text-emerald-400 italic">GO! LIGHTS OUT</span>}
        </div>
      </div>
    </div>
  );
};
