import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Droplet, Eye, Home, Info, Mountain, SquareParking } from 'lucide-react';
import type { WaypointCategory } from '../types';

export interface CategoryMeta {
  label: string;
  color: string;
  Icon: LucideIcon;
  /** raw SVG inner markup (lucide paths) for Leaflet divIcons */
  svg: string;
}

export const CATEGORIES: Record<WaypointCategory, CategoryMeta> = {
  peak: { label: 'Gipfel', color: '#f59e0b', Icon: Mountain, svg: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>' },
  hut: { label: 'Hütte', color: '#10b981', Icon: Home, svg: '<path d="M3 10 12 3l9 7v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 22V12h6v10"/>' },
  water: {
    label: 'Wasser',
    color: '#38bdf8',
    Icon: Droplet,
    svg: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  },
  viewpoint: { label: 'Aussicht', color: '#a78bfa', Icon: Eye, svg: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>' },
  parking: { label: 'Parkplatz', color: '#60a5fa', Icon: SquareParking, svg: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>' },
  danger: {
    label: 'Gefahr',
    color: '#f43f5e',
    Icon: AlertTriangle,
    svg: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  },
  info: { label: 'Info', color: '#94a3b8', Icon: Info, svg: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>' },
};

export const CATEGORY_ORDER: WaypointCategory[] = ['peak', 'hut', 'water', 'viewpoint', 'parking', 'danger', 'info'];

export const DIFFICULTY_TONE = {
  Einfach: 'emerald',
  Mittel: 'amber',
  Schwer: 'rose',
  Alpin: 'violet',
} as const;
