import { ChartLineUp, FilmSlate, SealCheck, Tray } from "@phosphor-icons/react/dist/ssr";
import type { Action, Brief } from "@/lib/engine/brief";
import type { Evaluation } from "@/lib/engine/types";
import { Button, Chip, FitScore, cn } from "../ui/kit";

const ICON = { create: FilmSlate, "review-deal": Tray, approve: SealCheck, "log-result": ChartLineUp } as const;

export const HEALTH_LABEL: Record<Evaluation["health"], string> = { strong: "Strong", workable: "Workable", risky: "Risky", avoid: "Avoid" };
export const healthTone = (h: Evaluation["health"]) => (h === "strong" ? "ok" : h === "workable" ? "neutral" : "risk") as "ok" | "neutral" | "risk";

export function ActionRow({ action, rank, compact, onGo }: { action: Action; rank?: number; compact?: boolean; onGo?: () => void }) {
  const Icon = ICON[action.kind];
  return (
    <li className={cn("flex items-start gap-4 border-b border-line last:border-b-0", compact ? "py-3.5" : "py-4")}>
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sunk text-ink">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-medium text-ink">
          {rank ? <span className="tnum mr-2 text-muted">{rank}</span> : null}
          {action.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-snug text-muted">{action.subject ? <span className="font-medium text-ink">{action.subject}. </span> : null}{action.why}</p>
      </div>
      {action.fit ? <FitScore score={action.fit} size={44} /> : null}
      <Button size="sm" variant="ghost" href={onGo ? undefined : action.href} onClick={onGo} className="self-center">
        {action.cta}
      </Button>
    </li>
  );
}

export function HeroAction({ action, found, name, date }: { action: Action | null; found: Brief["found"]; name: string; date: string }) {
  const stats = [
    { n: found.patterns, label: "patterns worth your time", href: "/app/trend" },
    { n: found.drafts, label: "content drafts ready", href: "/app/studio" },
    { n: found.inquiries, label: found.inquiries === 1 ? "brand inquiry to review" : "brand inquiries to review", href: "/app/collabs" },
  ];
  return (
    <section className="on-ink overflow-hidden rounded-panel bg-ink text-bg shadow-pop" aria-label="Morning brief">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-sm text-bg/70">{date}. Recommended next action</p>
          {action ? (
            <>
              <h2 className="mt-3 max-w-[18ch] font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-bg">{action.title}</h2>
              {action.subject && <p className="mt-3 max-w-[40ch] font-display text-[1.25rem] font-medium leading-snug text-bg/90">{action.subject}</p>}
              <p className="mt-3 max-w-[56ch] text-[0.9375rem] leading-relaxed text-bg/80">
                <span className="font-semibold text-bg">Why now:</span> {action.why}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Button variant="primary" size="lg" href={action.href}>{action.cta}</Button>
              </div>
            </>
          ) : (
            <h2 className="mt-3 max-w-[20ch] font-display text-[2.25rem] font-semibold leading-tight text-bg">Nothing urgent, {name}. Add a trend or an inquiry.</h2>
          )}
        </div>
        {action?.fit ? <FitScore score={action.fit} size={92} inverse /> : null}
      </div>
      <dl className="grid grid-cols-3 border-t border-bg/15">
        {stats.map((s, i) => (
          <a key={s.label} href={s.href} className={cn("group px-4 py-4 transition hover:bg-bg/5 sm:px-8 sm:py-5", i > 0 && "border-l border-bg/15")}>
            <dt className="sr-only">{s.label}</dt>
            <dd className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
              <span className="tnum font-display text-[2rem] font-semibold leading-none text-bg">{s.n}</span>
              <span className="text-[0.8125rem] text-bg/70">{s.label}</span>
            </dd>
          </a>
        ))}
      </dl>
    </section>
  );
}

export { Chip };
