import type { Coordinate } from '../types';

const RAD = Math.PI / 180;

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const distance = (a: Coordinate, b: Coordinate) => haversineMeters(a.lat, a.lng, b.lat, b.lng);

/** Initial bearing from a to b in degrees (0 = North). */
export function bearing(a: Coordinate, b: Coordinate): number {
  const φ1 = a.lat * RAD;
  const φ2 = b.lat * RAD;
  const Δλ = (b.lng - a.lng) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

export interface TrackStats {
  distanceKm: number;
  ascentM: number;
  descentM: number;
  /** cumulative distance in km for each point */
  cumulativeKm: number[];
}

/** Distance & elevation gain with a small hysteresis to suppress GPS/DEM noise. */
export function computeTrackStats(coords: Coordinate[], threshold = 2): TrackStats {
  let meters = 0;
  let ascent = 0;
  let descent = 0;
  const cumulativeKm: number[] = coords.length ? [0] : [];
  let refEle = coords[0]?.ele;
  for (let i = 1; i < coords.length; i++) {
    meters += distance(coords[i - 1], coords[i]);
    cumulativeKm.push(meters / 1000);
    const ele = coords[i].ele;
    if (ele === undefined || refEle === undefined) {
      if (ele !== undefined) refEle = ele;
      continue;
    }
    const diff = ele - refEle;
    if (diff >= threshold) {
      ascent += diff;
      refEle = ele;
    } else if (diff <= -threshold) {
      descent -= diff;
      refEle = ele;
    }
  }
  return {
    distanceKm: Math.round(meters / 100) / 10,
    ascentM: Math.round(ascent),
    descentM: Math.round(descent),
    cumulativeKm,
  };
}

/** DIN 33466 style hiking time estimate (hours). */
export function estimateHours(distanceKm: number, ascentM: number, descentM: number): number {
  const horizontal = distanceKm / 4;
  const vertical = ascentM / 300 + descentM / 500;
  const h = Math.max(horizontal, vertical) + Math.min(horizontal, vertical) / 2;
  return Math.round(h * 10) / 10;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`;
}

export function formatCoord(lat: number, lng: number, digits = 5): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(digits)}° ${ns}, ${Math.abs(lng).toFixed(digits)}° ${ew}`;
}

/** Sunrise / sunset (NOAA approximation). Returns local Date objects or null for polar day/night. */
export function getSunTimes(lat: number, lng: number, date = new Date()) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  const γ = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(γ) - 0.032077 * Math.sin(γ) - 0.014615 * Math.cos(2 * γ) - 0.040849 * Math.sin(2 * γ));
  const decl =
    0.006918 -
    0.399912 * Math.cos(γ) +
    0.070257 * Math.sin(γ) -
    0.006758 * Math.cos(2 * γ) +
    0.000907 * Math.sin(2 * γ) -
    0.002697 * Math.cos(3 * γ) +
    0.00148 * Math.sin(3 * γ);
  const latR = lat * RAD;
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(latR) * Math.cos(decl)) - Math.tan(latR) * Math.tan(decl);
  if (cosH > 1) return { sunrise: null, sunset: null, polar: 'night' as const };
  if (cosH < -1) return { sunrise: null, sunset: null, polar: 'day' as const };
  const ha = Math.acos(cosH) / RAD;
  const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const sunriseMin = 720 - 4 * (lng + ha) - eqTime;
  const sunsetMin = 720 - 4 * (lng - ha) - eqTime;
  return {
    sunrise: new Date(base + sunriseMin * 60000),
    sunset: new Date(base + sunsetMin * 60000),
    polar: null,
  };
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins <= 0) return 'vorbei';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `in ${h} h ${m} min` : `in ${m} min`;
}

/**
 * Index of the track point closest to the given position.
 * With `hint` the search prefers the neighbourhood of the previous index, which keeps
 * progress stable on loop tours (start = end) and out-and-back routes.
 */
export function nearestIndex(coords: Coordinate[], pos: Coordinate, hint?: number): { index: number; meters: number } {
  if (hint !== undefined && coords.length > 0) {
    const from = Math.max(0, hint - 10);
    const to = Math.min(coords.length - 1, hint + 80);
    let best = from;
    let bestD = Infinity;
    for (let i = from; i <= to; i++) {
      const d = distance(coords[i], pos);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (bestD < 80) return { index: best, meters: bestD };
  }
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = distance(coords[i], pos);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { index: best, meters: bestD };
}

export function lng2tile(lng: number, z: number) {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

export function lat2tile(lat: number, z: number) {
  const r = lat * RAD;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

export function escapeHtml(input: unknown): string {
  return String(input ?? '').replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
