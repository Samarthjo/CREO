"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { inr } from "@/lib/engine/format";
import { Logo } from "../product/logo";
import { MemoryRow } from "../product/memory";
import { ActionRow, HeroAction } from "../product/brief";
import { LivePackage } from "./live-package";
import { QuotePanel, TermsList } from "../product/collab";
import { Mark, cn } from "../ui/kit";
import { demoPackage, getDemo } from "./demo";
import { Section, SectionHead } from "./section";

const STEPS = [
  { id: "hq", label: "Start from the brief", page: "HQ" },
  { id: "studio", label: "Make the package", page: "Studio" },
  { id: "collab", label: "Price the deal", page: "Collab Inbox" },
  { id: "memory", label: "Learn from it", page: "Memory" },
] as const;
const DWELL = 8000;

export function Experience() {
  const { ws, insights, brief } = getDemo();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hold, setHold] = useState(false);
  const pkg = useMemo(() => demoPackage({ topic: "client reports", proof: "a client report in 4 minutes", lengthSec: 30, language: "English", trendId: "tp-result-reveal" }), []);
  const q = ws.inquiries[0]!;

  useEffect(() => {
    if (!auto || hold || reduce) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), DWELL);
    return () => clearTimeout(t);
  }, [step, auto, hold, reduce]);

  const used = [
    insights.lines[0]!,
    ws.memory.find((m) => m.rule?.type === "hook-style")!.text,
    `Minimum ${inr(ws.dna.rules.minReelInr)} per Reel. Exclusivity up to ${ws.dna.rules.maxExclusivityDays} days. No gifting-only deals.`,
    ws.memory.find((m) => m.kind === "outcome")!.text,
  ];

  return (
    <Section id="experience" band>
      <SectionHead title="One manager, one memory." sub="Trend, Studio and Collab Inbox read from the same Creator DNA, so each answer builds on the last one." />
      <div onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
        <div className="overflow-hidden rounded-[1.5rem] border border-line-strong bg-bg shadow-pop">
          <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
            <div className="flex items-center gap-3"><Logo word={false} /><span className="text-sm font-medium text-ink">{STEPS[step]!.page}</span></div>
            <span className="text-xs text-muted">Sample creator: {ws.dna.name}</span>
          </div>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <div className="h-[36rem] overflow-y-auto p-6 scroll-thin">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.28 }}>
                  {step === 0 && (
                    <div className="flex flex-col gap-5">
                      <HeroAction action={brief.recommended} found={brief.found} name="Arjun" date="Today" />
                      <ul className="rounded-panel border border-line bg-surface px-5">{brief.actions.slice(1, 3).map((a, i) => <ActionRow key={a.id} action={a} rank={i + 2} compact />)}</ul>
                    </div>
                  )}
                  {step === 1 && <LivePackage pkg={pkg} />}
                  {step === 2 && (
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="rounded-panel border border-line bg-surface p-5"><p className="mb-1 font-display text-lg font-semibold">{q.extraction.brand} asks for a launch campaign</p><TermsList ex={q.extraction} /></div>
                      <div className="rounded-panel border border-line bg-surface p-5"><QuotePanel ev={q.evaluation} /></div>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="rounded-panel border border-line bg-surface px-5">
                      <ul>{ws.memory.filter((m) => m.kind !== "preference").slice(0, 4).map((m) => <MemoryRow key={m.id} item={m} />)}</ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <aside className="border-t border-line bg-sunk/60 p-5 lg:border-l lg:border-t-0" aria-label="What this step used">
              <p className="text-sm font-semibold text-ink">From Creator DNA and Memory</p>
              <p className="mt-1 text-xs text-muted">Every step reads the same profile.</p>
              <ul className="mt-5 space-y-4">
                {used.map((u, i) => (
                  <li key={i} className={cn("text-[0.8125rem] leading-snug transition-colors duration-300", i === step ? "text-ink" : "text-faint")}>
                    {i === step ? <Mark key={`${step}-${u}`} sweep>{u}</Mark> : u}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>

        <div role="tablist" aria-label="Product walkthrough" className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <button key={s.id} role="tab" type="button" aria-selected={step === i} onClick={() => { setStep(i); setAuto(false); }} className="group text-left">
              <span className={cn("block text-[0.9375rem] font-medium transition", step === i ? "text-ink" : "text-muted group-hover:text-ink")}>{s.label}</span>
              <span className="mt-2 block h-0.5 overflow-hidden rounded-full bg-line-strong">
                {step === i && (auto && !reduce ? <motion.span key={`${step}-${hold}`} className="block h-full origin-left bg-ink" initial={{ scaleX: 0 }} animate={{ scaleX: hold ? 0 : 1 }} transition={{ duration: hold ? 0 : DWELL / 1000, ease: "linear" }} /> : <span className="block h-full bg-ink" />)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}
