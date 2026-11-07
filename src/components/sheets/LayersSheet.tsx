import { motion } from 'motion/react';
import { Check, Footprints, Layers, Mountain, KeyRound, TrendingUp } from 'lucide-react';
import { SAC_GRADES, type SacGrade } from '../../services/sacTrailsService';
import type { MapLayerConfig } from '../../types';
import { Sheet } from '../ui/Sheet';
import { Row, Section, Toggle } from '../ui/controls';
import { haptic } from '../../lib/haptics';

interface Props {
  open: boolean;
  onClose: () => void;
  layers: MapLayerConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  hikingOverlay: boolean;
  onHikingOverlay: (v: boolean) => void;
  sacTrails: boolean;
  onSacTrails: (v: boolean) => void;
  showPOIs: boolean;
  onShowPOIs: (v: boolean) => void;
  hasMapboxToken: boolean;
  onOpenSettings: () => void;
}

export function LayersSheet({ open, onClose, layers, activeId, onSelect, hikingOverlay, onHikingOverlay, sacTrails, onSacTrails, showPOIs, onShowPOIs, hasMapboxToken, onOpenSettings }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Kartenebenen" subtitle="Stil und Overlays wählen" icon={<Layers className="h-5 w-5" />} tone="sky">
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {layers.map((l, i) => {
          const active = l.id === activeId;
          return (
            <motion.button
              key={l.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 360, damping: 28 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                haptic(6);
                onSelect(l.id);
              }}
              className={`relative overflow-hidden rounded-2xl p-1 text-left ring-2 transition-colors ${active ? 'ring-emerald-400' : 'ring-white/[0.06] hover:ring-white/20'}`}
            >
              <div className={`relative h-20 overflow-hidden rounded-xl bg-gradient-to-br ${l.preview ?? 'from-slate-600 to-slate-800'}`}>
                <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="none">
                  <path d="M0 40 Q 20 25 35 32 T 65 22 T 100 30" fill="none" stroke={l.dark ? '#ffffff55' : '#00000033'} strokeWidth="0.8" />
                  <path d="M0 46 Q 25 35 45 40 T 100 38" fill="none" stroke={l.dark ? '#ffffff33' : '#00000022'} strokeWidth="0.8" />
                  <path d="M10 48 L 30 20 L 45 34 L 62 12 L 90 48" fill="none" stroke="#10b981" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                {active && (
                  <motion.div layoutId="layer-check" className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-400 text-slate-950 shadow-lg">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              <div className="px-1.5 pb-1 pt-2">
                <div className={`truncate text-[14px] font-semibold ${active ? 'text-emerald-300' : 'text-white'}`}>{l.name}</div>
                <div className="line-clamp-2 text-[11.5px] leading-snug text-slate-400">{l.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <Section title="Overlays">
        <Row icon={<Footprints className="h-[18px] w-[18px]" />} iconBg="bg-rose-500/15 text-rose-300" title="Wanderwege" subtitle="Markierte Wege (Waymarked Trails)" right={<Toggle checked={hikingOverlay} onChange={onHikingOverlay} label="Wanderwege" />} />
        <Row
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          iconBg="bg-sky-500/15 text-sky-300"
          title="Schwierigkeit (SAC)"
          subtitle="Wege nach T1–T6 eingefärbt · ab Zoom 13"
          right={<Toggle checked={sacTrails} onChange={onSacTrails} label="Schwierigkeit SAC" />}
        />
        {sacTrails && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-4 pb-3 pt-1 text-[11.5px] text-slate-300">
            {(Object.keys(SAC_GRADES) as unknown as SacGrade[]).map((k) => {
              const g = SAC_GRADES[k];
              return (
                <span key={k} className="flex items-center gap-1.5" title={g.name}>
                  <svg width="22" height="6" aria-hidden="true">
                    <line x1="1" y1="3" x2="21" y2="3" stroke="#fff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
                    <line x1="1" y1="3" x2="21" y2="3" stroke={g.color} strokeWidth="2.5" strokeDasharray={g.dash ? g.dash.split(' ').map((n) => Number(n) * 0.6).join(' ') : undefined} />
                  </svg>
                  {g.label}
                </span>
              );
            })}
          </div>
        )}
        <Row icon={<Mountain className="h-[18px] w-[18px]" />} iconBg="bg-amber-500/15 text-amber-300" title="Gipfel & Hütten" subtitle="Inkl. Live-Daten aus OpenStreetMap" right={<Toggle checked={showPOIs} onChange={onShowPOIs} label="Gipfel und Hütten" />} />
      </Section>

      {!hasMapboxToken && (
        <Section>
          <Row icon={<KeyRound className="h-[18px] w-[18px]" />} title="Mapbox-Karten freischalten" subtitle="Token unter Mehr › API-Schlüssel hinterlegen" onClick={onOpenSettings} />
        </Section>
      )}
    </Sheet>
  );
}
