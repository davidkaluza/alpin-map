import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { formatCoord } from '../lib/geo';

export function CenterHud({ lat, lng, elevation, topOffset }: { lat: number; lng: number; elevation: number | null; topOffset: string }) {
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-white/70 drop-shadow">
        <Plus className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="glass pointer-events-auto absolute left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1.5 text-[12px] font-medium tabular-nums text-slate-200"
        style={{ top: topOffset }}
        data-selectable
      >
        {formatCoord(lat, lng, 4)}
        {elevation !== null && <span className="ml-2 text-amber-300">{elevation} m</span>}
      </motion.div>
    </>
  );
}
