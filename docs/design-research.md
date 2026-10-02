# CREO design research (Phase 0)

Status: Phase 0, research only. No product code was changed.
Date: 2026-10-02

## 0. How this research was done, and its limits

Read this first, because it changes how much weight each section deserves.

| Source | Method | Confidence |
|---|---|---|
| The inspiration video (`inspiration_1.mp4`, 20.8 s, 1038x680) | Extracted one frame per second and studied them directly | High |
| The CREO repository | Read the code, configs, README and the landing and app components | High |
| The ten reference sites (Passionfroot, Attio, Clay, Descript, Framer, Lovable, Beehiiv, 1of10, Linear, Vercel) | **Not inspected live.** The session's egress proxy blocks all ten hosts (curl and WebFetch both returned a block). Section 3 is written from general knowledge of these products plus the intent stated in the brief | **Medium to low.** Treat as hypotheses to confirm |

To close the gap, either allow these hosts in the environment's network settings, or send screenshots or a Figma link for any reference you care most about. Until then, nothing in section 3 should be read as "I looked at their current homepage".

## 1. Repository audit

### 1.1 What exists

| Area | Finding |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack), React 19, TypeScript strict |
| Styling | Tailwind v4 via `@tailwindcss/postcss`; tokens are CSS variables in `src/app/globals.css`, mapped with `@theme inline`; no separate component CSS |
| Motion | `motion` 13 (Motion for React), used in 5 files; reduced-motion respected in `globals.css` and in the hero |
| Icons | `@phosphor-icons/react` |
| Fonts | Geist (body) and Bricolage Grotesque (display), self-hosted through Fontsource |
| Routes | `/` landing; `/app` HQ, `/app/trend`, `/app/studio`, `/app/collabs`, `/app/dna`, `/app/memory`, `/app/approvals`; `POST /api/apply` |
| Landing sections | Hero, "One manager, one memory", Trend, Studio, Collab, Memory, Cohort (with application form), Final CTA, Footer |
| Product logic | About 4,900 lines of source and tests in total. The product logic is pure TypeScript engines in `src/lib/engine/` (pricing, extraction, deal evaluation, trend scoring, Studio package generation, DNA, brief). 25 passing tests |
| Landing data | Landing sections run the real engines on a made-up sample creator ("Arjun, 27K followers"), not screenshots |
| Logo | A 64px SVG: yellow rounded square with a ring-shaped "C" (`components/product/logo.tsx`, `app/icon.svg`) |
| Assets | No images, no illustration, no video. Everything is CSS and SVG |
| Theme | Light and dark, both implemented; one accent, a yellow "marker" fill behind text |
| Deployment | None yet. No Vercel project, no CI config |
| Analytics | None |
| Backend | None. Workspace state lives in `localStorage` (`creo.workspace.v1`). `store/workspace.tsx` is the intended swap point for Supabase |
| Auth | None |
| Applications | `POST /api/apply` validates, honeypots, rate-limits per instance, forwards to `CREO_APPLICATIONS_WEBHOOK`; 503 in production if unset |
| Language model | None. Generation is deterministic and template-based, by design (fast, explainable, testable) |

### 1.2 Design audit: why it reads as "very basic"

1. **No atmosphere.** Cool flat gray page, one yellow highlighter, no imagery or depth. Nothing in the first screen says "this is a different kind of product".
2. **No scroll choreography.** Sections are static bands that fade in. The page is read, not experienced.
3. **One idea per section, same rhythm every time.** Heading, subhead, panel. The eye never gets a surprise or a change of scale.
4. **Strong content, weak staging.** The real-engine demos are the best asset in the repo, and they are presented as ordinary cards.
5. **The brief's story is only half told.** There is no Creator DNA "gets you" moment, no Learning Loop section, no HQ section, no Human + AI section, no social proof section, no FAQ. The current page jumps from product demos straight to the cohort application.
6. **Brand is thin.** The logo is a placeholder, the type is competent but generic, and the single accent is distinctive only by being yellow.

### 1.3 What to keep

