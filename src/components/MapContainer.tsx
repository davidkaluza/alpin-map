import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Tour, MapLayerConfig, Coordinate, Waypoint, NavigationStatus, AlpinePOI } from '../types';
import { MAP_LAYERS } from '../data/sampleRoutes';
import { ALPINE_POIS } from '../data/alpinePOIs';
import { POIDetailsModal } from './POIDetailsModal';
import { ElevationProfile } from './ElevationProfile';
import { Maximize2, Minimize2, DownloadCloud, MapPin, Crosshair, LocateFixed, Layers, Check, TrendingUp, TrendingDown, Settings, Plus, Minus, Mountain, Home, Sparkles, Sunset, ChevronUp, ChevronDown, X, Activity, BarChart3, Smartphone, Tablet, Monitor } from 'lucide-react';
import { MountainAppIcon } from './MountainAppIcon';
import { LAYOUT_CONFIG, detectDeviceType, DeviceType, DeviceMode } from '../config/layoutConfig';
import { getTileFromCache, saveTileToCache } from '../services/offlineStorage';
import { fetchLiveOverpassPeaks } from '../services/overpassPoiService';
import { getElevationForCoords } from '../services/elevationService';

// Custom Leaflet TileLayer that prioritizes IndexedDB offline cache
const OfflineCachedTileLayer = L.TileLayer.extend({
  createTile(coords: L.Coords, done: L.DoneCallback) {
    const tile = document.createElement('img');
    L.DomEvent.on(tile, 'load', L.Util.bind((this as any)._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', L.Util.bind((this as any)._tileOnError, this, done, tile));

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const tileUrl = this.getTileUrl(coords);

    // 1. Try fetching from IndexedDB offline storage
    getTileFromCache(tileUrl)
      .then((blob) => {
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          tile.src = objectUrl;
          // Revoke after load/error to prevent memory leak
          const revoke = () => URL.revokeObjectURL(objectUrl);
          tile.addEventListener('load', revoke, { once: true });
          tile.addEventListener('error', revoke, { once: true });
        } else {
          tile.src = tileUrl;
          // Auto-cache viewed tile when online
          fetch(tileUrl, { mode: 'cors' })
            .then((res) => (res.ok ? res.blob() : null))
            .then((b) => {
              if (b) saveTileToCache(tileUrl, b);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        tile.src = tileUrl;
      });

    return tile;
  }
});

// Custom SVG marker generator for Leaflet
function createCustomMarkerIcon(category: Waypoint['category']) {
  let color = '#059669'; // default emerald
  let iconSvg = `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>`;

  if (category === 'peak') color = '#d97706'; // amber
  else if (category === 'hut') color = '#b45309'; // brown
  else if (category === 'water') color = '#2563eb'; // blue
  else if (category === 'viewpoint') color = '#9333ea'; // purple
  else if (category === 'parking') color = '#10b981'; // green
  else if (category === 'danger') color = '#dc2626'; // red

  const html = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2.5px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${iconSvg}
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

function createAlpinePOIMarkerIcon(poi: AlpinePOI) {
  const isPeak = poi.type === 'peak';

  // SVG icon for peaks (mountain) vs refugios/huts (house/shelter)
  const iconSvg = isPeak
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10 12 3l9 7v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 22V12h6v10"/></svg>`;

  const html = `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${isPeak ? 'rgba(15, 23, 42, 0.92)' : 'rgba(5, 150, 105, 0.92)'};
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(6px);
      transition: transform 0.15s ease;
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'alpine-poi-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function createNavigationUserIcon(heading: number) {
  const html = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <!-- Pulsing radius aura -->
      <div style="position: absolute; width: 36px; height: 36px; background: rgba(16, 185, 129, 0.25); border-radius: 50%; animation: ping 1.5s infinite;"></div>
      
      <!-- Direction arrow beam -->
      <div style="
        position: absolute;
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-bottom: 22px solid #059669;
        transform: rotate(${heading}deg);
        transform-origin: 50% 100%;
        top: 2px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      "></div>

      <!-- Center dot -->
      <div style="
        width: 14px;
        height: 14px;
        background-color: #ffffff;
        border: 3.5px solid #047857;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        z-index: 2;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'nav-user-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

// Calculate sunset time and relative remaining time for given lat/lng
function getSunsetInfo(lat: number, lng: number, date: Date = new Date()) {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const p = Math.PI / 180;
  const declination = 23.45 * Math.sin(p * (360 / 365) * (dayOfYear - 81));
  
  const latRad = lat * p;
  const decRad = declination * p;
  const cosH = (Math.cos(90.833 * p) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
  
  if (cosH > 1) {
    return { timeStr: 'Polarnacht', relativeStr: 'kein Sonnenuntergang' };
  }
  if (cosH < -1) {
    return { timeStr: 'Mitternachtssonne', relativeStr: 'Sonne geht nicht unter' };
  }
  
  const H = Math.acos(cosH) / p;
  const b = (360 / 365) * (dayOfYear - 81) * p;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  
  const sunsetUtcMinutes = 720 + 4 * (-lng + H) - eot;
  
  const sunsetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
  sunsetDate.setUTCMinutes(sunsetUtcMinutes);
  
  const hours = sunsetDate.getHours().toString().padStart(2, '0');
  const minutes = sunsetDate.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  const diffMs = sunsetDate.getTime() - date.getTime();
  let relativeStr = '';
  if (diffMs > 0) {
    const diffMins = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    relativeStr = h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  } else {
    relativeStr = 'untergegangen';
  }
  
  return { timeStr, relativeStr };
}

interface MapContainerProps {
  tour?: Tour | null;
  activeBaseLayerId: string;
  showOverlayHiking: boolean;
  navStatus: NavigationStatus;
  hoverCoordinate?: Coordinate | null;
  onHoverCoordinate?: (coord: Coordinate | null) => void;
  isDrawMode: boolean;
  onAddPointToDraft?: (coord: Coordinate) => void;
  onMapCenterChange?: (center: [number, number]) => void;
  onSelectBaseLayer?: (layerId: string) => void;
  onToggleHikingOverlay?: () => void;
  onOpenElevationModal?: () => void;
  onOpenSettingsModal?: () => void;
  onOpenOfflineManager?: () => void;
}

export const MapContainerComponent: React.FC<MapContainerProps> = ({
  tour,
  activeBaseLayerId,
  showOverlayHiking,
  navStatus,
  hoverCoordinate,
  onHoverCoordinate,
  isDrawMode,
  onAddPointToDraft,
  onMapCenterChange,
  onSelectBaseLayer,
  onToggleHikingOverlay,
  onOpenElevationModal,
  onOpenSettingsModal,
  onOpenOfflineManager
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayTileLayerRef = useRef<L.TileLayer | null>(null);
  const trackPolylineRef = useRef<L.Polyline | null>(null);
  const recordedPolylineRef = useRef<L.Polyline | null>(null);
  const waypointMarkersRef = useRef<L.Marker[]>([]);
  const alpinePOIMarkersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showAlpinePOIs, setShowAlpinePOIs] = useState<boolean>(false); // Deaktiviert beim Start
  const [dynamicPOIs, setDynamicPOIs] = useState<AlpinePOI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<AlpinePOI | null>(null);
  const [currentCenterLat, setCurrentCenterLat] = useState<number>(tour?.coordinates?.[0]?.lat || 44.0850); // Default Toscana
  const [currentCenterLng, setCurrentCenterLng] = useState<number>(tour?.coordinates?.[0]?.lng || 10.2500);

  // Elevation & Live OSM Peak States
  const [centerElevation, setCenterElevation] = useState<number | null>(null);
  const [userElevation, setUserElevation] = useState<number | null>(null);
  const [showCenterHud, setShowCenterHud] = useState<boolean>(true);
  const [showTourElevationPanel, setShowTourElevationPanel] = useState<boolean>(true);
  const [isElevationPanelExpanded, setIsElevationPanelExpanded] = useState<boolean>(true);
  const [isOverpassLoading, setIsOverpassLoading] = useState<boolean>(false);
  const [totalOSMPeaksLoaded, setTotalOSMPeaksLoaded] = useState<number>(0);

  // Device layout configuration states (Telefon, Tablet, PC)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('auto');
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeDeviceType: DeviceType = deviceMode === 'auto' ? detectDeviceType(windowWidth) : deviceMode;
  const layoutCfg = LAYOUT_CONFIG[activeDeviceType];

  // Auto-open Tour Elevation Panel when a tour/GPX is selected
  useEffect(() => {
    if (tour) {
      setShowTourElevationPanel(true);
      setIsElevationPanelExpanded(true);
    }
  }, [tour?.id]);

  const fetchUserElevation = async (lat: number, lng: number) => {
    const ele = await getElevationForCoords(lat, lng);
    if (ele !== null) {
      setUserElevation(ele);
    }
  };

  useEffect(() => {
    if (navStatus.currentPosition) {
      fetchUserElevation(navStatus.currentPosition.lat, navStatus.currentPosition.lng);
    }
  }, [navStatus.currentPosition?.lat, navStatus.currentPosition?.lng]);

  // Center map to user's current position using GPS + Wi-Fi triangulation
  const handleCenterUserLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          fetchUserElevation(lat, lng);
          map.flyTo([lat, lng], 15, { animate: true, duration: 1 });
          if (onMapCenterChange) {
            onMapCenterChange([lat, lng]);
          }
        },
        (_err) => {
          const userPos = navStatus.currentPosition || (tour?.coordinates && tour.coordinates[0]);
          if (userPos) {
            fetchUserElevation(userPos.lat, userPos.lng);
            map.flyTo([userPos.lat, userPos.lng], 14, { animate: true, duration: 1 });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const userPos = navStatus.currentPosition || (tour?.coordinates && tour.coordinates[0]);
      if (userPos) {
        fetchUserElevation(userPos.lat, userPos.lng);
        map.flyTo([userPos.lat, userPos.lng], 14, { animate: true, duration: 1 });
      }
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Re-size Leaflet map when full screen toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Initialize Map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const firstCoord = tour?.coordinates?.[0] || { lat: 44.0850, lng: 10.2500 };
    const map = L.map(mapContainerRef.current, {
      center: [firstCoord.lat, firstCoord.lng],
      zoom: tour?.coordinates?.length ? 13 : 10,
      zoomControl: false,
      preferCanvas: true
    });

    mapInstanceRef.current = map;

    const updateCenter = () => {
      const c = map.getCenter();
      setCurrentCenterLat(c.lat);
      setCurrentCenterLng(c.lng);
      if (onMapCenterChange) {
        onMapCenterChange([c.lat, c.lng]);
      }
    };

    const fetchCenterElevation = async () => {
      const c = map.getCenter();
      const ele = await getElevationForCoords(c.lat, c.lng);
      if (ele !== null) {
        setCenterElevation(ele);
      }
    };

    // Track map move & drag live
    map.on('move', updateCenter);
    map.on('moveend', () => {
      updateCenter();
      fetchCenterElevation();
    });

    // Initial elevation fetch
    fetchCenterElevation();

    // Auto-center to user's position via Wi-Fi/GPS on initial mount
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchUserElevation(pos.coords.latitude, pos.coords.longitude);
          map.setView([pos.coords.latitude, pos.coords.longitude], 13);
          if (onMapCenterChange) {
            onMapCenterChange([pos.coords.latitude, pos.coords.longitude]);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Continuous position watcher for real-time location updates
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          fetchUserElevation(lat, lng);
          if (userMarkerRef.current && mapInstanceRef.current) {
            userMarkerRef.current.setLatLng([lat, lng]);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }

    // Handle map click for closing active menus and drawing route
    map.on('click', (e: L.LeafletMouseEvent) => {
      setShowLayerMenu(false);
      if (isDrawMode && onAddPointToDraft) {
        onAddPointToDraft({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          ele: Math.round(500 + Math.random() * 200)
        });
      }
    });

    return () => {
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch {}
        userMarkerRef.current = null;
      }
      if (hoverMarkerRef.current) {
        try { hoverMarkerRef.current.remove(); } catch {}
        hoverMarkerRef.current = null;
      }
      if (trackPolylineRef.current) {
        try { trackPolylineRef.current.remove(); } catch {}
        trackPolylineRef.current = null;
      }
      if (recordedPolylineRef.current) {
        try { recordedPolylineRef.current.remove(); } catch {}
        recordedPolylineRef.current = null;
      }
      waypointMarkersRef.current.forEach((m) => {
        try { m.remove(); } catch {}
      });
      waypointMarkersRef.current = [];
      alpinePOIMarkersRef.current.forEach((m) => {
        try { m.remove(); } catch {}
      });
      alpinePOIMarkersRef.current = [];
      if (baseTileLayerRef.current) {
        try { baseTileLayerRef.current.remove(); } catch {}
        baseTileLayerRef.current = null;
      }
      if (overlayTileLayerRef.current) {
        try { overlayTileLayerRef.current.remove(); } catch {}
        overlayTileLayerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch real OpenStreetMap POIs (peaks, huts, shelters) for current map viewport (Toscana, Alpen, etc.)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !showAlpinePOIs) return;

    let isSubscribed = true;

    const fetchOSMPOIs = async () => {
      if (!mapInstanceRef.current) return;
      const zoom = mapInstanceRef.current.getZoom();
      if (zoom < 8) return; // Only fetch when zoomed in to level 8 or higher

      const bounds = mapInstanceRef.current.getBounds();
      const s = bounds.getSouth().toFixed(3);
      const w = bounds.getWest().toFixed(3);
      const n = bounds.getNorth().toFixed(3);
      const e = bounds.getEast().toFixed(3);

      // Query nodes, ways, and relations (nwr) with center coordinates for exact building & peak positions
      const query = `[out:json][timeout:10];(nwr["natural"="peak"](${s},${w},${n},${e});nwr["tourism"~"alpine_hut|wilderness_hut|hut"](${s},${w},${n},${e});nwr["amenity"="shelter"](${s},${w},${n},${e}););out center 120;`;

      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        if (!res.ok || !isSubscribed) return;
        const data = await res.json();

        if (data && Array.isArray(data.elements)) {
          const fetched: AlpinePOI[] = data.elements
            .filter((el: any) => el.tags && (el.tags.name || el.tags.natural || el.tags.tourism) && (el.lat || el.center?.lat))
            .map((el: any) => {
              const latitude = el.lat ?? el.center?.lat;
              const longitude = el.lon ?? el.center?.lon;
              const isPeak = el.tags?.natural === 'peak';
              const isRefugio = el.tags?.tourism === 'wilderness_hut' || el.tags?.amenity === 'shelter';
              const ele = parseInt(el.tags?.ele || '0', 10) || 0;
              const rawName = el.tags?.name || (isPeak ? 'Berggipfel' : 'Schutzhütte');
              const name = ele > 0 && !rawName.includes('m)') ? `${rawName} (${ele}m)` : rawName;

              return {
                id: `osm-${el.id}`,
                name,
                type: isPeak ? 'peak' : isRefugio ? 'refugio' : 'hut',
                categoryLabel: isPeak ? 'Berggipfel (OSM)' : isRefugio ? 'Schutzhütte / Refugio' : 'Alpines Schutzhaus',
                lat: latitude,
                lng: longitude,
                ele,
                region: el.tags?.['addr:city'] || el.tags?.region || 'Toskana & Alpen',
                description: el.tags?.description || `${rawName} in der Region (OpenStreetMap Exakte Lagedaten).`,
                openingSeason: el.tags?.opening_hours || 'Nach Saison',
                facilities: ['Wanderweg-Anschluss', 'OpenStreetMap POI'],
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
              };
            });

          setDynamicPOIs(fetched);
        }
      } catch {
        // Fallback silently to static POIs if offline or rate-limited
      }
    };

    fetchOSMPOIs();

    const onMoveEnd = () => {
      fetchOSMPOIs();
    };

    map.on('moveend', onMoveEnd);

    return () => {
      isSubscribed = false;
      map.off('moveend', onMoveEnd);
    };
  }, [showAlpinePOIs]);

  // Render Schutzhütten / Refugios & Berggipfel POIs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing Alpine POI markers
    alpinePOIMarkersRef.current.forEach((m) => {
      try {
        if (map.hasLayer(m)) map.removeLayer(m);
      } catch {}
    });
    alpinePOIMarkersRef.current = [];

    if (!showAlpinePOIs) return;

    // Haversine distance helper (in meters) to detect duplicates within 350 meters
    const getDistMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371000;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Clean name helper for matching e.g. "Zugspitze (2962m)" and "Zugspitze"
    const normalizeName = (s: string) => s.toLowerCase().replace(/\([0-9\s.müNHN]*\)/g, '').replace(/[^a-z0-9]/g, '');

    // Smart deduplication: Merge static POIs with live OSM POIs
    // If a dynamic OSM POI is near a static POI or shares the same name, update location to OSM exact coordinates
    const mergedList: AlpinePOI[] = ALPINE_POIS.map((p) => ({ ...p }));

    dynamicPOIs.forEach((dyn) => {
      const dynClean = normalizeName(dyn.name);
      const existingMatch = mergedList.find((st) => {
        const stClean = normalizeName(st.name);
        const dist = getDistMeters(st.lat, st.lng, dyn.lat, dyn.lng);
        // Match if within 350 meters OR matching clean name within 1500m
        return dist < 350 || (dynClean.length > 3 && stClean.length > 3 && (dynClean.includes(stClean) || stClean.includes(dynClean)) && dist < 1500);
      });

      if (existingMatch) {
        // Snap static POI to exact OSM coordinates
        existingMatch.lat = dyn.lat;
        existingMatch.lng = dyn.lng;
        if (dyn.ele > 0) existingMatch.ele = dyn.ele;
      } else {
        mergedList.push(dyn);
      }
    });

    mergedList.forEach((poi) => {
      const icon = createAlpinePOIMarkerIcon(poi);
      const marker = L.marker([poi.lat, poi.lng], {
        icon,
        title: `${poi.name} (${poi.ele}m)`,
        zIndexOffset: 500
      });

      marker.bindTooltip(
        `<div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 1px 3px; font-weight: 700; color: #f8fafc;">
          <div>${poi.name}</div>
          <div style="font-size: 10px; color: ${poi.type === 'peak' ? '#f59e0b' : '#34d399'}; font-weight: 600;">${poi.ele > 0 ? `${poi.ele} m ü. NHN • ` : ''}${poi.categoryLabel}</div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -14],
          opacity: 0.95,
          className: 'alpine-poi-tooltip'
        }
      );

      marker.on('click', () => {
        setSelectedPOI(poi);
      });

      marker.addTo(map);
      alpinePOIMarkersRef.current.push(marker);
    });
  }, [showAlpinePOIs, dynamicPOIs]);

  // Update Base Layer & Overlay with ultra-fast tile loading configuration
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerConfig = MAP_LAYERS.find((l) => l.id === activeBaseLayerId) || MAP_LAYERS[0];

    if (baseTileLayerRef.current && map.hasLayer(baseTileLayerRef.current)) {
      try { map.removeLayer(baseTileLayerRef.current); } catch {}
    }

    const subdomainsList =
      layerConfig.subdomains !== undefined
        ? layerConfig.subdomains
        : layerConfig.url.includes('{s}')
        ? ['a', 'b', 'c']
        : [];

    const baseTile = new (OfflineCachedTileLayer as any)(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
      maxNativeZoom: layerConfig.maxNativeZoom || Math.min(layerConfig.maxZoom, 18),
      minZoom: layerConfig.minZoom,
      subdomains: subdomainsList.length > 0 ? subdomainsList : ['a', 'b', 'c'],
      keepBuffer: 8,
      updateWhenIdle: false,
      crossOrigin: true
    });

    // Tile error fallback handling to prevent broken image icons when zooming
    baseTile.on('tileerror', (errorEvt: L.TileErrorEvent) => {
      const tileImg = errorEvt.tile as HTMLImageElement;
      if (tileImg) {
        if (!tileImg.dataset.retryAttempted) {
          tileImg.dataset.retryAttempted = 'true';
          // Try fetching with subdomain 'a' if a subdomain like 'd' failed
          if (tileImg.src.includes('opentopomap.org') || tileImg.src.includes('cyclosm')) {
            tileImg.src = tileImg.src.replace(/\/\/[a-z0-9]\./i, '//a.');
            return;
          }
        }
        if (!tileImg.dataset.fallbackApplied) {
          tileImg.dataset.fallbackApplied = 'true';
          // Fallback transparent 1x1 GIF so no broken image frame is displayed
          tileImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }
      }
    });

    baseTile.addTo(map);
    baseTileLayerRef.current = baseTile;

    // Waymarked Trails Hiking Overlay
    if (showOverlayHiking) {
      const hikingOverlayConfig = MAP_LAYERS.find((l) => l.id === 'waymarked-hiking');
      if (hikingOverlayConfig) {
        if (overlayTileLayerRef.current && map.hasLayer(overlayTileLayerRef.current)) {
          try { map.removeLayer(overlayTileLayerRef.current); } catch {}
        }
        const overlay = L.tileLayer(hikingOverlayConfig.url, {
          attribution: hikingOverlayConfig.attribution,
          maxZoom: hikingOverlayConfig.maxZoom,
          maxNativeZoom: hikingOverlayConfig.maxNativeZoom || 17,
          opacity: 0.85,
          keepBuffer: 6,
          updateWhenIdle: false
        });
        overlay.on('tileerror', (errorEvt: L.TileErrorEvent) => {
          const tileImg = errorEvt.tile as HTMLImageElement;
          if (tileImg) {
            tileImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          }
        });
        overlay.addTo(map);
        overlayTileLayerRef.current = overlay;
      }
    } else if (overlayTileLayerRef.current) {
      try {
        if (map.hasLayer(overlayTileLayerRef.current)) {
          map.removeLayer(overlayTileLayerRef.current);
        }
      } catch {}
      overlayTileLayerRef.current = null;
    }
  }, [activeBaseLayerId, showOverlayHiking]);

  // Render Tour Polyline & Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (trackPolylineRef.current) {
      try {
        if (map.hasLayer(trackPolylineRef.current)) {
          map.removeLayer(trackPolylineRef.current);
        }
      } catch {}
      trackPolylineRef.current = null;
    }

    waypointMarkersRef.current.forEach((m) => {
      try {
        if (map.hasLayer(m)) map.removeLayer(m);
      } catch {}
    });
    waypointMarkersRef.current = [];

    if (!tour || !tour.coordinates || tour.coordinates.length === 0) return;

    const latLngs = tour.coordinates.map((c) => [c.lat, c.lng] as [number, number]);

    // Draw main trail line with glow effect
    const polyline = L.polyline(latLngs, {
      color: '#059669',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    trackPolylineRef.current = polyline;

    // Fit map bounds to tour
    const bounds = polyline.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // Render Waypoints
    (tour.waypoints || []).forEach((wp) => {
      const icon = createCustomMarkerIcon(wp.category);
      const marker = L.marker([wp.lat, wp.lng], { icon })
        .bindPopup(
          `
          <div style="font-family: sans-serif;">
            <strong style="color: #0f172a; font-size: 13px;">${wp.name}</strong>
            ${wp.ele ? `<div style="font-size: 11px; color: #059669; font-weight: 600;">Höhe: ${wp.ele} m.ü.NHN</div>` : ''}
            ${wp.description ? `<p style="font-size: 11px; color: #475569; margin: 4px 0 0 0;">${wp.description}</p>` : ''}
          </div>
        `
        )
        .addTo(map);

      waypointMarkersRef.current.push(marker);
    });
  }, [tour]);

  // Update Recorded Track Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (recordedPolylineRef.current) {
      try {
        if (map.hasLayer(recordedPolylineRef.current)) {
          map.removeLayer(recordedPolylineRef.current);
        }
      } catch {}
      recordedPolylineRef.current = null;
    }

    if (navStatus.recordedTrack && navStatus.recordedTrack.length > 1) {
      const recLatLngs = navStatus.recordedTrack.map((c) => [c.lat, c.lng] as [number, number]);
      const recPoly = L.polyline(recLatLngs, {
        color: '#dc2626',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.95
      }).addTo(map);

      recordedPolylineRef.current = recPoly;
    }
  }, [navStatus.recordedTrack]);

  // Update User Navigation Position Marker & Pan
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const pos = navStatus.currentPosition || (tour?.coordinates && tour.coordinates[0]);
    if (!pos || typeof pos.lat !== 'number' || typeof pos.lng !== 'number' || isNaN(pos.lat) || isNaN(pos.lng)) return;

    const heading = typeof navStatus.heading === 'number' && !isNaN(navStatus.heading) ? navStatus.heading : 0;

    if (userMarkerRef.current && userMarkerRef.current.getElement() && map.hasLayer(userMarkerRef.current)) {
      try {
        userMarkerRef.current.setLatLng([pos.lat, pos.lng]);
        userMarkerRef.current.setIcon(createNavigationUserIcon(heading));
      } catch {
        try { userMarkerRef.current.remove(); } catch {}
        userMarkerRef.current = L.marker([pos.lat, pos.lng], {
          icon: createNavigationUserIcon(heading),
          zIndexOffset: 1000
        }).addTo(map);
      }
    } else {
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch {}
      }
      userMarkerRef.current = L.marker([pos.lat, pos.lng], {
        icon: createNavigationUserIcon(heading),
        zIndexOffset: 1000
      }).addTo(map);
    }

    if (navStatus.isNavigating && !navStatus.isPaused) {
      map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.5 });
    }
  }, [navStatus.currentPosition, navStatus.heading, navStatus.isNavigating, tour]);

  // Hover Coordinate Marker Sync with Elevation Chart
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hoverCoordinate && typeof hoverCoordinate.lat === 'number' && typeof hoverCoordinate.lng === 'number' && !isNaN(hoverCoordinate.lat) && !isNaN(hoverCoordinate.lng)) {
      if (hoverMarkerRef.current && hoverMarkerRef.current.getElement() && map.hasLayer(hoverMarkerRef.current)) {
        try {
          hoverMarkerRef.current.setLatLng([hoverCoordinate.lat, hoverCoordinate.lng]);
        } catch {
          try { hoverMarkerRef.current.remove(); } catch {}
          hoverMarkerRef.current = L.circleMarker([hoverCoordinate.lat, hoverCoordinate.lng], {
            radius: 8,
            fillColor: '#d97706',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 0.95
          }).addTo(map);
        }
      } else {
        if (hoverMarkerRef.current) {
          try { hoverMarkerRef.current.remove(); } catch {}
        }
        hoverMarkerRef.current = L.circleMarker([hoverCoordinate.lat, hoverCoordinate.lng], {
          radius: 8,
          fillColor: '#d97706',
          color: '#ffffff',
          weight: 3,
          fillOpacity: 0.95
        }).addTo(map);
      }
    } else if (hoverMarkerRef.current) {
      try {
        if (map.hasLayer(hoverMarkerRef.current)) {
          map.removeLayer(hoverMarkerRef.current);
        }
      } catch {}
      hoverMarkerRef.current = null;
    }
  }, [hoverCoordinate]);

  return (
    <div className="relative w-full h-full overflow-hidden z-0 flex flex-col flex-1">
      {/* Map Target Container - 100% full height */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Top App Branding & Position/Sunset Header Bar */}
      <div className={`absolute ${layoutCfg.headerBar.positionClass} z-20 pointer-events-auto`}>
        <div className={`${layoutCfg.headerBar.bgOpacityClass} text-slate-900 p-2.5 px-3.5 rounded-2xl shadow-md flex items-center justify-between gap-3`}>
          {/* Left: Logo & App Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <MountainAppIcon size="sm" />
            <div>
              <div className="font-extrabold text-xs sm:text-sm tracking-wider text-slate-900 flex items-center gap-1.5">
                <span>ALPIN MAP</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              {layoutCfg.headerBar.showSubtitle && (
                <div className="text-[10px] text-slate-600 font-semibold hidden sm:block">Outdoor & Berg-GPS</div>
              )}
            </div>
          </div>

          {/* Right: Current Position Elevation & Time to Sunset */}
          {(() => {
            const activeLat = navStatus.currentPosition?.lat || currentCenterLat;
            const activeLng = navStatus.currentPosition?.lng || currentCenterLng;
            const activeEle = userElevation !== null ? userElevation : (navStatus.currentPosition?.ele || centerElevation);
            const sunset = getSunsetInfo(activeLat, activeLng);

            return (
              <div className="flex flex-col items-end text-right justify-center shrink-0 min-w-[130px]">
                {/* Top Row: Current Position Elevation */}
                <div className="flex items-center justify-end gap-1 text-xs font-bold text-slate-900 text-right whitespace-nowrap">
                  <span>
                    {activeEle !== null ? `${activeEle} m ü. NHN` : 'Höhe wird ermittelt...'}
                  </span>
                  <Mountain className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-0.5" />
                </div>
                {/* Bottom Row: Time to Sunset (Shortened & Right Aligned) */}
                <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-slate-700 mt-0.5 text-right whitespace-nowrap">
                  <span>
                    SU: {sunset.timeStr} <span className="text-amber-700 font-bold">({sunset.relativeStr})</span>
                  </span>
                  <Sunset className="w-3 h-3 text-amber-500 shrink-0 ml-0.5" />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Crosshair Center Reticle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-25">
        <Crosshair className="w-7 h-7 text-slate-700" />
      </div>

      {/* Active Tour & GPX Cumulative Elevation Gain & Profile Panel */}
      {tour && showTourElevationPanel && (
        <div className={`absolute ${layoutCfg.tourElevationPanel.positionClass} z-20 pointer-events-auto ${layoutCfg.tourElevationPanel.maxWidthClass} animate-in slide-in-from-bottom-4 duration-300`}>
          <div className="bg-slate-950/95 backdrop-blur-2xl text-white border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Tour Title & Cumulative Elevation Stats Header */}
            <div className="p-2.5 px-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
                  <Mountain className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-white truncate">
                    {tour.title}
                  </div>
                  {/* Cumulative Height Gain (Anstieg gesamt) & Tour Metrics */}
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-300 mt-0.5 flex-wrap">
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span>Anstieg gesamt: +{tour.ascentM}m</span>
                    </span>
                    <span className="text-blue-300 flex items-center gap-1 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                      <TrendingDown className="w-3 h-3 text-blue-400" />
                      <span>-{tour.descentM}m</span>
                    </span>
                    <span className="text-slate-300 font-semibold">{tour.distanceKm} km</span>
                    {tour.estimatedHours ? (
                      <span className="text-slate-400 font-normal">({tour.estimatedHours}h)</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  onClick={() => setIsElevationPanelExpanded(!isElevationPanelExpanded)}
                  className="p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-xs flex items-center gap-1 font-semibold cursor-pointer border border-slate-700"
                  title={isElevationPanelExpanded ? 'Höhenprofil einklappen' : 'Höhenprofil ausklappen'}
                >
                  {isElevationPanelExpanded ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Einklappen</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Profil</span>
                    </>
                  )}
                </button>

                {onOpenElevationModal && (
                  <button
                    onClick={onOpenElevationModal}
                    className="p-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-xs flex items-center gap-1 font-semibold cursor-pointer shadow-sm"
                    title="Großes Höhenprofil öffnen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Vollbild</span>
                  </button>
                )}

                <button
                  onClick={() => setShowTourElevationPanel(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
                  title="Höhenprofil-Panel schließen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expandable Mini Elevation Chart */}
            {isElevationPanelExpanded && (
              <div className="p-2 sm:p-3 bg-slate-950/90 max-h-52 overflow-y-auto">
                <ElevationProfile
                  tour={tour}
                  hoverCoordinate={hoverCoordinate}
                  onHoverCoordinate={onHoverCoordinate}
                  onClickCoordinate={(coord) => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([coord.lat, coord.lng], 15, { animate: true, duration: 1 });
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Re-open Tour Elevation Panel Button when closed */}
      {tour && !showTourElevationPanel && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
          <button
            onClick={() => {
              setShowTourElevationPanel(true);
              setIsElevationPanelExpanded(true);
            }}
            className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/90 px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs hover:bg-slate-800 transition-all cursor-pointer"
            title="Höhenprofil & Anstieg gesamt anzeigen"
          >
            <Mountain className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold truncate max-w-[120px] sm:max-w-[180px]">{tour.title}</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[10px] font-bold">
              +{tour.ascentM}m Anstieg
            </span>
          </button>
        </div>
      )}

      {/* Bottom-Left Map Coordinates & Elevation HUD (Toggleable) */}
      {showCenterHud && (
        <div className={`absolute ${tour && showTourElevationPanel ? 'bottom-28 sm:bottom-36' : layoutCfg.centerHud.positionClass} z-20 pointer-events-auto transition-all duration-200`}>
          <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Mountain className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{centerElevation !== null ? `${centerElevation} m ü. NHN` : 'Höhenmessung...'}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700" />
            <div className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{currentCenterLat.toFixed(4)}°N, {currentCenterLng.toFixed(4)}°E</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Icons Stack (Position & Sizing defined by Device Layout Config: Telefon, Tablet, PC) */}
      <div className={`absolute ${layoutCfg.actionButtonsStack.positionClass} z-20 flex ${layoutCfg.actionButtonsStack.flexDirection || 'flex-col'} items-center ${layoutCfg.actionButtonsStack.gapClass || 'gap-2.5'}`}>
        {/* 1. Mein Standort (GPS / Wi-Fi) */}
        <button
          onClick={handleCenterUserLocation}
          className={`${layoutCfg.actionButtonsStack.buttonSizeClass || 'w-11 h-11'} rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-90`}
          title="Mein Standort (Pos / GPS)"
        >
          <LocateFixed className="w-5 h-5 text-emerald-700" />
        </button>

        {/* 2. Toggle Button for Map Center Coordinates & Elevation HUD */}
        <button
          onClick={() => setShowCenterHud(!showCenterHud)}
          className={`${layoutCfg.actionButtonsStack.buttonSizeClass || 'w-11 h-11'} rounded-full backdrop-blur-md shadow-md border flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
            showCenterHud
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-white/80 hover:bg-white text-slate-800 border-slate-200/80'
          }`}
          title={showCenterHud ? 'Kartenmittelpunkt-Info ausblenden' : 'Kartenmittelpunkt-Info einblenden'}
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* 3. Map Layer & Device Layout Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`${layoutCfg.actionButtonsStack.buttonSizeClass || 'w-11 h-11'} rounded-full backdrop-blur-md shadow-md border flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
              showLayerMenu
                ? 'bg-white text-emerald-700 border-slate-300 ring-2 ring-emerald-500/50'
                : 'bg-white/80 hover:bg-white text-slate-800 border-slate-200/80'
            }`}
            title="Kartenansicht & Gerätelayout wählen"
          >
            <Layers className="w-5 h-5 text-slate-800" />
          </button>

          {/* Map Layer Popover Menu */}
          {showLayerMenu && (
            <div className={`absolute ${layoutCfg.actionButtonsStack.popoverPositionClass || 'right-14 bottom-0 w-72'} bg-white/95 backdrop-blur-2xl text-slate-900 rounded-2xl shadow-xl border border-slate-200/90 p-3.5 space-y-3 z-30 animate-in fade-in zoom-in-95 duration-150`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kartenansicht</span>
                <button
                  onClick={() => setShowLayerMenu(false)}
                  className="text-slate-400 hover:text-slate-800 text-xs font-bold px-1.5 py-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Base Map Options */}
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {MAP_LAYERS.filter((l) => l.category === 'base').map((layer) => {
                  const isActive = activeBaseLayerId === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => {
                        if (onSelectBaseLayer) onSelectBaseLayer(layer.id);
                        setShowLayerMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{layer.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal line-clamp-1">{layer.description}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Hiking Overlay Toggle */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                {onToggleHikingOverlay && (
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <span>Wanderwege-Overlay</span>
                    <input
                      type="checkbox"
                      checked={showOverlayHiking}
                      onChange={onToggleHikingOverlay}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
                    />
                  </label>
                )}

                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Schutzhütten & Berggipfel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showAlpinePOIs}
                    onChange={(e) => setShowAlpinePOIs(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
                  />
                </label>
              </div>

              {/* Device Layout Version Switcher (Telefon, Tablet, PC, Auto) */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Geräte-Layout</span>
                  <span className="text-emerald-700 font-extrabold capitalize">({layoutCfg.name})</span>
                </div>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                  <button
                    onClick={() => setDeviceMode('auto')}
                    className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      deviceMode === 'auto' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Automatische Geräte-Erkennung"
                  >
                    <span>Auto</span>
                  </button>
                  <button
                    onClick={() => setDeviceMode('phone')}
                    className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      deviceMode === 'phone' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Layout für Telefon (Mobile)"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Telefon</span>
                  </button>
                  <button
                    onClick={() => setDeviceMode('tablet')}
                    className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      deviceMode === 'tablet' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Layout für Tablet"
                  >
                    <Tablet className="w-3 h-3" />
                    <span>Tablet</span>
                  </button>
                  <button
                    onClick={() => setDeviceMode('pc')}
                    className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      deviceMode === 'pc' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Layout für PC / Desktop"
                  >
                    <Monitor className="w-3 h-3" />
                    <span>PC</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Einstellungen & Hauptmenü (Zahnrad-Symbol) */}
        {onOpenSettingsModal && (
          <button
            onClick={onOpenSettingsModal}
            className={`${layoutCfg.actionButtonsStack.buttonSizeClass || 'w-11 h-11'} rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-90`}
            title="Menü & Einstellungen (Zahnrad)"
          >
            <Settings className="w-5 h-5 text-slate-800" />
          </button>
        )}

        {/* 5. Zoom In (+) - Round Button */}
        <button
          onClick={handleZoomIn}
          className={`${layoutCfg.actionButtonsStack.buttonSizeClass || 'w-11 h-11'} rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-90 font-bold`}
          title="Hineinzoomen (+)"
        >
          <Plus className="w-5 h-5 text-slate-800" />
        </button>

        {/* 6. Zoom Out (-) - Round Button */}
        <button
          onClick={handleZoomOut}
          className={`${layoutCfg.actionButtonsStack.buttonSizeClass || 'w-11 h-11'} rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-90 font-bold`}
          title="Herauszoomen (-)"
        >
          <Minus className="w-5 h-5 text-slate-800" />
        </button>
      </div>

      {/* Drawing Mode Hint */}
      {isDrawMode && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-slate-900/80 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-400/50 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>Klicken Sie auf die Karte, um Routenpunkte zu setzen</span>
        </div>
      )}

      {/* POI Details Modal with Gemini & Google Maps Info */}
      {selectedPOI && (
        <POIDetailsModal
          poi={selectedPOI}
          onClose={() => setSelectedPOI(null)}
          onCenterOnMap={(lat, lng) => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1 });
            }
          }}
        />
      )}
    </div>
  );
};
