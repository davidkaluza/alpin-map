import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bed, Calendar, CheckCircle2, Compass, ExternalLink, Globe, Home, KeyRound, Loader2, MapPin, Mountain, Sparkles, Tent, Navigation } from 'lucide-react';
import type { AlpinePOI } from '../../types';
import { Sheet } from '../ui/Sheet';
import { Button, Chip, Section } from '../ui/controls';
import { getPOIDetails, type POIDetails } from '../../services/poiDetails';
import { useSettings } from '../../lib/settings';
import { formatCoord } from '../../lib/geo';

interface Props {
  poi: AlpinePOI | null;
  onClose: () => void;
  onCenter: (poi: AlpinePOI) => void;
  onOpenSettings: () => void;
}

export function POISheet({ poi, onClose, onCenter, onOpenSettings }: Props) {
  const [settings] = useSettings();
  const [details, setDetails] = useState<POIDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!poi) return;
    const controller = new AbortController();
    setDetails(null);
    setLoading(true);
    getPOIDetails(poi, controller.signal)
      .then((d) => setDetails(d))
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [poi, settings.geminiApiKey]);

  const isPeak = poi?.type === 'peak';
  const Icon = isPeak ? Mountain : poi?.type === 'refugio' ? Tent : Home;
  const mapsUrl = poi ? `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}` : '#';
  const appleMapsUrl = poi ? `https://maps.apple.com/?ll=${poi.lat},${poi.lng}&q=${encodeURIComponent(poi.name)}` : '#';

  return (
    <Sheet
      open={!!poi}
      onClose={onClose}
      title={poi?.name ?? ''}
      subtitle={poi ? `${poi.categoryLabel}${poi.region ? ` · ${poi.region}` : ''}` : undefined}
      icon={<Icon className="h-5 w-5" />}
      tone={isPeak ? 'amber' : 'emerald'}
      zIndex={1100}
    >
      {poi && (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {poi.ele > 0 && (
              <Chip tone="amber" icon={<Mountain className="h-3 w-3" />}>
                {poi.ele.toLocaleString('de-DE')} m
              </Chip>
            )}
            {poi.openingSeason && (
              <Chip tone="slate" icon={<Calendar className="h-3 w-3" />}>
                {poi.openingSeason}
              </Chip>
            )}
            {poi.capacity && (
              <Chip tone="sky" icon={<Bed className="h-3 w-3" />}>
                {poi.capacity}
              </Chip>
            )}
            <Chip tone="slate" icon={<MapPin className="h-3 w-3" />}>
              <span data-selectable>{formatCoord(poi.lat, poi.lng, 4)}</span>
            </Chip>
          </div>

          <Section>
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                {details?.source === 'gemini' ? 'KI-Beschreibung (Gemini, mit Google-Suche)' : 'Beschreibung'}
              </div>
              {loading ? (
                <div className="space-y-2 py-1">
                  {[100, 92, 96, 70].map((w, i) => (
                    <motion.div key={i} className="h-3.5 rounded-full bg-white/[0.08]" style={{ width: `${w}%` }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.12 }} />
                  ))}
                  <div className="flex items-center gap-2 pt-1 text-[12px] text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lade Informationen …
                  </div>
                </div>
              ) : (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre-line text-[14.5px] leading-relaxed text-slate-200" data-selectable>
                  {details?.description || 'Für diesen Ort sind keine weiteren Informationen hinterlegt.'}
                </motion.p>
              )}
              {details?.error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200 ring-1 ring-rose-400/20">Gemini-Fehler: {details.error}</p>}
              {!loading && !settings.geminiApiKey && (
                <button onClick={onOpenSettings} className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-emerald-300">
                  <KeyRound className="h-3.5 w-3.5" />
                  Gemini-Key hinterlegen für ausführliche KI-Infos
                </button>
              )}
              {details && details.searchLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                  {details.searchLinks.map((l) => (
                    <a key={l.uri} href={l.uri} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-emerald-300 ring-1 ring-white/10">
                      <span className="truncate">{l.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {poi.facilities && poi.facilities.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {poi.facilities.map((f) => (
                <Chip key={f} tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>
                  {f}
                </Chip>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              icon={<Compass className="h-[18px] w-[18px]" />}
              onClick={() => {
                onCenter(poi);
                onClose();
              }}
            >
              Auf Karte
            </Button>
            <Button icon={<Navigation className="h-[18px] w-[18px]" />} onClick={() => window.open(appleMapsUrl, '_blank', 'noopener')}>
              Apple Karten
            </Button>
            <Button icon={<MapPin className="h-[18px] w-[18px]" />} onClick={() => window.open(mapsUrl, '_blank', 'noopener')}>
              Google Maps
            </Button>
            {poi.website ? (
              <Button icon={<Globe className="h-[18px] w-[18px]" />} onClick={() => window.open(poi.website, '_blank', 'noopener')}>
                Website
              </Button>
            ) : (
              <div />
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
