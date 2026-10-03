// The workspace is invite-only for now: a visitor types the access code, and gets a cookie that proves they did.
// The code lives in the WORKSPACE_ACCESS_CODE environment variable (server only). While it is empty, nobody gets in.
// Nothing is saved: the cookie has no expiry (a session cookie), so the browser drops it when it closes.
import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "creo_access";

const accessCode = (): string | null => process.env.WORKSPACE_ACCESS_CODE?.trim() || null;
export const accessConfigured = (): boolean => accessCode() !== null;

const same = (a: string, b: string): boolean => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
// Hashing both sides first means a wrong guess takes the same time whatever its length.
const digest = (s: string): string => createHmac("sha256", "creo-access-compare").update(s).digest("hex");

/** Is what the visitor typed the access code? */
export function codeIsRight(input: unknown): boolean {
  const code = accessCode();
  return code !== null && typeof input === "string" && same(digest(input.trim()), digest(code));
}

/** The cookie's value: a signature made with the code itself. It cannot be made without the code and never contains it. */
export function accessToken(): string | null {
  const code = accessCode();
  return code ? createHmac("sha256", code).update("creo-workspace-access-v1").digest("hex") : null;
}

/** Does this cookie value prove its holder entered the code? */
export function tokenIsRight(value: string | undefined): boolean {
  const token = accessToken();
  return token !== null && typeof value === "string" && same(value, token);
}

/** Where to go after the code is accepted: only ever somewhere inside the workspace. */
export function safeNext(next: unknown): string {
  return typeof next === "string" && /^\/app(\/[A-Za-z0-9._~/-]*)?$/.test(next) && !next.includes("//") ? next : "/app";
}
