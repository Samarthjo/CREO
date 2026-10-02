"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { FOCUS, FOLLOWER_BANDS, validateApplication, type ApplicationErrors } from "@/lib/apply";
import { NICHES, type NicheKey } from "@/lib/engine/types";
import { Accent, Button, Field, Input, Mark, Panel, Select, Textarea, cn } from "../ui/kit";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

const GET = [
  "A private group with direct founder and product access",
  "Weekly strategy support from a CREO creator strategist",
  "Trend, Studio, Collab Inbox Lite and HQ, running on your Creator DNA and Memory",
];
const ASK = [
  "Use CREO and give honest feedback every week",
  "Permission to quote your results and testimonials",
  "Tell us what is still weak, so we fix it first",
];

function Terms({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <ul className="mt-4 space-y-3.5 text-[0.9375rem] leading-snug text-muted">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

export function Cohort() {
  return (
    <Section id="cohort">
      <SectionHead eyebrow="Founding Creator Cohort" title={<>Build it with us for <Accent>30 days</Accent>.</>} sub="CREO does most of the work. Our strategists work alongside it on strategy, trends and content while we automate the gaps." />

      <Reveal>
        <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-pop">
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="border-b border-line p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <p className="text-sm text-muted">Founding Creator Cohort</p>
              <p className="mt-3 font-display text-[clamp(4.5rem,8.5vw,7rem)] font-semibold leading-none tracking-[-0.04em] text-accent">₹499</p>
              <p className="mt-3 text-xl text-ink">for <Mark>30 days</Mark></p>
              <p className="mt-7 max-w-[30ch] text-[0.9375rem] leading-relaxed text-muted">10 to 15 creators first, not 30 at once, so every creator gets real attention.</p>
            </div>
            <div className="grid gap-10 p-8 sm:p-10 md:grid-cols-2 lg:p-12">
              <Terms title="What you get" items={GET} />
              <Terms title="What we ask" items={ASK} />
            </div>
          </div>
          <p className="border-t border-line px-8 py-6 text-sm leading-relaxed text-muted sm:px-10 lg:px-12">
            CREO is built to be 70 to 80 percent software and 20 to 30 percent strategist support. Every correction is captured, so the support shrinks as the product learns. We share public progress on days 7, 14, 21 and 30. The founding rate renews only if the product earned continued use.
          </p>
        </div>
      </Reveal>

      <div id="apply" className="mt-20 grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <Reveal>
          <h3 className="max-w-[14ch] font-display text-[clamp(1.9rem,3vw,2.6rem)] font-normal leading-tight tracking-[-0.03em]">Apply for a <Accent>founding</Accent> seat.</h3>
          <p className="mt-4 max-w-[36ch] text-[0.9375rem] leading-relaxed text-muted">A short form. We read every application and reach out to the creators we can help most.</p>
        </Reveal>
        <Reveal delay={0.08}><Panel className="p-7 lg:p-8"><ApplyForm /></Panel></Reveal>
      </div>
    </Section>
  );
}

function ApplyForm() {
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
      <Field label="Niche" hint="Optional."><Select value={v.niche} onChange={set("niche")} aria-invalid={!!errors.niche}><option value="">Choose a niche</option>{(Object.keys(NICHES) as NicheKey[]).map((k) => <option key={k} value={k}>{NICHES[k].label}</option>)}</Select>{err("niche")}</Field>
      <Field label="WhatsApp number or email" className="md:col-span-2"><Input value={v.contact} onChange={set("contact")} autoComplete="email" aria-invalid={!!errors.contact} />{err("contact")}</Field>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <span className="text-[0.8125rem] font-medium text-ink">Start with <span className="font-normal text-muted">(optional)</span></span>
        <div role="group" aria-label="Start with" className="flex flex-wrap gap-2">
          {FOCUS.map((f) => {
            const on = focus.includes(f);
            return <button key={f} type="button" aria-pressed={on} onClick={() => setFocus((x) => (on ? x.filter((y) => y !== f) : [...x, f]))} className={cn("rounded-full border px-4 py-2 text-sm font-medium leading-5 transition pointer-coarse:min-h-11", on ? "border-transparent bg-mark text-on-mark" : "border-ink/45 text-ink hover:border-ink hover:bg-sunk")}>{f}</button>;
          })}
        </div>
        {err("focus")}
      </div>
      <Field label="What should CREO take off your plate?" hint="Optional." className="md:col-span-2"><Textarea rows={3} value={v.note} onChange={set("note")} maxLength={400} /></Field>
      <div className="hidden" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} /></label></div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="flex items-start gap-3 text-sm text-body">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--ink)] pointer-coarse:size-5" aria-invalid={!!errors.agreed} />
          <span>I will share weekly feedback and I am happy for CREO to quote my results with my permission.</span>
        </label>
        {err("agreed")}
      </div>
      {serverError && <p className="rounded-control bg-risk-wash p-3 text-sm font-medium text-risk md:col-span-2" role="alert">{serverError}</p>}
      <div className="md:col-span-2"><Button type="submit" variant="primary" size="lg" disabled={state === "sending"}>{state === "sending" ? "Sending" : "Apply for the cohort"}</Button></div>
    </form>
  );
}
