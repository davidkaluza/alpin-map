import { AnimatePresence, motion } from 'motion/react';
import { Mountain, Sunset, Sunrise, WifiOff, CloudOff } from 'lucide-react';
import { formatClock, formatRelative, getSunTimes } from '../lib/geo';

interface Props {
  lat: number;
  lng: number;
  elevation: number | null;
  elevationLabel: string;
  online: boolean;
  offlineMode: boolean;
  hidden?: boolean;
  onOpenOffline: () => void;
}

export function TopBar({ lat, lng, elevation, elevationLabel, online, offlineMode, hidden, onOpenOffline }: Props) {
  const sun = getSunTimes(lat, lng);
  const now = Date.now();
  const showSunrise = sun.sunrise && sun.sunset && (now > sun.sunset.getTime() || now < sun.sunrise.getTime());
  const nextSunrise = showSunrise && sun.sunrise && now > sun.sunset!.getTime() ? new Date(sun.sunrise.getTime() + 86400000) : sun.sunrise;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3"
          style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="glass pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-[22px] px-3.5 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-700/20 ring-1 ring-emerald-400/30">
                <svg viewBox="0 0 100 100" className="h-6 w-6">
                  <path d="M0 82 Q12 82 18 70 L35 38 L48 56 L68 22 L84 52 L100 82" stroke="#34d399" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="68" cy="12" r="5" fill="#ecfdf5" />
                </svg>
                <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-900 ${online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold tracking-[0.14em] text-white">ALPIN MAP</div>
                <div className="flex items-center gap-1 truncate text-[12px] text-slate-400">
                  <Mountain className="h-3 w-3 shrink-0 text-amber-400" />
                  <span className="tabular-nums">{elevation !== null ? `${elevation.toLocaleString('de-DE')} m` : '– m'}</span>
                  <span className="truncate text-slate-500">· {elevationLabel}</span>
                </div>
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {(!online || offlineMode) && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onOpenOffline}
                  className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/30"
                >
                  {online ? <CloudOff className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                  Offline
                </motion.button>
              )}
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-[13px] font-semibold tabular-nums text-white">
                  {showSunrise ? <Sunrise className="h-3.5 w-3.5 text-amber-300" /> : <Sunset className="h-3.5 w-3.5 text-amber-400" />}
                  {sun.polar === 'day' ? 'Polartag' : sun.polar === 'night' ? 'Polarnacht' : formatClock((showSunrise ? nextSunrise : sun.sunset)!)}
                </div>
                <div className="text-[11px] text-amber-300/80">
                  {sun.polar ? '' : formatRelative((showSunrise ? nextSunrise! : sun.sunset!).getTime() - now)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
