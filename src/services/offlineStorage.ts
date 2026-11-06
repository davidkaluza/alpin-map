import type { MapLayerConfig, OfflineRegion } from '../types';
import { lat2tile, lng2tile } from '../lib/geo';
import { DEM_MAXZOOM, DEM_URL, FONTS, GLYPH_RANGES, VECTOR_MAXZOOM } from '../data/vectorTopoConfig';

/**
 * IndexedDB tile cache.
 * Tiles are stored under a subdomain-independent key so a/b/c variants share one entry.
 */
const DB_NAME = 'AlpinMapOfflineDB';
const DB_VERSION = 1;
const TILE_STORE = 'tiles';
const REGION_STORE = 'regions';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TILE_STORE)) db.createObjectStore(TILE_STORE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(REGION_STORE)) db.createObjectStore(REGION_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Removes subdomain, access tokens and OpenFreeMap data versions so the key is stable. */
export function tileKey(url: string): string {
  return url
    .replace(/\/\/[a-d]\./i, '//')
    .replace(/[?&]access_token=[^&]+/, '')
    .replace(/(tiles\.openfreemap\.org\/planet)\/[^/]+\/(\d+\/\d+\/\d+\.pbf)/, '$1/v/$2');
}

export async function getTileFromCache(url: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const req = db.transaction(TILE_STORE, 'readonly').objectStore(TILE_STORE).get(tileKey(url));
    return await new Promise((resolve) => {
      req.onsuccess = () => resolve((req.result?.blob as Blob) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveTileToCache(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(TILE_STORE, 'readwrite');
    tx.objectStore(TILE_STORE).put({ key: tileKey(url), blob, size: blob.size, t: Date.now() });
    await done(tx);
  } catch (e) {
    console.warn('Kachel konnte nicht gespeichert werden', e);
  }
}

/** Cache-first fetch used by the vector map: serves from IndexedDB, otherwise downloads and stores. */
export async function getOrFetchTile(url: string, opts: { signal?: AbortSignal; offlineOnly?: boolean } = {}): Promise<Blob> {
  const cached = await getTileFromCache(url);
  if (cached) return cached;
  if (opts.offlineOnly || !navigator.onLine) throw new Error('offline – nicht gespeichert');
  const res = await fetch(url, { mode: 'cors', signal: opts.signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  saveTileToCache(url, blob);
  return blob;
}

/** Network-first JSON (style, TileJSON) so updates arrive when online; cached copy when offline. */
export async function getJsonNetworkFirst<T>(url: string, opts: { offlineOnly?: boolean } = {}): Promise<T> {
  if (!opts.offlineOnly && navigator.onLine) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        await saveTileToCache(url, blob);
        return JSON.parse(await blob.text()) as T;
      }
    } catch {
      /* fall back to cache */
    }
  }
  const cached = await getTileFromCache(url);
  if (!cached) throw new Error('Kartenstil nicht offline gespeichert');
  return JSON.parse(await cached.text()) as T;
}

export async function getOfflineRegions(): Promise<OfflineRegion[]> {
  try {
    const db = await openDB();
    const req = db.transaction(REGION_STORE, 'readonly').objectStore(REGION_STORE).getAll();
    const list = await new Promise<OfflineRegion[]>((resolve) => {
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => resolve([]);
    });
    return list.sort((a, b) => b.id.localeCompare(a.id));
  } catch {
    return [];
  }
}

async function saveRegion(region: OfflineRegion) {
  const db = await openDB();
  const tx = db.transaction(REGION_STORE, 'readwrite');
  tx.objectStore(REGION_STORE).put(region);
  await done(tx);
}

export interface TileRequest {
  url: string;
  key: string;
}

export function buildTileList(
  layer: Pick<MapLayerConfig, 'url' | 'subdomains'>,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  minZoom: number,
  maxZoom: number,
): TileRequest[] {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
  const subs = layer.subdomains?.length ? layer.subdomains : ['a'];
  const out: TileRequest[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lng2tile(centerLng - lngDelta, z);
    const xMax = lng2tile(centerLng + lngDelta, z);
    const yMin = lat2tile(centerLat + latDelta, z);
    const yMax = lat2tile(centerLat - latDelta, z);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const url = layer.url
          .replace('{s}', subs[(x + y) % subs.length])
          .replace('{z}', String(z))
          .replace('{x}', String(x))
          .replace('{y}', String(y))
          .replace('{r}', typeof window !== 'undefined' && window.devicePixelRatio > 1 ? '@2x' : '');
        out.push({ url, key: tileKey(url) });
      }
    }
  }
  return out;
}

function tileRange(centerLat: number, centerLng: number, radiusKm: number, z: number, margin = 0) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
  const max = 2 ** z - 1;
  const clamp = (v: number) => Math.min(max, Math.max(0, v));
  return {
    xMin: clamp(lng2tile(centerLng - lngDelta, z) - margin),
    xMax: clamp(lng2tile(centerLng + lngDelta, z) + margin),
    yMin: clamp(lat2tile(centerLat + latDelta, z) - margin),
    yMax: clamp(lat2tile(centerLat - latDelta, z) + margin),
  };
}

