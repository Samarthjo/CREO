import assert from "node:assert/strict";
import { test } from "node:test";
import { toApplicationRow, validateApplication } from "../src/lib/apply.ts";

const ok = {
  name: "Meher Shah",
  handle: "@meher.cooks",
  contact: "meher@example.com",
  followers: "2K to 10K",
  niche: "food",
  platform: "Instagram",
  postsPerWeek: "3 to 4",
  goal: "Brand deals",
  brandInquiries: "Sometimes",
  problem: "",
  agreed: true,
};

test("apply: a complete application is accepted and normalised", () => {
  const r = validateApplication({ ...ok, handle: "https://www.instagram.com/meher.cooks/", problem: "  help   with brand deals " });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.handle, "@meher.cooks");
    assert.equal(r.value.problem, "help with brand deals");
    assert.equal(r.value.goal, "Brand deals");
    assert.equal(r.value.platform, "Instagram");
  }
});

test("apply: handles from other platforms work too", () => {
  const r = validateApplication({ ...ok, platform: "YouTube", handle: "https://youtube.com/@meher-cooks" });
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.value.handle, "@meher-cooks");
});

test("apply: phone numbers and emails both work as contact", () => {
  assert.ok(validateApplication({ ...ok, contact: "+91 98765 43210" }).ok);
  assert.ok(validateApplication({ ...ok, contact: "98765-43210" }).ok);
  assert.equal(validateApplication({ ...ok, contact: "call me" }).ok, false);
});

test("apply: every required field is enforced with a plain message", () => {
  const r = validateApplication({});
  assert.equal(r.ok, false);
  if (!r.ok) for (const k of ["name", "handle", "contact", "followers", "agreed"] as const) assert.ok(r.errors[k], `${k} should have an error`);
});

test("apply: the extra questions are optional, but an answer that is given must be a real option", () => {
  const { niche: _n, platform: _p, postsPerWeek: _w, goal: _g, brandInquiries: _b, ...short } = ok;
  const r = validateApplication(short);
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.value.goal, undefined);
  assert.ok(validateApplication({ ...short, niche: "", goal: "", platform: "" }).ok);
  assert.equal(validateApplication({ ...short, niche: "crypto" }).ok, false);
  assert.equal(validateApplication({ ...short, goal: "Fame" }).ok, false);
  assert.equal(validateApplication({ ...short, platform: "MySpace" }).ok, false);
  assert.equal(validateApplication({ ...short, postsPerWeek: "daily" }).ok, false);
  assert.equal(validateApplication({ ...short, brandInquiries: "maybe" }).ok, false);
});

test("apply: unknown enum values and a missing consent are rejected", () => {
  assert.equal(validateApplication({ ...ok, followers: "1 million" }).ok, false);
  assert.equal(validateApplication({ ...ok, agreed: "yes" }).ok, false);
});

test("apply: oversized input is clipped, not stored whole", () => {
  const r = validateApplication({ ...ok, name: "x".repeat(500), problem: "y".repeat(5000) });
  assert.ok(r.ok);
  if (r.ok) assert.ok(r.value.name.length <= 80 && r.value.problem.length <= 400);
});

test("apply: an accepted application maps to a cohort_applications row", () => {
  const r = validateApplication({ ...ok, niche: "ai-tech", problem: "Brand deals feel random" });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(toApplicationRow(r.value), {
    name: "Meher Shah",
    handle: "@meher.cooks",
    contact: "meher@example.com",
    followers: "2K to 10K",
    niche: "AI and tech",
    platform: "Instagram",
    posts_per_week: "3 to 4",
    goal: "Brand deals",
    brand_inquiries: "Sometimes",
    problem: "Brand deals feel random",
    agreed: true,
  });
  const bare = validateApplication({ name: "Meher Shah", handle: "@meher", contact: "+91 98765 43210", followers: "Over 40K", agreed: true });
  assert.ok(bare.ok);
  if (bare.ok) {
    const row = toApplicationRow(bare.value);
    assert.equal(row.niche, null);
    assert.equal(row.goal, null);
    assert.equal(row.problem, null);
  }
});
