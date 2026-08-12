# ALPIN MAP – HTTPS Setup fuer iPhone/iPad
# Generiert ein lokal vertrauenswuerdiges HTTPS-Zertifikat mit mkcert
# Einmalig ausfuehren, danach "npm run dev" startet automatisch mit HTTPS

Write-Host ""
Write-Host "=== ALPIN MAP HTTPS Setup ===" -ForegroundColor Cyan
Write-Host ""

# mkcert installieren falls nicht vorhanden
$mkcert = Get-Command mkcert -ErrorAction SilentlyContinue
if (-not $mkcert) {
    Write-Host "mkcert nicht gefunden. Installation via winget..." -ForegroundColor Yellow
    winget install --id FiloSottile.mkcert -e
    # PATH neu laden
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $mkcert = Get-Command mkcert -ErrorAction SilentlyContinue
    if (-not $mkcert) {
        Write-Host "FEHLER: mkcert konnte nicht installiert werden." -ForegroundColor Red
        Write-Host "Bitte manuell installieren: https://github.com/FiloSottile/mkcert/releases" -ForegroundColor Red
        exit 1
    }
}

Write-Host "mkcert gefunden: $($mkcert.Source)" -ForegroundColor Green

# Lokale IP-Adresse ermitteln (Wi-Fi Netzwerk)
$localIP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp" } |
    Select-Object -First 1).IPAddress

if (-not $localIP) {
    # Fallback: erste nicht-interne IPv4-Adresse
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } |
        Select-Object -First 1).IPAddress
}

if (-not $localIP) {
    Write-Host "WARNUNG: Konnte lokale IP nicht ermitteln, verwende 192.168.1.1 als Platzhalter." -ForegroundColor Yellow
    $localIP = "192.168.1.1"
}

Write-Host "Lokale IP-Adresse: $localIP" -ForegroundColor Green

# Root-CA in Windows-Zertifikatspeicher installieren
Write-Host ""
Write-Host "Installiere mkcert Root-CA in Windows Trust Store..." -ForegroundColor Cyan
Write-Host "(Administratorrechte koennen erforderlich sein)" -ForegroundColor Yellow
mkcert -install

# certs/ Verzeichnis erstellen
New-Item -ItemType Directory -Force -Path "certs" | Out-Null

# Zertifikat fuer localhost + lokale IP generieren
Write-Host ""
Write-Host "Generiere HTTPS-Zertifikat fuer: localhost, 127.0.0.1, $localIP ..." -ForegroundColor Cyan
mkcert -key-file "certs/localhost-key.pem" -cert-file "certs/localhost.pem" localhost 127.0.0.1 $localIP

if (-not (Test-Path "certs/localhost.pem")) {
    Write-Host "FEHLER: Zertifikat konnte nicht erstellt werden." -ForegroundColor Red
    exit 1
}

# Root-CA fuer iPhone exportieren
$caRoot = (mkcert -CAROOT).Trim()
$rootCASource = Join-Path $caRoot "rootCA.pem"
if (Test-Path $rootCASource) {
    Copy-Item $rootCASource "certs/rootCA.pem" -Force
    Write-Host "Root-CA exportiert nach: certs/rootCA.pem" -ForegroundColor Green
}

# Ergebnis anzeigen
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host " HTTPS Setup abgeschlossen!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Server starten:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Im Browser testen:" -ForegroundColor White
Write-Host "   https://localhost:3443" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. iPhone/iPad einrichten:" -ForegroundColor White
Write-Host "   a) Datei 'certs/rootCA.pem' per AirDrop oder E-Mail ans iPhone senden" -ForegroundColor White
Write-Host "   b) Auf dem iPhone oeffnen → 'Erlauben' → 'Installieren'" -ForegroundColor White
Write-Host "   c) Einstellungen → Allgemein → Info → Zertifikat-Vertrauenseinstellungen" -ForegroundColor White
Write-Host "   d) 'mkcert ...' aktivieren (Schieberegler auf gruen)" -ForegroundColor White
Write-Host "   e) Safari oeffnen:" -ForegroundColor White
Write-Host "      https://${localIP}:3443" -ForegroundColor Yellow
Write-Host ""
Write-Host "iPhone und PC muessen im selben WLAN sein!" -ForegroundColor Cyan
Write-Host ""
