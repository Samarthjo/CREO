"use client";

import { Trash } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cap } from "@/lib/engine/copy";
import { buildPackage } from "@/lib/engine/studio";
import type { Language } from "@/lib/engine/types";
import { useWorkspace } from "@/lib/store/workspace";
import { PackageView } from "@/components/product/studio";
import { Button, Chip, Empty, Field, Input, PageHeader, Panel, Select, Skeleton, cn } from "@/components/ui/kit";
import { Tabs } from "@/components/ui/interactive";

const STATUS = { draft: "neutral", pending: "mark", approved: "ok", rejected: "risk" } as const;
const STATUS_LABEL = { draft: "Draft", pending: "Awaiting approval", approved: "Approved", rejected: "Rejected" } as const;

export function StudioClient() {
  const { ws, insights, ranked, dispatch, requestApproval } = useWorkspace();
  const params = useSearchParams();
  const [trendId, setTrendId] = useState("");
  const [topic, setTopic] = useState("");
  const [proof, setProof] = useState("");
  const [len, setLen] = useState<"30" | "45" | "60">("30");
  const [lang, setLang] = useState<Language>("English");
  const [sel, setSel] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = params.get("trend");
    const tp = params.get("topic");
    if (t) setTrendId(t);
    if (tp) setTopic(tp);
  }, [params]);
  useEffect(() => { if (ws) setLang(ws.dna.languages[0] ?? "English"); }, [ws?.dna.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = useMemo(() => ws?.packages.find((p) => p.id === sel) ?? ws?.packages[0], [ws, sel]);
  if (!ws || !insights) return <div className="grid gap-6 xl:grid-cols-[22rem_1fr]"><Skeleton className="h-[34rem]" /><Skeleton className="h-[34rem]" /></div>;

  const generate = () => {
    if (topic.trim().length < 3) { setErr("Tell CREO what the video is about, in a few words."); return; }
    setErr("");
    const pattern = ws.patterns.find((p) => p.id === trendId);
    const pkg = buildPackage({ topic, proof, lengthSec: Number(len) as 30 | 45 | 60, language: lang, pattern, dna: ws.dna, insights, memory: ws.memory });
    dispatch({ type: "pkg-add", pkg });
    setSel(pkg.id);
  };

  return (
    <>
      <PageHeader title="Studio" sub="From a trend or an idea to a package you can shoot today: hooks, script, shot plan, caption, CTA and titles.">
        {current && current.status !== "pending" && current.status !== "approved" && (
          <Button variant="dark" onClick={() => requestApproval({ kind: "studio", refId: current.id, title: `Approve the package for "${current.topic}"`, detail: `${current.hooks.find((h) => h.id === current.chosenHook)?.style} hook, ${current.lengthSec} second script`, risk: "Public" })}>Send for approval</Button>
        )}
      </PageHeader>

      <div className="grid items-start gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Panel as="section" className="p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">New package</h2>
            <div className="flex flex-col gap-4">
              <Field label="Trend">
                <Select value={trendId} onChange={(e) => setTrendId(e.target.value)}>
                  <option value="">No trend, use my best hook</option>
                  {ranked.map(({ pattern, fit }) => <option key={pattern.id} value={pattern.id}>{pattern.title} ({fit.score}% fit)</option>)}
                </Select>
              </Field>
              <Field label="Topic" hint="What the video is about, in a few words.">
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. competitor research" aria-invalid={!!err} />
                <span className="flex flex-wrap gap-1.5 pt-1">
                  {ws.dna.topics.slice(0, 4).map((t) => <button key={t} type="button" onClick={() => setTopic(t)} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted transition hover:border-ink hover:text-ink">{t}</button>)}
                </span>
                {err && <span className="text-xs font-medium text-risk" role="alert">{err}</span>}
              </Field>
              <Field label="Your real result" hint="Optional. CREO never invents results. Gaps show as highlighted slots.">
                <Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="e.g. saved 6 hours and found 3 gaps" />
              </Field>
              <div className="flex flex-col gap-1.5"><span className="text-[0.8125rem] font-medium text-ink">Length</span><Tabs<"30" | "45" | "60"> label="Length" value={len} onChange={setLen} items={[{ id: "30", label: "30 seconds" }, { id: "45", label: "45 seconds" }, { id: "60", label: "60 seconds" }]} /></div>
              <div className="flex flex-col gap-1.5"><span className="text-[0.8125rem] font-medium text-ink">Language</span><Tabs<Language> label="Language" value={lang} onChange={setLang} items={[{ id: "English", label: "English" }, { id: "Hinglish", label: "Hinglish" }]} /></div>
              <Button variant="primary" size="lg" onClick={generate}>Generate package</Button>
            </div>
          </Panel>

          <section aria-label="Your packages" className="flex flex-col gap-2">
            <h2 className="px-1 font-display text-base font-semibold">Your packages</h2>
            {ws.packages.map((p) => (
              <button key={p.id} type="button" onClick={() => setSel(p.id)} aria-pressed={current?.id === p.id} className={cn("flex items-center gap-3 rounded-panel border p-3.5 text-left transition", current?.id === p.id ? "border-ink bg-surface shadow-panel" : "border-line bg-surface hover:border-line-strong")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{cap(p.topic)}</span>
                  <span className="block truncate text-xs text-muted">{p.trendTitle ?? "No trend"}, {p.lengthSec}s, {p.language}</span>
                </span>
                <Chip tone={STATUS[p.status]}>{STATUS_LABEL[p.status]}</Chip>
              </button>
            ))}
          </section>
        </div>

        <section aria-label="Package" className="min-w-0">
          {current ? (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-tight">{cap(current.topic)}</h2>
                <Chip tone={STATUS[current.status]}>{STATUS_LABEL[current.status]}</Chip>
                {current.trendTitle && <Chip tone="outline">{current.trendTitle}</Chip>}
                <button type="button" aria-label="Delete this package" className="ml-auto text-muted transition hover:text-risk" onClick={() => { dispatch({ type: "pkg-remove", id: current.id }); setSel(null); }}><Trash size={17} /></button>
              </div>
              <PackageView
                key={current.id}
                pkg={current}
                onEdit={(field, ai, human, reason, apply) => dispatch({ type: "pkg-edit", id: current.id, field, ai, human, reason, apply })}
                onChooseHook={(id) => {
                  const h = current.hooks.find((x) => x.id === id)!;
                  const lines = current.caption.split("\n");
                  lines[0] = h.text;
                  dispatch({ type: "pkg-patch", id: current.id, patch: { chosenHook: id, script: current.script.map((b) => (b.id === "hook" ? { ...b, line: h.text } : b)), caption: lines.join("\n") } });
                }}
              />
            </>
          ) : (
            <Empty title="No package yet" body="Pick a trend and a topic on the left. CREO writes hooks, a script, a shot plan, a caption and titles in your voice." />
          )}
        </section>
      </div>
    </>
  );
}
