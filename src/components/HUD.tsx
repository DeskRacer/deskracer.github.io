/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Volume2, VolumeX, RotateCcw, Pause, Sparkles, Map, Coffee } from 'lucide-react';
import { TelemetryData, CameraMode } from '../game/renderer';
import { formatLapTime, formatSplitDelta } from '../game/track';
import { Minimap } from './Minimap';

interface HUDProps {
  telemetry: TelemetryData;
  onCameraToggle: () => void;
  onAudioToggle: () => void;
  onResetCar: () => void;
  onPause: () => void;
  onTouchInput?: (input: { throttle?: number; brake?: number; steer?: number; handbrake?: boolean }) => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  onCameraToggle,
  onAudioToggle,
  onResetCar,
  onPause,
  onTouchInput,
}) => {
  const [showMinimap, setShowMinimap] = useState(true);
  const splitInfo = formatSplitDelta(telemetry.splitDelta);

  const getCameraLabel = (mode: CameraMode): string => {
    switch (mode) {
      case 'chase':
        return 'CHASE';
      case 'iso':
        return 'ISO TOY';
      case 'hood':
        return 'HOOD';
    }
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
      {/* ======================================================== */}
      {/* 1. TOP BAR: Lap, Timers, Split Delta, Quick Action Icons */}
      {/* ======================================================== */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Lap & Split Delta */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Lap Counter */}
          <div className="rounded-xl border border-white/10 bg-slate-900/90 px-2 sm:px-3.5 py-1 sm:py-2 shadow-lg">
            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400">Lap</div>
            <div className="font-mono text-lg sm:text-2xl font-black text-white tabular-nums leading-none mt-0.5">
              {telemetry.currentLap}
              <span className="text-xs sm:text-sm font-normal text-slate-500">/{telemetry.totalLaps}</span>
            </div>
          </div>

          {/* Current Live Lap Timer */}
          <div className="rounded-xl border border-white/10 bg-slate-900/90 px-2.5 sm:px-4 py-1 sm:py-2 shadow-lg">
            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400">Time</div>
            <div className="font-mono text-base sm:text-2xl font-black text-cyan-300 tabular-nums leading-none mt-0.5">
              {formatLapTime(telemetry.currentLapTime)}
            </div>
          </div>

          {/* Split Delta (appears on checkpoint hits) */}
          {splitInfo.text && (
            <div
              className={`rounded-xl border px-2 sm:px-3 py-1 sm:py-2 shadow-lg animate-pulse ${
                splitInfo.isFaster
                  ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-950/90 text-rose-300'
              }`}
            >
              <div className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider opacity-75">Delta</div>
              <div className="font-mono text-sm sm:text-lg font-bold tabular-nums leading-none mt-0.5">
                {splitInfo.text}
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Best Lap & Utility Action Buttons + Circuit Radar Minimap */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Best Lap Record */}
            <div className="hidden md:block rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 shadow-lg text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Best Lap</div>
              <div className="font-mono text-sm font-bold text-amber-300 tabular-nums leading-none mt-0.5">
                {formatLapTime(telemetry.bestLapTime)}
              </div>
            </div>

            {/* Toggle Minimap Button */}
            <button
              type="button"
              onClick={() => setShowMinimap(!showMinimap)}
              className={`rounded-xl border p-1.5 sm:p-2.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                showMinimap
                  ? 'border-cyan-500/50 bg-cyan-950/80 text-cyan-300'
                  : 'border-white/10 bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Radar Minimap"
            >
              <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Camera Mode Toggle Button */}
            <button
              type="button"
              onClick={onCameraToggle}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/90 px-2 sm:px-3 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
              title="Toggle Camera View [C]"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="hidden lg:inline">{getCameraLabel(telemetry.cameraMode)}</span>
            </button>

            {/* Audio Mute Button */}
            <button
              type="button"
              onClick={onAudioToggle}
              className="rounded-xl border border-white/10 bg-slate-900/90 p-1.5 sm:p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
              title="Toggle Audio [M]"
            >
              {telemetry.isMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              )}
            </button>

            {/* Reset Car to Checkpoint Button */}
            <button
              type="button"
              onClick={onResetCar}
              className="rounded-xl border border-white/10 bg-slate-900/90 p-1.5 sm:p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
              title="Reset to Last Checkpoint [R]"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </button>

            {/* Support Developer Button */}
            <a
              href="https://ko-fi.com/kishara"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-1.5 sm:p-2.5 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Support the Developer (Ko-fi)"
            >
              <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </a>

            {/* Pause Button */}
            <button
              type="button"
              onClick={onPause}
              className="rounded-xl border border-white/10 bg-slate-900/90 p-1.5 sm:p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
              title="Pause Game [Esc / P]"
            >
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Clear Circuit Minimap */}
          {showMinimap && (
            <Minimap
              carX={telemetry.carX}
              carZ={telemetry.carZ}
              carHeading={telemetry.carHeading}
              currentCheckpointIndex={telemetry.currentCheckpointIndex}
            />
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CENTER AREA: Clear unobstructed 3D scene view        */}
      {/* ======================================================== */}

      {/* ======================================================== */}
      {/* 3. BOTTOM BAR: Telemetry & Collapsible Control Dock      */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-2">
        {/* Mobile On-Screen Touch Controls (Visible on small screens / touch) */}
        {onTouchInput && (
          <div className="sm:hidden flex items-center justify-between pointer-events-auto px-2 mb-2">
            {/* Steering Left / Right */}
            <div className="flex gap-2">
              <button
                type="button"
                onTouchStart={() => onTouchInput({ steer: -1 })}
                onTouchEnd={() => onTouchInput({ steer: 0 })}
                onMouseDown={() => onTouchInput({ steer: -1 })}
                onMouseUp={() => onTouchInput({ steer: 0 })}
                className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-white/20 active:bg-cyan-600 font-mono text-xl font-bold text-white flex items-center justify-center shadow-lg"
              >
                ◀
              </button>
              <button
                type="button"
                onTouchStart={() => onTouchInput({ steer: 1 })}
                onTouchEnd={() => onTouchInput({ steer: 0 })}
                onMouseDown={() => onTouchInput({ steer: 1 })}
                onMouseUp={() => onTouchInput({ steer: 0 })}
                className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-white/20 active:bg-cyan-600 font-mono text-xl font-bold text-white flex items-center justify-center shadow-lg"
              >
                ▶
              </button>
            </div>

            {/* Drift, Brake, Throttle */}
            <div className="flex gap-2">
              <button
                type="button"
                onTouchStart={() => onTouchInput({ handbrake: true })}
                onTouchEnd={() => onTouchInput({ handbrake: false })}
                onMouseDown={() => onTouchInput({ handbrake: true })}
                onMouseUp={() => onTouchInput({ handbrake: false })}
                className="w-13 h-14 rounded-2xl bg-amber-600/90 border border-amber-400 active:bg-amber-500 font-mono text-xs font-bold text-white flex items-center justify-center shadow-lg"
              >
                DRIFT
              </button>
              <button
                type="button"
                onTouchStart={() => onTouchInput({ brake: 1 })}
                onTouchEnd={() => onTouchInput({ brake: 0 })}
                onMouseDown={() => onTouchInput({ brake: 1 })}
                onMouseUp={() => onTouchInput({ brake: 0 })}
                className="w-13 h-14 rounded-2xl bg-rose-700/90 border border-rose-400 active:bg-rose-600 font-mono text-xs font-bold text-white flex items-center justify-center shadow-lg"
              >
                REV
              </button>
              <button
                type="button"
                onTouchStart={() => onTouchInput({ throttle: 1 })}
                onTouchEnd={() => onTouchInput({ throttle: 0 })}
                onMouseDown={() => onTouchInput({ throttle: 1 })}
                onMouseUp={() => onTouchInput({ throttle: 0 })}
                className="w-14 h-14 rounded-2xl bg-cyan-600/90 border border-cyan-400 active:bg-cyan-500 font-mono text-sm font-bold text-white flex items-center justify-center shadow-lg"
              >
                GAS
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end justify-between">
          {/* Bottom Left: Keybind Pills */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 font-mono text-xs text-slate-400 shadow-lg">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-white border border-white/10">W/↑</span>
              Gas
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-white border border-white/10">A D/← →</span>
              Steer
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <span className="rounded bg-amber-950 px-1 py-0.5 text-[10px] text-amber-200 border border-amber-500/30">SPACE</span>
              Drift
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-300 border border-white/10">R</span>
              Reset
            </span>
          </div>

          {/* Bottom Right: Digital Speedometer & Tachometer */}
          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            {/* Drift Active Badge */}
            {telemetry.isDrifting && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/90 px-2.5 py-1 text-amber-300 text-xs font-mono font-bold tracking-wider animate-pulse shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                DRIFTING ({Math.round(telemetry.slipRatio * 100)}%)
              </div>
            )}

            {/* Speedometer Instrument Cluster */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-3.5 shadow-2xl flex flex-col items-end min-w-[145px]">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tighter">
                  {telemetry.speedKmh}
                </span>
                <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">
                  KM/H
                </span>
              </div>

              {/* RPM Bar */}
              <div className="w-full mt-2 flex flex-col gap-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>RPM</span>
                  <span>REDLINE</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex border border-white/5">
                  <div
                    className="h-full transition-all duration-75"
                    style={{
                      width: `${Math.min(100, telemetry.rpm * 100)}%`,
                      backgroundColor: telemetry.rpm > 0.85 ? '#ef4444' : telemetry.rpm > 0.65 ? '#f59e0b' : '#00d2ff',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
