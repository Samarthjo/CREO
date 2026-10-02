import { AUDIO, CTAS, EMOTIONS, FORMATS, HOOK_TYPES, type Fit, type TrendPattern } from "@/lib/engine/types";
import type { Adaptation } from "@/lib/engine/trend";
import { Button, Chip, FitScore, cn } from "../ui/kit";

const STATUS_TONE = { emerging: "mark", rising: "neutral", stable: "outline" } as const;

export function TrendRow({ pattern, fit, selected, onSelect }: { pattern: TrendPattern; fit: number; selected?: boolean; onSelect?: () => void }) {
  const m = pattern.mechanism;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn("flex w-full items-center gap-4 rounded-panel border p-4 text-left transition", selected ? "border-ink bg-surface shadow-panel" : "border-line bg-surface hover:border-line-strong")}
    >
      <FitScore score={fit} size={48} label={false} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[0.9375rem] font-medium text-ink">{pattern.title}</span>
          <Chip tone={STATUS_TONE[pattern.status]}>{pattern.status}</Chip>
        </span>
        <span className="mt-1 block truncate text-[0.8125rem] text-muted">{HOOK_TYPES[m.hook]} hook, {m.formats.map((f) => FORMATS[f].toLowerCase()).join(" and ")}, {m.durationSec[0]} to {m.durationSec[1]} seconds</span>
      </span>
    </button>
  );
}

export function FitBreakdown({ fit }: { fit: Fit }) {
  return (
    <ul className="divide-y divide-line">
      {fit.parts.map((p) => {
        const pts = Math.round(p.weight * p.value);
        return (
          <li key={p.key} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[0.8125rem] font-medium text-ink">{p.label}</span>
              <span className="tnum text-[0.8125rem] text-ink">{pts}<span className="text-faint"> / {p.weight}</span></span>
            </div>
            <p className="mt-0.5 text-[0.8125rem] text-muted">{p.note}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function MechanismGrid({ pattern }: { pattern: TrendPattern }) {
  const m = pattern.mechanism;
  const rows: [string, string][] = [
    ["Hook", HOOK_TYPES[m.hook]],
    ["Format", m.formats.map((f) => FORMATS[f]).join(" + ")],
    ["Length", `${m.durationSec[0]} to ${m.durationSec[1]} seconds`],
    ["Pacing", m.pacing[0]!.toUpperCase() + m.pacing.slice(1)],
    ["First frame", m.firstFrame],
    ["Edit rhythm", m.editRhythm],
    ["Proof by", `${m.proofBySec} seconds`],
    ["CTA", CTAS[m.cta]],
    ["Audio", AUDIO[m.audio]],
    ["Emotion", EMOTIONS[m.emotion]],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-3.5">
      {rows.map(([k, v]) => (
        <div key={k} className={cn(k === "First frame" || k === "Edit rhythm" ? "col-span-2" : "")}>
          <dt className="text-xs font-medium text-muted">{k}</dt>
          <dd className="mt-0.5 text-sm text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdaptationList({ items, onUse }: { items: Adaptation[]; onUse?: (a: Adaptation) => void }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((a, i) => (
        <li key={i} className="flex items-start gap-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.0625rem] font-medium leading-snug text-ink">{a.hook}</p>
            <p className="mt-1 text-[0.8125rem] text-muted">{a.angle} {a.why}</p>
          </div>
          {onUse && <Button size="sm" variant="ghost" onClick={() => onUse(a)}>Use this</Button>}
        </li>
      ))}
    </ul>
  );
}
