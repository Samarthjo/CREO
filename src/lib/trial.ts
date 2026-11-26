// The 14-day free trial. A visitor signs up with a name, an email and a creator handle, and gets a cookie that opens the workspace
// until their trial ends. The end date lives in the database (trial_signups.access_until), so clearing cookies never restarts the clock.
// Shared by the sign-up form (client) and the API route and proxy (server). Only the cookie helpers need Node's crypto.
import { createHmac, timingSafeEqual } from "node:crypto";

export const TRIAL_COOKIE = "creo_trial";
export const TRIAL_DAYS = 14;
/** The most a cookie is ever trusted for, so a bad date in the database cannot grant access for years. */
export const MAX_TRIAL_DAYS = 35;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const KEEP_PRICE = "₹499 a month";

export interface TrialSignup {
  name: string;
  email: string;
  handle: string;
  agreed: true;
}
export type TrialErrors = Partial<Record<keyof TrialSignup, string>>;

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().replace(/[ \t]+/g, " ").slice(0, max) : "");

export function validateTrialSignup(input: unknown): { ok: true; value: TrialSignup } | { ok: false; errors: TrialErrors } {
  const b = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: TrialErrors = {};
  const name = clean(b.name, 80);
  const email = clean(b.email, 120).toLowerCase();
  let handle = clean(b.handle, 60)
    .replace(/^https?:\/\/(www\.)?(instagram\.com|youtube\.com|x\.com|twitter\.com|linkedin\.com\/in)\//i, "")
    .replace(/\/$/, "")
    .replace(/^@/, "");
  if (name.length < 2) errors.name = "Add your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Add the email you want the trial on.";
  if (!/^[A-Za-z0-9._-]{1,30}$/.test(handle)) errors.handle = "Add your creator handle, like @yourhandle.";
  if (b.agreed !== true) errors.agreed = "Please tick the box so we can start your trial.";
  if (Object.keys(errors).length) return { ok: false, errors };
  handle = `@${handle}`;
  return { ok: true, value: { name, email, handle, agreed: true } };
}

/** The signup as the arguments of the database function start_trial (see supabase/migrations). */
export const toTrialArgs = (t: TrialSignup) => ({ p_name: t.name, p_email: t.email, p_handle: t.handle });

// ---------------------------------------------------------------------------------------------
// The cookie: "v1.<end of trial in ms>.<signature>". The signature needs TRIAL_SECRET, which only the server has,
// so nobody can lengthen their own trial. While the secret is unset, trials are off and no cookie is ever valid.
// ---------------------------------------------------------------------------------------------
const secret = (): string | null => {
  const s = process.env.TRIAL_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
};
export const trialsConfigured = (): boolean => secret() !== null;

const sign = (until: number, key: string): string => createHmac("sha256", key).update(`creo-trial-v1.${until}`).digest("hex");
const same = (a: string, b: string): boolean => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** The cookie value for a trial that ends at `untilMs`, or null if trials are not set up. */
export function signTrial(untilMs: number): string | null {
  const key = secret();
  return key && Number.isFinite(untilMs) ? `v1.${Math.floor(untilMs)}.${sign(Math.floor(untilMs), key)}` : null;
}

export type TrialState = { state: "none" } | { state: "active"; until: number; daysLeft: number } | { state: "expired"; until: number };

/** What a cookie says: no trial, a running one, or one that has ended. A forged or damaged cookie says none. */
export function trialState(value: string | undefined, now: number = Date.now()): TrialState {
  const key = secret();
  const m = typeof value === "string" ? /^v1\.(\d{10,14})\.([0-9a-f]{64})$/.exec(value) : null;
  if (!key || !m) return { state: "none" };
  const until = Number(m[1]);
  if (!same(m[2], sign(until, key))) return { state: "none" };
  return until > now ? { state: "active", until, daysLeft: daysLeft(until, now) } : { state: "expired", until };
}

/** Whole days left, counting a part day as a day, never below 1 while the trial is running. */
export const daysLeft = (untilMs: number, now: number = Date.now()): number => Math.max(1, Math.ceil((untilMs - now) / DAY_MS));

/** The end of the trial the database reports, kept inside what a cookie is trusted for. NaN when the date is not a date. */
export function trustedUntil(accessUntil: unknown, now: number = Date.now()): number {
  const t = typeof accessUntil === "string" ? Date.parse(accessUntil) : NaN;
  return Number.isFinite(t) ? Math.min(t, now + MAX_TRIAL_DAYS * DAY_MS) : NaN;
}
