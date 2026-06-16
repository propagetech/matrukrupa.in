# Matrukrupa Enterprise website: design system, conventions and decisions

This file is the working brief for anyone (human or AI) maintaining the Matrukrupa
Enterprise site. It documents the design system, the conventions to follow, and the
decisions already made so they are not relitigated.

The site is a hand-built static site: semantic HTML5, one CSS file, one small JS file,
no framework and no build step. It deploys from the repo root via GitHub Pages.

The longer narrative of why each decision was made lives in
**[docs/redesign-decisions.md](docs/redesign-decisions.md)**.

---

## 1. The business (do not invent facts)

Matrukrupa Enterprise is a retail fixtures and store fit-out company, formed in **2008**,
operating **pan-India** with a registered office in **Ahmedabad** and a corporate office in
**Mumbai**. It designs, manufactures and installs complete retail environments in three
connected capability areas:

1. **Retail fixtures** (EBO, MBO, SIS, gondolas / display systems)
2. **Store fit-outs** (civil, interior, MEP, panelling)
3. **In-store branding** (backlit frames & print, specialised LED signage, ACP cladding,
   store-front signage)

Materials: solid wood, MDF, veneer, laminates, painted/coated surfaces, metal in all forms,
acrylic, lighting and electrical structures. Finishes: high-gloss paint, speciality coating,
rusty powder coating. Verticals: fashion, lifestyle, footwear, clothing, food, cosmetics.

Tagline: **"Your imagination, our creation."** Belief: **"the difference is in the detail."**
Claim: **100+ man-years of combined experience.** All copy is rewritten from the original
site; **no facts are invented**.

### Contact data is partly UNCONFIRMED (see decisions log section "Open items")
The original builder site had conflicting/placeholder contact data. The site currently
leads with a neutral role email **info@matrukrupa.in**, shows the two office **cities only**
(no street address), and **omits phone/WhatsApp** because the old numbers conflicted. Before
go-live the owner must confirm: the public email inbox, the correct phone (+ WhatsApp), and
full postal addresses. A real Ahmedabad address was found in the old home page markup
(`12/2/A Pancharatna Estate, Opp. Swastik Electro Power, Nr. Ramol Bridge, Vatva,
Ahmedabad - 382445`) but is not shown until the owner confirms it.

---

## 2. File structure

```
/                       repo root (served by GitHub Pages)
  index.html            Home, served at /
  about/index.html      About, served at /about/
  services/index.html   Services (3 capability groups, anchors #fixtures/#fitouts/#branding)
  work/index.html       Work (curated photo gallery, ImageGallery schema)
  faq/index.html        FAQ (FAQPage schema)
  contact/index.html    Contact (email-led, no backend)
  404.html              Styled not-found (stays at root; root-absolute paths)
  robots.txt            Allows all, disallows /archive/, points to sitemap
  sitemap.xml           Six public URLs (directory form, trailing slash)
  site.webmanifest      PWA manifest
  css/main.css          The entire design system
  js/main.js            Progressive enhancement only
  fonts/                Self-hosted woff2 (Inter, Manrope), latin subset
  imgs/                 logo.webp, favicons, icons, og-image.jpg, work-*.webp
  imgs/illustrations/   Original brand-themed SVG illustrations
  docs/                 redesign-decisions.md
  tools/                Dev-only contrast-audit.mjs; gitignored deps, not deployed
  archive/              The previous builder-exported site (not linked, disallowed)
```

There is **no shared HTML partial system** (no build step), so the header, footer and
floating button are duplicated across pages. **If you change one, change all of them.**
Keep them byte-for-byte identical except the `aria-current="page"` on the active nav item
and the depth-aware path prefix (`./` and bare on Home, `../` on inner pages).

---

## 3. Brand and colour

Palette derived from `imgs/logo.webp` (a slate crescent + magenta disc on a gold field).
Tokens live in `:root` in `css/main.css`. Every pairing was verified against WCAG 2.1 AA
with the DOM-aware audit (section 8). Key rules:

