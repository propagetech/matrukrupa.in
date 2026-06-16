/**
 * DOM-aware WCAG contrast audit.
 *
 * Why this exists: a palette/token table only proves colours pass *in isolation*.
 * Real failures come from the cascade (which rule wins) and from which ancestor
 * actually paints the background. This loads each page in a real browser and, for
 * every visible text element, reads the COMPUTED foreground colour and the
 * COMPOSITED background behind it, then checks the WCAG 2.1 AA ratio.
 *
 * Background resolution handles:
 *   - solid background-color layers (composited up the ancestor chain, with alpha)
 *   - CSS gradients: the colour stops are averaged into a representative colour, so
 *     a dark gradient section is not mistaken for white. This is an approximation,
 *     adequate for the near-uniform brand gradients used here.
 *   - raster background-image: url(...): unknowable, so the element is reported as
 *     REVIEW (not a hard fail) rather than guessed.
 *
 * Usage:
 *   1) serve the site:   python3 -m http.server 8123
 *   2) install once:     (cd tools && npm i playwright-core)   # uses installed Chrome
 *   3) run:              node tools/contrast-audit.mjs [baseUrl] [/path ...]
 *      With no /paths it auto-discovers the root-level .html files of the project it
 *      is run from (archive/ is a subdir, so it is excluded).
 *
 * Exit code is 1 if any real AA failure is found, so it can gate CI.
 */
import { chromium } from 'playwright-core';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) || 'http://localhost:8123';
let PATHS = args.filter((a) => a.startsWith('/'));
if (!PATHS.length) {
  // Auto-discover pages: root *.html (flat sites) plus dir/index.html (directory
  // "pretty" URLs). Works for both layouts; archive/ and asset dirs are skipped.
  const cwd = process.cwd();
  const skip = new Set(['archive', 'tools', 'fonts', 'css', 'js', 'imgs', 'docs', 'node_modules', '.git', '.github']);
  const rootHtml = readdirSync(cwd).filter((f) => f.endsWith('.html')).map((f) => (f === 'index.html' ? '/' : '/' + f));
  const dirPages = readdirSync(cwd, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !skip.has(d.name) && existsSync(join(cwd, d.name, 'index.html')))
    .map((d) => '/' + d.name + '/');
  PATHS = [...new Set([...rootHtml, ...dirPages])];
}
PATHS.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));

const audit = () => {
  // ---- runs inside the page ----
  const parse = (s) => {
    const m = (s || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const over = (top, bot) => ({
    r: top.r * top.a + bot.r * (1 - top.a),
    g: top.g * top.a + bot.g * (1 - top.a),
    b: top.b * top.a + bot.b * (1 - top.a),
    a: 1,
  });
  // Average the colour stops of any gradient(s) in a background-image string.
  const gradient = (bgImage) => {
    if (!bgImage || bgImage === 'none') return { present: false, raster: false };
    const raster = /url\(/.test(bgImage);
    const cols = [...bgImage.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => {
      const p = m[1].split(',').map((x) => parseFloat(x.trim()));
      return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
    });
    if (!cols.length) return { present: false, raster };
    const n = cols.length, avg = { r: 0, g: 0, b: 0, a: 0 };
    for (const c of cols) { avg.r += c.r; avg.g += c.g; avg.b += c.b; avg.a += c.a; }
    return { present: true, raster, color: { r: avg.r / n, g: avg.g / n, b: avg.b / n, a: avg.a / n } };
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const la = lum(a), lb = lum(b), hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); };

  const effBg = (el) => {
    const chain = [];
    for (let n = el; n; n = n.parentElement) chain.push(n);
    let base = { r: 255, g: 255, b: 255, a: 1 }; // canvas default
    let raster = false;
    for (let i = chain.length - 1; i >= 0; i--) { // html -> el, paint order
      const cs = getComputedStyle(chain[i]);
      const bc = parse(cs.backgroundColor);
      if (bc.a > 0) base = over(bc, base);
      const g = gradient(cs.backgroundImage);
      if (g.present) base = over(g.color, base);
      if (g.raster) raster = true; // raster image we cannot read
    }
    return { color: base, raster };
  };

  const selFor = (el) => {
    const parts = [];
    let n = el;
    for (let i = 0; n && i < 4; i++) {
      let s = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(s + '#' + n.id); break; }
      if (n.className && typeof n.className === 'string') s += '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.');
      parts.unshift(s);
      n = n.parentElement;
    }
    return parts.join(' > ');
  };

  const results = [];
  for (const el of document.body.querySelectorAll('*')) {
    const ownText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
    if (!ownText) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const fgRaw = parse(cs.color);
    const bg = effBg(el);
    const fg = fgRaw.a < 1 ? over(fgRaw, bg.color) : fgRaw;
    const r = ratio(fg, bg.color);

    const px = parseFloat(cs.fontSize);
    const wt = parseInt(cs.fontWeight, 10) || (cs.fontWeight === 'bold' ? 700 : 400);
    const big = px >= 24 || (px >= 18.66 && wt >= 700);
    const required = big ? 3.0 : 4.5;

    results.push({
      sel: selFor(el),
      text: ownText.slice(0, 48),
      fg: `rgb(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`,
      bg: `rgb(${Math.round(bg.color.r)},${Math.round(bg.color.g)},${Math.round(bg.color.b)})`,
      ratio: Math.round(r * 100) / 100,
      required, raster: bg.raster,
      status: r >= required ? 'pass' : (bg.raster ? 'review' : 'fail'),
    });
  }
  return results;
  // ---- end in-page ----
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

let totalFail = 0, totalReview = 0, totalChecked = 0;
for (const path of PATHS) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  const res = await page.evaluate(audit);
  totalChecked += res.length;
  const fails = res.filter((r) => r.status === 'fail');
  const reviews = res.filter((r) => r.status === 'review');
  totalReview += reviews.length;
  console.log(`\n=== ${path}  (${res.length} text elements, ${fails.length} fail, ${reviews.length} review) ===`);
  if (!fails.length && !reviews.length) console.log('  PASS: all text meets AA');
  for (const f of fails) {
    totalFail++;
    console.log(`  FAIL ${f.ratio}:1 (need ${f.required}) ${f.fg} on ${f.bg}`);
    console.log(`       ${f.sel}`);
    console.log(`       "${f.text}"`);
  }
  for (const r of reviews) {
    console.log(`  REVIEW (text over a raster image) ${r.fg}  ${r.sel}  "${r.text}"`);
  }
}
console.log(`\n----------------------------------------`);
console.log(`Checked ${totalChecked} text elements across ${PATHS.length} pages.`);
console.log(totalFail === 0 ? 'RESULT: PASS (no AA contrast failures)' : `RESULT: ${totalFail} AA FAILURE(S)`);
if (totalReview) console.log(`(${totalReview} element(s) sit over a raster image and need a manual look.)`);
await browser.close();
process.exit(totalFail === 0 ? 0 : 1);
