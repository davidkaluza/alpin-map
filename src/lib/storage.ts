import { useCallback, useSyncExternalStore } from 'react';

/**
 * Tiny localStorage-backed reactive store. Every key is namespaced and
 * safe against private-mode / quota errors.
 */
const PREFIX = 'alpinmap:';
const listeners = new Map<string, Set<() => void>>();
const memory = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (memory.has(key)) return memory.get(key) as T;
  let value = fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw !== null) value = JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  memory.set(key, value);
  return value;
}

export function writeStored<T>(key: string, value: T) {
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Speichern fehlgeschlagen', key, err);
  }
  listeners.get(key)?.forEach((l) => l());
}

export function readStored<T>(key: string, fallback: T): T {
  return read(key, fallback);
}

export function clearAllStored() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  const keys = [...memory.keys()];
  memory.clear();
  keys.forEach((k) => listeners.get(k)?.forEach((l) => l()));
}

function subscribe(key: string, cb: () => void) {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(cb);
  return () => set!.delete(cb);
}

export function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => read(key, fallback),
  );
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(read(key, fallback)) : v;
      writeStored(key, next);
    },
    // fallback intentionally excluded: it is only the initial default
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}
