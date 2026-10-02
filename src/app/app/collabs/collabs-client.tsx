"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { makeDraft } from "@/lib/engine/draft";
import { inr } from "@/lib/engine/format";
import { scopeText } from "@/lib/engine/evaluate";
import type { CreatorDNA, DraftKind, Inquiry } from "@/lib/engine/types";
import { SAMPLE_INQUIRY } from "@/lib/store/seed";
import { useWorkspace, type Ctx } from "@/lib/store/workspace";
import { HEALTH_LABEL, healthTone } from "@/components/product/brief";
import { MessageHighlight, QuotePanel, SignalList, TermsList } from "@/components/product/collab";
import { Button, Chip, Empty, Field, PageHeader, Panel, Skeleton, Textarea, cn } from "@/components/ui/kit";
import { CopyButton, Tabs } from "@/components/ui/interactive";

const STATUS: Record<Inquiry["status"], { label: string; tone: "neutral" | "mark" | "ok" | "outline" }> = {
  new: { label: "New", tone: "mark" }, drafted: { label: "Draft ready", tone: "neutral" }, pending: { label: "Awaiting approval", tone: "mark" }, approved: { label: "Approved", tone: "ok" }, declined: { label: "Declined", tone: "outline" },
};

export function CollabsClient() {
  const { ws, dispatch, addInquiry, requestApproval } = useWorkspace();
  const params = useSearchParams();
  const [sel, setSel] = useState<string | null>(params.get("id"));
  const [adding, setAdding] = useState(false);
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);

  if (!ws) return <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[19rem_1fr]"><Skeleton className="h-[36rem]" /><Skeleton className="h-[36rem]" /></div>;
  const current = ws.inquiries.find((q) => q.id === sel) ?? ws.inquiries[0];

  const submit = (text: string, source: Inquiry["source"] = "paste") => {
    if (text.trim().length < 20) { setErr("Paste the whole message so CREO can read the terms."); return; }
    setErr("");
    const q = addInquiry(text, source);
    setSel(q.id); setAdding(false); setRaw("");
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.type.startsWith("image/")) { setErr("CREO cannot read screenshots in this version. Paste the text of the message instead."); return; }
    setRaw((await f.text()).slice(0, 8000)); setErr("");
  };

  return (
    <>
      <PageHeader title="Collab Inbox" sub="Paste a brand message. CREO reads the terms, flags risks, prices the deal and drafts a reply. Nothing is sent without your approval.">
        <Button variant={adding ? "ghost" : "dark"} onClick={() => setAdding((a) => !a)}><Plus size={16} weight="bold" />Add an inquiry</Button>
      </PageHeader>

      {adding && (
        <Panel as="section" className="mb-6 p-6">
          <h2 className="font-display text-lg font-semibold">Add an inquiry</h2>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Brand message" hint="Paste a DM or email as it arrived, or load a .txt or .eml file.">
              <Textarea rows={8} value={raw} onChange={(e) => { setRaw(e.target.value); setErr(""); }} placeholder="Hi, we'd love to work with you on..." aria-invalid={!!err} />
            </Field>
            {err && <p className="text-sm font-medium text-risk" role="alert">{err}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => submit(raw)}>Read the message</Button>
              <input ref={file} type="file" accept=".txt,.eml,.md,image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Load a message file" />
              <Button variant="ghost" onClick={() => file.current?.click()}>Load a file</Button>
              <button type="button" className="text-[0.8125rem] text-muted underline underline-offset-4 hover:text-ink" onClick={() => { setRaw(SAMPLE_INQUIRY); setErr(""); }}>Use a sample message</button>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <section aria-label="Inbox" className="flex flex-col gap-2">
          {ws.inquiries.map((q) => (
            <button key={q.id} type="button" aria-pressed={current?.id === q.id} onClick={() => setSel(q.id)} className={cn("rounded-panel border p-4 text-left transition", current?.id === q.id ? "border-ink bg-surface shadow-panel" : "border-line bg-surface hover:border-line-strong")}>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink">{q.extraction.brand ?? "Unknown brand"}</span>
                <Chip tone={healthTone(q.evaluation.health)}>{HEALTH_LABEL[q.evaluation.health]}</Chip>
              </span>
              <span className="mt-1 block truncate text-[0.8125rem] text-muted">{scopeText(q.extraction.reels, q.extraction.stories, q.extraction.posts)}{q.extraction.budgetInr ? `, ${inr(q.extraction.budgetInr)} offered` : ""}</span>
              <Chip tone={STATUS[q.status].tone} className="mt-2.5">{STATUS[q.status].label}</Chip>
            </button>
          ))}
          {!ws.inquiries.length && <Empty title="Inbox is empty" body="Paste a brand message and CREO will turn it into terms, a price and a reply." />}
        </section>

        {current && <Deal key={current.id} q={current} dna={ws.dna} dispatch={dispatch} requestApproval={requestApproval} onDelete={() => { dispatch({ type: "inq-remove", id: current.id }); setSel(null); }} />}
      </div>
    </>
  );
}

function Deal({ q, dna, dispatch, requestApproval, onDelete }: { q: Inquiry; dna: CreatorDNA; dispatch: Ctx["dispatch"]; requestApproval: Ctx["requestApproval"]; onDelete: () => void }) {
  const setDraft = (kind: DraftKind, tone: "warm" | "direct") => dispatch({ type: "inq-patch", id: q.id, patch: { draft: makeDraft(kind, q.extraction, q.evaluation, dna, tone), status: q.status === "approved" || q.status === "pending" ? q.status : "drafted" } });
  const ev = q.evaluation;
  const unsafe = q.extraction.signals.some((s) => s.severity === "risk");
  const [body, setBody] = useState(q.draft?.body ?? "");
  const locked = q.status === "pending" || q.status === "approved";
  const saveBody = () => { if (q.draft && body !== q.draft.body) dispatch({ type: "inq-patch", id: q.id, patch: { draft: { ...q.draft, body } } }); };
  return (
    <article className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight">{q.extraction.brand ?? "Unknown brand"}</h2>
        <Chip tone={healthTone(ev.health)}>{HEALTH_LABEL[ev.health]}, {ev.score} of 100</Chip>
        <Chip tone="outline">CREO suggests: {ev.recommendation}</Chip>
        <button type="button" aria-label="Delete this inquiry" onClick={onDelete} className="ml-auto text-muted transition hover:text-risk"><Trash size={17} /></button>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel as="section" className="p-6">
          <h3 className="mb-3 font-display text-lg font-semibold">Their message</h3>
          <MessageHighlight raw={q.raw} spans={q.extraction.spans} sweep />
        </Panel>
        <Panel as="section" className="p-6">
          <h3 className="font-display text-lg font-semibold">What CREO read</h3>
          <div className="mt-2"><TermsList ex={q.extraction} /></div>
          <h4 className="mb-3 mt-6 text-sm font-semibold text-ink">Red flags</h4>
          <SignalList signals={q.extraction.signals} />
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel as="section" className="p-6"><QuotePanel ev={ev} /></Panel>
        <Panel as="section" className="p-6">
          <h3 className="font-display text-lg font-semibold">Why, and what to ask for</h3>
          <ul className="mt-3 space-y-2 text-sm text-body">{ev.reasoning.map((r) => <li key={r}>{r}</li>)}</ul>
          {ev.levers.length > 0 && (
            <>
              <h4 className="mb-2 mt-5 text-sm font-semibold text-ink">Levers for your reply</h4>
              <ul className="divide-y divide-line">{ev.levers.map((l) => <li key={l.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-2.5 text-[0.8125rem]"><span className="font-medium text-ink">{l.label}</span><span className="text-muted">{l.ask}</span></li>)}</ul>
            </>
          )}
        </Panel>
      </div>

      <Panel as="section" className="p-6">
        {q.draft ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">Draft reply</h3>
              {!locked && (
                <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
                  <Tabs<DraftKind> label="Reply type" value={q.draft.kind} onChange={(k) => setDraft(k, q.draft!.tone)} items={[{ id: "counter", label: "Counter" }, { id: "clarify", label: "Ask questions" }, { id: "accept", label: "Accept" }, { id: "decline", label: "Decline" }]} />
                  <Tabs<"warm" | "direct"> label="Tone" value={q.draft.tone} onChange={(t) => setDraft(q.draft!.kind, t)} items={[{ id: "warm", label: "Warm" }, { id: "direct", label: "Direct" }]} />
                </div>
              )}
            </div>
            <p className="mb-2 text-[0.8125rem] text-muted">Subject: {q.draft.subject}</p>
            <Textarea aria-label="Draft reply" rows={14} value={body} disabled={locked} onChange={(e) => setBody(e.target.value)} onBlur={saveBody} className="font-sans leading-relaxed" />
            {!locked && <p className="mt-2 text-xs text-muted">Changing the reply type or tone writes a fresh draft. Edit freely after that. CREO learns from what you change.</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {q.status === "approved" ? (
                <>
                  <Chip tone="ok">Approved</Chip>
                  <CopyButton text={q.draft.body} label="Copy reply" />
                  <span className="text-[0.8125rem] text-muted">Send it from your own inbox or DM. CREO never sends for you.</span>
                </>
              ) : q.status === "pending" ? (
                <><Chip tone="mark">Awaiting your approval</Chip><Button size="sm" variant="ghost" href="/app/approvals">Open approvals</Button></>
              ) : (
                <Button variant="dark" onClick={() => { saveBody(); requestApproval({ kind: "collab", refId: q.id, title: `Approve the ${q.draft!.kind} to ${q.extraction.brand ?? "the brand"}`, detail: `${scopeText(q.extraction.reels, q.extraction.stories, q.extraction.posts)}, commercial terms`, risk: "Commercial" }); }}>Send for approval</Button>
              )}
            </div>
          </>
        ) : (
          <div>
            <h3 className="font-display text-lg font-semibold text-risk">Do not reply</h3>
            <p className="mt-1.5 max-w-[60ch] text-sm text-body">This message looks unsafe. Do not pay, click links or share personal details. You can report the account on Instagram.</p>
            <div className="mt-4"><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "inq-patch", id: q.id, patch: { status: "declined" } })} disabled={q.status === "declined"}>{q.status === "declined" ? "Marked as declined" : "Mark as declined"}</Button></div>
          </div>
        )}
      </Panel>
    </article>
  );
}
