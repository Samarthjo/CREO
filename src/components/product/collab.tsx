import { Warning, WarningOctagon, Info } from "@phosphor-icons/react/dist/ssr";
import { inr, round500 } from "@/lib/engine/format";
import { USAGE_LABEL } from "@/lib/engine/pricing";
import { scopeText } from "@/lib/engine/evaluate";
import type { Evaluation, Extraction, Signal, Span } from "@/lib/engine/types";
import { Chip, Mark, cn } from "../ui/kit";

/** The brand's own message, with every term CREO read marked in place. */
export function MessageHighlight({ raw, spans, sweep }: { raw: string; spans: Span[]; sweep?: boolean }) {
  const out: React.ReactNode[] = [];
  let at = 0;
  spans.forEach((s, i) => {
    if (s.start > at) out.push(<span key={`t${i}`}>{raw.slice(at, s.start)}</span>);
    out.push(
      <Mark key={`m${i}`} risk={s.kind === "risk"} sweep={sweep} delay={i * 140}>
        <span title={s.label}>{raw.slice(s.start, s.end)}</span>
      </Mark>,
    );
    at = s.end;
  });
  if (at < raw.length) out.push(<span key="end">{raw.slice(at)}</span>);
  return <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.75] text-ink">{out}</p>;
}

const Row = ({ k, v, ask }: { k: string; v: React.ReactNode; ask?: boolean }) => (
  <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-line py-2.5 last:border-b-0">
    <dt className="text-[0.8125rem] text-muted">{k}</dt>
    <dd className="text-sm text-ink">{ask ? <span className="text-faint">Not stated <Chip tone="outline" className="ml-1">Ask</Chip></span> : v}</dd>
  </div>
);

export function TermsList({ ex }: { ex: Extraction }) {
  const budget = ex.budgetKind === "cash" && ex.budgetInr ? `${inr(ex.budgetInr)}${ex.budgetPerUnit ? " per deliverable" : ""}` : ex.budgetKind === "barter" ? "Gifting, no cash" : ex.budgetKind === "commission" ? "Commission only" : null;
  const hasScope = ex.reels + ex.stories + ex.posts > 0;
  return (
    <dl>
      <Row k="Brand" v={[ex.brand, ex.contactName && `with ${ex.contactName}`].filter(Boolean).join(" ")} ask={!ex.brand} />
      <Row k="Deliverables" v={scopeText(ex.reels, ex.stories, ex.posts) + (ex.otherAsks.length ? `, plus ${ex.otherAsks.join(", ")}` : "")} ask={!hasScope} />
      <Row k="Budget" v={budget} ask={!budget} />
      <Row k="Timeline" v={ex.goLive ? `Go live by ${ex.goLive}${ex.urgent ? ", tight" : ""}` : null} ask={!ex.goLive} />
      <Row k="Usage" v={USAGE_LABEL[ex.usage] + (ex.usageDays && ((ex.usage === "paid-90" && ex.usageDays !== 90) || (ex.usage === "paid-30" && ex.usageDays !== 30)) ? ` (${ex.usageDays} days)` : "")} ask={ex.usage === "unknown"} />
      <Row k="Exclusivity" v={ex.exclusivityAsked ? (ex.exclusivityDays ? `${ex.exclusivityDays} days` : "Length not stated") : "None asked"} />
      <Row k="Payment" v={ex.paymentTerms} ask={!ex.paymentTerms} />
      <Row k="Revisions" v={ex.unlimitedRevisions ? "Unlimited" : ex.revisions === null ? null : String(ex.revisions)} ask={ex.revisions === null && !ex.unlimitedRevisions} />
    </dl>
  );
}

const SIG = { risk: { icon: WarningOctagon, tone: "risk" }, warn: { icon: Warning, tone: "neutral" }, info: { icon: Info, tone: "outline" } } as const;
export function SignalList({ signals }: { signals: Signal[] }) {
  if (!signals.length) return <p className="text-sm text-muted">No red flags found in this message.</p>;
  return (
    <ul className="space-y-3">
      {signals.map((s) => {
        const I = SIG[s.severity].icon;
        return (
          <li key={s.id} className="flex gap-3">
            <I size={18} className={cn("mt-0.5 shrink-0", s.severity === "risk" ? "text-risk" : "text-muted")} />
            <div>
              <p className="text-sm font-medium text-ink">{s.label}</p>
              <p className="text-[0.8125rem] text-muted">{s.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function QuotePanel({ ev }: { ev: Evaluation }) {
  const q = ev.quote;
  return (
    <div>
      <p className="text-[0.8125rem] text-muted">Quote range with your terms</p>
      <p className="mt-1 font-display text-[2.25rem] font-semibold leading-none tracking-tight text-ink"><span className="tnum">{inr(q.lowInr)}</span> to <span className="tnum">{inr(q.highInr)}</span></p>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div><dt className="text-xs text-muted">Open with</dt><dd className="tnum mt-0.5 text-lg font-semibold text-ink">{inr(round500(q.highInr))}</dd></div>
        <div><dt className="text-xs text-muted">Walk away below</dt><dd className="tnum mt-0.5 text-lg font-semibold text-ink"><Mark>{inr(q.walkAwayInr)}</Mark></dd></div>
      </dl>
      {ev.counter.changes.length > 0 && (
        <div className="mt-4 rounded-control bg-sunk p-3.5 text-[0.8125rem] text-body">
          <p className="mb-1 font-medium text-ink">If you accepted every term as asked: about {inr(round500(ev.asked.midInr))}</p>
          <ul className="space-y-0.5 text-muted">{ev.counter.changes.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      <details className="mt-4 group">
        <summary className="cursor-pointer text-[0.8125rem] font-medium text-muted underline-offset-4 hover:text-ink hover:underline">How this is priced</summary>
        <ol className="mt-2 divide-y divide-line">
          {q.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 text-[0.8125rem]">
              <span className="font-medium text-ink">{s.label}</span>
              <span className="tnum text-right text-ink">{s.value}</span>
              {s.note && <span className="col-span-2 text-muted">{s.note}</span>}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
