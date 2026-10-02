#!/usr/bin/env node
// Copy budget check for the landing page. Usage: node scripts/check-copy.mjs <baseUrl> [--json]
// Counts words per data-copy bucket at 1440x900 and 390x844 and exits non-zero if a cap is exceeded.
// Rule (docs/creo-design-direction.md, section 6): split on whitespace, count tokens that contain a letter or a digit.
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const HEADLINE = "The Intelligence Layer for Creators.";
const TAGLINE = "Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.";
const CAPS = { marketing: 105, form: 40, sample: 80, total: 225, firstScreen: 45 };
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, maxScreens: 6.5, mobile: false },
  { name: "mobile", width: 390, height: 844, maxScreens: 7, mobile: true },
  // The stacked story shows every beat at once, so this is the run that counts all the sample strings on a wide screen.
  { name: "desktop-reduced", width: 1440, height: 900, maxScreens: 8, mobile: false, reducedMotion: "reduce" },
];

const args = process.argv.slice(2);
const json = args.includes("--json");
const baseUrl = args.find((a) => !a.startsWith("--"));
if (!baseUrl) {
  console.error("usage: node scripts/check-copy.mjs <baseUrl> [--json]");
  process.exit(2);
}

const load = (from) => createRequire(from)("playwright");
let playwright;
try {
  playwright = load(import.meta.url);
} catch {
  playwright = load("/opt/node22/lib/node_modules/");
}
const executablePath = ["/opt/pw-browsers/chromium"].find((p) => existsSync(p));

/** Runs in the page. Returns word counts and the lists the report needs. */
function measure({ headline, tagline }) {
  const words = (s) => s.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
  const rendered = (el) => el.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true });
  const opacityOf = (el) => {
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  };

  const buckets = {};
  const outside = [];
  let total = 0;
  let firstScreen = 0;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    const el = node.parentElement;
    if (!el || !text.trim()) continue;
    if (el.closest("script, style, noscript, template, select, option, [data-copy-skip]")) continue;
    if (!rendered(el)) continue;
    const n = words(text);
    if (!n) continue;
    const bucket = el.closest("[data-copy]")?.getAttribute("data-copy") ?? null;
    if (bucket) buckets[bucket] = (buckets[bucket] ?? 0) + n;
    else outside.push({ text: text.trim().slice(0, 80), tag: el.tagName.toLowerCase(), words: n });
    total += n;

    const range = document.createRange();
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && opacityOf(el) > 0.05) firstScreen += n;
  }

  const h1s = [...document.querySelectorAll("h1")];
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const doc = document.documentElement;
  return {
    buckets,
    total,
    firstScreen,
    outside,
    h1Count: h1s.length,
    h1Text: h1s[0]?.textContent ?? null,
    h1Ok: h1s.length === 1 && h1s[0].textContent === headline,
    taglineOk: [...document.querySelectorAll("p")].some((p) => norm(p.textContent ?? "") === tagline),
    screens: Math.round((doc.scrollHeight / innerHeight) * 100) / 100,
    overflowX: doc.scrollWidth - doc.clientWidth,
  };
}

const browser = await playwright.chromium.launch({
  executablePath,
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

const results = [];
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      reducedMotion: vp.reducedMotion ?? "no-preference",
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("pageerror", (e) => consoleErrors.push(String(e)));
    await page.goto(baseUrl, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    // Let the one-time entrance animations finish so nothing is measured while still faded out.
    await page.evaluate(() =>
      Promise.race([
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        ),
        new Promise((r) => setTimeout(r, 5000)),
      ]),
    );
    const m = await page.evaluate(measure, { headline: HEADLINE, tagline: TAGLINE });
    results.push({ viewport: vp.name, size: `${vp.width}x${vp.height}`, maxScreens: vp.maxScreens, consoleErrors, ...m });
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = [];
for (const r of results) {
  const fail = (msg) => failures.push(`${r.viewport}: ${msg}`);
  for (const key of ["marketing", "form", "sample"]) if ((r.buckets[key] ?? 0) > CAPS[key]) fail(`${key} ${r.buckets[key]} words, cap ${CAPS[key]}`);
  if (r.total > CAPS.total) fail(`total ${r.total} words, cap ${CAPS.total}`);
  if (r.firstScreen > CAPS.firstScreen) fail(`first screen ${r.firstScreen} words, cap ${CAPS.firstScreen}`);
  if (r.screens > r.maxScreens) fail(`page is ${r.screens} screens, cap ${r.maxScreens}`);
  if (r.outside.length) fail(`${r.outside.length} visible text run(s) outside a data-copy bucket`);
  if (!r.h1Ok) fail(`h1 is not the locked headline (found ${r.h1Count} h1, text ${JSON.stringify(r.h1Text)})`);
  if (!r.taglineOk) fail("the locked tagline is not on the page as one paragraph");
  if (r.overflowX > 0) fail(`horizontal overflow of ${r.overflowX}px`);
}

if (json) {
  console.log(JSON.stringify({ caps: CAPS, results, failures, ok: failures.length === 0 }, null, 2));
} else {
  for (const r of results) {
    const b = (k) => String(r.buckets[k] ?? 0);
    console.log(`${r.viewport} ${r.size}: marketing ${b("marketing")}/${CAPS.marketing}, form ${b("form")}/${CAPS.form}, sample ${b("sample")}/${CAPS.sample}, total ${r.total}/${CAPS.total}, first screen ${r.firstScreen}/${CAPS.firstScreen}, ${r.screens}/${r.maxScreens} screens, overflow ${r.overflowX}px`);
    console.log(`  h1 equals locked headline: ${r.h1Ok}; tagline present: ${r.taglineOk}; console errors: ${r.consoleErrors.length}`);
    for (const o of r.outside) console.log(`  outside a bucket: <${o.tag}> "${o.text}" (${o.words} words)`);
  }
  console.log(failures.length ? `FAIL\n${failures.map((f) => `  ${f}`).join("\n")}` : "OK");
}
process.exit(failures.length ? 1 : 0);
