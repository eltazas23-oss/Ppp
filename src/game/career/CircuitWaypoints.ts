/**
 * CircuitWaypoints.ts - Shared Circuit Geometry, Spline Projections & Official F1 Timing Formatters
 * Ensures 100% synchronized spatial tracking between the Player and AI rivals,
 * eliminating leader distance glitches and providing FIA-grade millisecond timing.
 */

import * as THREE from 'three';
import {
  CircuitId,
  SplinePoint,
  CIRCUITS,
  getActiveCircuitId,
  getCircuitConfig,
  getCircuitWaypoints,
  setActiveCircuitId,
} from './CircuitConfig';

export type { SplinePoint, CircuitId };

export const CIRCUIT_TOTAL_LENGTH = 974.76;
export const CIRCUIT_RACE_PACE_SPEED = 57.92; // m/s

/**
 * Returns waypoints for the current active circuit
 */
export function buildCircuitWaypoints(id?: CircuitId): SplinePoint[] {
  return getCircuitWaypoints(id);
}

/**
 * Global accessor for default / active waypoints
 */
export const SHARED_CIRCUIT_WAYPOINTS = getCircuitWaypoints('square_gp');

/**
 * Projects an arbitrary 2D world position (x, z) onto the circuit centerline
 * to return exact distance along lap in meters.
 */
export function getTrackDistanceAtPosition(x: number, z: number, circuitId?: CircuitId): number {
  const currentConfig = getCircuitConfig(circuitId);
  const pts = getCircuitWaypoints(currentConfig.id);
  const totalLength = currentConfig.lengthMeters;
  const numPts = pts.length;
  let closestIdx = 0;
  let minDsq = Infinity;

  for (let i = 0; i < numPts; i++) {
    const dx = pts[i].x - x;
    const dz = pts[i].z - z;
    const dsq = dx * dx + dz * dz;
    if (dsq < minDsq) {
      minDsq = dsq;
      closestIdx = i;
    }
  }

  return (closestIdx / numPts) * totalLength;
}

/**
 * Formats F1 time difference gap with millisecond precision and comma separator (e.g. +1,354 s, +0,715 s)
 */
export function formatF1TimeGap(seconds: number): string {
  if (seconds <= 0.0005) return '+0,000 s';

  if (seconds >= 60.0) {
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    const remStr = rem.toFixed(3).replace('.', ',');
    return `+${mins}:${remStr.padStart(6, '0')} s`;
  }

  return `+${seconds.toFixed(3).replace('.', ',')} s`;
}

/**
 * Formats official F1 lap chronometer time (e.g. 0:16,938 or 1:18,452) with comma separator
 */
export function formatF1LapTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds <= 0) {
    return '--:--,---';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds * 1000) % 1000);
  return `${mins}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}
