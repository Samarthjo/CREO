"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { FOCUS, FOLLOWER_BANDS, validateApplication, type ApplicationErrors } from "@/lib/apply";
import { NICHES, type NicheKey } from "@/lib/engine/types";
import { Button, Field, Input, Select, cn } from "../ui/kit";

/** The founding-cohort application. Short on purpose: five fields and one consent line. */
export function ApplyForm() {
  const [v, setV] = useState({ name: "", handle: "", followers: "", niche: "", contact: "", note: "", website: "" });
  const [focus, setFocus] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState("");
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const payload = { ...v, focus, agreed };
    const check = validateApplication(payload);
    if (!check.ok) { setErrors(check.errors); return; }
    setErrors({});
    setState("sending");
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: ApplicationErrors };
      if (res.ok) { setState("done"); return; }
      if (data.errors) setErrors(data.errors);
      setServerError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setServerError("We could not reach the server. Check your connection and try again.");
    }
    setState("idle");
  }

  if (state === "done")
    return (
      <div className="flex flex-col items-start gap-3 py-6" role="status">
        <CheckCircle size={36} weight="fill" className="text-ok" />
        <h4 className="font-display text-2xl font-semibold">Application received.</h4>
        <p className="max-w-[44ch] text-sm text-muted">Thank you, {v.name.split(" ")[0]}. We will reach you on {v.contact}.</p>
      </div>
    );

  const err = (k: keyof ApplicationErrors) => errors[k] && <span className="text-xs font-medium text-risk" role="alert">{errors[k]}</span>;
  return (
    <form onSubmit={submit} noValidate className="grid gap-5 md:grid-cols-2">
      <Field label="Your name">{<Input value={v.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />}{err("name")}</Field>
      <Field label="Instagram handle"><Input value={v.handle} onChange={set("handle")} placeholder="@yourhandle" aria-invalid={!!errors.handle} />{err("handle")}</Field>
      <Field label="Followers"><Select value={v.followers} onChange={set("followers")} aria-invalid={!!errors.followers}><option value="">Choose a range</option>{FOLLOWER_BANDS.map((b) => <option key={b}>{b}</option>)}</Select>{err("followers")}</Field>
      <Field label="Niche"><Select value={v.niche} onChange={set("niche")} aria-invalid={!!errors.niche}><option value="">Choose a niche</option>{(Object.keys(NICHES) as NicheKey[]).map((k) => <option key={k} value={k}>{NICHES[k].label}</option>)}</Select>{err("niche")}</Field>
      <Field label="WhatsApp number or email" className="md:col-span-2"><Input value={v.contact} onChange={set("contact")} autoComplete="email" aria-invalid={!!errors.contact} />{err("contact")}</Field>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <span className="text-[0.8125rem] font-medium text-ink">Start with</span>
        <div role="group" aria-label="Start with" className="flex flex-wrap gap-2">
          {FOCUS.map((f) => {
            const on = focus.includes(f);
            return <button key={f} type="button" aria-pressed={on} onClick={() => setFocus((x) => (on ? x.filter((y) => y !== f) : [...x, f]))} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition", on ? "border-transparent bg-mark text-on-mark" : "border-line-strong text-muted hover:text-ink")}>{f}</button>;
          })}
        </div>
        {err("focus")}
      </div>
      <div className="hidden" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} /></label></div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="flex items-start gap-3 text-sm text-body">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-4 accent-[var(--ink)]" aria-invalid={!!errors.agreed} />
          <span>I'll share weekly feedback and let CREO quote my results with permission.</span>
        </label>
        {err("agreed")}
      </div>
      {serverError && <p className="rounded-control bg-risk-wash p-3 text-sm font-medium text-risk md:col-span-2" role="alert">{serverError}</p>}
      <div className="md:col-span-2"><Button type="submit" variant="primary" size="lg" disabled={state === "sending"}>{state === "sending" ? "Sending" : "Apply for the cohort"}</Button></div>
    </form>
  );
}
