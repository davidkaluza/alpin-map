import { motion } from 'motion/react';
import { CheckCircle2, PlusSquare, Share, Smartphone, Compass } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/controls';

const STEPS = [
  { Icon: Compass, title: 'In Safari öffnen', text: 'Die Installation funktioniert auf dem iPhone über Safari (iOS 16.4+ auch über Chrome/Edge).' },
  { Icon: Share, title: 'Teilen antippen', text: 'Das Symbol „Teilen“ (Quadrat mit Pfeil) in der Leiste unten bzw. im ••• Menü.' },
  { Icon: PlusSquare, title: '„Zum Home-Bildschirm“', text: 'In der Liste nach unten scrollen und die Option auswählen. „Als Web-App öffnen“ aktiviert lassen.' },
  { Icon: CheckCircle2, title: 'Hinzufügen', text: 'ALPIN MAP startet nun im Vollbild wie eine native App – inklusive Offline-Karten.' },
];

export function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Auf dem iPhone installieren"
      subtitle="Vollbild, schneller Start, offline nutzbar"
      icon={<Smartphone className="h-5 w-5" />}
      zIndex={1100}
      footer={
        <Button variant="primary" block onClick={onClose}>
          Verstanden
        </Button>
      }
    >
      <ol className="space-y-2.5">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i, type: 'spring', stiffness: 320, damping: 28 }}
            className="flex gap-3 rounded-[20px] bg-white/[0.045] p-3.5 ring-1 ring-white/[0.06]"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25">
              <s.Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-white">
                {i + 1}. {s.title}
              </div>
              <p className="text-[13px] leading-relaxed text-slate-400">{s.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </Sheet>
  );
}
