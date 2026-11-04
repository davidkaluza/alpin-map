import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigation2, Pause, Play, Square, CircleDot, AlertTriangle, Gauge } from 'lucide-react';
import type { NavigationStatus } from '../types';
import { AnimatedNumber } from './ui/controls';
import { formatDuration } from '../lib/geo';
import { useElementHeight } from '../hooks/useElementHeight';
import { haptic } from '../lib/haptics';

interface Props {
  nav: NavigationStatus;
  onPause: () => void;
  onStop: () => void;
  onToggleRecord: () => void;
  onSos: () => void;
  onHeight: (h: number) => void;
}

export function NavBanner({ nav }: { nav: NavigationStatus }) {
  const off = nav.offRouteM !== null && nav.offRouteM > 60;
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3"
      style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        className={`pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-[24px] px-4 py-3 shadow-2xl ring-1 transition-colors duration-500 ${
          off ? 'bg-amber-500/95 text-slate-950 ring-amber-300' : 'bg-emerald-600/95 text-white ring-emerald-300/40'
        }`}
      >
        <motion.div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/15" animate={{ rotate: nav.heading }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
          {off ? <AlertTriangle className="h-6 w-6" /> : <Navigation2 className="h-6 w-6 fill-current" />}
        </motion.div>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={nav.currentInstruction}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-[16px] font-semibold leading-snug"
            >
              {nav.currentInstruction}
            </motion.div>
          </AnimatePresence>
          <div className={`mt-0.5 flex items-center gap-2 text-[12px] font-medium ${off ? 'text-slate-900/70' : 'text-emerald-100/80'}`}>
            <span>{nav.mode === 'simulation' ? 'Simulation' : 'GPS'}</span>
            {nav.accuracyM !== null && nav.mode === 'gps' && <span>· ±{nav.accuracyM} m</span>}
            {nav.isPaused && <span className="rounded-full bg-black/20 px-2">Pausiert</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NavPanel({ nav, onPause, onStop, onToggleRecord, onSos, onHeight }: Props) {
  const ref = useElementHeight<HTMLDivElement>(onHeight);
  const total = nav.distanceCoveredKm + nav.distanceRemainingKm;
  const pct = total > 0 ? Math.min(100, (nav.distanceCoveredKm / total) * 100) : 0;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-x-0 z-20 px-3"
      style={{ bottom: 'calc(var(--dock-h) + 8px)' }}
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      <div className="glass mx-auto max-w-xl overflow-hidden rounded-[24px]">
        {total > 0 && (
          <div className="h-1 bg-white/10">
            <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300" animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
          </div>
        )}
        <div className="grid grid-cols-4 gap-1 px-3 pt-3 text-center">
          <Metric label="Zeit" value={formatDuration(nav.elapsedSeconds)} />
          <Metric label="Strecke" value={<AnimatedNumber value={nav.distanceCoveredKm} decimals={2} />} unit="km" />
          <Metric label={total > 0 ? 'Rest' : 'Höhe'} value={total > 0 ? <AnimatedNumber value={nav.distanceRemainingKm} decimals={1} /> : nav.currentPosition?.ele ?? '–'} unit={total > 0 ? 'km' : 'm'} />
          <Metric label="Tempo" value={<AnimatedNumber value={nav.speedKmh} decimals={1} />} unit="km/h" icon={<Gauge className="h-3 w-3" />} />
        </div>
        <div className="flex items-center gap-2 p-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              haptic(10);
              onPause();
            }}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold ${nav.isPaused ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}
          >
            {nav.isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
            {nav.isPaused ? 'Weiter' : 'Pause'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onToggleRecord}
            aria-label={nav.isRecording ? 'Aufzeichnung pausieren' : 'Aufzeichnung starten'}
            className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${nav.isRecording ? 'bg-rose-500/20 text-rose-300 ring-rose-400/40' : 'bg-white/10 text-slate-300 ring-white/10'}`}
          >
            <CircleDot className={`h-5 w-5 ${nav.isRecording ? 'animate-pulse' : ''}`} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.92 }} onClick={onSos} aria-label="Notfall" className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-600 text-[12px] font-bold text-white">
            SOS
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              haptic([10, 40, 10]);
              onStop();
            }}
            aria-label="Navigation beenden"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-slate-200 ring-1 ring-white/10"
          >
            <Square className="h-4 w-4 fill-current" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, unit, icon }: { label: string; value: ReactNode; unit?: string; icon?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-[18px] font-semibold tabular-nums text-white">
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-medium text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}
