// Founding Creator Cohort application. Shared by the form (client) and the API route (server).
import { NICHES, type NicheKey } from "./engine/types.ts";

export const FOLLOWER_BANDS = ["Under 2K", "2K to 10K", "10K to 25K", "25K to 40K", "Over 40K"] as const;
export const FOCUS = ["Trend and Studio", "Collab Inbox"] as const;

export interface Application {
  name: string;
  handle: string;
  followers: (typeof FOLLOWER_BANDS)[number];
  niche: NicheKey;
  contact: string;
  focus: (typeof FOCUS)[number][];
  note: string;
  agreed: true;
}
export type ApplicationErrors = Partial<Record<keyof Application, string>>;

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().replace(/[ \t]+/g, " ").slice(0, max) : "");

export function validateApplication(input: unknown): { ok: true; value: Application } | { ok: false; errors: ApplicationErrors } {
  const b = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: ApplicationErrors = {};
  const name = clean(b.name, 80);
  let handle = clean(b.handle, 40).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "");
  const contact = clean(b.contact, 120);
  const note = clean(b.note, 400);
  const followers = FOLLOWER_BANDS.find((x) => x === b.followers);
  const niche = (Object.keys(NICHES) as NicheKey[]).find((x) => x === b.niche);
  const focus = Array.isArray(b.focus) ? FOCUS.filter((f) => (b.focus as unknown[]).includes(f)) : [];

  if (name.length < 2) errors.name = "Add your name.";
  handle = handle.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) errors.handle = "Use your Instagram handle, like @arjunbuilds.";
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const isPhone = /^\+?[\d\s-]{10,16}$/.test(contact) && contact.replace(/\D/g, "").length >= 10;
  if (!isEmail && !isPhone) errors.contact = "Add a WhatsApp number or an email so we can reach you.";
  if (!followers) errors.followers = "Pick your follower range.";
  if (!niche) errors.niche = "Pick your niche.";
  if (!focus.length) errors.focus = "Pick what you want to start with.";
  if (b.agreed !== true) errors.agreed = "Please confirm you are happy to give weekly feedback.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, handle: `@${handle}`, followers: followers!, niche: niche!, contact, focus, note, agreed: true } };
}
