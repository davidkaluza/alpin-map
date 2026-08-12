import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// SVG template for iOS and PWA icons with full solid background #090d16 (no transparency at edges for iOS)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Solid background without rounded corners so iOS handles native clipping -->
  <rect width="512" height="512" fill="#090d16" />
  
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
      <stop offset="70%" stop-color="#059669" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#090d16" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="mountainLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7" />
      <stop offset="40%" stop-color="#34d399" />
      <stop offset="80%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="backMountainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#64748b" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.3" />
    </linearGradient>
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background radial glow -->
  <rect width="512" height="512" fill="url(#bgGlow)" />

  <!-- Background Mountain Silhouette -->
  <path d="M 25 410 L 128 256 L 205 333 L 307 205 L 399 307 L 487 410 Z" fill="url(#backMountainGrad)" stroke="#475569" stroke-width="6" stroke-linejoin="round" />

  <!-- Main Contour Mountain Line (Front Peak) -->
  <path d="M 10 420 Q 60 420 90 360 L 180 190 L 245 285 L 348 110 L 430 265 L 502 420" stroke="url(#mountainLineGrad)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glowFilter)" />

  <!-- Peak Accent Contours -->
  <path d="M 348 110 L 348 230 M 180 190 L 195 260" stroke="#a7f3d0" stroke-width="10" stroke-linecap="round" opacity="0.9" />

  <!-- Summit Beacon Circle -->
  <circle cx="348" cy="70" r="18" fill="#34d399" filter="url(#glowFilter)" />
  <circle cx="348" cy="70" r="10" fill="#ffffff" />
</svg>`;

async function generateIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(iconSvg);

  const targets = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'apple-touch-icon-180x180.png', size: 180 },
    { name: 'apple-touch-icon-152x152.png', size: 152 },
    { name: 'apple-touch-icon-167x167.png', size: 167 },
    { name: 'pwa-192.png', size: 192 },
    { name: 'pwa-512.png', size: 512 },
    { name: 'favicon-32x32.png', size: 32 },
  ];

  for (const t of targets) {
    const outputPath = path.join(publicDir, t.name);
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(outputPath);
    console.log(`Generated ${t.name} (${t.size}x${t.size})`);
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
