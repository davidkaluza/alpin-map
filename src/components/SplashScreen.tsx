import { motion } from 'motion/react';

/** Animated intro: the mountain ridge draws itself, then the overlay fades away. */
export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[5000] grid place-items-center bg-slate-950"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(16,185,129,0.22),transparent_60%)]" />
      <div className="relative flex flex-col items-center">
        <svg viewBox="0 0 512 512" className="h-36 w-36">
          <defs>
            <linearGradient id="splashLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 25 410 L 128 256 L 205 333 L 307 205 L 399 307 L 487 410 Z"
            fill="rgba(100,116,139,0.35)"
            stroke="#475569"
            strokeWidth={6}
            strokeLinejoin="round"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <motion.path
            d="M 10 420 Q 60 420 90 360 L 180 190 L 245 285 L 348 110 L 430 265 L 502 420"
            stroke="url(#splashLine)"
            strokeWidth={20}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
            style={{ filter: 'drop-shadow(0 0 18px rgba(16,185,129,0.6))' }}
          />
          <motion.circle
            cx={348}
            cy={70}
            r={16}
            fill="#ecfdf5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 1.05, stiffness: 300, damping: 12 }}
            style={{ filter: 'drop-shadow(0 0 14px #34d399)' }}
          />
        </svg>
        <motion.div
          className="mt-4 text-[22px] font-bold tracking-[0.32em] text-white"
          initial={{ opacity: 0, letterSpacing: '0.6em' }}
          animate={{ opacity: 1, letterSpacing: '0.32em' }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          ALPIN MAP
        </motion.div>
        <motion.div className="mt-1 text-[13px] text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          Outdoor GPS & Wanderkarte
        </motion.div>
      </div>
    </motion.div>
  );
}