- `--cream #f6f1e7` page bg; `--cream-2`, `--surface` alt/cards; `--slate #232a32` dark
  sections; `--slate-2` footer.
- `--ink #1d232b` primary text (14:1 on cream); `--ink-2`, `--ink-3` secondary/muted.
- **Gold is fill-only on light surfaces.** `--gold #d0b050` is a button/decorative fill,
  never text on cream/white (fails). Gold-family **text** on light uses `--bronze-ink
  #7c5e1f`. On slate, gold borders/eyebrows use `--gold-on-dark #e0bb63`.
- **Magenta** works as text on light (`--magenta-ink #93286f`) and accent on slate
  (`--magenta-on-dark #d875b8`). White on `--magenta #a8328f` is 6.0:1 (AA).
- Primary button = `--gold` bg + `--ink` label + `--gold-border` boundary.
- Focus ring: 3px `--magenta` on light, `--gold-on-dark` on dark.

### Contrast rule: colour belongs to the component, not the container
A container/descendant rule like `.cta-band p` (specificity 0-1-1) silently out-specifies a
single-class component like `.eyebrow` (0-1-0) nested inside it. The CSS already scopes
`.cta-band p:not(.eyebrow)` to avoid repainting the gold eyebrow. **Any dark component that
is not itself `.section--slate`** (`.hero`, `.page-hero`, `.cta-band`, the 404 band) carries
explicit on-dark overrides for `.eyebrow`, `.btn-secondary` and links. A dark-only colour
(e.g. `--cream-muted`) must never reach a light surface through the cascade, and vice versa.
**Verification is not eyeballed:** run the DOM audit (section 8); it gates on exit code.

---

## 4. Typography

- Headings: **Manrope** (geometric architectural sans; weights 600/700/800), chosen to
  convey precision and manufacturing.
- Body and UI: **Inter** (400/500/600/700).
- Both self-hosted woff2 (latin subset), `font-display: swap`. Critical weights
  (`inter-400`, `manrope-800`) are preloaded per page. **No Google Fonts / CDN.** To add a
  weight, drop the woff2 in `fonts/` and add a matching `@font-face`.
- Fluid sizing via `clamp()` (`--fs-*`). Body `1.0625rem` / 1.65.

---

## 5. Components (classes in `css/main.css`)

Layout `.container`(.wide), `.section`, tints `--white`/`--cream2`/`--slate`. `.eyebrow`,
`.section-head`. Buttons `.btn` + `.btn-primary`/`.btn-secondary`/`.btn-magenta`,
inline `.btn-text`. `.card`/`.pillar`, `.grid`(-2/3/4), `.split`, `.checklist`, `.stats`/
`.stat`, `.steps`/`.step`. Services `.svc-group`/`.svc-head` (anchor targets). Work
`.gallery`/`.shot` (solid dark scrim caption, not a fade). `.faq` uses native
`<details>`/`<summary>` (keyboard-operable with JS off). `.breadcrumb`, `.cta-band`,
`.page-hero`, `.site-footer`, `.fab`, `.logo-wall`. `.reveal` fades in on scroll and is
**fail-safe** (JS adds `.reveal--armed` to hide-then-reveal, so JS-off keeps content visible).

Icons are inline SVG (`viewBox 0 0 24 24`, `stroke="currentColor"`); decorative ones are
`aria-hidden="true"`. Breakpoints: 1024, 860 (mobile nav), 720 (grids stack), 520.

**Inline-SVG data-URI rule:** any `url("data:image/svg+xml,...")` MUST close with a DOUBLE
quote (`...%3C/svg%3E")`). A stray `'` unterminates the string and silently drops following
rules. Confirm: `grep -n "%3C/svg%3E')" css/main.css` returns nothing.

---

## 6. Accessibility conventions

