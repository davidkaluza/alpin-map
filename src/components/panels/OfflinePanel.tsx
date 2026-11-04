import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, CloudOff, DownloadCloud, HardDrive, Loader2, Map as MapIcon, Trash2, Wifi, WifiOff, XCircle, AlertTriangle } from 'lucide-react';
import type { Coordinate, MapLayerConfig, OfflineRegion, Tour } from '../../types';
import { Button, Field, Row, Section, SegmentedTabs, Toggle, inputClass } from '../ui/controls';
import { useToast } from '../ui/Toast';
import {
  clearAllTileCache,
  deleteOfflineRegion,
  downloadTileRegion,
  estimateTileCount,
  getCacheStats,
  getOfflineRegions,
  requestPersistentStorage,
} from '../../services/offlineStorage';
import { formatCoord } from '../../lib/geo';

interface Props {
  online: boolean;
  offlineMode: boolean;
  onOfflineModeChange: (v: boolean) => void;
  layers: MapLayerConfig[];
  activeLayerId: string;
  mapCenter: Coordinate;
  tour: Tour | null;
}

type Detail = 'basic' | 'detail' | 'max';
const DETAIL: Record<Detail, { label: string; min: number; max: number }> = {
  basic: { label: 'Übersicht', min: 10, max: 14 },
  detail: { label: 'Wandern', min: 10, max: 15 },
  max: { label: 'Maximal', min: 10, max: 16 },
};

