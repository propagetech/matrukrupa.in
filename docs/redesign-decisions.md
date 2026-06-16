# Matrukrupa Enterprise: redesign decisions log

Newest entries first. This log captures the decisions made while rebuilding
`matrukrupa.in` from the old website-builder export into a hand-built static site,
in the ProPage house standard (semantic HTML5, one CSS, one JS, self-hosted fonts,
WCAG 2.1 AA, directory URLs, schema.org). The design-system reference is `CLAUDE.md`.

---

## The business

**Matrukrupa Enterprise** is a retail fixtures and store fit-out company founded in
**2008**, operating **Pan India** with a registered office in **Ahmedabad** and a
corporate office in **Mumbai**. It designs, manufactures and installs complete retail
environments: fixtures (EBO / MBO / SIS / gondolas), fit-outs (civil, interior, MEP,
panelling) and in-store branding (backlit frames and print, specialised LED signage,
ACP cladding, store-front signage). It processes solid wood, MDF, veneer, laminates,
painted surfaces, metal, acrylic and lighting/electrical structures, and works to brand
guidelines for fashion, lifestyle, footwear, clothing, food and cosmetics retailers.

Tagline (kept from the original site): **"Your imagination, our creation."**
Positioning line: **Complete retail fixture solutions.**
Self-described capacity: **"100 man years of experience"**; belief: **"the difference
is in the detail."**

Genuine client/brand work visible in the original photos: Skechers, Snitch, Rare Rabbit,
Campus, Celio, Pepe Jeans, Tales & Stories, Denis Lingo, Rangriti, Killer, Holander, W,
Aurelia (and brand logos for Canon, Ricoh, Pantaloons, Aldo, Gini & Jony, Shoppers Stop,
MRF, Flying Machine and others).

## Canonical domain and contact

- Canonical/production domain: **https://www.matrukrupa.in/** (with `www`), from the
  original sitemap. Preview is a GitHub Pages project page at
  `https://propagetech.github.io/matrukrupa.in/` (a subpath), so all assets/links are
  path-portable (see URL convention below).
- Contact is **email-led with no backend** (house standard).

### Contact details: NEEDS OWNER CONFIRMATION (flagged, not invented)

The old contact page had **inconsistent, conflicting** contact data (a classic builder
artefact). We did NOT invent anything; we led with the safest values and flagged the rest:

- **Email** used on the new site: **info@matrukrupa.in**. Reason: the old page showed
  three different `@matrukrupa.in` mailboxes (`krunal@`, `darshil@`, `dharmendra@`) plus
  a mismatched Gmail in display text (`matrurkrupa522@gmail.com`, itself a likely typo of
  `matrukrupa522@gmail.com`). Rather than pick one person's mailbox, we use a neutral
  role address on the real domain. **Owner must confirm the correct public inbox** (and
  whether `info@matrukrupa.in` exists / should be created, or which named mailbox to use).
- **Phone**: the old page's visible number (`+91 98245 48082`) did NOT match its `tel:`
  link (`+91 9136174005`); the footer carried yet more numbers. Because we cannot tell
  which is correct, the new site **omits a phone/WhatsApp** and leads with email. **Owner
  to provide the correct phone + WhatsApp** to add a `tel:` and `wa.me` link.
- **Addresses**: only city names existed (Registered Office: Ahmedabad; Corporate Office:
  Mumbai). We show the two cities, not invented street addresses. **Owner to provide full
  postal addresses** if they want them shown (and for `PostalAddress` schema).
- **Social (real, kept):** Facebook `facebook.com/Matrukrupaenterprise123`, Instagram
  `instagram.com/matrukrupa_enterprise123`.

## Brand palette (derived from `imgs/logo.webp`)

The logo is a slate wordmark and a slate crescent embracing a magenta disc (a white "m")
on a warm gold field. Dominant colours sampled from the logo via canvas:
gold `#d0b050`, slate `#404050`, magenta `#a03090`. Tuned into an AA-locked token set.

| Token | Hex | Use | Verified |
| --- | --- | --- | --- |
| `--cream` | `#f6f1e7` | Page background | base |
| `--cream-2` | `#fbf8f1` | Alt section background | base |
| `--surface` | `#ffffff` | Cards | base |
| `--ink` | `#1d232b` | Primary text | 14.0:1 on cream |
| `--ink-2` | `#444e59` | Secondary text | 7.5:1 on cream |
| `--ink-3` | `#5a6470` | Muted / meta | 5.3:1 on cream |
| `--slate` | `#232a32` | Dark sections | white 14.5:1 |
| `--slate-2` | `#1a2026` | Footer | white 16.4:1 |
| `--cream-muted` | `#c9d0d8` | Text on slate | 9.3:1 on slate |
| `--gold` | `#d0b050` | Brand fill, primary button bg, decorative | ink label 7.5:1 |
| `--gold-strong` | `#cda23f` | Decorative gold (NOT text on light) | fails as light text by design |
| `--bronze-ink` | `#7c5e1f` | Gold-family **text/links** on light | 5.4:1 on cream |
| `--gold-on-dark` | `#e0bb63` | Gold text/eyebrow/border on slate | 7.9:1 on slate |
| `--magenta` | `#a8328f` | Accent fill, on light surfaces with white text | white 6.0:1 |
| `--magenta-ink` | `#93286f` | Magenta **text/links** on light | 6.7:1 on cream |
| `--magenta-on-dark` | `#d875b8` | Magenta accent on slate | 4.9:1 on slate |

