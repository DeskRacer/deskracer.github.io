/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKPOINTS,
  createInitialRaceProgress,
  checkCheckpointProgress,
  formatLapTime,
  formatSplitDelta,
} from './track';

test('track has at least 5 checkpoints', () => {
  assert.ok(CHECKPOINTS.length >= 5, 'Track should contain at least 5 checkpoints');
  assert.equal(CHECKPOINTS[0].id, 0, 'Checkpoint 0 must be Start/Finish line');
});

test('car cannot hit checkpoint 2 without hitting checkpoint 1 first (anti-cut)', () => {
  const progress = createInitialRaceProgress(3);
  assert.equal(progress.currentCheckpointIndex, 1);

  // Attempt to hit Checkpoint 2 directly
  const cp2 = CHECKPOINTS[2];
  const { progress: nextProgress, result } = checkCheckpointProgress(
    progress,
    cp2.x,
    cp2.z
  );

  assert.equal(result.hit, false, 'Checkpoint 2 should not trigger when looking for 1');
  assert.equal(nextProgress.currentCheckpointIndex, 1, 'Current target must remain 1');
});

test('car completes lap when all checkpoints are traversed sequentially', () => {
  let progress = createInitialRaceProgress(3);
  progress.currentLapTime = 15.0;

  // Visit checkpoints 1, 2, ..., n-1
  for (let i = 1; i < CHECKPOINTS.length; i++) {
    const cp = CHECKPOINTS[i];
    const { progress: p, result } = checkCheckpointProgress(progress, cp.x, cp.z);
    assert.equal(result.hit, true, `Expected checkpoint ${i} to hit`);
    progress = p;
  }

  // Now hit checkpoint 0 (Start/Finish)
  const cp0 = CHECKPOINTS[0];
  const { progress: finalProgress, result: finalResult } = checkCheckpointProgress(
    progress,
    cp0.x,
    cp0.z
  );

  assert.equal(finalResult.hit, true);
  assert.equal(finalResult.isLapComplete, true, 'Lap should be complete');
  assert.equal(finalProgress.currentLap, 2, 'Should advance to lap 2');
  assert.equal(finalProgress.lastLapTime, 15.0);
  assert.equal(finalProgress.bestLapTime, 15.0);
});

test('lap time and split formatting format numbers cleanly', () => {
  assert.equal(formatLapTime(65.421), '01:05.421');
  assert.equal(formatLapTime(null), '--:--.---');

  const faster = formatSplitDelta(-0.45);
  assert.equal(faster.text, '-0.45s');
  assert.equal(faster.isFaster, true);

  const slower = formatSplitDelta(1.23);
  assert.equal(slower.text, '+1.23s');
  assert.equal(slower.isFaster, false);
});
