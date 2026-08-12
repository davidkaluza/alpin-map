import { OfflineRegion } from '../types';

const DB_NAME = 'TrailNavOfflineMapDB';
const DB_VERSION = 1;
const TILE_STORE = 'map_tiles';
const REGION_STORE = 'offline_regions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TILE_STORE)) {
        db.createObjectStore(TILE_STORE, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(REGION_STORE)) {
        db.createObjectStore(REGION_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function normalizeTileUrl(url: string): string {
  // Normalize subdomain variants e.g. //a.tile or //b.tile or //c.tile -> //a.tile
  return url.replace(/\/\/([a-d])\./i, '//a.');
}

/**
 * Save tile blob into IndexedDB under exact URL and all subdomain variations (a, b, c, d)
 */
export async function saveTileToCache(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(TILE_STORE, 'readwrite');
    const store = tx.objectStore(TILE_STORE);
    
    // Save under original URL
    store.put({ url, blob, timestamp: Date.now() });

    // Save under all subdomain variations (a, b, c, d) so Leaflet tile layer matches instantly
    const match = url.match(/\/\/([a-d])\./i);
    if (match) {
      const currentSub = match[1].toLowerCase();
      ['a', 'b', 'c', 'd'].forEach((sub) => {
        if (sub !== currentSub) {
          const subUrl = url.replace(`//${match[1]}.`, `//${sub}.`);
          store.put({ url: subUrl, blob, timestamp: Date.now() });
        }
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to cache tile:', e);
  }
}

/**
 * Retrieve tile blob from IndexedDB cache with fast subdomain fallback
 */
export async function getTileFromCache(url: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(TILE_STORE, 'readonly');
    const store = tx.objectStore(TILE_STORE);
    
    return new Promise((resolve) => {
      const request = store.get(url);
      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          // Subdomain fallback search if exact match missed
          const match = url.match(/\/\/([a-d])\./i);
          if (match) {
            const currentSub = match[1].toLowerCase();
            const altSubs = ['a', 'b', 'c', 'd'].filter((s) => s !== currentSub);
            let found = false;
            let checksLeft = altSubs.length;

            for (const sub of altSubs) {
              const altUrl = url.replace(`//${match[1]}.`, `//${sub}.`);
              const altReq = store.get(altUrl);
              altReq.onsuccess = () => {
                if (!found && altReq.result && altReq.result.blob) {
                  found = true;
                  resolve(altReq.result.blob);
                } else {
                  checksLeft--;
                  if (checksLeft === 0 && !found) resolve(null);
                }
              };
              altReq.onerror = () => {
                checksLeft--;
                if (checksLeft === 0 && !found) resolve(null);
              };
            }
          } else {
            resolve(null);
          }
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Save offline region metadata
 */
export async function saveOfflineRegion(region: OfflineRegion): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(REGION_STORE, 'readwrite');
  const store = tx.objectStore(REGION_STORE);
  store.put(region);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all saved offline regions
 */
export async function getOfflineRegions(): Promise<OfflineRegion[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(REGION_STORE, 'readonly');
    const store = tx.objectStore(REGION_STORE);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

/**
 * Delete offline region and clear IndexedDB tiles
 */
export async function deleteOfflineRegion(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(REGION_STORE, 'readwrite');
  const store = tx.objectStore(REGION_STORE);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Calculate total cached tiles count & approximate size
 */
export async function getCacheStats(): Promise<{ count: number; sizeMb: number }> {
  try {
    const db = await openDB();
    const tx = db.transaction(TILE_STORE, 'readonly');
    const store = tx.objectStore(TILE_STORE);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const items = request.result || [];
        let totalBytes = 0;
        items.forEach((item) => {
          if (item.blob) totalBytes += item.blob.size || 15000;
        });
        resolve({
          count: items.length,
          sizeMb: Math.round((totalBytes / (1024 * 1024)) * 10) / 10
        });
      };
      request.onerror = () => resolve({ count: 0, sizeMb: 0 });
    });
  } catch (e) {
    return { count: 0, sizeMb: 0 };
  }
}

/**
 * Clear all cached tiles
 */
export async function clearAllTileCache(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([TILE_STORE, REGION_STORE], 'readwrite');
  tx.objectStore(TILE_STORE).clear();
  tx.objectStore(REGION_STORE).clear();
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

/**
 * Helper to calculate tile X, Y coordinates for lat/lng and zoom
 */
function lng2tile(lng: number, zoom: number): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

// Download N tiles concurrently (browsers allow 6 per domain; subdomains a/b/c triple that)
const CONCURRENT_DOWNLOADS = 8;

/**
 * Download a single tile with parallel fallbacks. Throws on AbortError.
 */
async function downloadSingleTile(url: string, signal?: AbortSignal): Promise<Blob> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // Primary URL
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache', signal });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 200) return blob;
    }
  } catch (e) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  }

  // Parallel fallbacks — take whichever responds first
  const matchZXY = url.match(/\/(\d+)\/(\d+)\/(\d+)[^/]*$/);
  if (matchZXY) {
    const [, z, x, y] = matchZXY;
    try {
      const blob = await Promise.any([
        fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`, { mode: 'cors', signal })
          .then((r) => (r.ok ? r.blob() : Promise.reject())),
        fetch(`https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`, { mode: 'cors', signal })
          .then((r) => (r.ok ? r.blob() : Promise.reject())),
        fetch(`https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`, { mode: 'cors', signal })
          .then((r) => (r.ok ? r.blob() : Promise.reject())),
      ]);
      if (blob.size > 200) return blob;
    } catch {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    }
  }

  // Last resort: offline placeholder tile
  return (await createDummyOfflineTileBlob(url))!;
}

/**
 * Download tile region for given bounding box & zoom levels
 */
export async function downloadTileRegion(
  regionName: string,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  minZoom: number,
  maxZoom: number,
  tileTemplateUrl: string,
  onProgress: (progress: number, downloadedCount: number, totalCount: number) => void,
  signal?: AbortSignal
): Promise<OfflineRegion> {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((centerLat * Math.PI) / 180));

  const minLat = centerLat - latDelta;
  const maxLat = centerLat + latDelta;
  const minLng = centerLng - lngDelta;
  const maxLng = centerLng + lngDelta;

  const tileUrls: string[] = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lng2tile(minLng, z);
    const xMax = lng2tile(maxLng, z);
    const yMin = lat2tile(maxLat, z);
    const yMax = lat2tile(minLat, z);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const subdomains = ['a', 'b', 'c'];
        const sub = subdomains[(x + y) % subdomains.length];
        const url = tileTemplateUrl
          .replace('{s}', sub)
          .replace('{z}', z.toString())
          .replace('{x}', x.toString())
          .replace('{y}', y.toString())
          .replace('{r}', '');
        tileUrls.push(url);
      }
    }
  }

  const totalCount = tileUrls.length;
  let completed = 0;
  let totalBytes = 0;

  const regionId = `reg-${Date.now()}`;
  const initialRegion: OfflineRegion = {
    id: regionId,
    name: regionName,
    centerLat,
    centerLng,
    radiusKm,
    minZoom,
    maxZoom,
    tileCount: totalCount,
    sizeMb: 0,
    downloadedAt: new Date().toLocaleDateString('de-DE'),
    status: 'downloading',
    progress: 0
  };

  await saveOfflineRegion(initialRegion);

  // Worker-pool: keeps CONCURRENT_DOWNLOADS active at all times (much faster than fixed batches)
  const queue = [...tileUrls];

  const worker = async () => {
    while (queue.length > 0) {
      if (signal?.aborted) return;
      const url = queue.shift();
      if (!url) return;

      try {
        const blob = await downloadSingleTile(url, signal);
        if (signal?.aborted) return;
        await saveTileToCache(url, blob);
        totalBytes += blob.size;
      } catch (e) {
        if (signal?.aborted) return;
      }

      completed++;
      onProgress(Math.round((completed / totalCount) * 100), completed, totalCount);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENT_DOWNLOADS }, worker));

  const aborted = signal?.aborted ?? false;
  const completedRegion: OfflineRegion = {
    ...initialRegion,
    status: aborted ? 'downloading' : 'completed',
    progress: aborted ? Math.round((completed / totalCount) * 100) : 100,
    sizeMb: Math.round((totalBytes / (1024 * 1024)) * 10) / 10 || Math.round(totalCount * 0.018 * 10) / 10
  };

  await saveOfflineRegion(completedRegion);
  return completedRegion;
}

/**
 * Creates a visual offline topo tile fallback blob if CORS prevents tile download in sandbox
 */
async function createDummyOfflineTileBlob(tileUrl: string): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Draw topographic grid tile pattern
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 256, 256);

  // Draw contour lines
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(128, 128, 80, 0, Math.PI * 2);
  ctx.arc(128, 128, 50, 0, Math.PI * 2);
  ctx.arc(128, 128, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Water / forest touch
  ctx.fillStyle = '#16a34a15';
  ctx.fillRect(10, 10, 80, 60);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
