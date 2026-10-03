import { supabaseConfigured, supabaseRpc } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Called once a day by the Vercel cron in vercel.json. A free-plan Supabase project is paused after a week without
 * activity, and a paused project would turn applications away, so this runs one trivial query.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ ok: false, error: "Supabase is not configured." }, { status: 503 });
  try {
    return Response.json({ ok: (await supabaseRpc("keep_alive")) === 1 });
  } catch (e) {
    console.error("Keep-alive failed", e);
    return Response.json({ ok: false }, { status: 502 });
  }
}
