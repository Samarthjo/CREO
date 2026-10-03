// Server-side Supabase over plain REST. The URL and key live in server env vars and never reach the browser.
// The key is the project's publishable key: Row Level Security lets it insert applications and nothing else.

const base = () => process.env.SUPABASE_URL?.replace(/\/+$/, "");
const key = () => process.env.SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = (): boolean => Boolean(base() && key());

function headers(): Record<string, string> {
  const k = key()!;
  // A publishable key (sb_publishable_...) goes in the apikey header only; a legacy anon key is a JWT and also goes in Authorization.
  return { apikey: k, ...(k.startsWith("sb_") ? {} : { authorization: `Bearer ${k}` }), "content-type": "application/json" };
}

async function call(path: string, body: unknown, prefer?: string): Promise<Response> {
  const res = await fetch(`${base()}/rest/v1/${path}`, {
    method: "POST",
    headers: { ...headers(), ...(prefer ? { prefer } : {}) },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Supabase ${path} responded ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  return res;
}

/** Inserts one row. `return=minimal` means the key never needs read access to the table. */
export async function supabaseInsert(table: string, row: Record<string, unknown>): Promise<void> {
  await call(table, row, "return=minimal");
}

/** Calls a Postgres function exposed through the Data API. */
export async function supabaseRpc(fn: string): Promise<unknown> {
  return (await call(`rpc/${fn}`, {})).json();
}
