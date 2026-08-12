// Elevation Service using Open-Meteo Elevation API (High-precision 30m/90m DEM global terrain data)

const elevationCache = new Map<string, number>();

/**
 * Fetches terrain elevation (in meters above sea level) for a given lat/lng coordinate
 */
export async function getElevationForCoords(lat: number, lng: number): Promise<number | null> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey)!;
  }

  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat.toFixed(5)}&longitude=${lng.toFixed(5)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data && Array.isArray(data.elevation) && data.elevation.length > 0) {
      const ele = Math.round(data.elevation[0]);
      elevationCache.set(cacheKey, ele);
      return ele;
    }
  } catch (err) {
    console.warn('Elevation fetch failed:', err);
  }

  return null;
}

/**
 * Batch fetches elevations for an array of coordinates (up to 50 points at a time)
 */
export async function getElevationsForBatch(coords: Array<{ lat: number; lng: number }>): Promise<Array<number | null>> {
  if (coords.length === 0) return [];

  const lats = coords.map((c) => c.lat.toFixed(5)).join(',');
  const lngs = coords.map((c) => c.lng.toFixed(5)).join(',');

  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;
    const response = await fetch(url);
    if (!response.ok) return coords.map(() => null);

    const data = await response.json();
    if (data && Array.isArray(data.elevation)) {
      return data.elevation.map((e: number | null) => (e !== null ? Math.round(e) : null));
    }
  } catch (err) {
    console.warn('Batch elevation fetch failed:', err);
  }

  return coords.map(() => null);
}
