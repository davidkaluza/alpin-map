import React from 'react';

const appIconImg = '/src/assets/images/app_icon_mountain_1785909756245.jpg';

interface MountainAppIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  useImage?: boolean;
}

/**
 * Bergkulisse App Icon Component
 * Visualizes a vector line art mountain silhouette (Linie als Bergkulisse) with emerald accent contours.
 */
export const MountainAppIcon: React.FC<MountainAppIconProps> = ({
  className = '',
  size = 'md',
  useImage = false
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  }[size];

  if (useImage) {
    return (
      <div className={`relative rounded-2xl overflow-hidden shadow-lg border border-emerald-500/30 group ${sizeClasses} ${className}`}>
        <img
          src={appIconImg}
          alt="Bergkulisse App Icon"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-xl flex items-center justify-center overflow-hidden p-1.5 group cursor-pointer ${sizeClasses} ${className}`}>
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/20 via-slate-900/60 to-slate-950 opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Vector Line-Art Mountain Ridge Silhouette SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
      >
        <defs>
          <linearGradient id="mountainLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="backMountainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Background Mountain Ridge Silhouette (Far Range) */}
        <path
          d="M 5 80 L 25 50 L 40 65 L 60 40 L 78 60 L 95 80 Z"
          fill="url(#backMountainGrad)"
          stroke="#475569"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Main Mountain Ridge Line (Front Range - Single Continuous Contour Line) */}
        <path
          d="M 0 82 Q 12 82 18 70 L 35 38 L 48 56 L 68 22 L 84 52 L 100 82"
          stroke="url(#mountainLineGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Peak Contour Accent Lines */}
        <path
          d="M 68 22 L 68 45 M 35 38 L 38 52"
          stroke="#6ee7b7"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Sun / Summit Compass Point */}
        <circle cx="68" cy="14" r="3" fill="#34d399" className="animate-pulse" />
      </svg>
    </div>
  );
};
