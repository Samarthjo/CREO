"use client";

import { Brain, CaretLeft, Check, FilmSlate, SquaresFour, Tray, TrendUp, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { inr, round500 } from "@/lib/engine/format";
import { Logo } from "../product/logo";
import { Button, Chip, FitScore, Mark, Slots, cn } from "../ui/kit";
import { demoPackage, getDemo } from "./demo";

type View = "hq" | "studio";

const SIDE = [
  { id: "hq", label: "HQ", icon: SquaresFour },
  { id: "trend", label: "Trend", icon: TrendUp },
  { id: "studio", label: "Studio", icon: FilmSlate },
  { id: "collab", label: "Collab Inbox", icon: Tray, badge: 1 },
  { id: "memory", label: "Memory", icon: Brain },
] as const;

/**
 * The hero is the product: a working CREO window on a sample creator.
 * Notification arrives, the trend card opens on its reasons, and "Open in Studio" builds the package in front of you.
 * Every number comes from the same engines the app uses.
 */
export function HeroProduct() {
  const { brief, ranked, ws } = getDemo();
  const reduce = useReducedMotion();
  const top = brief.actions.find((a) => a.kind === "create")!;
  const trendId = top.id.replace("create-", "");
  const why = ranked.find((r) => r.pattern.id === trendId)?.fit.parts.slice(0, 2).map((p) => p.note) ?? [];
  const q = ws.inquiries[0]!;
  const pkg = useMemo(() => demoPackage({ topic: "competitor research", proof: "6 hours saved a week", lengthSec: 30, language: "English", trendId }), [trendId]);

  const [view, setView] = useState<View>("hq");
  const [toast, setToast] = useState(false);
  const [flash, setFlash] = useState(false);
  const [approved, setApproved] = useState(false);
  const [stage, setStage] = useState(0);
  const [hookId, setHookId] = useState(pkg.chosenHook);

  useEffect(() => {
    const t = setTimeout(() => setToast(true), reduce ? 0 : 2400);
    return () => clearTimeout(t);
  }, [reduce]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 9000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (view !== "studio") { setStage(0); return; }
    if (reduce) { setStage(3); return; }
    const ids = [450, 1000, 1550].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => ids.forEach(clearTimeout);
  }, [view, reduce]);

  const hook = pkg.hooks.find((h) => h.id === hookId) ?? pkg.hooks[0]!;
  const beats = pkg.script.map((b) => (b.id === "hook" ? { ...b, line: hook.text } : b)).slice(0, 4);
  const review = () => { setToast(false); setView("hq"); setFlash(true); setTimeout(() => setFlash(false), 2200); };
  const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.28 } };

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.25 }}
      className="relative mx-auto w-full max-w-[64rem]"
    >
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-bg shadow-pop">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <Logo word={false} />
          <span className="text-xs text-muted">Sample creator: {ws.dna.name}, 27K followers</span>
          <Chip tone="lime">Sample data</Chip>
        </div>

        <div className="grid md:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="hidden border-r border-line bg-surface/60 p-4 md:block" aria-label="Sample workspace navigation">
            <div className="mb-5 flex items-center gap-2.5 px-1.5">
              <span className="grid size-8 place-items-center rounded-full bg-ink text-[0.6875rem] font-semibold text-bg">AK</span>
              <span className="text-sm font-medium text-ink">Arjun</span>
            </div>
            <ul className="flex flex-col gap-0.5">
              {SIDE.map((s) => {
                const Icon = s.icon;
                const live = s.id === "hq" || s.id === "studio";
                const on = s.id === view;
                const row = (
                  <>
                    <Icon size={18} weight={on ? "fill" : "regular"} />
                    <span className="flex-1 text-left">{s.label}</span>
                    {"badge" in s && <span className="grid size-5 place-items-center rounded-full bg-mark text-[0.6875rem] font-semibold text-on-mark">{s.badge}</span>}
                  </>
                );
                const cls = cn("flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-[0.8125rem] font-medium", on ? "bg-eyebrow text-on-eyebrow" : "text-muted");
                return (
                  <li key={s.id}>
                    {live ? <button type="button" onClick={() => setView(s.id as View)} aria-current={on ? "page" : undefined} className={cn(cls, !on && "transition hover:bg-sunk hover:text-ink")}>{row}</button> : <div className={cls} aria-hidden>{row}</div>}
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="relative min-h-[26rem] min-w-0 p-5 sm:p-7 md:h-[30rem] md:overflow-y-auto scroll-thin">
            <div className="mb-5 flex gap-1 md:hidden" role="tablist" aria-label="Sample workspace">
              {(["hq", "studio"] as const).map((v) => (
                <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cn("rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium", view === v ? "bg-eyebrow text-on-eyebrow" : "text-muted")}>{v === "hq" ? "HQ" : "Studio"}</button>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {view === "hq" ? (
                <motion.div key="hq" {...fade}>
                  <h2 className="mb-4 font-display text-[1.75rem] font-medium tracking-tight sm:text-[2rem]">Good morning, Arjun.</h2>

                  <div className="mt-4 rounded-panel border border-line bg-soft p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] font-medium text-accent">{top.title}</p>
                        <p className="mt-1 font-display text-[1.25rem] font-medium leading-snug tracking-tight text-ink">{top.subject}</p>
                      </div>
                      {top.fit ? <FitScore score={top.fit} size={56} /> : null}
                    </div>
                    <p className="mt-4 text-[0.8125rem] font-medium text-ink"><Mark sweep delay={500}>Why now</Mark></p>
                    <ul className="mt-2 space-y-1 text-[0.8125rem] leading-snug text-muted">
                      {why.map((w, i) => (
                        <motion.li key={w} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.18, duration: 0.35 }}>{w}</motion.li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button variant="primary" size="md" onClick={() => setView("studio")}>Open in Studio</Button>
                    </div>
                  </div>

                  <ul className="mt-3 divide-y divide-line rounded-panel border border-line bg-surface px-5">
                    <li className={cn("py-3.5 transition-colors", flash && "bg-eyebrow")}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sunk text-ink"><Tray size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.8125rem] font-medium text-ink">Counter to {q.extraction.brand}</p>
                          <p className="text-xs text-muted"><span className="tnum">{inr(q.evaluation.quote.lowInr)} to {inr(q.evaluation.quote.highInr)}</span>. Walk away below <span className="tnum">{inr(round500(q.evaluation.quote.walkAwayInr))}</span>.</p>
                        </div>
                        <Button size="sm" variant={approved ? "ghost" : "dark"} aria-pressed={approved} onClick={() => setApproved((a) => !a)}>{approved ? "Approved" : "Approve"}</Button>
                      </div>
                      <p className="mt-1.5 pl-11 text-xs text-muted">{approved ? "You send it. CREO never sends for you." : "Nothing is sent until you approve."}</p>
                    </li>
                  </ul>
                </motion.div>
              ) : (
                <motion.div key="studio" {...fade}>
                  <button type="button" onClick={() => setView("hq")} className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-muted transition hover:text-ink"><CaretLeft size={14} /> HQ</button>
                  <h2 className="font-display text-[1.5rem] font-medium leading-tight tracking-tight sm:text-[1.75rem]">{top.subject}</h2>
                  <p className="mt-1 text-[0.8125rem] text-muted">Your package, built from your Creator DNA.</p>

                  <ol className="mt-4 flex flex-wrap gap-2" aria-label="Progress">
                    {["Hooks", "Script", "Shot list"].map((l, i) => (
                      <li key={l} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors", stage > i ? "bg-eyebrow text-on-eyebrow" : "bg-sunk text-faint")}>
                        {stage > i ? <Check size={12} weight="bold" /> : <span className="size-1.5 rounded-full bg-current opacity-60" />} {l}
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className={cn("rounded-panel border border-line bg-surface p-4 transition-opacity duration-500", stage < 1 && "opacity-30")}>
                      <p className="text-[0.8125rem] font-medium text-ink">3 hooks</p>
                      <ul className="mt-2 space-y-1.5" role="radiogroup" aria-label="Choose the opening hook">
                        {pkg.hooks.map((h) => (
                          <li key={h.id}>
                            <button type="button" role="radio" aria-checked={h.id === hook.id} onClick={() => setHookId(h.id)} className={cn("w-full rounded-control border px-3 py-2 text-left text-[0.8125rem] leading-snug transition", h.id === hook.id ? "border-accent bg-soft text-ink" : "border-line text-muted hover:text-ink")}>
                              <span className="mb-0.5 flex items-center gap-1.5 text-[0.6875rem] font-medium text-muted">{h.style}{h.recommended && <Chip tone="lime" className="py-0 text-[0.625rem]">best for you</Chip>}</span>
                              {h.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className={cn("rounded-panel border border-line bg-surface p-4 transition-opacity duration-500", stage < 2 && "opacity-30")}>
                        <p className="text-[0.8125rem] font-medium text-ink">Script, {pkg.lengthSec} seconds</p>
                        <ol className="mt-2 space-y-2">
                          {beats.map((b) => (
                            <li key={b.id} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 text-[0.8125rem] leading-snug">
                              <span className="tnum text-xs text-faint">{b.at}</span>
                              <span className="text-body"><Slots text={b.line} /></span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className={cn("rounded-panel border border-line bg-surface p-4 transition-opacity duration-500", stage < 3 && "opacity-30")}>
                        <p className="text-[0.8125rem] font-medium text-ink">{pkg.shots.length} shots planned</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{pkg.shots.slice(0, 3).map((s) => s.kind).join(", ")}. Caption and CTA ready.</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted">Nothing is posted until you approve. <Link href="/app/studio" className="font-medium text-ink underline underline-offset-4 hover:no-underline">Open the full Studio</Link></p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {toast && view === "hq" && (
                <motion.div
                  role="status"
                  initial={{ opacity: 0, y: -14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 160, damping: 20 }}
                  className="absolute right-4 top-4 z-10 w-[min(19rem,calc(100%-2rem))] rounded-panel border border-line bg-raised p-3.5 shadow-pop"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mark text-on-mark"><Tray size={16} weight="fill" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-medium text-ink">New brand inquiry</p>
                      <p className="mt-0.5 text-xs leading-snug text-muted">{q.extraction.brand} offers <span className="tnum">{inr(12000)}</span>. CREO priced it at <span className="tnum">{inr(q.evaluation.quote.lowInr)}</span> and up.</p>
                      <button type="button" onClick={review} className="mt-2 text-xs font-medium text-ink underline underline-offset-4 hover:no-underline">Review counter</button>
                    </div>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(false)} className="grid size-6 place-items-center rounded-full text-muted hover:bg-sunk hover:text-ink"><X size={12} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
