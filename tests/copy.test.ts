import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// The locked copy, checked from the source so `npm test` guards it with no server running.
// scripts/check-copy.mjs checks the same strings in the rendered page (it needs the dev server on :3600).
const HEADLINE = "The Intelligence Layer for Creators.";
const TAGLINE = "Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.";

const hero = readFileSync(new URL("../src/components/layer/hero.tsx", import.meta.url), "utf8");
// Collapse JSX whitespace and strip the one accent wrapper, so the text reads as the page renders it.
const text = hero.replace(/<\/?Accent>/g, "").replace(/\s+/g, " ");

test("the hero carries the locked headline, verbatim", () => {
  assert.ok(text.includes(HEADLINE), "hero.tsx no longer contains the locked headline");
});

test("the hero carries the locked tagline, verbatim", () => {
  assert.ok(text.includes(TAGLINE), "hero.tsx no longer contains the locked tagline");
});

test("the headline accent wraps only the last word", () => {
  assert.ok(hero.includes("The Intelligence Layer for <Accent>Creators.</Accent>"));
});

test("there is exactly one h1 on the page source", () => {
  const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.equal((hero.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.equal((page.match(/<h1[\s>]/g) ?? []).length, 0);
});
