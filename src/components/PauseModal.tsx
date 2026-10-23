/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onExitTitle }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 p-4 select-none">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl">
        <h2 className="text-center font-mono text-2xl font-black uppercase tracking-wider text-white">
          Game Paused
        </h2>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 font-mono font-bold text-white transition-all hover:bg-cyan-400 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume [ESC / P]
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 py-3 font-mono font-bold text-slate-200 transition-all hover:bg-slate-700 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Time Trial
          </button>

          <button
            type="button"
            onClick={onExitTitle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 py-3 font-mono font-bold text-slate-400 transition-all hover:bg-slate-700 hover:text-white active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
