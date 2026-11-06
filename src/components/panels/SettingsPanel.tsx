import { useState } from 'react';
import { motion } from 'motion/react';
import { Crosshair, ScanEye, Eye, EyeOff, KeyRound, Map as MapIcon, RefreshCw, Shield, Smartphone, Sparkles, SunMedium, Vibrate, Navigation2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { useSettings } from '../../lib/settings';
import { testGeminiKey } from '../../services/poiDetails';
import { Button, Field, Row, Section, Toggle, inputClass } from '../ui/controls';
import { useToast } from '../ui/Toast';

interface Props {
  onOpenInstall: () => void;
  onOpenPrivacy: () => void;
  onCheckUpdate: () => void;
  isStandalone: boolean;
}

export function SettingsPanel({ onOpenInstall, onOpenPrivacy, onCheckUpdate, isStandalone }: Props) {
  const [settings, update] = useSettings();
  const toast = useToast();
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel);
  const [mapboxToken, setMapboxToken] = useState(settings.mapboxToken);
  const [reveal, setReveal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const dirty = geminiKey !== settings.geminiApiKey || geminiModel !== settings.geminiModel || mapboxToken !== settings.mapboxToken;

  const save = () => {
    const mb = mapboxToken.trim();
    if (mb && !mb.startsWith('pk.')) {
      toast('Mapbox-Token muss mit „pk.“ beginnen (öffentlicher Token)', 'error');
      return;
    }
    update({ geminiApiKey: geminiKey.trim(), geminiModel: geminiModel.trim() || 'gemini-flash-latest', mapboxToken: mb });
    setTestResult(null);
    toast('Schlüssel gespeichert');
  };

  const test = async () => {
    if (!geminiKey.trim()) return;
    setTesting(true);
    setTestResult(await testGeminiKey(geminiKey.trim(), geminiModel.trim() || 'gemini-flash-latest'));
    setTesting(false);
  };

  return (
    <div>
      <Section
        title="API-Schlüssel"
        footer="Schlüssel werden ausschließlich lokal auf diesem Gerät gespeichert und nur direkt an Google bzw. Mapbox gesendet. Ohne Schlüssel funktioniert die App vollständig – mit eingebauten Beschreibungen und freien Karten."
      >
        <div className="space-y-4 p-4">
          <Field
            label="Google Gemini API-Key"
            hint={
              <>
                Für KI-Beschreibungen von Gipfeln & Hütten.{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-emerald-300">
                  Key erstellen <ExternalLink className="h-3 w-3" />
                </a>
              </>
            }
          >
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
              <input
                className={`${inputClass} pl-11 pr-12 font-mono`}
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza…"
              />
              <button type="button" onClick={() => setReveal((v) => !v)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-400" aria-label={reveal ? 'Verbergen' : 'Anzeigen'}>
                {reveal ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </Field>
          <Field label="Gemini-Modell" hint="Standard: gemini-flash-latest (zeigt immer auf das aktuelle Flash-Modell)">
            <input className={`${inputClass} font-mono`} value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} autoCapitalize="off" spellCheck={false} />
          </Field>
          <Field
            label="Mapbox Access Token (optional)"
            hint={
              <>
                Schaltet „Mapbox Outdoors“ und „Mapbox Satellit“ frei.{' '}
                <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-emerald-300">
                  Token erstellen <ExternalLink className="h-3 w-3" />
                </a>
              </>
            }
          >
            <input
              className={`${inputClass} font-mono`}
              type={reveal ? 'text' : 'password'}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="pk.…"
            />
          </Field>
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2 rounded-2xl px-3 py-2.5 text-[13px] ring-1 ${testResult.ok ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/25' : 'bg-rose-400/10 text-rose-200 ring-rose-400/25'}`}
            >
              {testResult.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span className="break-words">{testResult.message}</span>
            </motion.div>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" icon={<Sparkles className="h-4 w-4" />} onClick={test} disabled={!geminiKey.trim() || testing}>
              {testing ? 'Teste …' : 'Gemini testen'}
            </Button>
            <Button variant="primary" className="flex-1" onClick={save} disabled={!dirty}>
              Speichern
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Karte & Bedienung">
        <Row icon={<Crosshair className="h-[18px] w-[18px]" />} title="Fadenkreuz & Koordinaten" subtitle="Kartenmitte anzeigen" right={<Toggle checked={settings.showCenterHud} onChange={(v) => update({ showCenterHud: v })} label="Fadenkreuz" />} />
        <Row icon={<ScanEye className="h-[18px] w-[18px]" />} title="Scharfe Karte" subtitle="Für Retina-Displays · feinere Schrift, mehr Daten" right={<Toggle checked={settings.sharpTiles} onChange={(v) => update({ sharpTiles: v })} label="Scharfe Karte" />} />
        <Row icon={<Navigation2 className="h-[18px] w-[18px]" />} title="Karte mitführen" subtitle="Beim Navigationsstart automatisch folgen" right={<Toggle checked={settings.autoFollow} onChange={(v) => update({ autoFollow: v })} label="Karte mitführen" />} />
        <Row icon={<SunMedium className="h-[18px] w-[18px]" />} title="Display wach halten" subtitle="Während der Navigation" right={<Toggle checked={settings.keepScreenAwake} onChange={(v) => update({ keepScreenAwake: v })} label="Display wach halten" />} />
        <Row icon={<Vibrate className="h-[18px] w-[18px]" />} title="Haptisches Feedback" subtitle="Wo vom Gerät unterstützt" right={<Toggle checked={settings.haptics} onChange={(v) => update({ haptics: v })} label="Haptik" />} />
      </Section>

      <Section title="App">
        {!isStandalone && <Row icon={<Smartphone className="h-[18px] w-[18px]" />} iconBg="bg-emerald-500/15 text-emerald-300" title="Zum Home-Bildschirm" subtitle="Als App auf dem iPhone installieren" onClick={onOpenInstall} />}
        <Row icon={<RefreshCw className="h-[18px] w-[18px]" />} title="Nach Updates suchen" subtitle={`Version ${__APP_VERSION__}`} onClick={onCheckUpdate} />
        <Row icon={<Shield className="h-[18px] w-[18px]" />} title="Datenschutz & Daten" subtitle="Export, Löschen, Sicherheitshinweise" onClick={onOpenPrivacy} />
        <Row icon={<MapIcon className="h-[18px] w-[18px]" />} title="Kartendaten" subtitle="© OpenStreetMap-Mitwirkende & Kartenanbieter" />
      </Section>
    </div>
  );
}
