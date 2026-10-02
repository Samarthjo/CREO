# CREO design direction (Phase 0)

Status: proposal for approval. Nothing here is implemented yet. Values marked "to confirm" are decided in Phase 1 once they can be seen on screen.
Companion document: `design-research.md` (why these choices, and what each depends on).

## 1. Concept

**A day with CREO.** The landing page is one continuous scene that moves from dawn to night as the visitor scrolls. Each product section sits at a time of day. The scene is painted and calm; the product UI in front of it is exact and personal.

The idea we want visitors to feel in five seconds: *this product knows one person, and gets better every day.*

## 2. Visual personality

| Is | Is not |
|---|---|
| Calm, warm, confident | Loud, neon, futuristic |
| Editorial: big type, small supporting text, generous air | A dense dashboard |
| Specific: a named creator, real numbers from real engines | Generic: "boost your growth" |
| Painted and human at the edges, precise at the center | Cold technical chrome |

Three words: **calm, personal, precise.**

## 3. Typography

The video uses a light geometric grotesk with one italic accent word in olive. The current display face (Bricolage Grotesque) has no italic (checked in the package), so this move needs a new family. Nothing below is final until it is seen as a specimen in Phase 1.

| Role | Direction | Candidates (all available as Fontsource variable fonts with real italics, checked) |
|---|---|---|
| Display | Light to regular weight, tight tracking, large. Used for headlines and the giant numerals | Instrument Sans, Hanken Grotesk, Inter Tight |
| Accent | The same family in true italic, in olive, one word per headline | Same family; or Instrument Serif Italic as a contrast option |
| Body and UI | Quiet, highly legible, 15 to 16 px | The display family, or keep Geist (already installed) |
| Labels | 12 to 13 px, medium weight, slight positive tracking; sentence case | Same as body |
| Numbers | Tabular figures for any value that changes or aligns | Same family with `font-variant-numeric: tabular-nums` |
| Code and data | Only for IDs, extraction spans, formulas | Geist Mono |

Scale (fluid, clamp-based, to confirm in Phase 1):

| Token | Size | Use |
|---|---|---|
| `display-xl` | 56 to 96 px | Hero headline, final CTA |
| `display-l` | 40 to 64 px | Section headlines |
| `numeral` | 160 to 420 px | Giant step numerals (section 8) |
| `title` | 22 to 28 px | Card titles |
| `body-l` | 18 to 20 px | Lead paragraphs, capped at 3 lines |
| `body` | 15 to 16 px | Default |
| `label` | 12 to 13 px | Chips, captions, ticket labels |

Rules: headlines use balanced wrapping; body uses pretty wrapping; no paragraph over three lines; one italic accent word per headline at most.

## 4. Color

Warm paper white with an olive and lime accent family, taken from the video's palette and adapted. Painted sky colors live only inside the scene. Contrast ratios are computed (WCAG 2.x relative luminance), not estimated.

### 4.1 Core tokens (light)

| Token | Value | Role |
|---|---|---|
| `--paper` | `#fbfbf7` | Page background |
| `--paper-2` | `#f3f4ec` | Alternate band, input fill |
| `--ink` | `#11140c` | Headlines, primary text |
| `--text` | `#2b3022` | Body |
| `--muted` | `#586049` | Secondary text |
| `--faint` | `#7b8369` | Large or decorative text only |
| `--line` | `#e2e5d6` | Hairlines, borders |
| `--olive-800` | `#3f5a0c` | Italic accent word, strong emphasis |
| `--olive-700` | `#4b6a0e` | Primary button fill, links |
| `--fern-500` | `#7ba10c` | Mid numeral, fills only |
| `--lime-400` | `#b5cf4f` | Ticket cards, footer, numeral 3, highlights |
| `--lime-100` | `#e3ecc5` | Chips, soft fills |
| `--lime-50` | `#f0f5df` | Hover fills, marker wash base |
| `--risk` | `#b4321e` | Warnings, walk-away, suspicious signals |
| `--ok` | `#2f7a3a` | Approved, healthy deal |

