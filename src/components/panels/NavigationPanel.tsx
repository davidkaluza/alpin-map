import { motion } from 'motion/react';
import { CircleDot, Clock, Compass, Footprints, Gauge, MonitorPlay, Navigation2, Pause, Play, PhoneCall, Square, TrendingUp, Download, LocateFixed } from 'lucide-react';
import type { NavigationStatus, Tour } from '../../types';
import { Button, Row, Section, Stat, Toggle } from '../ui/controls';
import { formatDuration } from '../../lib/geo';
import { exportGPX } from '../../services/gpx';
import { useStored } from '../../lib/storage';

interface Props {
  tour: Tour | null;
  nav: NavigationStatus;
  gpsError: string | null;
  onStart: (mode: 'gps' | 'simulation', record: boolean) => void;
  onPause: () => void;
  onStop: () => void;
  onToggleRecord: () => void;
  onSos: () => void;
  onOpenTours: () => void;
}

export function NavigationPanel({ tour, nav, gpsError, onStart, onPause, onStop, onToggleRecord, onSos, onOpenTours }: Props) {
  const [record, setRecord] = useStored('recordByDefault', true);
  const active = nav.mode !== 'idle';

  return (
    <div>
      <motion.div
        layout
        className={`relative mb-5 overflow-hidden rounded-[24px] p-4 ring-1 ${active ? 'bg-gradient-to-br from-emerald-500/25 to-teal-600/10 ring-emerald-400/30' : 'bg-white/[0.05] ring-white/[0.07]'}`}
      >
        {active && <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />}
        <div className="relative flex items-center gap-3">
          <motion.div
            animate={active && !nav.isPaused ? { rotate: nav.heading } : { rotate: 0 }}
            className={`grid h-12 w-12 place-items-center rounded-2xl ${active ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-slate-300'}`}
          >
            <Navigation2 className="h-6 w-6 fill-current" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-white">
              {active ? (nav.isPaused ? 'Pausiert' : nav.mode === 'simulation' ? 'Simulation läuft' : 'GPS-Navigation aktiv') : 'Navigation bereit'}
            </div>
            <div className="truncate text-[13px] text-slate-400">{active ? nav.currentInstruction : tour ? tour.title : 'Ohne Tour: freie Aufzeichnung'}</div>
          </div>
          {active && nav.isRecording && (
            <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-400/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
              REC
            </span>
          )}
        </div>
      </motion.div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <Stat label="Zeit" value={formatDuration(nav.elapsedSeconds)} icon={<Clock className="h-3 w-3" />} />
        <Stat label="Strecke" value={nav.distanceCoveredKm} decimals={2} unit="km" icon={<Footprints className="h-3 w-3" />} />
        <Stat label={tour ? 'Verbleibend' : 'Aufstieg'} value={tour ? nav.distanceRemainingKm : nav.ascentCoveredM} decimals={tour ? 1 : 0} unit={tour ? 'km' : 'm'} icon={<TrendingUp className="h-3 w-3" />} tone="text-emerald-300" />
        <Stat label="Tempo" value={nav.speedKmh} decimals={1} unit="km/h" icon={<Gauge className="h-3 w-3" />} />
      </div>

      {active ? (
        <div className="mb-5 flex gap-2">
          <Button variant={nav.isPaused ? 'primary' : 'warning'} className="flex-1" icon={nav.isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />} onClick={onPause}>
            {nav.isPaused ? 'Fortsetzen' : 'Pausieren'}
          </Button>
          <Button variant="danger" icon={<Square className="h-4 w-4 fill-current" />} onClick={onStop}>
            Beenden
          </Button>
        </div>
      ) : (
        <>
          <Section footer={gpsError ?? (tour ? undefined : 'Tipp: Wähle unter „Touren“ eine Route, um ihr mit Restdistanz und Abweichungswarnung zu folgen.')}>
            <Row icon={<CircleDot className="h-[18px] w-[18px]" />} iconBg="bg-rose-500/15 text-rose-300" title="Track aufzeichnen" subtitle="Speichert deinen Weg als Tour" right={<Toggle checked={record} onChange={setRecord} label="Track aufzeichnen" />} />
            {!tour && <Row icon={<Navigation2 className="h-[18px] w-[18px]" />} iconBg="bg-emerald-500/15 text-emerald-300" title="Tour auswählen" subtitle="Routenführung mit Höhenprofil" onClick={onOpenTours} />}
          </Section>
          <div className="mb-5 grid gap-2">
            <Button variant="primary" size="lg" icon={<LocateFixed className="h-5 w-5" />} onClick={() => onStart('gps', record)}>
              GPS-Navigation starten
            </Button>
            <Button icon={<MonitorPlay className="h-[18px] w-[18px]" />} onClick={() => onStart('simulation', record)} disabled={!tour || tour.coordinates.length < 2}>
              Tour simulieren
            </Button>
          </div>
        </>
      )}

      <Section title="Sicherheit">
        <Row icon={<PhoneCall className="h-[18px] w-[18px]" />} iconBg="bg-rose-600 text-white" title="Notfall / SOS" subtitle="Koordinaten & Notrufnummern" onClick={onSos} danger />
        {active && <Row icon={<CircleDot className="h-[18px] w-[18px]" />} iconBg="bg-white/10 text-slate-200" title={nav.isRecording ? 'Aufzeichnung pausieren' : 'Aufzeichnung fortsetzen'} subtitle={`${nav.recordedTrack.length} Trackpunkte`} onClick={onToggleRecord} />}
        {tour && tour.coordinates.length > 1 && <Row icon={<Download className="h-[18px] w-[18px]" />} title="Tour als GPX teilen" subtitle={tour.title} onClick={() => exportGPX(tour)} />}
        <Row icon={<Compass className="h-[18px] w-[18px]" />} title="Kompass" subtitle="Wird beim GPS-Start aktiviert (iOS fragt nach Erlaubnis)" />
      </Section>
    </div>
  );
}
