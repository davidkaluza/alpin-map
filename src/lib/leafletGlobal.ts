/**
 * Leaflet plugins like leaflet.markercluster extend the global `L`. Vite's ESM build of Leaflet
 * doesn't set it, so expose it here. Import this module before any such plugin.
 */
import L from 'leaflet';

(window as unknown as { L: typeof L }).L = L;

export default L;
