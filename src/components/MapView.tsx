import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from '../lib/leafletGlobal';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import type { AlpinePOI, Coordinate, MapLayerConfig, Tour, Waypoint } from '../types';
import { ALPINE_POIS } from '../data/alpinePOIs';
import { HIKING_OVERLAY } from '../data/mapLayers';
import { getTileFromCache, saveTileToCache } from '../services/offlineStorage';
import { fetchOverpassPOIs } from '../services/overpassPoiService';
import { CATEGORIES } from '../lib/categories';
import { distance, escapeHtml } from '../lib/geo';

const BLANK_TILE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

type CachedLayerOptions = L.TileLayerOptions & { offlineOnly?: boolean };

/** TileLayer that serves tiles from IndexedDB first and caches every tile it fetches. */
const OfflineCachedTileLayer = L.TileLayer.extend({
  createTile(this: L.TileLayer & { options: CachedLayerOptions; _tileOnLoad: unknown; _tileOnError: unknown }, coords: L.Coords, done: L.DoneCallback) {
    const tile = document.createElement('img');
    L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad as () => void, this, done, tile));
    L.DomEvent.on(tile, 'error', L.Util.bind(this._tileOnError as () => void, this, done, tile));
    tile.alt = '';
    tile.setAttribute('role', 'presentation');
    tile.decoding = 'async';

    const url = this.getTileUrl(coords);
    const offlineOnly = !!this.options.offlineOnly;
    const useBlob = (blob: Blob) => {
      const objectUrl = URL.createObjectURL(blob);
      const revoke = () => URL.revokeObjectURL(objectUrl);
      tile.addEventListener('load', revoke, { once: true });
      tile.addEventListener('error', revoke, { once: true });
      tile.src = objectUrl;
    };

    getTileFromCache(url).then((cached) => {
      if (cached) return useBlob(cached);
      if (offlineOnly || !navigator.onLine) {
        tile.src = BLANK_TILE;
        return;
      }
      fetch(url, { mode: 'cors' })
        .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
        .then((blob) => {
          useBlob(blob);
          saveTileToCache(url, blob);
        })
        .catch(() => {
          // CORS-less tile servers: fall back to a plain image request (not cached)
          tile.src = url;
        });
    });
    return tile;
  },
}) as unknown as new (url: string, options: CachedLayerOptions) => L.TileLayer;

/**
 * Leaflet options for a layer's native zoom range. On retina screens with `sharp` on, layers
 * without own @2x tiles get the next zoom level rendered at half size (like `detectRetina`,
 * but keeping maxNativeZoom correct so we never request zooms the server doesn't have).
 */
function tileZoomOptions(layer: Pick<MapLayerConfig, 'maxZoom' | 'maxNativeZoom' | 'hiDpi'>, sharp: boolean): L.TileLayerOptions {
  const maxNativeZoom = layer.maxNativeZoom ?? Math.min(layer.maxZoom, 18);
  if (!sharp || layer.hiDpi || !L.Browser.retina) return { maxNativeZoom };
  return { tileSize: 128, zoomOffset: 1, maxNativeZoom: maxNativeZoom - 1 };
}

