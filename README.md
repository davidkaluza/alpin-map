# ALPIN MAP

Offline-fähige Wander- und Bergsteiger-PWA für iPhone (optimiert für iPhone 17 / 17 Pro / 17 Pro Max / Air), Android und Desktop.

**Live:** https://davidkaluza.github.io/alpin-map/

## Funktionen

- Topografische Karten (OpenTopoMap, Esri, CyclOSM, Satellit, Nacht, optional Mapbox) + Wanderwege-Overlay
- Gipfel & Hütten aus eingebautem Datensatz und live aus OpenStreetMap
- Touren: Vorschläge, GPX-Import (mehrere Dateien), Route auf der Karte zeichnen, GPX-Export über das iOS-Teilen-Menü
- GPS-Navigation mit Restdistanz, Abweichungswarnung, Kompass, Track-Aufzeichnung, Display-wach-halten, Simulation
- Interaktives Höhenprofil (Touch), Sonnenauf-/untergang, Geländehöhe
- Offline-Karten: Gebiete herunterladen, automatischer Kachel-Cache, Nur-Offline-Modus
- Eigene Orte (Wegpunkte), SOS-Ansicht mit Koordinaten und Notrufnummern
- KI-Beschreibungen von Gipfeln/Hütten über Google Gemini (optional)

## API-Schlüssel

Es werden **keine** Schlüssel im Code oder Build benötigt. Optional in der App unter **Mehr › API-Schlüssel**:

| Schlüssel | Zweck |
|---|---|
| Google Gemini API-Key | KI-Beschreibungen (mit Google-Suche) |
| Mapbox Access Token (`pk.…`) | Mapbox Outdoors / Satellit |

Die Schlüssel liegen nur im `localStorage` des Geräts und werden direkt vom Browser an Google bzw. Mapbox geschickt. Hinweis: Wer Zugriff auf das entsperrte Gerät hat, kann sie auslesen – nutze bei Gemini nach Möglichkeit einen Key mit Nutzungslimit.

## Entwicklung

```bash
bun install
bun run dev        # Dev-Server (auch im LAN erreichbar)
bun run build      # Typecheck + Produktions-Build nach dist/
bun run preview    # Build lokal testen
bun run icons      # Icons & iOS-Startbildschirme neu erzeugen
```

## Deployment (GitHub Pages)

Der Workflow `.github/workflows/deploy.yml` baut bei jedem Push auf `main` und veröffentlicht `dist/`.
Einmalig nötig: **Settings › Pages › Build and deployment › Source: „GitHub Actions“**.

## Auf dem iPhone installieren

Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“. Die App läuft dann im Vollbild und offline.
