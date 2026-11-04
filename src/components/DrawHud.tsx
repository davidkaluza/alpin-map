import { motion } from 'motion/react';
import { Check, PenLine, Undo2, X } from 'lucide-react';
import type { Coordinate } from '../types';
import { Button, AnimatedNumber } from './ui/controls';
import { computeTrackStats } from '../lib/geo';
import { useElementHeight } from '../hooks/useElementHeight';

interface Props {
  points: Coordinate[];
  saving: boolean;
  onUndo: () => void;
  onCancel: () => void;
  onSave: () => void;
  onHeight: (h: number) => void;
}

export function DrawHud({ points, saving, onUndo, onCancel, onSave, onHeight }: Props) {
  const ref = useElementHeight<HTMLDivElement>(onHeight);
  const stats = computeTrackStats(points);
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
      <div className="glass mx-auto max-w-xl rounded-[24px] p-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
            <PenLine className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-white">Route zeichnen</div>
            <div className="text-[13px] text-slate-400">
              {points.length === 0 ? (
                'Tippe auf die Karte, um Punkte zu setzen'
              ) : (
                <>
                  {points.length} Punkte · <AnimatedNumber value={stats.distanceKm} decimals={1} /> km
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" icon={<X className="h-4 w-4" />} onClick={onCancel}>
            Abbrechen
          </Button>
          <Button size="sm" icon={<Undo2 className="h-4 w-4" />} onClick={onUndo} disabled={points.length === 0} aria-label="Letzten Punkt entfernen" />
          <Button variant="primary" size="sm" className="flex-1" icon={<Check className="h-4 w-4" />} onClick={onSave} disabled={points.length < 2 || saving}>
            {saving ? 'Speichere …' : 'Speichern'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
