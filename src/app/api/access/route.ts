import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessConfigured, accessToken, codeIsRight, safeNext } from "@/lib/access";

export const runtime = "nodejs";

// Best-effort limiter (per server instance) so the code cannot be guessed by hammering the form.
// Only wrong guesses count: the workspace asks for the code every time it opens, and opening it must never lock someone out.
const misses = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_MISSES = 8;

/** The wrong guesses this connection made in the last few minutes. */
function recentMisses(ip: string): number[] {
  const now = Date.now();
  const recent = (misses.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length) misses.set(ip, recent);
  else misses.delete(ip);
  return recent;
}

/** Check the access code and, if it is right, hand out the cookie that opens the workspace. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!accessConfigured()) return NextResponse.json({ error: "The workspace is not open yet." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const missed = recentMisses(ip);
  if (missed.length >= MAX_MISSES) return NextResponse.json({ error: "Too many tries. Wait a few minutes and try again." }, { status: 429 });
  if (!codeIsRight(body.code)) {
    misses.set(ip, [...missed, Date.now()]);
    return NextResponse.json({ error: "That code is not right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, next: safeNext(body.next) });
  // No maxAge or expires: a session cookie, so nothing is saved once the browser closes.
  res.cookies.set(ACCESS_COOKIE, accessToken()!, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return res;
}

/** Forget the access: removes the cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}