function pushRange(out: TileRequest[], template: string, centerLat: number, centerLng: number, radiusKm: number, zMin: number, zMax: number, margin = 0) {
  for (let z = Math.max(0, zMin); z <= zMax; z++) {
    const r = tileRange(centerLat, centerLng, radiusKm, z, margin);
    for (let x = r.xMin; x <= r.xMax; x++) {
      for (let y = r.yMin; y <= r.yMax; y++) {
        const url = template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
        out.push({ url, key: tileKey(url) });
      }
    }
  }
}

/**
 * Tiles the vector topo map needs for a region. Leaflet zoom Z shows MapLibre zoom Z-1 with 512px tiles,
 * so vector + DEM tiles are one level below the Leaflet zoom range. DEM gets a 1-tile margin because
 * contour lines are computed together with neighbouring tiles.
 */
export function buildVectorTileList(pbfTemplate: string, centerLat: number, centerLng: number, radiusKm: number, minZoom: number, maxZoom: number): TileRequest[] {
  const out: TileRequest[] = [];
  pushRange(out, pbfTemplate, centerLat, centerLng, radiusKm, minZoom - 1, Math.min(VECTOR_MAXZOOM, maxZoom - 1));
  pushRange(out, DEM_URL, centerLat, centerLng, radiusKm, minZoom - 2, Math.min(DEM_MAXZOOM, maxZoom - 1), 1);
  return out;
}

/** Style-level assets (fonts, sprites) – shared by all vector regions, never deleted per region. */
export function vectorAssetUrls(style: { glyphs?: string; sprite?: unknown }): string[] {
  const urls: string[] = [];
  if (style.glyphs) {
    for (const font of FONTS) for (const range of GLYPH_RANGES) urls.push(style.glyphs.replace('{fontstack}', encodeURIComponent(font)).replace('{range}', range));
  }
  const sprites = typeof style.sprite === 'string' ? [style.sprite] : Array.isArray(style.sprite) ? style.sprite.map((s: { url: string }) => s.url) : [];
  for (const s of sprites) urls.push(`${s}.json`, `${s}.png`, `${s}@2x.json`, `${s}@2x.png`);
  return urls;
}

/** Tile count + rough size for the download UI. */
export function estimateRegion(layer: Pick<MapLayerConfig, 'kind'>, centerLat: number, radiusKm: number, minZoom: number, maxZoom: number) {
  if (layer.kind === 'vector') {
    const pbf: TileRequest[] = [];
    pushRange(pbf, '{z}/{x}/{y}', centerLat, 0, radiusKm, minZoom - 1, Math.min(VECTOR_MAXZOOM, maxZoom - 1));
    const dem: TileRequest[] = [];
    pushRange(dem, '{z}/{x}/{y}', centerLat, 0, radiusKm, minZoom - 2, Math.min(DEM_MAXZOOM, maxZoom - 1), 1);
    return { tiles: pbf.length + dem.length, mb: Math.round((pbf.length * 0.06 + dem.length * 0.11 + 1.5) * 10) / 10 };
  }
  const tiles = estimateTileCount(centerLat, radiusKm, minZoom, maxZoom);
  return { tiles, mb: Math.round(tiles * 0.025 * 10) / 10 };
}

function regionTiles(r: Pick<OfflineRegion, 'kind' | 'urlTemplate' | 'subdomains' | 'centerLat' | 'centerLng' | 'radiusKm' | 'minZoom' | 'maxZoom'>) {
  return r.kind === 'vector'
    ? buildVectorTileList(r.urlTemplate, r.centerLat, r.centerLng, r.radiusKm, r.minZoom, r.maxZoom)
    : buildTileList({ url: r.urlTemplate, subdomains: r.subdomains }, r.centerLat, r.centerLng, r.radiusKm, r.minZoom, r.maxZoom);
}

export function estimateTileCount(centerLat: number, radiusKm: number, minZoom: number, maxZoom: number) {
  return buildTileList({ url: '{z}/{x}/{y}' }, centerLat, 0, radiusKm, minZoom, maxZoom).length;
}

const CONCURRENCY = 6;

