import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Coordinate, NavigationStatus, NavMode, Tour } from '../types';
import { bearing, computeTrackStats, distance, estimateHours, formatDuration, nearestIndex, uid } from '../lib/geo';
import type { GeoFix } from './useGeolocation';

const SIM_SPEED_KMH = 4.5;
const SIM_TIME_FACTOR = 12; // simulation runs 12x real time so movement is visible
const OFF_ROUTE_M = 60;

export const IDLE_NAV: NavigationStatus = {
  mode: 'idle',
  isPaused: false,
  isRecording: false,
  currentIndex: 0,
  currentPosition: null,
  accuracyM: null,
  heading: 0,
  speedKmh: 0,
  elapsedSeconds: 0,
  distanceCoveredKm: 0,
  distanceRemainingKm: 0,
  ascentCoveredM: 0,
  ascentRemainingM: 0,
  offRouteM: null,
  currentInstruction: 'Bereit',
  recordedTrack: [],
};

function interpolate(coords: Coordinate[], cum: number[], km: number): { pos: Coordinate; index: number } {
  if (km <= 0) return { pos: coords[0], index: 0 };
  const last = coords.length - 1;
  if (km >= cum[last]) return { pos: coords[last], index: last };
  let i = 1;
  while (i < cum.length && cum[i] < km) i++;
  const a = coords[i - 1];
  const b = coords[i];
  const seg = cum[i] - cum[i - 1] || 1;
  const t = (km - cum[i - 1]) / seg;
  return {
    pos: {
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
      ele: a.ele !== undefined && b.ele !== undefined ? Math.round(a.ele + (b.ele - a.ele) * t) : (a.ele ?? b.ele),
    },
    index: t < 0.5 ? i - 1 : i,
  };
}

