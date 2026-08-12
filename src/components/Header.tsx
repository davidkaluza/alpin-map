import React, { useState } from 'react';
import {
  Compass,
  Layers,
  DownloadCloud,
  Smartphone,
  Maximize2,
  Search,
  Wifi,
  WifiOff,
  MapPin,
  Mountain,
  Check,
  Shield
} from 'lucide-react';
import { MAP_LAYERS } from '../data/sampleRoutes';
import { Tour } from '../types';

interface HeaderProps {
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  showOverlayHiking: boolean;
  setShowOverlayHiking: (show: boolean) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  onOpenOfflineManager: () => void;
  isIphoneFrame: boolean;
  setIsIphoneFrame: (frame: boolean) => void;
  onSearchSelectTour: (query: string) => void;
  onOpenPrivacyLegalModal?: () => void;
  onOpenIosInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeLayerId,
  setActiveLayerId,
  showOverlayHiking,
  setShowOverlayHiking,
  isOfflineMode,
  setIsOfflineMode,
  onOpenOfflineManager,
  isIphoneFrame,
  setIsIphoneFrame,
  onSearchSelectTour,
  onOpenPrivacyLegalModal,
  onOpenIosInstallModal,
}) => {
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSearchSelectTour(searchQuery);
  };

  const activeLayer = MAP_LAYERS.find((l) => l.id === activeLayerId) || MAP_LAYERS[0];

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200/80 px-4 py-3 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-xl shadow-xs text-white">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                TrailNav <span className="text-emerald-600">Offline</span>
              </h1>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                iOS & Web
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Topografische Karten & Outdoor GPX-Navigation
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-xs min-w-[180px]"
        >
          <input
            type="text"
            placeholder="Ort oder Tour suchen (z.B. Brocken)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-full pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Layer Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLayersDropdown(!showLayersDropdown)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
              title="Kartenmaterial & Wanderwege-Layer wählen"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">{activeLayer.name}</span>
            </button>

            {showLayersDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1">
                  Basiskarten
                </div>
                {MAP_LAYERS.filter((l) => l.category === 'base').map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      setActiveLayerId(layer.id);
                      setShowLayersDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors ${
                      activeLayerId === layer.id ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60' : ''
                    }`}
                  >
                    <div>
                      <div>{layer.name}</div>
                      <div className="text-[10px] text-slate-500">{layer.description}</div>
                    </div>
                    {activeLayerId === layer.id && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1 pt-1">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1">
                    Overlays
                  </div>
                  <button
                    onClick={() => setShowOverlayHiking(!showOverlayHiking)}
                    className="w-full text-left p-2 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-emerald-700">Wanderwege-Overlay</div>
                      <div className="text-[10px] text-slate-500">Waymarked Trails Routennetz</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        showOverlayHiking ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                      }`}
                    >
                      {showOverlayHiking && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Offline Manager Button */}
          <button
            onClick={onOpenOfflineManager}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
              isOfflineMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isOfflineMode ? 'Offline Aktiv' : 'Karten Offline-Download'}
            </span>
          </button>

          {/* Device Frame View Toggle */}
          <button
            onClick={() => setIsIphoneFrame(!isIphoneFrame)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-full transition-colors"
            title={isIphoneFrame ? 'Vollbildmodus aktivieren' : 'iPhone-Ansicht testen'}
          >
            {isIphoneFrame ? (
              <>
                <Maximize2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline">Vollbild</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline">iPhone View</span>
              </>
            )}
          </button>

          {/* iOS / iPhone Install Guide Button */}
          {onOpenIosInstallModal && (
            <button
              onClick={onOpenIosInstallModal}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs font-semibold px-3 py-2 rounded-full transition-colors"
              title="Anleitung: App auf dem iPhone installieren"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">iPhone Installieren</span>
            </button>
          )}

          {/* Privacy & App Store Compliance Button */}
          {onOpenPrivacyLegalModal && (
            <button
              onClick={onOpenPrivacyLegalModal}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-full transition-colors"
              title="Datenschutz & App Store Compliance"
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="hidden xl:inline">Datenschutz</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
