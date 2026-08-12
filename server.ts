import express from 'express';
import path from 'path';
import https from 'https';
import http from 'http';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { lookupPOIFromCSV } from './src/data/poiCsvLoader';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Endpoint for POI Google Maps / Gemini Details & Grounding
app.post('/api/poi-details', async (req, res) => {
  const { name, lat, lng, ele, region, type } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'POI name is required' });
  }

  // 1. Check CSV Table First for verified offline POI data
  const csvMatch = lookupPOIFromCSV(name, region);
  if (csvMatch) {
    return res.json({
      name: csvMatch.name,
      description: `${csvMatch.description}\n\n• Region: ${csvMatch.region}\n• Höhe: ${csvMatch.ele ? csvMatch.ele + 'm' : 'k.A.'}\n• Saison / Ausstatung: ${csvMatch.openingSeason || csvMatch.facilities?.join(', ') || 'Alpin-Ausrüstung empfohlen'}`,
      openingHours: csvMatch.openingSeason || 'Mai bis Oktober',
      capacity: csvMatch.capacity,
      facilities: csvMatch.facilities,
      googleMapsUrl: csvMatch.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (region || ''))}`,
      source: 'csv_dataset'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return structured fallback if API key is not set
    return res.json({
      name,
      description: `Vollständige Informationen zu ${name} (${ele ? ele + 'm' : ''}) in der Region ${region || 'Alpen'}. Betrieben von alpinen Sektionen oder lokalen Wirten mit Einkehrmöglichkeit, Panoramablick und Weganbindungen.`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (region || ''))}`,
      openingHours: 'Mai bis Oktober (wetterabhängig)',
      source: 'offline_fallback'
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `Erstelle eine kompakte, präzise und nützliche Beschreibung auf Deutsch für folgende alpine Station / POI:
Name: ${name}
Typ: ${type === 'peak' ? 'Berggipfel' : type === 'refugio' ? 'Refugio / Schutzhütte' : 'Schutzhütte'}
Höhe: ${ele || 'unbekannt'}m
Region: ${region || 'Alpen'}
Geografische Koordinaten: ${lat}, ${lng}

Gib konkrete Details zu:
1. Kurze Übersicht & Besonderheiten
2. Erreichbarkeit & Wander-Schwierigkeit
3. Öffnungszeiten & Saison
4. Schlafplätze / Verpflegung (falls Schutzhütte) oder Aussicht (falls Gipfel)
5. Aktuelle Tipps für Bergsteiger`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || 'Keine detaillierte Beschreibung verfügbar.';
    
    // Extract grounding search links if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchLinks = groundingChunks
      .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
      .filter(Boolean);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (region || ''))}`;

    return res.json({
      name,
      description: text,
      searchLinks,
      googleMapsUrl,
      source: 'gemini_grounded'
    });

  } catch (err: any) {
    console.warn('Gemini API quota or network limit reached, providing structured POI fallback info:', err?.message || err);
    
    const typeLabel = type === 'peak' ? 'Berggipfel' : type === 'refugio' ? 'Schutzhütte / Refugio' : 'Alpine Schutzhütte';
    const fallbackDesc = `Aussichtsreicher ${typeLabel} "${name}" ${ele ? 'auf ' + ele + 'm ü. NHN' : ''} in der Region ${region || 'Alpen & Voralpen'}.\n\nWichtiger Orientierungspunkt und beliebte Station für Bergwanderer, Mountainbiker und Outdoor-Sportler mit spektakulärem Panorama und Wegenetz-Anbindung.`;

    return res.json({
      name,
      description: fallbackDesc,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (region || ''))}`,
      source: 'offline_fallback'
    });
  }
});

function getLocalIP(): string {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const HTTP_PORT = parseInt(process.env.PORT || '3000', 10);
  const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '3443', 10);
  const localIP = getLocalIP();

  const keyFile = path.join(process.cwd(), 'certs', 'localhost-key.pem');
  const certFile = path.join(process.cwd(), 'certs', 'localhost.pem');

  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    const credentials = {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile),
    };

    https.createServer(credentials, app).listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log('\n🔒 HTTPS Server aktiv:');
      console.log(`   Local:    https://localhost:${HTTPS_PORT}`);
      console.log(`   iPhone:   https://${localIP}:${HTTPS_PORT}\n`);
    });

    // HTTP → HTTPS redirect
    http.createServer((req, res) => {
      const host = (req.headers.host ?? '').split(':')[0];
      res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
      res.end();
    }).listen(HTTP_PORT, '0.0.0.0');
  } else {
    app.listen(HTTP_PORT, '0.0.0.0', () => {
      console.log(`\n🌐 HTTP Server: http://localhost:${HTTP_PORT}`);
      console.log(`   → Für iPhone/iPad: "npm run setup:https" ausführen\n`);
    });
  }
}

startServer();
