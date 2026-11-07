import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { DownloadCloud, Map as MapIcon, MapPin, Navigation, SlidersHorizontal } from 'lucide-react';

import type { AlpinePOI, Coordinate, Tour, Waypoint } from './types';
import { SAMPLE_TOURS } from './data/sampleRoutes';
import { DEFAULT_LAYER_ID, findLayer, getBaseLayers } from './data/mapLayers';
import { useStored, readStored, writeStored } from './lib/storage';
import { useSettings } from './lib/settings';
import { computeTrackStats, estimateHours, uid } from './lib/geo';
import { haptic } from './lib/haptics';
import { useGeolocation } from './hooks/useGeolocation';
import { useCompass } from './hooks/useCompass';
import { useNavigation } from './hooks/useNavigation';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useWakeLock } from './hooks/useWakeLock';
import { useMediaQuery } from './hooks/useMediaQuery';
import { getElevationForCoords, getElevationsForBatch } from './services/elevationService';

import { MapView, type MapViewHandle } from './components/MapView';
import { TopBar } from './components/TopBar';
import { MapControls, type LocateState } from './components/MapControls';
import { Dock, type MenuTab } from './components/Dock';
import { TourCard } from './components/TourCard';
import { NavBanner, NavPanel } from './components/NavHud';
import { DrawHud } from './components/DrawHud';
import { CenterHud } from './components/CenterHud';
import { SplashScreen } from './components/SplashScreen';
import { Sheet } from './components/ui/Sheet';
import { SegmentedTabs } from './components/ui/controls';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ToursPanel } from './components/panels/ToursPanel';
import { NavigationPanel } from './components/panels/NavigationPanel';
import { PlacesPanel } from './components/panels/PlacesPanel';
import { OfflinePanel } from './components/panels/OfflinePanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { LayersSheet } from './components/sheets/LayersSheet';
import { ElevationSheet } from './components/sheets/ElevationSheet';
import { POISheet } from './components/sheets/POISheet';
import { SosSheet } from './components/sheets/SosSheet';
import { PrivacySheet } from './components/sheets/PrivacySheet';
import { InstallSheet } from './components/sheets/InstallSheet';

type SheetId = 'layers' | 'elevation' | 'sos' | 'privacy' | 'install';

const MENU: Record<MenuTab, { title: string; subtitle: string; icon: ReactNode }> = {
  tours: { title: 'Touren', subtitle: 'Vorschläge, GPX-Import & eigene Routen', icon: <MapIcon className="h-5 w-5" /> },
  nav: { title: 'Navigation', subtitle: 'GPS-Führung, Aufzeichnung & Notfall', icon: <Navigation className="h-5 w-5" /> },
  places: { title: 'Orte', subtitle: 'Eigene Wegpunkte speichern', icon: <MapPin className="h-5 w-5" /> },
  offline: { title: 'Offline-Karten', subtitle: 'Gebiete für unterwegs speichern', icon: <DownloadCloud className="h-5 w-5" /> },
  settings: { title: 'Mehr', subtitle: 'API-Schlüssel, Bedienung & App', icon: <SlidersHorizontal className="h-5 w-5" /> },
};

const DEFAULT_VIEW = { lat: 44.085, lng: 10.25, zoom: 10 };

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AlpinMap />
      </ToastProvider>
    </MotionConfig>
  );
}

