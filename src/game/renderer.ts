/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  VehicleState,
  VehicleInput,
  createInitialVehicleState,
  updateVehiclePhysics,
  resolveCircleBoxCollision,
  resolveCircleCircleCollision,
} from './physics';
import {
  RaceProgress,
  createInitialRaceProgress,
  checkCheckpointProgress,
  CHECKPOINTS,
} from './track';
import {
  buildDeskScene,
  buildMiniRCCar,
  CarMeshes,
  TrackVisuals,
} from './scene-builder';
import { soundEngine } from './audio';

export type CameraMode = 'chase' | 'iso' | 'hood';

export interface TelemetryData {
  speedKmh: number;
  rpm: number;
  currentLap: number;
  totalLaps: number;
  currentLapTime: number;
  bestLapTime: number | null;
  lastLapTime: number | null;
  isDrifting: boolean;
  slipRatio: number;
  splitDelta: number | null;
  cameraMode: CameraMode;
  isMuted: boolean;
  carX: number;
  carZ: number;
  carHeading: number;
  currentCheckpointIndex: number;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private carMeshes: CarMeshes | null = null;
  private trackVisuals: TrackVisuals | null = null;

  private vehicleState: VehicleState;
  private input: VehicleInput = { throttle: 0, brake: 0, steer: 0, handbrake: false };
  private raceProgress: RaceProgress;

  private cameraMode: CameraMode = 'chase';
  private frameId: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private isSoftwareGl: boolean = false;

  // Particle pool for tire smoke
  private particles: Particle[] = [];
  private particleDummy = new THREE.Object3D();

  // Reusable scratch vectors to avoid GC in animation loop
  private _targetCamPos = new THREE.Vector3();
  private _targetLookAt = new THREE.Vector3();
  private _currentLookAt = new THREE.Vector3();

  // Callbacks to React UI (throttled to <= 15Hz to keep 60fps WebGL silky smooth)
  public onTelemetryUpdate?: (data: TelemetryData) => void;
  public onCheckpointHit?: (cpId: number, isStartFinish: boolean, splitDelta: number | null) => void;
  public onLapComplete?: (lap: number, lapTime: number, isNewBest: boolean) => void;
  public onRaceFinish?: (totalTime: number, bestLap: number | null) => void;

  private telemetryTimer: number = 0;