### 4.2 Scene tokens (only inside the illustration)

| Token | Value | Role |
|---|---|---|
| `--sky-dawn-peach` | `#f6c9a8` | Dawn cloud light |
| `--sky-dawn-lilac` | `#b9b4e6` | Dawn cloud shadow |
| `--sky-day` | `#cfe3f2` | Midday haze |
| `--sky-dusk` | `#6f6fc0` | Dusk |
| `--night-900` | `#1b2252` | Night sky, closing panel |
| `--night-700` | `#2f3d8f` | Night lake |

### 4.3 Contrast (computed)

| Pair | Ratio | Verdict |
|---|---|---|
| `ink` on `paper` | 17.93:1 | Pass |
| `text` on `paper` | 13.07:1 | Pass |
| `muted` on `paper` | 6.36:1 | Pass (AA body) |
| `olive-800` on `paper` | 7.56:1 | Pass |
| `olive-700` on `paper` | 6.01:1 | Pass |
| White on `olive-700` (CTA) | 6.24:1 | Pass |
| `ink` on `lime-400` (tickets) | 10.63:1 | Pass |
| `olive-800` on `lime-100` (chips) | 6.37:1 | Pass |
| `paper` on `night-900` | 14.49:1 | Pass |
| `lime-400` on `night-900` | 8.59:1 | Pass |
| `risk` on `paper` | 5.93:1 | Pass |
| `ok` on `paper` | 5.10:1 | Pass |
| `faint` on `paper` | 3.82:1 | **Fails body text.** Large or decorative text only |
| `fern-500` on `paper` | 2.91:1 | **Fails as text.** Fills and giant numerals only |

### 4.4 The marker, kept

CREO's own idea survives the redesign: a soft highlighter wash behind text that matters (a hook, a clause in a brand's message, a risk). It becomes a lime wash (`lime-400` at about 55% alpha); risk uses a red wash with an underline. It is never used as text color.

### 4.5 Dark theme

A night-scene theme (deep blue-green near-black page, paper-colored text, lime accent) follows the same token names. The existing light and dark switch stays. Dark values are finalized in Phase 3 with the design system; Phase 1 ships light first and checks that nothing breaks in dark.

## 5. Spacing

4-pt base. Tokens: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192.

| Context | Rule |
|---|---|
| Section vertical rhythm | 128 px desktop, 96 px tablet, 64 px mobile between sections; scene sections use their own height |
| Content width | Text 640 px max; product panels 1,120 px max; scene full-bleed |
| Gutters | 24 px desktop, 20 px tablet, 16 px mobile |
| Inside cards | 24 px desktop, 20 px mobile; 12 px between related rows |
| Between headline and supporting line | 16 to 24 px |

## 6. Radius

| Element | Radius |
|---|---|
| Pills, chips, buttons | Fully round |
| Product panels | 24 px |
| Glass tiles | 16 px |
| Ticket cards | 28 px, with circular notches 36 px across |
| Large glass panel (final CTA) | 36 px |
| Inputs and controls | 12 px |

## 7. Shadows and depth

Depth comes from layering and light, not heavy drop shadows.

| Token | Value (to tune on screen) | Use |
|---|---|---|
| `--shadow-panel` | `0 1px 0 rgb(17 20 12 / .04), 0 24px 48px -28px rgb(17 20 12 / .22)` | Product panels |
| `--shadow-float` | `0 2px 4px rgb(17 20 12 / .05), 0 32px 64px -24px rgb(17 20 12 / .28)` | Notification toasts, floating panels over the scene |
| Glass | `backdrop-filter: blur(14px) saturate(1.1)`, 1 px inner border at 40% white, fill at 18 to 28% white | Tiles and CTA panel only |

## 8. Cards: three kinds, no more