function AlpinMap() {
  const toast = useToast();
  const [settings] = useSettings();
  const online = useOnlineStatus();
  const isStandalone = useMediaQuery('(display-mode: standalone)') || (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const [splash, setSplash] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setSplash(false), 1700);
    return () => window.clearTimeout(t);
  }, []);

  // ---------- persisted data ----------
  const [customTours, setCustomTours] = useStored<Tour[]>('customTours', []);
  const [places, setPlaces] = useStored<Waypoint[]>('places', []);
  const [selectedTourId, setSelectedTourId] = useStored<string | null>('selectedTourId', null);
  const [baseLayerId, setBaseLayerId] = useStored('baseLayer', DEFAULT_LAYER_ID);
  const [hikingOverlay, setHikingOverlay] = useStored('hikingOverlay', true);
  const [sacTrails, setSacTrails] = useStored('sacTrails', true);
  const [showPOIs, setShowPOIs] = useStored('showPOIs', true);
  const [offlineMode, setOfflineMode] = useStored('offlineMode', false);
  const [locationEnabled, setLocationEnabled] = useStored('locationEnabled', false);
  const initialView = useMemo(() => readStored('lastView', DEFAULT_VIEW), []);

  const allTours = useMemo(() => [...customTours, ...SAMPLE_TOURS], [customTours]);
  const selectedTour = useMemo(() => allTours.find((t) => t.id === selectedTourId) ?? null, [allTours, selectedTourId]);

  const baseLayers = useMemo(() => getBaseLayers(settings.mapboxToken), [settings.mapboxToken]);
  const baseLayer = useMemo(() => findLayer(baseLayerId, settings.mapboxToken), [baseLayerId, settings.mapboxToken]);

  // ---------- UI state ----------
  const [menuTab, setMenuTab] = useState<MenuTab | null>(null);
  const [lastTab, setLastTab] = useState<MenuTab>('tours');
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<AlpinePOI | null>(null);
  const [hoverCoordinate, setHoverCoordinate] = useState<Coordinate | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const [view, setView] = useState<{ center: Coordinate; zoom: number }>({ center: initialView, zoom: initialView.zoom });
  const [elevation, setElevation] = useState<{ value: number | null; label: string }>({ value: null, label: 'Kartenmitte' });
  const [locate, setLocate] = useState<LocateState>('off');
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Coordinate[]>([]);
  const [savingDraw, setSavingDraw] = useState(false);
  const mapRef = useRef<MapViewHandle>(null);
  const pendingCenterOnFix = useRef(false);

  // ---------- sensors & navigation ----------
  const { fix, error: gpsError } = useGeolocation(locationEnabled);
  const compass = useCompass();
  const navTour = selectedTour;
  const { nav, start, stop, togglePause, toggleRecording } = useNavigation(navTour, fix, compass.heading);
  const navActive = nav.mode !== 'idle';
  useWakeLock(navActive && settings.keepScreenAwake);

  // Center map on the first GPS fix after the user asked for it (or on launch)
  useEffect(() => {
    if (!fix) return;
    if (pendingCenterOnFix.current) {
      pendingCenterOnFix.current = false;
      mapRef.current?.flyTo(fix.lat, fix.lng, 15);
      setLocate((l) => (l === 'off' ? 'shown' : l));
    }
  }, [fix]);

  useEffect(() => {
    if (locationEnabled && !selectedTourId) pendingCenterOnFix.current = true;
    // only on launch
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gpsError && locate !== 'off') {
      toast(gpsError, 'error');
      setLocate('off');
    }
  }, [gpsError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Elevation readout: GPS position if known, else map centre (debounced)
  const elevationTarget = fix && locate !== 'off' ? { lat: fix.lat, lng: fix.lng, label: 'Standort' } : { ...view.center, label: 'Kartenmitte' };
  const elevKey = `${elevationTarget.lat.toFixed(3)},${elevationTarget.lng.toFixed(3)},${elevationTarget.label}`;
  useEffect(() => {
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      const v = await getElevationForCoords(elevationTarget.lat, elevationTarget.lng, controller.signal);
      if (!controller.signal.aborted) setElevation({ value: v, label: elevationTarget.label });
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [elevKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- PWA update ----------
  const swReg = useRef<ServiceWorkerRegistration | undefined>(undefined);
  useRegisterSW({
    onRegisteredSW(_url, reg) {
      swReg.current = reg;
      if (reg) window.setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
    onOfflineReady() {
      toast('App ist jetzt offline verfügbar');
    },
  });

  // ---------- actions ----------
  const openMenu = useCallback((tab: MenuTab) => {
    setLastTab(tab);
    setMenuTab(tab);
  }, []);

  const closeMenu = useCallback(() => setMenuTab(null), []);

  const selectTour = useCallback(
    (tour: Tour | null) => {
      if (navActive) {
        toast('Beende zuerst die laufende Navigation', 'info');
        return;
      }
      setSelectedTourId(tour?.id ?? null);
      setHoverCoordinate(null);
      if (tour) setMenuTab(null);
    },
    [navActive, setSelectedTourId, toast],
  );

  const handleLocate = () => {
    if (!locationEnabled) {
      setLocationEnabled(true);
      pendingCenterOnFix.current = true;
      return;
    }
    if (!fix) {
      pendingCenterOnFix.current = true;
      return;
    }
    if (locate === 'follow') {
      setLocate('shown');
    } else if (locate === 'shown') {
      setLocate('follow');
      mapRef.current?.flyTo(fix.lat, fix.lng, Math.max(mapRef.current.getZoom(), 15));
    } else {
      setLocate('shown');
      mapRef.current?.flyTo(fix.lat, fix.lng, Math.max(mapRef.current?.getZoom() ?? 15, 15));
    }
  };

  const startNavigation = async (mode: 'gps' | 'simulation', record: boolean) => {
    if (mode === 'gps') {
      if (!locationEnabled) setLocationEnabled(true);
      compass.request();
    }
    start(mode, record);
    setLocate(settings.autoFollow ? 'follow' : locationEnabled ? 'shown' : 'off');
    setMenuTab(null);
    haptic([10, 30, 10]);
    if (navTour && mode === 'simulation') mapRef.current?.flyTo(navTour.coordinates[0].lat, navTour.coordinates[0].lng, 15);
  };

  const stopNavigation = () => {
    const recorded = stop();
    if (recorded) {
      setCustomTours((prev) => [recorded, ...prev]);
      toast(`Track gespeichert: ${recorded.distanceKm.toLocaleString('de-DE')} km`);
    }
    if (locate === 'follow') setLocate('shown');
  };

  const startDraw = () => {
    if (navActive) return toast('Während der Navigation nicht möglich', 'info');
    setMenuTab(null);
    setSelectedTourId(null);
    setDrawPoints([]);
    setIsDrawMode(true);
  };

  const saveDraw = async () => {
    setSavingDraw(true);
    const eles = await getElevationsForBatch(drawPoints);
    const coords = drawPoints.map((p, i) => ({ ...p, ele: eles[i] ?? undefined }));
    const stats = computeTrackStats(coords);
    const tour: Tour = {
      id: uid('draw'),
      title: `Eigene Route ${new Date().toLocaleDateString('de-DE')}`,
      region: 'Eigene Route',
      difficulty: stats.ascentM > 1000 ? 'Schwer' : stats.ascentM > 400 || stats.distanceKm > 10 ? 'Mittel' : 'Einfach',
      distanceKm: stats.distanceKm,
      ascentM: stats.ascentM,
      descentM: stats.descentM,
      estimatedHours: estimateHours(stats.distanceKm, stats.ascentM, stats.descentM),
      coordinates: coords,
      waypoints: [],
      description: 'Auf der Karte gezeichnete Route (Luftlinie zwischen den Punkten).',
      isCustom: true,
      createdAt: new Date().toLocaleDateString('de-DE'),
    };
    setCustomTours((prev) => [tour, ...prev]);
    setSelectedTourId(tour.id);
    setIsDrawMode(false);
    setDrawPoints([]);
    setSavingDraw(false);
    toast(`Route gespeichert: ${tour.distanceKm.toLocaleString('de-DE')} km`);
  };

  const onMapClick = useCallback(
    (c: Coordinate) => {
      if (isDrawMode) {
        haptic(5);
        setDrawPoints((prev) => [...prev, c]);
      }
    },
    [isDrawMode],
  );

  const onSacError = useCallback(() => toast('Wegdaten (OpenStreetMap) gerade nicht erreichbar – gespeicherte Bereiche bleiben sichtbar', 'error'), [toast]);

  const onViewChange = useCallback((center: Coordinate, zoom: number) => {
    setView({ center, zoom });
    writeStored('lastView', { lat: center.lat, lng: center.lng, zoom });
  }, []);

  const onUserPan = useCallback(() => setLocate((l) => (l === 'follow' ? 'shown' : l)), []);

  // ---------- derived ----------
  const userPosition = navActive && nav.mode === 'simulation' ? nav.currentPosition : fix;
  const showUser = navActive || locate !== 'off';
  const heading = navActive ? nav.heading : compass.heading ?? fix?.heading ?? null;
  const sosPosition = fix ?? (nav.currentPosition || view.center);

  const menuContent = (tab: MenuTab) => {
    switch (tab) {
      case 'tours':
        return (
          <ToursPanel
            selectedId={selectedTourId}
            customTours={customTours}
            onSelect={selectTour}
            onImport={(t) => setCustomTours((prev) => [t, ...prev])}
            onDelete={(id) => {
              setCustomTours((prev) => prev.filter((t) => t.id !== id));
              if (selectedTourId === id) setSelectedTourId(null);
              toast('Tour gelöscht', 'info');
            }}
            onStartDraw={startDraw}
          />
        );
      case 'nav':
        return (
          <NavigationPanel
            tour={navTour}
            nav={nav}
            gpsError={gpsError}
            onStart={startNavigation}
            onPause={togglePause}
            onStop={stopNavigation}
            onToggleRecord={toggleRecording}
            onSos={() => setSheet('sos')}
            onOpenTours={() => openMenu('tours')}
          />
        );
      case 'places':
        return (
          <PlacesPanel
            tour={selectedTour}
            places={places}
            mapCenter={view.center}
            gpsPosition={fix}
            onAdd={(wp) => setPlaces((prev) => [wp, ...prev])}
            onDelete={(id) => setPlaces((prev) => prev.filter((p) => p.id !== id))}
            onFocus={(wp) => {
              setMenuTab(null);
              setLocate((l) => (l === 'follow' ? 'shown' : l));
              mapRef.current?.flyTo(wp.lat, wp.lng, 16);
            }}
          />
        );
      case 'offline':
        return (
          <OfflinePanel
            online={online}
            offlineMode={offlineMode}
            onOfflineModeChange={setOfflineMode}
            layers={baseLayers}
            activeLayerId={baseLayer.id}
            mapCenter={view.center}
            tour={selectedTour}
          />
        );
      case 'settings':
        return (
          <SettingsPanel
            isStandalone={isStandalone}
            onOpenInstall={() => setSheet('install')}
            onOpenPrivacy={() => setSheet('privacy')}
            onCheckUpdate={async () => {
              try {
                await swReg.current?.update();
                toast(swReg.current ? 'Update-Prüfung abgeschlossen – neue Versionen werden automatisch geladen' : 'Kein Service Worker aktiv', 'info');
              } catch {
                toast('Update-Prüfung fehlgeschlagen', 'error');
              }
            }}
          />
        );
    }
  };

  const bottomPanelVisible = isDrawMode ? 'draw' : navActive ? 'nav' : selectedTour ? 'tour' : null;

  return (
    <div className="app-height relative w-full overflow-hidden bg-slate-950">
      <MapView
        ref={mapRef}
        tour={selectedTour}
        baseLayer={baseLayer}
        showHikingOverlay={hikingOverlay}
        showSacTrails={sacTrails}
        offlineOnly={offlineMode || !online}
        sharpTiles={settings.sharpTiles}
        showPOIs={showPOIs}
        userPosition={showUser ? userPosition : null}
        userAccuracy={nav.mode === 'simulation' ? null : fix?.accuracy ?? null}
        heading={heading}
        follow={locate === 'follow'}
        navActive={navActive}
        recordedTrack={nav.recordedTrack}
        userWaypoints={places}
        hoverCoordinate={hoverCoordinate}
        drawPoints={drawPoints}
        isDrawMode={isDrawMode}
        bottomInset={panelHeight}
        initialView={initialView}
        onMapClick={onMapClick}
        onViewChange={onViewChange}
        onUserPan={onUserPan}
        onSelectPOI={setSelectedPOI}
        onSacError={onSacError}
      />

      {/* subtle vignette under status bar & dock for legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-slate-950/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-slate-950/60 to-transparent" />

      <AnimatePresence>{navActive ? <NavBanner key="nav" nav={nav} /> : null}</AnimatePresence>
      <TopBar
        hidden={navActive}
        lat={view.center.lat}
        lng={view.center.lng}
        elevation={elevation.value}
        elevationLabel={elevation.label}
        online={online}
        offlineMode={offlineMode}
        onOpenOffline={() => openMenu('offline')}
      />

      <AnimatePresence>
        {settings.showCenterHud && !navActive && <CenterHud key="hud" lat={view.center.lat} lng={view.center.lng} elevation={elevation.label === 'Kartenmitte' ? elevation.value : null} topOffset="calc(var(--safe-top) + 84px)" />}
      </AnimatePresence>

      <MapControls
        locate={locate}
        locating={locationEnabled && !fix && !gpsError}
        onLocate={handleLocate}
        onLayers={() => setSheet('layers')}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        bottomOffset={bottomPanelVisible ? panelHeight : 0}
      />

      <AnimatePresence mode="popLayout">
        {bottomPanelVisible === 'draw' && (
          <DrawHud
            key="draw"
            points={drawPoints}
            saving={savingDraw}
            onUndo={() => setDrawPoints((p) => p.slice(0, -1))}
            onCancel={() => {
              setIsDrawMode(false);
              setDrawPoints([]);
            }}
            onSave={saveDraw}
            onHeight={setPanelHeight}
          />
        )}
        {bottomPanelVisible === 'nav' && (
          <NavPanel key="nav" nav={nav} onPause={togglePause} onStop={stopNavigation} onToggleRecord={toggleRecording} onSos={() => setSheet('sos')} onHeight={setPanelHeight} />
        )}
        {bottomPanelVisible === 'tour' && selectedTour && (
          <TourCard
            key={selectedTour.id}
            tour={selectedTour}
            hoverCoordinate={hoverCoordinate}
            onHoverCoordinate={setHoverCoordinate}
            onSelectCoordinate={(c) => mapRef.current?.flyTo(c.lat, c.lng)}
            onClose={() => selectTour(null)}
            onStart={() => startNavigation(locationEnabled || fix ? 'gps' : 'simulation', readStored('recordByDefault', true))}
            onOpenProfile={() => setSheet('elevation')}
            onFit={() => mapRef.current?.fitTour()}
            onHeight={setPanelHeight}
          />
        )}
      </AnimatePresence>

      <Dock active={menuTab} onSelect={(tab) => (menuTab === tab ? closeMenu() : openMenu(tab))} navLive={navActive} />

      {/* ---------- unified menu ---------- */}
      <Sheet
        open={menuTab !== null}
        onClose={closeMenu}
        title={MENU[menuTab ?? lastTab].title}
        subtitle={MENU[menuTab ?? lastTab].subtitle}
        icon={MENU[menuTab ?? lastTab].icon}
        size="tall"
        toolbar={
          <SegmentedTabs
            layoutId="menu-tabs"
            value={menuTab ?? lastTab}
            onChange={openMenu}
            items={[
              { id: 'tours', label: 'Touren' },
              { id: 'nav', label: 'Navi' },
              { id: 'places', label: 'Orte' },
              { id: 'offline', label: 'Offline' },
              { id: 'settings', label: 'Mehr' },
            ]}
          />
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={menuTab ?? lastTab}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {menuContent(menuTab ?? lastTab)}
          </motion.div>
        </AnimatePresence>
      </Sheet>

      <LayersSheet
        open={sheet === 'layers'}
        onClose={() => setSheet(null)}
        layers={baseLayers}
        activeId={baseLayer.id}
        onSelect={setBaseLayerId}
        hikingOverlay={hikingOverlay}
        onHikingOverlay={setHikingOverlay}
        sacTrails={sacTrails}
        onSacTrails={setSacTrails}
        showPOIs={showPOIs}
        onShowPOIs={setShowPOIs}
        hasMapboxToken={!!settings.mapboxToken}
        onOpenSettings={() => {
          setSheet(null);
          openMenu('settings');
        }}
      />
      <ElevationSheet
        open={sheet === 'elevation'}
        onClose={() => setSheet(null)}
        tour={selectedTour}
        hoverCoordinate={hoverCoordinate}
        onHoverCoordinate={setHoverCoordinate}
        onSelectCoordinate={(c) => setHoverCoordinate(c)}
        progressIndex={navActive ? nav.currentIndex : null}
      />
      <POISheet
        poi={selectedPOI}
        onClose={() => setSelectedPOI(null)}
        onCenter={(p) => mapRef.current?.flyTo(p.lat, p.lng, 15)}
        onOpenSettings={() => {
          setSelectedPOI(null);
          openMenu('settings');
        }}
      />
      <SosSheet open={sheet === 'sos'} onClose={() => setSheet(null)} position={sosPosition} accuracy={fix?.accuracy ?? null} positionSource={fix ? 'gps' : 'map'} />
      <PrivacySheet
        open={sheet === 'privacy'}
        onClose={() => setSheet(null)}
        customTours={customTours}
        places={places}
        onDataCleared={() => {
          setSheet(null);
          setMenuTab(null);
        }}
      />
      <InstallSheet open={sheet === 'install'} onClose={() => setSheet(null)} />

      <AnimatePresence>{splash && <SplashScreen key="splash" />}</AnimatePresence>
    </div>
  );
}