  constructor(container: HTMLElement, savedBestLap: number | null = null) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);

    // Initial vehicle spawn on starting grid facing Start / Finish arch along +Z
    const startCp = CHECKPOINTS[0];
    this.vehicleState = createInitialVehicleState(startCp.x, 0.08, startCp.z - 2.4, startCp.rotationY);
    this.raceProgress = createInitialRaceProgress(3, savedBestLap);

    // Initialize 60 pooled smoke particles
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: 0,
        y: -10,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 0.1,
      });
    }

    this.initWebGL();
    this.setupListeners();
  }

  private initWebGL() {
    // 1. Detect software WebGL safely
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 3. Environment map reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio lighting rig
    this.scene.background = new THREE.Color(0x131720);
    this.scene.fog = new THREE.FogExp2(0x131720, 0.024);

    // Warm directional key light
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.8);
    keyLight.position.set(12, 18, 10);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 45;
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 16;
    keyLight.shadow.camera.bottom = -16;
    this.scene.add(keyLight);

    // Cool fill light (Hemisphere)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.2);
    this.scene.add(hemiLight);

    // Subtle blue rim light from opposite angle
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.4);
    rimLight.position.set(-14, 10, -12);
    this.scene.add(rimLight);

    // 5. Build Desk World & RC Car
    this.trackVisuals = buildDeskScene(this.scene);
    this.carMeshes = buildMiniRCCar();
    this.scene.add(this.carMeshes.root);

    // Position initial car
    this.syncCarMesh();

    // Initial camera positioning
    this.camera.position.set(-8, 5, -8);
    this.camera.lookAt(-8, 0, 0);
    this._currentLookAt.set(-8, 0, 0);

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private setupListeners() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleResize = () => {
    if (!this.renderer || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent scrolling for game controls
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    // Audio context unlock
    soundEngine.init();

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.throttle = 1;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.brake = 1;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.steer = -1;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.steer = 1;
        break;
      case 'Space':
        this.input.handbrake = true;
        break;
      case 'KeyC':
        this.cycleCameraMode();
        break;
      case 'KeyR':
        this.resetCarToLastCheckpoint();
        break;
      case 'KeyM':
        this.toggleMute();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.throttle = 0;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.brake = 0;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        if (this.input.steer < 0) this.input.steer = 0;
        break;
      case 'KeyD':
      case 'ArrowRight':
        if (this.input.steer > 0) this.input.steer = 0;
        break;
      case 'Space':
        this.input.handbrake = false;
        break;
    }
  };

  private handleBlur = () => {
    this.input.throttle = 0;
    this.input.brake = 0;
    this.input.steer = 0;
    this.input.handbrake = false;
    soundEngine.stopMotor();
  };

  public setInput(input: Partial<VehicleInput>) {
    this.input = { ...this.input, ...input };
  }

  public cycleCameraMode(): CameraMode {
    if (this.cameraMode === 'chase') this.cameraMode = 'iso';
    else if (this.cameraMode === 'iso') this.cameraMode = 'hood';
    else this.cameraMode = 'chase';
    return this.cameraMode;
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public toggleMute(): boolean {
    return soundEngine.toggleMute();
  }

  public resetCarToLastCheckpoint() {
    const cp = CHECKPOINTS[this.raceProgress.lastPassedCheckpointId] || CHECKPOINTS[0];
    const spawnZ = cp.id === 0 ? cp.z - 2.4 : cp.z;
    this.vehicleState = createInitialVehicleState(cp.x, 0.08, spawnZ, cp.rotationY);
    this.input.throttle = 0;
    this.input.brake = 0;
    this.input.steer = 0;
    this.input.handbrake = false;
    this.syncCarMesh();
    soundEngine.playCollisionThud(0.3);
  }

  public restartRace(savedBestLap: number | null = null) {
    const cp = CHECKPOINTS[0];
    this.vehicleState = createInitialVehicleState(cp.x, 0.08, cp.z - 2.4, cp.rotationY);
    this.raceProgress = createInitialRaceProgress(3, savedBestLap ?? this.raceProgress.bestLapTime);
    this.input = { throttle: 0, brake: 0, steer: 0, handbrake: false };
    this.syncCarMesh();
    soundEngine.stopMotor();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    soundEngine.init();
    this.animate();
  }

  public pause() {
    this.isPaused = true;
    soundEngine.stopMotor();
  }

  public resume() {
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  private animate = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      this.updateSimulation(dt);
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }

    // Software GL pacing safeguard
    if (this.isSoftwareGl && this.renderer) {
      this.afterDrawSoftwareGl(this.animate);
    } else {
      this.frameId = requestAnimationFrame(this.animate);
    }
  };

  private afterDrawSoftwareGl(cb: () => void) {
    if (!this.renderer) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateSimulation(dt: number) {
    // 1. Advance vehicle physics
    this.vehicleState = updateVehiclePhysics(this.vehicleState, this.input, dt);

    // 2. Resolve collisions against obstacles
    if (this.trackVisuals) {
      const carRadius = 0.42;

      // Box obstacles (Desk borders, books, keyboard, rulers, dominos, erasers)
      for (const box of this.trackVisuals.obstacleBoxes) {
        const col = resolveCircleBoxCollision(this.vehicleState.x, this.vehicleState.z, carRadius, box);
        if (col.collided) {
          this.vehicleState.x = col.correctedX;
          this.vehicleState.z = col.correctedZ;

          // Velocity rebound & friction
          const dot = this.vehicleState.speed * col.normalZ; // approx rebound
          this.vehicleState.speed *= 0.55;
          this.vehicleState.lateralVelocity *= 0.4;
          soundEngine.playCollisionThud(Math.min(1.0, Math.abs(this.vehicleState.speed) / 5));
        }
      }

      // Circle obstacles (Coffee mug, lamp base)
      for (const circle of this.trackVisuals.obstacleCircles) {
        const col = resolveCircleCircleCollision(this.vehicleState.x, this.vehicleState.z, carRadius, circle);
        if (col.collided) {
          this.vehicleState.x = col.correctedX;
          this.vehicleState.z = col.correctedZ;
          this.vehicleState.speed *= 0.45;
          this.vehicleState.lateralVelocity *= 0.3;
          soundEngine.playCollisionThud(Math.min(1.0, Math.abs(this.vehicleState.speed) / 5));
        }
      }
    }

    // 3. Dynamic book ramp height calculation (between x: -2.4 and x: 2.2 along z: -5.5)
    if (Math.abs(this.vehicleState.z - -5.5) < 1.6 && this.vehicleState.x > -3.2 && this.vehicleState.x < 3.2) {
      // Elevated book bridge deck
      if (Math.abs(this.vehicleState.x) <= 1.2) {
        this.vehicleState.y = 0.38;
      } else if (this.vehicleState.x > 1.2) {
        // East ramp
        const t = (3.2 - this.vehicleState.x) / 2.0;
        this.vehicleState.y = 0.08 + t * 0.3;
      } else {
        // West ramp
        const t = (this.vehicleState.x - -3.2) / 2.0;
        this.vehicleState.y = 0.08 + t * 0.3;
      }
    } else {
      this.vehicleState.y = 0.08;
    }

    // 4. Update Race Progress & Checkpoints
    if (!this.raceProgress.isFinished) {
      this.raceProgress.currentLapTime += dt;

      const { progress: newProgress, result } = checkCheckpointProgress(
        this.raceProgress,
        this.vehicleState.x,
        this.vehicleState.z
      );
      this.raceProgress = newProgress;

      if (result.hit) {
        const isStartFinish = result.checkpointId === 0;
        soundEngine.playCheckpointChime(isStartFinish);

        this.onCheckpointHit?.(result.checkpointId, isStartFinish, result.splitDelta);

        if (result.isLapComplete) {
          this.onLapComplete?.(this.raceProgress.currentLap, this.raceProgress.lastLapTime || 0, result.newBestLap);
        }

        if (result.isRaceComplete) {
          soundEngine.playVictoryFanfare();
          this.onRaceFinish?.(this.raceProgress.totalRaceTime, this.raceProgress.bestLapTime);
        }
      }
    }

    // 5. Update Procedural Sound
    const speedRatio = Math.abs(this.vehicleState.speed) / 14.5;
    const isDrifting = this.input.handbrake && Math.abs(this.vehicleState.speed) > 2.0;
    soundEngine.updateMotor(this.vehicleState.rpm, speedRatio, isDrifting, this.vehicleState.slipRatio);

    // 6. Update Car Meshes & Animations
    this.syncCarMesh();

    // 7. Update Smoke Particles during drift or wheelspin
    this.updateSmokeParticles(dt, isDrifting);

    // 8. Update Camera Follow
    this.updateCamera(dt);

    // 9. Throttle Telemetry Sync to React HUD
    this.telemetryTimer += dt;
    if (this.telemetryTimer >= 0.065) {
      // ~15Hz sync
      this.telemetryTimer = 0;
      const speedKmh = Math.round(Math.abs(this.vehicleState.speed) * 3.6);
      this.onTelemetryUpdate?.({
        speedKmh,
        rpm: this.vehicleState.rpm,
        currentLap: this.raceProgress.currentLap,
        totalLaps: this.raceProgress.totalLaps,
        currentLapTime: this.raceProgress.currentLapTime,
        bestLapTime: this.raceProgress.bestLapTime,
        lastLapTime: this.raceProgress.lastLapTime,
        isDrifting,
        slipRatio: this.vehicleState.slipRatio,
        splitDelta: this.raceProgress.splits.length > 0 ? this.raceProgress.splits[this.raceProgress.splits.length - 1].delta ?? null : null,
        cameraMode: this.cameraMode,
        isMuted: soundEngine.getMuted(),
        carX: this.vehicleState.x,
        carZ: this.vehicleState.z,
        carHeading: this.vehicleState.rotationY,
        currentCheckpointIndex: this.raceProgress.currentCheckpointIndex,
      });
    }
  }

  private syncCarMesh() {
    if (!this.carMeshes) return;

    const {
      root,
      bodyMesh,
      frontLeftWheel,
      frontRightWheel,
      frontLeftTire,
      frontRightTire,
      rearLeftTire,
      rearRightTire,
      taillights,
    } = this.carMeshes;

    // Position and yaw heading
    root.position.set(this.vehicleState.x, this.vehicleState.y, this.vehicleState.z);
    root.rotation.y = this.vehicleState.rotationY;

    // Body roll and pitch suspension springs
    bodyMesh.rotation.z = -this.vehicleState.roll;
    bodyMesh.rotation.x = this.vehicleState.pitch;

    // Front wheels steering angle (visual inverted to match screen left/right turn)
    frontLeftWheel.rotation.y = -this.vehicleState.steerAngle;
    frontRightWheel.rotation.y = -this.vehicleState.steerAngle;

    // All wheels spin with speed
    const spinDelta = this.vehicleState.speed * 0.22;
    frontLeftTire.rotation.x += spinDelta;
    frontRightTire.rotation.x += spinDelta;
    rearLeftTire.rotation.x += spinDelta;
    rearRightTire.rotation.x += spinDelta;

    // Taillight glow on braking/reversing
    const isBraking = this.input.brake > 0 || this.input.handbrake;
    const taillightMat = taillights[0].material as THREE.MeshStandardMaterial;
    if (taillightMat) {
      taillightMat.emissiveIntensity = isBraking ? 4.5 : 1.6;
    }
  }

  private updateSmokeParticles(dt: number, isDrifting: boolean) {
    if (!this.trackVisuals || !this.carMeshes) return;

    // Emit new smoke if drifting or slipping
    const shouldEmit = (isDrifting || this.vehicleState.slipRatio > 0.4) && Math.abs(this.vehicleState.speed) > 2.0;

    if (shouldEmit) {
      // Find a dead particle to spawn
      const p = this.particles.find((item) => item.life <= 0);
      if (p) {
        // Spawn behind rear tires
        const heading = this.vehicleState.rotationY;
        const rearOffset = 0.45;
        const sideOffset = (Math.random() - 0.5) * 0.4;

        p.x = this.vehicleState.x - Math.sin(heading) * rearOffset + Math.cos(heading) * sideOffset;
        p.y = this.vehicleState.y + 0.05;
        p.z = this.vehicleState.z - Math.cos(heading) * rearOffset - Math.sin(heading) * sideOffset;

        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = 0.5 + Math.random() * 0.6;
        p.vz = (Math.random() - 0.5) * 0.8;
        p.life = 0.65;
        p.maxLife = 0.65;
        p.size = 0.12 + Math.random() * 0.08;
      }
    }

    // Update active particles
    const dummy = this.particleDummy;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        const progress = 1 - p.life / p.maxLife;
        const currentScale = p.size * (1 + progress * 2.5);

        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();
        this.trackVisuals.smokeMesh.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -20, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        this.trackVisuals.smokeMesh.setMatrixAt(i, dummy.matrix);
      }
    }
    this.trackVisuals.smokeMesh.instanceMatrix.needsUpdate = true;
  }

  private updateCamera(dt: number) {
    const { x, y, z, rotationY, speed } = this.vehicleState;

    if (this.cameraMode === 'chase') {
      // Dynamic Chase Cam: behind and above car, dynamic FOV with speed
      const followDist = 3.6 + Math.abs(speed) * 0.08;
      const height = 1.8 + Math.abs(speed) * 0.03;

      const targetX = x - Math.sin(rotationY) * followDist;
      const targetZ = z - Math.cos(rotationY) * followDist;
      const targetY = y + height;

      // Exponential damping
      const smoothFactor = 1 - Math.exp(-6.5 * dt);
      this.camera.position.x += (targetX - this.camera.position.x) * smoothFactor;
      this.camera.position.y += (targetY - this.camera.position.y) * smoothFactor;
      this.camera.position.z += (targetZ - this.camera.position.z) * smoothFactor;

      // Look slightly ahead of car
      const lookDist = 1.8 + Math.abs(speed) * 0.1;
      this._targetLookAt.set(x + Math.sin(rotationY) * lookDist, y + 0.35, z + Math.cos(rotationY) * lookDist);
      this._currentLookAt.lerp(this._targetLookAt, smoothFactor);
      this.camera.lookAt(this._currentLookAt);

      // Dynamic FOV kick at high speeds
      const targetFov = 52 + Math.min(18, (Math.abs(speed) / 14.5) * 14);
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-4 * dt));
      this.camera.updateProjectionMatrix();
    } else if (this.cameraMode === 'iso') {
      // Isometric Toy Perspective: high angled overview
      const targetX = x - 7.5;
      const targetY = 12.0;
      const targetZ = z - 7.5;

      const smoothFactor = 1 - Math.exp(-4.5 * dt);
      this.camera.position.x += (targetX - this.camera.position.x) * smoothFactor;
      this.camera.position.y += (targetY - this.camera.position.y) * smoothFactor;
      this.camera.position.z += (targetZ - this.camera.position.z) * smoothFactor;

      this._targetLookAt.set(x, y, z);
      this._currentLookAt.lerp(this._targetLookAt, smoothFactor);
      this.camera.lookAt(this._currentLookAt);

      this.camera.fov = 45;
      this.camera.updateProjectionMatrix();
    } else if (this.cameraMode === 'hood') {
      // Hood / Bumper Cam: mounted on front nose
      const noseDist = 0.32;
      const noseHeight = 0.22;
      const noseX = x + Math.sin(rotationY) * noseDist;
      const noseZ = z + Math.cos(rotationY) * noseDist;

      this.camera.position.set(noseX, y + noseHeight, noseZ);

      const lookAhead = 4.0;
      this._targetLookAt.set(x + Math.sin(rotationY) * lookAhead, y + 0.15, z + Math.cos(rotationY) * lookAhead);
      this.camera.lookAt(this._targetLookAt);

      this.camera.fov = 68;
      this.camera.updateProjectionMatrix();
    }
  }

  public dispose() {
    this.isRunning = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);

    soundEngine.stopMotor();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
  }
}
