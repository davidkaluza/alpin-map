import React from 'react';
import { Wifi, Battery, Signal, ChevronLeft } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
  enabled: boolean;
  onToggleFullscreen: () => void;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  enabled,
  onToggleFullscreen
}) => {
  if (!enabled) {
    return <div className="w-full h-full min-h-screen bg-slate-100">{children}</div>;
  }

  // Get current time formatted HH:MM
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-6 overflow-x-hidden">
      {/* Top Banner explaining iPhone Preview */}
      <div className="mb-3 text-slate-400 text-xs flex items-center justify-between w-full max-w-md px-2">
        <span>iPhone 15 Pro App Preview</span>
        <button
          onClick={onToggleFullscreen}
          className="text-emerald-400 hover:underline font-semibold"
        >
          Zum Vollbild wechseln
        </button>
      </div>

      {/* Outer Phone Shell */}
      <div className="relative w-full max-w-[420px] h-[850px] bg-slate-900 rounded-[50px] p-3 shadow-2xl border-4 border-slate-700/80 flex flex-col overflow-hidden ring-1 ring-white/10">
        {/* Dynamic Island Notch */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
          <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
          <div className="w-3 h-3 bg-blue-950/80 rounded-full border border-blue-900" />
        </div>

        {/* Status Bar */}
        <div className="w-full pt-2 pb-1 px-7 flex items-center justify-between text-white text-xs font-semibold z-40 select-none">
          <span>{timeStr}</span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="flex-1 w-full bg-slate-100 rounded-[38px] overflow-hidden relative flex flex-col">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="w-full pt-2 flex justify-center pb-1">
          <div className="w-32 h-1 bg-slate-500/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};
