"use client";

import { useState } from "react";
import { markJustUnlocked } from "@/lib/access-marker";
import { Button, Field, Input } from "../ui/kit";

/**
 * The workspace's access-code form. On the code page a right code leads on to the workspace; inside the workspace it just opens it.
 * The code is sent to the server and forgotten: the browser never keeps it, and its password manager is asked not to.
 */
export function AccessForm({ next = "/app", onUnlocked, autoFocus }: { next?: string; onUnlocked?: () => void; autoFocus?: boolean }) {
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
      if (res.ok) {
        if (onUnlocked) { onUnlocked(); return; }
        markJustUnlocked();
        // A full page load, not a client-side navigation: the router may have kept a redirect to this page from before the cookie existed.
        window.location.assign(data.next ?? "/app");
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    }
    setSending(false);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Access code">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          aria-invalid={!!error}
          aria-describedby={error ? "access-error" : undefined}
        />
      </Field>
      {error && <p id="access-error" className="rounded-control bg-risk-wash p-3 text-sm font-medium text-risk" role="alert">{error}</p>}
      <div><Button type="submit" variant="primary" size="lg" disabled={sending}>{sending ? "Checking" : "Open the workspace"}</Button></div>
    </form>
  );
}
