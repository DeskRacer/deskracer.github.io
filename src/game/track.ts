/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
}

export interface Checkpoint {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number; // orientation angle for the gate arch
  radius: number; // detection radius
  width: number;
}

export interface LapSplit {
  checkpointId: number;
  time: number; // elapsed time in seconds from lap start
  delta?: number; // difference vs best lap split (negative = faster)
}

export interface RaceProgress {
  currentLap: number; // 1 to totalLaps
  totalLaps: number;
  currentCheckpointIndex: number; // index the car needs to hit next
  checkpointsHitThisLap: number; // count of checkpoints cleared in current lap
  lapStartTime: number; // timestamp in seconds
  currentLapTime: number; // seconds
  lastLapTime: number | null;
  bestLapTime: number | null;
  splits: LapSplit[];
  bestSplits: { [checkpointId: number]: number };
  isFinished: boolean;
  totalRaceTime: number;
  lastPassedCheckpointId: number;
}

export const TRACK_WAYPOINTS: TrackPoint[] = [
  // 0: Start / Finish Line
  { x: -8.0, y: 0.08, z: -1.0 },
  // 1: Straightaway to South-West Turn
  { x: -8.0, y: 0.08, z: 4.5 },
  // 2: Sweeping Turn around Notebook
  { x: -5.0, y: 0.08, z: 6.2 },
  // 3: Chicane entry past Keyboard
  { x: 0.0, y: 0.08, z: 5.5 },
  // 4: Mechanical Keyboard chicane exit
  { x: 5.0, y: 0.08, z: 6.0 },
  // 5: Hairpin curve around Ceramic Coffee Mug
  { x: 9.5, y: 0.08, z: 3.5 },
  { x: 10.0, y: 0.08, z: -1.5 },
  // 6: North-East corner turn
  { x: 8.5, y: 0.08, z: -5.5 },
  // 7: Approach to Book Ramp / Bridge
  { x: 4.0, y: 0.08, z: -5.5 },
  // 8: On top of Book Ramp (elevated bridge)
  { x: 0.0, y: 0.38, z: -5.5 },
  // 9: Desk Lamp illuminated apex
  { x: -4.5, y: 0.08, z: -5.5 },
  // 10: Turn 4 heading back to Start
  { x: -8.2, y: 0.08, z: -4.0 },
];

export const CHECKPOINTS: Checkpoint[] = [
  { id: 0, name: 'Start / Finish', x: -8.0, y: 0.08, z: -0.5, rotationY: 0, radius: 2.8, width: 3.4 },
  { id: 1, name: 'Desk Corner SW', x: -7.2, y: 0.08, z: 5.2, rotationY: -Math.PI / 6, radius: 2.8, width: 3.2 },
  { id: 2, name: 'Keyboard Chicane', x: 2.5, y: 0.08, z: 5.8, rotationY: Math.PI / 2, radius: 2.8, width: 3.2 },
  { id: 3, name: 'Coffee Cup Hairpin', x: 10.0, y: 0.08, z: 1.0, rotationY: Math.PI, radius: 2.8, width: 3.4 },
  { id: 4, name: 'East Straight', x: 7.5, y: 0.08, z: -5.5, rotationY: -Math.PI / 2, radius: 2.8, width: 3.2 },
  { id: 5, name: 'Book Ramp Bridge', x: 0.0, y: 0.38, z: -5.5, rotationY: -Math.PI / 2, radius: 2.8, width: 3.2 },
  { id: 6, name: 'Lamp Apex Turn', x: -5.8, y: 0.08, z: -5.0, rotationY: Math.PI / 3, radius: 2.8, width: 3.2 },
];

export function createInitialRaceProgress(totalLaps = 3, savedBestLap: number | null = null): RaceProgress {
  return {
    currentLap: 1,
    totalLaps,
    currentCheckpointIndex: 1, // First target after start line is Checkpoint 1
    checkpointsHitThisLap: 0,
    lapStartTime: 0,
    currentLapTime: 0,
    lastLapTime: null,
    bestLapTime: savedBestLap,
    splits: [],
    bestSplits: {},
    isFinished: false,
    totalRaceTime: 0,
    lastPassedCheckpointId: 0,
  };
}

export interface CheckpointCheckResult {
  hit: boolean;
  checkpointId: number;
  isLapComplete: boolean;
  isRaceComplete: boolean;
  splitDelta: number | null;
  newBestLap: boolean;
}

/**
 * Check if the vehicle has validated the target checkpoint.
 * Strictly enforces sequential checkpoint ordering to prevent cutting the track.
 */
