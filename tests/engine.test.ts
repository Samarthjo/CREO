import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveDna } from "../src/lib/engine/dna.ts";
import { makeDraft } from "../src/lib/engine/draft.ts";
import { evaluateDeal } from "../src/lib/engine/evaluate.ts";
import { extractInquiry } from "../src/lib/engine/extract.ts";
import { buildBrief } from "../src/lib/engine/brief.ts";
import { priceDeal } from "../src/lib/engine/pricing.ts";
import { buildPackage, spokenSeconds } from "../src/lib/engine/studio.ts";
import { extractPattern, LIBRARY, rankPatterns, scoreFit } from "../src/lib/engine/trend.ts";
import { HOOK_TYPES, type HookType } from "../src/lib/engine/types.ts";
import { makeInquiry, sampleDna, sampleMemory, sampleWorkspace, SAMPLE_INQUIRY, SAMPLE_SCAM } from "../src/lib/store/seed.ts";

const dna = sampleDna();
const insights = deriveDna(dna);
const memory = sampleMemory();

test("pricing: default quote matches the documented example", () => {
  const q = priceDeal({ avgViews: 12000, nicheRate: 1.3, reels: 1, stories: 2, posts: 0, usage: "organic", exclusivityDays: null, rush: false, minReelInr: 0 });
  assert.equal(q.lowInr, 10000);
  assert.equal(q.highInr, 13500);
  assert.equal(q.walkAwayInr, 9000);
});

test("pricing: creator minimum overrides a lower anchor", () => {
  const q = priceDeal({ avgViews: 3000, nicheRate: 1, reels: 1, stories: 0, posts: 0, usage: "organic", exclusivityDays: null, rush: false, minReelInr: 8000 });
  assert.equal(q.anchorInr, 8000);
  assert.equal(q.floorApplied, true);
});

test("pricing: usage, exclusivity and rush compound as documented", () => {
  const base = { avgViews: 10000, nicheRate: 1, reels: 1, stories: 0, posts: 0, minReelInr: 0 } as const;
  const plain = priceDeal({ ...base, usage: "organic", exclusivityDays: null, rush: false });
  const heavy = priceDeal({ ...base, usage: "perpetual", exclusivityDays: 60, rush: true });
  assert.ok(Math.abs(heavy.midInr / plain.midInr - (1 + 1 + 0.5 + 0.2)) < 1e-9);
});

test("extract: sample inquiry terms", () => {
  const e = extractInquiry(SAMPLE_INQUIRY);
  assert.equal(e.brand, "Tessera");
  assert.equal(e.contactName, "Meera Rao");
  assert.deepEqual([e.reels, e.stories, e.posts], [1, 2, 0]);
  assert.equal(e.budgetInr, 12000);
  assert.equal(e.usage, "paid-30");
  assert.equal(e.goLive, "18 Oct");
});

test("extract: a duration never bleeds in from the previous line", () => {
  const e = extractInquiry(SAMPLE_INQUIRY);
  assert.equal(e.exclusivityDays, 180);
  assert.equal(e.usageDays, 30);
});

test("extract: money formats and per-unit budgets", () => {
  assert.equal(extractInquiry("Budget is Rs. 1.5 lakh for the campaign").budgetInr, 150000);
  assert.equal(extractInquiry("We can pay ₹12k for a Reel").budgetInr, 12000);
  const per = extractInquiry("We offer INR 8,000 per reel for 2 reels");
  assert.equal(per.budgetInr, 8000);
  assert.equal(per.budgetPerUnit, true);
});

test("extract: highlight spans never overlap and stay inside the text", () => {
  const e = extractInquiry(SAMPLE_INQUIRY);
  for (let i = 0; i < e.spans.length; i++) {
    const s = e.spans[i]!;
    assert.ok(s.start >= 0 && s.end <= SAMPLE_INQUIRY.length && s.end > s.start);
    if (i) assert.ok(s.start >= e.spans[i - 1]!.end);
  }
  assert.ok(e.spans.some((s) => s.kind === "budget") && e.spans.some((s) => s.kind === "exclusivity"));
});

test("scam message: flagged, avoided, no reply drafted", () => {
  const q = makeInquiry(SAMPLE_SCAM, dna);
  const ids = q.extraction.signals.map((s) => s.id);
  assert.ok(ids.includes("pay-to-join") && ids.includes("sensitive"));
  assert.equal(q.evaluation.health, "avoid");
  assert.equal(q.evaluation.recommendation, "decline");
  assert.equal(q.draft, null);
});

test("gifting-only is blocked by deal rules and gets a paid counter lever", () => {
  const raw = "Hi Arjun, we're Brewline Coffee. We'd send you free product in exchange for 1 Reel and 2 Stories. No budget, but great exposure!";
  const q = makeInquiry(raw, dna);
  assert.equal(q.extraction.budgetKind, "barter");
  assert.ok(q.evaluation.levers.some((l) => l.label === "Gifting"));
  assert.ok(q.evaluation.reasoning[0]!.includes("do not allow gifting"));
});

test("counter terms respect deal rules and the draft quotes those terms", () => {
  const q = makeInquiry(SAMPLE_INQUIRY, dna);
  assert.equal(q.evaluation.counter.exclusivityDays, dna.rules.maxExclusivityDays);
  assert.ok(q.evaluation.asked.midInr > q.evaluation.quote.midInr);
  assert.equal(q.evaluation.recommendation, "counter");
  assert.ok(q.draft!.body.includes(`Exclusivity: ${dna.rules.maxExclusivityDays} days`));
});

