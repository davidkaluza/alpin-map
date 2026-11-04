import { motion } from 'motion/react';
import { Map, Navigation, MapPin, DownloadCloud, SlidersHorizontal } from 'lucide-react';
import { haptic } from '../lib/haptics';

export type MenuTab = 'tours' | 'nav' | 'places' | 'offline' | 'settings';

const ITEMS: { id: MenuTab; label: string; Icon: typeof Map }[] = [
  { id: 'tours', label: 'Touren', Icon: Map },
  { id: 'nav', label: 'Navigation', Icon: Navigation },
  { id: 'places', label: 'Orte', Icon: MapPin },
  { id: 'offline', label: 'Offline', Icon: DownloadCloud },
  { id: 'settings', label: 'Mehr', Icon: SlidersHorizontal },
];

interface Props {
  active: MenuTab | null;
  onSelect: (tab: MenuTab) => void;
  navLive: boolean;
}

/** Bottom tab bar – the single entry point to every menu. */
export function Dock({ active, onSelect, navLive }: Props) {
  return (
    <motion.nav
      className="absolute inset-x-0 bottom-0 z-30 px-3"
      style={{ paddingBottom: 'max(var(--safe-bottom), 10px)' }}
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.15 }}
      aria-label="Hauptmenü"
    >
      <div className="glass-strong mx-auto flex h-[60px] max-w-xl items-stretch justify-around rounded-[26px] px-1.5">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => {
                haptic(6);
                onSelect(id);
              }}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl"
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="dock-pill"
                  className="absolute inset-x-1 inset-y-1.5 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-400/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <motion.span whileTap={{ scale: 0.8, y: 2 }} className="relative">
                <Icon className={`h-[22px] w-[22px] transition-colors ${isActive ? 'text-emerald-300' : 'text-slate-300'}`} strokeWidth={isActive ? 2.4 : 2} />
                {id === 'nav' && navLive && (
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                )}
              </motion.span>
              <span className={`relative text-[10.5px] font-semibold transition-colors ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
