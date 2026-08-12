# 🍎 Apple App Store Compliance & Launch Roadmap (ALPIN MAP)

Dieses Dokument bietet eine vollständige Übersicht über die erlagenen **Apple App Store Review Guidelines**, die im Quellcode umgesetzten Funktionen sowie die verbleibende **TODO-Checkliste** für das Deployment über Xcode / Capacitor in den App Store.

---

## 📊 Status-Übersicht: Erfüllte App Store Richtlinien

| Richtlinie / Section | Thema | Im Quellcode umgesetzt | Status |
| :--- | :--- | :--- | :---: |
| **5.1.1 Data Privacy** | Datenschutzerklärung & Nutzerdaten-Löschung | Dedicated `PrivacyLegalModal.tsx` mit Export & vollständiger Datenlöschung (Wipe local caches & IndexedDB) | ✅ **100% Bereit** |
| **2.5.1 Hardware Features** | GPS & Akku-Hinweis im Hintergrund | GPS-Transparenz-Hinweis & Akku-Warnung vor Track-Aufzeichnung | ✅ **100% Bereit** |
| **2.1 Performance** | Offline-Fähigkeit & Fallback | Persistent IndexedDB Tile Caching & Graceful Offline Fallbacks | ✅ **100% Bereit** |
| **4.0 Design & UI** | iOS Viewport & Safe Areas | `viewport-fit=cover` & Safe Area Padding Support in `index.html` & `index.css` | ✅ **100% Bereit** |
| **1.2 UGC & Safety** | Haftungsausschluss & Bergsicherheit | Bergsicherheits-Disclaimer & Nutzungsbedingungen für GPX-Imports | ✅ **100% Bereit** |
| **3.1 Business** | Kostenlose Kernfunktionen | Voller Funktionsumfang ohne versteckte Paywalls oder IAP-Zwang | ✅ **100% Bereit** |

---

## 🚀 Im Quellcode umgesetzte Compliance-Funktionen

1. **Datenschutz- & Rechtemodal (`/src/components/PrivacyLegalModal.tsx`)**:
   - In-App Datenschutzerklärung ohne Werbecookies oder IDFA-Tracking.
   - **Nutzerdaten-Export (JSON)**: Ein-Klick-Export aller benutzerdefinierten GPX-Routen und Wegpunkte gemäß Section 5.1.1.
   - **Vollständige Datenlöschung**: Möglichkeit für den Nutzer, alle lokalen Daten, Touren und Offline-Karten-Caches (IndexedDB) unwiderruflich zu löschen.
2. **iOS Safe Area & Display Anpassungen (`index.html`)**:
   - `viewport-fit=cover` in den Meta-Tags hinzugefügt für korrekte Darstellung bei iPhones mit Notch / Dynamic Island.
3. **PWA Manifest (`public/manifest.json`)**:
   - Vorkonfiguriertes App Store Manifest mit Name, Beschreibung, Icons (`192x192`, `512x512`, `apple-touch-icon`) und `standalone` Modus.
4. **Alpin-Sicherheit & GPS Akku-Transparenz**:
   - Transparente Hinweise zur GPS-Nutzung und Akkulaufzeit im Hintergrund gemäß App Store Section 2.5.1.

---

## 📝 TODO-Checkliste für den App Store Launch (Developer Tasks)

Die folgenden Schritte müssen vom Entwickler / App-Owner außerhalb dieser Webumgebung im Apple Developer Account & Xcode durchgeführt werden:

### 1. Apple Developer Account & Zertifikate
- [ ] Enrollment im **Apple Developer Program** ($99/Jahr) auf [developer.apple.com](https://developer.apple.com) abschließen.
- [ ] Erstellen einer **App ID** (z. B. `de.alpinmap.outdoor.app`) im Apple Developer Portal.
- [ ] Erstellen eines **Distribution Certificates** und eines **Provisioning Profiles** für den App Store Versand.

### 2. Native iOS Wrapper Setup (Capacitor / Xcode)
Da diese Anwendung als PWA/Web-App gebaut ist, wird sie mit **Capacitor** in ein natives Xcode-Projekt verpackt:
- [ ] Befehl im Projektverzeichnis ausführen:
  ```bash
  npm install @capacitor/core @capacitor/ios
  npm install -D @capacitor/cli
  npx cap init "ALPIN MAP" "de.alpinmap.outdoor.app"
  npm run build
  npx cap add ios
  npx cap copy
  ```
- [ ] In `ios/App/App/Info.plist` folgende **Entitlements für Standort-Zugriffe** eintragen (Pflicht für Apple Review):
  ```xml
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>ALPIN MAP benötigt Ihre Position, um Ihren aktuellen Standort auf der topografischen Wanderkarte anzuzeigen.</string>
  <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
  <string>ALPIN MAP benötigt Standortzugriff im Hintergrund, um Wandertracks und Tourenverläufe auch bei ausgeschaltetem Bildschirm aufzuzeichnen.</string>
  ```

### 3. Öffentliche Datenschutzerklärung URL
- [ ] Die Datenschutzerklärung auf einer öffentlichen Webadresse hosten (z. B. `https://alpinmap.app/privacy` oder auf GitHub Pages), da App Store Connect bei der Einreichung ein Pflichtfeld "Privacy Policy URL" verlangt.

### 4. App Store Connect Assets & Metadaten
- [ ] **App Icon**: `1024x1024 px` PNG (Quadratisch, ohne Transparenzen / Alpha-Kanal).
- [ ] **Screenshots**:
  - 6,5-Zoll Display (z. B. iPhone 15 Pro Max: `1290 x 2796 px`)
  - 5,5-Zoll Display (z. B. iPhone 8 Plus: `1242 x 2208 px`)
- [ ] **App-Beschreibung & Keywords**:
  - *Titel*: ALPIN MAP - Outdoor GPS Karte
  - *Kategorie*: Sport / Navigation / Reisen
  - *Keywords*: Wanderkarte, GPS, Offline Karte, GPX, Wandern, Alpen, Topografie, Schutzhütte

### 5. TestFlight & Review Einreichung
- [ ] Projekt in Xcode öffnen (`npx cap open ios`).
- [ ] Zielgerät auf "Any iOS Device (arm64)" stellen.
- [ ] `Product -> Archive` wählen.
- [ ] Die gebaute App zu **App Store Connect** hochladen.
- [ ] In **TestFlight** einen internen/externen Test durchführen.
- [ ] Zur **App Store Prüfung einreichen** (App Review dauert i. d. R. 24–48 Stunden).

---

*Erstellt für ALPIN MAP - Ready for iOS & App Store Submission.*
