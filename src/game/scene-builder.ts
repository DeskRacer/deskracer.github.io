/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CHECKPOINTS, TRACK_WAYPOINTS } from './track';
import { BoxObstacle, CircleObstacle } from './physics';

export interface CarMeshes {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  frontLeftTire: THREE.Mesh;
  frontRightTire: THREE.Mesh;
  rearLeftTire: THREE.Mesh;
  rearRightTire: THREE.Mesh;
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  antennaTip: THREE.Mesh;
  shadowDisc: THREE.Mesh;
}

export interface TrackVisuals {
  checkpointGates: THREE.Group[];
  obstacleBoxes: BoxObstacle[];
  obstacleCircles: CircleObstacle[];
  smokeMesh: THREE.InstancedMesh;
  lampSpotlight: THREE.SpotLight;
}

/**
 * Creates procedural 2D canvas texture for warm oak wood desk surface.
 */
export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base warm amber wood tone
  ctx.fillStyle = '#b37746';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle wood planks
  const plankHeight = 128;
  for (let y = 0; y < 1024; y += plankHeight) {
    // Grain lines
    ctx.strokeStyle = 'rgba(120, 70, 35, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 4) {
      const wobble = Math.sin(x * 0.02 + y * 0.05) * 12 + Math.cos(x * 0.05) * 6;
      ctx.beginPath();
      ctx.moveTo(x + wobble, y);
      ctx.lineTo(x + wobble + (Math.random() - 0.5) * 8, y + plankHeight);
      ctx.stroke();
    }

    // Plank seam
    ctx.strokeStyle = 'rgba(70, 40, 20, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Soft natural wood noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates green architect cutting mat texture with grid lines and angles.
 */
