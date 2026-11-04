import type { AlpinePOI } from '../types';

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const cache = new Map<string, AlpinePOI[]>();

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function bboxKey(s: number, w: number, n: number, e: number, zoom: number) {
  const step = zoom >= 12 ? 0.05 : 0.2;
  const q = (v: number, f: (x: number) => number) => (f(v / step) * step).toFixed(2);
  return `${q(s, Math.floor)},${q(w, Math.floor)},${q(n, Math.ceil)},${q(e, Math.ceil)}|${zoom >= 12 ? 'h' : 'm'}`;
}

/** Live peaks, huts and shelters from OpenStreetMap for the visible map area. */
export async function fetchOverpassPOIs(
  south: number,
  west: number,
  north: number,
  east: number,
  zoom: number,
  signal?: AbortSignal,
): Promise<AlpinePOI[]> {
  if (zoom < 9) return [];
  const k = bboxKey(south, west, north, east, zoom);
  if (cache.has(k)) return cache.get(k)!;

  const bbox = `${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)}`;
  const peakFilter = zoom < 12 ? '["name"]' : '';
  const query = `[out:json][timeout:15];(node["natural"="peak"]${peakFilter}(${bbox});nwr["tourism"~"^(alpine_hut|wilderness_hut)$"](${bbox});nwr["amenity"="shelter"]["shelter_type"~"basic_hut|lean_to"](${bbox}););out center 250;`;

  let elements: OverpassElement[] | null = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: 'data=' + encodeURIComponent(query),
        signal,
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (Array.isArray(json?.elements)) {
        elements = json.elements;
        break;
      }
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }
  if (!elements) return [];

  const pois: AlpinePOI[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) continue;
    const tags = el.tags ?? {};
    const isPeak = tags.natural === 'peak';
    if (!tags.name && (isPeak || zoom < 13)) continue;
    const isShelter = tags.tourism === 'wilderness_hut' || tags.amenity === 'shelter';
    const ele = tags.ele ? Math.round(parseFloat(tags.ele.replace(',', '.'))) || 0 : 0;
    const name = tags.name || (isShelter ? 'Unterstand' : 'Schutzhütte');
    pois.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      type: isPeak ? 'peak' : isShelter ? 'refugio' : 'hut',
      categoryLabel: isPeak ? 'Gipfel' : isShelter ? 'Biwak / Unterstand' : 'Schutzhütte',
      lat,
      lng,
      ele,
      region: tags['addr:city'] || tags['is_in'] || 'OpenStreetMap',
      description: tags.description || '',
      openingSeason: tags.opening_hours,
      capacity: tags.beds ? `${tags.beds} Schlafplätze` : tags.capacity ? `${tags.capacity} Plätze` : undefined,
      website: tags.website || tags['contact:website'],
      facilities: [
        tags.operator && `Betreiber: ${tags.operator}`,
        tags.drinking_water === 'yes' && 'Trinkwasser',
        tags.fireplace === 'yes' && 'Feuerstelle',
        tags.summit_cross === 'yes' || tags['summit:cross'] === 'yes' ? 'Gipfelkreuz' : null,
      ].filter(Boolean) as string[],
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
  }
  cache.set(k, pois);
  return pois;
}
