import assert from "node:assert/strict";
import { test } from "node:test";
import { applyProps, ctaProps, eventForAction, fieldList, inquiryProps, NEEDS_CONSENT, unlockFailure } from "../src/lib/analytics-events.ts";
import type { Action } from "../src/lib/store/actions.ts";
import { makeInquiry, sampleDna, sampleWorkspace, SAMPLE_INQUIRY } from "../src/lib/store/seed.ts";

// Words that stand in for what a person types. None of them may ever show up in an analytics event.
const SECRET = "ZZ-SECRET-7731";

const ws = sampleWorkspace();
const dna = sampleDna();

test("analytics: an application is described by its choices and counts, never its words", () => {
  const p = applyProps("full", { followers: "2K to 10K", niche: "food", platform: "Instagram", postsPerWeek: "3 to 4", goal: "Brand deals", brandInquiries: "Sometimes", problem: `help with ${SECRET}` });
  assert.equal(p.followers, "2K to 10K");
  assert.equal(p.extra_answers, 6);
  assert.equal(p.has_problem, true);
  assert.ok(!JSON.stringify(p).includes(SECRET));
  assert.deepEqual(Object.keys(p).sort(), ["brand_inquiries", "extra_answers", "followers", "goal", "has_problem", "niche", "platform", "posts_per_week", "variant"]);
});

test("analytics: the short form with nothing optional filled in counts as zero extra answers", () => {
  const p = applyProps("short", { followers: "Under 2K", problem: "   " });
  assert.equal(p.extra_answers, 0);
  assert.equal(p.has_problem, false);
  assert.equal(p.niche, undefined);
});

test("analytics: failed fields are named, never quoted", () => {
  assert.equal(fieldList({ name: `bad ${SECRET}`, contact: "x", agreed: "y" }), "agreed,contact,name");
  assert.equal(fieldList({}), "");
});

test("analytics: an access failure is told by the server's status, and the code never travels", () => {
  assert.equal(unlockFailure(401), "wrong_code");
  assert.equal(unlockFailure(429), "blocked");
  assert.equal(unlockFailure(500), "error");
});

test("analytics: a marked link becomes a click event, an unmarked one does not", () => {
  const el = (attrs: Record<string, string>) => ({ getAttribute: (k: string) => attrs[k] ?? null });
  assert.deepEqual(ctaProps(el({ "data-track": "join_cohort", "data-track-where": "hero" })), { id: "join_cohort", where: "hero" });
  assert.deepEqual(ctaProps(el({ "data-track": "open_workspace" })), { id: "open_workspace", where: "page" });
  assert.equal(ctaProps(el({})), null);
  assert.equal(ctaProps(el({ "data-track": "x".repeat(200) }))?.id.length, 60);
});

test("analytics: clicks, scrolling and recordings are the events that need a yes; visits and errors are not", () => {
  for (const e of ["$autocapture", "$rageclick", "$dead_click", "$$heatmap", "$heatmap_data", "$snapshot"]) assert.ok(NEEDS_CONSENT.has(e), e);
  for (const e of ["$pageview", "$pageleave", "$exception", "$web_vitals", "cohort_apply_submitted"]) assert.ok(!NEEDS_CONSENT.has(e), e);
});