1. **Product panel.** Opaque `paper`, 1 px `line` border, `shadow-panel`. The workhorse. Holds real CREO components.
2. **Ticket.** Lime fill, notched edge, one label and one big number. Used for facts and DNA fields. Count-up on first view. Rule: every number on a ticket is either true today or visibly labelled sample.
3. **Glass tile / glass panel.** Translucent, blurred. Decoration (tiles) or the one closing CTA (panel). Never holds dense content.

No cards inside cards inside cards.

## 9. Icons

Phosphor, light weight (1.5 px stroke feel), 18 to 20 px in UI. Icons describe things (a message, a film slate, a trend line), never "AI". No sparkles, stars, brains or robot heads. Where an icon would be generic, use a number, a letter or a small drawn glyph instead. The logo and any custom glyphs are designed in Phase 2.

## 10. Motion

Principles are in `design-research.md` section 8. Specifics:

| Item | Value |
|---|---|
| UI response | 150 to 250 ms, `cubic-bezier(.16, 1, .3, 1)` (already in the repo as `--ease-out`) |
| Scene transitions | 400 to 700 ms, scroll-linked where possible |
| Entrances | Spring, stiffness about 90 to 120, damping about 20; no overshoot on data |
| Count-up | 900 ms ease-out, once per element, on first view |
| Sky arc | A single scroll-linked variable moves color stops between dawn, day, dusk and night |
| Parallax | Scene layers move at 0.2x to 0.6x scroll speed, transform only, capped at about 80 px |
| Glass tiles | Slow drift, 20 to 40 s loops, paused offscreen |
| Numerals accordion | Driven by scroll progress through a sticky container; scroll speed is never altered |

Hard rules: only `transform` and `opacity` animate; no scroll listeners that touch layout; everything pauses offscreen; `prefers-reduced-motion` gives a finished still state with no parallax, no drift and instant count-ups; on touch devices hover effects become tap states.

Tools: `motion` (already installed) for scroll-linked values and springs. No GSAP and no smooth-scroll library in Phase 1, to keep dependencies minimal. A smooth-scroll library can be reconsidered in Phase 5 if it earns its weight.

## 11. Illustration style

**Goal:** a soft, painted mountain-and-lake world that reads as a calm place, shifting from dawn to night. Original artwork; nothing traced or reused from the reference.

**Scene layers** (each a separate element so it can parallax and be swapped):

1. Sky gradient (scroll-linked color stops)
2. Far clouds, near clouds (peach and lilac by day)
3. Far mountains, mid mountains (aerial perspective: paler and bluer when farther)
4. Lake with a soft reflection and a light path
5. Meadow with flowers, rocks, and 2 to 3 pine groups in the foreground
6. Birds, drifting seeds (a handful, subtle)

**How it is built (decision D2):** Phase 1 builds all layers in code as inline SVG with gradients, a light grain filter and seeded procedural shapes, so the page is complete, fast and original. Each layer is its own component with a clean seam, so painted PNG or WebP layers can replace the vector ones without touching layout. I will write per-layer generation specs (size, transparency, palette, camera height) for painted versions if you want them.

**Asset budget:** hero scene under 250 KB over the wire; later scene layers lazy-loaded; WebP or AVIF for any raster; no video background.

**Not allowed:** people or creator silhouettes, camera icons, stock photography, glossy 3D, neon.

## 12. Product UI in marketing

- Use the real components and engines on a **named sample creator** (Arjun, 27K followers). Label every instance "Sample creator" or "Demo data".
- Nothing presents invented data as live. Features not built are shown as "In design" or are left out.
- Frame: a clean panel with a slim title bar and the sample-creator label. No fake browser chrome, no device mockups.
- Each demo has one interactive affordance and a settled, finished still state.
- Approval is always visible. Anything that would leave CREO shows "Nothing is sent until you approve".

## 13. Accessibility and performance targets

