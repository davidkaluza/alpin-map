import React, { useState } from 'react';
import { Tour, Coordinate, Waypoint, NavigationStatus } from './types';
import { SAMPLE_TOURS } from './data/sampleRoutes';
import { MapContainerComponent } from './components/MapContainer';
import { ElevationProfile } from './components/ElevationProfile';
import { TourPlanner } from './components/TourPlanner';
import { NavigationControls } from './components/NavigationControls';
import { WaypointsManager } from './components/WaypointsManager';
import { OfflineManager } from './components/OfflineManager';
import { PrivacyLegalModal } from './components/PrivacyLegalModal';
import { IosInstallModal } from './components/IosInstallModal';
import { IPhoneFrame } from './components/IPhoneFrame';
import { MountainAppIcon } from './components/MountainAppIcon';
import { TrendingUp, Settings, X, Navigation, Map, Bookmark, Smartphone, DownloadCloud, WifiOff } from 'lucide-react';

export default function App() {
  const [customTours, setCustomTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  
  // Layer states
  const [activeBaseLayerId, setActiveBaseLayerId] = useState<string>('carto-voyager');
  const [showOverlayHiking, setShowOverlayHiking] = useState<boolean>(false);
  
  // Offline state
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState<boolean>(false);

  // Modal / Sub-page view states
  const [showElevationModal, setShowElevationModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'routes' | 'navigation' | 'waypoints' | 'offline' | 'app'>('routes');

  // Frame View toggle
  const [isIphoneFrame, setIsIphoneFrame] = useState<boolean>(false);

  // Map center tracking (Default Toscana / Alpi Apuane)
  const [_mapCenter, setMapCenter] = useState<[number, number]>([44.0850, 10.2500]);

  // Hover sync between elevation profile and map
  const [hoverCoordinate, setHoverCoordinate] = useState<Coordinate | null>(null);

  // Custom route drawing mode
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [customDraftTour, setCustomDraftTour] = useState<Tour | null>(null);

  // Navigation & GPS simulation state
  const [navStatus, setNavStatus] = useState<NavigationStatus>({
    isNavigating: false,
    isSimulating: false,
    isRecording: false,
    isPaused: false,
    currentIndex: 0,
    currentPosition: null,
    heading: 45,
    speedKmh: 4.2,
    elapsedSeconds: 0,
    distanceCoveredKm: 0,
    distanceRemainingKm: 0,
    ascentCoveredM: 0,
    ascentRemainingM: 0,
    currentInstruction: 'Bereit zur Navigation',
    recordedTrack: []
  });

  // Handle selecting a tour
  const handleSelectTour = (tour: Tour | null) => {
    setSelectedTour(tour);
    if (tour) {
      setNavStatus((prev) => ({
        ...prev,
        isNavigating: false,
        currentIndex: 0,
        currentPosition: tour.coordinates?.[0] || null,
        distanceRemainingKm: tour.distanceKm,
        ascentRemainingM: tour.ascentM,
        elapsedSeconds: 0,
        distanceCoveredKm: 0,
        recordedTrack: []
      }));
      if (tour.coordinates?.[0]) {
        setMapCenter([tour.coordinates[0].lat, tour.coordinates[0].lng]);
      }
    } else {
      setNavStatus((prev) => ({
        ...prev,
        isNavigating: false,
        currentIndex: 0,
        distanceRemainingKm: 0,
        ascentRemainingM: 0
      }));
    }
  };

  // Handle importing a GPX tour
  const handleImportTour = (imported: Tour) => {
    setCustomTours((prev) => [imported, ...prev]);
    handleSelectTour(imported);
  };

  // Add custom clicked point to draft tour when draw mode is active
  const handleAddPointToDraft = (coord: Coordinate) => {
    let currentCoords = customDraftTour ? [...customDraftTour.coordinates] : [];
    currentCoords.push(coord);

    // Calculate total distance & ascent
    let totalMeters = 0;
    let totalAscent = 0;

    for (let i = 1; i < currentCoords.length; i++) {
      const p1 = currentCoords[i - 1];
      const p2 = currentCoords[i];
      const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
      const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * (Math.PI / 180)) *
          Math.cos(p2.lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = 6371000 * c;
      totalMeters += dist;

      if (p1.ele && p2.ele && p2.ele > p1.ele) {
        totalAscent += p2.ele - p1.ele;
      }
    }

    const distKm = Math.round((totalMeters / 1000) * 10) / 10;
    const ascentM = Math.round(totalAscent);

    const draft: Tour = {
      id: customDraftTour?.id || `draft-${Date.now()}`,
      title: customDraftTour?.title || 'Eigene gezeichnete Route',
      region: 'Eigenes Outdoor-Wegenetz',
      difficulty: distKm > 10 ? 'Mittel' : 'Einfach',
      distanceKm: distKm,
      ascentM,
      descentM: ascentM,
      estimatedHours: Math.round(((distKm / 4.0) + (ascentM / 400.0)) * 10) / 10,
      coordinates: currentCoords,
      waypoints: customDraftTour?.waypoints || [],
      description: 'Selbst auf der Karte gezeichnete Wanderroute.',
      isCustom: true
    };

    setCustomDraftTour(draft);
    setSelectedTour(draft);
  };

  // Add waypoint to active tour or create a new custom tour
  const handleAddWaypoint = (newWp: Waypoint) => {
    if (selectedTour) {
      const updatedTour: Tour = {
        ...selectedTour,
        waypoints: [...(selectedTour.waypoints || []), newWp]
      };
      setSelectedTour(updatedTour);
      setCustomTours((prev) =>
        prev.map((t) => (t.id === updatedTour.id ? updatedTour : t))
      );
    } else {
      const newTour: Tour = {
        id: `custom-tour-${Date.now()}`,
        title: 'Eigene Wanderkarte & Wegpunkte',
        description: 'Freie Karte mit eigenen Wegpunkten & POIs',
        region: 'Alpen / Freie Karte',
        difficulty: 'Mittel',
        distanceKm: 0,
        ascentM: 0,
        descentM: 0,
        estimatedHours: 1,
        coordinates: [{ lat: newWp.lat, lng: newWp.lng, ele: newWp.ele || 1000 }],
        waypoints: [newWp]
      };
      setSelectedTour(newTour);
      setCustomDraftTour(newTour);
    }
  };

  return (
    <IPhoneFrame enabled={isIphoneFrame} onToggleFullscreen={() => setIsIphoneFrame(false)}>
      <div className="w-screen h-screen overflow-hidden relative bg-slate-950 font-sans">
        {/* 100% Screen Leaflet Map Container - No Headers or Titles */}
        <MapContainerComponent
          tour={selectedTour}
          activeBaseLayerId={activeBaseLayerId}
          showOverlayHiking={showOverlayHiking}
          navStatus={navStatus}
          hoverCoordinate={hoverCoordinate}
          onHoverCoordinate={setHoverCoordinate}
          isDrawMode={isDrawMode}
          onAddPointToDraft={handleAddPointToDraft}
          onMapCenterChange={setMapCenter}
          onSelectBaseLayer={setActiveBaseLayerId}
          onToggleHikingOverlay={() => setShowOverlayHiking((prev) => !prev)}
          onOpenElevationModal={() => setShowElevationModal(true)}
          onOpenSettingsModal={() => setShowSettingsModal(true)}
          onOpenOfflineManager={() => setShowOfflineModal(true)}
        />

        {/* 1. Höhenprofil Modal (Unterseite - Unified White Glass Theme) */}
        {showElevationModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 sm:pt-4 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl text-slate-900 w-full max-w-4xl h-full sm:h-[94vh] rounded-none sm:rounded-3xl shadow-2xl border border-slate-200/90 p-4 sm:p-6 space-y-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-300">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Höhenprofil & GPX-Höhendaten</h2>
                    <p className="text-xs text-slate-500">
                      {selectedTour ? `${selectedTour.title} • ${selectedTour.distanceKm} km • ${selectedTour.ascentM} m Aufstieg` : 'Keine Route gewählt (Freie Karte)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowElevationModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Interactive Elevation Chart Component */}
              <div className="flex-1 overflow-y-auto">
                <ElevationProfile
                  tour={selectedTour}
                  hoverCoordinate={hoverCoordinate}
                  onHoverCoordinate={setHoverCoordinate}
                  onClickCoordinate={(coord) => setHoverCoordinate(coord)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Offline-Karten / Download-Manager Modal (Unterseite) */}
        {showOfflineModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 sm:pt-4 animate-in fade-in duration-200">
            <OfflineManager
              currentTour={selectedTour}
              mapCenter={_mapCenter}
              isOfflineMode={isOfflineMode}
              setIsOfflineMode={setIsOfflineMode}
              onClose={() => setShowOfflineModal(false)}
            />
          </div>
        )}

        {/* 2b. Privacy & App Store Legal Compliance Modal */}
        {showPrivacyModal && (
          <PrivacyLegalModal
            onClose={() => setShowPrivacyModal(false)}
            customTours={customTours}
            waypoints={selectedTour?.waypoints || []}
            onClearAllUserData={() => {
              setCustomTours([]);
              setSelectedTour(null);
              setCustomDraftTour(null);
            }}
          />
        )}

        {/* 2c. iOS / iPhone PWA Installation Guide Modal */}
        <IosInstallModal
          isOpen={showIosInstallModal}
          onClose={() => setShowIosInstallModal(false)}
        />

        {/* 3. Einstellungen & Routen-Manager Modal (Unterseite - Unified White Theme) */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 sm:pt-4 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl text-slate-900 w-full max-w-4xl h-full sm:h-[94vh] rounded-none sm:rounded-3xl shadow-2xl border border-slate-200/90 p-4 sm:p-6 space-y-5 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <MountainAppIcon size="md" />
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      <span>ALPIN MAP Einstellungen</span>
                    </h2>
                    <p className="text-xs text-slate-500">Verwalte Touren, GPX-Importe, Offline-Karten & GPS</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Unified Subtabs Navigation */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setActiveSettingsTab('routes')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeSettingsTab === 'routes'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>Touren & GPX</span>
                </button>

                <button
                  onClick={() => setActiveSettingsTab('navigation')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeSettingsTab === 'navigation'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>GPS-Tracking</span>
                </button>

                <button
                  onClick={() => setActiveSettingsTab('waypoints')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeSettingsTab === 'waypoints'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Wegpunkte</span>
                </button>

                <button
                  onClick={() => setActiveSettingsTab('offline')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeSettingsTab === 'offline'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Offline-Karten</span>
                </button>

                <button
                  onClick={() => setActiveSettingsTab('app')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeSettingsTab === 'app'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone-Rahmen</span>
                </button>
              </div>

              {/* Subtab Content */}
              <div className="flex-1 overflow-y-auto pr-1">
                {activeSettingsTab === 'routes' && (
                  <TourPlanner
                    selectedTour={selectedTour}
                    onSelectTour={(t) => {
                      handleSelectTour(t);
                      setShowSettingsModal(false);
                    }}
                    customTours={customTours}
                    onImportTour={(t) => {
                      handleImportTour(t);
                      setShowSettingsModal(false);
                    }}
                    isDrawMode={isDrawMode}
                    setIsDrawMode={(dm) => {
                      setIsDrawMode(dm);
                      if (dm) setShowSettingsModal(false);
                    }}
                    customDraftTour={customDraftTour}
                    onClearCustomDraft={() => setCustomDraftTour(null)}
                  />
                )}

                {activeSettingsTab === 'navigation' && (
                  <NavigationControls
                    tour={selectedTour}
                    navStatus={navStatus}
                    setNavStatus={setNavStatus}
                    onSaveRecordedTrack={(rec) => {
                      setCustomTours((prev) => [rec, ...prev]);
                      setSelectedTour(rec);
                      alert('Wandertrack erfolgreich als GPX-Tour gespeichert!');
                    }}
                  />
                )}

                {activeSettingsTab === 'waypoints' && (
                  <WaypointsManager
                    tour={selectedTour}
                    onAddWaypoint={handleAddWaypoint}
                    onSelectWaypoint={(wp) => {
                      setHoverCoordinate({ lat: wp.lat, lng: wp.lng, ele: wp.ele });
                      setShowSettingsModal(false);
                    }}
                  />
                )}

                {activeSettingsTab === 'offline' && (
                  <OfflineManager
                    currentTour={selectedTour}
                    mapCenter={_mapCenter}
                    isOfflineMode={isOfflineMode}
                    setIsOfflineMode={setIsOfflineMode}
                    activeBaseLayerId={activeBaseLayerId}
                  />
                )}

                {activeSettingsTab === 'app' && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="font-bold text-sm text-slate-900">Darstellung & Modus</h3>
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">iPhone Statusbar & Rahmen</div>
                        <div className="text-xs text-slate-500">Schaltet den virtuellen iPhone-Rahmen ein oder aus</div>
                      </div>
                      <button
                        onClick={() => setIsIphoneFrame(!isIphoneFrame)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isIphoneFrame
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {isIphoneFrame ? 'Aktiviert' : 'Aktivieren'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">iPhone App Installation (PWA)</div>
                        <div className="text-xs text-slate-500">Schritt-für-Schritt Anleitung zur Speicherung auf dem Home-Bildschirm</div>
                      </div>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          setShowIosInstallModal(true);
                        }}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer"
                      >
                        Anleitung öffnen
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 pt-2">Datenschutz & App Store Compliance</h3>
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">Datenschutzerklärung & Nutzerdaten (Section 5.1.1)</div>
                        <div className="text-xs text-slate-500">Daten exportieren, Speicher vollständig zurücksetzen & Rechtliches</div>
                      </div>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          setShowPrivacyModal(true);
                        }}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer"
                      >
                        Verwalten
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </IPhoneFrame>
  );
}
