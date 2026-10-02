"use client";

import { useState } from "react";
import { FORMATS, GOALS, NICHES, type CreatorDNA, type FormatKey, type Goal, type Language, type NicheKey } from "@/lib/engine/types";
import { Button, Field, Input, Select, cn } from "../ui/kit";

const TONES = ["analytical", "dry humour", "direct", "warm", "energetic"];
const csv = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);

export const blankDna = (): CreatorDNA => ({
  id: "me", name: "", handle: "@", city: "", followers: 0, avgViews: 0, niche: "lifestyle", topics: [], goals: ["grow"], languages: ["English"],
  tone: ["direct"], avoidWords: [], signature: "", formats: ["facecam"], audience: { cities: [], ageBand: "", who: "" }, peers: [],
  rules: { minReelInr: 5000, maxExclusivityDays: 30, allowBarter: false, maxUsage: "paid-30" }, posts: [], deals: [],
});

function Chips<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = value.includes(it.id);
        return (
          <button key={it.id} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((v) => v !== it.id) : [...value, it.id])} className={cn("rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-medium transition", on ? "border-transparent bg-mark text-on-mark" : "border-line-strong text-muted hover:text-ink")}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function DnaForm({ initial, submitLabel, onSubmit, onCancel }: { initial: CreatorDNA; submitLabel: string; onSubmit: (d: CreatorDNA) => void; onCancel?: () => void }) {
  const [d, setD] = useState<CreatorDNA>(initial);
  const [topics, setTopics] = useState(initial.topics.join(", "));
  const [avoid, setAvoid] = useState(initial.avoidWords.join(", "));
  const [cities, setCities] = useState(initial.audience.cities.join(", "));
  const [peers, setPeers] = useState(initial.peers.join(", "));
  const [errs, setErrs] = useState<string[]>([]);
  const set = <K extends keyof CreatorDNA>(k: K, v: CreatorDNA[K]) => setD((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v) || 0));

  const submit = () => {
    const e: string[] = [];
    if (!d.name.trim()) e.push("Add your name.");
    if (d.handle.trim().length < 2) e.push("Add your Instagram handle.");
    if (d.followers < 1) e.push("Add your follower count.");
    if (d.avgViews < 1) e.push("Add your average Reel views. CREO prices deals from it.");
    if (!csv(topics).length) e.push("Add at least one topic you make content about.");
    if (!d.goals.length || !d.languages.length || !d.formats.length) e.push("Choose at least one goal, language and format.");
    setErrs(e);
    if (e.length) return;
    onSubmit({ ...d, name: d.name.trim(), handle: d.handle.trim().startsWith("@") ? d.handle.trim() : `@${d.handle.trim()}`, topics: csv(topics), avoidWords: csv(avoid), peers: csv(peers).slice(0, 10), audience: { ...d.audience, cities: csv(cities) } });
  };

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="mb-3 font-display text-lg font-semibold">You</legend>
        <Field label="Name"><Input value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Instagram handle"><Input value={d.handle} onChange={(e) => set("handle", e.target.value)} /></Field>
        <Field label="City"><Input value={d.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="Followers"><Input type="number" min={0} value={d.followers || ""} onChange={(e) => set("followers", num(e.target.value))} /></Field>
        <Field label="Average Reel views" hint="Your last 10 Reels. CREO prices deals from this."><Input type="number" min={0} value={d.avgViews || ""} onChange={(e) => set("avgViews", num(e.target.value))} /></Field>
        <Field label="Niche"><Select value={d.niche} onChange={(e) => set("niche", e.target.value as NicheKey)}>{(Object.keys(NICHES) as NicheKey[]).map((k) => <option key={k} value={k}>{NICHES[k].label}</option>)}</Select></Field>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-3 font-display text-lg font-semibold">Content</legend>
        <Field label="Topics you make content about" hint="Separate with commas. Trend ideas are built from these."><Input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="competitor research, weekly planning" /></Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Goals"><Chips<Goal> label="Goals" items={(Object.keys(GOALS) as Goal[]).map((k) => ({ id: k, label: GOALS[k] }))} value={d.goals} onChange={(v) => set("goals", v)} /></Field>
          <Field label="Languages"><Chips<Language> label="Languages" items={[{ id: "English", label: "English" }, { id: "Hinglish", label: "Hinglish" }]} value={d.languages} onChange={(v) => set("languages", v)} /></Field>
          <Field label="Formats you shoot"><Chips<FormatKey> label="Formats" items={(Object.keys(FORMATS) as FormatKey[]).map((k) => ({ id: k, label: FORMATS[k] }))} value={d.formats} onChange={(v) => set("formats", v)} /></Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 font-display text-lg font-semibold">Voice and audience</legend>
        <Field label="Tone"><Chips<string> label="Tone" items={TONES.map((t) => ({ id: t, label: t }))} value={d.tone} onChange={(v) => set("tone", v)} /></Field>
        <Field label="Words to avoid" hint="Separate with commas."><Input value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="game-changer, hack" /></Field>
        <Field label="Signature line"><Input value={d.signature} onChange={(e) => set("signature", e.target.value)} /></Field>
        <Field label="Who watches you"><Input value={d.audience.who} onChange={(e) => set("audience", { ...d.audience, who: e.target.value })} placeholder="Freelancers and early-career marketers" /></Field>
        <Field label="Top cities"><Input value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Bengaluru, Pune, Mumbai" /></Field>
        <Field label="Age band"><Input value={d.audience.ageBand} onChange={(e) => set("audience", { ...d.audience, ageBand: e.target.value })} placeholder="22 to 34" /></Field>
        <Field label="Peer accounts you watch" hint="Up to 10, separated by commas." className="md:col-span-2"><Input value={peers} onChange={(e) => setPeers(e.target.value)} placeholder="@peer.one, @peer.two" /></Field>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-4">
        <legend className="mb-3 font-display text-lg font-semibold">Deal rules</legend>
        <Field label="Minimum per Reel (₹)"><Input type="number" min={0} value={d.rules.minReelInr || ""} onChange={(e) => set("rules", { ...d.rules, minReelInr: num(e.target.value) })} /></Field>
        <Field label="Longest exclusivity (days)"><Input type="number" min={0} value={d.rules.maxExclusivityDays} onChange={(e) => set("rules", { ...d.rules, maxExclusivityDays: num(e.target.value) })} /></Field>
        <Field label="Longest paid usage"><Select value={d.rules.maxUsage} onChange={(e) => set("rules", { ...d.rules, maxUsage: e.target.value as CreatorDNA["rules"]["maxUsage"] })}><option value="organic">Organic only</option><option value="paid-30">30 days</option><option value="paid-90">90 days</option></Select></Field>
        <Field label="Gifting-only deals"><Select value={d.rules.allowBarter ? "yes" : "no"} onChange={(e) => set("rules", { ...d.rules, allowBarter: e.target.value === "yes" })}><option value="no">Never</option><option value="yes">Allowed</option></Select></Field>
      </fieldset>

      {errs.length > 0 && <ul className="rounded-control border border-risk/40 bg-risk-wash p-4 text-sm font-medium text-risk" role="alert">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
      <div className="flex gap-3">
        <Button variant="primary" size="lg" onClick={submit}>{submitLabel}</Button>
        {onCancel && <Button variant="quiet" size="lg" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}
