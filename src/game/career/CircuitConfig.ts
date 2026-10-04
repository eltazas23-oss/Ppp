/**
 * CircuitConfig.ts - FIA Circuit Registry & Specification System
 * Defines circuit layouts, track metadata, spline points, pit zones,
 * and high-precision spatial timing for all supported race tracks.
 */

import * as THREE from 'three';

export type CircuitId = 'square_gp' | 'apex_speedway';

export interface SplinePoint {
  x: number;
  z: number;
  speedLimitKmh: number;
  yaw: number;
}

export interface CircuitData {
  id: CircuitId;
  name: string;
  subtitle: string;
  country: string;
  flag: string;
  lengthMeters: number;
  turnsCount: number;
  topSpeedKmh: number;
  lapRecordTime: string;
  lapRecordDriver: string;
  difficulty: 'Intermedio' | 'Avanzado' | 'Experto';
  badge: string;
  description: string;
  startGrid: {
    playerX: number;
    playerZ: number;
    playerYaw: number;
    startX: number;
    startZ: number;
  };
  pitZone: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  previewSvgPath: string;
  buildWaypoints: () => SplinePoint[];
}

/**
 * 1. Classic Square Circuit (974.76m) - Monaco GP Style Arena
 */
export function buildSquareCircuitWaypoints(): SplinePoint[] {
  const points: { x: number; z: number; speed: number }[] = [];
  const r = 38;
  const inner = 92;

  // 1. Main Straight (z = -130, x from -92 to +92)
  const numStraight = 22;
  for (let i = 0; i <= numStraight; i++) {
    const t = i / numStraight;
    const speed = t < 0.72 ? 345 : THREE.MathUtils.lerp(345, 185, (t - 0.72) / 0.28);
    points.push({ x: -inner + t * (2 * inner), z: -130, speed: Math.round(speed) });
  }

  // 2. Turn 1 (Top-Right): arc from (92, -130) to (130, -92)
  const numCorner = 18;
  for (let i = 1; i <= numCorner; i++) {
    const angle = -Math.PI / 2 + (i / numCorner) * (Math.PI / 2);
    const t = i / numCorner;
    const cornerSpeed = t <= 0.55 ? THREE.MathUtils.lerp(185, 158, t / 0.55) : THREE.MathUtils.lerp(158, 205, (t - 0.55) / 0.45);
    points.push({
      x: inner + Math.cos(angle) * r,
      z: -inner + Math.sin(angle) * r,
      speed: Math.round(cornerSpeed),
    });
  }

  // 3. Straight 1 (Right edge): x = 130, z from -92 to +92
  for (let i = 1; i <= numStraight; i++) {
    const t = i / numStraight;
    const speed = t < 0.72 ? 340 : THREE.MathUtils.lerp(340, 185, (t - 0.72) / 0.28);
    points.push({ x: 130, z: -inner + t * (2 * inner), speed: Math.round(speed) });
  }

  // 4. Turn 2 (Bottom-Right): arc from (130, 92) to (92, 130)
  for (let i = 1; i <= numCorner; i++) {
    const angle = 0 + (i / numCorner) * (Math.PI / 2);
    const t = i / numCorner;
    const cornerSpeed = t <= 0.55 ? THREE.MathUtils.lerp(185, 155, t / 0.55) : THREE.MathUtils.lerp(155, 205, (t - 0.55) / 0.45);
    points.push({
      x: inner + Math.cos(angle) * r,
      z: inner + Math.sin(angle) * r,
      speed: Math.round(cornerSpeed),
    });
  }

  // 5. Straight 2 (Bottom edge): z = 130, x from +92 to -92
  for (let i = 1; i <= numStraight; i++) {
    const t = i / numStraight;
    const speed = t < 0.72 ? 342 : THREE.MathUtils.lerp(342, 185, (t - 0.72) / 0.28);
    points.push({ x: inner - t * (2 * inner), z: 130, speed: Math.round(speed) });
  }

  // 6. Turn 3 (Bottom-Left): arc from (-92, 130) to (-130, 92)
  for (let i = 1; i <= numCorner; i++) {
    const angle = Math.PI / 2 + (i / numCorner) * (Math.PI / 2);
    const t = i / numCorner;
    const cornerSpeed = t <= 0.55 ? THREE.MathUtils.lerp(185, 155, t / 0.55) : THREE.MathUtils.lerp(155, 205, (t - 0.55) / 0.45);
    points.push({
      x: -inner + Math.cos(angle) * r,
      z: inner + Math.sin(angle) * r,
      speed: Math.round(cornerSpeed),
    });
  }

  // 7. Straight 3 (Left edge): x = -130, z from +92 to -92
  for (let i = 1; i <= numStraight; i++) {
    const t = i / numStraight;
    const speed = t < 0.72 ? 345 : THREE.MathUtils.lerp(345, 185, (t - 0.72) / 0.28);
    points.push({ x: -130, z: inner - t * (2 * inner), speed: Math.round(speed) });
  }

  // 8. Turn 4 (Top-Left): arc from (-130, -92) to (-92, -130)
  for (let i = 1; i < numCorner; i++) {
    const angle = Math.PI + (i / numCorner) * (Math.PI / 2);
    const t = i / numCorner;
    const cornerSpeed = t <= 0.55 ? THREE.MathUtils.lerp(185, 158, t / 0.55) : THREE.MathUtils.lerp(158, 210, (t - 0.55) / 0.45);
    points.push({
      x: -inner + Math.cos(angle) * r,
      z: -inner + Math.sin(angle) * r,
      speed: Math.round(cornerSpeed),
    });
  }

  return points.map((pt, idx, arr) => {
    const next = arr[(idx + 1) % arr.length];
    const dx = next.x - pt.x;
    const dz = next.z - pt.z;
    const yaw = Math.atan2(dx, dz);
    return {
      x: pt.x,
      z: pt.z,
      speedLimitKmh: pt.speed,
      yaw: yaw,
    };
  });
}