export function OfflinePanel({ online, offlineMode, onOfflineModeChange, layers, activeLayerId, mapCenter, tour }: Props) {
  const toast = useToast();
  const [regions, setRegions] = useState<OfflineRegion[]>([]);
  const [stats, setStats] = useState<{ count: number; usageMb: number | null; quotaMb: number | null }>({ count: 0, usageMb: null, quotaMb: null });
  const [name, setName] = useState(tour?.title ?? '');
  const [layerId, setLayerId] = useState(activeLayerId);
  const [radius, setRadius] = useState(5);
  const [detail, setDetail] = useState<Detail>('detail');
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const layer = layers.find((l) => l.id === layerId) ?? layers[0];
  const center = useMemo(() => {
    if (tour && tour.coordinates.length) {
      const lats = tour.coordinates.map((c) => c.lat);
      const lngs = tour.coordinates.map((c) => c.lng);
      return { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2, fromTour: true };
    }
    return { ...mapCenter, fromTour: false };
  }, [tour, mapCenter]);
  const cfg = DETAIL[detail];
  const estimate = estimateTileCount(center.lat, radius, cfg.min, Math.min(cfg.max, layer.maxNativeZoom ?? cfg.max));
  const estimateMb = Math.round(estimate * 0.025 * 10) / 10;

  const refresh = async () => {
    setRegions(await getOfflineRegions());
    setStats(await getCacheStats());
  };

  useEffect(() => {
    refresh();
    return () => abortRef.current?.abort();
  }, []);

  const start = async () => {
    if (!online) return toast('Für den Download wird eine Internetverbindung benötigt', 'error');
    if (estimate > 12000) return toast('Bereich zu groß – Radius oder Detailstufe verringern', 'error');
    requestPersistentStorage();
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({ done: 0, total: estimate, failed: 0 });
    try {
      const region = await downloadTileRegion({
        name: name.trim() || (center.fromTour ? tour!.title : `Region ${formatCoord(center.lat, center.lng, 2)}`),
        layer,
        centerLat: center.lat,
        centerLng: center.lng,
        radiusKm: radius,
        minZoom: cfg.min,
        maxZoom: Math.min(cfg.max, layer.maxNativeZoom ?? cfg.max),
        signal: controller.signal,
        onProgress: (done, total, failed) => setProgress({ done, total, failed }),
      });
      if (controller.signal.aborted) toast('Download abgebrochen – bereits geladene Kacheln bleiben erhalten', 'info');
      else if (region.failedCount) toast(`${region.failedCount} Kacheln konnten nicht geladen werden`, 'error');
      else toast(`„${region.name}“ ist offline verfügbar (${region.sizeMb} MB)`);
    } catch (e) {
      toast(`Download fehlgeschlagen: ${(e as Error).message}`, 'error');
    } finally {
      setProgress(null);
      abortRef.current = null;
      refresh();
    }
  };

  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;

  return (
    <div>
      <Section footer={offlineMode ? 'Es werden ausschließlich gespeicherte Kacheln angezeigt – kein mobiles Datenvolumen.' : 'Angesehene Kartenausschnitte werden automatisch zwischengespeichert.'}>
        <Row
          icon={online ? <Wifi className="h-[18px] w-[18px]" /> : <WifiOff className="h-[18px] w-[18px]" />}
          iconBg={online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}
          title={online ? 'Online' : 'Keine Verbindung'}
          subtitle={online ? 'Karten werden live geladen' : 'Gespeicherte Karten werden verwendet'}
        />
        <Row icon={<CloudOff className="h-[18px] w-[18px]" />} iconBg="bg-amber-500/15 text-amber-300" title="Nur Offline-Karten" subtitle="Datenvolumen sparen" right={<Toggle checked={offlineMode} onChange={onOfflineModeChange} label="Nur Offline-Karten" />} />
      </Section>

      <Section title="Gebiet herunterladen">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-400/[0.08] px-3 py-2.5 text-[13px] text-emerald-200 ring-1 ring-emerald-400/20">
            <MapIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {center.fromTour ? `Rund um „${tour!.title}“` : 'Rund um die Kartenmitte'} · <span className="tabular-nums">{formatCoord(center.lat, center.lng, 3)}</span>
            </span>
          </div>
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Wetterstein" maxLength={60} />
          </Field>
          <Field label="Kartenstil">
            <select className={inputClass} value={layer.id} onChange={(e) => setLayerId(e.target.value)}>
              {layers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between px-1 text-[13px] font-medium text-slate-300">
              <span>Radius</span>
              <span className="tabular-nums text-emerald-300">{radius} km</span>
            </div>
            <input type="range" min={1} max={20} step={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-emerald-400" />
          </div>
          <div>
            <span className="mb-1.5 block px-1 text-[13px] font-medium text-slate-300">Detailstufe</span>
            <SegmentedTabs layoutId="offline-detail" value={detail} onChange={setDetail} items={(Object.keys(DETAIL) as Detail[]).map((d) => ({ id: d, label: DETAIL[d].label }))} />
          </div>
          <div className="flex items-center justify-between px-1 text-[13px] text-slate-400">
            <span>
              ≈ <span className="tabular-nums text-slate-200">{estimate.toLocaleString('de-DE')}</span> Kacheln
            </span>
            <span>
              ≈ <span className="tabular-nums text-slate-200">{estimateMb.toLocaleString('de-DE')}</span> MB
            </span>
          </div>

          <AnimatePresence mode="wait">
            {progress ? (
              <motion.div key="progress" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                <div className="flex items-center justify-between text-[13px] font-medium text-slate-200">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    {progress.done.toLocaleString('de-DE')} / {progress.total.toLocaleString('de-DE')}
                  </span>
                  <span className="tabular-nums text-emerald-300">{pct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-teal-300" animate={{ width: `${pct}%` }} transition={{ ease: 'easeOut' }}>
                    <motion.div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent" animate={{ x: ['-100%', '300%'] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }} />
                  </motion.div>
                </div>
                {progress.failed > 0 && <div className="text-[12px] text-amber-300">{progress.failed} Kacheln fehlgeschlagen</div>}
                <Button block icon={<XCircle className="h-4 w-4" />} onClick={() => abortRef.current?.abort()}>
                  Abbrechen
                </Button>
              </motion.div>
            ) : (
              <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button variant="primary" block icon={<DownloadCloud className="h-[18px] w-[18px]" />} onClick={start} disabled={!online}>
                  Herunterladen
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      <Section
        title={`Gespeicherte Gebiete (${regions.length})`}
        footer={
          <>
            {stats.count.toLocaleString('de-DE')} Kacheln gespeichert
            {stats.usageMb !== null && ` · ${stats.usageMb.toLocaleString('de-DE')} MB belegt`}
            {stats.quotaMb !== null && ` von ${Math.round(stats.quotaMb / 1024).toLocaleString('de-DE')} GB`}
          </>
        }
      >
        {regions.length === 0 ? (
          <Row icon={<HardDrive className="h-[18px] w-[18px]" />} title="Noch keine Gebiete" subtitle="Lade ein Gebiet vor der Tour herunter" />
        ) : (
          regions.map((r) => (
            <Row
              key={r.id}
              icon={r.status === 'completed' ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <AlertTriangle className="h-[18px] w-[18px]" />}
              iconBg={r.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}
              title={r.name}
              subtitle={`${r.layerName} · ${r.radiusKm} km · ${r.sizeMb} MB · ${r.downloadedAt}${r.failedCount ? ` · ${r.failedCount} fehlen` : ''}`}
              right={
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  aria-label="Gebiet löschen"
                  onClick={async () => {
                    await deleteOfflineRegion(r.id);
                    toast(`„${r.name}“ gelöscht`, 'info');
                    refresh();
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-rose-300"
                >
                  <Trash2 className="h-[18px] w-[18px]" />
                </motion.button>
              }
            />
          ))
        )}
        <Row
          icon={<Trash2 className="h-[18px] w-[18px]" />}
          iconBg="bg-rose-500/15 text-rose-300"
          title={confirmClear ? 'Wirklich alles löschen?' : 'Kartenspeicher leeren'}
          subtitle={confirmClear ? 'Erneut tippen zum Bestätigen' : 'Alle Gebiete und zwischengespeicherten Kacheln'}
          danger
          onClick={async () => {
            if (!confirmClear) return setConfirmClear(true);
            await clearAllTileCache();
            setConfirmClear(false);
            toast('Kartenspeicher geleert', 'info');
            refresh();
          }}
        />
      </Section>
    </div>
  );
}