function cardinal(deg: number) {
  return ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

function buildInstruction(tour: Tour | null, index: number, pos: Coordinate, offRouteM: number | null, remainingKm: number): string {
  if (!tour || tour.coordinates.length < 2) return 'Freie Navigation – Track wird angezeigt';
  if (offRouteM !== null && offRouteM > OFF_ROUTE_M) {
    const target = tour.coordinates[index];
    return `${Math.round(offRouteM)} m abseits der Route – Richtung ${cardinal(bearing(pos, target))} zurück zum Weg`;
  }
  if (remainingKm < 0.05) return 'Ziel erreicht – starke Leistung!';
  const next = tour.waypoints
    .map((wp) => ({ wp, d: distance(pos, wp) }))
    .filter(({ wp }) => nearestIndex(tour.coordinates, wp).index > index)
    .sort((a, b) => a.d - b.d)[0];
  if (next && next.d < 2000) return `${next.wp.name} in ${next.d < 1000 ? `${Math.round(next.d / 10) * 10} m` : `${(next.d / 1000).toFixed(1)} km`}`;
  const ahead = tour.coordinates[Math.min(index + 5, tour.coordinates.length - 1)];
  const dEle = (ahead.ele ?? 0) - (tour.coordinates[index].ele ?? 0);
  if (dEle > 25) return 'Anstieg voraus – Tempo einteilen';
  if (dEle < -25) return 'Abstieg voraus – Trittsicherheit beachten';
  return `Route folgen Richtung ${cardinal(bearing(pos, ahead))}`;
}

export function useNavigation(tour: Tour | null, gpsFix: GeoFix | null, compassHeading: number | null) {
  const [nav, setNav] = useState<NavigationStatus>(IDLE_NAV);
  const navRef = useRef(nav);
  navRef.current = nav;
  const simKmRef = useRef(0);

  const stats = useMemo(() => (tour ? computeTrackStats(tour.coordinates) : null), [tour]);

  /** Applies a new position to the status (shared by GPS and simulation). */
  const applyPosition = useCallback(
    (prev: NavigationStatus, pos: Coordinate, extra: Partial<NavigationStatus>, simIndex?: number): NavigationStatus => {
      let index = prev.currentIndex;
      let offRouteM: number | null = null;
      let covered = prev.distanceCoveredKm;
      let remaining = 0;
      let ascCovered = prev.ascentCoveredM;
      let ascRemaining = 0;

      if (tour && stats && tour.coordinates.length > 1) {
        const near = simIndex !== undefined ? { index: simIndex, meters: 0 } : nearestIndex(tour.coordinates, pos, prev.currentIndex);
        index = near.index;
        offRouteM = near.meters;
        const total = stats.cumulativeKm[stats.cumulativeKm.length - 1];
        covered = stats.cumulativeKm[index];
        remaining = Math.max(0, total - covered);
        const sub = computeTrackStats(tour.coordinates.slice(0, index + 1));
        ascCovered = sub.ascentM;
        ascRemaining = Math.max(0, tour.ascentM - sub.ascentM);
      } else if (prev.currentPosition) {
        covered = prev.distanceCoveredKm + distance(prev.currentPosition, pos) / 1000;
      }

      let recorded = prev.recordedTrack;
      if (prev.isRecording) {
        const last = recorded[recorded.length - 1];
        if (!last || distance(last, pos) >= 4) recorded = [...recorded, { ...pos, time: pos.time ?? new Date().toISOString() }];
      }

      return {
        ...prev,
        ...extra,
        currentPosition: pos,
        currentIndex: index,
        offRouteM,
        distanceCoveredKm: Math.round(covered * 100) / 100,
        distanceRemainingKm: Math.round(remaining * 100) / 100,
        ascentCoveredM: ascCovered,
        ascentRemainingM: ascRemaining,
        recordedTrack: recorded,
        currentInstruction: buildInstruction(tour, index, pos, offRouteM, remaining),
      };
    },
    [tour, stats],
  );

  // Elapsed timer + simulation stepping
  useEffect(() => {
    if (nav.mode === 'idle' || nav.isPaused) return;
    const id = window.setInterval(() => {
      setNav((prev) => {
        if (prev.mode === 'idle' || prev.isPaused) return prev;
        const next = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
        if (prev.mode !== 'simulation' || !tour || !stats || tour.coordinates.length < 2) return next;
        const total = stats.cumulativeKm[stats.cumulativeKm.length - 1];
        const speed = SIM_SPEED_KMH * (0.9 + Math.random() * 0.2);
        simKmRef.current = Math.min(total, simKmRef.current + (speed * SIM_TIME_FACTOR) / 3600);
        const { pos, index } = interpolate(tour.coordinates, stats.cumulativeKm, simKmRef.current);
        const heading = prev.currentPosition ? bearing(prev.currentPosition, pos) : prev.heading;
        const updated = applyPosition(next, { ...pos, time: new Date().toISOString() }, {
          heading: Math.round(heading),
          speedKmh: Math.round(speed * 10) / 10,
          accuracyM: 5,
        }, index);
        updated.distanceCoveredKm = Math.round(simKmRef.current * 100) / 100;
        updated.distanceRemainingKm = Math.round(Math.max(0, total - simKmRef.current) * 100) / 100;
        if (simKmRef.current >= total) updated.isPaused = true;
        return updated;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [nav.mode, nav.isPaused, tour, stats, applyPosition]);

  // Real GPS updates
  useEffect(() => {
    if (nav.mode !== 'gps' || nav.isPaused || !gpsFix) return;
    setNav((prev) => {
      if (prev.mode !== 'gps') return prev;
      const moving = (gpsFix.speedKmh ?? 0) > 1.5;
      const heading =
        moving && gpsFix.heading !== null
          ? gpsFix.heading
          : compassHeading ?? (prev.currentPosition && distance(prev.currentPosition, gpsFix) > 3 ? bearing(prev.currentPosition, gpsFix) : prev.heading);
      return applyPosition(prev, gpsFix, {
        heading: Math.round(heading),
        speedKmh: Math.round((gpsFix.speedKmh ?? 0) * 10) / 10,
        accuracyM: gpsFix.accuracy,
      });
    });
    // compassHeading intentionally not a dependency: position updates drive recalculation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsFix, nav.mode, nav.isPaused, applyPosition]);

  // Compass rotates heading while standing still
  useEffect(() => {
    if (nav.mode !== 'gps' || compassHeading === null) return;
    setNav((prev) => ((prev.speedKmh ?? 0) > 1.5 ? prev : { ...prev, heading: compassHeading }));
  }, [compassHeading, nav.mode]);

  // Reset when the tour changes while idle
  useEffect(() => {
    if (navRef.current.mode !== 'idle') return;
    setNav({
      ...IDLE_NAV,
      distanceRemainingKm: tour?.distanceKm ?? 0,
      ascentRemainingM: tour?.ascentM ?? 0,
    });
  }, [tour?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(
    (mode: Exclude<NavMode, 'idle'>, record = true) => {
      simKmRef.current = 0;
      const startPos = mode === 'simulation' ? tour?.coordinates[0] ?? null : gpsFix;
      setNav({
        ...IDLE_NAV,
        mode,
        isRecording: record,
        currentPosition: startPos,
        distanceRemainingKm: tour?.distanceKm ?? 0,
        ascentRemainingM: tour?.ascentM ?? 0,
        recordedTrack: startPos && record ? [{ ...startPos, time: new Date().toISOString() }] : [],
        currentInstruction: mode === 'simulation' ? 'Simulation gestartet' : 'Warte auf GPS-Signal …',
      });
    },
    [tour, gpsFix],
  );

  const togglePause = useCallback(() => setNav((p) => ({ ...p, isPaused: !p.isPaused })), []);
  const toggleRecording = useCallback(() => setNav((p) => ({ ...p, isRecording: !p.isRecording })), []);

  /** Stops navigation; returns the recorded track as a tour if it is long enough. */
  const stop = useCallback((): Tour | null => {
    const p = navRef.current;
    let recorded: Tour | null = null;
    if (p.recordedTrack.length >= 3) {
      const s = computeTrackStats(p.recordedTrack);
      if (s.distanceKm >= 0.05) {
        const date = new Date();
        recorded = {
          id: uid('rec'),
          title: `Aufzeichnung ${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
          region: tour?.region ?? 'Eigene Aufzeichnung',
          difficulty: tour?.difficulty ?? 'Mittel',
          distanceKm: s.distanceKm,
          ascentM: s.ascentM,
          descentM: s.descentM,
          estimatedHours: p.elapsedSeconds > 0 ? Math.round((p.elapsedSeconds / 3600) * 10) / 10 : estimateHours(s.distanceKm, s.ascentM, s.descentM),
          description: `Aufgezeichneter Track${p.mode === 'simulation' ? ' (Simulation)' : ''}. Dauer ${formatDuration(p.elapsedSeconds)}.`,
          coordinates: p.recordedTrack,
          waypoints: [],
          isCustom: true,
          isRecorded: true,
          createdAt: date.toLocaleDateString('de-DE'),
        };
      }
    }
    setNav({ ...IDLE_NAV, distanceRemainingKm: tour?.distanceKm ?? 0, ascentRemainingM: tour?.ascentM ?? 0 });
    return recorded;
  }, [tour]);

  return { nav, start, stop, togglePause, toggleRecording };
}