| Area | Target |
|---|---|
| Contrast | WCAG AA on all text; `faint` and `fern-500` restricted as above |
| Keyboard | Every interactive element reachable and visible-focus; accordion and loop controllable by keyboard |
| Motion | Respects reduced motion; no information carried by motion alone |
| Semantics | Landmarks, one `h1`, ordered headings, real buttons and links |
| LCP | Under 2.5 s on a mid-range phone on 4G |
| CLS | Under 0.05 |
| Total JS on first load | Keep the landing page's first-load JS lean; scene and heavy demos load on demand |
| Responsive checks | 1440, 1280, 1024, 768, 430, 390, 375 |

## 14. Token map (for Phase 1 implementation)

Names will follow the existing `@theme inline` pattern in `src/app/globals.css`:

```
--color-paper, --color-paper-2, --color-ink, --color-body, --color-muted, --color-faint, --color-line
--color-olive-800, --color-olive-700, --color-fern-500, --color-lime-400, --color-lime-100, --color-lime-50
--color-risk, --color-ok
--radius-panel (24), --radius-glass (16), --radius-ticket (28), --radius-control (12)
--shadow-panel, --shadow-float
--font-display, --font-sans, --font-mono
--scene-progress   /* 0 to 1, drives the sky arc */
```

Existing tokens (`--mark`, `--bg`, `--surface`) are aliased during migration so the app pages keep working until Phase 3 and Phase 4 restyle them.

## 15. Decisions still open

See `design-research.md` section 10 (D1 to D7). The four that block Phase 1: **D1 color, D2 how the scene is made, D3 headline, D5 the dawn-to-night concept.**

## 16. Phase 1 as built (deviations from this plan)

Written after the landing page was implemented, so the doc matches the code.

| Topic | What was decided or changed |
|---|---|
| Typeface (D4) | **Instrument Sans** for display and body, including its true italic for the accent word. Chosen from a three-way specimen (Instrument Sans, Hanken Grotesk, Inter Tight): softest feel, chunkiest numerals for the 1-2-3 section, clean `₹`. No monospace face is used yet. Geist and Bricolage were removed |
| Night ground | The dark theme and `.night` sections use a deep **indigo** (`#0c1030`) rather than the blue-green near-black proposed in section 4.5, so the page matches the night scene's sky. Dark values are still finalized in Phase 3 |
| New tokens | `--cta` / `--on-cta` (primary button; olive in light, lime at night), `--accent` (italic word), `--eyebrow-*` (pill labels), `--soft` (tinted panel), `--sky-tint` (loop section sky) |
| Scene (D2) | Built in code as three SVG layers (sky and mountains and lake, far shore, near bank) plus separate clouds and glass tiles, drawn procedurally from seeded noise so server and client match. Each layer is its own element, so painted PNG or WebP layers can replace it. Four times of day: dawn, day, dusk, night |
| Parallax | Pure CSS scroll-driven animation (`animation-timeline: view()`), no JavaScript. Browsers without support show a still scene |
| Pinned stories | The learning loop and the Human + AI numerals use a tall section with a sticky stage on large screens with motion allowed. Scroll position picks the step; scroll speed is never changed. Below 1024 px or with reduced motion they are plain click and keyboard steppers |
| Reduced motion | One `MotionConfig reducedMotion="user"` at the root. Components never branch their markup on the preference (the server cannot know it, and hydration would mismatch). Verified: zero console errors with reduced motion on |
| Tickets | `.ticket` uses a CSS mask for the circular bites; no images |
| Honest proof | There are no customers yet, so section 9 shows open "Founding Creator" seats instead of quotes or logos. Illustrative sequences are labelled "Illustrative" |
| Removed | The earlier "One manager, one memory" walkthrough and the approvals/memory demo were removed from the landing page. The approvals and memory screens remain in `/app` |

Measured on the production build: LCP 424 ms on desktop and 1.3 s on a throttled mobile profile (4x CPU, 1.6 Mbps, 150 ms latency); CLS 0.006; page HTML 151 KB gzipped including all three scenes.
