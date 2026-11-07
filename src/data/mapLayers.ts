import type { MapLayerConfig } from '../types';
import { VECTOR_STYLE_URL } from './vectorTopoConfig';

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const BASE_LAYERS: MapLayerConfig[] = [
  {
    id: 'vector-topo',
    name: 'Vektor-Topo',
    category: 'base',
    kind: 'vector',
    url: VECTOR_STYLE_URL,
    attribution: `<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> ${OSM}, <a href="https://mapterhorn.com/attribution">Mapterhorn</a>`,
    maxZoom: 20,
    minZoom: 2,
    hiDpi: true,
    description: 'Immer gestochen scharf · Höhenlinien, Relief, Wege',
    preview: 'from-amber-100 via-lime-100 to-emerald-200',
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap',
    category: 'base',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: `${OSM}, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`,
    maxZoom: 18,
    maxNativeZoom: 17,
    minZoom: 3,
    description: 'Topografie mit Höhenlinien und Reliefschattierung',
    preview: 'from-lime-200 via-amber-100 to-emerald-300',
  },
  {
    id: 'esri-street',
    name: 'Straßenkarte',
    category: 'base',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, NGA, EPA, USDA, NPS',
    maxZoom: 20,
    maxNativeZoom: 18,
    minZoom: 2,
    description: 'Klar und schnell – ideal zur Übersicht',
    preview: 'from-sky-100 via-orange-50 to-amber-100',
  },
  {
    id: 'esri-topo',
    name: 'Esri Topo',
    category: 'base',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, NGA, EPA, USDA, NPS',
    maxZoom: 20,
    maxNativeZoom: 18,
    minZoom: 2,
    description: 'Detailliertes Geländerelief weltweit',
    preview: 'from-emerald-100 via-stone-100 to-amber-200',
  },
  {
    id: 'cyclosm',
    name: 'CyclOSM Outdoor',
    category: 'base',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: `&copy; <a href="https://www.cyclosm.org">CyclOSM</a> ${OSM}`,
    maxZoom: 20,
    maxNativeZoom: 20,
    minZoom: 3,
    description: 'Wege mit Oberflächen und Schwierigkeit',
    preview: 'from-yellow-100 via-rose-100 to-emerald-200',
  },
  {
    id: 'esri-sat',
    name: 'Satellit',
    category: 'base',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics, GIS User Community',
    maxZoom: 20,
    maxNativeZoom: 19,
    minZoom: 3,
    description: 'Hochauflösende Luftbilder',
    preview: 'from-emerald-900 via-stone-700 to-slate-800',
    dark: true,
  },
  {
    id: 'esri-dark',
    name: 'Nacht',
    category: 'base',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    maxZoom: 20,
    maxNativeZoom: 16,
    minZoom: 2,
    description: 'Dunkle Karte – schont Akku und Augen',
    preview: 'from-slate-900 via-slate-800 to-slate-700',
    dark: true,
  },
];

const mapboxLayer = (id: string, style: string, name: string, description: string, preview: string, token: string): MapLayerConfig => ({
  id,
  name,
  category: 'base',
  url: `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(token)}`,
  attribution: `&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ${OSM}`,
  maxZoom: 22,
  maxNativeZoom: 20,
  minZoom: 2,
  description,
  preview,
  requiresToken: true,
  hiDpi: true,
});

export const HIKING_OVERLAY: MapLayerConfig = {
  id: 'waymarked-hiking',
  name: 'Wanderwege',
  category: 'overlay',
  url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://hiking.waymarkedtrails.org">Waymarked Trails</a>',
  maxZoom: 20,
  maxNativeZoom: 18,
  minZoom: 3,
  description: 'Markierte Wanderwege farbig hervorgehoben',
};

export const DEFAULT_LAYER_ID = 'vector-topo';

export function getBaseLayers(mapboxToken?: string): MapLayerConfig[] {
  const token = mapboxToken?.trim();
  if (!token) return BASE_LAYERS;
  return [
    mapboxLayer('mapbox-outdoors', 'outdoors-v12', 'Mapbox Outdoors', 'Höhenlinien, Relief und Wanderwege', 'from-lime-100 via-emerald-100 to-sky-100', token),
    mapboxLayer('mapbox-satellite', 'satellite-streets-v12', 'Mapbox Satellit', 'Luftbild mit Beschriftung', 'from-emerald-950 via-stone-800 to-slate-700', token),
    ...BASE_LAYERS,
  ];
}

export function findLayer(id: string, mapboxToken?: string): MapLayerConfig {
  const layers = getBaseLayers(mapboxToken);
  return layers.find((l) => l.id === id) ?? layers.find((l) => l.id === DEFAULT_LAYER_ID)!;
}