export function checkCheckpointProgress(
  progress: RaceProgress,
  carX: number,
  carZ: number,
  checkpoints: Checkpoint[] = CHECKPOINTS
): { progress: RaceProgress; result: CheckpointCheckResult } {
  if (progress.isFinished) {
    return {
      progress,
      result: {
        hit: false,
        checkpointId: -1,
        isLapComplete: false,
        isRaceComplete: false,
        splitDelta: null,
        newBestLap: false,
      },
    };
  }

  const targetCheckpoint = checkpoints[progress.currentCheckpointIndex];
  const dx = carX - targetCheckpoint.x;
  const dz = carZ - targetCheckpoint.z;
  const distSq = dx * dx + dz * dz;

  // Car is within target checkpoint radius
  if (distSq <= targetCheckpoint.radius * targetCheckpoint.radius) {
    const hitId = targetCheckpoint.id;
    let splitDelta: number | null = null;
    const currentLapTime = progress.currentLapTime;

    // Calculate split delta against best split if one exists
    if (progress.bestSplits[hitId] !== undefined) {
      splitDelta = currentLapTime - progress.bestSplits[hitId];
    }

    const updatedSplits = [
      ...progress.splits,
      { checkpointId: hitId, time: currentLapTime, delta: splitDelta ?? undefined },
    ];

    const nextIndex = (progress.currentCheckpointIndex + 1) % checkpoints.length;
    const newCheckpointsHit = progress.checkpointsHitThisLap + 1;

    // If target was checkpoint 0 (Start/Finish), lap completed!
    if (hitId === 0 && progress.checkpointsHitThisLap >= checkpoints.length - 1) {
      const finishedLapTime = progress.currentLapTime;
      const isNewBestLap = progress.bestLapTime === null || finishedLapTime < progress.bestLapTime;
      const newBestLapTime = isNewBestLap ? finishedLapTime : progress.bestLapTime;

      // Update best splits table if new best lap
      const updatedBestSplits = { ...progress.bestSplits };
      if (isNewBestLap) {
        for (const split of updatedSplits) {
          updatedBestSplits[split.checkpointId] = split.time;
        }
      }

      const isRaceComplete = progress.currentLap >= progress.totalLaps;
      const nextLapNumber = isRaceComplete ? progress.currentLap : progress.currentLap + 1;

      const newProgress: RaceProgress = {
        ...progress,
        currentLap: nextLapNumber,
        currentCheckpointIndex: nextIndex,
        checkpointsHitThisLap: 0,
        currentLapTime: 0,
        lastLapTime: finishedLapTime,
        bestLapTime: newBestLapTime,
        splits: isRaceComplete ? updatedSplits : [],
        bestSplits: updatedBestSplits,
        isFinished: isRaceComplete,
        totalRaceTime: progress.totalRaceTime + finishedLapTime,
        lastPassedCheckpointId: hitId,
      };

      return {
        progress: newProgress,
        result: {
          hit: true,
          checkpointId: hitId,
          isLapComplete: true,
          isRaceComplete,
          splitDelta,
          newBestLap: isNewBestLap,
        },
      };
    }

    // Intermediate checkpoint passed
    const newProgress: RaceProgress = {
      ...progress,
      currentCheckpointIndex: nextIndex,
      checkpointsHitThisLap: newCheckpointsHit,
      splits: updatedSplits,
      lastPassedCheckpointId: hitId,
    };

    return {
      progress: newProgress,
      result: {
        hit: true,
        checkpointId: hitId,
        isLapComplete: false,
        isRaceComplete: false,
        splitDelta,
        newBestLap: false,
      },
    };
  }

  return {
    progress,
    result: {
      hit: false,
      checkpointId: -1,
      isLapComplete: false,
      isRaceComplete: false,
      splitDelta: null,
      newBestLap: false,
    },
  };
}

/**
 * Format a time in seconds as mm:ss.sss (e.g. 01:23.456)
 */
export function formatLapTime(timeInSeconds: number | null): string {
  if (timeInSeconds === null || isNaN(timeInSeconds) || timeInSeconds <= 0) {
    return '--:--.---';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const ms = milliseconds.toString().padStart(3, '0');

  return `${mm}:${ss}.${ms}`;
}

/**
 * Format a split delta as +0.24s or -0.35s
 */
export function formatSplitDelta(delta: number | null): { text: string; isFaster: boolean } {
  if (delta === null || isNaN(delta)) {
    return { text: '', isFaster: false };
  }
  const isFaster = delta < 0;
  const sign = isFaster ? '-' : '+';
  const absDelta = Math.abs(delta).toFixed(2);
  return {
    text: `${sign}${absDelta}s`,
    isFaster,
  };
}
