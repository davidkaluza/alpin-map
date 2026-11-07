/**
 * Vector topo base map: OpenFreeMap (OpenMapTiles schema) rendered with MapLibre GL inside Leaflet,
 * plus hillshade and contour lines generated client-side from Mapterhorn terrain tiles.
 * No API key required. Loaded lazily so MapLibre is only downloaded when this layer is used.
 *
 * Offline: every request (style, TileJSON, vector tiles, fonts, sprites, terrain) goes through the
 * IndexedDB tile cache – via the `amc://` MapLibre protocol and a custom DEM fetcher – so viewed areas
 * and downloaded regions work without network.
 */
import L from 'leaflet';
import * as maplibregl from 'maplibre-gl';
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';
import mlcontour from 'maplibre-contour';
import { CACHE_PROTOCOL, DEM_MAXZOOM, DEM_URL } from '../data/vectorTopoConfig';
import { getJsonNetworkFirst, getOrFetchTile } from './offlineStorage';
// Let Vite bundle MapLibre's worker so it resolves in dev and in the production build
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const FONT_REGULAR = ['Noto Sans Regular'];
const FONT_BOLD = ['Noto Sans Bold'];
export const VECTOR_PANE = 'vectorBase';

/** "Nur Offline-Karten": never touch the network, only serve what is stored. */
let offlineOnly = false;
export function setVectorOfflineOnly(v: boolean) {
  offlineOnly = v;
}

