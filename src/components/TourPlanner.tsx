import React, { useRef } from 'react';
import { Tour } from '../types';
import { SAMPLE_TOURS } from '../data/sampleRoutes';
import { parseGPX, downloadGPX } from '../services/gpx';
import {
  Upload,
  Download,
  PlusCircle,
  MapPin,
  Clock,
  TrendingUp,
  Mountain,
  Compass,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface TourPlannerProps {
  selectedTour?: Tour | null;
  onSelectTour: (tour: Tour | null) => void;
  customTours: Tour[];
  onImportTour: (importedTour: Tour) => void;
  isDrawMode: boolean;
  setIsDrawMode: (drawing: boolean) => void;
  customDraftTour?: Tour | null;
  onClearCustomDraft?: () => void;
}

export const TourPlanner: React.FC<TourPlannerProps> = ({
  selectedTour,
  onSelectTour,
  customTours,
  onImportTour,
  isDrawMode,
  setIsDrawMode,
  customDraftTour,
  onClearCustomDraft
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result as string;
      if (xml) {
        try {
          const parsed = parseGPX(xml, file.name);
          onImportTour(parsed);
          onSelectTour(parsed);
        } catch (err) {
          alert('Fehler beim Importieren der GPX-Datei. Bitte überprüfen Sie das Format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const getDifficultyBadge = (diff: Tour['difficulty']) => {
    switch (diff) {
      case 'Einfach':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Mittel':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Schwer':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Alpin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const allTours = [...customTours, ...SAMPLE_TOURS];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>Touren & GPX-Planer</span>
          </h3>
          <p className="text-xs text-slate-500">
            Wählen Sie eine Tour, importieren Sie GPX oder zeichnen Sie Pfade
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* GPX Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".gpx,application/gpx+xml"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-full border border-slate-200 transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>GPX Import</span>
          </button>

          {/* Draw Custom Route Toggle */}
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${
              isDrawMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isDrawMode ? 'Klick-Zeichnen Aktiv' : 'Route zeichnen'}</span>
          </button>
        </div>
      </div>

      {/* Draw Mode Info Banner */}
      {isDrawMode && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start justify-between">
          <div className="flex gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-950">Routen-Zeichnen-Modus aktiv!</span>
              Klicken Sie nacheinander auf die Karte, um eigene Wegpunkte und Pfadlinien zu setzen.
              {customDraftTour && customDraftTour.coordinates.length > 0 && (
                <span className="block mt-1 font-semibold text-emerald-800">
                  {customDraftTour.coordinates.length} Punkte platziert ({customDraftTour.distanceKm} km).
                </span>
              )}
            </div>
          </div>
          {customDraftTour && customDraftTour.coordinates.length > 0 && (
            <button
              onClick={onClearCustomDraft}
              className="text-amber-800 hover:text-amber-950 font-bold underline shrink-0 ml-2"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Active Selected Tour Card */}
      {selectedTour ? (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                {selectedTour.region}
              </span>
              <h4 className="font-bold text-base text-white">{selectedTour.title}</h4>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getDifficultyBadge(
                  selectedTour.difficulty
                )}`}
              >
                {selectedTour.difficulty}
              </span>
              <button
                onClick={() => onSelectTour(null)}
                className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Tour abwählen"
              >
                Abwählen
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {selectedTour.description}
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">Distanz</span>
              <span className="font-bold text-emerald-400">{selectedTour.distanceKm} km</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">Anstieg</span>
              <span className="font-bold text-emerald-400">+{selectedTour.ascentM} m</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">Dauer</span>
              <span className="font-bold text-slate-200">~{selectedTour.estimatedHours} h</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">Wegpunkte</span>
              <span className="font-bold text-slate-200">{selectedTour.waypoints?.length || 0} POIs</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 text-slate-800 rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Freie Karte (Keine Tour aktiv)</h4>
            <p className="text-xs text-slate-500">Klicke unten auf eine Tour, um deren Route auf der Karte einzublenden.</p>
          </div>
          <Compass className="w-6 h-6 text-emerald-600 shrink-0 ml-3" />
        </div>
      )}

      {/* Tour Selection List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Verfügbare Outdoor Touren
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {/* Option: Freie Karte ohne Route */}
          <button
            onClick={() => onSelectTour(null)}
            className={`text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
              !selectedTour
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/80'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                !selectedTour ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 truncate">Freie Karte (Keine Route)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Karte ohne Routenlinie erkunden</div>
            </div>
          </button>

          {allTours.map((t) => {
            const isSelected = selectedTour ? t.id === selectedTour.id : false;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTour(t)}
                className={`text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/80'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <Mountain className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">{t.title}</span>
                    {t.isCustom && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded-md">
                        GPX
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{t.distanceKm} km</span>
                    <span>•</span>
                    <span>+{t.ascentM}m</span>
                    <span>•</span>
                    <span>{t.difficulty}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
