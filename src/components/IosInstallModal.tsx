import React from 'react';
import { Smartphone, Share, PlusSquare, ArrowUpRight, CheckCircle2, X } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 relative overflow-hidden">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 rounded-2xl text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">iPhone App Installation</h2>
              <p className="text-xs text-slate-500">Als PWA auf dem Home-Bildschirm speichern</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="py-5 space-y-4">
          <div className="flex items-start gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              1
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>Safari Browser öffnen</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-slate-600 mt-0.5">
                Öffnen Sie diese Webseite auf Ihrem iPhone im offiziellen <strong>Apple Safari Browser</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              2
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>Teilen-Button tippen</span>
                <Share className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-slate-600 mt-0.5">
                Tippen Sie unten in der Safari-Symbolleiste auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil nach oben).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              3
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>"Zum Home-Bildschirm"</span>
                <PlusSquare className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-slate-600 mt-0.5">
                Scrollen Sie nach unten und wählen Sie die Option <strong>"Zum Home-Bildschirm"</strong> (oder "Add to Home Screen").
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              4
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>Oben rechts "Hinzufügen"</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-slate-600 mt-0.5">
                Bestätigen Sie oben rechts mit <strong>"Hinzufügen"</strong>. Die App erscheint nun wie eine native App auf Ihrem iPhone.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-800 font-medium leading-relaxed mb-4">
          ✨ <strong>Vorteile:</strong> Vollbildmodus ohne Browserleiste, schnellere Ladezeiten und voller Zugriff auf offline heruntergeladene Kartenfliesen & GPX-Routen unterwegs in den Bergen!
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-md"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
};
