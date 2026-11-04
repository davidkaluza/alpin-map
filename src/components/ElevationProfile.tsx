import { useId, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Coordinate, Tour } from '../types';
import { computeTrackStats } from '../lib/geo';

interface Props {
  tour: Tour;
  compact?: boolean;
  hoverCoordinate?: Coordinate | null;
  onHoverCoordinate?: (c: Coordinate | null) => void;
  onSelectCoordinate?: (c: Coordinate) => void;
  /** index of the current navigation position */
  progressIndex?: number | null;
}

export function ElevationProfile({ tour, compact, hoverCoordinate, onHoverCoordinate, onSelectCoordinate, progressIndex }: Props) {
  const gradId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const coords = tour.coordinates;
    const stats = computeTrackStats(coords);
    let lastEle = coords.find((c) => c.ele !== undefined)?.ele ?? 0;
    const pts = coords.map((c, i) => {
      if (c.ele !== undefined) lastEle = c.ele;
      return { km: stats.cumulativeKm[i] ?? 0, ele: lastEle, coord: c };
    });
    const eles = pts.map((p) => p.ele);
    const min = Math.min(...eles);
    const max = Math.max(...eles);
    return { pts, min, max, total: pts[pts.length - 1]?.km || 1, hasEle: coords.some((c) => c.ele !== undefined) };
  }, [tour]);

  if (data.pts.length < 2) {
    return <div className="py-6 text-center text-[13px] text-slate-500">Für diese Tour liegen keine Trackpunkte vor.</div>;
  }

  const W = 600;
  const H = compact ? 120 : 220;
  const pad = { t: 14, r: 12, b: 22, l: 40 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const span = Math.max(50, data.max - data.min);
  const lo = data.min - span * 0.08;
  const hi = data.max + span * 0.12;
  const x = (km: number) => pad.l + (km / data.total) * cw;
  const y = (ele: number) => pad.t + ch - ((ele - lo) / (hi - lo)) * ch;

  // Downsample for path smoothness on long tracks
  const step = Math.max(1, Math.floor(data.pts.length / 400));
  const sampled = data.pts.filter((_, i) => i % step === 0 || i === data.pts.length - 1);
  const line = sampled.map((p, i) => `${i ? 'L' : 'M'}${x(p.km).toFixed(1)},${y(p.ele).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.total).toFixed(1)},${pad.t + ch} L${pad.l},${pad.t + ch} Z`;

  let idx = activeIdx;
  if (idx === null && hoverCoordinate) {
    const found = data.pts.findIndex((p) => Math.abs(p.coord.lat - hoverCoordinate.lat) < 1e-6 && Math.abs(p.coord.lng - hoverCoordinate.lng) < 1e-6);
    if (found >= 0) idx = found;
  }
  const active = idx !== null ? data.pts[idx] : null;
  const progress = progressIndex !== null && progressIndex !== undefined ? data.pts[progressIndex] : null;

  const pick = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const km = Math.max(0, Math.min(1, ((clientX - rect.left) / rect.width) * (W / cw) - pad.l / cw)) * data.total;
    let best = 0;
    let bestD = Infinity;
    data.pts.forEach((p, i) => {
      const d = Math.abs(p.km - km);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const grade = (() => {
    if (idx === null || idx === 0) return null;
    const a = data.pts[Math.max(0, idx - 3)];
    const b = data.pts[idx];
    const dKm = b.km - a.km;
    return dKm > 0.005 ? Math.round(((b.ele - a.ele) / (dKm * 1000)) * 100) : null;
  })();

  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.1].map((v) => Math.round(v / 10) * 10);

  return (
    <div className="relative select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        onPointerMove={(e) => {
          const i = pick(e.clientX);
          if (i === null) return;
          setActiveIdx(i);
          onHoverCoordinate?.(data.pts[i].coord);
        }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          const i = pick(e.clientX);
          if (i === null) return;
          setActiveIdx(i);
          onHoverCoordinate?.(data.pts[i].coord);
        }}
        onPointerUp={() => {
          if (activeIdx !== null) onSelectCoordinate?.(data.pts[activeIdx].coord);
        }}
        onPointerLeave={() => {
          setActiveIdx(null);
          onHoverCoordinate?.(null);
        }}
      >
        <defs>
          <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`stroke-${gradId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <clipPath id={`clip-${gradId}`}>
            <motion.rect x={0} y={0} height={H} initial={{ width: 0 }} animate={{ width: W }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
          </clipPath>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
            <text x={pad.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#64748b">
              {t}
            </text>
          </g>
        ))}

        <g clipPath={`url(#clip-${gradId})`}>
          <path d={area} fill={`url(#fill-${gradId})`} />
          {progress && <path d={area} fill="#10b981" fillOpacity={0.25} style={{ clipPath: `inset(0 ${100 - (progress.km / data.total) * 100}% 0 0)` }} />}
          <motion.path
            d={line}
            fill="none"
            stroke={`url(#stroke-${gradId})`}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </g>

        <text x={pad.l} y={H - 6} fontSize="10" fill="#64748b">
          0 km
        </text>
        <text x={pad.l + cw / 2} y={H - 6} fontSize="10" fill="#64748b" textAnchor="middle">
          {(data.total / 2).toFixed(1)} km
        </text>
        <text x={W - pad.r} y={H - 6} fontSize="10" fill="#64748b" textAnchor="end">
          {data.total.toFixed(1)} km
        </text>

        {progress && (
          <g>
            <circle cx={x(progress.km)} cy={y(progress.ele)} r={9} fill="#10b981" opacity={0.25}>
              <animate attributeName="r" values="6;12;6" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={x(progress.km)} cy={y(progress.ele)} r={5} fill="#10b981" stroke="#fff" strokeWidth={2} />
          </g>
        )}

        {active && (
          <g>
            <line x1={x(active.km)} x2={x(active.km)} y1={pad.t} y2={pad.t + ch} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" />
            <circle cx={x(active.km)} cy={y(active.ele)} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-slate-950/90 px-2.5 py-1 text-[12px] font-semibold text-white shadow-lg ring-1 ring-white/10"
          style={{ left: `${Math.min(85, Math.max(15, (x(active.km) / W) * 100))}%` }}
        >
          <span className="text-amber-300">{Math.round(active.ele)} m</span>
          <span className="mx-1.5 text-slate-500">·</span>
          {active.km.toFixed(2)} km
          {grade !== null && (
            <>
              <span className="mx-1.5 text-slate-500">·</span>
              <span className={grade > 0 ? 'text-rose-300' : 'text-sky-300'}>
                {grade > 0 ? '+' : ''}
                {grade}%
              </span>
            </>
          )}
        </div>
      )}
      {!data.hasEle && <div className="mt-1 text-center text-[12px] text-slate-500">Keine Höhendaten im Track enthalten.</div>}
    </div>
  );
}
