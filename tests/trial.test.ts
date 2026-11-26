import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { DAY_MS, MAX_TRIAL_DAYS, TRIAL_DAYS, daysLeft, signTrial, toTrialArgs, trialState, trialsConfigured, trustedUntil, validateTrialSignup } from "../src/lib/trial.ts";

const SECRET = "a-test-secret-that-is-long-enough";
let saved: string | undefined;
beforeEach(() => { saved = process.env.TRIAL_SECRET; process.env.TRIAL_SECRET = SECRET; });
afterEach(() => { if (saved === undefined) delete process.env.TRIAL_SECRET; else process.env.TRIAL_SECRET = saved; });

const good = { name: "  Asha  Rao ", email: " Asha@Example.com ", handle: "https://www.instagram.com/asha.rao/", agreed: true };

test("trial: a sign-up is cleaned: email lower-cased, a profile link cut down to the handle", () => {
  const r = validateTrialSignup(good);
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.value, { name: "Asha Rao", email: "asha@example.com", handle: "@asha.rao", agreed: true });
  if (r.ok) assert.deepEqual(toTrialArgs(r.value), { p_name: "Asha Rao", p_email: "asha@example.com", p_handle: "@asha.rao" });
});

test("trial: every field is checked and the box must be ticked", () => {
  const r = validateTrialSignup({ name: "A", email: "nope", handle: "bad handle!", agreed: false });
  assert.ok(!r.ok);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["agreed", "email", "handle", "name"]);
  assert.ok(!validateTrialSignup({ ...good, agreed: "yes" }).ok);
  assert.ok(!validateTrialSignup(null).ok);
  assert.ok(validateTrialSignup({ ...good, handle: "@a-b_c.d" }).ok);
});

test("trial: a cookie made for a running trial says active, with the days left", () => {
  const now = Date.now();
  const s = trialState(signTrial(now + 9 * DAY_MS - 1000)!, now);
  assert.equal(s.state, "active");
  if (s.state === "active") assert.equal(s.daysLeft, 9);
});

test("trial: a trial that has ended says expired, not none, so the visitor is sent to the keep-CREO page", () => {
  const now = Date.now();
  assert.equal(trialState(signTrial(now - 1000)!, now).state, "expired");
  assert.equal(trialState(signTrial(now + 1000)!, now).state, "active");
});

test("trial: a cookie cannot be lengthened, forged or read without the secret", () => {
  const now = Date.now();
  const token = signTrial(now + 2 * DAY_MS)!;
  const [v, until, sig] = token.split(".");
  assert.equal(trialState(`${v}.${Number(until) + 30 * DAY_MS}.${sig}`, now).state, "none", "changed date");
  assert.equal(trialState(`${v}.${until}.${"0".repeat(64)}`, now).state, "none", "wrong signature");
  assert.equal(trialState("v1.abc.def", now).state, "none");
  assert.equal(trialState(undefined, now).state, "none");
  assert.equal(trialState("", now).state, "none");
  process.env.TRIAL_SECRET = "another-secret-that-is-long-enough";
  assert.equal(trialState(token, now).state, "none", "signed with a different secret");
});

test("trial: with no secret, or a short one, trials are off and nothing is valid", () => {
  const token = signTrial(Date.now() + DAY_MS)!;
  delete process.env.TRIAL_SECRET;
  assert.equal(trialsConfigured(), false);
  assert.equal(signTrial(Date.now() + DAY_MS), null);
  assert.equal(trialState(token).state, "none");
  process.env.TRIAL_SECRET = "short";
  assert.equal(trialsConfigured(), false);
});

test("trial: days left counts a part day as a day and never reads below one while it runs", () => {
  const now = 1_000_000_000_000;
  assert.equal(daysLeft(now + 14 * DAY_MS, now), 14);
  assert.equal(daysLeft(now + 13.2 * DAY_MS, now), 14);
  assert.equal(daysLeft(now + 1000, now), 1);
  assert.equal(TRIAL_DAYS, 14);
});

test("trial: the database's end date is trusted for no more than 35 days, and a bad date is refused", () => {
  const now = Date.now();
  assert.equal(trustedUntil(new Date(now + 3 * DAY_MS).toISOString(), now), now + 3 * DAY_MS);
  assert.equal(trustedUntil("2099-01-01T00:00:00Z", now), now + MAX_TRIAL_DAYS * DAY_MS);
  assert.ok(Number.isNaN(trustedUntil("not a date", now)));
  assert.ok(Number.isNaN(trustedUntil(null, now)));
  assert.ok(trustedUntil("2020-01-01T00:00:00Z", now) < now);
});

test("trial: the lock lands exactly 14 days after sign-up, to the millisecond", () => {
  const start = 1_800_000_000_000; // the moment of sign-up
  const until = start + TRIAL_DAYS * DAY_MS; // what start_trial hands back: now() + 14 days
  const cookie = signTrial(until)!;
  assert.equal(trialState(cookie, start).state, "active", "at sign-up");
  assert.equal(trialState(cookie, start + 13 * DAY_MS + 23 * 3600_000).state, "active", "13 days 23 hours in");
  assert.equal(trialState(cookie, until - 1).state, "active", "one millisecond before the end");
  assert.equal(trialState(cookie, until).state, "expired", "at the end date itself");
  assert.equal(trialState(cookie, until + 1).state, "expired", "one millisecond after");
  assert.equal(trialState(cookie, until + 21 * DAY_MS).state, "expired", "weeks later it still says ended, never none or active");
});

test("trial: the notice counts down one day at a time from 14, and the last day reads 1", () => {
  const start = 1_800_000_000_000;
  const until = start + TRIAL_DAYS * DAY_MS;
  const left = (elapsed: number) => daysLeft(until, start + elapsed);
  assert.equal(left(0), 14);
  assert.equal(left(1), 14);
  for (let d = 1; d < TRIAL_DAYS; d++) {
    assert.equal(left(d * DAY_MS), TRIAL_DAYS - d, `exactly ${d} days in`);
    assert.equal(left(d * DAY_MS - 1), TRIAL_DAYS - d + 1, `a moment before day ${d} is over`);
  }
  assert.equal(left(TRIAL_DAYS * DAY_MS - 1), 1, "the last millisecond");
  const s = trialState(signTrial(until)!, start + 6 * DAY_MS + 1);
  assert.equal(s.state === "active" ? s.daysLeft : -1, 8, "the cookie reports the same count");
});

test("trial: the date text Postgres returns (microseconds, +00:00) becomes the cookie's end date", () => {
  const now = Date.parse("2026-12-01T00:00:00Z");
  assert.equal(trustedUntil("2026-12-10T08:25:44.945248+00:00", now), Date.parse("2026-12-10T08:25:44.945Z"));
  assert.equal(trustedUntil("2026-12-10T08:25:44+00:00", now), Date.parse("2026-12-10T08:25:44Z"));
});
