import { AlpinePOI } from '../types';

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    ele?: string;
    natural?: string;
    tourism?: string;
    description?: string;
    mountain_pass?: string;
    wikipedia?: string;
    prominence?: string;
  };
}

// In-memory cache for fetched Overpass peak nodes by bounding box key
const overpassCache = new Map<string, AlpinePOI[]>();

/**
 * Quantize coordinates to ~0.05 degree grid key for caching
 */
function getBBoxCacheKey(s: number, w: number, n: number, e: number, zoom: number): string {
  const step = zoom >= 12 ? 0.05 : 0.2;
  const qS = (Math.floor(s / step) * step).toFixed(2);
  const qW = (Math.floor(w / step) * step).toFixed(2);
  const qN = (Math.ceil(n / step) * step).toFixed(2);
  const qE = (Math.ceil(e / step) * step).toFixed(2);
  return `${qS},${qW},${qN},${qE}-z${zoom >= 12 ? 'high' : 'mid'}`;
}

/**
 * Fetch peaks & alpine huts dynamically for a given map bounding box and zoom level via OpenStreetMap Overpass API
 */
export async function fetchLiveOverpassPeaks(
  south: number,
  west: number,
  north: number,
  east: number,
  zoom: number
): Promise<{ pois: AlpinePOI[]; totalCount: number }> {
  // At very zoomed out levels (< 8), don't query overpass to prevent huge payload
  if (zoom < 8) {
    return { pois: [], totalCount: 0 };
  }

  const cacheKey = getBBoxCacheKey(south, west, north, east, zoom);
  if (overpassCache.has(cacheKey)) {
    const cached = overpassCache.get(cacheKey)!;
    return { pois: cached, totalCount: cached.length };
  }

  // Construct Overpass QL query
  // For zoom 8-10, filter for peaks with elevation >= 800m to keep query fast and high quality
  // For zoom >= 11, get all peaks and huts in bbox
  let eleFilter = '';
  if (zoom < 11) {
    eleFilter = '[~"^ele$"~"^(1[0-9]{3}|2[0-9]{3}|3[0-9]{3}|4[0-9]{3}|[8-9][0-9]{2})$"]';
  }

  const query = `
    [out:json][timeout:15];
    (
      node["natural"="peak"]${eleFilter}(${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)});
      node["tourism"~"alpine_hut|wilderness_hut"](${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)});
    );
    out body 250;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.ai/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  let rawElements: OverpassNode[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: 'data=' + encodeURIComponent(query)
      });

      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.elements)) {
          rawElements = json.elements;
          break;
        }
      }
    } catch (e) {
      console.warn(`Overpass endpoint ${endpoint} failed, trying next...`, e);
    }
  }

  const pois: AlpinePOI[] = [];

  rawElements.forEach((node) => {
    if (!node.lat || !node.lon) return;

    const tags = node.tags || {};
    const isHut = tags.tourism === 'alpine_hut' || tags.tourism === 'wilderness_hut';
    const isPeak = tags.natural === 'peak';

    // Skip unnamed minor peaks at lower zoom levels to avoid clutter
    if (!tags.name && zoom < 13) return;

    const eleNumber = tags.ele ? parseInt(tags.ele.replace(/[^0-9]/g, ''), 10) : 0;
    const nameStr = tags.name || (isPeak ? 'Berggipfel' : 'Schutzhütte');
    const formattedName = eleNumber > 0 ? `${nameStr} (${eleNumber}m)` : nameStr;

    let regionName = 'Toskana & Alpenraum';
    if (node.lat >= 42.5 && node.lat <= 44.5 && node.lon >= 9.8 && node.lon <= 12.5) {
      regionName = 'Toskana / Appennino';
    }

    const poi: AlpinePOI = {
      id: `overpass-${node.id}`,
      name: formattedName,
      type: isHut ? 'refugio' : 'peak',
      categoryLabel: isHut ? 'Schutzhütte (OSM Live)' : 'Gipfel (OSM Live)',
      lat: node.lat,
      lng: node.lon,
      ele: eleNumber,
      region: regionName,
      description: tags.description || `Live erfasser ${isPeak ? 'Berggipfel' : 'Zufluchtsort'} aus der OpenStreetMap-Datenbank.`,
      facilities: ['OSM Live', isPeak ? 'Gipfelkarte' : 'Hütteneintrag'],
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${node.lat},${node.lon}`
    };

    pois.push(poi);
  });

  overpassCache.set(cacheKey, pois);
  return { pois, totalCount: pois.length };
}
