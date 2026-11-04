import { useState } from 'react';
import { AlertTriangle, Download, FileText, Lock, Shield, Trash2 } from 'lucide-react';
import type { Tour, Waypoint } from '../../types';
import { Sheet } from '../ui/Sheet';
import { Button, SegmentedTabs, Section, Row } from '../ui/controls';
import { useToast } from '../ui/Toast';
import { clearAllTileCache } from '../../services/offlineStorage';
import { clearAllStored } from '../../lib/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  customTours: Tour[];
  places: Waypoint[];
  onDataCleared: () => void;
}

type Tab = 'privacy' | 'safety' | 'data';

export function PrivacySheet({ open, onClose, customTours, places, onDataCleared }: Props) {
  const [tab, setTab] = useState<Tab>('privacy');
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'ALPIN MAP', exportedAt: new Date().toISOString(), tours: customTours, places }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpin-map-daten-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const wipe = async () => {
    await clearAllTileCache().catch(() => {});
    clearAllStored();
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith('workbox-precache')).map((k) => caches.delete(k)));
    }
    setConfirm(false);
    onDataCleared();
    toast('Alle lokalen Daten wurden gelöscht', 'info');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Datenschutz & Daten"
      subtitle="Alles bleibt auf deinem Gerät"
      icon={<Shield className="h-5 w-5" />}
      size="tall"
      zIndex={1100}
      toolbar={
        <SegmentedTabs
          layoutId="privacy-tabs"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'privacy', label: 'Datenschutz', icon: <Lock className="h-4 w-4" /> },
            { id: 'safety', label: 'Sicherheit', icon: <FileText className="h-4 w-4" /> },
            { id: 'data', label: 'Meine Daten', icon: <Trash2 className="h-4 w-4" /> },
          ]}
        />
      }
    >
      {tab === 'privacy' && (
        <div className="space-y-4 text-[14px] leading-relaxed text-slate-300">
          <p className="rounded-2xl bg-emerald-400/10 p-4 text-emerald-100 ring-1 ring-emerald-400/20">
            ALPIN MAP hat keinen eigenen Server, kein Konto, kein Tracking und keine Werbung. Touren, Orte, Einstellungen, API-Schlüssel und Offline-Karten liegen ausschließlich lokal im Speicher dieses Geräts.
          </p>
          <h4 className="font-semibold text-white">Standort</h4>
          <p>Die GPS-Position wird nur zur Anzeige, Navigation und Track-Aufzeichnung auf dem Gerät verwendet und nicht übertragen.</p>
          <h4 className="font-semibold text-white">Externe Dienste</h4>
          <p>
            Beim Laden von Karten, Höhen und Gipfeldaten werden technisch bedingt IP-Adresse und der angefragte Kartenausschnitt an den jeweiligen Anbieter übermittelt: OpenTopoMap, CARTO, Esri, CyclOSM, Waymarked Trails, OpenStreetMap
            Overpass, Open-Meteo sowie – nur falls du einen Schlüssel hinterlegst – Mapbox und Google Gemini (dabei werden Name und Koordinaten des angetippten Ortes gesendet).
          </p>
          <h4 className="font-semibold text-white">Hosting</h4>
          <p>Die App wird über GitHub Pages ausgeliefert. GitHub verarbeitet dabei Zugriffsdaten (z. B. IP-Adresse) gemäß eigener Datenschutzerklärung.</p>
        </div>
      )}

      {tab === 'safety' && (
        <div className="space-y-4 text-[14px] leading-relaxed text-slate-300">
          <div className="flex gap-3 rounded-2xl bg-amber-400/10 p-4 text-amber-100 ring-1 ring-amber-400/20">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>Digitale Karten sind eine Orientierungshilfe. Verlasse dich im Gebirge nie allein auf ein Smartphone – Akku, Empfang und Wetter können jederzeit versagen.</p>
          </div>
          <h4 className="font-semibold text-white">Eigenverantwortung</h4>
          <p>Kondition, Ausrüstung, Wetter und Wegzustand musst du selbst beurteilen. Wegdaten aus OpenStreetMap und KI-Texte können veraltet oder falsch sein.</p>
          <h4 className="font-semibold text-white">Akku</h4>
          <p>Dauerhaftes GPS und eingeschaltetes Display kosten viel Energie. Nimm eine Powerbank und eine Papierkarte mit, lade Offline-Karten vorab herunter.</p>
        </div>
      )}

      {tab === 'data' && (
        <div>
          <Section title="Export">
            <Row icon={<Download className="h-[18px] w-[18px]" />} iconBg="bg-emerald-500/15 text-emerald-300" title="Daten als JSON exportieren" subtitle={`${customTours.length} Touren · ${places.length} Orte`} onClick={exportData} />
          </Section>
          <Section title="Löschen" footer="Löscht Touren, Orte, Einstellungen, API-Schlüssel und alle Offline-Karten unwiderruflich von diesem Gerät.">
            <div className="p-4">
              {confirm ? (
                <div className="space-y-3">
                  <p className="text-[14px] font-medium text-rose-200">Wirklich alles löschen? Das kann nicht rückgängig gemacht werden.</p>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setConfirm(false)}>
                      Abbrechen
                    </Button>
                    <Button variant="danger" className="flex-1" icon={<Trash2 className="h-4 w-4" />} onClick={wipe}>
                      Alles löschen
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" block icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirm(true)}>
                  Alle App-Daten löschen
                </Button>
              )}
            </div>
          </Section>
        </div>
      )}
    </Sheet>
  );
}
