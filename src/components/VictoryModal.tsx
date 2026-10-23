/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Trash2, Award, Coffee, ExternalLink } from 'lucide-react';
import { formatLapTime } from '../game/track';

interface VictoryModalProps {
  totalTime: number;
  bestLap: number | null;
  overallBestRace: number | null;
  isNewRecord: boolean;
  onPlayAgain: () => void;
  onExitTitle: () => void;
  onClearRecords: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  totalTime,
  bestLap,
  overallBestRace,
  isNewRecord,
  onPlayAgain,
  onExitTitle,
  onClearRecords,
}) => {
  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00d2ff', '#ffd700', '#10b981', '#ffffff'],
      });
    } catch {
      // fallback
    }
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4 select-none">
      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-cyan-950/60">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-black uppercase tracking-tight text-white italic">
            Checkered Flag!
          </h2>

          <p className="mt-1 text-xs font-mono uppercase tracking-widest text-cyan-400">
            3-Lap Time Trial Completed
          </p>

          {isNewRecord && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-mono font-bold text-emerald-300">
              <Award className="w-4 h-4" />
              NEW PERSONAL RECORD!
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 font-mono">
          <div className="rounded-xl border border-white/5 bg-slate-800/70 p-3.5 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Total Race Time</div>
            <div className="mt-1 text-2xl font-black text-cyan-300 tabular-nums">
              {formatLapTime(totalTime)}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-800/70 p-3.5 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Fastest Lap</div>
            <div className="mt-1 text-2xl font-black text-amber-300 tabular-nums">
              {formatLapTime(bestLap)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 font-mono text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN [SPACE]
          </button>

          <button
            type="button"
            onClick={onExitTitle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 py-3 font-mono text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>

          <a
            href="https://ko-fi.com/kishara"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 font-mono text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 cursor-pointer shadow-md shadow-amber-950/20"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>Support the Developer</span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
          </a>

          <button
            type="button"
            onClick={onClearRecords}
            className="mt-2 flex w-full items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Saved Records
          </button>
        </div>
      </div>
    </div>
  );
};