/**
 * 2. Brand-New Circuit: Apex Super Speedway GP (2.420m)
 * Features:
 * - Huge 600m Main Straight (>355 km/h)
 * - Low-speed T1-T2 Hairpin (85 km/h) with big brake zone
 * - Short acceleration shoot towards chicane
 * - Tight Left-Right "Bus Stop" Chicane (T3-T4, 110 km/h)
 * - Medium-speed sweeping Turn 5 (165 km/h)
 * - High-speed sweeping Turn 6-T7 (265 km/h, 130R style)
 * - Final sweeping curve T8 (215 km/h) returning to the main straight
 */
export function buildApexSpeedwayWaypoints(): SplinePoint[] {
  const rawSegments: { x: number; z: number; speed: number }[] = [];

  // 1. Enormous Main Straight: Z = -180, X from -260 to +280 (540m straight!)
  const numMainStraight = 45;
  for (let i = 0; i <= numMainStraight; i++) {
    const t = i / numMainStraight;
    const x = -260 + t * 540;
    // Hard braking at the very end of straight
    const speed = t < 0.82 ? 358 : THREE.MathUtils.lerp(358, 92, (t - 0.82) / 0.18);
    rawSegments.push({ x, z: -180, speed: Math.round(speed) });
  }

  // 2. Turn 1 & 2: Low-Speed Hairpin at the end of the long straight (Center at 280, -152, Radius 28m)
  const numHairpin = 24;
  for (let i = 1; i <= numHairpin; i++) {
    const angle = -Math.PI / 2 + (i / numHairpin) * Math.PI; // -90 deg to +90 deg
    const t = i / numHairpin;
    const speed = t <= 0.5 ? THREE.MathUtils.lerp(92, 84, t / 0.5) : THREE.MathUtils.lerp(84, 145, (t - 0.5) / 0.5);
    rawSegments.push({
      x: 280 + Math.sin(angle) * 28,
      z: -152 - Math.cos(angle) * 28,
      speed: Math.round(speed),
    });
  }

  // 3. Short Straight towards Chicane (Z = -124, X from +280 down to +150)
  const numShortStraight = 18;
  for (let i = 1; i <= numShortStraight; i++) {
    const t = i / numShortStraight;
    const x = 280 - t * 130;
    const speed = t < 0.65 ? THREE.MathUtils.lerp(145, 230, t / 0.65) : THREE.MathUtils.lerp(230, 115, (t - 0.65) / 0.35);
    rawSegments.push({ x, z: -124, speed: Math.round(speed) });
  }

  // 4. Chicane: Quick Left-Right Flick (X from 150 down to 60, Z drops to -50)
  // Left apex
  rawSegments.push({ x: 135, z: -116, speed: 110 });
  rawSegments.push({ x: 120, z: -98, speed: 105 });
  // Right apex
  rawSegments.push({ x: 108, z: -76, speed: 112 });
  rawSegments.push({ x: 92, z: -52, speed: 128 });
  rawSegments.push({ x: 74, z: -25, speed: 155 });

  // 5. Medium-Speed Sweeping Curve (Curva 5): Radius 70m around center (10, -25)
  const numMedCurve = 20;
  for (let i = 1; i <= numMedCurve; i++) {
    const angle = 0 + (i / numMedCurve) * (Math.PI / 2); // 0 to 90 deg
    const t = i / numMedCurve;
    const speed = THREE.MathUtils.lerp(155, 175, t);
    rawSegments.push({
      x: 10 + Math.cos(angle) * 64,
      z: -25 + Math.sin(angle) * 64,
      speed: Math.round(speed),
    });
  }

  // 6. Intermediate Back-Straight (Z = +39 to +125, X from 10 to -140)
  const numBackStraight = 22;
  for (let i = 1; i <= numBackStraight; i++) {
    const t = i / numBackStraight;
    const x = 10 - t * 150;
    const z = 39 + t * 86;
    const speed = THREE.MathUtils.lerp(175, 285, t);
    rawSegments.push({ x, z, speed: Math.round(speed) });
  }

  // 7. Ultra-High Speed Curve 7 (130R Style Super-Sweep, Radius 115m around -140, 10)
  const numHighSpeed = 26;
  for (let i = 1; i <= numHighSpeed; i++) {
    const angle = Math.PI / 2 + (i / numHighSpeed) * (Math.PI / 2); // 90 to 180 deg
    const t = i / numHighSpeed;
    const speed = THREE.MathUtils.lerp(285, 265, t);
    rawSegments.push({
      x: -140 + Math.cos(angle) * 115,
      z: 10 + Math.sin(angle) * 115,
      speed: Math.round(speed),
    });
  }

  // 8. Reconnect Curve 8 towards Main Straight (X = -255, Z = 10 to -180)
  const numFinalTurn = 22;
  for (let i = 1; i <= numFinalTurn; i++) {
    const t = i / numFinalTurn;
    const x = -255 - Math.sin(t * Math.PI) * 12;
    const z = 10 - t * 190;
    const speed = THREE.MathUtils.lerp(265, 310, t);
    rawSegments.push({ x, z, speed: Math.round(speed) });
  }

  // Convert raw points into oriented SplinePoints with yaw tangency
  const total = rawSegments.length;
  return rawSegments.map((curr, idx, arr) => {
    const next = arr[(idx + 1) % total];
    const dx = next.x - curr.x;
    const dz = next.z - curr.z;
    const yaw = Math.atan2(dx, dz);
    return {
      x: curr.x,
      z: curr.z,
      speedLimitKmh: curr.speed,
      yaw,
    };
  });
}

