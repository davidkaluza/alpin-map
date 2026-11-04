import { getSettings } from './settings';

/** Light haptic tick. iOS Safari ignores navigator.vibrate – harmless no-op there. */
export function haptic(pattern: number | number[] = 8) {
  if (!getSettings().haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
