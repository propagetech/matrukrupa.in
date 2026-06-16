// Build a HORIZONTAL brand lockup from the real logo: emblem (the symbol) + the real
// "GrykonX" wordmark side by side, with the tagline dropped. 100% real logo art (the
// wordmark is cropped from the logo, not re-typeset), so it is not a fake wordmark.
// Output: imgs/logo-horizontal.webp (transparent). Use it in the HEADER; the footer keeps
// the full stacked logo.webp.
// Usage: node tools/make-logo-lockup.mjs [path/to/logo.webp]
import { chromium } from 'playwright-core';
import fs from 'fs';

const LOGO = process.argv[2] || 'imgs/logo.webp';
const exe = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].find(p => { try { fs.accessSync(p); return true; } catch { return false; } });

const logoDataUrl = `data:image/webp;base64,${fs.readFileSync(LOGO).toString('base64')}`;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();

const out = await page.evaluate(async ({ logoDataUrl }) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = logoDataUrl; });
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;
  const isContent = i => {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 24) return false;
    if (r > 240 && g > 240 && b > 240) return false;
    return true;
  };
  // vertical content bands
  const rows = new Array(H).fill(0);
  for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x += 2) if (isContent((y * W + x) * 4)) n++; rows[y] = n; }
  const thr = Math.max(...rows) * 0.04;
  const bands = []; let inb = false, s = 0;
  for (let y = 0; y < H; y++) {
    if (rows[y] > thr && !inb) { inb = true; s = y; }
    else if (rows[y] <= thr && inb) { inb = false; bands.push([s, y - 1]); }
  }
  if (inb) bands.push([s, H - 1]);
  const xb = (y0, y1) => { let x0 = W, x1 = 0; for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) if (isContent((y * W + x) * 4)) { if (x < x0) x0 = x; if (x > x1) x1 = x; } return [x0, x1]; };
  const bbox = ([y0, y1]) => { const [x0, x1] = xb(y0, y1); return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };

  // emblem = first band; wordmark = everything between emblem and the tagline (last band); tagline dropped
  const emblem = bbox(bands[0]);
  let wmBands = bands.length >= 3 ? bands.slice(1, bands.length - 1) : bands.slice(1, 2);
  const wy0 = Math.min(...wmBands.map(b => b[0])), wy1 = Math.max(...wmBands.map(b => b[1]));
  const word = bbox([wy0, wy1]);

  // layout (2x for crispness)
  const S = 2;
  const embH = 120 * S;                       // emblem display height
  const embW = embH * (emblem.w / emblem.h);
  const wordH = embH * 0.74;                   // wordmark scaled relative to the symbol
  const wordW = wordH * (word.w / word.h);
  const gap = 26 * S, pad = 8 * S;
  const CW = Math.round(pad * 2 + embW + gap + wordW);
  const CH = Math.round(pad * 2 + embH);
  const t = document.createElement('canvas'); t.width = CW; t.height = CH;
  const g = t.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const mid = CH / 2;
  // emblem
  g.drawImage(c, emblem.x, emblem.y, emblem.w, emblem.h, pad, mid - embH / 2, embW, embH);
  // wordmark, vertically centered on the same midline
  g.drawImage(c, word.x, word.y, word.w, word.h, pad + embW + gap, mid - wordH / 2, wordW, wordH);

  return { webp: t.toDataURL('image/webp', 0.95), w: CW, h: CH };
}, { logoDataUrl });

await browser.close();
fs.writeFileSync('imgs/logo-horizontal.webp', Buffer.from(out.webp.split(',')[1], 'base64'));
console.log(`wrote imgs/logo-horizontal.webp  (${out.w}x${out.h}, intrinsic for width/height attrs)`);
