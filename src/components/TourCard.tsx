import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Clock, Focus, Maximize2, Mountain, Play, TrendingDown, TrendingUp, X } from 'lucide-react';
import type { Coordinate, Tour } from '../types';
import { ElevationProfile } from './ElevationProfile';
import { Button, Chip } from './ui/controls';
import { formatHours } from '../lib/geo';
import { DIFFICULTY_TONE } from '../lib/categories';
import { useElementHeight } from '../hooks/useElementHeight';

interface Props {
  tour: Tour;
  hoverCoordinate: Coordinate | null;
  onHoverCoordinate: (c: Coordinate | null) => void;
  onSelectCoordinate: (c: Coordinate) => void;
  onClose: () => void;
  onStart: () => void;
  onOpenProfile: () => void;
  onFit: () => void;
  onHeight: (h: number) => void;
}

export function TourCard({ tour, hoverCoordinate, onHoverCoordinate, onSelectCoordinate, onClose, onStart, onOpenProfile, onFit, onHeight }: Props) {
  const [expanded, setExpanded] = useState(false);
  const ref = useElementHeight<HTMLDivElement>(onHeight);
  const hasTrack = tour.coordinates.length > 1;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-x-0 z-20 px-3"
      style={{ bottom: 'calc(var(--dock-h) + 8px)' }}
      initial={{ y: 40, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 40, opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
    >
      <div className="glass mx-auto max-w-xl overflow-hidden rounded-[24px]">
        <div className="flex items-start gap-3 p-3.5 pb-2.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25"
            aria-label={expanded ? 'Profil einklappen' : 'Profil ausklappen'}
          >
            {hasTrack ? (
              <motion.span animate={{ rotate: expanded ? 180 : 0 }}>
                <ChevronDown className="h-5 w-5" />
              </motion.span>
            ) : (
              <Mountain className="h-5 w-5" />
            )}
          </motion.button>
          <div className="min-w-0 flex-1" onClick={() => hasTrack && setExpanded((v) => !v)}>
            <div className="truncate text-[15px] font-semibold text-white">{tour.title}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip tone="slate">{tour.distanceKm.toLocaleString('de-DE')} km</Chip>
              <Chip tone="emerald" icon={<TrendingUp className="h-3 w-3" />}>
                {tour.ascentM} m
              </Chip>
              <Chip tone="sky" icon={<TrendingDown className="h-3 w-3" />}>
                {tour.descentM} m
              </Chip>
              <Chip tone="slate" icon={<Clock className="h-3 w-3" />}>
                {formatHours(tour.estimatedHours)}
              </Chip>
              <Chip tone={DIFFICULTY_TONE[tour.difficulty]}>{tour.difficulty}</Chip>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
            aria-label="Tour schließen"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-slate-300"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && hasTrack && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="overflow-hidden"
            >
              <div className="px-2">
                <ElevationProfile tour={tour} compact hoverCoordinate={hoverCoordinate} onHoverCoordinate={onHoverCoordinate} onSelectCoordinate={onSelectCoordinate} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 px-3.5 pb-3.5 pt-1">
          <Button variant="primary" size="sm" className="flex-1" icon={<Play className="h-4 w-4 fill-current" />} onClick={onStart} disabled={!hasTrack}>
            Los geht’s
          </Button>
          <Button size="sm" icon={<Maximize2 className="h-4 w-4" />} onClick={onOpenProfile} disabled={!hasTrack}>
            Profil
          </Button>
          <Button size="sm" icon={<Focus className="h-4 w-4" />} onClick={onFit} aria-label="Auf Tour zoomen" />
        </div>
      </div>
    </motion.div>
  );
}
