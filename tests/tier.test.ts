import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createProbe,
  detectTier,
  dprFor,
  isSoftwareRenderer,
  parseForcedTier,
  pickVariant,
  stepDown,
  type TierEnv,
} from "../src/components/layer/tier.ts";

const good: TierEnv = {
  webgl2: true,
  reducedMotion: false,
  saveData: false,
  cores: 8,
  deviceMemory: 8,
  coarsePointer: false,
  narrow: false,
  software: false,
  forced: null,
};
const env = (over: Partial<TierEnv>): TierEnv => ({ ...good, ...over });

test("tier: a capable desktop gets t3", () => {
  assert.equal(detectTier(good), "t3");
});

test("tier: anything that rules out a live scene gives t1", () => {
  for (const over of [
    { reducedMotion: true },
    { saveData: true },
    { webgl2: false },
    { software: true },
    { coarsePointer: true },
    { narrow: true },
  ]) {
    assert.equal(detectTier(env(over)), "t1", JSON.stringify(over));
  }
});

test("tier: few cores or little memory gives t2, unreported values do not", () => {
  assert.equal(detectTier(env({ cores: 2 })), "t2");
  assert.equal(detectTier(env({ cores: 3 })), "t2");
  assert.equal(detectTier(env({ cores: 4 })), "t3");
  assert.equal(detectTier(env({ deviceMemory: 2 })), "t2");
  assert.equal(detectTier(env({ deviceMemory: 4 })), "t3");
  assert.equal(detectTier(env({ cores: null, deviceMemory: null })), "t3");
});

test("tier: t1 conditions beat weak hardware", () => {
  assert.equal(detectTier(env({ cores: 2, narrow: true })), "t1");
});

test("tier: a forced tier wins over everything", () => {
  assert.equal(detectTier(env({ forced: "t3", reducedMotion: true, webgl2: false, software: true })), "t3");
  assert.equal(detectTier(env({ forced: "t1" })), "t1");
  assert.equal(detectTier(env({ forced: "t2", cores: 16 })), "t2");
});

test("tier: ?tier= parsing accepts only the three tiers", () => {
  assert.equal(parseForcedTier("?tier=t2"), "t2");
  assert.equal(parseForcedTier("?debug&tier=t3"), "t3");
  assert.equal(parseForcedTier("?tier=t4"), null);
  assert.equal(parseForcedTier("?tier="), null);
  assert.equal(parseForcedTier(""), null);
});

test("tier: software renderers are recognised", () => {
  assert.equal(isSoftwareRenderer("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)"), true);
  assert.equal(isSoftwareRenderer("llvmpipe (LLVM 15.0.7, 256 bits)"), true);
  assert.equal(isSoftwareRenderer("Microsoft Basic Render Driver Software"), true);
  assert.equal(isSoftwareRenderer("ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)"), false);
  assert.equal(isSoftwareRenderer("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)"), false);
});

test("tier: variant and pixel ratio", () => {
  assert.equal(pickVariant(900, 600), "wide");
  assert.equal(pickVariant(899, 600), "tall");
  assert.equal(pickVariant(1024, 1366), "tall");
  assert.equal(dprFor("t3", 3), 1.5);
  assert.equal(dprFor("t3", 1), 1);
  assert.equal(dprFor("t2", 2), 1);
  assert.equal(dprFor("t3", 0), 1);
});

test("tier: steps down once at a time and stops at t1", () => {
  assert.equal(stepDown("t3"), "t2");
  assert.equal(stepDown("t2"), "t1");
  assert.equal(stepDown("t1"), null);
});

/** Feeds `count` frames of `ms` each starting at `from`, returns the time of the first step-down or null. */
function feed(probe: ReturnType<typeof createProbe>, count: number, ms: number, from = 0): number | null {
  let now = from;
  for (let i = 0; i < count; i++) {
    now += ms;
    if (probe.push(ms, now)) return now;
  }
  return null;
}

test("probe: smooth frames never step down", () => {
  assert.equal(feed(createProbe(), 2000, 16.7), null);
});

test("probe: a slow warm-up is ignored", () => {
  const p = createProbe();
  for (let i = 0; i < 12; i++) assert.equal(p.push(400, i * 400), false);
  assert.equal(feed(p, 600, 16.7, 4800), null);
});

test("probe: a median above 22 ms for 2 s steps down, not sooner", () => {
  const p = createProbe();
  const at = feed(p, 600, 40);
  assert.notEqual(at, null);
  assert.ok(at! >= 12 * 40 + 30 * 40 + 2000 - 40, `stepped down too early at ${at}`);
  assert.ok(at! < 12 * 40 + 30 * 40 + 2000 + 200, `stepped down too late at ${at}`);
});

test("probe: a short hitch does not step down", () => {
  const p = createProbe();
  assert.equal(feed(p, 100, 16.7), null);
  assert.equal(feed(p, 12, 120, 1700), null); // a few long frames, median stays low
  assert.equal(feed(p, 400, 16.7, 3200), null);
});

test("probe: recovering before the hold time resets the clock", () => {
  const p = createProbe({ skip: 0, window: 20, minFrames: 20, holdMs: 1000 });
  assert.equal(feed(p, 30, 30), null); // about 0.9 s over the limit
  assert.equal(feed(p, 30, 10, 900), null); // back under
  assert.equal(feed(p, 30, 30, 1200), null); // over again, but the clock restarted
});

test("probe: reset ignores frames again and forgets history", () => {
  const p = createProbe();
  assert.notEqual(feed(p, 600, 40), null);
  p.reset();
  for (let i = 0; i < 12; i++) assert.equal(p.push(500, i), false);
  assert.equal(feed(p, 600, 16.7, 100), null);
});