export function createCuttingMatTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark architectural green
  ctx.fillStyle = '#16382a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Outer border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 984, 984);

  // Major 100px grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  for (let p = 50; p < 1000; p += 50) {
    ctx.beginPath();
    ctx.moveTo(p, 20);
    ctx.lineTo(p, 1004);
    ctx.moveTo(20, p);
    ctx.lineTo(1004, p);
    ctx.stroke();
  }

  // Minor 10px grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let p = 30; p < 1000; p += 10) {
    ctx.beginPath();
    ctx.moveTo(p, 20);
    ctx.lineTo(p, 1004);
    ctx.moveTo(20, p);
    ctx.lineTo(1004, p);
    ctx.stroke();
  }

  // Diagonal 45-degree guide
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(1004, 1004);
  ctx.moveTo(20, 1004);
  ctx.lineTo(1004, 20);
  ctx.stroke();

  // Mat typography
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('DESK RACER PRO // ARCHITECT SPEC A1', 50, 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates wooden ruler measurement markings texture.
 */
export function createRulerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#deb887';
  ctx.fillRect(0, 0, 512, 64);

  ctx.strokeStyle = '#4a3525';
  ctx.fillStyle = '#4a3525';
  ctx.font = '10px monospace';

  for (let x = 10; x < 500; x += 10) {
    const isCm = x % 50 === 0;
    const isHalf = x % 25 === 0 && !isCm;
    const len = isCm ? 24 : isHalf ? 16 : 8;

    ctx.lineWidth = isCm ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, len);
    ctx.stroke();

    if (isCm) {
      ctx.fillText(`${x / 50}`, x - 3, 36);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates book paper page striation texture.
 */
export function createPageEdgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, 256, 64);

  ctx.strokeStyle = 'rgba(180, 160, 140, 0.3)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 64; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Assembles the procedural miniature RC car with 10+ parts.
 */
export function buildMiniRCCar(): CarMeshes {
  const carGroup = new THREE.Group();

  // Materials
  const bodyPaintMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00d2ff, // Vibrant electric cyan
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const bodyStripeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
  });

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.3,
  });

  const windowMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a101d,
    metalness: 0.9,
    roughness: 0.05,
    transmission: 0.5,
    transparent: true,
    opacity: 0.85,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.85,
    metalness: 0.05,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.95,
    roughness: 0.15,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xccf0ff,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff1111,
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });

  // 1. Primary Chassis Underbody
  const underbodyGeo = new THREE.BoxGeometry(0.58, 0.06, 0.95);
  const underbody = new THREE.Mesh(underbodyGeo, chassisMat);
  underbody.position.y = 0.05;
  underbody.castShadow = true;
  carGroup.add(underbody);

  // 2. Main Aerodynamic Body Shell
  const bodyGeo = new THREE.BoxGeometry(0.54, 0.12, 0.86);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyPaintMaterial);
  bodyMesh.position.y = 0.13;
  bodyMesh.castShadow = true;
  carGroup.add(bodyMesh);

  // Racing stripes
  const stripeGeo = new THREE.BoxGeometry(0.12, 0.005, 0.87);
  const stripe = new THREE.Mesh(stripeGeo, bodyStripeMaterial);
  stripe.position.set(0, 0.193, 0);
  carGroup.add(stripe);

  // 3. Cabin & Windshield (Sleek aerodynamic canopy)
  const cabinGeo = new THREE.BoxGeometry(0.42, 0.1, 0.44);
  const cabin = new THREE.Mesh(cabinGeo, windowMaterial);
  cabin.position.set(0, 0.22, -0.05);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // 4. Front Splitter
  const splitterGeo = new THREE.BoxGeometry(0.58, 0.02, 0.14);
  const splitter = new THREE.Mesh(splitterGeo, chassisMat);
  splitter.position.set(0, 0.04, 0.48);
  splitter.castShadow = true;
  carGroup.add(splitter);

  // 5. Rear Wing / GT Spoiler
  const wingGroup = new THREE.Group();
  const stanchionGeo = new THREE.BoxGeometry(0.02, 0.1, 0.04);
  const leftStanchion = new THREE.Mesh(stanchionGeo, chassisMat);
  leftStanchion.position.set(-0.16, 0.05, 0);
  const rightStanchion = new THREE.Mesh(stanchionGeo, chassisMat);
  rightStanchion.position.set(0.16, 0.05, 0);

  const bladeGeo = new THREE.BoxGeometry(0.56, 0.015, 0.12);
  const blade = new THREE.Mesh(bladeGeo, bodyPaintMaterial);
  blade.position.set(0, 0.1, 0);
  blade.rotation.x = -0.12;

  const leftEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.14), chassisMat);
  leftEndplate.position.set(-0.28, 0.1, 0);
  const rightEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.14), chassisMat);
  rightEndplate.position.set(0.28, 0.1, 0);

  wingGroup.add(leftStanchion, rightStanchion, blade, leftEndplate, rightEndplate);
  wingGroup.position.set(0, 0.16, -0.42);
  carGroup.add(wingGroup);

  // 6. Wheels Helper Function
  function createWheel(): { wheelGroup: THREE.Group; tireMesh: THREE.Mesh } {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
    tireMesh.castShadow = true;

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.082, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
    tireMesh.add(rimMesh);

    wheelGroup.add(tireMesh);
    return { wheelGroup, tireMesh };
  }

  // Front Left Wheel (with steer pivot)
  const fl = createWheel();
  fl.wheelGroup.position.set(-0.29, 0.1, 0.28);
  carGroup.add(fl.wheelGroup);

  // Front Right Wheel
  const fr = createWheel();
  fr.wheelGroup.position.set(0.29, 0.1, 0.28);
  carGroup.add(fr.wheelGroup);

  // Rear Left Wheel
  const rl = createWheel();
  rl.wheelGroup.position.set(-0.29, 0.1, -0.28);
  carGroup.add(rl.wheelGroup);

  // Rear Right Wheel
  const rr = createWheel();
  rr.wheelGroup.position.set(0.29, 0.1, -0.28);
  carGroup.add(rr.wheelGroup);

  // 7. Headlights
  const headlightGeo = new THREE.BoxGeometry(0.1, 0.035, 0.02);
  const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
  leftHeadlight.position.set(-0.18, 0.13, 0.435);
  const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
  rightHeadlight.position.set(0.18, 0.13, 0.435);
  carGroup.add(leftHeadlight, rightHeadlight);

  // 8. Taillights
  const taillightGeo = new THREE.BoxGeometry(0.12, 0.03, 0.02);
  const leftTaillight = new THREE.Mesh(taillightGeo, taillightMat);
  leftTaillight.position.set(-0.18, 0.13, -0.435);
  const rightTaillight = new THREE.Mesh(taillightGeo, taillightMat);
  rightTaillight.position.set(0.18, 0.13, -0.435);
  carGroup.add(leftTaillight, rightTaillight);

  // 9. RC Radio Antenna
  const antennaGeo = new THREE.CylinderGeometry(0.003, 0.005, 0.42, 6);
  const antenna = new THREE.Mesh(antennaGeo, chassisMat);
  antenna.position.set(0.18, 0.38, -0.25);
  antenna.rotation.x = -0.15;
  carGroup.add(antenna);

  const antennaTipGeo = new THREE.SphereGeometry(0.012, 8, 8);
  const antennaTipMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
  const antennaTip = new THREE.Mesh(antennaTipGeo, antennaTipMat);
  antennaTip.position.set(0.18, 0.58, -0.28);
  carGroup.add(antennaTip);

  // 10. Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.55, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const gradient = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = gradient;
  sCtx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);

  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.015;
  carGroup.add(shadowDisc);

  return {
    root: carGroup,
    bodyMesh,
    frontLeftWheel: fl.wheelGroup,
    frontRightWheel: fr.wheelGroup,
    rearLeftWheel: rl.wheelGroup,
    rearRightWheel: rr.wheelGroup,
    frontLeftTire: fl.tireMesh,
    frontRightTire: fr.tireMesh,
    rearLeftTire: rl.tireMesh,
    rearRightTire: rr.tireMesh,
    headlights: [leftHeadlight, rightHeadlight],
    taillights: [leftTaillight, rightTaillight],
    antennaTip,
    shadowDisc,
  };
}

