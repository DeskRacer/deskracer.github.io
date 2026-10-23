/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VehicleInput {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (left) to 1 (right)
  handbrake: boolean;
}

export interface VehicleState {
  x: number;
  y: number;
  z: number;
  rotationY: number; // heading angle in radians
  speed: number; // forward speed in units/s
  angularVelocity: number; // yaw rotation rate
  lateralVelocity: number; // sideways drift speed
  pitch: number; // chassis tilt on accel/brake
  roll: number; // chassis lean on steering
  steerAngle: number; // visual front wheel steering angle
  slipRatio: number; // 0 (full grip) to 1 (full drift)
  rpm: number; // 0 to 1
  isGrounded: boolean;
  velocityY: number;
}

export interface BoxObstacle {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation?: number;
  height?: number;
  isRamp?: boolean;
  rampElevation?: number;
}

export interface CircleObstacle {
  x: number;
  z: number;
  radius: number;
}

export interface PhysicsConfig {
  maxForwardSpeed: number;
  maxReverseSpeed: number;
  acceleration: number;
  reverseAcceleration: number;
  brakeForce: number;
  drag: number;
  steerSpeed: number;
  maxSteerAngle: number;
  gripGrounded: number;
  gripDrift: number;
  wheelbase: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  maxForwardSpeed: 14.5,
  maxReverseSpeed: -5.0,
  acceleration: 18.0,
  reverseAcceleration: 10.0,
  brakeForce: 24.0,
  drag: 1.8,
  steerSpeed: 4.2,
  maxSteerAngle: 0.58, // ~33 degrees
  gripGrounded: 12.0,
  gripDrift: 2.8,
  wheelbase: 0.75,
};

export function createInitialVehicleState(spawnX = 0, spawnY = 0.08, spawnZ = 0, spawnRotY = 0): VehicleState {
  return {
    x: spawnX,
    y: spawnY,
    z: spawnZ,
    rotationY: spawnRotY,
    speed: 0,
    angularVelocity: 0,
    lateralVelocity: 0,
    pitch: 0,
    roll: 0,
    steerAngle: 0,
    slipRatio: 0,
    rpm: 0.15,
    isGrounded: true,
    velocityY: 0,
  };
}

/**
 * Updates vehicle state according to arcade drift physics for a timestep dt.
 */
