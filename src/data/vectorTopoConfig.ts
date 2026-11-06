/** Constants shared by the vector topo renderer and the offline downloader (no MapLibre import here). */
export const VECTOR_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
/** Vector tiles exist up to z14 (512px tiles, MapLibre overzooms beyond) */
export const VECTOR_MAXZOOM = 14;
export const DEM_URL = 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp';
/** global DEM coverage; higher zooms are overzoomed */
export const DEM_MAXZOOM = 12;
export const FONTS = ['Noto Sans Regular', 'Noto Sans Bold', 'Noto Sans Italic'];
/** Glyph ranges for Latin incl. accents, punctuation and the ▲ peak symbol (U+25B2) */
export const GLYPH_RANGES = ['0-255', '256-511', '512-767', '7680-7935', '8192-8447', '9472-9727'];
/** URL prefix for MapLibre requests that go through the offline tile cache */
export const CACHE_PROTOCOL = 'amc';
