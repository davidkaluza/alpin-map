import React, { useMemo } from 'react';
import { Tour, Coordinate } from '../types';
import { TrendingUp, TrendingDown, Mountain, ArrowUpRight, Gauge } from 'lucide-react';

interface ElevationProfileProps {
  tour?: Tour | null;
  hoverCoordinate?: Coordinate | null;
  onHoverCoordinate?: (coord: Coordinate | null) => void;
  onClickCoordinate?: (coord: Coordinate) => void;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  tour,
  hoverCoordinate,
  onHoverCoordinate,
  onClickCoordinate
}) => {
  const coords = tour?.coordinates || [];

  // Calculate cumulative distance for each point
  const profileData = useMemo(() => {
    if (!coords || coords.length === 0) return [];

    let accumDistance = 0;
    const points: { xDistKm: number; ele: number; coord: Coordinate; grade: number }[] = [];

    points.push({
      xDistKm: 0,
      ele: coords[0].ele || 500,
      coord: coords[0],
      grade: 0
    });

    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];

      const dLat = (curr.lat - prev.lat) * (Math.PI / 180);
      const dLon = (curr.lng - prev.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.lat * (Math.PI / 180)) *
          Math.cos(curr.lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distMeters = 6371000 * c;

      accumDistance += distMeters;

      const currEle = curr.ele || points[points.length - 1].ele;
      const prevEle = points[points.length - 1].ele;
      const eleDiff = currEle - prevEle;

      const grade = distMeters > 0 ? (eleDiff / distMeters) * 100 : 0;

      points.push({
        xDistKm: Math.round((accumDistance / 1000) * 100) / 100,
        ele: Math.round(currEle),
        coord: curr,
        grade: Math.round(grade)
      });
    }

    return points;
  }, [coords]);

  const totalAscent = useMemo(() => {
    if (tour?.ascentM) return tour.ascentM;
    if (!coords || coords.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < coords.length; i++) {
      const prevEle = coords[i - 1].ele || 0;
      const currEle = coords[i].ele || 0;
      const diff = currEle - prevEle;
      if (diff > 0.5) sum += diff;
    }
    return Math.round(sum);
  }, [coords, tour?.ascentM]);

  const totalDescent = useMemo(() => {
    if (tour?.descentM) return tour.descentM;
    if (!coords || coords.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < coords.length; i++) {
      const prevEle = coords[i - 1].ele || 0;
      const currEle = coords[i].ele || 0;
      const diff = prevEle - currEle;
      if (diff > 0.5) sum += diff;
    }
    return Math.round(sum);
  }, [coords, tour?.descentM]);

  if (profileData.length === 0) return null;

  const maxDist = profileData[profileData.length - 1].xDistKm || 1;
  const elevations = profileData.map((p) => p.ele);
  const minEle = Math.max(0, Math.min(...elevations) - 30);
  const maxEle = Math.max(...elevations) + 30;
  const eleRange = maxEle - minEle || 100;

  // SVG Dimensions
  const svgWidth = 600;
  const svgHeight = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  if (!coords || coords.length === 0 || profileData.length === 0) {
    return (
      <div className="bg-white/95 text-slate-800 p-8 rounded-3xl border border-slate-200 shadow-md text-center space-y-3">
        <Mountain className="w-10 h-10 text-emerald-600 mx-auto" />
        <h3 className="font-bold text-base text-slate-900">Keine Tour ausgewählt</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Wähle eine Tour über das Zahnrad-Symbol (Einstellungen & Touren) oder importiere eine GPX-Datei, um das Höhenprofil anzuzeigen.
        </p>
      </div>
    );
  }

  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Map data to SVG points string
  const svgPoints = profileData.map((pt) => {
    const x = padding.left + (pt.xDistKm / maxDist) * chartW;
    const y = padding.top + chartH - ((pt.ele - minEle) / eleRange) * chartH;
    return `${x},${y}`;
  });

  const areaPointsStr = [
    `${padding.left},${padding.top + chartH}`,
    ...svgPoints,
    `${padding.left + chartW},${padding.top + chartH}`
  ].join(' ');

  const linePointsStr = svgPoints.join(' ');

  // Hover point lookup
  let activePoint = profileData[0];
  if (hoverCoordinate) {
    const matched = profileData.find(
      (p) =>
        Math.abs(p.coord.lat - hoverCoordinate.lat) < 0.0001 &&
        Math.abs(p.coord.lng - hoverCoordinate.lng) < 0.0001
    );
    if (matched) activePoint = matched;
  }

  const activeX = padding.left + (activePoint.xDistKm / maxDist) * chartW;
  const activeY = padding.top + chartH - ((activePoint.ele - minEle) / eleRange) * chartH;

  return (
    <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 shadow-sm text-slate-100">
      {/* Top Header stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Höhenprofil & Gelände
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {minEle}m – {maxEle}m
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({maxEle - minEle}m Gesamthöhe)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>+{totalAscent}m Anstieg gesamt</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-300 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full">
            <TrendingDown className="w-4 h-4 text-blue-400" />
            <span>-{totalDescent}m Abstieg</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span>Steigung: {activePoint.grade}%</span>
          </div>
        </div>
      </div>

      {/* SVG Elevation Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseLeave={() => onHoverCoordinate && onHoverCoordinate(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const normX = Math.max(0, Math.min(1, (clickX - padding.left) / chartW));
            const targetDistKm = normX * maxDist;

            // Find closest point
            let closest = profileData[0];
            let minDiff = Infinity;
            profileData.forEach((pt) => {
              const diff = Math.abs(pt.xDistKm - targetDistKm);
              if (diff < minDiff) {
                minDiff = diff;
                closest = pt;
              }
            });

            if (onHoverCoordinate) {
              onHoverCoordinate(closest.coord);
            }
          }}
          onClick={() => {
            if (activePoint && onClickCoordinate) {
              onClickCoordinate(activePoint.coord);
            }
          }}
        >
          <defs>
            <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left + chartW}
            y2={padding.top}
            stroke="#334155"
            strokeDasharray="4,4"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH / 2}
            x2={padding.left + chartW}
            y2={padding.top + chartH / 2}
            stroke="#1e293b"
            strokeDasharray="4,4"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="#475569"
          />

          {/* Fill Area */}
          <polygon points={areaPointsStr} fill="url(#elevationGrad)" />

          {/* Main Polyline */}
          <polyline
            points={linePointsStr}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Hover Vertical Bar */}
          <line
            x1={activeX}
            y1={padding.top}
            x2={activeX}
            y2={padding.top + chartH}
            stroke="#34d399"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />

          {/* Active Point Circle */}
          <circle
            cx={activeX}
            cy={activeY}
            r="6"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="2"
            className="drop-shadow-md"
          />

          {/* Y-Axis Labels (Elevation) */}
          <text
            x={padding.left - 8}
            y={padding.top + 10}
            textAnchor="end"
            fontSize="10"
            fill="#94a3b8"
            fontWeight="500"
          >
            {maxEle}m
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + chartH}
            textAnchor="end"
            fontSize="10"
            fill="#94a3b8"
            fontWeight="500"
          >
            {minEle}m
          </text>

          {/* X-Axis Labels (Distance) */}
          <text
            x={padding.left}
            y={svgHeight - 8}
            textAnchor="start"
            fontSize="10"
            fill="#94a3b8"
            fontWeight="500"
          >
            0 km
          </text>
          <text
            x={padding.left + chartW / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
            fontWeight="500"
          >
            {(maxDist / 2).toFixed(1)} km
          </text>
          <text
            x={padding.left + chartW}
            y={svgHeight - 8}
            textAnchor="end"
            fontSize="10"
            fill="#94a3b8"
            fontWeight="500"
          >
            {maxDist.toFixed(1)} km
          </text>
        </svg>

        {/* Hover Tooltip Overlay */}
        <div
          className="pointer-events-none absolute top-2 bg-slate-900/90 text-white px-2.5 py-1 rounded-lg text-xs font-medium shadow-md transition-all duration-75 flex items-center gap-2 backdrop-blur-md"
          style={{
            left: `${Math.min(Math.max((activeX / svgWidth) * 100, 15), 85)}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <span>Distanz: {activePoint.xDistKm} km</span>
          <span className="text-emerald-400 font-bold">{activePoint.ele} m.ü.NHN</span>
        </div>
      </div>
    </div>
  );
};