- The engines and the sample-creator approach. This is exactly the "show the product, honestly labelled" principle the brief asks for.
- The marker concept ("CREO highlights what matters"). It is a genuinely ownable idea, and it should survive the redesign.
- Light and dark theme plumbing, reduced-motion handling, the honeypot and rate-limited application route.
- The "approval before anything leaves CREO" principle, which should show in the UI of every section.

## 2. The inspiration video

### 2.1 What it is

A screen recording of a marketing site for a product called "agentix" (an AI-agents company). It scrolls back and forth through the lower two thirds of the page, plus a hero. It is a very specific visual language, and the brief says "as close as possible", so it gets its own section. The product and wording belong to someone else and are not a CREO reference. The grammar is.

### 2.2 The seven moves that define it

1. **Floating pill nav.** A small rounded pill, centered, holding a mark, a wordmark and one dark-olive CTA. No full-width bar.
2. **Painterly landscape as a stage.** A soft, illustrated mountain-and-lake scene with pine trees, meadow flowers and peach and lavender clouds. It is not decoration at the edge. It is the hero's second half, and it returns later as a scroll-driven reveal.
3. **Time-of-day arc.** The scene is dawn (peach and lavender sky, warm light) at the top and deep dusk-blue night at the closing CTA. The page is also a day.
4. **Centered, calm headline with one italic accent word** in olive ("Measure the performance of every *AI agent*."). Large, light, tight tracking, lots of air.
5. **Frosted glass tiles.** Small translucent rounded squares drift over the landscape and the clouds. They catch the scene behind them and add depth without adding content. The closing CTA also sits in a large frosted panel over the night lake.
6. **Notched "ticket" stat cards.** Four lime cards with circular bites cut from their edges, like a torn ticket strip. Numbers count up (the video shows 35%, 7% and 19% as the same card at different moments). A logo marquee sits under them.
7. **Giant numerals as a step accordion.** Steps 1, 2 and 3 are enormous numerals in three olive tones (dark, mid, lime). Each is a tall column separated by hairline rules. The active step expands to show a short title and one line of copy while the others collapse to slivers. Clouds drift behind.

