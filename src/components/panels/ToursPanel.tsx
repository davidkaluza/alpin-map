import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Download, FileUp, Mountain, PenLine, Search, Trash2, Route as RouteIcon, CircleDot } from 'lucide-react';
import type { Tour } from '../../types';
import { SAMPLE_TOURS } from '../../data/sampleRoutes';
import { exportGPX, parseGPX } from '../../services/gpx';
import { Button, Chip, EmptyState, Section, inputClass } from '../ui/controls';
import { useToast } from '../ui/Toast';
import { DIFFICULTY_TONE } from '../../lib/categories';
import { formatHours } from '../../lib/geo';

interface Props {
  selectedId: string | null;
  customTours: Tour[];
  onSelect: (tour: Tour | null) => void;
  onImport: (tour: Tour) => void;
  onDelete: (id: string) => void;
  onStartDraw: () => void;
}

export function ToursPanel({ selectedId, customTours, onSelect, onImport, onDelete, onStartDraw }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const toast = useToast();

  const filter = (list: Tour[]) => {
    const q = query.trim().toLowerCase();
    return q ? list.filter((t) => `${t.title} ${t.region}`.toLowerCase().includes(q)) : list;
  };
  const mine = useMemo(() => filter(customTours), [customTours, query]); // eslint-disable-line react-hooks/exhaustive-deps
  const samples = useMemo(() => filter(SAMPLE_TOURS), [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    let last: Tour | null = null;
    for (const file of Array.from(files)) {
      try {
        const tour = parseGPX(await file.text(), file.name);
        onImport(tour);
        last = tour;
      } catch (e) {
        toast(`${file.name}: ${(e as Error).message}`, 'error');
      }
    }
    if (last) {
      toast(files.length > 1 ? `${files.length} GPX-Dateien importiert` : `„${last.title}“ importiert`);
      onSelect(last);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const TourRow = ({ t, custom }: { t: Tour; custom?: boolean }) => {
    const active = t.id === selectedId;
    return (
      <motion.div layout className={`relative flex items-center gap-3 px-4 py-3 ${active ? 'bg-emerald-400/[0.08]' : ''}`}>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => onSelect(active ? null : t)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${active ? 'bg-emerald-400 text-slate-950 ring-emerald-300' : 'bg-white/[0.07] text-slate-300 ring-white/10'}`}>
            {active ? <Check className="h-5 w-5" strokeWidth={3} /> : t.isRecorded ? <CircleDot className="h-5 w-5" /> : custom ? <RouteIcon className="h-5 w-5" /> : <Mountain className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`truncate text-[15px] font-medium ${active ? 'text-emerald-300' : 'text-slate-100'}`}>{t.title}</div>
            <div className="truncate text-[13px] text-slate-400">
              {t.distanceKm.toLocaleString('de-DE')} km · ↑{t.ascentM} m · {formatHours(t.estimatedHours)}
            </div>
          </div>
        </motion.button>
        {custom ? (
          <div className="flex shrink-0 items-center gap-1">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => exportGPX(t)} aria-label="Als GPX exportieren" className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white">
              <Download className="h-[18px] w-[18px]" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => (confirmDelete === t.id ? (onDelete(t.id), setConfirmDelete(null)) : setConfirmDelete(t.id))}
              aria-label="Tour löschen"
              className={`grid h-9 shrink-0 place-items-center rounded-full transition-all ${confirmDelete === t.id ? 'w-auto bg-rose-500 px-3 text-[12px] font-semibold text-white' : 'w-9 text-slate-400 hover:bg-white/10 hover:text-rose-300'}`}
            >
              {confirmDelete === t.id ? 'Löschen?' : <Trash2 className="h-[18px] w-[18px]" />}
            </motion.button>
          </div>
        ) : (
          <Chip tone={DIFFICULTY_TONE[t.difficulty]}>{t.difficulty}</Chip>
        )}
      </motion.div>
    );
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button icon={<FileUp className="h-[18px] w-[18px]" />} onClick={() => fileRef.current?.click()}>
          GPX importieren
        </Button>
        <Button icon={<PenLine className="h-[18px] w-[18px]" />} onClick={onStartDraw}>
          Route zeichnen
        </Button>
        <input ref={fileRef} type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Touren durchsuchen" className={`${inputClass} pl-11`} />
      </div>

      <Section title={`Meine Touren (${customTours.length})`}>
        <AnimatePresence initial={false}>
          {mine.length ? (
            mine.map((t) => <TourRow key={t.id} t={t} custom />)
          ) : (
            <EmptyState icon={<RouteIcon className="h-6 w-6" />} title={query ? 'Keine Treffer' : 'Noch keine eigenen Touren'} text={query ? undefined : 'Importiere eine GPX-Datei, zeichne eine Route oder zeichne unterwegs einen Track auf.'} />
          )}
        </AnimatePresence>
      </Section>

      <Section title="Tourenvorschläge">
        {samples.length ? samples.map((t) => <TourRow key={t.id} t={t} />) : <EmptyState icon={<Search className="h-6 w-6" />} title="Keine Treffer" />}
      </Section>
    </div>
  );
}
