export interface Coordinate {
  lat: number;
  lng: number;
  ele?: number; // Elevation in meters
  time?: string;
  speed?: number; // km/h
}

export type WaypointCategory = 
  | 'peak'       // Gipfel
  | 'hut'        // Schutzhütte / Bergrestaurant
  | 'water'      // Trinkwasser / Quelle
  | 'viewpoint'  // Aussichtspunkt
  | 'parking'    // Parkplatz / Start
  | 'danger'     // Gefahrenstelle / Klettersteig
  | 'info';      // Wegweiser / Info

export interface Waypoint {
  id: string;
  name: string;
  category: WaypointCategory;
  lat: number;
  lng: number;
  ele?: number;
  description?: string;
  photoUrl?: string;
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
}

export interface OfflineRegion {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  minZoom: number;
  maxZoom: number;
  tileCount: number;
  sizeMb: number;
  downloadedAt: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number; // 0 to 100
}

export interface NavigationStatus {
  isNavigating: boolean;
  isSimulating: boolean;
  isRecording: boolean;
  isPaused: boolean;
  currentIndex: number;
  currentPosition: Coordinate | null;
  heading: number; // degrees 0-360
  speedKmh: number;
  elapsedSeconds: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  ascentCoveredM: number;
  ascentRemainingM: number;
  currentInstruction: string;
  recordedTrack: Coordinate[];
}

export type POIType = 'hut' | 'peak' | 'refugio';

export interface AlpinePOI {
  id: string;
  name: string;
  type: POIType;
  categoryLabel: string; // 'Schutzhütte' | 'Berggipfel' | 'Refugio'
  lat: number;
  lng: number;
  ele: number; // Elevation in meters
  region: string;
  description: string;
  openingSeason?: string;
  capacity?: string;
  facilities?: string[];
  googleMapsUrl?: string;
}