function poiIcon(poi: AlpinePOI) {
  const isPeak = poi.type === 'peak';
  const color = isPeak ? '#f59e0b' : poi.type === 'refugio' ? '#fb923c' : '#10b981';
  const svg = isPeak ? CATEGORIES.peak.svg : CATEGORIES.hut.svg;
  return L.divIcon({
    className: 'am-marker',
    html: `<div class="am-pop-in" style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(2,6,23,.82);border:2px solid ${color};box-shadow:0 4px 14px rgba(0,0,0,.45);backdrop-filter:blur(6px)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** Cluster bubble: count + ring in the colour of the dominant POI type. */
function poiClusterIcon(cluster: L.MarkerCluster) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  const peaks = markers.filter((m) => (m.options as { poiType?: string }).poiType === 'peak').length;
  const color = peaks >= count / 2 ? '#f59e0b' : '#10b981';
  const size = count < 10 ? 34 : count < 50 ? 40 : 46;
  return L.divIcon({
    className: 'am-marker',
    html: `<div class="am-pop-in" style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;background:rgba(2,6,23,.85);border:2.5px solid ${color};box-shadow:0 0 0 4px ${color}33,0 4px 14px rgba(0,0,0,.45);backdrop-filter:blur(6px);color:#f8fafc;font:700 ${count < 100 ? 13 : 12}px/1 -apple-system,system-ui,sans-serif">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function waypointIcon(wp: Waypoint, personal = false) {
  const meta = CATEGORIES[wp.category] ?? CATEGORIES.info;
  return L.divIcon({
    className: 'am-marker',
    html: `<div class="am-pop-in" style="position:relative;width:34px;height:42px">
      <svg width="34" height="42" viewBox="0 0 34 42" style="position:absolute;inset:0;filter:drop-shadow(0 4px 8px rgba(0,0,0,.45))"><path d="M17 41s14-12.6 14-24A14 14 0 0 0 3 17c0 11.4 14 24 14 24z" fill="${meta.color}" stroke="${personal ? '#fff' : 'rgba(255,255,255,.85)'}" stroke-width="2.5"/></svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#020617" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:9px;top:9px">${meta.svg}</svg>
    </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 41],
    popupAnchor: [0, -38],
  });
}

function endpointIcon(kind: 'start' | 'end') {
  const color = kind === 'start' ? '#10b981' : '#f43f5e';
  const label = kind === 'start' ? 'S' : 'Z';
  return L.divIcon({
    className: 'am-marker',
    html: `<div class="am-pop-in" style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid #fff;display:grid;place-items:center;color:#fff;font:700 11px/1 -apple-system,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.45)">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function userIcon() {
  return L.divIcon({
    className: 'am-marker',
    html: '<div class="am-user"><div class="pulse"></div><div class="cone"></div><div class="dot"></div></div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function popupHtml(title: string, lines: string[]) {
  return `<div style="min-width:140px"><div style="font-weight:600;font-size:14px;color:#fff">${escapeHtml(title)}</div>${lines
    .filter(Boolean)
    .map((l) => `<div style="color:#94a3b8;font-size:12px;margin-top:2px">${l}</div>`)
    .join('')}</div>`;
}

export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  fitTour: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getCenter: () => Coordinate;
  getZoom: () => number;
}

export interface MapViewProps {
  tour: Tour | null;
  baseLayer: MapLayerConfig;
  showHikingOverlay: boolean;
  offlineOnly: boolean;
  sharpTiles: boolean;
  showPOIs: boolean;
  userPosition: Coordinate | null;
  userAccuracy: number | null;
  heading: number | null;
  follow: boolean;
  navActive: boolean;
  recordedTrack: Coordinate[];
  userWaypoints: Waypoint[];
  hoverCoordinate: Coordinate | null;
  drawPoints: Coordinate[];
  isDrawMode: boolean;
  /** extra bottom padding (px) for fitBounds, e.g. the height of the tour card */
  bottomInset: number;
  initialView: { lat: number; lng: number; zoom: number };
  onMapClick: (c: Coordinate) => void;
  onViewChange: (center: Coordinate, zoom: number) => void;
  onUserPan: () => void;
  onSelectPOI: (poi: AlpinePOI) => void;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const layers = useRef({
    base: null as L.Layer | null,
    baseSeq: 0,
    overlay: null as L.TileLayer | null,
    tour: L.layerGroup(),
    recorded: L.layerGroup(),
    pois: L.markerClusterGroup({
      // group nearby POIs; split up while zooming in, all single from zoom 15
      maxClusterRadius: (zoom: number) => (zoom < 12 ? 80 : 55),
      disableClusteringAtZoom: 15,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      chunkedLoading: true,
      iconCreateFunction: poiClusterIcon,
    }),
    userWps: L.layerGroup(),
    draw: L.layerGroup(),
    hover: null as L.CircleMarker | null,
    user: null as L.Marker | null,
    accuracy: null as L.Circle | null,
    tourBounds: null as L.LatLngBounds | null,
  });

  const padding = () => {
    const top = 90 + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0);
    return { paddingTopLeft: L.point(24, top), paddingBottomRight: L.point(72, 110 + propsRef.current.bottomInset) };
  };

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom) => mapRef.current?.flyTo([lat, lng], zoom ?? Math.max(mapRef.current.getZoom(), 15), { duration: 1.1 }),
    fitTour: () => {
      const b = layers.current.tourBounds;
      if (b?.isValid()) mapRef.current?.flyToBounds(b, { ...padding(), duration: 1.1, maxZoom: 16 });
    },
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    getCenter: () => {
      const c = mapRef.current?.getCenter();
      return c ? { lat: c.lat, lng: c.lng } : { lat: propsRef.current.initialView.lat, lng: propsRef.current.initialView.lng };
    },
    getZoom: () => mapRef.current?.getZoom() ?? propsRef.current.initialView.zoom,
  }));

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const { lat, lng, zoom } = propsRef.current.initialView;
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: false,
      // initial bounds (needed by the marker cluster); the base layer effect sets the real range
      minZoom: 2,
      maxZoom: 20,
      attributionControl: true,
      preferCanvas: false,
      // whole zoom levels only – fractional zooms stretch raster tiles and make them blurry
      zoomSnap: 1,
      wheelPxPerZoomLevel: 90,
      tapTolerance: 20,
      maxBoundsViscosity: 1,
    });
    map.attributionControl.setPrefix(false);
    mapRef.current = map;
    const l = layers.current;
    [l.tour, l.recorded, l.pois, l.userWps, l.draw].forEach((g) => g.addTo(map));

    map.on('click', (e: L.LeafletMouseEvent) => propsRef.current.onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.on('dragstart', () => propsRef.current.onUserPan());
    map.on('moveend', () => {
      const c = map.getCenter();
      propsRef.current.onViewChange({ lat: c.lat, lng: c.lng }, map.getZoom());
    });
    const c = map.getCenter();
    propsRef.current.onViewChange({ lat: c.lat, lng: c.lng }, map.getZoom());

    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Base layer + overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const l = layers.current;
    const { baseLayer, offlineOnly, sharpTiles } = props;
    l.base?.remove();
    l.base = null;
    const seq = ++l.baseSeq;
    map.setMinZoom(baseLayer.minZoom);
    map.setMaxZoom(baseLayer.maxZoom);
    containerRef.current?.classList.toggle('am-dark-map', !!baseLayer.dark);

    if (baseLayer.kind === 'vector') {
      import('../services/vectorTopo')
        .then(({ createVectorLayer, setVectorOfflineOnly }) => {
          setVectorOfflineOnly(offlineOnly);
          return createVectorLayer(map, baseLayer.url, baseLayer.attribution);
        })
        .then((layer) => {
          if (seq !== l.baseSeq || mapRef.current !== map) return; // layer switched meanwhile
          l.base = layer;
          layer.addTo(map);
        })
        .catch((e) => console.warn('Vektorkarte konnte nicht geladen werden', e));
      return;
    }

    const tiles = new OfflineCachedTileLayer(baseLayer.url, {
      attribution: baseLayer.attribution,
      maxZoom: baseLayer.maxZoom,
      ...tileZoomOptions(baseLayer, sharpTiles),
      minZoom: baseLayer.minZoom,
      subdomains: baseLayer.subdomains?.length ? baseLayer.subdomains : 'abc',
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: false,
      offlineOnly,
      errorTileUrl: BLANK_TILE,
    });
    tiles.addTo(map);
    tiles.bringToBack();
    l.base = tiles;
  }, [props.baseLayer, props.offlineOnly, props.sharpTiles]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const l = layers.current;
    l.overlay?.remove();
    l.overlay = null;
    if (props.showHikingOverlay) {
      l.overlay = new OfflineCachedTileLayer(HIKING_OVERLAY.url, {
        attribution: HIKING_OVERLAY.attribution,
        maxZoom: 20,
        ...tileZoomOptions(HIKING_OVERLAY, props.sharpTiles),
        opacity: 0.85,
        offlineOnly: props.offlineOnly,
        errorTileUrl: BLANK_TILE,
        zIndex: 5,
      });
      l.overlay.addTo(map);
    }
  }, [props.showHikingOverlay, props.offlineOnly, props.sharpTiles]);

  // Tour line with animated drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const l = layers.current;
    l.tour.clearLayers();
    l.tourBounds = null;
    const tour = props.tour;
    if (!tour) return;

    const latLngs = tour.coordinates.map((c) => [c.lat, c.lng] as [number, number]);
    if (latLngs.length > 1) {
      L.polyline(latLngs, { color: '#34d399', weight: 12, opacity: 0.55, className: 'am-route-glow', interactive: false }).addTo(l.tour);
      L.polyline(latLngs, { color: '#022c22', weight: 7.5, opacity: 0.6, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(l.tour);
      const main = L.polyline(latLngs, { color: '#10b981', weight: 5, lineCap: 'round', lineJoin: 'round', className: 'am-route', interactive: false }).addTo(l.tour);
      L.polyline(latLngs, { color: '#ecfdf5', weight: 2, lineCap: 'round', className: 'am-route-flow', interactive: false }).addTo(l.tour);
      L.marker(latLngs[0], { icon: endpointIcon('start'), interactive: false }).addTo(l.tour);
      const last = latLngs[latLngs.length - 1];
      if (distance(tour.coordinates[0], tour.coordinates[tour.coordinates.length - 1]) > 40) {
        L.marker(last, { icon: endpointIcon('end'), interactive: false }).addTo(l.tour);
      }
      l.tourBounds = main.getBounds();
      requestAnimationFrame(() => {
        const path = main.getElement() as SVGPathElement | undefined;
        if (path?.getTotalLength) path.style.setProperty('--route-len', String(Math.ceil(path.getTotalLength())));
      });
    } else if (latLngs.length === 1) {
      l.tourBounds = L.latLngBounds(latLngs[0], latLngs[0]);
    }

    tour.waypoints.forEach((wp) => {
      L.marker([wp.lat, wp.lng], { icon: waypointIcon(wp), zIndexOffset: 400 })
        .bindPopup(popupHtml(wp.name, [wp.ele ? `${Math.round(wp.ele)} m` : '', escapeHtml(wp.description ?? '')]), { className: 'am-popup' })
        .addTo(l.tour);
    });

    if (l.tourBounds?.isValid() && !propsRef.current.navActive) {
      map.flyToBounds(l.tourBounds, { ...padding(), duration: 1.2, maxZoom: 15 });
    }
  }, [props.tour]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recorded track
  useEffect(() => {
    const l = layers.current;
    l.recorded.clearLayers();
    if (props.recordedTrack.length > 1) {
      L.polyline(
        props.recordedTrack.map((c) => [c.lat, c.lng] as [number, number]),
        { color: '#f43f5e', weight: 4, opacity: 0.95, dashArray: '1 8', lineCap: 'round', interactive: false },
      ).addTo(l.recorded);
    }
  }, [props.recordedTrack]);

  // Personal waypoints
  useEffect(() => {
    const l = layers.current;
    l.userWps.clearLayers();
    props.userWaypoints.forEach((wp) =>
      L.marker([wp.lat, wp.lng], { icon: waypointIcon(wp, true), zIndexOffset: 600 })
        .bindPopup(popupHtml(wp.name, [`${CATEGORIES[wp.category].label}${wp.ele ? ` · ${wp.ele} m` : ''}`, escapeHtml(wp.description ?? '')]), {
          className: 'am-popup',
        })
        .addTo(l.userWps),
    );
  }, [props.userWaypoints]);

  // Draw mode preview
  useEffect(() => {
    const l = layers.current;
    l.draw.clearLayers();
    const pts = props.drawPoints.map((c) => [c.lat, c.lng] as [number, number]);
    if (pts.length > 1) L.polyline(pts, { color: '#fbbf24', weight: 4, dashArray: '8 8', lineCap: 'round', interactive: false }).addTo(l.draw);
    pts.forEach((p, i) =>
      L.circleMarker(p, {
        radius: i === pts.length - 1 ? 7 : 5,
        color: '#fff',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 1,
        interactive: false,
      }).addTo(l.draw),
    );
    mapRef.current?.getContainer().classList.toggle('cursor-crosshair', props.isDrawMode);
  }, [props.drawPoints, props.isDrawMode]);

  // Hover marker (elevation profile ↔ map)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const l = layers.current;
    const c = props.hoverCoordinate;
    if (!c) {
      l.hover?.remove();
      l.hover = null;
      return;
    }
    if (!l.hover) {
      l.hover = L.circleMarker([c.lat, c.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#f59e0b', fillOpacity: 1, interactive: false }).addTo(map);
    } else l.hover.setLatLng([c.lat, c.lng]);
  }, [props.hoverCoordinate]);

  // User position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const l = layers.current;
    const pos = props.userPosition;
    if (!pos) {
      l.user?.remove();
      l.accuracy?.remove();
      l.user = null;
      l.accuracy = null;
      return;
    }
    const ll: [number, number] = [pos.lat, pos.lng];
    if (!l.user) {
      l.user = L.marker(ll, { icon: userIcon(), zIndexOffset: 1000, interactive: false }).addTo(map);
    } else l.user.setLatLng(ll);
    const cone = l.user.getElement()?.querySelector<HTMLElement>('.cone');
    if (cone) {
      cone.style.display = props.heading === null ? 'none' : 'block';
      cone.style.transform = `rotate(${props.heading ?? 0}deg)`;
    }
    if (props.userAccuracy && props.userAccuracy > 8) {
      if (!l.accuracy)
        l.accuracy = L.circle(ll, { radius: props.userAccuracy, color: '#10b981', weight: 1, opacity: 0.4, fillOpacity: 0.08, interactive: false }).addTo(map);
      else l.accuracy.setLatLng(ll).setRadius(props.userAccuracy);
    } else {
      l.accuracy?.remove();
      l.accuracy = null;
    }
    if (props.follow) map.panTo(ll, { animate: true, duration: 0.6 });
  }, [props.userPosition, props.heading, props.userAccuracy, props.follow]);

  // Alpine POIs (bundled + live OpenStreetMap)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const l = layers.current;
    l.pois.clearLayers();
    if (!props.showPOIs) return;

    // skip duplicates (bundled + OSM) within 250 m, using a ~500 m grid instead of comparing all markers
    const grid = new Map<string, AlpinePOI[]>();
    const cell = (lat: number, lng: number) => `${Math.floor(lat / 0.005)}:${Math.floor(lng / 0.007)}`;
    const isDuplicate = (poi: AlpinePOI) => {
      const cy = Math.floor(poi.lat / 0.005);
      const cx = Math.floor(poi.lng / 0.007);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) for (const o of grid.get(`${cy + dy}:${cx + dx}`) ?? []) if (o.id === poi.id || distance(o, poi) < 250) return true;
      return false;
    };
    const build = (poi: AlpinePOI) => {
      if (isDuplicate(poi)) return null;
      const k = cell(poi.lat, poi.lng);
      grid.set(k, [...(grid.get(k) ?? []), poi]);
      return L.marker([poi.lat, poi.lng], { icon: poiIcon(poi), zIndexOffset: 200, title: poi.name, poiType: poi.type } as L.MarkerOptions)
        .bindTooltip(
          `<div style="font-weight:600;font-size:12px">${escapeHtml(poi.name)}</div><div style="font-size:11px;color:${poi.type === 'peak' ? '#fbbf24' : '#34d399'}">${poi.ele ? `${poi.ele} m · ` : ''}${escapeHtml(poi.categoryLabel)}</div>`,
          { direction: 'top', offset: [0, -16], className: 'am-tooltip' },
        )
        .on('click', () => propsRef.current.onSelectPOI(poi));
    };
    const addAll = (pois: AlpinePOI[]) => {
      const batch = pois.map(build).filter((m): m is L.Marker => m !== null);
      if (batch.length) l.pois.addLayers(batch);
    };
    addAll(ALPINE_POIS);

    let timer: number | undefined;
    let controller: AbortController | null = null;
    const load = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        if (!navigator.onLine) return;
        controller?.abort();
        controller = new AbortController();
        const b = map.getBounds();
        try {
          const live = await fetchOverpassPOIs(b.getSouth(), b.getWest(), b.getNorth(), b.getEast(), map.getZoom(), controller.signal);
          addAll(live);
        } catch {
          /* aborted / offline */
        }
      }, 700);
    };
    load();
    map.on('moveend', load);
    return () => {
      window.clearTimeout(timer);
      controller?.abort();
      map.off('moveend', load);
    };
  }, [props.showPOIs]);

  return <div ref={containerRef} className="absolute inset-0 z-0" aria-label="Karte" />;
});
