// Generates PWA icons, Apple touch icons and iOS splash screens (incl. iPhone 17 family).
// Usage: npm run icons
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const logo = (size, { background = true, padding = 0 } = {}) => {
  const s = 512;
  const inner = s - padding * 2;
  const scale = inner / s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${size}" height="${size}">
  ${background ? `<rect width="${s}" height="${s}" fill="#020617"/>` : ''}
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#059669" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7"/>
      <stop offset="45%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="back" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#64748b" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.3"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feComposite in="SourceGraphic" in2="b" operator="over"/>
    </filter>
  </defs>
  ${background ? `<rect width="${s}" height="${s}" fill="url(#glow)"/>` : ''}
  <g transform="translate(${padding} ${padding}) scale(${scale})">
    <path d="M 25 410 L 128 256 L 205 333 L 307 205 L 399 307 L 487 410 Z" fill="url(#back)" stroke="#475569" stroke-width="6" stroke-linejoin="round"/>
    <path d="M 10 420 Q 60 420 90 360 L 180 190 L 245 285 L 348 110 L 430 265 L 502 420" stroke="url(#line)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#blur)"/>
    <path d="M 348 110 L 348 230 M 180 190 L 195 260" stroke="#a7f3d0" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
    <circle cx="348" cy="70" r="18" fill="#34d399" filter="url(#blur)"/>
    <circle cx="348" cy="70" r="10" fill="#ffffff"/>
  </g>
</svg>`;
};

// [cssWidth, cssHeight, pixelRatio]
const SPLASH_DEVICES = [
  [402, 874, 3], // iPhone 17, 17 Pro, 16 Pro
  [440, 956, 3], // iPhone 17 Pro Max, 16 Pro Max
  [420, 912, 3], // iPhone Air
  [393, 852, 3], // iPhone 16, 15, 15 Pro
  [430, 932, 3], // iPhone 16 Plus, 15 Plus/Pro Max
  [390, 844, 3], // iPhone 16e, 14, 13
  [375, 812, 3], // iPhone 13 mini, X/XS
];

async function main() {
  const pub = path.resolve('public');
  const splashDir = path.join(pub, 'splash');
  fs.mkdirSync(splashDir, { recursive: true });

  const icons = [
    ['apple-touch-icon.png', 180],
    ['apple-touch-icon-180x180.png', 180],
    ['apple-touch-icon-167x167.png', 167],
    ['apple-touch-icon-152x152.png', 152],
    ['pwa-192.png', 192],
    ['pwa-512.png', 512],
    ['favicon-32x32.png', 32],
  ];
  for (const [name, size] of icons) {
    await sharp(Buffer.from(logo(size))).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(pub, name));
    console.log('icon', name);
  }
  // Maskable: logo within 80 % safe zone
  await sharp(Buffer.from(logo(512, { padding: 56 }))).png({ compressionLevel: 9 }).toFile(path.join(pub, 'pwa-maskable-512.png'));
  console.log('icon pwa-maskable-512.png');

  for (const [w, h, r] of SPLASH_DEVICES) {
    const W = w * r;
    const H = h * r;
    const logoSize = Math.round(Math.min(W, H) * 0.32);
    const logoPng = await sharp(Buffer.from(logo(logoSize, { background: false }))).png().toBuffer();
    const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs><radialGradient id="g" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="#020617"/><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
    const name = `splash-${W}x${H}.png`;
    await sharp(Buffer.from(bg))
      .composite([{ input: logoPng, top: Math.round(H * 0.45 - logoSize / 2), left: Math.round((W - logoSize) / 2) }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(path.join(splashDir, name));
    console.log('splash', name, `media: (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
