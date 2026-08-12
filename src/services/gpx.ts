import { Tour, Coordinate, Waypoint } from '../types';

/**
 * Generate GPX 1.1 XML string from a Tour object
 */
export function generateGPX(tour?: Tour | null): string {
  if (!tour) return '';
  const timestamp = new Date().toISOString();
  
  const waypointsXml = (tour.waypoints || []).map(wp => `
    <wpt lat="${wp.lat.toFixed(6)}" lon="${wp.lng.toFixed(6)}">
      ${wp.ele !== undefined ? `<ele>${wp.ele.toFixed(1)}</ele>` : ''}
      <name>${escapeXml(wp.name)}</name>
      ${wp.description ? `<desc>${escapeXml(wp.description)}</desc>` : ''}
      <sym>${mapCategoryToGpxSymbol(wp.category)}</sym>
    </wpt>`).join('');

  const trkptsXml = (tour.coordinates || []).map(pt => `
        <trkpt lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}">
          ${pt.ele !== undefined ? `<ele>${pt.ele.toFixed(1)}</ele>` : ''}
          ${pt.time ? `<time>${pt.time}</time>` : ''}
        </trkpt>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailNav Offline App - https://ai.studio" 
  xmlns="http://www.topografix.com/GPX/1/1" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(tour.title)}</name>
    <desc>${escapeXml(tour.description || '')}</desc>
    <author>
      <name>TrailNav Offline User</name>
    </author>
    <time>${timestamp}</time>
  </metadata>
  ${waypointsXml}
  <trk>
    <name>${escapeXml(tour.title)}</name>
    <type>Hiking</type>
    <trkseg>
      ${trkptsXml}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Trigger file download for GPX file in browser
 */
export function downloadGPX(tour?: Tour | null) {
  if (!tour) return;
  const gpxContent = generateGPX(tour);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeFilename = (tour.title || 'tour').toLowerCase().replace(/[^a-z0-9]/g, '_') + '.gpx';
  
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse an imported .gpx file string into a Tour structure
 */
export function parseGPX(xmlText: string, fileName?: string): Tour {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const titleElem = xmlDoc.querySelector('metadata > name') || xmlDoc.querySelector('trk > name') || xmlDoc.querySelector('rte > name');
  const title = titleElem?.textContent?.trim() || fileName?.replace(/\.gpx$/i, '') || 'Importierte GPX Tour';
  
  const descElem = xmlDoc.querySelector('metadata > desc') || xmlDoc.querySelector('trk > desc');
  const description = descElem?.textContent?.trim() || 'Über GPX-Datei importierte Outdoor-Route.';
  
  // Extract Waypoints
  const waypoints: Waypoint[] = [];
  const wptNodes = xmlDoc.querySelectorAll('wpt');
  wptNodes.forEach((node, idx) => {
    const lat = parseFloat(node.getAttribute('lat') || '0');
    const lng = parseFloat(node.getAttribute('lon') || node.getAttribute('lng') || '0');
    const eleNode = node.querySelector('ele');
    const nameNode = node.querySelector('name');
    const descNode = node.querySelector('desc');
    
    waypoints.push({
      id: `gpx-wp-${idx}-${Date.now()}`,
      name: nameNode?.textContent?.trim() || `Wegpunkt ${idx + 1}`,
      category: 'info',
      lat,
      lng,
      ele: eleNode ? parseFloat(eleNode.textContent || '0') : undefined,
      description: descNode?.textContent?.trim() || undefined
    });
  });

  // Extract Track / Route points
  const coordinates: Coordinate[] = [];
  const trkptNodes = xmlDoc.querySelectorAll('trkpt, rtept');
  
  trkptNodes.forEach((node) => {
    const lat = parseFloat(node.getAttribute('lat') || '0');
    const lng = parseFloat(node.getAttribute('lon') || node.getAttribute('lng') || '0');
    const eleNode = node.querySelector('ele');
    const timeNode = node.querySelector('time');
    
    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates.push({
        lat,
        lng,
        ele: eleNode ? parseFloat(eleNode.textContent || '0') : 0,
        time: timeNode?.textContent?.trim() || undefined
      });
    }
  });

  // Calculate distance, ascent, descent
  let totalDistanceMeters = 0;
  let ascentM = 0;
  let descentM = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    
    const dist = haversineDistanceMeters(prev.lat, prev.lng, curr.lat, curr.lng);
    totalDistanceMeters += dist;

    if (prev.ele !== undefined && curr.ele !== undefined) {
      const eleDiff = curr.ele - prev.ele;
      if (eleDiff > 0.5) ascentM += eleDiff;
      else if (eleDiff < -0.5) descentM += Math.abs(eleDiff);
    }
  }

  const distanceKm = Math.round((totalDistanceMeters / 1000) * 10) / 10;
  const estimatedHours = Math.round(((distanceKm / 4.0) + (ascentM / 400.0)) * 10) / 10;
  
  let difficulty: Tour['difficulty'] = 'Einfach';
  if (ascentM > 800 || distanceKm > 18) difficulty = 'Schwer';
  else if (ascentM > 400 || distanceKm > 10) difficulty = 'Mittel';

  return {
    id: `custom-gpx-${Date.now()}`,
    title,
    region: 'Importierte Route',
    difficulty,
    distanceKm,
    ascentM: Math.round(ascentM),
    descentM: Math.round(descentM),
    estimatedHours,
    description,
    coordinates,
    waypoints,
    isCustom: true,
    createdAt: new Date().toLocaleDateString('de-DE')
  };
}

// Utility functions
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function mapCategoryToGpxSymbol(cat: Waypoint['category']): string {
  switch (cat) {
    case 'peak': return 'Summit';
    case 'hut': return 'Building';
    case 'water': return 'Water Source';
    case 'viewpoint': return 'Scenic Area';
    case 'parking': return 'Parking Area';
    case 'danger': return 'Danger Area';
    default: return 'Flag, Blue';
  }
}

export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