export function updateVehiclePhysics(
  state: VehicleState,
  input: VehicleInput,
  dt: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): VehicleState {
  // Clamp dt to avoid tunneling or simulation explosions
  const clampedDt = Math.min(dt, 0.05);

  const forwardAccel = input.throttle > 0 ? input.throttle * config.acceleration : 0;
  const reverseAccel = input.brake > 0 && state.speed <= 0.1 ? input.brake * config.reverseAcceleration : 0;
  const activeBraking = input.brake > 0 && state.speed > 0.1 ? input.brake * config.brakeForce : 0;
  const handbrakeBraking = input.handbrake ? config.brakeForce * 0.45 : 0;

  // Longitudinal acceleration
  let longitudinalForce = forwardAccel - reverseAccel;
  if (state.speed > 0) {
    longitudinalForce -= activeBraking + handbrakeBraking;
  }

  // Natural drag
  const dragForce = state.speed * config.drag;
  const netForwardAccel = longitudinalForce - dragForce;

  // New forward speed
  let newSpeed = state.speed + netForwardAccel * clampedDt;
  newSpeed = Math.max(config.maxReverseSpeed, Math.min(config.maxForwardSpeed, newSpeed));

  // Smooth front wheel steering angle
  const targetSteerAngle = input.steer * config.maxSteerAngle;
  const steerDelta = (targetSteerAngle - state.steerAngle) * Math.min(1, config.steerSpeed * clampedDt * 3.5);
  const newSteerAngle = state.steerAngle + steerDelta;

  // Speed-dependent steering agility (can't turn when completely stopped, high turning at mid speed)
  const absSpeed = Math.abs(newSpeed);
  const speedSteerFactor = Math.min(1.0, absSpeed / 1.8);
  const speedReductionAtTop = 1.0 - Math.max(0, (absSpeed - 8.0) / 18.0) * 0.35;
  const effectiveSteerFactor = speedSteerFactor * speedReductionAtTop;

  // Drift slip factor
  const isDrifting = input.handbrake && absSpeed > 2.5;
  const lateralGrip = isDrifting ? config.gripDrift : config.gripGrounded;

  // Angular velocity calculation (Bicycle kinematic model approximation)
  // Inverted so steer=-1 turns left (towards +X in camera space) and steer=+1 turns right (towards -X)
  const directionSign = newSpeed >= -0.2 ? 1 : -1;
  const targetAngularVelocity = -(newSpeed / config.wheelbase) * Math.tan(newSteerAngle) * effectiveSteerFactor * directionSign;

  // Dynamic drift oversteer boost
  const oversteerMultiplier = isDrifting ? 1.45 : 1.0;
  const newAngularVelocity = targetAngularVelocity * oversteerMultiplier;

  // Update heading
  const newRotationY = state.rotationY + newAngularVelocity * clampedDt;

  // Forward unit vector based on heading
  const forwardX = Math.sin(newRotationY);
  const forwardZ = Math.cos(newRotationY);

  // Right unit vector for lateral movement (driver's right)
  const rightX = -Math.cos(newRotationY);
  const rightZ = Math.sin(newRotationY);

  // Lateral velocity damping according to grip
  let newLateralVelocity = state.lateralVelocity;
  if (isDrifting) {
    // Inject lateral slip momentum from turn
    newLateralVelocity += -newAngularVelocity * absSpeed * 0.22 * clampedDt;
  }
  // Damp lateral drift toward zero based on lateralGrip
  newLateralVelocity -= newLateralVelocity * lateralGrip * clampedDt;

  // Net displacement
  const deltaX = (forwardX * newSpeed + rightX * newLateralVelocity) * clampedDt;
  const deltaZ = (forwardZ * newSpeed + rightZ * newLateralVelocity) * clampedDt;

  // Calculate slip ratio for tire smoke and audio squeal
  const speedSq = newSpeed * newSpeed;
  const lateralSq = newLateralVelocity * newLateralVelocity;
  const rawSlip = Math.sqrt(lateralSq) / (Math.sqrt(speedSq) + 1.2);
  const slipRatio = isDrifting ? Math.min(1.0, rawSlip * 1.8 + 0.35) : Math.min(1.0, rawSlip * 1.2);

  // Dynamic chassis pitch & roll (spring suspension feel)
  const targetPitch = (netForwardAccel / config.acceleration) * -0.09;
  const targetRoll = (newAngularVelocity * absSpeed * 0.04) * (isDrifting ? 1.4 : 1.0);
  const newPitch = state.pitch + (targetPitch - state.pitch) * Math.min(1, clampedDt * 8);
  const newRoll = state.roll + (targetRoll - state.roll) * Math.min(1, clampedDt * 8);

  // RPM calculation for audio and tachometer
  const speedRatio = Math.abs(newSpeed) / config.maxForwardSpeed;
  const throttleBoost = input.throttle * 0.25;
  const targetRpm = Math.min(1.0, Math.max(0.12, speedRatio * 0.85 + throttleBoost + (isDrifting ? 0.2 : 0)));
  const newRpm = state.rpm + (targetRpm - state.rpm) * Math.min(1, clampedDt * 9);

  return {
    ...state,
    x: state.x + deltaX,
    z: state.z + deltaZ,
    rotationY: newRotationY,
    speed: newSpeed,
    angularVelocity: newAngularVelocity,
    lateralVelocity: newLateralVelocity,
    pitch: newPitch,
    roll: newRoll,
    steerAngle: newSteerAngle,
    slipRatio,
    rpm: newRpm,
  };
}

/**
 * Circle-to-Box collision resolution with restitution and friction.
 */
