"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { compact, inr, uid } from "@/lib/engine/format";
import { FORMATS, GOALS, HOOK_TYPES, NICHES, type FormatKey, type HookType } from "@/lib/engine/types";
import { useWorkspace } from "@/lib/store/workspace";
import { blankDna, DnaForm } from "@/components/product/dna-form";
import { Button, Chip, Field, Input, PageHeader, Panel, Select, Skeleton } from "@/components/ui/kit";

export function DnaClient() {
  const { ws, insights, dispatch, startOwn } = useWorkspace();
  const router = useRouter();
  const setup = useSearchParams().get("setup") === "1";
  const [editing, setEditing] = useState(false);
  const [post, setPost] = useState({ title: "", hook: "proof-first" as HookType, format: "facecam" as FormatKey, durationSec: 25, views: 0, saves: 0, shares: 0, comments: 0 });
  const [deal, setDeal] = useState({ brand: "", category: "", deliverables: "", priceInr: 0, status: "paid" as "paid" | "pending" | "declined" });

  if (!ws || !insights) return <Skeleton className="h-[40rem]" />;
  const d = ws.dna;

  if (setup)
    return (
      <>
        <PageHeader title="Set up your Creator DNA" sub="CREO scores trends, writes scripts and prices deals from this profile. You can refine it any time." />
        <Panel className="p-8"><DnaForm initial={blankDna()} submitLabel="Create my workspace" onSubmit={(dna) => { startOwn(dna); router.push("/app"); }} onCancel={() => router.push("/app/dna")} /></Panel>
      </>
    );

  return (
    <>
      <PageHeader title="Creator DNA" sub="What CREO has learned about your content, audience, performance and deals. Every module reads from this.">
        <Button variant={editing ? "ghost" : "dark"} onClick={() => setEditing((e) => !e)}>{editing ? "Close editor" : "Edit profile"}</Button>
      </PageHeader>

      {editing ? (
        <Panel className="p-8"><DnaForm initial={d} submitLabel="Save profile" onSubmit={(dna) => { dispatch({ type: "dna", patch: dna }); setEditing(false); }} onCancel={() => setEditing(false)} /></Panel>
      ) : (
        <>
          <Panel className="p-7">
            <div className="flex flex-wrap items-center gap-6">
              <span className="grid size-16 place-items-center rounded-full bg-ink font-display text-xl font-semibold text-bg">{d.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight">{d.name}</h2>
                <p className="text-sm text-muted">{d.handle}{d.city ? `, ${d.city}` : ""}</p>
                <div className="mt-3 flex flex-wrap gap-2"><Chip tone="mark">{NICHES[d.niche].label}</Chip>{d.goals.map((g) => <Chip key={g}>{GOALS[g]}</Chip>)}{d.languages.map((l) => <Chip key={l} tone="outline">{l}</Chip>)}</div>
              </div>
              <dl className="flex gap-8">
                <div><dt className="text-xs text-muted">Followers</dt><dd className="tnum font-display text-[1.75rem] font-semibold text-ink">{compact(d.followers)}</dd></div>
                <div><dt className="text-xs text-muted">Average Reel views</dt><dd className="tnum font-display text-[1.75rem] font-semibold text-ink">{compact(d.avgViews)}</dd></div>
              </dl>
            </div>
          </Panel>

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <Panel as="section" className="p-6">
              <h3 className="font-display text-lg font-semibold">What works for you</h3>
              {insights.hooksRanked.length ? (
                <ul className="mt-2 divide-y divide-line">
                  {insights.hooksRanked.map((h) => (
                    <li key={h.key} className="flex items-baseline justify-between py-2.5 text-sm"><span className="text-ink">{HOOK_TYPES[h.key as HookType]} <span className="text-muted">({h.posts} {h.posts === 1 ? "post" : "posts"})</span></span><span className="tnum font-medium text-ink">{h.lift.toFixed(1)}x baseline</span></li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-muted">Add a few past posts below and CREO will find which openings win for you.</p>}
              <ul className="mt-3 space-y-1.5 text-[0.8125rem] text-muted">{insights.lines.map((l) => <li key={l}>{l}</li>)}</ul>
            </Panel>
            <Panel as="section" className="p-6">
              <h3 className="font-display text-lg font-semibold">Voice and audience</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="text-xs text-muted">Tone</dt><dd className="text-ink">{d.tone.join(", ") || "Not set"}</dd></div>
                <div><dt className="text-xs text-muted">Signature line</dt><dd className="text-ink">{d.signature || "Not set"}</dd></div>
                <div><dt className="text-xs text-muted">Avoids</dt><dd className="text-ink">{d.avoidWords.join(", ") || "Nothing set"}</dd></div>
                <div><dt className="text-xs text-muted">Audience</dt><dd className="text-ink">{[d.audience.who && (d.audience.ageBand ? `${d.audience.who}, aged ${d.audience.ageBand}` : d.audience.who), d.audience.cities.length && `Top cities: ${d.audience.cities.join(", ")}`].filter(Boolean).join(". ") || "Not set"}</dd></div>
                <div><dt className="text-xs text-muted">Formats you shoot</dt><dd className="text-ink">{d.formats.map((f) => FORMATS[f]).join(", ")}</dd></div>
              </dl>
            </Panel>
          </div>

          <Panel as="section" className="mt-6 p-6">
            <h3 className="font-display text-lg font-semibold">Deal rules</h3>
            <p className="mt-1 text-sm text-muted">Collab Inbox checks every inquiry against these.</p>
            <dl className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div><dt className="text-xs text-muted">Minimum per Reel</dt><dd className="tnum font-display text-xl font-semibold text-ink">{inr(d.rules.minReelInr)}</dd></div>
              <div><dt className="text-xs text-muted">Longest exclusivity</dt><dd className="tnum font-display text-xl font-semibold text-ink">{d.rules.maxExclusivityDays} days</dd></div>
              <div><dt className="text-xs text-muted">Longest paid usage</dt><dd className="font-display text-xl font-semibold text-ink">{d.rules.maxUsage === "organic" ? "Organic only" : d.rules.maxUsage === "paid-30" ? "30 days" : "90 days"}</dd></div>
              <div><dt className="text-xs text-muted">Gifting-only deals</dt><dd className="font-display text-xl font-semibold text-ink">{d.rules.allowBarter ? "Allowed" : "Never"}</dd></div>
            </dl>
          </Panel>

          <Panel as="section" className="mt-6 p-6">
            <h3 className="font-display text-lg font-semibold">Past posts</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead><tr className="text-xs text-muted"><th className="pb-2 font-medium">Post</th><th className="pb-2 font-medium">Hook</th><th className="pb-2 font-medium">Format</th><th className="pb-2 text-right font-medium">Views</th><th className="pb-2 text-right font-medium">vs baseline</th><th /></tr></thead>
                <tbody className="divide-y divide-line">
                  {d.posts.slice(0, 8).map((p) => (
                    <tr key={p.id}><td className="max-w-[18rem] truncate py-2.5 text-ink">{p.title}</td><td className="py-2.5 text-muted">{HOOK_TYPES[p.hook]}</td><td className="py-2.5 text-muted">{FORMATS[p.format]}</td><td className="tnum py-2.5 text-right text-ink">{compact(p.views)}</td><td className="tnum py-2.5 text-right text-ink">{(p.views / insights.baseline).toFixed(1)}x</td><td className="py-2.5 text-right"><button type="button" aria-label={`Remove ${p.title}`} className="inline-flex min-h-6 items-center justify-end text-xs text-muted hover:text-risk pointer-coarse:min-h-11 pointer-coarse:min-w-11" onClick={() => dispatch({ type: "post-remove", id: p.id })}>Remove</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-line pt-5 md:grid-cols-[minmax(0,2fr)_1fr_1fr_6rem_6rem_auto] md:items-end">
              <Field label="Add a post"><Input value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} placeholder="Title or first line" /></Field>
              <Field label="Hook"><Select value={post.hook} onChange={(e) => setPost({ ...post, hook: e.target.value as HookType })}>{(Object.keys(HOOK_TYPES) as HookType[]).map((k) => <option key={k} value={k}>{HOOK_TYPES[k]}</option>)}</Select></Field>
              <Field label="Format"><Select value={post.format} onChange={(e) => setPost({ ...post, format: e.target.value as FormatKey })}>{(Object.keys(FORMATS) as FormatKey[]).map((k) => <option key={k} value={k}>{FORMATS[k]}</option>)}</Select></Field>
              <Field label="Seconds"><Input type="number" min={5} value={post.durationSec} onChange={(e) => setPost({ ...post, durationSec: Number(e.target.value) })} /></Field>
              <Field label="Views"><Input type="number" min={0} value={post.views || ""} onChange={(e) => setPost({ ...post, views: Number(e.target.value) })} /></Field>
              <Button variant="dark" disabled={!post.title.trim() || post.views < 1} onClick={() => { dispatch({ type: "post-add", post: { id: uid(), ...post, title: post.title.trim(), postedOn: new Date().toISOString().slice(0, 10) } }); setPost({ ...post, title: "", views: 0 }); }}>Add</Button>
            </div>
          </Panel>

          <Panel as="section" className="mt-6 p-6">
            <h3 className="font-display text-lg font-semibold">Monetization history</h3>
            {d.deals.length ? (
              <ul className="mt-2 divide-y divide-line">
                {d.deals.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="w-28 font-medium text-ink">{x.brand}</span>
                    <span className="min-w-0 flex-1 text-muted">{x.category}, {x.deliverables}</span>
                    <span className="tnum text-ink">{x.priceInr ? inr(x.priceInr) : "No fee"}</span>
                    <Chip tone={x.status === "paid" ? "ok" : x.status === "pending" ? "neutral" : "outline"}>{x.status}</Chip>
                    <button type="button" aria-label={`Remove ${x.brand}`} className="inline-flex min-h-6 items-center justify-end text-xs text-muted hover:text-risk pointer-coarse:min-h-11 pointer-coarse:min-w-11" onClick={() => dispatch({ type: "deal-remove", id: x.id })}>Remove</button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">No deals yet. Add past deals so CREO can compare new offers with what you have actually earned.</p>}
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-line pt-5 md:grid-cols-[1fr_1fr_minmax(0,1.5fr)_7rem_8rem_auto] md:items-end">
              <Field label="Add a deal"><Input value={deal.brand} onChange={(e) => setDeal({ ...deal, brand: e.target.value })} placeholder="Brand" /></Field>
              <Field label="Category"><Input value={deal.category} onChange={(e) => setDeal({ ...deal, category: e.target.value })} /></Field>
              <Field label="Deliverables"><Input value={deal.deliverables} onChange={(e) => setDeal({ ...deal, deliverables: e.target.value })} placeholder="1 Reel + 1 Story" /></Field>
              <Field label="Fee (₹)"><Input type="number" min={0} value={deal.priceInr || ""} onChange={(e) => setDeal({ ...deal, priceInr: Number(e.target.value) })} /></Field>
              <Field label="Status"><Select value={deal.status} onChange={(e) => setDeal({ ...deal, status: e.target.value as typeof deal.status })}><option value="paid">Paid</option><option value="pending">Pending</option><option value="declined">Declined</option></Select></Field>
              <Button variant="dark" disabled={!deal.brand.trim()} onClick={() => { dispatch({ type: "deal-add", deal: { id: uid(), ...deal, brand: deal.brand.trim(), date: new Date().toISOString().slice(0, 10) } }); setDeal({ ...deal, brand: "", category: "", deliverables: "", priceInr: 0 }); }}>Add</Button>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
