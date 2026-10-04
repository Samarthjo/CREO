"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { fieldList } from "@/lib/analytics-events";
import { validateContact, type ContactErrors } from "@/lib/contact";
import { Button, Field, Input, Textarea } from "../ui/kit";

const EMPTY = { name: "", contact: "", message: "", website: "" };

/** The Contact page's form: a name, a way to reply, and a message. */
export function ContactForm() {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState("");
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const check = validateContact(v);
    if (!check.ok) { track("contact_failed", { reason: "invalid", fields: fieldList(check.errors) }); setErrors(check.errors); return; }
    setErrors({});
    setState("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: ContactErrors };
      if (res.ok) { track("contact_submitted", {}); setState("done"); return; }
      track("contact_failed", { reason: "server", fields: data.errors ? fieldList(data.errors) : undefined });
      if (data.errors) setErrors(data.errors);
      setServerError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      track("contact_failed", { reason: "network" });
      setServerError("We could not reach the server. Check your connection and try again.");
    }
    setState("idle");
  }

  if (state === "done")
    return (
      <div className="ph-mask flex flex-col items-start gap-3 py-6" role="status">
        <CheckCircle size={36} weight="fill" className="text-ok" />
        <h3 className="font-display text-2xl font-semibold">Message received.</h3>
        <p className="max-w-[44ch] text-sm text-muted">Thank you, {v.name.split(" ")[0]}. We will reply on {v.contact}.</p>
      </div>
    );

  const err = (k: keyof ContactErrors) => errors[k] && <span className="text-xs font-medium text-risk" role="alert">{errors[k]}</span>;
  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2">
      <Field label="Your name"><Input value={v.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />{err("name")}</Field>
      <Field label="WhatsApp number or email"><Input value={v.contact} onChange={set("contact")} autoComplete="email" aria-invalid={!!errors.contact} />{err("contact")}</Field>
      <Field label="Your message" className="sm:col-span-2"><Textarea rows={5} value={v.message} onChange={set("message")} maxLength={1000} aria-invalid={!!errors.message} />{err("message")}</Field>
      <div className="hidden" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} /></label></div>
      {serverError && <p className="rounded-control bg-risk-wash p-3 text-sm font-medium text-risk sm:col-span-2" role="alert">{serverError}</p>}
      <div className="sm:col-span-2"><Button type="submit" variant="primary" size="lg" disabled={state === "sending"}>{state === "sending" ? "Sending" : "Send message"}</Button></div>
    </form>
  );
}
