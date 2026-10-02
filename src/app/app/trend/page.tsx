"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { uid, isoNow } from "@/lib/engine/format";
import { adaptations, extractPattern, scoreFit, type Extracted } from "@/lib/engine/trend";
import { useWorkspace } from "@/lib/store/workspace";
import { AdaptationList, FitBreakdown, MechanismGrid, TrendRow } from "@/components/product/trend";
import { Button, Chip, Empty, Field, FitScore, Input, PageHeader, Panel, Skeleton, Textarea } from "@/components/ui/kit";
import { Tabs } from "@/components/ui/interactive";

type Filter = "all" | "emerging" | "rising" | "stable";
const EXAMPLE = "I replaced my weekly report with AI for 7 days. Facecam opening, then a screen recording of the workflow, about 20 seconds with fast cuts. The result is on screen in the first 3 seconds. Comment GUIDE for the template.";

export default function TrendPage() {
  const { ws, insights, ranked, dispatch } = useWorkspace();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [sel, setSel] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Extracted | null>(null);

  const list = useMemo(() => ranked.filter((r) => filter === "all" || r.pattern.status === filter), [ranked, filter]);
  const current = ranked.find((r) => r.pattern.id === sel) ?? list[0] ?? ranked[0];
  const ideas = useMemo(() => (current && ws && insights ? adaptations(current.pattern, ws.dna, insights) : []), [current, ws, insights]);

  if (!ws || !insights) return <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[24rem_1fr]"><Skeleton className="h-[40rem]" /><Skeleton className="h-[40rem]" /></div>;
  const previewFit = preview ? scoreFit({ ...preview.pattern, id: "preview", addedAt: isoNow(), source: "creator" }, ws.dna, insights, ws.memory) : null;

  return (
    <>
      <PageHeader title="Trend" sub="Patterns worth your time, scored against your Creator DNA. CREO explains the mechanism and what to make, not what to copy.">
        <Button variant={adding ? "ghost" : "dark"} onClick={() => setAdding((a) => !a)}>
          <Plus size={16} weight="bold" />
          Add a saved Reel
        </Button>
      </PageHeader>

      {adding && (
        <Panel as="section" className="mb-6 p-6">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-lg font-semibold">Add a saved Reel</h2>
              <Field label="Reel link" hint="Optional. CREO does not open links, it reads what you tell it.">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." />
              </Field>
              <Field label="What happens in it" hint="Paste the caption or transcript, or describe the first 3 seconds, the format and the call to action.">
                <Textarea rows={6} value={text} onChange={(e) => { setText(e.target.value); setPreview(null); }} placeholder="Describe the hook, format, length and call to action..." />
              </Field>
              <div className="flex items-center gap-3">
                <Button variant="primary" disabled={text.trim().length < 12} onClick={() => setPreview(extractPattern(text, { url: url || undefined, niche: ws.dna.niche }))}>Read the pattern</Button>
                <button type="button" className="text-[0.8125rem] text-muted underline underline-offset-4 hover:text-ink" onClick={() => { setText(EXAMPLE); setPreview(null); }}>Use an example</button>
              </div>
            </div>
            <div>
              {preview && previewFit ? (
                <div className="flex h-full flex-col rounded-panel bg-sunk p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold leading-snug text-ink">{preview.pattern.title}</p>
                      <p className="mt-1 text-[0.8125rem] text-muted">{preview.confidence === "low" ? "Low confidence. Add more detail for a sharper read." : `${preview.confidence === "high" ? "High" : "Medium"} confidence.`} {preview.pattern.signals?.join(". ")}.</p>
                    </div>
                    <FitScore score={previewFit.score} size={52} />
                  </div>
                  <div className="my-4 border-t border-line" />
                  <MechanismGrid pattern={{ ...preview.pattern, id: "preview", addedAt: isoNow(), source: "creator" }} />
                  <div className="mt-5 flex gap-2">
                    <Button variant="dark" onClick={() => { const id = uid(); dispatch({ type: "pattern-add", pattern: { ...preview.pattern, id, addedAt: isoNow(), source: "creator" } }); setSel(id); setAdding(false); setText(""); setUrl(""); setPreview(null); }}>Save to my trends</Button>
                    <Button variant="quiet" onClick={() => setPreview(null)}>Discard</Button>
                  </div>
                </div>
              ) : (
                <Empty title="No pattern yet" body="Describe a Reel you saved and CREO will pull out the hook, format, length, pacing and call to action." />
              )}
            </div>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[25rem_minmax(0,1fr)]">
        <section aria-label="Trend library" className="flex flex-col gap-3">
          <Tabs<Filter> label="Filter by status" value={filter} onChange={setFilter} items={[{ id: "all", label: "All" }, { id: "emerging", label: "Emerging" }, { id: "rising", label: "Rising" }, { id: "stable", label: "Stable" }]} />
          {list.map(({ pattern, fit }) => <TrendRow key={pattern.id} pattern={pattern} fit={fit.score} selected={current?.pattern.id === pattern.id} onSelect={() => setSel(pattern.id)} />)}
          {!list.length && <Empty title="Nothing here yet" body="No patterns match this filter." />}
          <p className="px-1 text-xs text-muted">Watching {ws.dna.peers.length} peer accounts. Save a Reel from any of them above.</p>
        </section>

        {current && (
          <article className="flex flex-col gap-6" aria-live="polite">
            <Panel className="p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Chip tone={current.pattern.status === "emerging" ? "mark" : current.pattern.status === "rising" ? "neutral" : "outline"}>{current.pattern.status}</Chip>
                    {current.pattern.source === "creator" && <Chip tone="outline">Saved by you</Chip>}
                  </div>
                  <h2 className="mt-3 max-w-[26ch] font-display text-[1.75rem] font-semibold leading-tight tracking-tight">{current.pattern.title}</h2>
                  <p className="mt-2 max-w-[56ch] text-sm text-muted">{current.pattern.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  {current.pattern.source === "creator" && <Button variant="quiet" size="sm" onClick={() => { dispatch({ type: "pattern-remove", id: current.pattern.id }); setSel(null); }}><Trash size={16} />Remove</Button>}
                  <Button variant="primary" size="lg" onClick={() => router.push(`/app/studio?trend=${current.pattern.id}`)}>Turn this into my content</Button>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <Panel as="section" className="p-6">
                <div className="flex items-center gap-4">
                  <FitScore score={current.fit.score} size={64} label={false} />
                  <div>
                    <h3 className="font-display text-lg font-semibold">Creator fit</h3>
                    <p className="text-sm text-muted">{current.fit.verdict}</p>
                  </div>
                </div>
                <div className="mt-3"><FitBreakdown fit={current.fit} /></div>
              </Panel>
              <Panel as="section" className="p-6">
                <h3 className="font-display text-lg font-semibold">What is working</h3>
                <div className="mt-4"><MechanismGrid pattern={current.pattern} /></div>
              </Panel>
            </div>

            <Panel as="section" className="p-6">
              <h3 className="font-display text-lg font-semibold">Original versions for you</h3>
              <p className="mt-1 text-sm text-muted">Same mechanism, your topics and your voice. Nothing here copies another creator.</p>
              <div className="mt-2">
                <AdaptationList items={ideas} onUse={(a) => router.push(`/app/studio?trend=${current.pattern.id}&topic=${encodeURIComponent(a.topic)}`)} />
              </div>
            </Panel>
          </article>
        )}
      </div>
    </>
  );
}
