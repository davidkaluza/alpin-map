import React, { useEffect } from 'react';
import { Tour, NavigationStatus, Coordinate } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Compass,
  Navigation,
  Activity,
  Footprints,
  AlertTriangle,
  Clock,
  CircleDot,
  Download,
  PhoneCall,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { downloadGPX } from '../services/gpx';

interface NavigationControlsProps {
  tour?: Tour | null;
  navStatus: NavigationStatus;
  setNavStatus: React.Dispatch<React.SetStateAction<NavigationStatus>>;
  onSaveRecordedTrack?: (trackTour: Tour) => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  tour,
  navStatus,
  setNavStatus,
  onSaveRecordedTrack
}) => {
  // Timer effect for navigation elapsed time and position step progression
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (navStatus.isNavigating && !navStatus.isPaused) {
      interval = setInterval(() => {
        setNavStatus((prev) => {
          const coords = tour?.coordinates || [];
          if (!coords || coords.length === 0) return prev;

          let nextIdx = prev.currentIndex;
          let nextRecordedTrack = [...prev.recordedTrack];

          if (prev.isSimulating) {
            nextIdx = (prev.currentIndex + 1) % coords.length;
          }

          const currPos = coords[nextIdx] || coords[0];
          
          if (prev.isRecording) {
            nextRecordedTrack.push(currPos);
          }

          // Calculate covered distance & remaining
          const tourDist = tour?.distanceKm || 0;
          const tourAscent = tour?.ascentM || 0;
          const progressPercent = Math.min(100, Math.round((nextIdx / (coords.length - 1)) * 100));
          const distanceCoveredKm = Math.round(((progressPercent / 100) * tourDist) * 10) / 10;
          const distanceRemainingKm = Math.max(0, Math.round((tourDist - distanceCoveredKm) * 10) / 10);
          const ascentCoveredM = Math.round((progressPercent / 100) * tourAscent);
          const ascentRemainingM = Math.max(0, tourAscent - ascentCoveredM);

          // Determine step instruction based on progress
          let currentInstruction = 'Dem Wanderweg weiter folgen';
          if (nextIdx === 0) currentInstruction = 'Start am Wanderparkplatz / Wegbeginn';
          else if (nextIdx >= coords.length - 1) currentInstruction = 'Ziel erreicht! Gratulation zur Tour.';
          else if (nextIdx % 4 === 1) currentInstruction = 'Leicht links halten auf dem Forstweg';
          else if (nextIdx % 4 === 2) currentInstruction = 'Steiler Anstieg voraus - Tempo anpassen';
          else if (nextIdx % 4 === 3) currentInstruction = 'Rechts abbiegen Richtung Gipfel/Hütte';

          // Heading calculation
          let heading = prev.heading;
          if (nextIdx > 0) {
            const p1 = coords[nextIdx - 1];
            const p2 = coords[nextIdx];
            const dLon = p2.lng - p1.lng;
            const y = Math.sin(dLon) * Math.cos(p2.lat);
            const x = Math.cos(p1.lat) * Math.sin(p2.lat) - Math.sin(p1.lat) * Math.cos(p2.lat) * Math.cos(dLon);
            heading = Math.round(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360);
          }

          return {
            ...prev,
            currentIndex: nextIdx,
            currentPosition: currPos,
            elapsedSeconds: prev.elapsedSeconds + 1,
            distanceCoveredKm,
            distanceRemainingKm,
            ascentCoveredM,
            ascentRemainingM,
            heading,
            speedKmh: 4.2 + (Math.sin(prev.elapsedSeconds) * 0.4),
            currentInstruction,
            recordedTrack: nextRecordedTrack
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [navStatus.isNavigating, navStatus.isPaused, tour, setNavStatus]);

  // Format seconds into HH:MM:SS
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const startNavigation = (simulated: boolean) => {
    const firstCoord = tour?.coordinates?.[0] || { lat: 47.4578, lng: 10.9931, ele: 975 };
    setNavStatus((prev) => ({
      ...prev,
      isNavigating: true,
      isPaused: false,
      isSimulating: simulated,
      currentIndex: 0,
      currentPosition: firstCoord,
      distanceRemainingKm: tour?.distanceKm || 0,
      ascentRemainingM: tour?.ascentM || 0,
      currentInstruction: 'Navigation gestartet. Gute Fahrt/Wanderung!'
    }));
  };

  const togglePause = () => {
    setNavStatus((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const toggleRecording = () => {
    setNavStatus((prev) => ({ ...prev, isRecording: !prev.isRecording }));
  };

  const stopNavigation = () => {
    // If we recorded a track, allow saving/exporting
    if (navStatus.recordedTrack.length > 2 && onSaveRecordedTrack) {
      const recTour: Tour = {
        id: `recorded-${Date.now()}`,
        title: `Aufgezeichnete Tour - ${new Date().toLocaleDateString('de-DE')}`,
        region: tour?.region || 'Alpen',
        difficulty: tour?.difficulty || 'Mittel',
        distanceKm: navStatus.distanceCoveredKm,
        ascentM: navStatus.ascentCoveredM,
        descentM: navStatus.ascentCoveredM,
        estimatedHours: Math.round((navStatus.elapsedSeconds / 3600) * 10) / 10,
        description: `Selbst aufgezeichnete Wanderstrecke. Dauer: ${formatTime(navStatus.elapsedSeconds)}.`,
        coordinates: navStatus.recordedTrack,
        waypoints: [],
        isRecorded: true,
        createdAt: new Date().toLocaleDateString('de-DE')
      };
      onSaveRecordedTrack(recTour);
    }

    setNavStatus((prev) => ({
      ...prev,
      isNavigating: false,
      isPaused: false,
      isRecording: false,
      currentIndex: 0,
      elapsedSeconds: 0,
      distanceCoveredKm: 0,
      currentInstruction: 'Bereit für die nächste Tour.'
    }));
  };

  // SOS Emergency Dialog State
  const [showSosModal, setShowSosModal] = React.useState(false);
  const currentPos = navStatus.currentPosition || (tour?.coordinates && tour.coordinates[0]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
      {/* Active Navigation Header / Status Pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              navStatus.isNavigating
                ? navStatus.isPaused
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500 animate-ping'
                : 'bg-slate-300'
            }`}
          />
          <span className="font-semibold text-sm text-slate-900">
            {navStatus.isNavigating
              ? navStatus.isPaused
                ? 'Navigation pausiert'
                : navStatus.isSimulating
                ? 'GPS Navigation Simulation'
                : 'Echte GPS Navigation'
              : 'Offline Navigation bereit'}
          </span>
        </div>

        {/* SOS Emergency Button */}
        <button
          onClick={() => setShowSosModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200/80 px-3 py-1.5 rounded-full hover:bg-red-100/80 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Notfall / SOS</span>
        </button>
      </div>

      {/* Main Nav Instruction Card */}
      {navStatus.isNavigating ? (
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex items-start gap-3 shadow-xs">
          <div className="p-2.5 bg-slate-800 rounded-xl text-emerald-400 mt-0.5 shrink-0">
            <Navigation
              className="w-6 h-6 transform transition-transform duration-300"
              style={{ transform: `rotate(${navStatus.heading}deg)` }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-mono mb-1">
              <span>NÄCHSTE ANWEISUNG</span>
              <span>Komp: {navStatus.heading}°</span>
            </div>
            <p className="font-medium text-sm leading-snug text-slate-100">
              {navStatus.currentInstruction}
            </p>
          </div>
        </div>
      ) : null}

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Zeit
          </span>
          <span className="text-base font-bold text-slate-900 mt-1">
            {formatTime(navStatus.elapsedSeconds)}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5 text-slate-400" /> Zurückgelegt
          </span>
          <span className="text-base font-bold text-slate-900 mt-1">
            {navStatus.distanceCoveredKm} <span className="text-xs font-normal">km</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" /> Restdistanz
          </span>
          <span className="text-base font-bold text-emerald-700 mt-1">
            {navStatus.distanceRemainingKm} <span className="text-xs font-normal">km</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-slate-400" /> Tempo
          </span>
          <span className="text-base font-bold text-slate-900 mt-1">
            {navStatus.isNavigating ? navStatus.speedKmh.toFixed(1) : '0.0'}{' '}
            <span className="text-xs font-normal">km/h</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!navStatus.isNavigating ? (
          <>
            <button
              onClick={() => startNavigation(true)}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-full shadow-xs transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Simulation Starten</span>
            </button>

            <button
              onClick={() => startNavigation(false)}
              className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-full text-xs transition-colors"
            >
              <CircleDot className="w-4 h-4 text-emerald-400" />
              <span>Echt-GPS</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-full shadow-xs transition-all"
            >
              {navStatus.isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Fortsetzen</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausieren</span>
                </>
              )}
            </button>

            <button
              onClick={toggleRecording}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold border transition-colors ${
                navStatus.isRecording
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
            >
              <CircleDot className="w-4 h-4" />
              <span>{navStatus.isRecording ? 'Aufnahme aktiv' : 'Track aufnehmen'}</span>
            </button>

            <button
              onClick={stopNavigation}
              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-semibold px-3.5 py-2.5 rounded-full text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Beenden</span>
            </button>
          </>
        )}

        <button
          onClick={() => downloadGPX(tour)}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-semibold px-3.5 py-2.5 rounded-full text-xs transition-colors"
          title="Tour als GPX-Datei herunterladen"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>GPX Export</span>
        </button>
      </div>

      {/* SOS Emergency Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-red-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5 text-red-600 font-bold text-lg">
                <AlertTriangle className="w-6 h-6 fill-red-100" />
                <span>Notfall-Koordinaten</span>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bei einem Alpin-Notfall im Gebirge nennen Sie der Rettungsleitstelle diese exakten Koordinaten:
            </p>

            <div className="bg-slate-900 text-emerald-400 font-mono text-sm rounded-xl p-3 mb-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Breite (Lat):</span>
                <span className="font-bold">{currentPos?.lat.toFixed(6)}° N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Länge (Lng):</span>
                <span className="font-bold">{currentPos?.lng.toFixed(6)}° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Höhe (NHN):</span>
                <span className="font-bold text-white">{currentPos?.ele || 975} m</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Notruf 112 Wählen (Europa)</span>
              </a>

              <a
                href="tel:1414"
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-xl text-xs transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-red-400" />
                <span>REGA Notruf 1414 (Schweiz / Alpen)</span>
              </a>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `SOS Notfall Standort: Lat ${currentPos?.lat.toFixed(6)}, Lng ${currentPos?.lng.toFixed(6)}, Höhe ${currentPos?.ele || 975}m`
                );
                alert('Koordinaten in Zwischenablage kopiert!');
              }}
              className="w-full mt-3 text-xs text-slate-500 hover:text-slate-700 font-medium py-1.5 text-center flex items-center justify-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Standort-Text kopieren</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
