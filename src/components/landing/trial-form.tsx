"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { fieldList } from "@/lib/analytics-events";
import { validateTrialSignup, type TrialErrors } from "@/lib/trial";
import { Button, Field, Input } from "../ui/kit";

const EMPTY = { name: "", email: "", handle: "", website: "" };

/** The free-trial sign-up. Three answers and a tick; the workspace opens on this browser straight away. */
export function TrialForm() {
  const [v, setV] = useState(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<TrialErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "opening">("idle");
  const [serverError, setServerError] = useState("");
  const busy = useRef(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setServerError("");
    const payload = { ...v, agreed };
    const check = validateTrialSignup(payload);
    if (!check.ok) {
      track("trial_failed", { reason: "invalid", fields: fieldList(check.errors) });
      setErrors(check.errors);
      return;
    }
    setErrors({});
    busy.current = true;
    setState("sending");
    try {
      const res = await fetch("/api/trial", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: TrialErrors; returning?: boolean; next?: string };
      if (res.ok) {
        track("trial_started", { returning: data.returning === true });
        setState("opening");
        window.location.assign(data.next === "/trial/ended" ? "/trial/ended" : "/app");
        return;
      }
      track("trial_failed", { reason: "server", fields: data.errors ? fieldList(data.errors) : undefined });
      if (data.errors) setErrors(data.errors);
      setServerError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      track("trial_failed", { reason: "network" });
      setServerError("We could not reach the server. Check your connection and try again.");
    }
    busy.current = false;
    setState("idle");
  }

  const err = (k: keyof TrialErrors) => errors[k] && <span className="text-xs font-medium text-risk" role="alert">{errors[k]}</span>;
  return (
    <form onSubmit={submit} noValidate className="ph-mask grid grid-cols-[minmax(0,1fr)] gap-5">
      <Field label="Your name"><Input value={v.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} className="ph-no-capture" />{err("name")}</Field>
      <Field label="Email" hint="We use it to start your trial and to reach you before it ends.">
        <Input type="email" inputMode="email" value={v.email} onChange={set("email")} autoComplete="email" autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.email} className="ph-no-capture" />{err("email")}
      </Field>
      <Field label="Creator handle"><Input value={v.handle} onChange={set("handle")} placeholder="@yourhandle" autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.handle} className="ph-no-capture" />{err("handle")}</Field>
      <div className="hidden" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} /></label></div>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm text-body">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--ink)] pointer-coarse:size-5" aria-invalid={!!errors.agreed} />
          <span>CREO may store my name, email and handle for my trial and contact me about it.</span>
        </label>
        {err("agreed")}
      </div>
      {serverError && <p className="rounded-control bg-risk-wash p-3 text-sm font-medium text-risk" role="alert">{serverError}</p>}
      <div>
        <Button type="submit" variant="primary" size="lg" disabled={state !== "idle"}>{state === "sending" ? "Starting" : state === "opening" ? "Opening your workspace" : "Start my 14 days free"}</Button>
      </div>
    </form>
  );
}