One `<h1>` per page; ordered headings; landmarks; a `.skip-link` to `#main` first in body.
Mobile nav toggle uses `aria-expanded`/`aria-controls`; Escape closes it. Visible focus
rings everywhere; never remove the outline. All meaningful images have `alt`; decorative
SVGs are `aria-hidden`; `width`/`height` set to avoid layout shift. Respect
`prefers-reduced-motion`. The site works fully with JavaScript disabled.

---

## 7. SEO, URLs and schema

### Directory ("pretty") URLs, path-portable
Each page is a folder with `index.html`, served at `/slug/`. Home is `index.html` at `/`.
**Assets and internal links are RELATIVE and depth-aware:** Home uses bare `css/...`,
`imgs/...`, `about/`, home link `./`. Inner pages use `../css/...`, `../services/#fixtures`,
home link `../`. **Never root-absolute `/css/...`** on these (breaks on the github.io project
subpath). **Exception: `404.html` uses root-absolute** (`/css/...`) because Pages serves it
at arbitrary depths. Link to the trailing-slash form (`about/`), never `*.html`.

### Canonical / OG / sitemap / JSON-LD stay ABSOLUTE
Canonical, `og:url`, sitemap `loc` and JSON-LD `@id`/`url` always use the production domain
**https://www.matrukrupa.in/** in trailing-slash directory form, regardless of where the
site is previewed.

### Schema.org JSON-LD per page
- Home: `Organization` (`@id` `#organization`, single source of truth) + `WebSite` + `WebPage`.
- Inner: `AboutPage`/`CollectionPage`/`ContactPage` + `BreadcrumbList`.
- Services: a `Service` `ItemList` (3 items; update `numberOfItems` if you add one).
- Work: `ImageGallery`.
- FAQ: `FAQPage`. **The schema answer text must match the visible answer text exactly.**
Re-validate JSON-LD after edits (section 8).

---

## 8. Validation checklist (run before deploy)

```bash
# No em dashes in copy
grep -rn "—" *.html */index.html css js && echo "FAIL: em dash" || echo "OK"

# No external CDN / third-party requests (expect no matches)
grep -rnE "https?://(fonts|cdn|ajax|unpkg|code\.jquery)" *.html */index.html

# JSON-LD parses on every page (python json.loads each ld+json block)

# Colour contrast: DOM-aware audit (the authoritative check)
python3 -m http.server 8308 &
node tools/contrast-audit.mjs http://localhost:8308   # must print RESULT: PASS

# Links/assets/anchors resolve on disk
python3 ../_rebuild-kit/tools/linkcheck.py .

# Subpath check: serve PARENT dir, load /matrukrupa.in/ and each page in headless Chrome,
# assert 0 asset 404s (catches root-absolute leaks).
```

The contrast audit is authoritative; the token table is a design aid, not a substitute.
Run it after any markup or CSS colour change.

---

## 9. Copy conventions

- **No em dashes anywhere.** Use commas, colons or parentheses. Verify with `grep`.
- Brand name is **Matrukrupa Enterprise** (singular "Enterprise", as in body copy and
  copyright). The old page titles used "Enterprises"; we standardised on the singular.
- Contact email shown: **info@matrukrupa.in** (pending owner confirmation).
- Voice: confident, plain-spoken, grounded in real capability. Lead with outcomes
  (on time, to brand standards, one accountable team).
- Contact is **email-led with no backend.** The form composes a `mailto:` draft (JS) and
  falls back to a native `mailto` form with JS off. State that nothing is stored on the site.
  Do not add a server-side form.

### Adding a service
Add a `.svc-group` (unique `id`) to `services/index.html`, add a matching Home card and a
`Service` entry to the Services `ItemList` JSON-LD (bump `numberOfItems`).

### Adding a page
Create `slug/index.html` (a folder, depth 1: assets `../css/...`, links `../other/`). Keep
canonical/OG/JSON-LD absolute on `https://www.matrukrupa.in/slug/`, swap the `WebPage` +
`BreadcrumbList`, set `aria-current="page"` across all nav copies, add the URL to
`sitemap.xml`, then run the subpath check.
