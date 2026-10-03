"use client";

import { useState } from "react";
import { Button, Field, Input } from "../ui/kit";

/** The workspace's access-code form. On success the browser holds a cookie and goes where it was headed. */
export function AccessForm({ next }: { next: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setError("Enter your access code."); return; }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, next }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; next?: string };
      // A full page load, not a client-side navigation: the router may have kept a redirect to this page from before the cookie existed.
      if (res.ok) { window.location.assign(data.next ?? "/app"); return; }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    }
    setSending(false);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Access code">
        <Input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? "access-error" : undefined} />
      </Field>
      {error && <p id="access-error" className="rounded-control bg-risk-wash p-3 text-sm font-medium text-risk" role="alert">{error}</p>}
      <div><Button type="submit" variant="primary" size="lg" disabled={sending}>{sending ? "Checking" : "Open the workspace"}</Button></div>
    </form>
  );
}
