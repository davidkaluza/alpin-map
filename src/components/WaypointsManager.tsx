import React, { useState } from 'react';
import { Waypoint, WaypointCategory, Tour } from '../types';
import {
  MapPin,
  Plus,
  Compass,
  Building,
  Droplets,
  Eye,
  ParkingSquare,
  AlertOctagon,
  Info,
  Check
} from 'lucide-react';

interface WaypointsManagerProps {
  tour?: Tour | null;
  onAddWaypoint: (newWp: Waypoint) => void;
  onSelectWaypoint?: (wp: Waypoint) => void;
}

export const WaypointsManager: React.FC<WaypointsManagerProps> = ({
  tour,
  onAddWaypoint,
  onSelectWaypoint
}) => {
  const [isAdding, setIsAdding] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<WaypointCategory>('peak');
  const [description, setDescription] = useState('');
  const [latInput, setLatInput] = useState<string>('');
  const [lngInput, setLngInput] = useState<string>('');

  const handleQuickAddPreset = (cat: WaypointCategory, defaultName: string) => {
    const coords = tour?.coordinates || [];
    const midIndex = Math.floor(coords.length / 2);
    const coord = coords[midIndex] || { lat: 47.4578, lng: 10.9931, ele: 975 };

    const newWp: Waypoint = {
      id: `wp-user-${Date.now()}`,
      name: defaultName,
      category: cat,
      lat: coord.lat + (Math.random() - 0.5) * 0.003,
      lng: coord.lng + (Math.random() - 0.5) * 0.003,
      ele: (coord.ele || 1000) + Math.floor(Math.random() * 200),
      description: `Manuell hinzugefügter ${getCategoryLabel(cat)}`
    };

    onAddWaypoint(newWp);
  };

  const getCategoryIcon = (cat: WaypointCategory) => {
    switch (cat) {
      case 'peak':
        return <Compass className="w-4 h-4 text-amber-600" />;
      case 'hut':
        return <Building className="w-4 h-4 text-amber-700" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'viewpoint':
        return <Eye className="w-4 h-4 text-purple-600" />;
      case 'parking':
        return <ParkingSquare className="w-4 h-4 text-emerald-600" />;
      case 'danger':
        return <AlertOctagon className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryLabel = (cat: WaypointCategory) => {
    switch (cat) {
      case 'peak':
        return 'Gipfel';
      case 'hut':
        return 'Hütte / Restaurant';
      case 'water':
        return 'Trinkwasser / Quelle';
      case 'viewpoint':
        return 'Aussichtspunkt';
      case 'parking':
        return 'Parkplatz / Start';
      case 'danger':
        return 'Gefahrenstelle';
      default:
        return 'Info / Wegweiser';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Default lat/lng near tour midpoint or user input
    const coords = tour?.coordinates || [];
    const midIndex = Math.floor(coords.length / 2);
    const coord = coords[midIndex] || { lat: 47.4578, lng: 10.9931, ele: 975 };

    const parsedLat = parseFloat(latInput);
    const parsedLng = parseFloat(lngInput);

    const newWp: Waypoint = {
      id: `wp-user-${Date.now()}`,
      name,
      category,
      lat: !isNaN(parsedLat) ? parsedLat : coord.lat + (Math.random() - 0.5) * 0.002,
      lng: !isNaN(parsedLng) ? parsedLng : coord.lng + (Math.random() - 0.5) * 0.002,
      ele: coord.ele || 950,
      description
    };

    onAddWaypoint(newWp);
    setName('');
    setDescription('');
    setLatInput('');
    setLngInput('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Wegpunkte & POIs ({tour?.waypoints?.length || 0})</span>
          </h4>
          <p className="text-xs text-slate-500">Hütten, Quellen & Highlights der Route</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-emerald-200/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>POI Hinzufügen</span>
        </button>
      </div>

      {/* Quick Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <span className="text-[11px] font-medium text-slate-500 mr-1">Schnell-Hinzufügen:</span>
        <button
          type="button"
          onClick={() => handleQuickAddPreset('peak', 'Neuer Gipfel')}
          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Compass className="w-3.5 h-3.5 text-amber-600" />
          <span>+ Gipfel</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAddPreset('hut', 'Schutzhütte')}
          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Building className="w-3.5 h-3.5 text-amber-700" />
          <span>+ Hütte</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAddPreset('water', 'Quelle / Trinkwasser')}
          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Droplets className="w-3.5 h-3.5 text-blue-600" />
          <span>+ Wasser</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAddPreset('parking', 'Parkplatz')}
          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <ParkingSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>+ Parkplatz</span>
        </button>
      </div>

      {/* Add Waypoint Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="font-semibold text-slate-800">Neuen Wegpunkt anlegen</div>
          <div>
            <input
              type="text"
              placeholder="Name des POIs (z.B. Schutzhütte am Pass)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Kategorie:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WaypointCategory)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="hut">Hütte / Alm</option>
                <option value="peak">Gipfel</option>
                <option value="water">Trinkwasser</option>
                <option value="viewpoint">Aussichtspunkt</option>
                <option value="parking">Parkplatz</option>
                <option value="danger">Gefahrenstelle</option>
                <option value="info">Wegweiser</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Beschreibung:</label>
              <input
                type="text"
                placeholder="Kurze Info..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Speichern</span>
            </button>
          </div>
        </form>
      )}

      {/* Waypoints List */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {(!tour?.waypoints || tour.waypoints.length === 0) ? (
          <div className="text-center text-xs text-slate-400 py-3">Keine Wegpunkte vorhanden</div>
        ) : (
          tour.waypoints.map((wp) => (
            <button
              key={wp.id}
              onClick={() => onSelectWaypoint && onSelectWaypoint(wp)}
              className="w-full text-left bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-xl p-2.5 transition-all flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-white rounded-lg shadow-xs shrink-0">
                  {getCategoryIcon(wp.category)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{wp.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span>{getCategoryLabel(wp.category)}</span>
                    {wp.ele && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{wp.ele}m</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
