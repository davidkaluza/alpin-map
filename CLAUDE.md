# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev       # Start full-stack dev server (tsx server.ts, includes Vite HMR)
npm run build     # Production build: Vite (frontend) + esbuild (server → dist/server.cjs)
npm run start     # Run production build (node dist/server.cjs)
npm run lint      # TypeScript type check only, no emit (tsc --noEmit)
npm run clean     # Remove dist/ and server.js
```

Package manager is **Bun** (bun.lock present) — use `bun install` for dependencies.

## Environment Setup

Copy `.env.example` to `.env` and set:
- `GEMINI_API_KEY` — required for `/api/poi-details` AI endpoint
- `VITE_MAPBOX_TOKEN` — optional, for Mapbox custom map styles

## Architecture

**ALPIN MAP** is an offline-first PWA for Alpine hiking navigation. It runs as a React SPA backed by an Express server that proxies AI requests.

### Request Flow

```
Browser → Vite dev server (port proxied) → Express (server.ts)
                                              └─ /api/poi-details → Google Gemini API
```

The Express server (`server.ts`) both serves the compiled frontend and exposes the Gemini-backed POI API. In production, `dist/server.cjs` handles everything.

### State Management

All significant app state lives in `src/App.tsx` — no external store (Redux/Zustand). Components receive state and callbacks as props. Key state slices:
- Active tour / waypoints
- Navigation mode (idle / simulating / recording)
- Recorded GPS track
- UI panel visibility

### Offline Tile Caching

`src/services/offlineStorage.ts` wraps IndexedDB for map tile storage. `src/components/MapContainer.tsx` extends Leaflet's `TileLayer` with a custom `OfflineCachedTileLayer` class that reads from IndexedDB before fetching from network.

### Data Services

| File | Purpose |
|------|---------|
| `src/services/gpx.ts` | GPX file parsing (DOMParser) and generation |
| `src/services/elevationService.ts` | Elevation data fetching for route profiles |
| `src/services/overpassPoiService.ts` | Live OSM peak data via Overpass API |
| `src/services/offlineStorage.ts` | IndexedDB tile cache read/write |
| `src/data/poiCsvLoader.ts` | CSV fallback for POI descriptions when Gemini unavailable |

### Core Types

All shared TypeScript interfaces are in `src/types/index.ts`. Key types: `Coordinate`, `Tour`, `Waypoint` (with category union: `peak | hut | water | viewpoint | parking | danger | info`), `RecordedTrack`.

### Styling Conventions

Tailwind CSS v4. Dark-mode-first (slate-950 backgrounds). Primary accent: emerald `#10b981`. Glass morphism via `backdrop-blur` + semi-transparent backgrounds. Safe-area insets applied for iOS notch support.

## Build Output

- `dist/` — frontend assets (Vite)
- `dist/server.cjs` — bundled Express server (esbuild CommonJS)

## iOS / App Store Notes

See `APP_STORE_CHECKLIST.md` for Capacitor setup and App Store submission requirements. The `PrivacyLegalModal` component handles GDPR data export/deletion required for App Store compliance (Section 5.1.1).
