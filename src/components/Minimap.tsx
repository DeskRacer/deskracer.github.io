/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Map, Maximize2, Minimize2, Navigation } from 'lucide-react';
import { CHECKPOINTS } from '../game/track';

interface MinimapProps {
  carX: number;
  carZ: number;
  carHeading: number;
  currentCheckpointIndex: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  carX,
  carZ,
  carHeading,
  currentCheckpointIndex,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Map dimensions
  const mapW = 240;
  const mapH = 156;

  // Coordinate projection from world (x: -13..13, z: -8.5..8.5) to SVG (0..mapW, 0..mapH)
  const toMapX = (x: number) => ((x + 13) / 26) * mapW;
  const toMapZ = (z: number) => ((z + 8.5) / 17) * mapH;

  const playerMapX = toMapX(carX);
  const playerMapZ = toMapZ(carZ);

  // Heading angle in SVG: in world space, forward is (sin(h), cos(h))
  // where +X is right, +Z is down in SVG space.
  // Angle = Math.atan2(sin(h), cos(h)) = h radians
  const headingDeg = (carHeading * 180) / Math.PI;

  const targetCp = CHECKPOINTS[currentCheckpointIndex] || CHECKPOINTS[0];

  // Track closed-loop spline path points
  const trackPath = `M 46 73 
    C 46 95, 48 118, 65 125 
    C 85 132, 120 132, 143 131 
    C 175 130, 205 120, 212 95 
    C 216 75, 212 45, 189 28 
    C 165 16, 145 28, 120 28 
    C 90 28, 72 20, 60 35 
    C 48 50, 46 60, 46 73 Z`;

  return (
    <div
      className={`relative select-none pointer-events-auto rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-2 sm:p-2.5 shadow-2xl shadow-cyan-950/60 transition-all duration-200 ${
        isExpanded ? 'w-[280px] sm:w-[380px]' : 'w-[140px] sm:w-[220px]'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10 text-[9px] sm:text-[10px] font-mono tracking-wider text-slate-300 uppercase">
        <div className="flex items-center gap-1 font-bold text-cyan-400">
          <Map className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden xs:inline">RADAR</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-[8px] sm:text-[9px] text-amber-300 font-bold">
            G{currentCheckpointIndex}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 sm:p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Minimize Map' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
          </button>
        </div>
      </div>

      {/* SVG Circuit Canvas */}
      <div className="relative w-full aspect-[240/156] rounded-xl overflow-hidden bg-slate-950 border border-white/10">
        <svg
          viewBox={`0 0 ${mapW} ${mapH}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle grid pattern for desk surface */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Cutting Mat zone outline */}
          <rect
            x={toMapX(-7)}
            y={toMapZ(-4.5)}
            width={(14 / 26) * mapW}
            height={(9 / 17) * mapH}
            fill="rgba(16, 75, 50, 0.18)"
            stroke="rgba(16, 185, 129, 0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
            rx="4"
          />

          {/* Landmarks */}
          {/* 1. Mechanical Keyboard Chicane */}
          <rect
            x={toMapX(0.1)}
            y={toMapZ(1.2)}
            width={(6.2 / 26) * mapW}
            height={(2.4 / 17) * mapH}
            fill="rgba(55, 65, 81, 0.7)"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="1"
            rx="3"
          />
          <text
            x={toMapX(3.2)}
            y={toMapZ(2.4) + 3}
            fill="#94a3b8"
            fontSize="7"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            KEYBOARD
          </text>

          {/* 2. Ceramic Coffee Mug Hairpin */}
          <circle
            cx={toMapX(10.0)}
            cy={toMapZ(-0.2)}
            r={(1.2 / 26) * mapW}
            fill="rgba(248, 250, 252, 0.3)"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="1.5"
          />
          <text
            x={toMapX(10.0)}
            y={toMapZ(-0.2) + 3}
            fill="#f8fafc"
            fontSize="7"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            MUG
          </text>

          {/* 3. Book Ramp / Elevated Bridge */}
          <rect
            x={toMapX(-3.2)}
            y={toMapZ(-6.7)}
            width={(6.4 / 26) * mapW}
            height={(2.4 / 17) * mapH}
            fill="rgba(185, 28, 28, 0.4)"
            stroke="rgba(239, 68, 68, 0.5)"
            strokeWidth="1"
            rx="2"
          />
          <text
            x={toMapX(0)}
            y={toMapZ(-5.5) + 3}
            fill="#fca5a5"
            fontSize="7"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            BOOK RAMP
          </text>

          {/* 4. Desk Lamp Apex */}
          <circle
            cx={toMapX(-4.5)}
            cy={toMapZ(-7.2)}
            r={(0.9 / 26) * mapW}
            fill="rgba(251, 191, 36, 0.2)"
            stroke="rgba(251, 191, 36, 0.7)"
            strokeWidth="1"
          />
          <text
            x={toMapX(-4.5)}
            y={toMapZ(-7.2) + 3}
            fill="#fde047"
            fontSize="7"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            LAMP
          </text>

          {/* Track Spline Roadbed Underlay */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(0, 210, 255, 0.15)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main Track Spline Road Line */}
          <path
            d={trackPath}
            fill="none"
            stroke="#00d2ff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Track Dash Centerline */}
          <path
            d={trackPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Checkpoints */}
          {CHECKPOINTS.map((cp) => {
            const cx = toMapX(cp.x);
            const cz = toMapZ(cp.z);
            const isTarget = cp.id === currentCheckpointIndex;
            const isStartFinish = cp.id === 0;

            return (
              <g key={cp.id}>
                {/* Target Pulsing Halo */}
                {isTarget && (
                  <circle
                    cx={cx}
                    cy={cz}
                    r="8"
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth="1.5"
                    className="animate-ping opacity-75 origin-center"
                  />
                )}

                {/* Checkpoint Dot */}
                <circle
                  cx={cx}
                  cy={cz}
                  r={isStartFinish ? 5 : 4}
                  fill={isStartFinish ? '#10b981' : isTarget ? '#ffd700' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Checkpoint Number Label */}
                <text
                  x={cx}
                  y={cz + (isStartFinish ? -7 : 10)}
                  fill={isTarget ? '#ffd700' : '#e2e8f0'}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isStartFinish ? 'START' : `G${cp.id}`}
                </text>
              </g>
            );
          })}

          {/* Player Vehicle Marker (Live Coordinates & Rotation) */}
          <g
            transform={`translate(${playerMapX}, ${playerMapZ}) rotate(${headingDeg})`}
          >
            {/* Halo pulse */}
            <circle cx="0" cy="0" r="8" fill="rgba(255, 230, 0, 0.3)" />

            {/* Directional Racing Arrow */}
            <path
              d="M 0 6 L -5 -6 L 0 -4 L 5 -6 Z"
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>
        </svg>

        {/* Real-Time Speed & Target Badge in Corner */}
        <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-slate-900/90 border border-white/10 text-[9px] font-mono text-cyan-300">
          GATE {currentCheckpointIndex}: {targetCp.name}
        </div>
      </div>
    </div>
  );
};
