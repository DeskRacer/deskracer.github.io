/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialVehicleState,
  updateVehiclePhysics,
  resolveCircleBoxCollision,
  resolveCircleCircleCollision,
} from './physics';

test('initial vehicle state starts stationary', () => {
  const state = createInitialVehicleState(0, 0.08, 0, 0);
  assert.equal(state.speed, 0);
  assert.equal(state.x, 0);
  assert.equal(state.z, 0);
  assert.equal(state.rotationY, 0);
});

test('vehicle accelerates forward when throttle is applied', () => {
  const state = createInitialVehicleState();
  const nextState = updateVehiclePhysics(
    state,
    { throttle: 1, brake: 0, steer: 0, handbrake: false },
    0.05
  );
  assert.ok(nextState.speed > 0, `Expected positive speed, got ${nextState.speed}`);
  assert.ok(nextState.z > 0, `Expected forward movement along z axis, got ${nextState.z}`);
});

test('vehicle slows down under natural drag without throttle', () => {
  let state = createInitialVehicleState();
  state.speed = 10;
  const nextState = updateVehiclePhysics(
    state,
    { throttle: 0, brake: 0, steer: 0, handbrake: false },
    0.05
  );
  assert.ok(nextState.speed < 10, 'Speed should decrease due to drag');
});

test('steering turns vehicle heading angle when in motion', () => {
  let state = createInitialVehicleState();
  state.speed = 8.0;
  const turnedRight = updateVehiclePhysics(
    state,
    { throttle: 1, brake: 0, steer: 1.0, handbrake: false },
    0.05
  );
  assert.ok(turnedRight.steerAngle > 0, 'Steering angle should be positive for right');
  assert.ok(turnedRight.rotationY < 0, 'Heading should turn towards right (-X in camera space)');

  const turnedLeft = updateVehiclePhysics(
    state,
    { throttle: 1, brake: 0, steer: -1.0, handbrake: false },
    0.05
  );
  assert.ok(turnedLeft.steerAngle < 0, 'Steering angle should be negative for left');
  assert.ok(turnedLeft.rotationY > 0, 'Heading should turn towards left (+X in camera space)');
});

test('handbrake generates high slip ratio for drifting', () => {
  let state = createInitialVehicleState();
  state.speed = 10.0;
  const driftState = updateVehiclePhysics(
    state,
    { throttle: 1, brake: 0, steer: 1.0, handbrake: true },
    0.05
  );
  assert.ok(driftState.slipRatio > 0.3, `Expected high slip ratio during drift, got ${driftState.slipRatio}`);
});

test('circle box collision detects and repels penetration', () => {
  const box = { x: 0, z: 5, width: 4, depth: 2 };
  // Car placed penetrating into the box
  const result = resolveCircleBoxCollision(0, 4.3, 0.5, box);
  assert.equal(result.collided, true);
  assert.ok(result.correctedZ < 4.3, `Expected car to be pushed back along Z, got ${result.correctedZ}`);
});

test('circle circle collision detects and resolves distance', () => {
  const circle = { x: 2, z: 2, radius: 1.0 };
  const carRadius = 0.5;
  // Place car inside collision threshold (dist < 1.5)
  const result = resolveCircleCircleCollision(2.2, 2.2, carRadius, circle);
  assert.equal(result.collided, true);
  const correctedDist = Math.hypot(result.correctedX - circle.x, result.correctedZ - circle.z);
  assert.ok(correctedDist >= carRadius + circle.radius - 0.001, 'Corrected position should resolve penetration');
});
