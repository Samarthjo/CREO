"use client";

import { PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { spokenSeconds } from "@/lib/engine/studio";
import { packageText } from "@/lib/engine/studio";
import type { StudioPackage } from "@/lib/engine/types";
import { Button, Chip, Input, Panel, Slots, Textarea, cn } from "../ui/kit";
import { CopyButton, Tabs } from "../ui/interactive";

export type EditFn = (field: string, ai: string, human: string, reason: string, apply: Partial<StudioPackage>) => void;

function Editable({ value, label, multiline, onSave, className }: { value: string; label: string; multiline?: boolean; onSave?: (next: string, reason: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [reason, setReason] = useState("");
  if (!editing)
    return (
      <div className="flex items-start gap-2">
        <p className={cn("min-w-0 flex-1 whitespace-pre-line", className)}><Slots text={value} /></p>
        {onSave && (
          <button type="button" aria-label={`Edit ${label}`} onClick={() => { setDraft(value); setReason(""); setEditing(true); }} className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-sunk hover:text-ink">
            <PencilSimple size={15} />
          </button>
        )}
      </div>
    );
  return (
    <div className="flex flex-col gap-2.5">
      <Textarea aria-label={label} rows={multiline ? 7 : 3} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
      <Input aria-label="Why are you changing it" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you changing it? CREO learns from this (optional)" />
      <div className="flex gap-2">
        <Button size="sm" variant="dark" disabled={!draft.trim() || draft === value} onClick={() => { onSave?.(draft.trim(), reason.trim()); setEditing(false); }}>Save edit</Button>
        <Button size="sm" variant="quiet" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
}

type Tab = "hooks" | "script" | "shots" | "caption" | "titles" | "openings";
const TABS: { id: Tab; label: string }[] = [
  { id: "hooks", label: "Hooks" }, { id: "script", label: "Script" }, { id: "shots", label: "Shot plan" },
  { id: "caption", label: "Caption" }, { id: "titles", label: "Titles" }, { id: "openings", label: "Openings" },
];
const KIND_TONE = { "A-roll": "neutral", "B-roll": "outline", Screen: "mark", Overlay: "outline" } as const;

export function PackageView({ pkg, onEdit, onChooseHook }: { pkg: StudioPackage; onEdit?: EditFn; onChooseHook?: (id: string) => void }) {
  const [tab, setTab] = useState<Tab>("hooks");
  const chosen = pkg.hooks.find((h) => h.id === pkg.chosenHook)!;
  const secs = spokenSeconds(pkg.script);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 2xl:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Tabs<Tab> label="Package sections" items={TABS} value={tab} onChange={setTab} />
          <CopyButton text={packageText(pkg)} label="Copy package" />
        </div>

        {tab === "hooks" && (
          <ul className="flex flex-col gap-3" role="radiogroup" aria-label="Choose a hook">
            {pkg.hooks.map((h) => (
              <li key={h.id} className={cn("rounded-panel border p-5 transition", h.id === pkg.chosenHook ? "border-ink bg-surface shadow-panel" : "border-line bg-surface")}>
                <div className="mb-2 flex items-center gap-2">
                  <Chip tone={h.recommended ? "mark" : "neutral"}>{h.style}</Chip>
                  {h.recommended && <span className="text-xs text-muted">Recommended for you</span>}
                  <button type="button" role="radio" aria-checked={h.id === pkg.chosenHook} onClick={() => onChooseHook?.(h.id)} disabled={!onChooseHook} className={cn("ml-auto rounded-full px-3 py-1 text-xs font-medium transition", h.id === pkg.chosenHook ? "bg-ink text-bg" : "border border-line-strong text-ink hover:bg-sunk", !onChooseHook && "pointer-events-none")}>
                    {h.id === pkg.chosenHook ? "Using this hook" : "Use this hook"}
                  </button>
                </div>
                <Editable
                  value={h.text}
                  label={`${h.style} hook`}
                  className="font-display text-[1.25rem] font-medium leading-snug text-ink"
                  onSave={onEdit && ((next, reason) => onEdit(`${h.style.toLowerCase()} hook`, h.text, next, reason, { hooks: pkg.hooks.map((x) => (x.id === h.id ? { ...x, text: next } : x)), script: h.id === pkg.chosenHook ? pkg.script.map((b) => (b.id === "hook" ? { ...b, line: next } : b)) : pkg.script }))}
                />
              </li>
            ))}
          </ul>
        )}

        {tab === "script" && (
          <Panel className="p-6">
            <div className="mb-1 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-semibold">Script in your voice</h3>
              <p className="tnum text-[0.8125rem] text-muted">About {secs} seconds spoken of {pkg.lengthSec}</p>
            </div>
            <ol className="divide-y divide-line">
              {pkg.script.map((b) => (
                <li key={b.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4">
                  <div>
                    <p className="tnum text-[0.8125rem] font-medium text-ink">{b.at}</p>
                    <p className="text-xs text-muted">{b.label}</p>
                  </div>
                  <div>
                    <Editable
                      value={b.line}
                      label={`${b.label} line`}
                      className="text-[0.9375rem] leading-relaxed text-ink"
                      onSave={onEdit && ((next, reason) => onEdit(`script ${b.label.toLowerCase()}`, b.line, next, reason, { script: pkg.script.map((x) => (x.id === b.id ? { ...x, line: next } : x)) }))}
                    />
                    <p className="mt-1 text-xs text-muted">{b.visual}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        )}

        {tab === "shots" && (
          <Panel className="p-6">
            <h3 className="font-display text-lg font-semibold">Shot and B-roll plan</h3>
            <ul className="mt-1 divide-y divide-line">
              {pkg.shots.map((s) => (
                <li key={s.id} className="grid grid-cols-[4.5rem_5.5rem_minmax(0,1fr)] items-baseline gap-4 py-3.5">
                  <span className="tnum text-[0.8125rem] font-medium text-ink">{s.at}</span>
                  <Chip tone={KIND_TONE[s.kind]} className="justify-self-start">{s.kind}</Chip>
                  <span className="text-sm text-ink">{s.note}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === "caption" && (
          <div className="flex flex-col gap-4">
            <Panel className="p-6">
              <h3 className="mb-3 font-display text-lg font-semibold">Caption</h3>
              <Editable value={pkg.caption} label="caption" multiline className="text-[0.9375rem] leading-relaxed text-ink" onSave={onEdit && ((next, reason) => onEdit("caption", pkg.caption, next, reason, { caption: next }))} />
            </Panel>
            <Panel className="p-6">
              <h3 className="mb-3 font-display text-lg font-semibold">Call to action</h3>
              <Editable value={pkg.cta} label="call to action" className="text-[0.9375rem] text-ink" onSave={onEdit && ((next, reason) => onEdit("call to action", pkg.cta, next, reason, { cta: next, script: pkg.script.map((b) => (b.id === "cta" ? { ...b, line: next } : b)) }))} />
              <p className="mt-3 text-[0.8125rem] text-muted">Comment keyword <Chip tone="mark" className="mx-1">{pkg.keyword}</Chip> is saved for future audience automation.</p>
            </Panel>
          </div>
        )}

        {tab === "titles" && (
          <Panel className="p-6">
            <h3 className="font-display text-lg font-semibold">Title and thumbnail options</h3>
            <ul className="mt-2 divide-y divide-line">
              {pkg.titles.map((t, i) => (
                <li key={i} className="py-4">
                  <p className="font-display text-[1.25rem] font-medium text-ink">{t.text}</p>
                  <p className="mt-1 text-sm text-muted">{t.thumb}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === "openings" && (
          <Panel className="p-6">
            <h3 className="font-display text-lg font-semibold">Two openings to test</h3>
            <p className="mt-1 text-sm text-muted">Same video, different first 3 seconds. Post the better one next time.</p>
            <ul className="mt-2 divide-y divide-line">
              {pkg.altOpenings.map((o, i) => (
                <li key={i} className="flex gap-4 py-4">
                  <Chip tone="outline" className="mt-0.5 h-fit">{i === 0 ? "A" : "B"}</Chip>
                  <p className="text-[0.9375rem] leading-relaxed text-ink"><Slots text={o} /></p>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <aside className="grid grid-cols-[minmax(0,1fr)] gap-4 self-start md:grid-cols-2 2xl:grid-cols-1" aria-label="How CREO built this">
        <Panel className="p-5">
          <h3 className="font-display text-base font-semibold">How CREO built this</h3>
          <ul className="mt-3 space-y-3 text-[0.8125rem] leading-snug text-muted">
            {pkg.applied.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </Panel>
        <Panel className="p-5">
          <p className="text-[0.8125rem] text-muted">Hook in use</p>
          <p className="mt-1 font-display text-[1.0625rem] font-medium leading-snug text-ink"><Slots text={chosen.text} /></p>
          {pkg.corrections.length > 0 && <p className="mt-3 text-xs text-muted">{pkg.corrections.length} {pkg.corrections.length === 1 ? "edit" : "edits"} saved to Memory.</p>}
        </Panel>
      </aside>
    </div>
  );
}