Rules that keep AA valid (verified by the DOM audit, not eyeballed):
- **Primary button** = `--gold` bg + `--ink` label (7.5:1) + a `#9a7b2c` border so the
  component boundary is >= 3:1 on cream.
- **Gold is fill-only on light surfaces.** Never use `--gold`/`--gold-strong` as text on
  cream/white (2.1:1, fails). Gold-family text on light uses `--bronze-ink`.
- On slate, borders/eyebrows use `--gold-on-dark` (the mid gold is only 2.9:1 on slate).
- Magenta works as text on light (`--magenta-ink`) and as accent on slate
  (`--magenta-on-dark`). White on magenta `#a8328f` is 6.0:1 (AA).
- Focus ring: 3px `--magenta` on light, `--gold-on-dark` on dark. Plus a contrasting
  outline-offset shadow.

## Typography

- Headings: **Manrope** (geometric, architectural sans; weights 600/700/800). Chosen to
  convey precision/manufacturing/fit-out, and to give Matrukrupa its own identity distinct
  from the sibling sites' Fraunces.
- Body and UI: **Inter** (400/500/600/700).
- Both **self-hosted woff2** (Fontsource latin subset), `font-display: swap`. Critical
  weights (`inter-400`, `manrope-800`) are preloaded per page. No Google Fonts / CDN.
- Fluid sizing via `clamp()` (`--fs-*`). Body `1.0625rem` / 1.65.

## Information architecture (pages)

Directory ("pretty") URLs, each a folder with `index.html`:

| Page | URL | Purpose |
| --- | --- | --- |
| Home | `/` | Hero, what we do (3 capability areas), proof/stats, featured work, process, CTA |
| About | `/about/` | Story (2008), vision, quality, materials, verticals, pan-India |
| Services | `/services/` | The three capability groups with full sub-lists + materials + process |
| Work | `/work/` | Curated gallery of genuine installed store fit-outs (replaces old Clients) |
| FAQ | `/faq/` | FAQPage; answers match visible text |
| Contact | `/contact/` | Email-led, no backend; mailto-composing form + JS-off fallback |
| 404 | `/404.html` | Styled not-found at repo root |

The old "Clients" page (a wall of brand logos with no alt text) becomes **Work**, led by
the genuine installed-store photography (the strongest real asset). Brand names appear as
captions on real photos rather than a bare logo wall.

## Content approach

Rewrite the original copy for clarity and outcomes; **no invented facts**. The founding
year (2008), "100 man years", pan-India reach, Ahmedabad/Mumbai offices, the three
capability groups and their sub-lists, the materials list and the verticals all come from
the original About/Services pages. Stats phrased conservatively ("since 2008",
"100+ man-years of combined experience", "pan-India installations") — no fabricated
project/headcount counts.

## Imagery

- **Real photos:** 21 genuine installed store fit-outs curated from the original 200+
  image dump via headless-Chrome montage passes (excluded brand-logo tiles, solid-colour
  swatches, social icons and stock teamwork photos). Renamed meaningfully (`work-*.webp`).
- **Illustrations:** four original undraw-style flat SVGs recoloured to the brand
  (`imgs/illustrations/`): storefront, workshop bench, backlit signage, pan-India rollout.
- **Brand assets from the logo:** `imgs/icon.svg` + `imgs/brand-mark.svg` (the crescent +
  magenta "m"), rasterised to `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`,
  `favicon-32.png` via `qlmanage`; `favicon.svg`; and a 1200x630 `og-image.jpg` rendered by
  headless Chrome (Snitch storefront photo + slate scrim + Manrope headline).

## Schema.org

- Home: `Organization` (`@id` `#organization`, the single source of truth) + `WebSite`
  + `WebPage`. Address shown as `areaServed` India with `location` Ahmedabad + Mumbai;
  no `streetAddress`/`telephone` until the owner confirms them.
- Inner pages: `WebPage` / `AboutPage` / `CollectionPage` / `ContactPage` + `BreadcrumbList`.
- Services: a `Service` `ItemList` of the capability areas.
- Work: `ImageGallery`.
- FAQ: `FAQPage` (answer text matches the visible answer text exactly).

## URL convention and standards

- Path-portable depth-aware relative paths: Home `css/...`, inner `../css/...`,
  `404.html` root-absolute. Canonical / `og:url` / sitemap `loc` / JSON-LD `@id` stay
  ABSOLUTE on `https://www.matrukrupa.in/`. Internal links use the trailing-slash form.
- One `<h1>` per page, ordered headings, landmarks, skip link, visible focus, alt text,
  `prefers-reduced-motion`, image `width`/`height`. No em dashes anywhere.
- `robots.txt` allows all, disallows `/archive/`, points to the sitemap. Full
  `sitemap.xml`, `site.webmanifest`, styled 404.
- Old builder site archived under `archive/` (HTML, CSS, JS) and the original 200+ image
  dump under `archive/imgs-original/` (disallowed in robots).
- Validation: the DOM-aware contrast audit (`tools/contrast-audit.mjs`) must print
  RESULT: PASS; `linkcheck.py` clean; JSON-LD parses on every page; github.io subpath
  check shows 0 asset 404s.

## Open items for the owner (before go-live)

1. Confirm the public **email** inbox (we used `info@matrukrupa.in`).
2. Provide the correct **phone + WhatsApp** number (omitted due to conflicting data).
3. Provide full **postal addresses** for Ahmedabad and Mumbai (only cities shown now).
4. Confirm the **client/brand list** to feature (and permission to show brand names).
