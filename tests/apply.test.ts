import assert from "node:assert/strict";
import { test } from "node:test";
import { validateApplication } from "../src/lib/apply.ts";

const ok = { name: "Meher Shah", handle: "@meher.cooks", followers: "2K to 10K", niche: "food", contact: "meher@example.com", focus: ["Collab Inbox"], note: "", agreed: true };

test("apply: a complete application is accepted and normalised", () => {
  const r = validateApplication({ ...ok, handle: "https://www.instagram.com/meher.cooks/", note: "  help   with brand deals " });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.handle, "@meher.cooks");
    assert.equal(r.value.note, "help with brand deals");
  }
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

test("apply: niche and start-with are optional, but a niche that is given must be a real one", () => {
  const { niche: _n, focus: _f, ...short } = ok;
  const r = validateApplication(short);
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.value.focus, []);
  assert.ok(validateApplication({ ...short, niche: "" }).ok);
  assert.equal(validateApplication({ ...short, niche: "crypto" }).ok, false);
});

test("apply: unknown enum values and a missing consent are rejected", () => {
  assert.equal(validateApplication({ ...ok, niche: "crypto" }).ok, false);
  assert.equal(validateApplication({ ...ok, followers: "1 million" }).ok, false);
  assert.equal(validateApplication({ ...ok, agreed: "yes" }).ok, false);
});

test("apply: oversized input is clipped, not stored whole", () => {
  const r = validateApplication({ ...ok, name: "x".repeat(500), note: "y".repeat(5000) });
  assert.ok(r.ok);
  if (r.ok) assert.ok(r.value.name.length <= 80 && r.value.note.length <= 400);
});
