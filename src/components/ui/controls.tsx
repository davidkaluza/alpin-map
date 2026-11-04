import React, { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useTransform, type HTMLMotionProps } from 'motion/react';
import { haptic } from '../../lib/haptics';

/* ---------------- Button ---------------- */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning';
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.7)] hover:from-emerald-300 hover:to-emerald-500',
  secondary: 'bg-white/[0.08] text-slate-100 ring-1 ring-white/10 hover:bg-white/[0.12]',
  danger: 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_8px_24px_-8px_rgba(244,63,94,0.7)] hover:from-rose-400',
  warning: 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.6)]',
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  block?: boolean;
  children?: React.ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', icon, block, className = '', children, onClick, disabled, ...rest }: ButtonProps) {
  const sizes = { sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl', md: 'h-11 px-4 text-[15px] gap-2 rounded-2xl', lg: 'h-[52px] px-5 text-base gap-2 rounded-2xl' };
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={(e) => {
        haptic();
        onClick?.(e);
      }}
      disabled={disabled}
      className={`inline-flex select-none items-center justify-center font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children !== undefined && <span className="truncate">{children}</span>}
    </motion.button>
  );
}

/* ---------------- Round map button ---------------- */

export interface FabProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  active?: boolean;
  label: string;
  children: React.ReactNode;
  badge?: boolean;
}

export function Fab({ active, label, children, className = '', badge, onClick, ...rest }: FabProps) {
  return (
    <motion.button
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.86 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}
      onClick={(e) => {
        haptic();
        onClick?.(e);
      }}
      className={`relative grid h-12 w-12 place-items-center rounded-full transition-colors ${
        active ? 'bg-emerald-500 text-slate-950 shadow-[0_10px_28px_-6px_rgba(16,185,129,0.8)]' : 'glass text-slate-100'
      } ${className}`}
      {...rest}
    >
      {children}
      {badge && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />}
    </motion.button>
  );
}

/* ---------------- Segmented tabs ---------------- */

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  layoutId,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  return (
    <div className="scroll-area flex gap-1 overflow-x-auto rounded-2xl bg-white/[0.06] p-1 ring-1 ring-white/5" role="tablist">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              haptic(5);
              onChange(it.id);
            }}
            className={`relative flex min-w-fit flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
              active ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-emerald-400 shadow-[0_6px_18px_-6px_rgba(16,185,129,0.9)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {it.icon}
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Toggle ---------------- */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic(6);
        onChange(!checked);
      }}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-emerald-500' : 'bg-white/15'}`}
    >
      <motion.span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
      />
    </button>
  );
}

/* ---------------- Grouped list ---------------- */

export function Section({ title, children, footer, className = '' }: { title?: string; children: React.ReactNode; footer?: React.ReactNode; className?: string }) {
  return (
    <section className={`mb-5 ${className}`}>
      {title && <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</h3>}
      <div className="overflow-hidden rounded-[20px] bg-white/[0.045] ring-1 ring-white/[0.06] divide-y divide-white/[0.06]">{children}</div>
      {footer && <p className="mt-2 px-1 text-[12px] leading-relaxed text-slate-500">{footer}</p>}
    </section>
  );
}

export interface RowProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
}

export function Row({ icon, iconBg = 'bg-white/10 text-slate-200', title, subtitle, right, onClick, active, danger }: RowProps) {
  const content = (
    <>
      {icon && <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconBg}`}>{icon}</div>}
      <div className="min-w-0 flex-1 text-left">
        <div className={`truncate text-[15px] font-medium ${danger ? 'text-rose-300' : active ? 'text-emerald-300' : 'text-slate-100'}`}>{title}</div>
        {subtitle && <div className="truncate text-[13px] text-slate-400">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </>
  );
  const cls = `flex w-full items-center gap-3 px-4 py-3 min-h-[56px] ${active ? 'bg-emerald-400/[0.08]' : ''}`;
  if (!onClick) return <div className={cls}>{content}</div>;
  return (
    <motion.button
      whileTap={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      onClick={() => {
        haptic(5);
        onClick();
      }}
      className={`${cls} transition-colors hover:bg-white/[0.04]`}
    >
      {content}
    </motion.button>
  );
}

/* ---------------- Form field ---------------- */

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[13px] font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block px-1 text-[12px] leading-relaxed text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-2xl bg-white/[0.06] px-4 py-3 text-[16px] text-white placeholder:text-slate-500 ring-1 ring-white/10 outline-none transition focus:bg-white/[0.09] focus:ring-2 focus:ring-emerald-400/70';

/* ---------------- Chips & stats ---------------- */

export function Chip({ children, tone = 'slate', icon }: { children: React.ReactNode; tone?: 'slate' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet'; icon?: React.ReactNode }) {
  const tones = {
    slate: 'bg-white/[0.08] text-slate-300 ring-white/10',
    emerald: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/25',
    amber: 'bg-amber-400/15 text-amber-300 ring-amber-400/25',
    sky: 'bg-sky-400/15 text-sky-300 ring-sky-400/25',
    rose: 'bg-rose-400/15 text-rose-300 ring-rose-400/25',
    violet: 'bg-violet-400/15 text-violet-300 ring-violet-400/25',
  };
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function AnimatedNumber({ value, decimals = 0, className = '' }: { value: number; decimals?: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => v.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      mv.set(0);
    }
    const c = animate(mv, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span className={`tabular-nums ${className}`}>{text}</motion.span>;
}

export function Stat({ label, value, unit, decimals = 0, icon, tone = 'text-white' }: { label: string; value: number | string; unit?: string; decimals?: number; icon?: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/[0.06]">
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-[20px] font-semibold leading-tight ${tone}`}>
        {typeof value === 'number' ? <AnimatedNumber value={value} decimals={decimals} /> : value}
        {unit && <span className="ml-1 text-[13px] font-medium text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.06] text-slate-400 ring-1 ring-white/10">{icon}</div>
      <div className="text-[15px] font-semibold text-slate-200">{title}</div>
      {text && <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

/** Staggered fade/slide-in container for list content */
export function Stagger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
    >
      {React.Children.map(children, (child) =>
        child ? (
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } } }}>
            {child}
          </motion.div>
        ) : null,
      )}
    </motion.div>
  );
}
