import type { Coordinate, Tour, Waypoint, WaypointCategory } from '../types';
import { computeTrackStats, escapeHtml, estimateHours, uid } from '../lib/geo';

const SYMBOLS: Record<WaypointCategory, string> = {
  peak: 'Summit',
  hut: 'Lodge',
  water: 'Drinking Water',
  viewpoint: 'Scenic Area',
  parking: 'Parking Area',
  danger: 'Danger Area',
  info: 'Flag, Blue',
};

function categoryFromSymbol(sym?: string | null): WaypointCategory {
  const s = (sym || '').toLowerCase();
  if (s.includes('summit') || s.includes('peak')) return 'peak';
  if (s.includes('lodge') || s.includes('hut') || s.includes('building') || s.includes('restaurant')) return 'hut';
  if (s.includes('water')) return 'water';
  if (s.includes('scenic') || s.includes('view')) return 'viewpoint';
  if (s.includes('parking')) return 'parking';
  if (s.includes('danger') || s.includes('skull')) return 'danger';
  return 'info';
}

export function generateGPX(tour: Tour): string {
  const wpts = tour.waypoints
    .map(
      (wp) => `  <wpt lat="${wp.lat.toFixed(6)}" lon="${wp.lng.toFixed(6)}">
${wp.ele !== undefined ? `    <ele>${wp.ele.toFixed(1)}</ele>\n` : ''}    <name>${escapeHtml(wp.name)}</name>
${wp.description ? `    <desc>${escapeHtml(wp.description)}</desc>\n` : ''}    <sym>${SYMBOLS[wp.category]}</sym>
  </wpt>`,
    )
    .join('\n');
  const trkpts = tour.coordinates
    .map(
      (p) =>
        `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}">${p.ele !== undefined ? `<ele>${p.ele.toFixed(1)}</ele>` : ''}${p.time ? `<time>${p.time}</time>` : ''}</trkpt>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="ALPIN MAP" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeHtml(tour.title)}</name>
    <desc>${escapeHtml(tour.description)}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
${wpts}
  <trk>
    <name>${escapeHtml(tour.title)}</name>
    <type>hiking</type>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

/** Saves the GPX – uses the iOS share sheet when available, otherwise a download. */
export async function exportGPX(tour: Tour): Promise<void> {
  const xml = generateGPX(tour);
  const filename = `${(tour.title || 'tour').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '').slice(0, 60) || 'tour'}.gpx`;
  const file = new File([xml], filename, { type: 'application/gpx+xml' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: tour.title });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseGPX(xmlText: string, fileName?: string): Tour {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Ungültiges XML');
  const text = (sel: string, root: ParentNode = doc) => root.querySelector(sel)?.textContent?.trim() || '';

  const title = text('metadata > name') || text('trk > name') || text('rte > name') || fileName?.replace(/\.gpx$/i, '') || 'Importierte Tour';
  const description = text('metadata > desc') || text('trk > desc') || 'Per GPX importierte Route.';

  const num = (v: string | null | undefined) => {
    const n = parseFloat(v ?? '');
    return Number.isFinite(n) ? n : undefined;
  };

  const waypoints: Waypoint[] = [];
  doc.querySelectorAll('wpt').forEach((node, i) => {
    const lat = num(node.getAttribute('lat'));
    const lng = num(node.getAttribute('lon'));
    if (lat === undefined || lng === undefined) return;
    waypoints.push({
      id: uid('wp'),
      name: text('name', node) || `Wegpunkt ${i + 1}`,
      category: categoryFromSymbol(text('sym', node)),
      lat,
      lng,
      ele: num(text('ele', node)),
      description: text('desc', node) || undefined,
    });
  });

  const coordinates: Coordinate[] = [];
  const pts = doc.querySelectorAll('trkpt');
  (pts.length ? pts : doc.querySelectorAll('rtept')).forEach((node) => {
    const lat = num(node.getAttribute('lat'));
    const lng = num(node.getAttribute('lon'));
    if (lat === undefined || lng === undefined) return;
    coordinates.push({ lat, lng, ele: num(text('ele', node)), time: text('time', node) || undefined });
  });
  if (coordinates.length < 2 && waypoints.length === 0) throw new Error('Keine Track- oder Wegpunkte gefunden');

  const stats = computeTrackStats(coordinates);
  const difficulty: Tour['difficulty'] =
    stats.ascentM > 1500 ? 'Alpin' : stats.ascentM > 800 || stats.distanceKm > 18 ? 'Schwer' : stats.ascentM > 400 || stats.distanceKm > 10 ? 'Mittel' : 'Einfach';

  return {
    id: uid('gpx'),
    title,
    region: 'Importierte Route',
    difficulty,
    distanceKm: stats.distanceKm,
    ascentM: stats.ascentM,
    descentM: stats.descentM,
    estimatedHours: estimateHours(stats.distanceKm, stats.ascentM, stats.descentM),
    description,
    coordinates,
    waypoints,
    isCustom: true,
    createdAt: new Date().toLocaleDateString('de-DE'),
  };
}