Palette in the video: white or near-white page; dark olive (roughly #4b6a0e) for CTAs and the italic accent; lime (roughly #b5cf4f) for tickets and the footer; peach, lavender and dusk-blue only inside the illustration; near-black text.

### 2.3 What CREO should take, and what it must not

| Take | Do not take |
|---|---|
| Composition of the hero (pill nav, centered headline, scene rising behind) | The artwork itself. CREO needs its own original illustration, not a copy or a trace |
| Dawn-to-night arc across the page | The brand name, logo, wording or section copy |
| Frosted glass tiles, used sparingly | "50,000+ tasks", "Companies", "Execution Accuracy" and the logo strip. **CREO cannot show invented numbers or logos of companies that do not use it** (see below) |
| Notched ticket cards | Identical card proportions and exact notch geometry |
| Giant-numeral accordion | Slack/Zapier/Dropbox/HubSpot/Notion marks |
| Italic accent word in olive | The exact typeface |

### 2.4 Two places the video's pattern needs an honest adaptation

- **Trust stats and logo strip.** The video uses them as social proof. CREO has no customers yet, and the brief forbids fabricated testimonials and mocked data presented as real. Adaptation: reuse the ticket form for facts that are true today ("10 to 15 seats", "30 days", "Rs 499", "25 engine tests", or clearly labelled sample-creator numbers), and use the marquee for **what CREO reads** (brand DMs, `.eml` files, Reel descriptions, rate cards), not for supported platforms or partners. Gmail, Instagram connections and screenshot reading are listed as not built in the README, so they must not appear as logos.
- **Painterly look.** The video's scene is a painted raster illustration. A vector scene can be made beautiful, but matching a painted look "as close as possible" is much easier with raster layers. See open decision D2 in section 10.

## 3. Reference analysis

Reminder: written from general knowledge and the brief, not live inspection. Each entry says what the brief wants from the reference, what CREO should borrow conceptually, and what it should avoid.

### 3.1 Passionfroot
- **Does well (per brief):** Product-first storytelling, an interactive AI interface, real product states, creator cards, an action center, analytics told as a story.
- **Borrow:** Creator cards that show a person and a number at once; an "action center" idea for HQ ("what should I do next"); product states that change when you interact.
- **Avoid:** Marketplace framing. Passionfroot's world is brands finding creators. CREO serves the creator. Do not mirror their card layout or wording.

### 3.2 Attio
- **Does well:** Restrained premium SaaS feel; typography and whitespace carry the page; information hierarchy is clear at a glance.
- **Borrow:** Discipline. Fewer colors, fewer borders, bigger gaps, text that does the work.
- **Avoid:** CRM density and table-heavy UI. CREO is a strategist, not a database.

### 3.3 Clay
- **Does well:** The interactive "aha". Real product UI in marketing. Use-case-driven structure. Show, do not tell.
- **Borrow:** One small interaction per section that produces a result the visitor chose (paste a DM, get a price).
- **Avoid:** Spreadsheet metaphors; heavy, busy illustration.

### 3.4 Descript
- **Does well:** Creator-first storytelling. Actual UI demonstrating a workflow in sequence.
- **Borrow:** Letting the product demonstrate one complete job from start to finish (trend to script to shot list).
- **Avoid:** A tool-suite feel. CREO should not read as a bundle of editors.

### 3.5 Framer
- **Does well:** Transitions, scroll interactions, responsive behavior, polished motion.
- **Borrow:** Scroll-linked state (a value tied to scroll position, not a timer) and spring-based entrances. Motion for React already in the repo covers this.
- **Avoid:** Motion that exists to show off the tool. Every animation must carry meaning (brief, Phase 5).

### 3.6 Lovable
- **Does well:** An AI-native narrative in simple language; the product visual is the proof.
- **Borrow:** Plain sentences. A visitor should understand CREO in one read.
- **Avoid:** Their signature soft gradient glow. It is recognisable, and the brief says not to copy gradients.

### 3.7 Beehiiv
- **Does well:** Creator positioning, growth and monetization told as outcomes, clear conversion structure.
- **Borrow:** Monetization as a first-class story (Collab Inbox gets real weight, not a side feature) and a clean path from interest to application.
- **Avoid:** Generic "grow your audience" claims with no mechanism.

### 3.8 1of10
- **Does well (per brief):** Data-driven creator intelligence and content-performance visualization.
- **Borrow:** Small, honest charts that explain one thing (hook performance against a baseline). The repo's creator-fit breakdown already works this way.
- **Avoid:** Dashboards of numbers with no recommendation. CREO ends every chart with "so do this".

### 3.9 Linear
- **Does well:** Spacing, subtle transitions, strong typography, product polish.
- **Borrow:** Tight type, quiet states, instant-feeling interactions.
- **Avoid:** Dark, engineering-first mood as the default. CREO's audience is creators.

### 3.10 Vercel
- **Does well:** Minimalism, confidence, sharp hierarchy.
- **Borrow:** Confident short headlines, thin rules, generous negative space.
- **Avoid:** Monochrome austerity. It would fight the warmer, landscape-led direction.

## 4. Cross-cutting patterns

**Patterns CREO should use**
1. The product is the hero. Real components, not screenshots.
2. One interaction per section, and the visitor's action changes what they see.
3. A visible sample-creator label on anything illustrative.
4. Hierarchy by scale. One huge element per section, everything else small.
5. Atmosphere that changes with scroll (the day arc), so the page has a shape.
6. Plain words. No paragraph longer than three lines.

**Patterns CREO should avoid** (from the brief, restated)
Generic purple AI gradients, heavy glassmorphism, floating robots, sparkle icons, template section stacks, stock photography, neon cyberpunk, and walls of text. Frosted glass is used here only as small tiles and one CTA panel, not as a card style for the whole site.

## 5. Tagline exploration

The brief says to explore at least ten alternatives before finalizing. **None of these is final.**

| # | Line | Territory | Notes |
|---|---|---|---|
| 1 | Your AI creator strategist. | Role | From the brief; clear, a little generic |
| 2 | CREO learns how you create. | Memory | Strongest statement of the real differentiator |
| 3 | The AI that learns what works for you. | Memory | Clear but long |
| 4 | Your creator's second brain. | Metaphor | Overused phrase in AI products |
| 5 | An AI manager that gets smarter every time you create. | Compounding | Accurate; too long for a headline |
| 6 | Know what to post. Know what to charge. | Outcome | Current copy. Pairs two jobs well; says nothing about learning |
| 7 | Stop guessing what to post. | Pain | Good for the final CTA, not the hero |
| 8 | A manager that actually knows you. | Relationship | Warm; "manager" may imply it replaces a person |
| 9 | The more you make, the more it knows. | Compounding | Short and rhythmic |
| 10 | Your next move, decided with your own data. | Evidence | Clear; a little cold |
| 11 | Trends are for everyone. Your strategy isn't. | Contrast | Strong, but sets up a trend-only story |
| 12 | Create. Correct. CREO remembers. | Loop | Memorable, maps directly to the learning loop |

**Recommendation (not final):** Hero headline **"CREO learns how *you* create."** with the italic olive accent on "you". Subline: *"Your AI creator strategist, from the content you make to the deals you close."* Keep #6 as the Collab Inbox line, #7 as the final CTA, and #12 as the Learning Loop caption.

## 6. Competitive visual differentiation

From my understanding (unverified against current sites): Beacons is a broad creator-business platform, Passionfroot centres on brand and creator matching, and most AI creator tools lead with a prompt box and generated output.

| They tend to look like | CREO looks like |
|---|---|
| Tool grids and feature lists | A single day told as a story |
| Purple or blue gradient AI polish | Warm paper white, olive and lime, painted sky |
| Dashboards and generic screenshots | A real creator's morning brief, with approvals |
| "Generate" as the verb | "Learn" and "remember" as the verbs |
| Anonymous UI | A named sample creator whose data visibly shapes each recommendation |

The visual claim is: *this product knows one person*. The painted scene says calm and human; the product UI inside it says precise and personal.

## 7. Proposed landing structure

It follows the brief's twelve sections in order, adds the video's grammar, and runs one continuous dawn-to-night arc. "Existing" marks code already in the repo that can be restaged.

| # | Section | Sky | What the visitor sees | Video move used | Existing code |
|---|---|---|---|---|---|
| 1 | Hero | Dawn | Pill nav, headline with italic accent, landscape rising; the HQ morning-brief UI floats over the lake: notification arrives, trend card expands, CTA moves into Studio | Moves 1 to 5 | `hero.tsx` (HeroManager) |
| 2 | CREO gets you | Morning | Creator DNA assembling field by field (niche, audience, best hook, best format, length) as ticket-style tiles | Move 6 (tickets) | `dna.ts`, `dna-form.tsx` |
| 3 | Trend | Late morning | Trend detected, mechanism, creator fit, original adaptation, "Turn this into my content" | Glass tiles | `trend-section.tsx` |
| 4 | Studio | Midday | Trend to 3 hooks to script to shot list to caption to CTA, as structured cards that build | None | `studio-section.tsx` |
| 5 | The learning loop | Afternoon | Recommend, edit, publish, perform, learn, smarter recommendation. The signature section | New | `memory-section.tsx` (partial) |
| 6 | Collab Inbox | Late afternoon | Instagram-style DM; extraction, rights, budget, price, risks, reply | None | `collab-section.tsx` |
| 7 | HQ | Dusk | "Tomorrow's brief is already written": three things worth attention and the next action | None | `brief.ts`, `brief.tsx` |
| 8 | Human + AI | Dusk | AI drafts, a strategist corrects, CREO remembers | **Move 7** (giant numerals accordion) | New |
| 9 | Social proof | Dusk to night | "Founding Creator #01" as empty ticket seats. No invented quotes or logos | Move 6 (tickets), honest | New |
| 10 | Founding cohort | Night | 10 to 15 creators, 30 days, Rs 499, direct access; application form | Tickets | `cohort.tsx` |
| 11 | FAQ | Night | Eight questions from the brief | None | New |
| 12 | Final CTA | Night | Frosted panel over the night lake, lime footer | Moves 5 and 6 | `footer.tsx` |

Section 5 and section 8 deliberately use different devices. The loop is a diagram that animates; the human-in-the-loop section is the numerals accordion. Reusing the accordion for both would make the page repeat itself.

## 8. Interaction principles

1. **Scroll is the timeline.** Sky, scene parallax and key values are tied to scroll position, not to timers. A visitor who stops scrolling stops the animation.
2. **One touch per section.** Each section has one thing to try (click a trend, paste a DM, step the loop).
3. **Cause and effect only.** Motion shows change, progress, hierarchy or cause and effect (the brief's Phase 5 rule).
4. **Fast and quiet.** 150 to 250 ms for UI responses, 400 to 700 ms for scene transitions. Springs for entrances, no bounce on data.
5. **Never trap the scroll.** No scroll-jacking. The numerals accordion is driven by sticky positioning and scroll progress, and the page keeps its normal scroll speed.
6. **Everything has a still state.** Reduced motion, slow devices and screenshots must all look finished.
7. **Mobile is designed, not shrunk.** Accordions become vertical stacks, the scene gets fewer layers, hover becomes tap.

## 9. Brand principles

1. **Knows the creator.** Every section proves a specific thing about one person.
2. **Show the product.** If a paragraph can be a working component, it is.
3. **Honest by default.** Sample data is labelled sample. Features not built say "in design". No invented numbers, logos or quotes.
4. **Calm confidence.** Light type, wide spacing, short sentences. It never shouts.
5. **Human in the loop.** The creator approves; a strategist helps. The UI never implies the AI acts alone.
6. **Specific over generic.** "Proof-first hooks, 18 to 32 seconds" beats "optimized content".

## 10. Open decisions and risks

These need your answer before Phase 1 starts.

| ID | Decision | My recommendation |
|---|---|---|
| D1 | Brand color: switch from the yellow marker to the video's olive and lime, or keep yellow | Switch to olive and lime to match the video. Keep the marker device, now as a soft lime wash. The current logo is replaced anyway in Phase 2 |
| D2 | How the painted scene is made. (a) Vector SVG layers in code, (b) raster layers you create or commission, (c) both | **(c)**. I build the full scene in code first so the page is complete and fast, with every layer isolated so painted PNG or WebP layers drop in later. I will write exact generation specs per layer (sky, clouds, far and near mountains, lake, meadow, trees) if you want to generate them. A purely vector scene will look stylized, not painted |
| D3 | Headline | Candidate #2 with the italic accent (section 5) |
| D4 | Typeface | Pick from a specimen in Phase 1. Needs a true italic for the accent word. Shortlist in `design-direction.md` |
| D5 | Dawn-to-night arc as the page concept | Yes. It also lets HQ (a "morning brief") make sense as "tomorrow's brief" at dusk |
| D6 | Heavy effects (WebGL water, shaders) | Not in Phase 1. Revisit in Phase 5 if performance budgets allow |
| D7 | Reference access | Allow the ten hosts in network settings, or send screenshots, so section 3 can be upgraded from medium to high confidence |

Risks
- **Perceived copying.** Mitigated by original art, original copy, and CREO's own mechanics. The video supplies a grammar, not assets.
- **Performance.** A layered scene plus scroll effects can hurt mobile. Budget in `design-direction.md`: LCP under 2.5 s on a mid-range phone, scene layers lazy-loaded below the hero, no layout-affecting scroll handlers.
- **Over-staging.** The risk of a beautiful page that hides the product. Mitigation: the product UI always sits above the scene in visual weight.
- **Fonts and assets.** Fontsource packages for any new typeface still need to be installed and checked in Phase 1.

## 11. What happens next

On approval, Phase 1 builds the landing page against `design-direction.md`, in this order: tokens and type, scene system, hero, the two signature sections (loop and numerals), then the remaining sections. At the end of Phase 1 I will stop again for review with screenshots at 1440, 768 and 390 widths.
