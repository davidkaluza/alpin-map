import { Clock, Mountain, MoveVertical, Ruler, TrendingDown, TrendingUp } from 'lucide-react';
import type { Coordinate, Tour } from '../../types';
import { Sheet } from '../ui/Sheet';
import { Stat } from '../ui/controls';
import { ElevationProfile } from '../ElevationProfile';
import { formatHours } from '../../lib/geo';

interface Props {
  open: boolean;
  onClose: () => void;
  tour: Tour | null;
  hoverCoordinate: Coordinate | null;
  onHoverCoordinate: (c: Coordinate | null) => void;
  onSelectCoordinate: (c: Coordinate) => void;
  progressIndex: number | null;
}

export function ElevationSheet({ open, onClose, tour, hoverCoordinate, onHoverCoordinate, onSelectCoordinate, progressIndex }: Props) {
  const eles = tour?.coordinates.map((c) => c.ele).filter((e): e is number => e !== undefined) ?? [];
  const max = eles.length ? Math.round(Math.max(...eles)) : 0;
  const min = eles.length ? Math.round(Math.min(...eles)) : 0;
  return (
    <Sheet open={open && !!tour} onClose={onClose} title="Höhenprofil" subtitle={tour?.title} icon={<Mountain className="h-5 w-5" />}>
      {tour && (
        <>
          <div className="mb-4 rounded-[20px] bg-white/[0.04] p-2 ring-1 ring-white/[0.06]">
            <ElevationProfile tour={tour} hoverCoordinate={hoverCoordinate} onHoverCoordinate={onHoverCoordinate} onSelectCoordinate={onSelectCoordinate} progressIndex={progressIndex} />
          </div>
          <p className="mb-4 px-1 text-[12px] text-slate-500">Finger über das Profil ziehen – die Position wird auf der Karte markiert.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Distanz" value={tour.distanceKm} decimals={1} unit="km" icon={<Ruler className="h-3 w-3" />} />
            <Stat label="Gehzeit" value={formatHours(tour.estimatedHours)} icon={<Clock className="h-3 w-3" />} />
            <Stat label="Aufstieg" value={tour.ascentM} unit="m" icon={<TrendingUp className="h-3 w-3" />} tone="text-emerald-300" />
            <Stat label="Abstieg" value={tour.descentM} unit="m" icon={<TrendingDown className="h-3 w-3" />} tone="text-sky-300" />
            <Stat label="Höchster Punkt" value={max} unit="m" icon={<Mountain className="h-3 w-3" />} tone="text-amber-300" />
            <Stat label="Tiefster Punkt" value={min} unit="m" icon={<MoveVertical className="h-3 w-3" />} />
          </div>
          {tour.description && <p className="mt-4 px-1 text-[14px] leading-relaxed text-slate-300">{tour.description}</p>}
        </>
      )}
    </Sheet>
  );
}
