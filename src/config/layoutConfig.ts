export type DeviceType = 'phone' | 'tablet' | 'pc';
export type DeviceMode = 'auto' | DeviceType;

export interface UIElementPosition {
  /** Tailwind position classes (e.g. "bottom-4 right-4", "top-20 right-4") */
  positionClass: string;
  /** Stack orientation (flex-col for vertical, flex-row for horizontal) */
  flexDirection?: 'flex-col' | 'flex-row' | 'flex-col-reverse' | 'flex-row-reverse';
  /** Button spacing in stack */
  gapClass?: string;
  /** Button width and height classes */
  buttonSizeClass?: string;
  /** Container styling override */
  containerStyleClass?: string;
}

export interface DeviceLayoutConfig {
  /** Display label for device type */
  name: string;
  /** Top Header / Branding & Sunset Bar */
  headerBar: {
    /** CSS positioning e.g. "top-[calc(0.75rem+3%)] left-3 right-3" */
    positionClass: string;
    /** Background & border blur style */
    bgOpacityClass: string;
    /** Show subtitle text */
    showSubtitle: boolean;
    /** Compact header text */
    compactText: boolean;
  };
  /** Floating Action Buttons Stack (GPS, Crosshair HUD Toggle, Layers, Settings, Zoom +, Zoom -) */
  actionButtonsStack: UIElementPosition & {
    /** Layer popover menu position relative to the layer button */
    popoverPositionClass: string;
    /** Stack orientation direction */
    stackDirection: 'vertical' | 'horizontal';
  };
  /** Center Map HUD (Coordinates & Elevation) */
  centerHud: {
    /** CSS positioning */
    positionClass: string;
  };
  /** Active Tour & GPX Elevation Profile Panel */
  tourElevationPanel: {
    /** CSS positioning */
    positionClass: string;
    /** Max width styling */
    maxWidthClass: string;
  };
}

/**
 * CONFIGURATION FILE: LAYOUT POSITIONS & DEVICE VERSIONS
 * Adjust the CSS position classes here to change button and bar positions for Phone, Tablet, and PC.
 */
export const LAYOUT_CONFIG: Record<DeviceType, DeviceLayoutConfig> = {
  // 1. TELEFON (Phone / Mobile Screen < 640px)
  phone: {
    name: 'Telefon (Mobile)',
    headerBar: {
      positionClass: 'top-[calc(0.75rem+2%)] left-2.5 right-2.5',
      bgOpacityClass: 'bg-white/40 backdrop-blur-md border-slate-200/60',
      showSubtitle: false,
      compactText: true,
    },
    actionButtonsStack: {
      positionClass: 'bottom-3 right-2.5',
      flexDirection: 'flex-col',
      gapClass: 'gap-2',
      buttonSizeClass: 'w-10 h-10',
      popoverPositionClass: 'right-12 bottom-0 w-64',
      stackDirection: 'vertical',
    },
    centerHud: {
      positionClass: 'bottom-3 left-2.5',
    },
    tourElevationPanel: {
      positionClass: 'bottom-3 left-2.5 right-14',
      maxWidthClass: 'max-w-full',
    },
  },

  // 2. TABLET (640px <= width < 1024px)
  tablet: {
    name: 'Tablet',
    headerBar: {
      positionClass: 'top-[calc(1rem+3%)] left-4 right-4',
      bgOpacityClass: 'bg-white/50 backdrop-blur-lg border-slate-200/70',
      showSubtitle: true,
      compactText: false,
    },
    actionButtonsStack: {
      positionClass: 'bottom-5 right-4',
      flexDirection: 'flex-col',
      gapClass: 'gap-2.5',
      buttonSizeClass: 'w-11 h-11',
      popoverPositionClass: 'right-14 bottom-0 w-72',
      stackDirection: 'vertical',
    },
    centerHud: {
      positionClass: 'bottom-5 left-4',
    },
    tourElevationPanel: {
      positionClass: 'bottom-5 left-4 right-20',
      maxWidthClass: 'max-w-xl',
    },
  },

  // 3. PC (Desktop PC >= 1024px)
  pc: {
    name: 'PC (Desktop)',
    headerBar: {
      positionClass: 'top-5 left-5 right-5',
      bgOpacityClass: 'bg-white/80 backdrop-blur-xl border-slate-200/80',
      showSubtitle: true,
      compactText: false,
    },
    actionButtonsStack: {
      positionClass: 'bottom-6 right-5',
      flexDirection: 'flex-col',
      gapClass: 'gap-3',
      buttonSizeClass: 'w-11 h-11',
      popoverPositionClass: 'right-14 bottom-0 w-80',
      stackDirection: 'vertical',
    },
    centerHud: {
      positionClass: 'bottom-6 left-5',
    },
    tourElevationPanel: {
      positionClass: 'bottom-6 left-5 right-24',
      maxWidthClass: 'max-w-2xl',
    },
  },
};

/**
 * Device detection helper based on window width
 */
export function detectDeviceType(windowWidth: number): DeviceType {
  if (windowWidth < 640) {
    return 'phone';
  } else if (windowWidth < 1024) {
    return 'tablet';
  } else {
    return 'pc';
  }
}