// Every workspace action, carrying the secret in every free-text field it has.
const pkg = { ...ws.packages[0], topic: SECRET, proof: SECRET, caption: SECRET };
const inquiry = makeInquiry(`${SAMPLE_INQUIRY}\n${SECRET}`, dna, "paste", "q1");
const approval = { id: "a1", kind: "collab" as const, refId: "q1", title: SECRET, detail: SECRET, risk: "Commercial" as const, requestedAt: "now", status: "pending" as const };
const memory = { id: "m1", kind: "preference" as const, text: SECRET, source: "manual" as const, at: "now", rule: { type: "note" as const, value: SECRET }, detail: { ai: SECRET, human: SECRET, reason: SECRET } };
const ACTIONS: Action[] = [
  { type: "load", ws },
  { type: "dna", patch: { name: SECRET, handle: SECRET, city: SECRET, niche: "food" } },
  { type: "post-add", post: ws.dna.posts[0] },
  { type: "post-remove", id: "p" },
  { type: "deal-add", deal: ws.dna.deals[0] },
  { type: "deal-remove", id: "d" },
  { type: "pattern-add", pattern: { ...ws.patterns[0], title: SECRET } },
  { type: "pattern-remove", id: "t" },
  { type: "pkg-add", pkg },
  { type: "pkg-patch", id: pkg.id, patch: { topic: SECRET } },
  { type: "pkg-edit", id: pkg.id, field: "hook", ai: SECRET, human: SECRET, reason: SECRET, apply: {} },
  { type: "pkg-remove", id: pkg.id },
  { type: "inq-add", inquiry },
  { type: "inq-patch", id: "q1", patch: { raw: SECRET } },
  { type: "inq-remove", id: "q1" },
  { type: "approval-request", approval },
  { type: "approval-decide", id: "a1", decision: "approved", reason: SECRET },
  { type: "memory-add", item: memory },
  { type: "memory-remove", id: "m1" },
];

test("analytics: no workspace action leaks what the creator typed", () => {
  for (const a of ACTIONS) {
    const e = eventForAction(a, [approval]);
    assert.ok(!JSON.stringify(e).includes(SECRET), `${a.type} leaked`);
    if (a.type !== "load") assert.ok(e, `${a.type} should be an event`);
  }
});

test("analytics: workspace actions are told as the right events, with only categories and counts", () => {
  const ev = (a: Action) => eventForAction(a, [approval]);
  assert.equal(ev({ type: "load", ws }), null);
  assert.deepEqual(ev({ type: "dna", patch: { niche: "food", name: "x" } }), ["profile_updated", { fields: "name,niche" }]);
  assert.deepEqual(ev({ type: "post-add", post: ws.dna.posts[0] }), ["library_item_changed", { item: "past_post", change: "added" }]);
  assert.deepEqual(ev({ type: "pattern-remove", id: "t" }), ["library_item_changed", { item: "trend_pattern", change: "removed" }]);
  assert.deepEqual(ev({ type: "pkg-add", pkg }), ["package_generated", { engine: "local", length_sec: pkg.lengthSec, language: pkg.language, hooks: pkg.hooks.length, from_trend: true }]);
  assert.deepEqual(ev({ type: "pkg-edit", id: "p", field: "hook", ai: "a", human: "b", reason: "because", apply: {} }), ["hook_edit_saved", { field: "hook", has_reason: true }]);
  assert.deepEqual(ev({ type: "pkg-edit", id: "p", field: "hook", ai: "a", human: "b", reason: "  ", apply: {} }), ["hook_edit_saved", { field: "hook", has_reason: false }]);
  assert.deepEqual(ev({ type: "approval-request", approval }), ["approval_requested", { kind: "collab", risk: "Commercial" }]);
  assert.deepEqual(ev({ type: "approval-decide", id: "a1", decision: "rejected" }), ["approval_decided", { kind: "collab", decision: "rejected", has_reason: false }]);
  assert.deepEqual(ev({ type: "approval-decide", id: "gone", decision: "approved", reason: "ok" }), ["approval_decided", { kind: "unknown", decision: "approved", has_reason: true }]);
  assert.deepEqual(ev({ type: "memory-add", item: memory }), ["memory_added", { kind: "preference", source: "manual", rule: "note" }]);
});

test("analytics: a brand message is told by its source, length and verdict, never its words", () => {
  const p = inquiryProps(inquiry);
  assert.equal(p.source, "paste");
  assert.equal(p.chars, inquiry.raw.length);
  assert.ok(["strong", "workable", "risky", "avoid"].includes(p.health));
  assert.ok(["accept", "counter", "clarify", "decline"].includes(p.recommendation));
  assert.ok(!JSON.stringify(p).includes(SECRET));
});
