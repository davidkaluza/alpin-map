import React, { useState } from 'react';
import { Shield, FileText, Trash2, Download, AlertTriangle, CheckCircle2, Lock, X, RefreshCw } from 'lucide-react';
import { Tour, Waypoint } from '../types';
import { clearAllTileCache } from '../services/offlineStorage';

interface PrivacyLegalModalProps {
  onClose: () => void;
  customTours: Tour[];
  waypoints: Waypoint[];
  onClearAllUserData: () => void;
}

export const PrivacyLegalModal: React.FC<PrivacyLegalModalProps> = ({
  onClose,
  customTours,
  waypoints,
  onClearAllUserData,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'data'>('privacy');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Export all user data as JSON
  const handleExportAllData = () => {
    const exportObject = {
      app: 'ALPIN MAP',
      exportDate: new Date().toISOString(),
      customToursCount: customTours.length,
      waypointsCount: waypoints.length,
      customTours,
      waypoints,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `alpin_map_user_data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Perform complete user data wipe (IndexedDB + localStorage)
  const handlePurgeAllData = async () => {
    setIsDeleting(true);
    try {
      await clearAllTileCache();
      localStorage.clear();
      onClearAllUserData();
      setDeleteSuccess(true);
      setConfirmDelete(false);
    } catch (err) {
      console.error('Error clearing user data:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg tracking-tight">Datenschutz & App Store Compliance</h2>
              <p className="text-xs text-slate-400">Rechtliche Hinweise, Datenexport & Löschungsrechte (Section 5.1.1)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'privacy'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Datenschutz</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'terms'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nutzung & Sicherheit</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'data'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Meine Daten (Section 5.1.1)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm leading-relaxed text-slate-600">
          
          {/* Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-emerald-900">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">100% Lokale Datenspeicherung & Offline-First</p>
                  <p className="text-xs text-emerald-800">
                    ALPIN MAP speichert Ihre erstellen Routen, Wegpunkte und heruntergeladenen Kartenkacheln ausschließlich lokal auf Ihrem Gerät (IndexedDB & LocalStorage). Es findet kein Tracking und kein Verkauf von personenbezogenen Daten statt.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">1. Standorterfassung (GPS)</h3>
                <p>
                  Zur Anzeige Ihrer aktuellen Position auf der topografischen Karte sowie zur Live-Aufzeichnung von Wandertracks nutzt die App die GPS-Schnittstelle Ihres Geräts. Die Positionsdaten verbleiben lokal im flüchtigen Speicher und werden zu keinem Zeitpunkt an externe Server übertragen.
                </p>

                <h3 className="font-bold text-slate-900 text-sm">2. Karten-Kacheln & Drittanbieter</h3>
                <p>
                  Beim Online-Betrieb lädt die App Kartenkacheln direkt von OpenStreetMap, CartoDB oder Esri ArcGIS. Hierbei wird technisch bedingt Ihre IP-Adresse an den jeweiligen Kartenserver übermittelt. Im Offline-Modus werden ausschließlich lokal geladene Kacheln genutzt.
                </p>

                <h3 className="font-bold text-slate-900 text-sm">3. Keine Cookies & kein Nutzer-Tracking</h3>
                <p>
                  Die App verwendet keinerlei Werbecookies, Drittanbieter-Analysedienste oder Werbe-Tracking-Frameworks (IDFA).
                </p>
              </div>
            </div>
          )}

          {/* Terms & Alpine Safety */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Wichtiger Sicherheitshinweis für Bergtouren</p>
                  <p className="text-xs text-amber-800">
                    Digitale GPS-Karten dienen ausschließlich als Orientierungshilfe. Verlassen Sie sich im hochalpinen Gelände niemals einzig auf elektronische Geräte (Akkulaufzeit, Empfangsstörungen, Wetterstürze).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">1. Eigenverantwortung & Tourenplanung</h3>
                <p>
                  Jeder Nutzer ist für die Einschätzung der eigenen Kondition, Wetterlage, Wegbeschaffenheit und Ausrüstung selbst verantwortlich.
                </p>

                <h3 className="font-bold text-slate-900 text-sm">2. Akku-Hinweis bei kontinuierlichem GPS-Tracking</h3>
                <p>
                  Die dauerhafte Nutzung der GPS-Ortung im Hintergrund bei der Track-Aufzeichnung kann die Akkulaufzeit Ihres Smartphones deutlich verkürzen. Wir empfehlen die Mitnahme einer geladenen Powerbank und einer ausgedruckten Papierkarte.
                </p>

                <h3 className="font-bold text-slate-900 text-sm">3. Impressum & Kontakt</h3>
                <p className="text-xs text-slate-500">
                  ALPIN MAP Outdoor GPS App<br />
                  Entwicklung & Bereitstellung gemäß Apple Developer Guidelines
                </p>
              </div>
            </div>
          )}

          {/* User Data Controls (Guideline 5.1.1) */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              <p>
                Gemäß den Apple App Store Richtlinien (Section 5.1.1) haben Sie die vollständige Kontrolle über Ihre in der App gespeicherten Daten.
              </p>

              {/* Data Export Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Nutzerdaten exportieren
                  </h4>
                  <p className="text-xs text-slate-500">
                    Exportieren Sie alle Ihre selbst erstellten Touren ({customTours.length}) und Wegpunkte ({waypoints.length}) als JSON-Datei.
                  </p>
                </div>
                <button
                  onClick={handleExportAllData}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Daten Exportieren
                </button>
              </div>

              {/* Data Purge Box */}
              <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Sämtliche App-Daten & Offline-Karten löschen</span>
                </div>
                <p className="text-xs text-rose-800">
                  Löscht unwiderruflich alle lokal gespeicherten Offline-Karten-Regionen, benutzerdefinierten Touren, Wegpunkte und App-Einstellungen.
                </p>

                {deleteSuccess ? (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Alle lokalen Nutzerdaten und Offline-Caches wurden erfolgreich gelöscht.</span>
                  </div>
                ) : confirmDelete ? (
                  <div className="p-3.5 bg-white border border-rose-300 rounded-xl space-y-3 animate-fade-in">
                    <p className="text-xs font-bold text-rose-900">
                      Sind Sie absolut sicher? Alle gespeicherten Offline-Karten & Touren gehen verloren!
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePurgeAllData}
                        disabled={isDeleting}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>Ja, alles jetzt löschen</span>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>App-Speicher vollständig zurücksetzen</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>ALPIN MAP v1.2.0 • Ready for iOS & App Store</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
          >
            Fertig
          </button>
        </div>

      </div>
    </div>
  );
};
