import { NextResponse } from "next/server";
import { supabaseConfigured, supabaseRpc } from "@/lib/supabase";
import { DAY_MS, MAX_TRIAL_DAYS, TRIAL_COOKIE, TRIAL_DAYS, signTrial, toTrialArgs, trialsConfigured, trustedUntil, validateTrialSignup } from "@/lib/trial";

export const runtime = "nodejs";

// Best-effort limiter (per server instance). A hosted deployment should also rate limit at the edge.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30; // generous: many people share one mobile-carrier address

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

/** Start a free trial, or pick an existing one back up, and hand out the cookie that opens the workspace until it ends. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Honeypot: bots fill the hidden field. Pretend it worked and store nothing.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true, next: "/trial/ended" });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many tries from this connection. Try again later." }, { status: 429 });

  const result = validateTrialSignup(body);
  if (!result.ok) return NextResponse.json({ error: "Please fix the highlighted fields.", errors: result.errors }, { status: 422 });
  if (!trialsConfigured()) {
    console.error("TRIAL_SECRET is not set (16 characters or more). Free trials are off.");
    return NextResponse.json({ error: "Free trials are not open on this deployment yet." }, { status: 503 });
  }

  const now = Date.now();
  let until: number;
  let isNew = true;
  try {
    if (supabaseConfigured()) {
      const out = (await supabaseRpc("start_trial", toTrialArgs(result.value))) as { access_until?: unknown; is_new?: unknown } | null;
      until = trustedUntil(out?.access_until, now);
      isNew = out?.is_new === true;
      if (Number.isNaN(until)) throw new Error("start_trial returned no end date");
    } else if (process.env.NODE_ENV !== "production") {
      until = now + TRIAL_DAYS * DAY_MS; // development without a database: every sign-up gets a fresh trial
    } else {
      console.error("SUPABASE_URL with SUPABASE_PUBLISHABLE_KEY is not set. Trial not started.");
      return NextResponse.json({ error: "Free trials are not open on this deployment yet." }, { status: 503 });
    }
  } catch (e) {
    console.error("Trial sink failed", e);
    return NextResponse.json({ error: "We could not start your trial. Please try again in a minute." }, { status: 502 });
  }

  const expired = until <= now;
  const res = NextResponse.json({
    ok: true,
    returning: !isNew,
    expired,
    daysLeft: expired ? 0 : Math.max(1, Math.ceil((until - now) / DAY_MS)),
    next: expired ? "/trial/ended" : "/app",
  });
  // The cookie outlives the trial on purpose: an ended trial still says "ended", so the visitor lands on the keep-CREO page, not the code page.
  res.cookies.set(TRIAL_COOKIE, signTrial(until)!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_TRIAL_DAYS * 24 * 60 * 60,
  });
  return res;
}
