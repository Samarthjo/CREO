import assert from "node:assert/strict";
import { test } from "node:test";
import { toContactRow, validateContact } from "../src/lib/contact.ts";

test("contact: a complete message is accepted and tidied", () => {
  const r = validateContact({ name: "  Meher   Shah ", contact: "meher@example.com", message: "  Can we talk   about   the cohort? " });
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(toContactRow(r.value), { name: "Meher Shah", contact: "meher@example.com", message: "Can we talk about the cohort?" });
  }
});

test("contact: a phone number works as the way to reply", () => {
  assert.ok(validateContact({ name: "Asha", contact: "+91 98765 43210", message: "Press enquiry about CREO." }).ok);
});

test("contact: every problem is reported", () => {
  const r = validateContact({ name: "A", contact: "nope", message: "short" });
  assert.ok(!r.ok);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["contact", "message", "name"]);
});

test("contact: junk input does not throw", () => {
  assert.ok(!validateContact(null).ok);
  assert.ok(!validateContact({ name: 5, contact: [], message: {} }).ok);
});
