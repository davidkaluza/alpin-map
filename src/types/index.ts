export interface Coordinate {
  lat: number;
  lng: number;
  /** Elevation in meters */
  ele?: number;
  /** ISO timestamp */
  time?: string;
}

export type WaypointCategory = 'peak' | 'hut' | 'water' | 'viewpoint' | 'parking' | 'danger' | 'info';

export interface Waypoint {
  id: string;
  name: string;
  category: WaypointCategory;
  lat: number;
  lng: number;
  ele?: number;
  description?: string;
}

export type DifficultyLevel = 'Einfach' | 'Mittel' | 'Schwer' | 'Alpin';

export interface Tour {
  id: string;
  title: string;
  region: string;
  difficulty: DifficultyLevel;
  distanceKm: number;
  ascentM: number;
  descentM: number;
  estimatedHours: number;
  coordinates: Coordinate[];
  waypoints: Waypoint[];
  description: string;
  isCustom?: boolean;
  isRecorded?: boolean;
  createdAt?: string;
}

export interface MapLayerConfig {
  id: string;
  name: string;
  category: 'base' | 'overlay';
  url: string;
  subdomains?: string[];
  attribution: string;
  maxZoom: number;
  minZoom: number;
  maxNativeZoom?: number;
  description: string;
  /** Tailwind gradient classes for the layer preview tile */
  preview?: string;
  dark?: boolean;
  requiresToken?: boolean;
  /** Server delivers @2x tiles itself (via {r} or a fixed @2x URL) */
  hiDpi?: boolean;
  /** 'vector': `url` is a MapLibre style URL (rendered with MapLibre GL, online only) */
  kind?: 'raster' | 'vector';
}

export interface OfflineRegion {
  id: string;
  name: string;
  layerId: string;
  layerName: string;
  urlTemplate: string;
  subdomains: string[];
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  minZoom: number;
  maxZoom: number;
  tileCount: number;
  failedCount: number;
  sizeMb: number;
  downloadedAt: string;
  status: 'downloading' | 'completed' | 'partial';
}

export type NavMode = 'idle' | 'gps' | 'simulation';

export interface NavigationStatus {
  mode: NavMode;
  isPaused: boolean;
  isRecording: boolean;
  /** index of the nearest point on the active tour */
  currentIndex: number;
  currentPosition: Coordinate | null;
  accuracyM: number | null;
  heading: number;
  speedKmh: number;
  elapsedSeconds: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  ascentCoveredM: number;
  ascentRemainingM: number;
  offRouteM: number | null;
  currentInstruction: string;
  recordedTrack: Coordinate[];
}

export type POIType = 'hut' | 'peak' | 'refugio';

export interface AlpinePOI {
  id: string;
  name: string;
  type: POIType;
  categoryLabel: string;
  lat: number;
  lng: number;
  ele: number;
  region: string;
  description: string;
  openingSeason?: string;
  capacity?: string;
  facilities?: string[];
  googleMapsUrl?: string;
  website?: string;
}
