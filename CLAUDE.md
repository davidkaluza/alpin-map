# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # dependencies (Bun, bun.lock)
bun run dev        # Vite dev server (--host, reachable from iPhone in LAN)
bun run build      # tsc --noEmit + vite build → dist/ (incl. service worker)
bun run preview    # serve dist/
bun run lint       # type check only
bun run icons      # regenerate PWA icons + iOS splash screens (sharp)
```

Set `BASE_PATH=/alpin-map/` when building for GitHub Pages (the deploy workflow does this).

## Architecture

**ALPIN MAP** is a purely static, offline-first PWA (React 19 + Vite + Leaflet + Tailwind v4 + motion). There is **no backend**: it is deployed to GitHub Pages via `.github/workflows/deploy.yml`. All third-party calls (tiles, Overpass, Open-Meteo, Gemini, Mapbox) go directly from the browser.

API keys (Gemini, Mapbox) are entered by the user in the app (Mehr › API-Schlüssel) and stored in localStorage via `src/lib/settings.ts`. Never hard-code keys or read them from env.

### Layout

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Root state (selected tour, layers, sheets, draw mode), wires everything |
| `src/components/MapView.tsx` | Leaflet map (imperative handle), offline-cached tile layer, markers, route animation |
| `src/components/ui/Sheet.tsx` | **The only modal surface** – bottom sheet on phones, centred panel ≥768px. All menus use it |
| `src/components/ui/controls.tsx` | Shared UI kit: Button, Fab, SegmentedTabs, Toggle, Section/Row, Field, Chip, Stat, AnimatedNumber |
| `src/components/panels/*` | Content of the main menu tabs (Touren, Navi, Orte, Offline, Mehr) |
| `src/components/sheets/*` | Secondary sheets (Layers, Elevation, POI, SOS, Privacy, Install) |
| `src/hooks/useNavigation.ts` | Navigation engine (GPS + simulation, recording) – lives in App so it keeps running when menus close |
| `src/hooks/useGeolocation.ts`, `useCompass.ts`, `useWakeLock.ts` | Device sensors |
| `src/services/offlineStorage.ts` | IndexedDB tile cache + region downloads (subdomain-independent keys) |
| `src/services/poiDetails.ts` | Dataset lookup → Gemini REST (google_search grounding) |
| `src/services/gpx.ts` | GPX parse/generate, export via Web Share |
| `src/lib/storage.ts` | Reactive localStorage store (`useStored`) – all persisted user data |
| `src/lib/geo.ts` | Distance, bearing, track stats, sun times, escapeHtml |
| `src/data/*` | Map layer definitions, sample tours, bundled POIs |

### Conventions

- Dark UI (slate-950), accent emerald. Use the `glass` / `glass-strong` utilities and the UI kit instead of ad-hoc styles so menus stay uniform.
- Respect safe areas (`--safe-top`, `--safe-bottom`, `--dock-h` in `index.css`); inputs must be ≥16px (iOS zoom).
- Escape any user/OSM/GPX text that goes into Leaflet HTML (`escapeHtml`).
- German UI copy.

## iOS / App Store

See `APP_STORE_CHECKLIST.md` for Capacitor packaging notes.
