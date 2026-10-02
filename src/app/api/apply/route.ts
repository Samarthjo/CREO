import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { validateApplication } from "@/lib/apply";

export const runtime = "nodejs";

// Best-effort limiter (per server instance). A hosted deployment should also rate limit at the edge.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 6;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Honeypot: bots fill the hidden field. Pretend it worked and store nothing.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many applications from this connection. Try again later." }, { status: 429 });

  const result = validateApplication(body);
  if (!result.ok) return NextResponse.json({ error: "Please fix the highlighted fields.", errors: result.errors }, { status: 422 });

  const record = { ...result.value, receivedAt: new Date().toISOString(), source: "landing" };
  const webhook = process.env.CREO_APPLICATIONS_WEBHOOK;
  try {
    if (webhook) {
      const res = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record) });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    } else if (process.env.NODE_ENV !== "production") {
      const dir = path.join(process.cwd(), ".data");
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "applications.jsonl"), JSON.stringify(record) + "\n", "utf8");
    } else {
      console.error("CREO_APPLICATIONS_WEBHOOK is not set. Application not stored.");
      return NextResponse.json({ error: "Applications are not open on this deployment yet." }, { status: 503 });
    }
  } catch (e) {
    console.error("Application sink failed", e);
    return NextResponse.json({ error: "We could not save your application. Please try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