/**
 * Builds the complete desk scene, tracks, obstacles, ramps, and lights.
 */
export function buildDeskScene(scene: THREE.Scene): TrackVisuals {
  const obstacleBoxes: BoxObstacle[] = [];
  const obstacleCircles: CircleObstacle[] = [];

  // ==========================================
  // 1. Desk Surface & Legs
  // ==========================================
  const woodTexture = createWoodTexture();
  const deskMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.65,
    metalness: 0.1,
  });

  const deskTopGeo = new THREE.BoxGeometry(26, 0.6, 17);
  const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
  deskTop.position.set(0, -0.3, 0);
  deskTop.receiveShadow = true;
  scene.add(deskTop);

  // Architectural Cutting Mat in Center
  const matTexture = createCuttingMatTexture();
  const matMaterial = new THREE.MeshStandardMaterial({
    map: matTexture,
    roughness: 0.45,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const cuttingMatGeo = new THREE.PlaneGeometry(14, 9);
  const cuttingMat = new THREE.Mesh(cuttingMatGeo, matMaterial);
  cuttingMat.rotation.x = -Math.PI / 2;
  cuttingMat.position.set(0, 0.005, 0);
  cuttingMat.receiveShadow = true;
  scene.add(cuttingMat);

  // Dark studio floor underneath
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    roughness: 0.9,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -5.0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Brushed steel desk legs
  const legGeo = new THREE.CylinderGeometry(0.3, 0.3, 4.5, 16);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.85,
    roughness: 0.2,
  });
  const legPositions = [
    [-12.2, -2.55, -7.8],
    [12.2, -2.55, -7.8],
    [-12.2, -2.55, 7.8],
    [12.2, -2.55, 7.8],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    scene.add(leg);
  }

  // Desk perimeter edges (prevent falling off desk)
  obstacleBoxes.push(
    { x: 0, z: -8.4, width: 26, depth: 0.4 }, // North border
    { x: 0, z: 8.4, width: 26, depth: 0.4 }, // South border
    { x: -12.9, z: 0, width: 0.4, depth: 17 }, // West border
    { x: 12.9, z: 0, width: 0.4, depth: 17 } // East border
  );

  // ==========================================
  // 2. Desk Props: Stack of Books & Bridge Ramp
  // ==========================================
  // Stack of 3 books forming bridge / elevated roadway
  const pageTexture = createPageEdgeTexture();
  const pageMat = new THREE.MeshStandardMaterial({
    map: pageTexture,
    roughness: 0.9,
  });

  const book1Cover = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.4 }); // Navy
  const book2Cover = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.4 }); // Burgundy
  const book3Cover = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.4 }); // Forest Green

  // Bottom book
  const book1 = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.14, 2.5), book1Cover);
  book1.position.set(0, 0.07, -5.5);
  book1.castShadow = true;
  book1.receiveShadow = true;
  scene.add(book1);

  // Middle book (slightly offset)
  const book2 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 2.4), book2Cover);
  book2.position.set(0.1, 0.21, -5.55);
  book2.rotation.y = 0.04;
  book2.castShadow = true;
  book2.receiveShadow = true;
  scene.add(book2);

  // Top ramp book
  const rampLength = 3.6;
  const rampThickness = 0.12;
  const rampGeo = new THREE.BoxGeometry(rampLength, rampThickness, 2.3);
  const rampMesh = new THREE.Mesh(rampGeo, book3Cover);
  rampMesh.position.set(2.2, 0.18, -5.5);
  rampMesh.rotation.z = -0.11; // Slanted up onto the stack
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  scene.add(rampMesh);

  // Bridge deck on top
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 2.3), book3Cover);
  bridgeDeck.position.set(-0.2, 0.38, -5.5);
  bridgeDeck.castShadow = true;
  bridgeDeck.receiveShadow = true;
  scene.add(bridgeDeck);

  // Down ramp on west side
  const downRamp = new THREE.Mesh(rampGeo, book2Cover);
  downRamp.position.set(-2.4, 0.18, -5.5);
  downRamp.rotation.z = 0.11;
  downRamp.castShadow = true;
  downRamp.receiveShadow = true;
  scene.add(downRamp);

  // Obstacle box for books to guide car onto ramp
  obstacleBoxes.push(
    { x: -0.2, z: -6.7, width: 6.5, depth: 0.4 }, // rear railing
    { x: -0.2, z: -4.3, width: 6.5, depth: 0.4 } // front railing
  );

  // ==========================================
  // 3. Desk Prop: Ceramic Coffee Mug (Hairpin)
  // ==========================================
  const mugX = 10.0;
  const mugZ = -0.2;
  const mugRadius = 1.1;

  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8f9fa,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const mugGeo = new THREE.CylinderGeometry(mugRadius, mugRadius * 0.9, 1.8, 32);
  const mug = new THREE.Mesh(mugGeo, ceramicMat);
  mug.position.set(mugX, 0.9, mugZ);
  mug.castShadow = true;
  mug.receiveShadow = true;
  scene.add(mug);

  // Coffee liquid inside
  const coffeeGeo = new THREE.CylinderGeometry(mugRadius * 0.92, mugRadius * 0.92, 0.05, 32);
  const coffeeMat = new THREE.MeshStandardMaterial({
    color: 0x1f0f08, // Dark espresso
    roughness: 0.08,
    metalness: 0.2,
  });
  const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
  coffee.position.set(mugX, 1.65, mugZ);
  scene.add(coffee);

  // Mug handle (Torus)
  const handleGeo = new THREE.TorusGeometry(0.55, 0.12, 16, 24, Math.PI * 1.1);
  const handle = new THREE.Mesh(handleGeo, ceramicMat);
  handle.position.set(mugX - 1.05, 0.9, mugZ);
  handle.rotation.z = -Math.PI / 2;
  handle.castShadow = true;
  scene.add(handle);

  obstacleCircles.push({ x: mugX, z: mugZ, radius: mugRadius + 0.25 });

  // ==========================================
  // 4. Desk Prop: Mechanical Keyboard (Chicane)
  // ==========================================
  const kbX = 3.2;
  const kbZ = 2.4;
  const kbWidth = 6.2;
  const kbDepth = 2.4;

  const kbCaseMat = new THREE.MeshStandardMaterial({
    color: 0x23272e,
    metalness: 0.7,
    roughness: 0.3,
  });

  const kbCaseGeo = new THREE.BoxGeometry(kbWidth, 0.25, kbDepth);
  const kbCase = new THREE.Mesh(kbCaseGeo, kbCaseMat);
  kbCase.position.set(kbX, 0.125, kbZ);
  kbCase.rotation.x = -0.06; // Angled typing tilt
  kbCase.castShadow = true;
  kbCase.receiveShadow = true;
  scene.add(kbCase);

  // Staggered keycaps
  const keyMatLight = new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.4 });
  const keyMatAccent = new THREE.MeshStandardMaterial({ color: 0x88c0d0, roughness: 0.3 }); // Cyan
  const keyMatOrange = new THREE.MeshStandardMaterial({ color: 0xd08770, roughness: 0.3 }); // Orange

  const keyGeo = new THREE.BoxGeometry(0.32, 0.12, 0.32);
  const keyGroup = new THREE.Group();
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 15; c++) {
      let mat = keyMatLight;
      if (r === 0 && c === 0) mat = keyMatOrange; // ESC key
      if (r === 2 && c === 14) mat = keyMatOrange; // Return
      if (c === 0 || c >= 13) mat = keyMatAccent;

      const key = new THREE.Mesh(keyGeo, mat);
      const kx = (c - 7) * 0.38 + (r % 2) * 0.1;
      const kz = (r - 2) * 0.38;
      key.position.set(kx, 0.12, kz);
      key.castShadow = true;
      keyGroup.add(key);
    }
  }
  keyGroup.position.set(kbX, 0.18, kbZ);
  keyGroup.rotation.x = -0.06;
  scene.add(keyGroup);

  obstacleBoxes.push({ x: kbX, z: kbZ, width: kbWidth + 0.3, depth: kbDepth + 0.3 });

  // ==========================================
  // 5. Desk Prop: Articulated Lamp with Warm Spotlight
  // ==========================================
  const lampX = -4.5;
  const lampZ = -7.2;

  const lampMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2b2d42,
    metalness: 0.85,
    roughness: 0.25,
  });

  // Base
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.12, 24), lampMetalMat);
  lampBase.position.set(lampX, 0.06, lampZ);
  lampBase.castShadow = true;
  scene.add(lampBase);
  obstacleCircles.push({ x: lampX, z: lampZ, radius: 0.95 });

  // Lower arm
  const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 12), lampMetalMat);
  lowerArm.position.set(lampX, 1.4, lampZ);
  lowerArm.rotation.x = 0.35;
  lowerArm.castShadow = true;
  scene.add(lowerArm);

  // Upper arm reaching over the track apex
  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 12), lampMetalMat);
  upperArm.position.set(lampX, 2.6, lampZ + 0.8);
  upperArm.rotation.x = -0.45;
  upperArm.castShadow = true;
  scene.add(upperArm);

  // Lamp shade
  const shadeGeo = new THREE.ConeGeometry(0.55, 0.7, 24, 1, true);
  const shade = new THREE.Mesh(shadeGeo, lampMetalMat);
  shade.position.set(lampX, 3.2, lampZ + 1.8);
  shade.rotation.x = Math.PI / 1.35;
  shade.castShadow = true;
  scene.add(shade);

  // Warm Spotlight from the lamp
  const lampSpotlight = new THREE.SpotLight(0xffe8c2, 85, 14, Math.PI / 4.5, 0.4, 1.2);
  lampSpotlight.position.set(lampX, 3.2, lampZ + 1.8);
  lampSpotlight.target.position.set(lampX, 0.08, -5.2);
  lampSpotlight.castShadow = true;
  lampSpotlight.shadow.bias = -0.0005;
  lampSpotlight.shadow.mapSize.width = 1024;
  lampSpotlight.shadow.mapSize.height = 1024;
  scene.add(lampSpotlight);
  scene.add(lampSpotlight.target);

  // ==========================================
  // 6. Track Borders: Rulers, Dominoes, Erasers
  // ==========================================
  const rulerTexture = createRulerTexture();
  const rulerMat = new THREE.MeshStandardMaterial({
    map: rulerTexture,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Long wooden rulers along straights
  function createRuler(rx: number, rz: number, length: number, rotY: number) {
    const rulerGeo = new THREE.BoxGeometry(length, 0.04, 0.28);
    const ruler = new THREE.Mesh(rulerGeo, rulerMat);
    ruler.position.set(rx, 0.02, rz);
    ruler.rotation.y = rotY;
    ruler.castShadow = true;
    ruler.receiveShadow = true;
    scene.add(ruler);

    obstacleBoxes.push({
      x: rx,
      z: rz,
      width: length,
      depth: 0.35,
      rotation: rotY,
    });
  }

  // Rulers placed as guardrails
  createRuler(-9.8, 1.8, 6.0, Math.PI / 2);
  createRuler(-6.2, 1.8, 6.0, Math.PI / 2);
  createRuler(8.4, -3.2, 5.0, Math.PI / 2);

  // Dominoes along sweeping curves
  const dominoGeo = new THREE.BoxGeometry(0.12, 0.42, 0.24);
  const dominoColors = [0xffffff, 0xef233c, 0xf4a261, 0x2b2d42];
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 0.75;
    const dx = -6.0 + Math.cos(angle) * 3.8;
    const dz = 4.0 + Math.sin(angle) * 3.6;

    const dMat = new THREE.MeshStandardMaterial({
      color: dominoColors[i % dominoColors.length],
      roughness: 0.3,
    });
    const domino = new THREE.Mesh(dominoGeo, dMat);
    domino.position.set(dx, 0.21, dz);
    domino.rotation.y = angle + Math.PI / 2;
    domino.castShadow = true;
    scene.add(domino);

    obstacleBoxes.push({ x: dx, z: dz, width: 0.25, depth: 0.25 });
  }

  // Rubber Eraser corner apex bumpers
  const eraserMat1 = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.85 }); // Pink
  const eraserMat2 = new THREE.MeshStandardMaterial({ color: 0x48cae4, roughness: 0.85 }); // Blue
  const eraserGeo = new THREE.BoxGeometry(0.48, 0.22, 0.32);

  const erasers = [
    { x: -7.0, z: 6.8, rot: 0.2, mat: eraserMat1 },
    { x: 1.0, z: 7.2, rot: -0.3, mat: eraserMat2 },
    { x: 11.2, z: 2.5, rot: 0.6, mat: eraserMat1 },
    { x: 10.8, z: -3.8, rot: -0.4, mat: eraserMat2 },
    { x: -7.0, z: -5.8, rot: 0.5, mat: eraserMat1 },
  ];
  for (const ep of erasers) {
    const eraser = new THREE.Mesh(eraserGeo, ep.mat);
    eraser.position.set(ep.x, 0.11, ep.z);
    eraser.rotation.y = ep.rot;
    eraser.castShadow = true;
    scene.add(eraser);
    obstacleBoxes.push({ x: ep.x, z: ep.z, width: 0.55, depth: 0.4, rotation: ep.rot });
  }

  // ==========================================
  // 7. Checkpoint Holographic Neon Gates
  // ==========================================
  const checkpointGates: THREE.Group[] = [];

  CHECKPOINTS.forEach((cp) => {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(cp.x, cp.y, cp.z);
    gateGroup.rotation.y = cp.rotationY;

    const isStartFinish = cp.id === 0;
    const archColor = isStartFinish ? 0x00ff88 : 0x00d2ff;

    // Glowing upright neon stanchions
    const uprightGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.2, 16);
    const uprightMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.2,
    });
    const neonMat = new THREE.MeshStandardMaterial({
      color: archColor,
      emissive: archColor,
      emissiveIntensity: 2.5,
      roughness: 0.2,
    });

    const halfW = cp.width / 2;

    const leftPost = new THREE.Mesh(uprightGeo, uprightMat);
    leftPost.position.set(-halfW, 0.6, 0);
    const rightPost = new THREE.Mesh(uprightGeo, uprightMat);
    rightPost.position.set(halfW, 0.6, 0);

    // Glowing Arch Crossbar
    const crossbarGeo = new THREE.BoxGeometry(cp.width, 0.08, 0.12);
    const crossbar = new THREE.Mesh(crossbarGeo, neonMat);
    crossbar.position.set(0, 1.2, 0);

    // Holographic Translucent Gate Banner
    const bannerGeo = new THREE.PlaneGeometry(cp.width * 0.9, 0.6);
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 256;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d')!;

    if (isStartFinish) {
      // Checkered pattern for Start / Finish
      const sq = 32;
      for (let y = 0; y < 128; y += sq) {
        for (let x = 0; x < 256; x += sq) {
          bCtx.fillStyle = (x / sq + y / sq) % 2 === 0 ? '#ffffff' : '#000000';
          bCtx.fillRect(x, y, sq, sq);
        }
      }
      bCtx.fillStyle = '#00ff88';
      bCtx.font = 'bold 24px monospace';
      bCtx.textAlign = 'center';
      bCtx.fillText('START / FINISH', 128, 70);
    } else {
      bCtx.fillStyle = 'rgba(0, 210, 255, 0.25)';
      bCtx.fillRect(0, 0, 256, 128);
      bCtx.strokeStyle = '#00d2ff';
      bCtx.lineWidth = 6;
      bCtx.strokeRect(10, 10, 236, 108);

      bCtx.fillStyle = '#ffffff';
      bCtx.font = 'bold 26px monospace';
      bCtx.textAlign = 'center';
      bCtx.fillText(`GATE ${cp.id}`, 128, 55);
      bCtx.font = '16px monospace';
      bCtx.fillText('>>> SPEED >>>', 128, 85);
    }

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    bannerTex.colorSpace = THREE.SRGBColorSpace;
    const bannerMat = new THREE.MeshBasicMaterial({
      map: bannerTex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 0.85, 0);
    // Rotate 180 degrees around Y so front face faces the approaching car
    banner.rotation.y = Math.PI;

    gateGroup.add(leftPost, rightPost, crossbar, banner);
    scene.add(gateGroup);
    checkpointGates.push(gateGroup);
  });

  // ==========================================
  // 8. Pooled Particle Smoke System
  // ==========================================
  const maxParticles = 60;
  const particleGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const smokeMesh = new THREE.InstancedMesh(particleGeo, particleMat, maxParticles);
  smokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Initialize invisible particles below desk
  const dummy = new THREE.Object3D();
  dummy.position.set(0, -20, 0);
  dummy.scale.set(0, 0, 0);
  dummy.updateMatrix();
  for (let i = 0; i < maxParticles; i++) {
    smokeMesh.setMatrixAt(i, dummy.matrix);
  }
  smokeMesh.instanceMatrix.needsUpdate = true;
  scene.add(smokeMesh);

  return {
    checkpointGates,
    obstacleBoxes,
    obstacleCircles,
    smokeMesh,
    lampSpotlight,
  };
}
