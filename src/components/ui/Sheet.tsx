import React, { useEffect, useId } from 'react';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { haptic } from '../../lib/haptics';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  /** Visual accent of the header icon */
  tone?: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  /** content rendered between header and scroll area (e.g. tabs) */
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  /** 'auto' grows with content, 'tall' always uses most of the screen */
  size?: 'auto' | 'tall';
  children: React.ReactNode;
  zIndex?: number;
}

const TONES: Record<NonNullable<SheetProps['tone']>, string> = {
  emerald: 'from-emerald-400/25 to-emerald-600/10 text-emerald-300 ring-emerald-400/30',
  amber: 'from-amber-400/25 to-amber-600/10 text-amber-300 ring-amber-400/30',
  rose: 'from-rose-400/25 to-rose-600/10 text-rose-300 ring-rose-400/30',
  sky: 'from-sky-400/25 to-sky-600/10 text-sky-300 ring-sky-400/30',
  slate: 'from-slate-400/20 to-slate-600/10 text-slate-200 ring-white/15',
};

/**
 * The one and only modal surface of the app.
 * Phone: bottom sheet with drag-to-dismiss. Tablet/Desktop: centred floating panel.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  tone = 'emerald',
  toolbar,
  footer,
  size = 'auto',
  children,
  zIndex = 1000,
}: SheetProps) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const drag = useDragControls();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) {
      haptic(6);
      onClose();
    }
  };

  const heightClass = isWide
    ? size === 'tall'
      ? 'h-[min(86dvh,820px)]'
      : 'max-h-[min(86dvh,820px)]'
    : size === 'tall'
      ? 'h-[calc(100dvh-var(--safe-top)-12px)]'
      : 'max-h-[calc(100dvh-var(--safe-top)-12px)]';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex }} role="presentation">
          <motion.div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <div className={`absolute inset-0 flex pointer-events-none ${isWide ? 'items-center justify-center p-6' : 'items-end'}`}>
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={`pointer-events-auto glass-strong text-slate-100 flex flex-col overflow-hidden w-full ${heightClass} ${
                isWide ? 'max-w-2xl rounded-[28px]' : 'rounded-t-[32px] border-b-0'
              }`}
              initial={isWide ? { opacity: 0, scale: 0.94, y: 24 } : { y: '100%' }}
              animate={isWide ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
              exit={isWide ? { opacity: 0, scale: 0.96, y: 16 } : { y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.9 }}
              drag={isWide ? false : 'y'}
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.7 }}
              onDragEnd={onDragEnd}
            >
              {/* Header – also the drag handle on phones */}
              <header
                className="shrink-0 px-5 pt-2.5 pb-3 touch-none select-none"
                onPointerDown={(e) => !isWide && drag.start(e)}
              >
                {!isWide && <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/25" />}
                <div className="flex items-center gap-3">
                  {icon && (
                    <motion.div
                      initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.08, damping: 14, stiffness: 260 }}
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ring-1 ${TONES[tone]}`}
                    >
                      {icon}
                    </motion.div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 id={titleId} className="truncate text-[17px] font-semibold tracking-tight text-white">
                      {title}
                    </h2>
                    {subtitle && <div className="truncate text-[13px] text-slate-400">{subtitle}</div>}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onClose}
                    aria-label="Schließen"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  </motion.button>
                </div>
              </header>
              {toolbar && <div className="shrink-0 px-5 pb-3">{toolbar}</div>}
              <div className={`scroll-area flex-1 px-5 ${footer ? 'pb-4' : isWide ? 'pb-6' : 'pb-safe'}`}>{children}</div>
              {footer && <footer className={`shrink-0 border-t border-white/5 px-5 pt-3 ${isWide ? 'pb-5' : 'pb-safe'}`}>{footer}</footer>}
            </motion.section>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
