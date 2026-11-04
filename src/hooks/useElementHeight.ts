import { useLayoutEffect, useRef } from 'react';

/** Reports the element's height whenever it changes. */
export function useElementHeight<T extends HTMLElement>(onHeight: (h: number) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onHeight);
  cb.current = onHeight;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => cb.current(Math.round(entry.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return ref;
}
