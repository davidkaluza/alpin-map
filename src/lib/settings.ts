import { readStored, useStored } from './storage';

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  mapboxToken: string;
  showCenterHud: boolean;
  keepScreenAwake: boolean;
  haptics: boolean;
  autoFollow: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-flash-latest',
  mapboxToken: '',
  showCenterHud: false,
  keepScreenAwake: true,
  haptics: true,
  autoFollow: true,
};

export function useSettings() {
  const [stored, setStored] = useStored<Partial<AppSettings>>('settings', {});
  const settings: AppSettings = { ...DEFAULT_SETTINGS, ...stored };
  const update = (patch: Partial<AppSettings>) => setStored((prev) => ({ ...prev, ...patch }));
  return [settings, update] as const;
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...readStored<Partial<AppSettings>>('settings', {}) };
}
