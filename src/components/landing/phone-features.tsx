"use client";

import { ArrowUpRight, Brain, FilmSlate, Tray, TrendUp } from "@phosphor-icons/react";
import { useMemo } from "react";
import { track } from "@/lib/analytics";
import { inr, round500 } from "@/lib/engine/format";
import { Accent, cn } from "../ui/kit";
import { useReduce } from "../ui/use-reduce";
import { demoPackage, getDemo } from "./demo";
import { OPEN_FEATURE } from "./hero-product";
import { Reveal } from "./reveal";

type Feature = "trend" | "studio" | "collab" | "memory";

/**
 * Phone only: the four tools on one screen, each with what it does and one question to be curious about.
 * HQ is not here: it is where the dashboard starts, not a tool. Tapping a tool opens it in the dashboard above.
 * Every number comes from the same sample workspace as the dashboard (demo.ts), so the two never disagree.
 */
export function PhoneFeatures() {
  const reduce = useReduce();
  const f = useMemo(() => {
    const { brief, ranked, ws } = getDemo();
    const top = brief.actions.find((a) => a.kind === "create")!;
    const trendId = top.id.replace("create-", "");
    const pkg = demoPackage({ topic: "competitor research", proof: "6 hours saved a week", lengthSec: 30, language: "English", trendId });
    const q = ws.inquiries[0]!;
    return { fit: top.fit ?? 0, ideas: ranked.length, hooks: pkg.hooks.length, shots: pkg.shots.length, len: pkg.lengthSec, offer: inr(q.extraction.budgetInr ?? 0), days: q.extraction.exclusivityDays ?? 0, counter: inr(round500(q.evaluation.quote.highInr)), kept: ws.memory.length };
  }, []);

  const items: { id: Feature; name: string; icon: typeof TrendUp; what: string; ask: string }[] = [
    { id: "trend", name: "Trend", icon: TrendUp, what: "Ranks your saved ideas by fit with your history.", ask: `Today's #1 fits you ${f.fit} out of 100. Why?` },
    { id: "studio", name: "Studio", icon: FilmSlate, what: "Drafts hooks, a script and shots in your voice.", ask: `${f.hooks} hooks, ${f.shots} shots. Which sounds like you?` },
    { id: "collab", name: "Collab Inbox", icon: Tray, what: "Prices a brand offer and drafts your counter.", ask: `${f.offer} offer, ${f.days} days exclusive. Worth\u00a0it?` },
    { id: "memory", name: "Memory", icon: Brain, what: "Keeps every approval and edit, so drafts keep improving.", ask: `${f.kept} decisions kept. See what it learned.` },
  ];

  const open = (id: Feature) => {
    track("feature_open", { feature: id });
    document.getElementById("product")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.dispatchEvent(new CustomEvent(OPEN_FEATURE, { detail: id }));
  };

  return (
    <section id="features" aria-labelledby="features-title" className="relative isolate flex min-h-svh flex-col justify-center px-4 pb-8 pt-[5.5rem] [@media(max-height:780px)]:pb-6 [@media(max-height:780px)]:pt-[5rem] sm:hidden">
      <Reveal>
        <div className="mb-7 px-1 text-center [@media(max-height:780px)]:mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Inside the workspace</p>
          <h2 id="features-title" className="mx-auto mt-3 max-w-[14ch] font-display text-[2.125rem] font-normal leading-[1.04] tracking-[-0.04em] [@media(max-height:780px)]:mt-2 [@media(max-height:780px)]:text-[1.875rem]">Four tools that learn <Accent>you</Accent>.</h2>
          <p className="mx-auto mt-3 max-w-[26ch] text-[0.9375rem] leading-snug text-muted [@media(max-height:780px)]:hidden">Tap one to try it on the dashboard.</p>
        </div>
        <ul className="space-y-2.5 [@media(max-height:780px)]:space-y-2">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.id}>
                <button type="button" onClick={() => open(it.id)} className={cn("group flex w-full items-start gap-3.5 rounded-panel border border-line bg-surface/90 p-4 [@media(max-height:780px)]:p-3.5 text-left shadow-panel backdrop-blur-sm transition active:translate-y-px active:bg-soft")}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-soft text-accent"><Icon size={22} weight="fill" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-[1.1875rem] font-medium leading-tight tracking-tight text-ink">{it.name}</span>
                      <ArrowUpRight size={16} className="shrink-0 text-muted" aria-hidden />
                    </span>
                    <span className="mt-0.5 block text-pretty text-[0.875rem] leading-snug text-body">{it.what}</span>
                    <span className="mt-2 [@media(max-height:780px)]:mt-1.5 flex items-start gap-2 text-[0.8125rem] font-medium leading-snug text-accent">
                      <span aria-hidden className="mt-[0.4rem] size-1.5 shrink-0 rounded-full bg-mark" />
                      {it.ask}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
