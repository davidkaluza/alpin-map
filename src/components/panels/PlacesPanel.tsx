import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Crosshair, LocateFixed, MapPin, Plus, Trash2 } from 'lucide-react';
import type { Coordinate, Tour, Waypoint, WaypointCategory } from '../../types';
import { CATEGORIES, CATEGORY_ORDER } from '../../lib/categories';
import { Button, EmptyState, Field, SegmentedTabs, Section, inputClass } from '../ui/controls';
import { getElevationForCoords } from '../../services/elevationService';
import { formatCoord, uid } from '../../lib/geo';
import { useToast } from '../ui/Toast';

interface Props {
  tour: Tour | null;
  places: Waypoint[];
  mapCenter: Coordinate;
  gpsPosition: Coordinate | null;
  onAdd: (wp: Waypoint) => void;
  onDelete: (id: string) => void;
  onFocus: (wp: Waypoint) => void;
}

export function PlacesPanel({ tour, places, mapCenter, gpsPosition, onAdd, onDelete, onFocus }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<WaypointCategory>('viewpoint');
  const [source, setSource] = useState<'center' | 'gps'>(gpsPosition ? 'gps' : 'center');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const pos = source === 'gps' && gpsPosition ? gpsPosition : mapCenter;

  const save = async () => {
    setBusy(true);
    const ele = pos.ele ?? (await getElevationForCoords(pos.lat, pos.lng)) ?? undefined;
    onAdd({
      id: uid('place'),
      name: name.trim() || CATEGORIES[category].label,
      category,
      lat: pos.lat,
      lng: pos.lng,
      ele,
    });
    toast(`„${name.trim() || CATEGORIES[category].label}“ gespeichert`);
    setName('');
    setBusy(false);
  };

  return (
    <div>
      <Section title="Neuer Ort">
        <div className="space-y-4 p-4">
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={`z. B. ${CATEGORIES[category].label} am Grat`} maxLength={80} />
          </Field>
          <div>
            <span className="mb-1.5 block px-1 text-[13px] font-medium text-slate-300">Kategorie</span>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_ORDER.map((c) => {
                const meta = CATEGORIES[c];
                const active = c === category;
                return (
                  <motion.button
                    key={c}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setCategory(c)}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold ring-1 transition-colors ${active ? 'bg-white/[0.12] text-white ring-white/25' : 'bg-white/[0.04] text-slate-400 ring-white/5'}`}
                  >
                    <meta.Icon className="h-5 w-5" style={{ color: meta.color }} />
                    {meta.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block px-1 text-[13px] font-medium text-slate-300">Position</span>
            <SegmentedTabs
              layoutId="place-source"
              value={source}
              onChange={setSource}
              items={[
                { id: 'center', label: 'Kartenmitte', icon: <Crosshair className="h-4 w-4" /> },
                { id: 'gps', label: 'Mein Standort', icon: <LocateFixed className="h-4 w-4" /> },
              ]}
            />
            <div className="mt-2 px-1 text-[12px] tabular-nums text-slate-500">
              {source === 'gps' && !gpsPosition ? 'Kein GPS-Signal – Kartenmitte wird verwendet. ' : ''}
              {formatCoord(pos.lat, pos.lng)}
            </div>
          </div>
          <Button variant="primary" block icon={<Plus className="h-[18px] w-[18px]" />} onClick={save} disabled={busy}>
            {busy ? 'Speichere …' : 'Ort speichern'}
          </Button>
        </div>
      </Section>

      <Section title={`Meine Orte (${places.length})`}>
        <AnimatePresence initial={false}>
          {places.length ? (
            places.map((wp) => <PlaceRow key={wp.id} wp={wp} onFocus={onFocus} onDelete={onDelete} />)
          ) : (
            <EmptyState icon={<MapPin className="h-6 w-6" />} title="Noch keine Orte" text="Speichere Quellen, Aussichtspunkte oder Parkplätze – sie erscheinen dauerhaft auf der Karte." />
          )}
        </AnimatePresence>
      </Section>

      {tour && tour.waypoints.length > 0 && (
        <Section title={`Wegpunkte · ${tour.title}`}>
          {tour.waypoints.map((wp) => (
            <PlaceRow key={wp.id} wp={wp} onFocus={onFocus} />
          ))}
        </Section>
      )}
    </div>
  );
}

function PlaceRow({ wp, onFocus, onDelete }: { wp: Waypoint; onFocus: (wp: Waypoint) => void; onDelete?: (id: string) => void }) {
  const meta = CATEGORIES[wp.category] ?? CATEGORIES.info;
  return (
    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 px-4 py-2.5">
      <button onClick={() => onFocus(wp)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${meta.color}22`, color: meta.color }}>
          <meta.Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium text-slate-100">{wp.name}</div>
          <div className="truncate text-[13px] text-slate-400">
            {meta.label}
            {wp.ele !== undefined && ` · ${Math.round(wp.ele)} m`}
          </div>
        </div>
      </button>
      {onDelete && (
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onDelete(wp.id)} aria-label="Ort löschen" className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-rose-300">
          <Trash2 className="h-[18px] w-[18px]" />
        </motion.button>
      )}
    </motion.div>
  );
}