export function resolveCircleBoxCollision(
  carX: number,
  carZ: number,
  carRadius: number,
  box: BoxObstacle
): { collided: boolean; correctedX: number; correctedZ: number; normalX: number; normalZ: number } {
  // If box has rotation, transform car to box's local space
  let localX = carX - box.x;
  let localZ = carZ - box.z;

  const rot = box.rotation || 0;
  if (rot !== 0) {
    const cos = Math.cos(-rot);
    const sin = Math.sin(-rot);
    const rx = localX * cos - localZ * sin;
    const rz = localX * sin + localZ * cos;
    localX = rx;
    localZ = rz;
  }

  const halfW = box.width / 2;
  const halfD = box.depth / 2;

  // Closest point on box to circle center
  const closestX = Math.max(-halfW, Math.min(halfW, localX));
  const closestZ = Math.max(-halfD, Math.min(halfD, localZ));

  const distX = localX - closestX;
  const distZ = localZ - closestZ;
  const distSq = distX * distX + distZ * distZ;

  if (distSq < carRadius * carRadius) {
    const dist = Math.sqrt(distSq);
    let normLocalX = 0;
    let normLocalZ = 0;
    let penetration = carRadius;

    if (dist > 0.0001) {
      normLocalX = distX / dist;
      normLocalZ = distZ / dist;
      penetration = carRadius - dist;
    } else {
      // Circle center inside box; push toward closest edge
      const overlapLeft = localX + halfW;
      const overlapRight = halfW - localX;
      const overlapTop = localZ + halfD;
      const overlapBottom = halfD - localZ;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) normLocalX = -1;
      else if (minOverlap === overlapRight) normLocalX = 1;
      else if (minOverlap === overlapBottom) normLocalZ = 1;
      else normLocalZ = -1;

      penetration = minOverlap + carRadius;
    }

    const correctedLocalX = localX + normLocalX * penetration;
    const correctedLocalZ = localZ + normLocalZ * penetration;

    // Transform back to world space
    let worldNormX = normLocalX;
    let worldNormZ = normLocalZ;
    let worldCorrX = correctedLocalX;
    let worldCorrZ = correctedLocalZ;

    if (rot !== 0) {
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      worldNormX = normLocalX * cosR - normLocalZ * sinR;
      worldNormZ = normLocalX * sinR + normLocalZ * cosR;

      const wx = correctedLocalX * cosR - correctedLocalZ * sinR;
      const wz = correctedLocalX * sinR + correctedLocalZ * cosR;
      worldCorrX = wx;
      worldCorrZ = wz;
    }

    return {
      collided: true,
      correctedX: box.x + worldCorrX,
      correctedZ: box.z + worldCorrZ,
      normalX: worldNormX,
      normalZ: worldNormZ,
    };
  }

  return {
    collided: false,
    correctedX: carX,
    correctedZ: carZ,
    normalX: 0,
    normalZ: 0,
  };
}

/**
 * Circle-to-Circle collision check for round objects like coffee cups.
 */
export function resolveCircleCircleCollision(
  carX: number,
  carZ: number,
  carRadius: number,
  circle: CircleObstacle
): { collided: boolean; correctedX: number; correctedZ: number; normalX: number; normalZ: number } {
  const dx = carX - circle.x;
  const dz = carZ - circle.z;
  const distSq = dx * dx + dz * dz;
  const minDist = carRadius + circle.radius;

  if (distSq < minDist * minDist) {
    const dist = Math.sqrt(distSq) || 0.0001;
    const normX = dx / dist;
    const normZ = dz / dist;
    const penetration = minDist - dist;

    return {
      collided: true,
      correctedX: carX + normX * penetration,
      correctedZ: carZ + normZ * penetration,
      normalX: normX,
      normalZ: normZ,
    };
  }

  return {
    collided: false,
    correctedX: carX,
    correctedZ: carZ,
    normalX: 0,
    normalZ: 0,
  };
}
