import assert from "node:assert/strict";
import { test } from "node:test";
import { LIBRARY } from "../src/lib/engine/trend.ts";
import { HOOK_TYPES, NICHES } from "../src/lib/engine/types.ts";
import { answersQuery, cleanHandle, FORMAT_KEYS, GOAL_KEYS, LINES, lineFor, NICHE_KEYS, parseAnswers, pickIdeas, previewTitle, wrapText } from "../src/lib/preview.ts";

const ALL = NICHE_KEYS.flatMap((niche) => GOAL_KEYS.flatMap((goal) => FORMAT_KEYS.map((format) => ({ niche, goal, format }))));

test("preview: the same answers always give the same three ideas, in the same order", () => {
  const a = { niche: "ai-tech", goal: "grow", format: "screen-record" } as const;
  assert.deepEqual(pickIdeas(a), pickIdeas({ ...a }));
  assert.equal(pickIdeas(a).length, 3);
});

test("preview: every combination of answers gives three ideas with three different hooks", () => {
  for (const a of ALL) {
    const ideas = pickIdeas(a);
    assert.equal(ideas.length, 3, JSON.stringify(a));
    assert.equal(new Set(ideas.map((i) => i.hook)).size, 3, JSON.stringify(a));
    assert.equal(new Set(ideas.map((i) => i.id)).size, 3, JSON.stringify(a));
  }
});

test("preview: an idea only ever comes from a line written for the niche that was asked for", () => {
  for (const a of ALL) for (const i of pickIdeas(a)) assert.equal(i.line, lineFor(a.niche, i.id), JSON.stringify(a));
  for (const n of NICHE_KEYS) assert.ok(Object.keys(LINES[n]).length >= 8 || n === "ai-tech", n);
  assert.equal(Object.keys(LINES["ai-tech"]).length, LIBRARY.length);
});

test("preview: the format the creator likes to film in changes the ideas, and a matching pattern says so", () => {
  const screen = pickIdeas({ niche: "ai-tech", goal: "leads", format: "screen-record" });
  const skit = pickIdeas({ niche: "ai-tech", goal: "leads", format: "skit" });
  assert.notDeepEqual(screen.map((i) => i.id), skit.map((i) => i.id));
  assert.ok(screen.some((i) => i.fitsFormat));
  for (const i of screen) assert.equal(i.fitsFormat, i.shotAs.includes("Screen recording"));
});

test("preview: the goal changes the ideas and the reason they fit", () => {
  const grow = pickIdeas({ niche: "food", goal: "grow", format: "facecam" });
  const deals = pickIdeas({ niche: "food", goal: "brand-deals", format: "facecam" });
  assert.ok(grow[0].why.includes("follower growth"));
  assert.ok(deals[0].why.includes("brand deals"));
  assert.notDeepEqual(grow.map((i) => i.id), deals.map((i) => i.id));
});

test("preview: the copy has no dashes, never invents a result and leaves blanks in brackets", () => {
  const text = (i: ReturnType<typeof pickIdeas>[number]) => [i.line, i.why, i.openWith, i.length, i.endWith, i.shotAs, i.hookLabel].join(" ");
  const all = ALL.flatMap((a) => pickIdeas(a)).map(text).join("\n") + Object.values(LINES).flatMap((l) => Object.values(l)).join("\n");
  assert.ok(!/[–—]/.test(all), "no en or em dashes");
  assert.ok(!/\d+(\.\d+)?\s?(k|m|x|%|views|followers|lakh)/i.test(all), "no made-up results");
  for (const n of NICHE_KEYS) assert.ok(Object.values(LINES[n]).some((l) => /\[[^\]]+\]/.test(l)), n);
  assert.ok(!/number/i.test(pickIdeas({ niche: "beauty", goal: "grow", format: "facecam" }).map((i) => i.openWith).join(" ")));
});

test("preview: every niche and hook type has the words the page needs", () => {
  for (const n of NICHE_KEYS) assert.ok(NICHES[n].label);
  for (const a of ALL) for (const i of pickIdeas(a)) { assert.ok(i.why.length > 20); assert.ok(HOOK_TYPES[i.hook] === i.hookLabel); }
});

test("preview: a handle is letters, digits, dots and underscores, and a pasted profile link is cut down to it", () => {
  assert.equal(cleanHandle("@some.creator_1"), "some.creator_1");
  assert.equal(cleanHandle("https://www.instagram.com/some.creator/"), "some.creator");
  assert.equal(cleanHandle("  x.com/handle "), undefined);
  assert.equal(cleanHandle("bad handle!"), undefined);
  assert.equal(cleanHandle("a".repeat(31)), undefined);
  assert.equal(cleanHandle(42), undefined);
});

test("preview: a shared link carries the three choices, parses back, and never carries a handle", () => {
  const a = { niche: "finance", goal: "authority", format: "voiceover-broll", handle: "someone" } as const;
  const q = answersQuery(a);
  assert.equal(q, "n=finance&g=authority&f=voiceover-broll");
  assert.ok(!q.includes("someone"));
  const parsed = parseAnswers(Object.fromEntries(new URLSearchParams(q)));
  assert.deepEqual(parsed, { niche: "finance", goal: "authority", format: "voiceover-broll" });
  assert.equal(parseAnswers({ n: "finance", g: "authority" }), null);
  assert.equal(parseAnswers({ n: "nope", g: "authority", f: "facecam" }), null);
  assert.equal(parseAnswers({ n: ["food", "x"], g: "grow", f: "skit" })?.niche, "food");
});

test("preview: the page title names the niche", () => {
  assert.equal(previewTitle({ niche: "ai-tech" }), "3 post ideas: AI and tech");
});

test("preview: text wraps to the width it is given", () => {
  const measure = (s: string) => s.length;
  assert.deepEqual(wrapText("one two three four", measure, 9), ["one two", "three", "four"]);
  assert.deepEqual(wrapText("supercalifragilistic is long", measure, 8), ["supercalifragilistic", "is long"]);
  assert.deepEqual(wrapText("", measure, 8), []);
});