// `https://host/path` <-> `amc://host/path` (a nested "https://" would be mangled by MapLibre's sprite URL handling)
const PREFIX = `${CACHE_PROTOCOL}://`;
const cached = (url: string) => (url.startsWith(PREFIX) ? url : url.replace(/^https:\/\//, PREFIX));
const original = (url: string) => url.replace(PREFIX, 'https://');

maplibregl.addProtocol(CACHE_PROTOCOL, async (params, abort) => {
  const blob = await getOrFetchTile(original(params.url), { signal: abort.signal, offlineOnly });
  if (params.type === 'json') return { data: JSON.parse(await blob.text()) };
  if (params.type === 'string') return { data: await blob.text() };
  return { data: await blob.arrayBuffer() };
});

let demSource: InstanceType<typeof mlcontour.DemSource> | null = null;
function getDemSource() {
  if (!demSource) {
    // worker: false so the DEM fetch can be routed through the IndexedDB cache below
    demSource = new mlcontour.DemSource({ url: DEM_URL, encoding: 'terrarium', maxzoom: DEM_MAXZOOM, worker: false });
    (demSource.manager as unknown as { getTile: (url: string, ac: AbortController) => Promise<{ data: Blob }> }).getTile = async (url, ac) => ({
      data: await getOrFetchTile(url, { signal: ac.signal, offlineOnly }),
    });
    demSource.setupMaplibre(maplibregl);
  }
  return demSource;
}

/** Routes all of the style's own resources through the cache protocol and inlines the TileJSON. */
async function cacheStyleResources(style: StyleSpecification) {
  if (style.glyphs) style.glyphs = cached(style.glyphs);
  if (typeof style.sprite === 'string') style.sprite = cached(style.sprite);
  else if (Array.isArray(style.sprite)) style.sprite = style.sprite.map((s) => ({ ...s, url: cached(s.url) }));
  for (const src of Object.values(style.sources)) {
    if (src.type !== 'vector' && src.type !== 'raster') continue;
    if (src.url) {
      const tj = await getJsonNetworkFirst<{ tiles: string[]; minzoom?: number; maxzoom?: number; bounds?: [number, number, number, number] }>(src.url, { offlineOnly });
      delete src.url;
      src.tiles = tj.tiles;
      if (tj.minzoom !== undefined) src.minzoom = tj.minzoom;
      if (tj.maxzoom !== undefined) src.maxzoom = tj.maxzoom;
    }
    if (src.tiles) src.tiles = src.tiles.map(cached);
  }
}

const styleCache = new Map<string, Promise<StyleSpecification>>();

async function buildStyle(styleUrl: string): Promise<StyleSpecification> {
  const style = await getJsonNetworkFirst<StyleSpecification>(styleUrl, { offlineOnly });
  await cacheStyleResources(style);
  const dem = getDemSource();

  style.sources.dem = {
    type: 'raster-dem',
    tiles: [dem.sharedDemProtocolUrl],
    tileSize: 512,
    encoding: 'terrarium',
    maxzoom: DEM_MAXZOOM,
    attribution: '<a href="https://mapterhorn.com/attribution">&copy; Mapterhorn</a>',
  };
  style.sources.contours = {
    type: 'vector',
    tiles: [
      dem.contourProtocolUrl({
        multiplier: 1,
        // [minor, major] spacing in metres per zoom
        thresholds: { 10: [200, 1000], 11: [100, 500], 12: [50, 250], 13: [20, 100] },
        elevationKey: 'ele',
        levelKey: 'level',
        contourLayer: 'contours',
        overzoom: 1,
      }),
    ],
    maxzoom: 15,
  };

  const hillshade: LayerSpecification = {
    id: 'am-hillshade',
    type: 'hillshade',
    source: 'dem',
    paint: {
      'hillshade-exaggeration': 0.4,
      'hillshade-shadow-color': '#4b5563',
      'hillshade-highlight-color': '#ffffff',
      'hillshade-accent-color': '#374151',
    },
  };
  const contourColor = '#9a6a3a';
  const contourLines: LayerSpecification = {
    id: 'am-contours',
    type: 'line',
    source: 'contours',
    'source-layer': 'contours',
    minzoom: 10,
    paint: {
      'line-color': contourColor,
      'line-opacity': ['match', ['get', 'level'], 1, 0.55, 0.3],
      'line-width': ['match', ['get', 'level'], 1, 1.1, 0.6],
    },
  };
  const contourLabels: LayerSpecification = {
    id: 'am-contour-labels',
    type: 'symbol',
    source: 'contours',
    'source-layer': 'contours',
    minzoom: 12,
    filter: ['>', ['get', 'level'], 0],
    layout: {
      'symbol-placement': 'line',
      'text-field': ['concat', ['number-format', ['get', 'ele'], {}], ' m'],
      'text-font': FONT_REGULAR,
      'text-size': 10,
      'text-max-angle': 45,
      'symbol-spacing': 300,
      'text-padding': 2,
    },
    paint: { 'text-color': contourColor, 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.2 },
  };
  const peaks: LayerSpecification = {
    id: 'am-peaks',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'mountain_peak',
    minzoom: 10,
    filter: ['has', 'name'],
    layout: {
      'text-field': ['case', ['has', 'ele'], ['concat', ['get', 'name'], '\n', ['to-string', ['get', 'ele']], ' m'], ['get', 'name']],
      'text-font': FONT_BOLD,
      'text-size': 11,
      // triangle on the summit, name below it – clear of the app's 30px POI marker on the peak.
      // Icon and text collide as one, so a hidden label never leaves a lone symbol behind.
      'icon-image': 'triangle_11',
      'icon-size': 0.8,
      'text-anchor': 'top',
      'text-offset': [0, 1.5],
      'symbol-sort-key': ['-', 0, ['coalesce', ['get', 'ele'], 0]],
    },
    paint: { 'text-color': '#3f2a14', 'text-halo-color': 'rgba(255,255,255,0.9)', 'text-halo-width': 1.4, 'icon-opacity': 0.85 },
  };

  const layers = style.layers.filter((l) => l.id !== 'building-3d');
  // Hiking paths: visible earlier and drawn as a dashed trail line
  for (const l of layers) {
    if (l.id === 'road_path_pedestrian' && l.type === 'line') {
      l.minzoom = 12;
      l.paint = {
        'line-color': '#b4532a',
        'line-dasharray': [2, 1.2],
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 12, 0.8, 15, 1.6, 18, 3],
      };
    }
  }
  const insertBefore = (id: string, add: LayerSpecification[]) => {
    const i = layers.findIndex((l) => l.id === id);
    layers.splice(i < 0 ? layers.length : i, 0, ...add);
  };
  // relief + contours under water and roads, labels on top
  insertBefore('waterway_tunnel', [hillshade, contourLines]);
  insertBefore('waterway_line_label', [contourLabels]);
  layers.push(peaks);
  style.layers = layers;
  return style;
}

function getStyle(styleUrl: string) {
  let p = styleCache.get(styleUrl);
  if (!p) {
    p = buildStyle(styleUrl);
    p.catch(() => styleCache.delete(styleUrl));
    styleCache.set(styleUrl, p);
  }
  return p;
}

/** Creates the Leaflet layer. Resolves once the style is ready. */
export async function createVectorLayer(map: L.Map, styleUrl: string, attribution: string): Promise<L.Layer> {
  if (!map.getPane(VECTOR_PANE)) {
    // below Leaflet's tilePane (200) so raster overlays like the hiking layer stay on top
    map.createPane(VECTOR_PANE).style.zIndex = '150';
  }
  const style = await getStyle(styleUrl);
  return L.maplibreGL({
    style,
    // the bridge reports customAttribution to Leaflet's attribution control (GL control stays off)
    attributionControl: { customAttribution: attribution },
    interactive: false,
    pane: VECTOR_PANE,
  } as L.LeafletMaplibreGLOptions);
}
