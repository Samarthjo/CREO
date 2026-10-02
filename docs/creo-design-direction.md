# CREO design direction (Phase 0)

Status: for approval. Nothing here is built. This supersedes `design-direction.md` and `design-research.md` for the landing page (they describe the previous light, painted-scene page).
Revision 2: updated after three independent reviews (completeness, a feasibility skeptic that re-ran my numbers, and a copy checker). Their findings are folded in; the biggest corrections are listed in section 0.

![Direction board](assets/direction-board.png)

## 0. What was and was not verified

| Item | Status |
|---|---|
| Reference sites: Unseen, Makemepulse, Fantasy, Lusion, Basement, Codrops, three.js, Passionfroot, Attio, Descript and the rest | **Not inspected.** Every one of these hosts is blocked from this environment. Section 4 states lessons from your brief and general knowledge, marked unverified. Nothing here says "I looked at their current site" |
| Current CREO site | **Measured** on the production build (section 2) and re-measured by a reviewer |
| Next.js behaviour | Read from the docs bundled in `node_modules/next/dist/docs` (as the repo's `AGENTS.md` asks) |
| WebGL here | **Verified:** WebGL2 runs on software rendering (SwiftShader) and can be screenshotted. The 116 ms and 31 ms frame times are from a synthetic shader, not the scene, and say nothing about real GPUs |
| Hero look-dev frame | Proves **layout, chip placement and that three.js composes here**. It does **not** prove realism: the glass is not yet visibly glass, a mirrored "1.8x" floor reflection sits beside the headline, and a hard seam crosses the frame at the pane's lower edge |
| Library bundle sizes | **Measured** with esbuild (KiB, gzip -9), and re-measured by a reviewer; brotli added |
| motion-primitives and Magic UI | **Fetched, type-checked and compiled. Not rendered in a browser, not tested on Next 16** (appendix B) |
| Open-source product repos | README level only. Quotes verified against saved copies (22 of 22). No source trees or screenshots |
| Real-device speed, Safari and iOS WebGL | **Unverified.** Needs a phone and a laptop (sections 9 and 13) |
| Image generation and Figma/Canva sync | Not available (the image service refused to connect; `/design-sync` needs a design project from you). The board is built in code instead |

**Corrections made after review:** word counts were wrong (now counted by script, with hard caps); sample numbers did not match the real engine (now taken from it); "Sees / detected / DM slides in" overstated what CREO does today (reworded); the "90 KB JS" budget was unreachable (restated); "generate the poster at build time" was unrealistic on Vercel (now a committed file); "verified" was used for things that were not (reworded).

## 1. The brief, decoded

You want **far less text**, a **short** first page, a hero that feels **real** and **very creative**, and the supplied words used exactly.

**How I read "1 minute, not more than 2":** a stranger should understand the product in about one minute and never need more than two. That is attention time, not page count. The plan is built so that **the hero alone** and **the five-caption rail** each explain the product without any interaction; the scroll story is the demonstration for people who want it. The "about one minute" figure is an estimate and is tested in Phase 6 (section 5).

Locked copy (verbatim, never edited):

> **The Intelligence Layer for Creators.**
> Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.

Rules this implies:
1. The hero is the explanation. Everything after it proves the tagline's three verbs: **remembers**, **analyzes**, **turns it into your next best move**.
2. One page, one story, one call to action. Anything that does not prove a verb leaves the first page.
3. Real product beats decoration. Sample data is labelled as sample, and nothing claims what CREO cannot do yet (section 6).

## 2. Audit of the current site

Measured on the production build with Playwright (1440x900 and 390x844). "Words" means rendered text (`innerText`), so it includes text that is visually hidden.

| | Now | Target |
|---|---|---|
| Page height | **22.5 screens** (desktop), 23.3 (mobile) | **6 screens** |
| Words | **2,163** | **at most 225**, hard cap, tested (section 6) |
| Headings | 27 (23 at h1 to h3) | 7 |
| Links and buttons | 75 | under 15 |
| Hero alone | 157 words, 1.6 screens | 27 words, 1 screen |

Where the words are: Collab 380, Trend 351, Cohort 274, HQ 205, Studio 205, DNA 166, Loop 152, Human 99, Proof 64.
First-load JavaScript today: **252 KiB gzip** on `/` (the framework alone is 126.8 KiB; the Motion chunk is 46.5 KiB).

**Keep:** the engines (Trend, Studio, Collab, DNA, brief) and the sample creator; the `/app` workspace; the application form and `/api/apply`; the reduced-motion plumbing.
**Retire from `/`:** the painted olive scene and the nine long sections. They stay in git history; `/app` is untouched.

**From the Next docs (this repo's `AGENTS.md` requires reading them):**
- `ssr: false` is only allowed in a Client Component, so the 3D hero needs a `"use client"` wrapper around `next/dynamic`.
- Dynamically importing a Client Component from a Server Component is not code-split, so the dynamic import lives in the client wrapper.
- A `<video>` needs `width`/`height` or `aspect-ratio` to reserve its box (a missing size causes layout shift); a `poster` fills that box.
- In Next 16, `priority` on images is deprecated in favour of `preload`, and the image `formats` default is WebP only, so AVIF needs `images.formats` or pre-encoded files. The poster must be a real `<img>`, not a CSS background, so the browser can find it for LCP.
- Repo lesson, not a Next doc: the first render must match on server and client (we already hit this with reduced motion).

## 3. Visual thesis: "The Layer"

> Your content, audience and deals are scattered signals. **CREO is the clear layer that sits over them and reads them.**

This is the literal meaning of the headline, so the hero explains the product before any copy does.

**The scene (dark studio):**
- An obsidian floor. On it lie the creator's **sample signals** as thin glass tiles: reels, a brand message, a price, a stat. Their content is procedural, not stock photography.
- One large pane of **clear glass** hangs over them with a thin lime edge light.
- **The CREO mark is etched at the centre of the glass**, and the five signals from your brief float around it: **Content, Audience, Trends, Deals, Performance**.
- **A cursor is a light.** Moving it scans the glass; where it passes, tiles resolve into the five labelled chips. With no cursor (touch, or a visitor who does not move), one automatic sweep reveals the same chips and then settles.
- The **Creator DNA network** is etched on the glass: nodes that connect as CREO learns.
- **"Scroll reorganises"** means: the five chips regroup into the five-caption rail, and the glass tilts toward the viewer as it becomes the product panels.

**Why it earns its place:** tiles are the creator's data, the glass is the intelligence layer, the network is memory, the light is analysis. Nothing is there only to look good.

**Realism recipe (physical cues, not effects):** one cool key light and one lime rim light; contact shadows; glass with refraction and a lit edge; a Fresnel-weighted, blurred floor reflection; depth of field kept off the glass; ACES tone mapping; grain applied in CSS (not baked into the poster).

![Look-dev frame](assets/hero-lookdev.png)

*Rough look-dev, software-rendered. Known flaws: the glass pane is not yet readable as glass, a mirrored "1.8x" reflection sits by the headline, and there is a hard seam at the pane's lower edge. These become Phase 1 acceptance tests: a frame where the glass is clearly visible, no reflection artefact, no seam. Source and run notes: `docs/spikes/hero-lookdev/`.*

**Alternatives considered**

| | Concept | For | Against |
|---|---|---|---|
| **A (recommended)** | The Layer | Explains the headline literally; real product objects; strong realism potential | Heaviest to build; needs the tier system |
| B | Memory Constellation: a dark void where nodes light up and link as you scroll | Lightest and fastest; elegant | Abstract; less proof of a real product |
| C | The painted scene from the last version | Already built | Wrong mood for these references; too many words |

## 4. Reference analysis

All rows marked **unverified**: derived from your brief and general knowledge, not from loading the sites. Each ends in a CREO decision.

| Reference | Lesson (unverified) | CREO decision | Do not copy |
|---|---|---|---|
| Unseen Studio | Scroll as a spatial narrative; interaction must mean something | Scroll is the timeline of five beats; the cursor is a light that reads signals | Their scenes and assets |
| Makemepulse | Information turned into an experience; user-controlled scenes | Each beat is one real product object the visitor can nudge | Their 3D world |
| Fantasy | The interface adapts to what you do | Chips and glass edge react to hover or focus distance | Their navigation concepts |
| Lusion | Premium lighting and materials | Physical lighting, glass, restraint | Their shaders and objects |
| Basement.studio | Shader atmosphere in AI marketing | Shaders only for glass, light, floor; never wallpaper | Their branding, shader-lab visuals |
| Passionfroot | Real product UI in the story, creator cards, action center | Beats use real components on a named sample creator | Layouts and copy |
| Attio | Typography, whitespace, hierarchy | Big light type, mono labels, wide gaps | CRM look |
| Descript | Show the workflow, do not explain it | Beat 3 shows pattern to shoot plan in motion | Editor UI |
| Clay | An interactive "aha" in the homepage | One optional nudge per beat | GTM messaging |
| Framer | Scroll behaviour and responsive transitions | Scroll-linked beats, springs | Their identity |
| Lovable | Plain language, product as proof | Captions of at most 6 words | App-builder positioning |
| Beehiiv | Monetization as a first-class story, conversion structure | Beat 4 plus one CTA | Newsletter UI |
| 1of10 | Small, honest data visualization | Hook-lift bars that show their basis ("2 posts") | Their analytics look |
| Linear | Polish and quiet states | Instant-feeling, quiet interactions | Dev-tool aesthetic |
| Vercel | Confidence and minimalism | Short statements, thin rules | Developer messaging |
| Codrops | A technique library (cursor, distortion, transitions) | Borrow ideas, write our own | Any experiment verbatim |
| three.js | The 3D engine | Vanilla three, lazy-loaded (measured, section 9) | R3F and drei bundles |
| motion-primitives | Micro-interaction components | Adopt a few for micro-interactions (appendix B) | Hero effects |
| Magic UI | Animated components | Selective, never hero; not a Magic UI demo | Template-demo effects |

## 5. Page architecture: one hero, one story, one CTA

**The seven acts in your brief become five beats.** This is a proposal for your approval. It keeps your order except that WATCHES merges into LEARNS, and your closing act ("Tomorrow, it starts smarter.") becomes the CTA headline.

| Your act | Beat | Note |
|---|---|---|
| SEES + UNDERSTANDS | 1 · **Sees** | One beat: the pattern, and why it works |
| KNOWS YOU | 2 · **Knows you** | Creator DNA |
| CREATES | 3 · **Creates** | Studio |
| MONETIZES | 4 · **Monetizes** | Collab |
| WATCHES + LEARNS | 5 · **Learns** | You add a result; Memory changes |
| (Act 8) | CTA | "Tomorrow, it starts smarter." |

**Blocks, desktop:** hero 100vh, story 400vh (five beats of about 80vh), CTA 100vh = **600vh (6 screens)**. The footer is two lines.
**The rail:** from the first pinned frame the five labels and captions are visible together. A visitor who only skims reads the whole product story from the rail (27 words). Scrolling lights each caption and animates its object.
**Everything is optional:** every beat reaches its final state by scroll alone. Interactions (pick a hook, edit a term, hover a node) are extras. Scrolling back and scrolling fast must both leave a valid state.
**Mobile and reduced motion:** no pinning. Beats stack vertically (about 0.7 screen each) with the same rail on top: **hero 1 + beats 3.5 + CTA 1 = about 5.5 screens**. The layout switch for reduced motion is done in CSS (`@media (prefers-reduced-motion: reduce)`) over the same DOM, so server and client markup match and the height is reserved (CLS). The WebGL scene only starts after mount.
**Nav:** logo and one button; no link row. FAQ and depth become a slide-over opened from a single "?" (Phase 6); the template-based-generation fact lives there.

### The five beats (sample creator, real engine values; section 7)

| # | Beat | Proves | What the visitor sees | Plain-language line | Optional interaction | Effect | Caption |
|---|---|---|---|---|---|---|---|
| 1 | **Sees** | analyzes | Chip: Pattern matched, "I replaced X with AI for 7 days", fit 96. A cluster of tiles brightens | "Emerging in your niche" | Cursor light scans | Signals brighten, one pulses | A pattern is emerging. |
| 2 | **Knows you** | remembers | The DNA network connects. Tags: Proof-first hooks 1.8x (2 posts), 21 seconds | "What works for you, from your posts" | Hover or focus a node to see its evidence | Creator DNA connects | Why it fits you. |
| 3 | **Creates** | next best move | The pattern chip **morphs** into the Studio panel; three hooks, then script, shots, caption | "A plan you can shoot" | Pick a hook; the script updates | Chip to panel morph (no page change) | A shoot plan, drafted. |
| 4 | **Monetizes** | next best move | A brand message is **pasted** onto the glass. Terms are read out: ₹17,500 to ₹24,000, walk away below ₹15,500, 180-day exclusivity flagged | "What to ask, and where to walk away" | Edit a term; the price moves | Message becomes terms, price, risk | An offer, priced. |
| 5 | **Learns** | remembers | **You add a result.** Proof-first lift moves 1.8x to 1.9x (hypothetical input, labelled). A memory line appears; the network brightens | "The next draft starts from this" | Scroll scrubs the loop | Loop plus memory entry | Your results shape the next draft. |

**Comprehension test (Phase 6):** show the page, hero to CTA, to 5 non-creators and 5 creators. Pass: at least 4 of 5 in each group describe CREO in their own words as something that learns your content and tells you what to do next. Record the time taken.

## 6. Copy budget

**Counting rule:** split on whitespace; count tokens that contain a letter or digit; `₹499` counts 1; `·` and `+` count 0. **Enforced** by a Playwright word-count test in Phase 1 (the test fails the build if a cap is exceeded).

| Bucket | Cap | Draft | Count |
|---|---|---|---|
| Nav | 5 | CREO · Apply for the cohort | 5 |
| Hero | 27 | Headline 5 + tagline 17 + "Apply for the founding cohort" 5 | 27 |
| First-screen labels | 7 | CONTENT, AUDIENCE, TRENDS, DEALS, PERFORMANCE, "Sample data" | 7 |
| Rail labels and captions | 27 | Sees · Knows you · Creates · Monetizes · Learns, plus the five captions in section 5 | 27 |
| CTA block | 23 | "Tomorrow, it starts smarter." + "₹499 for 30 days. 10 to 15 creators. Direct access to the team." + "Nothing leaves CREO without your approval." | 23 |
| Footer scope | 13 | "Sample data. Works from what you add. Instagram Reels only. No testimonials yet." | 13 |
| **Marketing, no form** | **105** | | **102** |
| Application form (select options excluded) | 40 | Labels, a 12-word consent, "Apply for the cohort" | 26 |
| Product-sample strings in the beats | 80 | At most 4 strings per beat, each at most 7 words, one "Sample data" label per beat counted | to test |
| **Page total** | **225** | 105 + 40 + 80 | |

First screen: nav 5 + hero 27 + labels 7 = **39 words** (cap 45). The price and cohort size appear **once** (CTA block), not in the hero.

**Writing rules** (UX-writing pass): short words, active voice, front-load the point, numerals, no hype or filler (no "unleash", "seamless", "next-gen"). Sentence case for all copy **except** the two locked strings, which keep their supplied casing. One CTA label everywhere: **"Apply for the cohort"** (it is an application, not a purchase; the form says "We read every application").

**Honesty rules:** what CREO does today is template-based generation from what the creator enters, with no live account connection, no Gmail or DM integration, and a hand-curated trend library. So: "Pattern matched", not "detected"; "pasted", not "slides in"; "You add a result", not "the result returns". No "AI-written" claim. One persistent "Sample data" badge per scene. No invented testimonials, logos or results. The tagline is locked and not edited, so the footer scope line ("Works from what you add. Instagram Reels only.") carries the limits.

## 7. The sample creator (all values from the real engine)

| | Value |
|---|---|
| Creator | Arjun Kulkarni, @arjunbuilds, Pune, AI and tech, 27.4K followers, average views 13,550, 12 posts |
| Audience | 22 to 34, freelancers, students and early-career marketers; Bengaluru, Pune, Mumbai, Delhi NCR |
| Voice | analytical, dry humour, direct |
| Best hook | Proof first, **1.77x** baseline, **from 2 posts** (show that basis) |
| Best length | about **21 seconds** (median of top posts) |
| Library | 10 patterns: 4 rising, 3 emerging, 3 stable. The brief counts 5 "worth your time" |
| Featured pattern | "I replaced X with AI for 7 days" (the "X" is part of the pattern's real title): **emerging**, fit **96** |
| Brand message | Tessera: 1 Reel + 2 Stories, **paid usage 30 days**, exclusivity **180 days**, offer ₹12,000 |
| CREO's read | Quote ₹17,500 to ₹24,000, walk away below ₹15,500, health "risky" (45 of 100), flag: long exclusivity |
| Beat 5 input | A hypothetical third proof-first post at 2.2x baseline moves the lift **1.77x to 1.92x** (3 posts). Shown as a labelled example |
| Memory lines | "Lead hooks with the result first." · "Declined Brewline. Gifting only breaks your deal rules." |

Every sample string in the page is generated from the engine or labelled hand-set. Not used: 91% fit, 142 posts, 5 patterns rising, 90-day usage, 18 to 32 s (none match the engine).

## 8. Motion strategy

Every motion must show change, progress, cause and effect, or hierarchy. If it does none of these it is cut.

**Technology ladder (use the simplest that works):** CSS → Motion (`motion/react`) → GSAP → three.js. GSAP only if a timeline cannot be done in Motion; three.js only for genuine 3D.

| Motion type | Used for | Not used for |
|---|---|---|
| Scroll-linked | The five-beat story | Decorative parallax |
| Cursor-reactive | The scanning light; chips responding to hover or focus distance | Constant wobble |
| Morphing | Pattern chip to Studio panel; message to terms | Page transitions |
| Particles | A few dozen signal points that brighten when read | Ambient dust |
| Shader | Glass, floor, light | Wallpaper |
| 3D | The Layer (depth, refraction) | Floating random objects |
| Spring | UI response | Data values |
| Text reveal | The headline, once | Every heading |

Tokens: UI response 150 to 250 ms; scene transitions scrubbed to scroll; easing `cubic-bezier(.16,1,.3,1)`; springs without overshoot on data. The DOM animates only `transform` and `opacity`. WebGL animates through uniforms driven by one shared `progress` value (no React render per frame).
**Reduced motion:** a CSS-driven layout switch (section 5); no continuous motion; the rail and five still posters carry the story.

## 9. 3D / WebGL strategy

**Principle:** DOM for anything people read; WebGL for atmosphere, glass and signals. The canvas is `aria-hidden`; all text and product UI are real DOM.
**DOM over 3D:** chips and panels are DOM elements positioned by projecting 3D anchor points through the same camera each frame (as the look-dev does). When the glass "fills the screen" for Studio, the DOM panel takes over by animating from the chip's rectangle (layout morph) while the 3D glass fades behind it. This chip-to-panel handoff is the hardest piece and is prototyped first in Phase 3.

**Measured bundle weights** (esbuild, minified, KiB = 1024 bytes, gzip -9; brotli where a reviewer measured it, n/m = not measured):

| Stack | gzip KiB | brotli KiB | Verdict |
|---|---|---|---|
| `ogl` minimal | 14.5 | 12.4 | Good for light shader effects; not for physical glass |
| `three` minimal | 129.2 | 107.3 | Needed for glass and floor |
| `three` + transmission material | 131.7 | 109.0 | Glass adds almost no bytes |
| `three` + `postprocessing` | 145.4 | 120.7 | +16 KiB; optional |
| **The spike's exact imports** (renderer, physical material, RoundedBox, Reflector, composer, bloom, output, environment) | **138 to 139** (two independent measurements) | n/m | **Measured floor** before any app code |
| `@react-three/fiber` + `three` | 242.4 | 201.7 | Not used. The extra is R3F's own code plus loss of tree-shaking |
| `@react-three/drei` (Environment, Float, transmission) | 265.7 | 220.8 | Not used |
| `gsap` core | 26.8 | n/m | Only if Motion cannot do a timeline |
| `gsap` + ScrollTrigger | 43.9 | 39.6 | Same |
| `lenis` | 5.3 | n/m | Optional; default off (native scroll is more robust with a pinned story) |
| Motion hooks only (`useScroll`, `useTransform`) | 8.5 | n/m | Not free: the full Motion chunk today is 46.5 |

**Decision:** vanilla `three` plus a few examples, lazy-loaded; **ceiling 165 KiB gzip, measured floor 139 KiB**, which leaves about 25 KiB for shaders, the scene, the network and tiering. No R3F, no drei. No `SMAAPass` (+37.7 KiB because of its lookup textures); antialiasing from the composer's render-target samples or FXAA (+1.4 KiB).

**Loading sequence:**
1. Server HTML: headline, tagline, CTA, nav, and a **poster `<img>`** (with `preload`). This is the LCP.
2. After idle or the first pointer move, if capability checks pass (WebGL2, no reduced motion, no Save-Data, 4 or more cores, 4 GB or more when reported), import the scene in a `"use client"` wrapper using `next/dynamic` with `ssr: false`. The canvas cross-fades over the poster.
3. Pause when off-screen and when the tab is hidden; render on demand when nothing moves; handle `webglcontextlost` by falling back to the poster.

**Poster:** generated **locally** by a script (`npm run poster`, headless Chromium on a developer machine) and **committed** to `/public`, regenerated only when the scene changes. No headless browser in the Vercel build. Measured on the look-dev frame: 1440x900 WebP (q78) 56 KB, AVIF 38 KB; 390 px wide WebP 10 KB; at 2x density a reviewer measured about 79 KB AVIF and 78 to 116 KB WebP. Budget per density: **70 KB at 1x, about 110 KB at 2x**. Grain is applied in CSS or the live canvas, never baked in. Re-measure on the final frame.

**Quality tiers** (chosen by a short probe while the poster is still showing, ignoring warm-up frames, and never thrashing):

| Tier | Contents | Notes |
|---|---|---|
| T3 | Transmission glass, reflector floor, bloom, DPR 1 to 1.5 | **A hypothesis until measured on real GPUs.** Knobs: `transmissionResolutionScale` 0.5, keep the glass off the reflector's layer, half-resolution floor, `compileAsync`. Depth of field is **cut from baseline T3**: it conflicts with the transmission pass, and the glass would need excluding through layers. Blurred floor reflection is custom shader work to prototype in Phase 1; if too costly it is faked in T2 |
| T2 | Faux glass (environment + Fresnel), cheap floor, DPR 1 | Mid devices and thermal drops |
| T1 | Poster only, with a scroll-driven or timed reveal of the five chips | Most phones, no WebGL, reduced motion. No pointer tilt (touch has no pointer; iOS orientation needs a permission). **For most phone visitors the poster is the hero, so it gets the most polish** |

**Touch:** the default state is the automatic sweep; the optional touch input is tap or drag the light. Five beat stills (about 40 KB each) serve reduced motion and phones.
**iOS Safari risks (unverified here):** `100vh` is the large viewport, `100dvh` changes while scrolling, and resizing the canvas mid-scroll reallocates the transmission and bloom targets. Phase 1 therefore includes a **real-iPhone spike**: a sticky pane using `100svh`, the canvas sized once with height-only resizes ignored, a `webglcontextlost` handler, and no ancestor with `overflow: hidden` (use `clip`).
**Verification method:** headless Chromium here runs WebGL2 (verified), so each phase can be screenshotted for correctness and composition. Real performance needs real hardware: Phase 1 ships a `?debug` frame-time overlay, and you send two numbers from a laptop and a phone.

## 10. Color

Restrained base plus **one** accent. The 3D world may add richer light; the UI stays restrained.

| Token | Value | Role |
|---|---|---|
| Ground | `#07080B` | Page and scene |
| Text | `#F3F0E8` | Warm white, 17.6:1 on ground |
| Muted | `#9A9C95` | Secondary text, 7.2:1 |
| Line | `#2A2D35` | Decorative hairlines only (1.45:1) |
| Control border | `#5B606B` | Form inputs (3.18:1, meets the 3:1 control-boundary rule) |
| **Accent** | **`#C6FF3D`** (acid lime) | CTA, glass edge, active data; 16.95:1 on ground |
| On-accent | `#0B0D08` | Text on the accent; 16.5:1 |

Text will sit over a bloomed scene (the look-dev's bright glow is about `#808080`, where the text colour is only 3.47:1). So every text block gets a scrim, and contrast is measured on the **real poster** behind each block in Phase 1.

| Accent | On ground | Dark text on it | Read |
|---|---|---|---|
| **Acid lime `#C6FF3D`** (recommended) | 16.95 | 16.5 | Strongest contrast; same hue family as the current olive-lime but far more saturated, so it is a real change. Not purple. Risk: can feel "hacker"; mitigated by sparing use and warm-white text |
| Warm orange `#FF6A2B` | 7.01 | 6.8 | Warm, human, passes |
| Signal cyan `#3DE0FF` | 12.69 | 12.4 | Clean; close to generic AI blue |
| Electric blue `#3B5BFF` | 3.94 | 3.8 | **Fails AA for small text** |
| Deep violet `#7A4DFF` | 4.13 | 4.0 | **Fails AA for small text**; the AI cliché |

## 11. Typography

Maximum two families.

| Role | Recommendation | Why |
|---|---|---|
| Display and UI | **Instrument Sans** (installed, true italic) | Calm, wide, premium; the italic gives one accent word ("Creators.") |
| Labels and data | **Geist Mono** | Technical feel for chips, numbers, tags; tabular figures |

| Style | Desktop | Mobile |
|---|---|---|
| Headline | weight 400, tracking −0.045em, `clamp(2.75rem, 6.1vw, 5.75rem)` | about 2.75rem, 3 lines |
| Tagline | `clamp(1rem, 1.25vw, 1.2rem)`, 1.5 line height | 1rem |
| Beat caption | 17 to 20 px | 17 px |
| Chip and label (mono) | 11 to 12 px, +0.08em | 11 px |
| Data numerals | Instrument Sans, tabular figures | same |

Alternatives to specimen if you want a more editorial feel: Instrument Serif (display) + Geist (UI), or Inter Tight + JetBrains Mono.

## 12. Logo direction (built in Phase 7)

Six directions; no brains, robots, stars, sparkles or cameras. The board has no logo sheet yet; Phase 7 produces one.

| | Direction | Idea |
|---|---|---|
| A | Wordmark | Custom-tuned lowercase "creo", optical spacing |
| B | C + O monogram | The C opening catches the O |
| C | Signal mark | Concentric arcs that tighten (learning) |
| D | Open loop | A ring that closes progressively (the learning loop) |
| E | The Layer | Two offset translucent planes forming a C |
| F | Glass edge | A single bevelled stroke built for favicon size |

Judged on uniqueness, 16 px legibility, app-icon crop, one-colour, dark and light, and X/Instagram avatar. The mark etched at the glass centre (section 3) uses the chosen logo. The current mark is a placeholder.

## 13. Performance, accessibility, responsive

**Budgets** (hypotheses until measured on real devices):

| Metric | Target |
|---|---|
| LCP | under 2.0 s on a mid-range phone (text or poster) |
| First-load JS before the scene | **190 KiB gzip or less** (framework 127 + route 63). Measured baselines: framework 126.8 KiB; the current page 252 KiB. Re-measured from `next build` in Phase 1 |
| Scene chunk | 165 KiB gzip or less, lazy (measured floor 139) |
| CLS | under 0.05 (reserved boxes for poster and any video) |
| Poster | 70 KB at 1x, about 110 KB at 2x |
| Frame time T3 | under 16.7 ms on a mid laptop GPU (hypothesis); drop a tier above 22 ms for 2 s |

**Accessibility:** canvas `aria-hidden`; all content in the DOM; the story has real headings and a keyboard-steppable control; visible focus; contrast per section 10; reduced-motion layout in CSS; no information carried by motion alone.
**Responsive:** desktop is the full experience; mobile is recomposed (sections 5 and 9), not shrunk.

## 14. Risks

| Risk | Mitigation |
|---|---|
| "Super realistic" overpromises | Defined as physical cues (section 3); frames each phase; a glass-visible frame is a Phase 1 acceptance test |
| WebGL heavy on real phones | Mobile never starts at T3; tiers; poster fallback; real-device numbers before claims |
| Pinned story feels like scroll-jacking, or breaks on iOS | Native scroll speed; the rail works without scroll-jacking; real-iPhone spike in Phase 1; mobile does not pin |
| Acid lime reads "hacker" | Sparing use, warm-white text; Phase 1 includes one comparison frame in orange |
| Copy overclaims | Honesty rules (section 6), word-count test, sample-data badge |
| I cannot see the reference sites | Send screenshots or allow the hosts and section 4 upgrades from unverified |

## 15. Phase plan (adapted)

One scroll scaffold; beats are built inside it, in order. Each phase stops for your approval.

| Phase | Delivers |
|---|---|
| 1 | The hero: The Layer scene (T3, T2, T1), poster script, exact copy, nav, CTA, `?debug`, tiers, reduced-motion CSS. **Acceptance:** glass clearly visible, no reflection artefact or seam, word-count test passing, real-iPhone spike result, one orange comparison frame, type specimen |
| 2 | Beat 2: Creator DNA network |
| 3 | Beats 1 and 3: pattern matched, then the morph into Studio |
| 4 | Beat 5: add a result, learning loop and memory |
| 5 | Beat 4: Collab |
| 6 | Pinned scaffold and rail polish, CTA and form, "?" slide-over, footer, retire the old page, comprehension test |
| 7 | Logo and identity |
| 8 | Product UI (HQ and the rest) |
| 9 | Responsive and performance on real devices |
| 10 | Final polish |

## 16. Decisions needed

Please answer these (reply "go" to accept every recommendation):
1. **Concept A "The Layer"** (recommended), B, or other?
2. **Seven acts → five beats**, with your order and labels as in section 5?
3. **CREO mark at the centre of the glass** with the five signals around it (as in your brief)?
4. **Accent:** acid lime (recommended), orange, or cyan?
5. **3D scope:** vanilla `three`, lazy, with poster fallback (recommended), or a lighter `ogl`-only hero, or poster/video only?
6. **Retire the long page** from `/` (recommended; `/app` stays)?

**Proceeding unless you object:** dark-first landing, with a matching dark app theme decided in Phase 8; Instrument Sans + Geist Mono; mobile is static (T1) with the automatic sweep; the CTA label "Apply for the cohort"; the scope line in the footer.

---

## Appendix A: Measured facts

esbuild 0.28.2, three 0.186.1, ogl 1.0.11, gsap 3.15.0, lenis 1.3.26, `@react-three/fiber` 9.8.1, `@react-three/drei` 10.7.9, `postprocessing` 6.39.5. Sizes are KiB (1024 bytes); Next and Vercel print kB (1000), so three-minimal is 132.3 kB. Brotli was measured by a reviewer with Node at quality 11. Next.js chunking and shared-chunk effects were not measured. WebGL: Chromium 141 headless, ANGLE on SwiftShader, WebGL2 available. The 116 ms (1440x900) and 31 ms (390x844) frame times come from a synthetic fbm shader, not the scene.

## Appendix B: UI libraries

Source files were fetched from `raw.githubusercontent.com` (66 of 720 candidate paths exist; **33 files read: 17 from motion-primitives, 16 from Magic UI**), type-checked against React 19.3 and `motion` 12.43 and 13.5, and compiled with Tailwind 4.3. **Not rendered in a browser, not tested on Next 16.**

**Licence:** both MIT (`LICENCE.md` in motion-primitives, `LICENSE.md` in Magic UI). Keep the copyright notice on any copied file.
**Imports:** all files import from `motion/react`, so no rewrite. They need `cn()` from `@/lib/utils` (clsx + tailwind-merge); `dock` needs `class-variance-authority`; `morphing-dialog` needs `lucide-react`.

| Verdict | Count | Components | Beat mapping |
|---|---|---|---|
| **Adopt** | 15 | motion-primitives: `text-effect`, `text-morph`, `text-loop`, `text-shimmer`, `in-view`, `magnetic`, `transition-panel`, `morphing-dialog`, `progressive-blur`. Magic UI: `animated-beam`, `number-ticker`, `marquee`, `shine-border`, `scroll-progress`, `progressive-blur` | Used only where a beat needs it: `text-effect` (headline reveal), `magnetic` (CTA), `morphing-dialog` pattern (beat 3 chip to panel), `number-ticker` (beat 5 lift), `scroll-progress` (rail; recolour, it ships purple), `animated-beam` (beat 2 links in T1 and T2), `shine-border` (form card; honours reduced motion), `progressive-blur` (hero edge), `in-view` (CTA reveal), `transition-panel` (mobile beat swap). `text-loop`, `text-shimmer`, `text-morph`, `marquee`: **no beat needs them; not used** (continuous decorative motion is excluded by section 8) |
| **Reimplement** | 9 | `text-scramble`, `spotlight`, `cursor`, `glow-effect`, `animated-group`, `animated-number`, `scroll-progress` (motion-primitives), `text-reveal`, `particles` | Idea good, code has a defect: `motion.create()` inside render; global `JSX` type removed in React 19; `ease: string` and `layoutEffect` rejected by `motion` 12 and 13 types; a Tailwind v4 gradient risk in `spotlight` |
| **Avoid** | 9 | `dock` (both), `border-beam`, `globe`, `meteors`, `orbiting-circles`, `ripple`, `retro-grid`, `sparkles-text` | Template-demo look, wrong mood, or heavy (`retro-grid` is an 866-line WebGL shader; `globe` adds a WebGL dependency) |

Use: micro-interactions only. The hero scene is custom. Magic UI is not used for hero effects.

## Appendix C: Product repositories (README level only)

Patterns for the later HQ and approvals UI (Phase 8), each tied to a README statement (22 of 22 quotes checked against saved copies). No source trees or screenshots were read. Items marked *analogy* are inferences, not documented features.

1. **Typed objects, many saved views** (Twenty, Plane): deals, replies, drafts and memory entries as records; HQ, approvals and inbox as saved views.
2. **Approval is a parked state, not a modal** (Trigger.dev, LibreChat): a drafted reply waits in a queue until approved, rejected or edited.
3. **Graduated trust per action class** (*analogy* from LibreChat's Ask/Allow/Deny for code actions): low-risk actions could leave the queue over time; sending commercial terms never does.
4. **Show what the AI used** (LibreChat context usage, Penpot Inspect, Trigger.dev trace): an "inspect" on any draft listing which memory items and deal facts it read.
5. **Live status and resumable work** (Trigger.dev, LibreChat): drafting state visible and surviving a reload.
6. **Auto-match incoming material to its record** (Midday's inbox matching): a brand message attaches itself to its deal.
7. **Documents beside the assistant** (Midday vault, AFFiNE local-first): contracts and rate cards in Memory, with answers citing them.
8. **One source of truth for voice** (Penpot tokens): one profile that drafts, replies and HQ all read.
9. **Close the loop from action to outcome** (Dub: links, then conversion tracking): tie a deliverable to its result so HQ can show what a deal produced. *Dub's README supports the link-to-conversion framing only; the CREO use is an analogy.*
