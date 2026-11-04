import { useCallback, useEffect, useState } from 'react';

type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * Device compass heading. On iOS permission must be requested from a user gesture via `request()`.
 */
export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  const request = useCallback(async () => {
    const Ctor = (window as unknown as { DeviceOrientationEvent?: OrientationCtor }).DeviceOrientationEvent;
    if (!Ctor) return false;
    try {
      if (typeof Ctor.requestPermission === 'function') {
        const res = await Ctor.requestPermission();
        if (res !== 'granted') return false;
      }
      setEnabled(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: Event) => {
      const ev = e as IOSOrientationEvent;
      let h: number | null = null;
      if (typeof ev.webkitCompassHeading === 'number') h = ev.webkitCompassHeading;
      else if (ev.absolute && typeof ev.alpha === 'number') h = (360 - ev.alpha) % 360;
      if (h !== null) setHeading(Math.round(h));
    };
    const evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evt, handler);
    return () => window.removeEventListener(evt, handler);
  }, [enabled]);

  return { heading, request, enabled };
}
