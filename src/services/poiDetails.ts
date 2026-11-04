import type { AlpinePOI } from '../types';
import { lookupPOIFromCSV } from '../data/poiCsvLoader';
import { getSettings } from '../lib/settings';

export interface POIDetails {
  description: string;
  searchLinks: { title: string; uri: string }[];
  source: 'gemini' | 'dataset' | 'osm' | 'none';
  error?: string;
}

const cache = new Map<string, POIDetails>();

const GEMINI_ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

function typeLabel(poi: AlpinePOI) {
  return poi.type === 'peak' ? 'Berggipfel' : poi.type === 'refugio' ? 'Biwak / Unterstand' : 'Schutzhütte';
}

async function askGemini(poi: AlpinePOI, apiKey: string, model: string, signal?: AbortSignal): Promise<POIDetails> {
  const prompt = `Erstelle eine kompakte, sachliche Beschreibung auf Deutsch (max. 180 Wörter, Stichpunkte erlaubt, kein Markdown-Fett) für diesen alpinen Ort:
Name: ${poi.name}
Typ: ${typeLabel(poi)}
Höhe: ${poi.ele || 'unbekannt'} m
Region: ${poi.region}
Koordinaten: ${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}

Gliederung: Überblick · Zustieg & Schwierigkeit · Saison/Öffnungszeiten · ${poi.type === 'peak' ? 'Aussicht' : 'Übernachtung & Verpflegung'} · Tipps.
Wenn Informationen unsicher sind, sag das ausdrücklich statt zu raten.`;

  const res = await fetch(GEMINI_ENDPOINT(model, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const candidate = data?.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
    .replace(/\*\*/g, '')
    .trim();
  const chunks: Array<{ web?: { title?: string; uri?: string } }> = candidate?.groundingMetadata?.groundingChunks ?? [];
  const searchLinks = chunks
    .filter((c) => c.web?.uri)
    .map((c) => ({ title: c.web!.title || c.web!.uri!, uri: c.web!.uri! }))
    .slice(0, 6);
  if (!text) throw new Error('Leere Antwort');
  return { description: text, searchLinks, source: 'gemini' };
}

export async function getPOIDetails(poi: AlpinePOI, signal?: AbortSignal): Promise<POIDetails> {
  const { geminiApiKey, geminiModel } = getSettings();
  const cacheKey = `${poi.id}|${geminiApiKey ? 'ai' : 'local'}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const csv = lookupPOIFromCSV(poi.name);
  const local: POIDetails = csv
    ? { description: csv.description, searchLinks: [], source: 'dataset' }
    : poi.description
      ? { description: poi.description, searchLinks: [], source: poi.id.startsWith('osm-') ? 'osm' : 'dataset' }
      : { description: '', searchLinks: [], source: 'none' };

  if (geminiApiKey && navigator.onLine) {
    try {
      const ai = await askGemini(poi, geminiApiKey, geminiModel || 'gemini-flash-latest', signal);
      cache.set(cacheKey, ai);
      return ai;
    } catch (e) {
      if (signal?.aborted) throw e;
      return { ...local, error: (e as Error).message };
    }
  }
  cache.set(cacheKey, local);
  return local;
}

/** Validates a Gemini key with a minimal request. */
export async function testGeminiKey(apiKey: string, model: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(GEMINI_ENDPOINT(model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Antworte nur mit OK.' }] }], generationConfig: { maxOutputTokens: 5 } }),
    });
    if (res.ok) return { ok: true, message: 'Verbindung erfolgreich' };
    const data = await res.json().catch(() => null);
    return { ok: false, message: data?.error?.message || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
