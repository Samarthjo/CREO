import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFlowCases } from "../src/components/landing/flow-cases.ts";

// The home page's "how CREO works" slideshow runs three made-up creators through the real engines.
// These tests keep what it shows honest and complete when the engines or the library change.

const cases = buildFlowCases();

test("flow cases: three creators, each with six steps of problem text", () => {
  assert.deepEqual(cases.map((c) => c.id), ["tech", "fitness", "food"]);
  for (const c of cases) {
    assert.equal(c.problems.length, 6, c.id);
    for (const [lead] of c.problems) assert.ok(lead && lead.length > 3, c.id);
  }
});

test("flow cases: the trend scene lists five distinct trends and exactly one pick", () => {
  for (const c of cases) {
    assert.equal(c.trends.length, 5, c.id);
    assert.equal(new Set(c.trends.map((t) => t.title)).size, 5, c.id);
    assert.equal(c.trends.filter((t) => t.top).length, 1, c.id);
    assert.equal(c.trends.find((t) => t.top)!.title, c.fit.title, c.id);
  }
});

test("flow cases: the pick is a strong fit with reasons taken from the engine", () => {
  for (const c of cases) {
    assert.ok(c.fit.score >= 85 && c.fit.score <= 99, `${c.id} fit ${c.fit.score}`);
    assert.equal(c.fit.verdict, "Strong fit. Make this first.", c.id);
    assert.equal(c.fit.why.length, 3, c.id);
  }
  assert.equal(new Set(cases.map((c) => c.fit.score)).size, 3, "three different scores, not one number repeated");
});

test("flow cases: the draft leaves a highlighted slot for the creator's own result", () => {
  for (const c of cases) {
    assert.match(c.hook.slot, /^\[[^\]]+\]$/, c.id);
    assert.ok(c.hook.filled.length > 0 && !c.hook.filled.includes("["), c.id);
    assert.match(c.hook.after.trim(), /[.?]$/, `${c.id} the hook ends as a sentence`);
    assert.equal(c.plan.reduce((a, b) => a + b.sec, 0), c.lengthSec, `${c.id} plan adds up to the length`);
    assert.ok(c.shots > 0 && c.titles > 0, c.id);
  }
  assert.match(cases[2]!.hook.slot, /aapka/, "the food creator writes in Hinglish");
});

test("flow cases: a result moves the hook's lift up, and the example is bigger than usual", () => {
  for (const c of cases) {
    assert.ok(c.result.views > c.result.usual, c.id);
    assert.ok(c.learn.to > c.learn.from, `${c.id} ${c.learn.from} to ${c.learn.to}`);
    assert.ok(c.learn.note.includes(`${c.result.lift.toFixed(1)}x baseline`), c.id);
  }
});

test("flow cases: no em dashes in anything a visitor reads", () => {
  assert.ok(!JSON.stringify(cases).includes("—"));
});
