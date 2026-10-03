// A message from the Contact page. Shared by the form (client) and the API route (server).

export interface ContactMessage {
  name: string;
  contact: string;
  message: string;
}
export type ContactErrors = Partial<Record<keyof ContactMessage, string>>;

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().replace(/[ \t]+/g, " ").slice(0, max) : "");

export function validateContact(input: unknown): { ok: true; value: ContactMessage } | { ok: false; errors: ContactErrors } {
  const b = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: ContactErrors = {};
  const name = clean(b.name, 80);
  const contact = clean(b.contact, 120);
  const message = clean(b.message, 1000);
  if (name.length < 2) errors.name = "Add your name.";
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const isPhone = /^\+?[\d\s-]{10,16}$/.test(contact) && contact.replace(/\D/g, "").length >= 10;
  if (!isEmail && !isPhone) errors.contact = "Add a WhatsApp number or an email so we can reply.";
  if (message.length < 10) errors.message = "Write a few words so we know how to help.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, contact, message } };
}

/** The message as a row in the Supabase table `contact_messages` (see supabase/migrations). */
export const toContactRow = (m: ContactMessage) => ({ name: m.name, contact: m.contact, message: m.message });
