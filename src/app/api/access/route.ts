import { NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessConfigured, accessToken, codeIsRight, safeNext } from "@/lib/access";

export const runtime = "nodejs";

// Best-effort limiter (per server instance) so the code cannot be guessed by hammering the form.
const hits = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 8;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
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
  if (limited(ip)) return NextResponse.json({ error: "Too many tries. Wait a few minutes and try again." }, { status: 429 });
  if (!codeIsRight(body.code)) return NextResponse.json({ error: "That code is not right." }, { status: 401 });

  const res = NextResponse.json({ ok: true, next: safeNext(body.next) });
  res.cookies.set(ACCESS_COOKIE, accessToken()!, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ACCESS_MAX_AGE });
  return res;
}

/** Forget the access: removes the cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}
