/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Trophy, Sparkles, Volume2, Gamepad2, Coffee, ExternalLink } from 'lucide-react';
import { formatLapTime } from '../game/track';

interface TitleScreenProps {
  bestLap: number | null;
  bestRace: number | null;
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ bestLap, bestRace, onStart }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4 select-none">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-cyan-950/50">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Title Lockup Emblem */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-400 text-xs font-mono tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Micro RC Time Trial
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase italic">
            Desk Racer <span className="text-cyan-400 not-italic">PRO</span>
          </h1>

          <p className="mt-2 text-sm text-slate-400 max-w-md">
            Master drift physics across an architect's desk. Navigate hardcover book ramps, mechanical keyboards, and coffee cup chicanes.
          </p>
        </div>

        {/* Records Summary */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-slate-800/60 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase text-slate-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Best Lap
            </div>
            <div className="mt-1 font-mono text-xl font-bold tracking-tight text-amber-300">
              {formatLapTime(bestLap)}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-800/60 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase text-slate-400">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              Best 3-Lap Race
            </div>
            <div className="mt-1 font-mono text-xl font-bold tracking-tight text-cyan-300">
              {formatLapTime(bestRace)}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-mono text-base font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
            <span>START TIME TRIAL</span>
            <span className="hidden sm:inline-block ml-2 rounded bg-black/25 px-2 py-0.5 text-xs font-normal text-cyan-100">
              SPACE / ENTER
            </span>
          </button>

          {/* Support the Developer */}
          <a
            href="https://ko-fi.com/kishara"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-mono text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 hover:scale-[1.02] shadow-md shadow-amber-950/30"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>Support the Developer</span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
          </a>
        </div>

        {/* Controls Guide */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <span>WASD / Arrows to Drive</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">SPACE</span>
            <span>Drift / Handbrake</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">C</span>
            <span>Camera</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 ml-2">R</span>
            <span>Reset</span>
          </div>
        </div>
      </div>
    </div>
  );
};
