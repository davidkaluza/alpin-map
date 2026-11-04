import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

const ToastCtx = createContext<(text: string, tone?: ToastTone) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((text: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 z-[3000] flex flex-col items-center gap-2 px-4" style={{ top: 'calc(var(--safe-top) + 64px)' }}>
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="glass-strong pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-100"
              role="status"
            >
              {t.tone === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
              {t.tone === 'error' && <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />}
              {t.tone === 'info' && <Info className="h-5 w-5 shrink-0 text-sky-400" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
