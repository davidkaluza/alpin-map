// Terrain elevation via Open-Meteo (Copernicus DEM, ~90 m). Free, no key, CORS enabled.
const cache = new Map<string, number>();
const API = 'https://api.open-meteo.com/v1/elevation';

const key = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

export async function getElevationForCoords(lat: number, lng: number, signal?: AbortSignal): Promise<number | null> {
  const k = key(lat, lng);
  if (cache.has(k)) return cache.get(k)!;
  try {
    const res = await fetch(`${API}?latitude=${lat.toFixed(5)}&longitude=${lng.toFixed(5)}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const v = data?.elevation?.[0];
    if (typeof v !== 'number' || Number.isNaN(v)) return null;
    const ele = Math.round(v);
    cache.set(k, ele);
    return ele;
  } catch {
    return null;
  }
}

/** Batch lookup, chunked to the API limit of 100 points per request. */
export async function getElevationsForBatch(coords: Array<{ lat: number; lng: number }>): Promise<Array<number | null>> {
  const out: Array<number | null> = new Array(coords.length).fill(null);
  const missing: number[] = [];
  coords.forEach((c, i) => {
    const k = key(c.lat, c.lng);
    if (cache.has(k)) out[i] = cache.get(k)!;
    else missing.push(i);
  });
  for (let start = 0; start < missing.length; start += 100) {
    const idx = missing.slice(start, start + 100);
    const lats = idx.map((i) => coords[i].lat.toFixed(5)).join(',');
    const lngs = idx.map((i) => coords[i].lng.toFixed(5)).join(',');
    try {
      const res = await fetch(`${API}?latitude=${lats}&longitude=${lngs}`);
      if (!res.ok) continue;
      const data = await res.json();
      (data?.elevation as Array<number | null> | undefined)?.forEach((e, j) => {
        if (typeof e === 'number' && !Number.isNaN(e)) {
          const i = idx[j];
          out[i] = Math.round(e);
          cache.set(key(coords[i].lat, coords[i].lng), out[i]!);
        }
      });
    } catch {
      /* offline – leave nulls */
    }
  }
  return out;
}