export async function downloadTileRegion(opts: {
  name: string;
  layer: MapLayerConfig;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  minZoom: number;
  maxZoom: number;
  onProgress: (done: number, total: number, failed: number) => void;
  signal?: AbortSignal;
}): Promise<OfflineRegion> {
  const { name, layer, centerLat, centerLng, radiusKm, minZoom, maxZoom, onProgress, signal } = opts;
  let tiles: TileRequest[];
  let urlTemplate = layer.url;
  if (layer.kind === 'vector') {
    // style + TileJSON are refreshed and stored now, so the map can start completely offline
    type Style = { glyphs?: string; sprite?: unknown; sources: Record<string, { url?: string }> };
    const style = await getJsonNetworkFirst<Style>(layer.url);
    const tjUrl = Object.values(style.sources).find((s) => s.url)?.url;
    if (!tjUrl) throw new Error('Kartenstil ohne Vektorquelle');
    const tj = await getJsonNetworkFirst<{ tiles: string[] }>(tjUrl);
    urlTemplate = tj.tiles[0];
    const assets = vectorAssetUrls(style).map((url) => ({ url, key: tileKey(url) }));
    tiles = [...assets, ...buildVectorTileList(urlTemplate, centerLat, centerLng, radiusKm, minZoom, maxZoom)];
  } else {
    tiles = buildTileList(layer, centerLat, centerLng, radiusKm, minZoom, maxZoom);
  }
  const region: OfflineRegion = {
    id: `reg-${Date.now()}`,
    name,
    layerId: layer.id,
    layerName: layer.name,
    kind: layer.kind ?? 'raster',
    urlTemplate,
    subdomains: layer.subdomains ?? [],
    centerLat,
    centerLng,
    radiusKm,
    minZoom,
    maxZoom,
    tileCount: tiles.length,
    failedCount: 0,
    sizeMb: 0,
    downloadedAt: new Date().toLocaleDateString('de-DE'),
    status: 'downloading',
  };
  await saveRegion(region);

  let completed = 0;
  let failed = 0;
  let bytes = 0;
  const queue = [...tiles];

  const worker = async () => {
    while (queue.length && !signal?.aborted) {
      const tile = queue.shift()!;
      try {
        const existing = await getTileFromCache(tile.url);
        if (existing) {
          bytes += existing.size;
        } else {
          const res = await fetch(tile.url, { mode: 'cors', signal });
          if (!res.ok) throw new Error(String(res.status));
          const blob = await res.blob();
          await saveTileToCache(tile.url, blob);
          bytes += blob.size;
        }
      } catch {
        if (signal?.aborted) return;
        failed++;
      }
      completed++;
      onProgress(completed, tiles.length, failed);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const finished: OfflineRegion = {
    ...region,
    failedCount: failed + (tiles.length - completed),
    sizeMb: Math.round((bytes / 1048576) * 10) / 10,
    status: signal?.aborted || failed > 0 ? 'partial' : 'completed',
  };
  await saveRegion(finished);
  return finished;
}

/** Deletes a region and every tile that no other region still needs. */
export async function deleteOfflineRegion(id: string): Promise<void> {
  const regions = await getOfflineRegions();
  const target = regions.find((r) => r.id === id);
  const db = await openDB();
  if (target) {
    const keep = new Set<string>();
    for (const r of regions) {
      if (r.id === id) continue;
      regionTiles(r).forEach((t) => keep.add(t.key));
    }
    const keys = regionTiles(target)
      .map((t) => t.key)
      .filter((k) => !keep.has(k));
    const tx = db.transaction(TILE_STORE, 'readwrite');
    const store = tx.objectStore(TILE_STORE);
    keys.forEach((k) => store.delete(k));
    await done(tx);
  }
  const tx = db.transaction(REGION_STORE, 'readwrite');
  tx.objectStore(REGION_STORE).delete(id);
  await done(tx);
}

export async function getCacheStats(): Promise<{ count: number; usageMb: number | null; quotaMb: number | null }> {
  let count = 0;
  try {
    const db = await openDB();
    const req = db.transaction(TILE_STORE, 'readonly').objectStore(TILE_STORE).count();
    count = await new Promise<number>((resolve) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    /* ignore */
  }
  let usageMb: number | null = null;
  let quotaMb: number | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.usage !== undefined) usageMb = Math.round((est.usage / 1048576) * 10) / 10;
    if (est?.quota !== undefined) quotaMb = Math.round(est.quota / 1048576);
  } catch {
    /* ignore */
  }
  return { count, usageMb, quotaMb };
}

export async function clearAllTileCache(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([TILE_STORE, REGION_STORE], 'readwrite');
  tx.objectStore(TILE_STORE).clear();
  tx.objectStore(REGION_STORE).clear();
  await done(tx);
}

/** Ask the browser to not evict our offline maps (Safari honours this for installed PWAs). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