export const CIRCUITS: Record<CircuitId, CircuitData> = {
  square_gp: {
    id: 'square_gp',
    name: 'Apex Classic Ring',
    subtitle: 'Monaco GP Arena',
    country: 'Mónaco',
    flag: '🇲🇨',
    lengthMeters: 974.76,
    turnsCount: 4,
    topSpeedKmh: 345,
    lapRecordTime: '0:16,842',
    lapRecordDriver: 'Max Verstappen',
    difficulty: 'Intermedio',
    badge: 'Urbano Técnico',
    description: 'Circuito compacto de alta intensidad, muros implacables y 4 curvas en 90° con bordillos agresivos.',
    startGrid: {
      playerX: -18.0,
      playerZ: -128.0,
      playerYaw: Math.PI / 2,
      startX: -26.0,
      startZ: -132.0,
    },
    pitZone: {
      minX: -68,
      maxX: 50,
      minZ: -122.5,
      maxZ: -105.0,
    },
    bounds: {
      minX: -140,
      maxX: 140,
      minZ: -140,
      maxZ: 140,
    },
    previewSvgPath: 'M 18,22 L 82,22 Q 88,22 88,28 L 88,72 Q 88,78 82,78 L 18,78 Q 12,78 12,72 L 12,28 Q 12,22 18,22 Z',
    buildWaypoints: buildSquareCircuitWaypoints,
  },
  apex_speedway: {
    id: 'apex_speedway',
    name: 'Apex Super Speedway GP',
    subtitle: 'International Speed Arena',
    country: 'Italia / Monza Style',
    flag: '🇮🇹',
    lengthMeters: 2420.0,
    turnsCount: 8,
    topSpeedKmh: 362,
    lapRecordTime: '0:38,410',
    lapRecordDriver: 'Charles Leclerc',
    difficulty: 'Experto',
    badge: 'Gran Recta & Chicane',
    description: 'Enorme recta de 600m a fondo (+360 km/h), frenada brutal a horquilla técnica, chicane izquierda-derecha y curvón de alta carga.',
    startGrid: {
      playerX: -110.0,
      playerZ: -178.0,
      playerYaw: Math.PI / 2,
      startX: -118.0,
      startZ: -182.0,
    },
    pitZone: {
      minX: -170,
      maxX: -20,
      minZ: -172.5,
      maxZ: -155.0,
    },
    bounds: {
      minX: -270,
      maxX: 310,
      minZ: -190,
      maxZ: 140,
    },
    previewSvgPath: 'M 12,20 L 88,20 Q 95,20 95,28 Q 95,36 88,36 L 68,36 L 62,48 L 54,48 L 48,60 Q 40,84 20,80 L 12,80 Q 5,60 12,20 Z',
    buildWaypoints: buildApexSpeedwayWaypoints,
  },
};

let activeCircuitId: CircuitId = 'square_gp';
let cachedWaypoints: Record<CircuitId, SplinePoint[]> = {
  square_gp: buildSquareCircuitWaypoints(),
  apex_speedway: buildApexSpeedwayWaypoints(),
};

export function getActiveCircuitId(): CircuitId {
  return activeCircuitId;
}

export function setActiveCircuitId(id: CircuitId): void {
  if (CIRCUITS[id]) {
    activeCircuitId = id;
  }
}

export function getCircuitConfig(id?: CircuitId): CircuitData {
  return CIRCUITS[id || activeCircuitId] || CIRCUITS.square_gp;
}

export function getCircuitWaypoints(id?: CircuitId): SplinePoint[] {
  const targetId = id || activeCircuitId;
  if (!cachedWaypoints[targetId]) {
    cachedWaypoints[targetId] = CIRCUITS[targetId].buildWaypoints();
  }
  return cachedWaypoints[targetId];
}