test("a fair, rule-compliant offer is accepted", () => {
  const raw = "Hi Arjun, I'm Kabir from Slate, a productivity app. Budget is ₹30,000 for 1 Reel. Organic use only, no exclusivity. Go live by 25 Oct. We pay within 15 days of posting, with 2 revisions. Brief attached.";
  const q = makeInquiry(raw, dna);
  assert.equal(q.evaluation.recommendation, "accept");
  assert.ok(["strong", "workable"].includes(q.evaluation.health));
});

test("missing budget leads to a clarifying question, not a quote", () => {
  const q = makeInquiry("Hi Arjun, we're Zenly, an AI tool. We'd love 1 Reel with you.", dna);
  assert.equal(q.evaluation.recommendation, "clarify");
  assert.ok(q.draft!.body.includes("Budget"));
});

test("trend extraction reads mechanism from a pasted description", () => {
  const { pattern, confidence } = extractPattern("I replaced my morning routine with AI for 7 days. Facecam plus screen recording, about 18 to 25 seconds, fast cuts. Comment GUIDE for the template.", { niche: "ai-tech" });
  assert.equal(pattern.mechanism.hook, "transformation");
  assert.ok(pattern.mechanism.formats.includes("facecam") && pattern.mechanism.formats.includes("screen-record"));
  assert.deepEqual(pattern.mechanism.durationSec, [18, 25]);
  assert.equal(pattern.mechanism.cta, "comment");
  assert.equal(pattern.mechanism.pacing, "fast");
  assert.notEqual(confidence, "low");
});

test("creator-fit: bounded, explainable, and rewards history", () => {
  const ranked = rankPatterns(LIBRARY, dna, insights, memory);
  for (const { fit } of ranked) {
    assert.ok(fit.score >= 0 && fit.score <= 99);
    assert.equal(fit.parts.reduce((a, p) => a + p.weight, 0), 100);
  }
  const reveal = scoreFit(LIBRARY.find((p) => p.id === "tp-result-reveal")!, dna, insights, memory).score;
  const pov = scoreFit(LIBRARY.find((p) => p.id === "tp-intern")!, dna, insights, memory).score;
  assert.ok(reveal > pov + 15);
});

test("studio: memory decides the leading hook and the script fits the length", () => {
  const pattern = LIBRARY.find((p) => p.id === "tp-replaced-7d")!;
  const pkg = buildPackage({ topic: "competitor research", proof: "saved 6 hours and found 3 gaps", lengthSec: 30, language: "English", pattern, dna, insights, memory });
  assert.equal(pkg.hooks.length, 3);
  assert.equal(pkg.hooks[0]!.style, "Result first");
  assert.ok(pkg.hooks[0]!.recommended);
  assert.ok(pkg.hooks[0]!.text.startsWith("Saved 6 hours"));
  assert.ok(pkg.titles.length >= 2 && pkg.altOpenings.length === 2);
  assert.equal(pkg.script.at(-1)!.at.split("-")[1], "30s");
  assert.ok(spokenSeconds(pkg.script) <= 30);
});

test("studio: scripts fit every length for every hook type, in both languages, with no em dashes", () => {
  for (const hook of Object.keys(HOOK_TYPES) as HookType[]) {
    const pattern = { ...LIBRARY[0]!, mechanism: { ...LIBRARY[0]!.mechanism, hook } };
    for (const language of ["English", "Hinglish"] as const) {
      for (const lengthSec of [30, 45, 60] as const) {
        const pkg = buildPackage({ topic: "weekly planning", proof: "", lengthSec, language, pattern, dna, insights, memory: [] });
        assert.ok(spokenSeconds(pkg.script) <= lengthSec, `${hook} ${language} ${lengthSec}s runs ${spokenSeconds(pkg.script)}s`);
        const all = JSON.stringify(pkg);
        assert.ok(!all.includes("\u2014") && !all.includes("\u2013"), `${hook} contains a dash character`);
      }
    }
  }
});

test("studio: Hinglish package reads as Hinglish and keeps unknown results as slots", () => {
  const pkg = buildPackage({ topic: "inbox triage", proof: "", lengthSec: 45, language: "Hinglish", pattern: LIBRARY[0]!, dna, insights, memory: [] });
  assert.match(pkg.hooks.map((h) => h.text).join(" "), /din|kijiye|dekhiye/);
  assert.ok(pkg.hooks.some((h) => /\[aapka result\]/.test(h.text)));
});

test("studio: a comment CTA carries a keyword derived from the topic", () => {
  const pkg = buildPackage({ topic: "competitor research", proof: "", lengthSec: 30, language: "English", pattern: LIBRARY[0]!, dna, insights, memory: [] });
  assert.equal(pkg.keyword, "COMPETITOR");
  assert.ok(pkg.cta.includes("COMPETITOR"));
});

test("HQ brief: ranked, explained and consistent with the workspace", () => {
  const ws = sampleWorkspace();
  const brief = buildBrief(ws, deriveDna(ws.dna));
  assert.ok(brief.recommended);
  assert.deepEqual(brief.actions.map((a) => a.score), [...brief.actions.map((a) => a.score)].sort((a, b) => b - a));
  assert.ok(brief.actions.every((a) => a.why.length > 10));
  assert.equal(brief.found.inquiries, 1);
  assert.ok(brief.actions.some((a) => a.kind === "review-deal"));
});

test("creator DNA insights derive from posts", () => {
  assert.equal(insights.baseline, dna.avgViews);
  assert.equal(insights.hooksRanked[0]!.key, "proof-first");
  assert.ok(insights.winners.every((p) => p.views / insights.baseline >= 1.5));
});
