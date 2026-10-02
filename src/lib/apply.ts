// Founding Creator Cohort application. Shared by the form (client) and the API route (server).
import { NICHES, type NicheKey } from "./engine/types.ts";

export const FOLLOWER_BANDS = ["Under 2K", "2K to 10K", "10K to 25K", "25K to 40K", "Over 40K"] as const;
export const PLATFORMS = ["Instagram", "YouTube", "LinkedIn", "X", "Other"] as const;
export const POSTS_PER_WEEK = ["Less than 1", "1 to 2", "3 to 4", "5 or more"] as const;
export const GOALS = ["Growth", "Brand deals", "Authority", "Community", "Sales"] as const;
export const BRAND_INQUIRIES = ["Yes, regularly", "Sometimes", "Not yet"] as const;

export interface Application {
  name: string;
  handle: string;
  contact: string;
  followers: (typeof FOLLOWER_BANDS)[number];
  niche?: NicheKey;
  platform?: (typeof PLATFORMS)[number];
  postsPerWeek?: (typeof POSTS_PER_WEEK)[number];
  goal?: (typeof GOALS)[number];
  brandInquiries?: (typeof BRAND_INQUIRIES)[number];
  problem: string;
  agreed: true;
}
export type ApplicationErrors = Partial<Record<keyof Application, string>>;

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().replace(/[ \t]+/g, " ").slice(0, max) : "");
const given = (v: unknown) => typeof v === "string" && v.trim() !== "";
/** An optional choice: empty is fine, anything else must be one of the options. */
function pick<T extends string>(v: unknown, options: readonly T[]): { value?: T; bad: boolean } {
  if (!given(v)) return { bad: false };
  const value = options.find((o) => o === v);
  return { value, bad: !value };
}

export function validateApplication(input: unknown): { ok: true; value: Application } | { ok: false; errors: ApplicationErrors } {
  const b = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: ApplicationErrors = {};
  const name = clean(b.name, 80);
  let handle = clean(b.handle, 60)
    .replace(/^https?:\/\/(www\.)?(instagram\.com|youtube\.com|x\.com|twitter\.com|linkedin\.com\/in)\//i, "")
    .replace(/\/$/, "")
    .replace(/^@/, "");
  const contact = clean(b.contact, 120);
  const problem = clean(b.problem, 400);
  const followers = FOLLOWER_BANDS.find((x) => x === b.followers);
  const niche = pick(b.niche, Object.keys(NICHES) as NicheKey[]);
  const platform = pick(b.platform, PLATFORMS);
  const postsPerWeek = pick(b.postsPerWeek, POSTS_PER_WEEK);
  const goal = pick(b.goal, GOALS);
  const brandInquiries = pick(b.brandInquiries, BRAND_INQUIRIES);

  if (name.length < 2) errors.name = "Add your name.";
  if (!/^[A-Za-z0-9._-]{1,30}$/.test(handle)) errors.handle = "Add your creator handle, like @yourhandle.";
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const isPhone = /^\+?[\d\s-]{10,16}$/.test(contact) && contact.replace(/\D/g, "").length >= 10;
  if (!isEmail && !isPhone) errors.contact = "Add a WhatsApp number or an email so we can reach you.";
  if (!followers) errors.followers = "Pick your follower range.";
  if (niche.bad) errors.niche = "Pick your niche from the list.";
  if (platform.bad) errors.platform = "Pick a platform from the list.";
  if (postsPerWeek.bad) errors.postsPerWeek = "Pick how often you post.";
  if (goal.bad) errors.goal = "Pick one main goal.";
  if (brandInquiries.bad) errors.brandInquiries = "Pick one option.";
  if (b.agreed !== true) errors.agreed = "Please confirm you are happy to give weekly feedback.";
  if (Object.keys(errors).length) return { ok: false, errors };
  handle = `@${handle}`;
  return {
    ok: true,
    value: {
      name,
      handle,
      contact,
      followers: followers!,
      ...(niche.value ? { niche: niche.value } : {}),
      ...(platform.value ? { platform: platform.value } : {}),
      ...(postsPerWeek.value ? { postsPerWeek: postsPerWeek.value } : {}),
      ...(goal.value ? { goal: goal.value } : {}),
      ...(brandInquiries.value ? { brandInquiries: brandInquiries.value } : {}),
      problem,
      agreed: true,
    },
  };
}
