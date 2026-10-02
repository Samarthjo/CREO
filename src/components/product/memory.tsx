import { ArrowBendDownRight, CheckCircle, Notebook, PencilSimple, ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import type { MemoryItem } from "@/lib/engine/types";
import { Chip, cn } from "../ui/kit";

const SOURCE = { studio: "Studio", collab: "Collab Inbox", trend: "Trend", hq: "HQ", manual: "You" } as const;
const KIND = {
  preference: { label: "Preference", icon: Notebook },
  decision: { label: "Decision", icon: CheckCircle },
  correction: { label: "Correction", icon: PencilSimple },
  outcome: { label: "Result", icon: ChartLineUp },
} as const;

export function MemoryRow({ item, compact, onRemove }: { item: MemoryItem; compact?: boolean; onRemove?: () => void }) {
  const K = KIND[item.kind];
  const d = item.detail;
  return (
    <li className={cn("flex gap-3.5 border-b border-line last:border-b-0", compact ? "py-3" : "py-4")}>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-sunk text-ink"><K.icon size={16} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={item.kind === "preference" ? "mark" : "neutral"}>{K.label}</Chip>
          {item.rule && item.rule.type !== "note" && <Chip tone="outline">Used by Studio</Chip>}
          <span className="text-xs text-muted">{SOURCE[item.source]}</span>
          <span className="text-xs text-faint">{new Date(item.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        </div>
        <p className="mt-1.5 text-sm text-ink">{item.text}</p>
        {!compact && d && (d.ai || d.human) && (
          <div className="mt-2 space-y-1 rounded-control bg-sunk p-3 text-[0.8125rem]">
            {d.ai && <p className="text-muted"><span className="font-medium text-ink">AI wrote</span> {d.ai}</p>}
            {d.human && <p className="flex gap-1.5 text-ink"><ArrowBendDownRight size={14} className="mt-1 shrink-0 text-muted" /><span><span className="font-medium">Changed to</span> {d.human}</span></p>}
            {d.reason && <p className="text-muted"><span className="font-medium text-ink">Why</span> {d.reason}</p>}
          </div>
        )}
        {!compact && d?.result && <p className="mt-1.5 text-[0.8125rem] text-muted">Result: {d.result}</p>}
      </div>
      {onRemove && <button type="button" onClick={onRemove} className="self-start text-xs text-muted underline-offset-4 hover:text-ink hover:underline">Remove</button>}
    </li>
  );
}
