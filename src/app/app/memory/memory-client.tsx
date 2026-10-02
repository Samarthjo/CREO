"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { isoNow, uid } from "@/lib/engine/format";
import { CTAS, type CtaKind, type MemoryItem } from "@/lib/engine/types";
import { useWorkspace } from "@/lib/store/workspace";
import { MemoryRow } from "@/components/product/memory";
import { Button, Empty, Field, Input, PageHeader, Panel, Select, Skeleton } from "@/components/ui/kit";
import { Tabs } from "@/components/ui/interactive";

type Filter = "all" | MemoryItem["kind"];

export function MemoryClient() {
  const { ws, dispatch } = useWorkspace();
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [hook, setHook] = useState<"Result first" | "Direct" | "Curious">("Result first");
  const [cta, setCta] = useState<CtaKind>("comment");
  const [pkg, setPkg] = useState(params.get("log") ?? "");
  const [result, setResult] = useState("");
  if (!ws) return <Skeleton className="h-96" />;

  const items = ws.memory.filter((m) => filter === "all" || m.kind === filter);
  const approved = ws.packages.filter((p) => p.status === "approved");
  const add = (item: Omit<MemoryItem, "id" | "at">) => dispatch({ type: "memory-add", item: { ...item, id: uid(), at: isoNow() } });

  return (
    <>
      <PageHeader title="Memory" sub="Everything CREO learned from your decisions, edits and results. Preferences marked as active change every draft Studio writes." />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Memory log">
          <div className="mb-3"><Tabs<Filter> label="Filter memory" value={filter} onChange={setFilter} items={[{ id: "all", label: "All" }, { id: "preference", label: "Preferences" }, { id: "decision", label: "Decisions" }, { id: "correction", label: "Corrections" }, { id: "outcome", label: "Results" }]} /></div>
          <Panel className="px-6">
            {items.length ? <ul>{items.map((m) => <MemoryRow key={m.id} item={m} onRemove={() => dispatch({ type: "memory-remove", id: m.id })} />)}</ul> : <div className="py-6"><Empty title="Nothing here yet" body="Approve a package, edit a draft or log a result and CREO will remember it." /></div>}
          </Panel>
        </section>

        <div className="flex flex-col gap-6">
          <Panel as="section" className="p-5">
            <h2 className="font-display text-lg font-semibold">Add a preference</h2>
            <p className="mt-1 text-[0.8125rem] text-muted">Active immediately in Studio.</p>
            <div className="mt-4 flex flex-col gap-3">
              <Field label="Hook style"><Select value={hook} onChange={(e) => setHook(e.target.value as typeof hook)}><option>Result first</option><option>Direct</option><option>Curious</option></Select></Field>
              <Button variant="dark" size="sm" onClick={() => add({ kind: "preference", source: "manual", text: hook === "Result first" ? "Lead hooks with the result first." : `Lead hooks with the ${hook.toLowerCase()} style.`, rule: { type: "hook-style", value: hook } })}>Save hook preference</Button>
              <div className="my-1 border-t border-line" />
              <Field label="Call to action"><Select value={cta} onChange={(e) => setCta(e.target.value as CtaKind)}>{(Object.keys(CTAS) as CtaKind[]).map((k) => <option key={k} value={k}>{CTAS[k]}</option>)}</Select></Field>
              <Button variant="dark" size="sm" onClick={() => add({ kind: "preference", source: "manual", text: `Close with this call to action: ${CTAS[cta].toLowerCase()}.`, rule: { type: "cta", value: cta } })}>Save CTA preference</Button>
            </div>
          </Panel>

          <Panel as="section" className="p-5">
            <h2 className="font-display text-lg font-semibold">Log a result</h2>
            <p className="mt-1 text-[0.8125rem] text-muted">Results show CREO which hooks work for your audience.</p>
            <div className="mt-4 flex flex-col gap-3">
              <Field label="Package"><Select value={pkg} onChange={(e) => setPkg(e.target.value)}><option value="">Choose a posted package</option>{approved.map((p) => <option key={p.id} value={p.id}>{p.topic}</option>)}</Select></Field>
              <Field label="What happened" hint="Views, saves, replies, anything you noticed."><Input value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. 18K views, 1,400 saves" /></Field>
              <Button variant="dark" size="sm" disabled={!pkg || result.trim().length < 3} onClick={() => { const p = ws.packages.find((x) => x.id === pkg)!; add({ kind: "outcome", source: "hq", text: `Result logged for "${p.topic}".`, detail: { ai: p.id, result: result.trim() } }); setResult(""); setPkg(""); }}>Save result</Button>
              {!approved.length && <p className="text-xs text-muted">Approve a Studio package first. It appears here once it is posted.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
