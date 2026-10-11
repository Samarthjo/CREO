"use client";

import { CheckCircle, Minus, Plus } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { applyProps, fieldList } from "@/lib/analytics-events";
import { BRAND_INQUIRIES, FOLLOWER_BANDS, GOALS, PLATFORMS, POSTS_PER_WEEK, validateApplication, type ApplicationErrors } from "@/lib/apply";
import { NICHES, type NicheKey } from "@/lib/engine/types";
import { Button, Field, Input, Select, Textarea, cn } from "../ui/kit";

const EMPTY = { name: "", handle: "", contact: "", followers: "", niche: "", platform: "", postsPerWeek: "", goal: "", brandInquiries: "", problem: "", website: "" };

/**
 * The Founding Cohort application, used on the home page and on /cohort.
 * Four answers are required. The rest help us pick the creators we can help most: on the home page they sit behind
 * "Add more about you" so the form stays short; on /cohort they are open.
 */
export function ApplyForm({ variant = "short", submitLabel = "Apply for the next cohort" }: { variant?: "short" | "full"; submitLabel?: string }) {
  const [v, setV] = useState(EMPTY);
  const [more, setMore] = useState(variant === "full");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState("");
  const started = useRef(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const payload = { ...v, agreed };
    const check = validateApplication(payload);
    if (!check.ok) {
      track("cohort_apply_failed", { variant, reason: "invalid", fields: fieldList(check.errors) });
      setErrors(check.errors);
      if (["niche", "platform", "postsPerWeek", "goal", "brandInquiries"].some((k) => k in check.errors)) setMore(true);
      return;
    }
    setErrors({});
    setState("sending");
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: ApplicationErrors };
      if (res.ok) { track("cohort_apply_submitted", applyProps(variant, payload)); setState("done"); return; }
      track("cohort_apply_failed", { variant, reason: "server", fields: data.errors ? fieldList(data.errors) : undefined });
      if (data.errors) setErrors(data.errors);
      setServerError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      track("cohort_apply_failed", { variant, reason: "network" });
      setServerError("We could not reach the server. Check your connection and try again.");
    }
    setState("idle");
  }

  if (state === "done")
    return (
      <div className="ph-mask flex flex-col items-start gap-3 py-6" role="status">
        <CheckCircle size={36} weight="fill" className="text-ok" />
        <h4 className="font-display text-2xl font-semibold">Application received.</h4>
        <p className="max-w-[44ch] text-sm text-muted">Thank you, {v.name.split(" ")[0]}. We will reach you on {v.contact}.</p>
      </div>
    );

  const err = (k: keyof ApplicationErrors) => errors[k] && <span className="text-xs font-medium text-risk" role="alert">{errors[k]}</span>;
  const opt = <span className="font-normal text-muted"> (optional)</span>;
  return (
    <form onSubmit={submit} onFocusCapture={() => { if (!started.current) { started.current = true; track("cohort_apply_started", { variant }); } }} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
      <Field label="Your name"><Input value={v.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />{err("name")}</Field>
      <Field label="Instagram or main creator handle"><Input value={v.handle} onChange={set("handle")} placeholder="@yourhandle" aria-invalid={!!errors.handle} />{err("handle")}</Field>
      <Field label="WhatsApp number or email"><Input value={v.contact} onChange={set("contact")} autoComplete="email" aria-invalid={!!errors.contact} />{err("contact")}</Field>
      <Field label="Followers"><Select value={v.followers} onChange={set("followers")} aria-invalid={!!errors.followers}><option value="">Choose a range</option>{FOLLOWER_BANDS.map((b) => <option key={b}>{b}</option>)}</Select>{err("followers")}</Field>

      {variant === "short" && (
        <button type="button" aria-expanded={more} aria-controls="apply-more" onClick={() => setMore((m) => !m)} className="inline-flex min-h-9 items-center gap-2 justify-self-start rounded-full text-[0.8125rem] font-medium text-ink underline-offset-4 hover:underline md:col-span-2 pointer-coarse:min-h-11">
          {more ? <Minus size={16} /> : <Plus size={16} />}
          {more ? "Fewer questions" : "Add more about you (optional, about a minute)"}
        </button>
      )}

      {more && (
        <div id="apply-more" className="contents">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-medium text-ink">Primary platform{opt}</span>
            <Select value={v.platform} onChange={set("platform")} aria-invalid={!!errors.platform}><option value="">Choose a platform</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</Select>
            {err("platform")}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-medium text-ink">Posts per week{opt}</span>
            <Select value={v.postsPerWeek} onChange={set("postsPerWeek")} aria-invalid={!!errors.postsPerWeek}><option value="">Choose</option>{POSTS_PER_WEEK.map((p) => <option key={p}>{p}</option>)}</Select>
            {err("postsPerWeek")}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-medium text-ink">Niche{opt}</span>
            <Select value={v.niche} onChange={set("niche")} aria-invalid={!!errors.niche}><option value="">Choose a niche</option>{(Object.keys(NICHES) as NicheKey[]).map((k) => <option key={k} value={k}>{NICHES[k].label}</option>)}</Select>
            {err("niche")}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-medium text-ink">Do you get brand inquiries?{opt}</span>
            <Select value={v.brandInquiries} onChange={set("brandInquiries")} aria-invalid={!!errors.brandInquiries}><option value="">Choose</option>{BRAND_INQUIRIES.map((p) => <option key={p}>{p}</option>)}</Select>
            {err("brandInquiries")}
          </label>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span id="goal-label" className="text-[0.8125rem] font-medium text-ink">Main goal{opt}</span>
            <div role="radiogroup" aria-labelledby="goal-label" className="flex flex-wrap gap-2">
              {GOALS.map((g) => {
                const on = v.goal === g;
                return (
                  <button key={g} type="button" role="radio" aria-checked={on} onClick={() => setV((x) => ({ ...x, goal: on ? "" : g }))} className={cn("rounded-full border px-4 py-2 text-sm font-medium leading-5 transition pointer-coarse:min-h-11", on ? "border-transparent bg-mark text-on-mark" : "border-ink/45 text-ink hover:border-ink hover:bg-sunk")}>
                    {g}
                  </button>
                );
              })}
            </div>
            {err("goal")}
          </div>
          <Field label="Your biggest creator problem right now" hint="Optional. One or two lines is plenty." className="md:col-span-2"><Textarea rows={3} value={v.problem} onChange={set("problem")} maxLength={400} /></Field>
        </div>
      )}

      <div className="hidden" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} /></label></div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="flex items-start gap-3 text-sm text-body">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--ink)] pointer-coarse:size-5" aria-invalid={!!errors.agreed} />
          <span>I'll share weekly feedback and let CREO quote my results with permission.</span>
        </label>
        {err("agreed")}
      </div>
      {serverError && <p className="rounded-control bg-risk-wash p-3 text-sm font-medium text-risk md:col-span-2" role="alert">{serverError}</p>}
      <div className="md:col-span-2"><Button type="submit" variant="primary" size="lg" disabled={state === "sending"}>{state === "sending" ? "Sending" : submitLabel}</Button></div>
    </form>
  );
}
