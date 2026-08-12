import React, { useState, useEffect, useRef } from 'react';
import { Tour, OfflineRegion } from '../types';
import {
  DownloadCloud,
  HardDrive,
  Wifi,
  WifiOff,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Map,
  Sparkles,
  MapPin,
  XCircle,
  Zap
} from 'lucide-react';
import {
  getOfflineRegions,
  deleteOfflineRegion,
  downloadTileRegion,
  getCacheStats,
  clearAllTileCache
} from '../services/offlineStorage';
import { MAP_LAYERS } from '../data/sampleRoutes';

interface OfflineManagerProps {
  currentTour?: Tour | null;
  mapCenter: [number, number];
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  activeBaseLayerId?: string;
  onClose?: () => void;
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({
  currentTour,
  mapCenter,
  isOfflineMode,
  setIsOfflineMode,
  activeBaseLayerId,
  onClose
}) => {
  const [regions, setRegions] = useState<OfflineRegion[]>([]);
  const [cacheStats, setCacheStats] = useState<{ count: number; sizeMb: number }>({ count: 0, sizeMb: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStats, setDownloadStats] = useState({ current: 0, total: 0 });
  const [downloadSpeed, setDownloadSpeed] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const downloadStartRef = useRef<number>(0);

  // Form options for new region download
  const [regionName, setRegionName] = useState(currentTour?.title || 'Toskana & Alpen Region');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [selectedLayerId, setSelectedLayerId] = useState<string>(activeBaseLayerId || 'maperitive-topo');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const list = await getOfflineRegions();
    setRegions(list);
    const stats = await getCacheStats();
    setCacheStats(stats);
  };

  const handleStartDownload = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    downloadStartRef.current = Date.now();

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadSpeed(0);

    const layerConfig = MAP_LAYERS.find((l) => l.id === selectedLayerId) || MAP_LAYERS[1];
    const centerLat = mapCenter[0] || currentTour?.coordinates?.[0]?.lat || 47.4578;
    const centerLng = mapCenter[1] || currentTour?.coordinates?.[0]?.lng || 10.9931;

    try {
      await downloadTileRegion(
        regionName,
        centerLat,
        centerLng,
        radiusKm,
        12,
        15,
        layerConfig.url,
        (prog, current, total) => {
          setDownloadProgress(prog);
          setDownloadStats({ current, total });
          const elapsed = (Date.now() - downloadStartRef.current) / 1000;
          if (elapsed > 0.5) setDownloadSpeed(Math.round(current / elapsed));
        },
        controller.signal
      );
      await refreshData();
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('Download error:', err);
      }
    } finally {
      setIsDownloading(false);
      setDownloadSpeed(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    abortControllerRef.current?.abort();
  };

  const handleDeleteRegion = async (id: string) => {
    await deleteOfflineRegion(id);
    await refreshData();
  };

  const handleClearAll = async () => {
    if (confirm('Möchten Sie alle heruntergeladenen Kartenkacheln und Regionen löschen?')) {
      await clearAllTileCache();
      await refreshData();
    }
  };

  return (
    <div className="bg-white border border-slate-200 sm:rounded-3xl rounded-none shadow-2xl overflow-hidden max-w-3xl w-full h-full sm:h-[94vh] flex flex-col text-slate-900">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-300">
            <DownloadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Offline-Karten & Download-Manager</h3>
            <p className="text-xs text-slate-500">Kartenmaterial ohne Mobilfunknetz und offline nutzen</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-5 flex-1 overflow-y-auto bg-slate-50">
        {/* Offline Mode Switch Toggle */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {isOfflineMode ? (
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl border border-amber-300">
                <WifiOff className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300">
                <Wifi className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                Offline-Modus {isOfflineMode ? 'AKTIV' : 'Inaktiv'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isOfflineMode
                  ? 'Verwendet ausschließlich lokal gespeicherte Kartenkacheln.'
                  : 'Karten werden bei Online-Verbindung live geladen & gecacht.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOfflineMode ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isOfflineMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Download New Region Form */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Offline-Karten um Mittelpunkt herunterladen</span>
            </div>
          </div>

          {/* Active Center Location Badge */}
          <div className="bg-white border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">Karten-Mittelpunkt</span>
                <span className="text-[11px] text-slate-600 font-mono font-medium">
                  {mapCenter[0].toFixed(4)}° N, {mapCenter[1].toFixed(4)}° E
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
              Live aus der Karte
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bezeichnung der Region:
            </label>
            <input
              type="text"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-xs font-medium placeholder-slate-400"
              placeholder="z.B. Eibsee & Zugspitzgebiet"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Karten-Typ:
              </label>
              <select
                value={selectedLayerId}
                onChange={(e) => setSelectedLayerId(e.target.value)}
                className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-xs font-medium cursor-pointer"
              >
                {MAP_LAYERS.filter((l) => l.category === 'base').map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Such-Radius:
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-xs font-medium cursor-pointer"
              >
                <option value={3}>3 km Radius (~120 Kacheln)</option>
                <option value={5}>5 km Radius (~320 Kacheln)</option>
                <option value={10}>10 km Radius (~1.100 Kacheln)</option>
              </select>
            </div>
          </div>

          {/* Download Button or Progress Bar */}
          {isDownloading ? (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  {downloadStats.current} / {downloadStats.total} Kacheln ({downloadProgress}%)
                </span>
                <span className="flex items-center gap-2">
                  {downloadSpeed > 0 && (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Zap className="w-3 h-3" />
                      {downloadSpeed} K/s
                    </span>
                  )}
                  <button
                    onClick={handleCancelDownload}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold px-2 py-0.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Download abbrechen"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Abbrechen</span>
                  </button>
                </span>
              </div>
              <div className="w-full bg-emerald-200/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-150"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartDownload}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-full shadow-md text-xs transition-colors cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Offline-Region Herunterladen</span>
            </button>
          )}
        </div>

        {/* Saved Regions List */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Gespeicherte Offline-Regionen ({regions.length})
            </h4>
            <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
              Gesamt: {cacheStats.sizeMb} MB ({cacheStats.count} Kacheln)
            </span>
          </div>

          {regions.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-300 rounded-2xl bg-white text-slate-500 text-xs font-medium">
              Noch keine Offline-Regionen gespeichert. Wählen Sie oben eine Region aus!
            </div>
          ) : (
            <div className="space-y-2">
              {regions.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Map className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{reg.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {reg.radiusKm}km Radius • {reg.tileCount} Kacheln • {reg.sizeMb} MB •{' '}
                        {reg.downloadedAt}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRegion(reg.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Region löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Gesamten Offline-Speicher leeren</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
