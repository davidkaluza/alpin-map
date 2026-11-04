import { Copy, PhoneCall, Share2, Siren } from 'lucide-react';
import type { Coordinate } from '../../types';
import { Sheet } from '../ui/Sheet';
import { Button, Section, Row } from '../ui/controls';
import { useToast } from '../ui/Toast';
import { formatCoord } from '../../lib/geo';

interface Props {
  open: boolean;
  onClose: () => void;
  position: Coordinate | null;
  accuracy: number | null;
  positionSource: 'gps' | 'map';
}

const NUMBERS = [
  { number: '112', label: 'Euro-Notruf', sub: 'Europaweit, auch ohne SIM' },
  { number: '140', label: 'Bergrettung Österreich', sub: 'Alpinnotruf' },
  { number: '1414', label: 'Rega Schweiz', sub: 'Luftrettung' },
  { number: '118', label: 'Soccorso Italien', sub: 'Rettungsdienst / Bergrettung' },
];

export function SosSheet({ open, onClose, position, accuracy, positionSource }: Props) {
  const toast = useToast();
  const text = position
    ? `NOTFALL – Mein Standort: ${formatCoord(position.lat, position.lng, 5)}${position.ele !== undefined ? `, Höhe ca. ${Math.round(position.ele)} m` : ''}${accuracy ? ` (±${accuracy} m)` : ''}. Karte: https://maps.apple.com/?ll=${position.lat.toFixed(6)},${position.lng.toFixed(6)}`
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Standort kopiert');
    } catch {
      toast('Kopieren nicht möglich', 'error');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: 'Notfall-Standort', text });
    } catch {
      /* cancelled */
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Notfall" subtitle="Ruhe bewahren – Standort durchgeben" icon={<Siren className="h-5 w-5" />} tone="rose" zIndex={1200}>
      <div className="mb-5 rounded-[22px] bg-gradient-to-br from-rose-600/30 to-rose-900/20 p-4 ring-1 ring-rose-400/30">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-rose-200/80">
          {positionSource === 'gps' ? 'GPS-Position' : 'Kartenmitte (kein GPS-Signal)'}
          {accuracy ? ` · ±${accuracy} m` : ''}
        </div>
        {position ? (
          <>
            <div className="mt-2 font-mono text-[22px] font-semibold leading-tight text-white" data-selectable>
              {Math.abs(position.lat).toFixed(5)}° {position.lat >= 0 ? 'N' : 'S'}
              <br />
              {Math.abs(position.lng).toFixed(5)}° {position.lng >= 0 ? 'E' : 'W'}
            </div>
            {position.ele !== undefined && <div className="mt-1 text-[14px] text-rose-100">Höhe ca. {Math.round(position.ele)} m</div>}
          </>
        ) : (
          <div className="mt-2 text-[15px] text-rose-100">Position unbekannt</div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" icon={<Copy className="h-4 w-4" />} onClick={copy} disabled={!position}>
            Kopieren
          </Button>
          <Button size="sm" icon={<Share2 className="h-4 w-4" />} onClick={share} disabled={!position || !('share' in navigator)}>
            Teilen
          </Button>
        </div>
      </div>

      <Button variant="danger" size="lg" block className="mb-5" icon={<PhoneCall className="h-5 w-5" />} onClick={() => (window.location.href = 'tel:112')}>
        112 anrufen
      </Button>

      <Section title="Weitere Notrufnummern" footer="Alpines Notsignal: 6× pro Minute ein Zeichen (Ruf, Licht, Pfeife), dann 1 Minute Pause. Antwort: 3× pro Minute.">
        {NUMBERS.slice(1).map((n) => (
          <a key={n.number} href={`tel:${n.number}`} className="block">
            <Row icon={<PhoneCall className="h-[18px] w-[18px]" />} iconBg="bg-rose-500/15 text-rose-300" title={`${n.number} · ${n.label}`} subtitle={n.sub} />
          </a>
        ))}
      </Section>
    </Sheet>
  );
}
