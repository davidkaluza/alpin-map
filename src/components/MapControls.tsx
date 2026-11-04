import { motion } from 'motion/react';
import { Layers, LocateFixed, Locate, Navigation2, Plus, Minus } from 'lucide-react';
import { Fab } from './ui/controls';

export type LocateState = 'off' | 'shown' | 'follow';

interface Props {
  locate: LocateState;
  locating: boolean;
  onLocate: () => void;
  onLayers: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  layersBadge?: boolean;
  /** height (px) of the panel sitting on top of the dock */
  bottomOffset: number;
}

export function MapControls({ locate, locating, onLocate, onLayers, onZoomIn, onZoomOut, layersBadge, bottomOffset }: Props) {
  return (
    <motion.div
      className="absolute z-20 flex flex-col items-center gap-2.5 transition-[bottom] duration-500 ease-[var(--ease-spring)]"
      style={{ right: 'calc(var(--safe-right) + 12px)', bottom: `calc(var(--dock-h) + ${bottomOffset + 12}px)` }}
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.25 }}
    >
      <Fab label="Kartenebenen" onClick={onLayers} badge={layersBadge}>
        <Layers className="h-[21px] w-[21px]" />
      </Fab>
      <Fab label={locate === 'follow' ? 'Mitführen beenden' : 'Mein Standort'} active={locate === 'follow'} onClick={onLocate}>
        {locating ? (
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
            <Locate className="h-[21px] w-[21px]" />
          </motion.span>
        ) : locate === 'follow' ? (
          <Navigation2 className="h-[21px] w-[21px] fill-current" />
        ) : (
          <LocateFixed className={`h-[21px] w-[21px] ${locate === 'shown' ? 'text-emerald-300' : ''}`} />
        )}
      </Fab>
      <div className="glass flex flex-col overflow-hidden rounded-full">
        <motion.button whileTap={{ scale: 0.85 }} onClick={onZoomIn} aria-label="Hineinzoomen" className="grid h-12 w-12 place-items-center text-slate-100">
          <Plus className="h-5 w-5" />
        </motion.button>
        <div className="mx-3 h-px bg-white/10" />
        <motion.button whileTap={{ scale: 0.85 }} onClick={onZoomOut} aria-label="Herauszoomen" className="grid h-12 w-12 place-items-center text-slate-100">
          <Minus className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
