import React, { useState, useEffect } from 'react';
import { AlpinePOI } from '../types';
import { Mountain, Home, Compass, MapPin, ExternalLink, X, Sparkles, Loader2, Bed, Calendar, CheckCircle2 } from 'lucide-react';

interface POIDetailsModalProps {
  poi: AlpinePOI;
  onClose: () => void;
  onCenterOnMap?: (lat: number, lng: number) => void;
}

export const POIDetailsModal: React.FC<POIDetailsModalProps> = ({
  poi,
  onClose,
  onCenterOnMap
}) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<{
    description: string;
    googleMapsUrl: string;
    searchLinks?: { title: string; uri: string }[];
    source?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPOIDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/poi-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: poi.name,
            lat: poi.lat,
            lng: poi.lng,
            ele: poi.ele,
            region: poi.region,
            type: poi.type
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setDetails(data);
          }
        } else {
          throw new Error('Server returned error');
        }
      } catch (e) {
        if (isMounted) {
          setDetails({
            description: poi.description,
            googleMapsUrl: poi.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name)}`
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPOIDetails();

    return () => {
      isMounted = false;
    };
  }, [poi]);

  const mapsUrl = details?.googleMapsUrl || poi.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name)}`;

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl text-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              poi.type === 'peak' 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : poi.type === 'refugio'
                ? 'bg-orange-50 text-orange-800 border-orange-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {poi.type === 'peak' ? <Mountain className="w-6 h-6" /> : <Home className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                  poi.type === 'peak' 
                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {poi.categoryLabel}
                </span>
                <span className="text-xs text-slate-500 font-medium">{poi.region}</span>
              </div>
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">{poi.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Facts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-slate-500 font-medium text-[11px] mb-0.5 flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5 text-emerald-600" />
              <span>Höhe</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{poi.ele} m ü. NHN</div>
          </div>

          {poi.openingSeason && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-slate-500 font-medium text-[11px] mb-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Saison</span>
              </div>
              <div className="font-bold text-slate-900 text-xs truncate">{poi.openingSeason}</div>
            </div>
          )}

          {poi.capacity && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
              <div className="text-slate-500 font-medium text-[11px] mb-0.5 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-blue-600" />
                <span>Schlafplätze</span>
              </div>
              <div className="font-bold text-slate-900 text-xs truncate">{poi.capacity}</div>
            </div>
          )}
        </div>

        {/* Facilities tags if present */}
        {poi.facilities && poi.facilities.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ausstattung & Service</div>
            <div className="flex flex-wrap gap-1.5">
              {poi.facilities.map((fac, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{fac}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gemini & Google Maps Description Section */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Geprüfte CSV & Live-Gipfelbeschreibung</span>
            </span>
            {loading && (
              <span className="text-[11px] text-emerald-600 flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Abfrage...</span>
              </span>
            )}
          </div>

          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line min-h-[80px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Lade aktuelle Beschreibung & Berg-Infos...</p>
              </div>
            ) : (
              details?.description || poi.description
            )}
          </div>

          {/* Web Links / Sources if returned */}
          {details?.searchLinks && details.searchLinks.length > 0 && (
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Google Suche Referenzen:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {details.searchLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>{link.title || link.uri}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Auf Google Maps öffnen</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
          </a>

          {onCenterOnMap && (
            <button
              onClick={() => {
                onCenterOnMap(poi.lat, poi.lng);
                onClose();
              }}
              className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm border border-slate-200"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Auf Karte zentrieren</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
