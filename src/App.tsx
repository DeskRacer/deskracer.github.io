/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, TelemetryData } from './game/renderer';
import { TitleScreen } from './components/TitleScreen';
import { CountdownOverlay } from './components/CountdownOverlay';
import { HUD } from './components/HUD';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { soundEngine } from './game/audio';

type GameState = 'title' | 'countdown' | 'playing' | 'paused' | 'gameover';

const STORAGE_KEY_BEST_LAP = 'desk_racer_best_lap';
const STORAGE_KEY_BEST_RACE = 'desk_racer_best_race';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [bestLap, setBestLap] = useState<number | null>(() => {
    const val = localStorage.getItem(STORAGE_KEY_BEST_LAP);
    return val ? parseFloat(val) : null;
  });
  const [bestRace, setBestRace] = useState<number | null>(() => {
    const val = localStorage.getItem(STORAGE_KEY_BEST_RACE);
    return val ? parseFloat(val) : null;
  });

  const [isNewRecord, setIsNewRecord] = useState(false);
  const [finalTotalTime, setFinalTotalTime] = useState(0);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speedKmh: 0,
    rpm: 0.15,
    currentLap: 1,
    totalLaps: 3,
    currentLapTime: 0,
    bestLapTime: bestLap,
    lastLapTime: null,
    isDrifting: false,
    slipRatio: 0,
    splitDelta: null,
    cameraMode: 'chase',
    isMuted: false,
    carX: -8.0,
    carZ: -2.9,
    carHeading: 0,
    currentCheckpointIndex: 1,
  });

  // Keep body dataset state in sync with game state machine
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Handle Race Finish callback
  const handleRaceFinish = useCallback((totalTime: number, fastestLap: number | null) => {
    setFinalTotalTime(totalTime);

    let newRecordAchieved = false;
    const currentBestRace = localStorage.getItem(STORAGE_KEY_BEST_RACE);
    const parsedBestRace = currentBestRace ? parseFloat(currentBestRace) : null;

    if (!parsedBestRace || totalTime < parsedBestRace) {
      localStorage.setItem(STORAGE_KEY_BEST_RACE, totalTime.toString());
      setBestRace(totalTime);
      newRecordAchieved = true;
    }

    if (fastestLap) {
      const currentBestLap = localStorage.getItem(STORAGE_KEY_BEST_LAP);
      const parsedBestLap = currentBestLap ? parseFloat(currentBestLap) : null;
      if (!parsedBestLap || fastestLap < parsedBestLap) {
        localStorage.setItem(STORAGE_KEY_BEST_LAP, fastestLap.toString());
        setBestLap(fastestLap);
        newRecordAchieved = true;
      }
    }

    setIsNewRecord(newRecordAchieved);
    setGameState('gameover');
  }, []);

  // Initialize WebGL engine once
  useEffect(() => {
    if (!containerRef.current) return;

    const savedBest = localStorage.getItem(STORAGE_KEY_BEST_LAP);
    const initialBestLap = savedBest ? parseFloat(savedBest) : null;

    const engine = new GameEngine(containerRef.current, initialBestLap);
    engineRef.current = engine;

    engine.onTelemetryUpdate = (data) => {
      setTelemetry((prev) => ({
        ...prev,
        ...data,
      }));
    };

    engine.onLapComplete = (_lap, _lapTime, isNewBest) => {
      if (isNewBest && engineRef.current) {
        // Lap record saved
        const newBest = telemetry.bestLapTime;
        if (newBest) {
          localStorage.setItem(STORAGE_KEY_BEST_LAP, newBest.toString());
          setBestLap(newBest);
        }
      }
    };

    engine.onRaceFinish = (totalTime, best) => {
      handleRaceFinish(totalTime, best);
    };

    // Check for ?autostart=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.start();
      setGameState('playing');
    } else {
      // Run background render loop on title screen
      engine.start();
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleRaceFinish]);

  // Global keybinds for pause and start shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' || gameState === 'gameover') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startGame();
        }
      } else if (gameState === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          pauseGame();
        }
      } else if (gameState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Space') {
          e.preventDefault();
          resumeGame();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState]);

  const startGame = () => {
    soundEngine.init();
    if (engineRef.current) {
      engineRef.current.restartRace(bestLap);
      engineRef.current.resume();
    }
    setGameState('countdown');
  };

  const onCountdownComplete = () => {
    setGameState('playing');
  };

  const pauseGame = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('paused');
  };

  const resumeGame = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setGameState('playing');
  };

  const restartGame = () => {
    if (engineRef.current) {
      engineRef.current.restartRace(bestLap);
      engineRef.current.resume();
    }
    setGameState('countdown');
  };

  const exitToTitle = () => {
    if (engineRef.current) {
      engineRef.current.restartRace(bestLap);
    }
    setGameState('title');
  };

  const clearRecords = () => {
    localStorage.removeItem(STORAGE_KEY_BEST_LAP);
    localStorage.removeItem(STORAGE_KEY_BEST_RACE);
    setBestLap(null);
    setBestRace(null);
  };

  const handleCameraToggle = () => {
    if (engineRef.current) {
      const newMode = engineRef.current.cycleCameraMode();
      setTelemetry((prev) => ({ ...prev, cameraMode: newMode }));
    }
  };

  const handleAudioToggle = () => {
    if (engineRef.current) {
      const muted = engineRef.current.toggleMute();
      setTelemetry((prev) => ({ ...prev, isMuted: muted }));
    }
  };

  const handleResetCar = () => {
    engineRef.current?.resetCarToLastCheckpoint();
  };

  const handleTouchInput = (input: { throttle?: number; brake?: number; steer?: number; handbrake?: boolean }) => {
    engineRef.current?.setInput(input);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Three.js WebGL canvas mount container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Title / Start Screen */}
      {gameState === 'title' && (
        <TitleScreen
          bestLap={bestLap}
          bestRace={bestRace}
          onStart={startGame}
        />
      )}

      {/* 3-2-1-GO Countdown Sequence */}
      {gameState === 'countdown' && (
        <CountdownOverlay onComplete={onCountdownComplete} />
      )}

      {/* In-Game HUD (active during countdown and playing) */}
      {(gameState === 'playing' || gameState === 'countdown') && (
        <HUD
          telemetry={telemetry}
          onCameraToggle={handleCameraToggle}
          onAudioToggle={handleAudioToggle}
          onResetCar={handleResetCar}
          onPause={pauseGame}
          onTouchInput={handleTouchInput}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={resumeGame}
          onRestart={restartGame}
          onExitTitle={exitToTitle}
        />
      )}

      {/* Victory / Summary Modal */}
      {gameState === 'gameover' && (
        <VictoryModal
          totalTime={finalTotalTime}
          bestLap={bestLap}
          overallBestRace={bestRace}
          isNewRecord={isNewRecord}
          onPlayAgain={startGame}
          onExitTitle={exitToTitle}
          onClearRecords={clearRecords}
        />
      )}
    </div>
  );
}
