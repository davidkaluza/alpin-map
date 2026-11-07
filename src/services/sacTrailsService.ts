/**
 * Hiking trails with SAC difficulty (OpenStreetMap `sac_scale`) loaded live via Overpass.
 *
 * Data is fetched per z12 tile (~10 km) so results can be cached and re-used: every tile is stored
 * in the IndexedDB tile cache (cache-first), which makes viewed areas available offline too.
 */
import { lat2tile, lng2tile } from '../lib/geo';
import { getTileFromCache, saveTileToCache } from './offlineStorage';

export const SAC_TILE_ZOOM = 12;
/** Below this map zoom the layer is hidden (queries would get too large). */
export const SAC_MIN_ZOOM = 13;

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export type SacGrade = 1 | 2 | 3 | 4 | 5 | 6;

export interface SacTrail {
  id: number;
  name: string;
  ref: string;
  grade: SacGrade;
  visibility: string;
  /** [lat, lng] pairs */
  coords: [number, number][];
}

export const SAC_GRADES: Record<SacGrade, { label: string; name: string; color: string; dash?: string }> = {
  1: { label: 'T1', name: 'Wandern', color: '#eab308' },
  2: { label: 'T2', name: 'Bergwandern', color: '#ef4444' },
  3: { label: 'T3', name: 'Anspruchsvolles Bergwandern', color: '#ef4444', dash: '7 5' },
  4: { label: 'T4', name: 'Alpinwandern', color: '#3b82f6' },
  5: { label: 'T5', name: 'Anspruchsvolles Alpinwandern', color: '#3b82f6', dash: '7 5' },
  6: { label: 'T6', name: 'Schwieriges Alpinwandern', color: '#1e3a8a', dash: '2 5' },
};

const SAC_VALUES: Record<string, SacGrade> = {
  hiking: 1,
  mountain_hiking: 2,
  demanding_mountain_hiking: 3,
  alpine_hiking: 4,
  demanding_alpine_hiking: 5,
  difficult_alpine_hiking: 6,
};

export const VISIBILITY_LABELS: Record<string, string> = {
  excellent: 'Sehr gut sichtbar',
  good: 'Gut sichtbar',
  intermediate: 'Teilweise sichtbar',
  bad: 'Schlecht sichtbar',
  horrible: 'Kaum sichtbar',
  no: 'Weglos',
};

function tileBBox(x: number, y: number, z: number) {
  const n = 2 ** z;
  const lng = (tx: number) => (tx / n) * 360 - 180;
  const lat = (ty: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n))) * 180) / Math.PI;
  return { south: lat(y + 1), west: lng(x), north: lat(y), east: lng(x + 1) };
}

/** Pseudo URL so SAC tiles live in the same cache (and storage stats) as map tiles. */
const cacheUrl = (x: number, y: number) => `https://overpass.sac/${SAC_TILE_ZOOM}/${x}/${y}.json`;

interface OverpassWay {
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

async function queryOverpass(x: number, y: number, signal?: AbortSignal): Promise<SacTrail[]> {
  const b = tileBBox(x, y, SAC_TILE_ZOOM);
  const bbox = `${b.south.toFixed(5)},${b.west.toFixed(5)},${b.north.toFixed(5)},${b.east.toFixed(5)}`;
  const query = `[out:json][timeout:25];way["highway"~"^(path|footway|track|steps|bridleway)$"]["sac_scale"](${bbox});out tags geom;`;
  let lastError: unknown = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: 'data=' + encodeURIComponent(query),
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { elements?: OverpassWay[] };
      const trails: SacTrail[] = [];
      for (const el of json.elements ?? []) {
        const grade = SAC_VALUES[el.tags?.sac_scale ?? ''];
        if (!grade || !el.geometry?.length) continue;
        trails.push({
          id: el.id,
          name: el.tags?.name ?? '',
          ref: el.tags?.ref ?? el.tags?.['osmc:symbol'] ?? '',
          grade,
          visibility: el.tags?.trail_visibility ?? '',
          coords: el.geometry.map((p) => [Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5]),
        });
      }
      return trails;
    } catch (e) {
      if (signal?.aborted) throw e;
      lastError = e;
    }
  }
  throw lastError ?? new Error('Overpass nicht erreichbar');
}

const memory = new Map<string, SacTrail[]>();

/** Trails for one z12 tile: memory → IndexedDB → Overpass (then stored). */
export async function getSacTile(x: number, y: number, opts: { signal?: AbortSignal; offlineOnly?: boolean } = {}): Promise<SacTrail[]> {
  const key = `${x}/${y}`;
  const hit = memory.get(key);
  if (hit) return hit;
  const url = cacheUrl(x, y);
  const cached = await getTileFromCache(url);
  if (cached) {
    const trails = JSON.parse(await cached.text()) as SacTrail[];
    memory.set(key, trails);
    return trails;
  }
  if (opts.offlineOnly || !navigator.onLine) return [];
  const trails = await queryOverpass(x, y, opts.signal);
  memory.set(key, trails);
  await saveTileToCache(url, new Blob([JSON.stringify(trails)], { type: 'application/json' }));
  return trails;
}

/** z12 tiles covering a bounding box. */
export function sacTilesFor(south: number, west: number, north: number, east: number): [number, number][] {
  const z = SAC_TILE_ZOOM;
  const out: [number, number][] = [];
  for (let x = lng2tile(west, z); x <= lng2tile(east, z); x++) for (let y = lat2tile(north, z); y <= lat2tile(south, z); y++) out.push([x, y]);
  return out;
}

/** Tiles needed to cover a circular region (used by the offline downloader). */
export function sacTilesForRegion(centerLat: number, centerLng: number, radiusKm: number): [number, number][] {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
  return sacTilesFor(centerLat - latDelta, centerLng - lngDelta, centerLat + latDelta, centerLng + lngDelta);
}
