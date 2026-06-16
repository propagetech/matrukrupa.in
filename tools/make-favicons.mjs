// Extract the real emblem from imgs/logo.webp and regenerate the full favicon set.
// No hand-drawn approximation: the emblem is cropped from the actual logo art.
//
// This logo is a GOLD-FIELD lockup (dark crescent + magenta disc + slate wordmark on a
// solid gold background, no alpha), so the stock detector (which keys on transparent/white)
// is adapted here: the background gold is auto-detected, "content" = anything that differs
// from the gold and is not near-white, and the emblem is the LEFTMOST content band (the
// crescent+disc, left of the gap before the wordmark). The emblem is seated on a tile filled
// with the SAME detected gold, so the gold field is seamless and self-contrasting on both
// light and dark browser tabs (no charcoal tile required for this brand).
// Usage: node tools/make-favicons.mjs [path/to/logo.webp]
import { chromium } from 'playwright-core';
import fs from 'fs';

const LOGO = process.argv[2] || 'imgs/logo.webp';
const LABEL = 'Matrukrupa Enterprise';
const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
const exe = chromePaths.find(p => { try { fs.accessSync(p); return true; } catch { return false; } });

const b64 = fs.readFileSync(LOGO).toString('base64');
const logoDataUrl = `data:image/webp;base64,${b64}`;

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();

const out = await page.evaluate(async ({ logoDataUrl }) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = logoDataUrl; });
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H).data;
  const px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };

  // Auto-detect the background gold (most common quantised colour on a coarse grid).
  const counts = {};
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
    const [r, g, b] = px(x, y); const k = `${r >> 4},${g >> 4},${b >> 4}`;
    counts[k] = (counts[k] || 0) + 1;
  }
  const [br, bg, bb] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    .split(',').map(n => (parseInt(n) << 4) + 8);

  const tol = 60;
  const isContent = (x, y) => {
    const [r, g, b] = px(x, y);
    if (r > 238 && g > 238 && b > 238) return false;            // near-white (e.g. the "m")
    return (Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb)) > tol;
  };

  // Column profile -> content bands along x; the LEFTMOST band is the emblem.
  const cols = new Array(W).fill(0);
  for (let x = 0; x < W; x++) { let n = 0; for (let y = 0; y < H; y += 2) if (isContent(x, y)) n++; cols[x] = n; }
  const maxc = Math.max(...cols), thr = maxc * 0.04;
  const bands = []; let inb = false, s = 0;
  for (let x = 0; x < W; x++) {
    if (cols[x] > thr && !inb) { inb = true; s = x; }
    else if (cols[x] <= thr && inb) { inb = false; bands.push([s, x - 1]); }
  }
  if (inb) bands.push([s, W - 1]);
  let [x0, x1] = bands[0];
  let y0 = H, y1 = 0;
  for (let x = x0; x <= x1; x++) for (let y = 0; y < H; y++) if (isContent(x, y)) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const pad = Math.round((x1 - x0) * 0.06);
  x0 = Math.max(0, x0 - pad); x1 = Math.min(W - 1, x1 + pad);
  y0 = Math.max(0, y0 - pad); y1 = Math.min(H - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const gold = `rgb(${br},${bg},${bb})`;

  const makeTile = (size, scale, rounded) => {
    const t = document.createElement('canvas'); t.width = size; t.height = size;
    const g = t.getContext('2d');
    if (rounded) {
      const r = size * 0.22; g.beginPath();
      g.moveTo(r, 0); g.arcTo(size, 0, size, size, r); g.arcTo(size, size, 0, size, r);
      g.arcTo(0, size, 0, 0, r); g.arcTo(0, 0, size, 0, r); g.closePath(); g.clip();
    }
    g.fillStyle = gold; g.fillRect(0, 0, size, size);        // seamless gold field
    const target = size * scale, ar = cw / ch;
    let dw, dh; if (ar >= 1) { dw = target; dh = target / ar; } else { dh = target; dw = target * ar; }
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(c, x0, y0, cw, ch, (size - dw) / 2, (size - dh) / 2, dw, dh);
    return t;
  };
  // Emblem crop for the SVG <image>, downscaled so the inlined SVG stays small.
  const cap = 160, es = Math.min(1, cap / Math.max(cw, ch));
  const ec = document.createElement('canvas'); ec.width = Math.round(cw * es); ec.height = Math.round(ch * es);
  const eg = ec.getContext('2d'); eg.imageSmoothingQuality = 'high';
  eg.drawImage(c, x0, y0, cw, ch, 0, 0, ec.width, ec.height);

  return {
    bbox: [x0, y0, cw, ch], aspect: cw / ch, gold,
    emblem: ec.toDataURL('image/png'),
    png16: makeTile(16, 0.82, false).toDataURL('image/png'),
    png32: makeTile(32, 0.82, false).toDataURL('image/png'),
    apple: makeTile(180, 0.72, false).toDataURL('image/png'),
    i192: makeTile(192, 0.66, false).toDataURL('image/png'),   // maskable safe area
    i512: makeTile(512, 0.66, false).toDataURL('image/png'),
    webp: makeTile(512, 0.66, false).toDataURL('image/webp', 0.92),
  };
}, { logoDataUrl });

await browser.close();

const write = (file, dataUrl) =>
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

write('imgs/favicon-16.png', out.png16);
write('imgs/favicon-32.png', out.png32);
write('imgs/apple-touch-icon.png', out.apple);
write('imgs/icon-192.png', out.i192);
write('imgs/icon-512.png', out.i512);
write('imgs/favicon.webp', out.webp);

// SVG favicon: rounded gold tile + the real emblem (embedded), matching the PNG tiles.
const SZ = 64, scale = 0.82, ar = out.aspect;
let ew, eh; if (ar >= 1) { ew = SZ * scale; eh = ew / ar; } else { eh = SZ * scale; ew = eh * ar; }
const ex = (SZ - ew) / 2, ey = (SZ - eh) / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SZ} ${SZ}" role="img" aria-label="${LABEL}">
  <rect width="${SZ}" height="${SZ}" rx="14" fill="${out.gold}"/>
  <image x="${ex.toFixed(2)}" y="${ey.toFixed(2)}" width="${ew.toFixed(2)}" height="${eh.toFixed(2)}" href="${out.emblem}"/>
</svg>
`;
fs.writeFileSync('imgs/favicon.svg', svg);

console.log('emblem bbox [x,y,w,h] =', out.bbox, ' aspect =', out.aspect.toFixed(3), ' gold =', out.gold);
console.log('wrote: favicon-16/32.png, apple-touch-icon.png, icon-192/512.png, favicon.webp, favicon.svg');
