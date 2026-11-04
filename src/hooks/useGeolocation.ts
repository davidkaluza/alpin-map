import { useEffect, useRef, useState } from 'react';
import type { Coordinate } from '../types';

export interface GeoFix extends Coordinate {
  accuracy: number;
  /** degrees, null if unknown */
  heading: number | null;
  /** km/h, null if unknown */
  speedKmh: number | null;
  timestamp: number;
}

export interface GeoState {
  fix: GeoFix | null;
  error: string | null;
}

/** Continuous high-accuracy position updates while `enabled`. */
export function useGeolocation(enabled: boolean): GeoState {
  const [state, setState] = useState<GeoState>({ fix: null, error: null });
  const lastRef = useRef<GeoFix | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'Standortdienste werden nicht unterstützt' }));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        const fix: GeoFix = {
          lat: c.latitude,
          lng: c.longitude,
          ele: c.altitude !== null ? Math.round(c.altitude) : undefined,
          time: new Date(pos.timestamp).toISOString(),
          accuracy: Math.round(c.accuracy),
          heading: c.heading !== null && !Number.isNaN(c.heading) ? c.heading : null,
          speedKmh: c.speed !== null && !Number.isNaN(c.speed) ? Math.max(0, c.speed * 3.6) : null,
          timestamp: pos.timestamp,
        };
        lastRef.current = fix;
        setState({ fix, error: null });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Standortzugriff verweigert – in den iOS-Einstellungen für Safari / ALPIN MAP erlauben.'
            : err.code === err.TIMEOUT
              ? 'GPS-Signal zu schwach'
              : 'Standort nicht verfügbar';
        setState((s) => ({ fix: s.fix, error: msg }));
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return state;
}
