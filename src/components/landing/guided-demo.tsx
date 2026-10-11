"use client";

import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { Logo } from "../product/logo";
import { Accent, Button, Chip, ExampleTag, FitScore, Slots, cn } from "../ui/kit";
import { demoLesson, demoPackage, getDemo } from "./demo";

const STEPS = [
  { id: "problem", label: "Problem" },
  { id: "fit", label: "Fit" },
  { id: "draft", label: "Draft" },
  { id: "learning", label: "Learning" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

const TITLE = "font-display text-[clamp(1.6rem,3.2vw,2.5rem)] font-[680] leading-[1.06] tracking-[-0.035em] text-ink max-w-[24ch]";
const CARD = "rounded-panel border border-line bg-surface p-4 sm:p-5";

/**
 * One fixed, guided demo in four slides: Problem, Fit, Draft, Learning. Manual controls only, nothing plays by itself.
 * A made-up creator and numbers from the same engines as the app; every number is labelled Example.
 */
export function GuidedDemo() {
  const { ws, ranked, brief } = getDemo();
  const top = brief.actions.find((a) => a.kind === "create")!;
  const trendId = top.id.replace("create-", "");
  const best = ranked.find((r) => r.pattern.id === trendId)!;
  const why = best.fit.parts.slice(0, 2).map((p) => p.note);
  const rest = ranked.filter((r) => r !== best).slice(0, 3);
  const pkg = useMemo(() => demoPackage({ topic: "competitor research", proof: "6 hours saved a week", lengthSec: 30, language: "English", trendId }), [trendId]);
  const lesson = demoLesson();

  const [i, setI] = useState(0);
  const [hookId, setHookId] = useState(pkg.chosenHook);
  const [approved, setApproved] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const go = (to: number, via: "next" | "back" | "tab" | "key") => {
    const n = Math.max(0, Math.min(STEPS.length - 1, to));
    if (n === i) return;
    setI(n);
    track("demo_step", { step: STEPS[n]!.id, via });
  };
  const onKey = (e: React.KeyboardEvent) => {
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? STEPS.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const n = Math.max(0, Math.min(STEPS.length - 1, to));
    go(n, "key");
    tabs.current[n]?.focus();
  };

  const hook = pkg.hooks.find((h) => h.id === hookId) ?? pkg.hooks[0]!;
  const beats = pkg.script.map((b) => (b.id === "hook" ? { ...b, line: hook.text } : b)).slice(0, 4);
  const step: StepId = STEPS[i]!.id;
  const last = i === STEPS.length - 1;

  return (
    <div className="glow relative mx-auto w-full max-w-[64rem]" data-demo="guided">
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-bg shadow-pop">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <Logo word={false} />
          <span className="flex items-center gap-2 text-[0.8125rem] text-muted"><ExampleTag /> <span className="hidden sm:inline">Made-up creator, sample numbers</span></span>
        </div>

        <div role="tablist" aria-label="Guided demo, four steps" onKeyDown={onKey} className="flex gap-1 border-b border-line bg-surface/60 px-3 py-2 sm:px-5">
          {STEPS.map((s, n) => {
            const on = n === i;
            return (
              <button
                key={s.id}
                ref={(el) => { tabs.current[n] = el; }}
                type="button"
                role="tab"
                id={`demo-tab-${s.id}`}
                aria-selected={on}
                aria-controls="demo-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => go(n, "tab")}
                className={cn("flex min-h-9 items-center justify-center gap-2 rounded-full px-2 text-[0.8125rem] font-medium leading-5 transition pointer-coarse:min-h-11 sm:flex-none sm:px-4", on ? "flex-[2.4] bg-eyebrow text-on-eyebrow" : "flex-1 text-muted hover:bg-sunk hover:text-ink")}
              >
                <span className={cn("tnum grid size-5 place-items-center rounded-full text-[0.6875rem] font-semibold", on ? "bg-bg/30" : n < i ? "bg-cta text-on-cta" : "border border-line-strong")}>{n < i ? <Check size={11} weight="bold" /> : n + 1}</span>
                <span className={on ? undefined : "max-sm:sr-only"}>{s.label}</span>
              </button>
            );
          })}
        </div>

        <div id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${step}`} className="min-h-[27rem] p-5 sm:p-7 md:min-h-[28rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26 }}>
              {step === "problem" && (
                <div>
                  <h2 className={TITLE}>You saved ten trends. None tells you what <Accent>fits you.</Accent></h2>
                  <ul className="mt-6 flex flex-wrap gap-2" aria-label="Ten saved trends">
                    {ws.patterns.map((p) => (
                      <li key={p.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.8125rem] leading-snug text-body">
                        {p.title}
                        <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-full bg-sunk text-[0.625rem] font-semibold text-faint">?</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">Ten ideas with the same weight, and nothing that says which one is yours. Bring one idea and your post history, and CREO sorts it out.</p>
                </div>
              )}

              {step === "fit" && (
                <div>
                  <h2 className={TITLE}>One of them fits you. <Accent>CREO shows why.</Accent></h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="rounded-panel border border-line bg-soft p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[0.8125rem] font-medium text-accent">A recommendation, scored against your history</p>
                          <p className="mt-1 font-display text-[1.25rem] font-medium leading-snug tracking-tight text-ink">{best.pattern.title}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1.5"><FitScore score={best.fit.score} size={60} /><ExampleTag /></div>
                      </div>
                      <p className="mt-4 text-[0.8125rem] font-semibold text-ink">Why it fits you</p>
                      <ul className="mt-2 space-y-1.5 text-[0.8125rem] leading-snug text-body">
                        {why.map((w) => <li key={w} className="flex gap-2"><Check size={14} weight="bold" className="mt-0.5 shrink-0 text-accent" /><span>{w}</span></li>)}
                      </ul>
                    </div>
                    <div className={CARD}>
                      <p className="text-[0.8125rem] font-medium text-ink">The rest, ranked the same way</p>
                      <ul className="mt-2 divide-y divide-line">
                        {rest.map((r) => (
                          <li key={r.pattern.id} className="flex items-center justify-between gap-3 py-2 text-[0.8125rem] text-muted">
                            <span className="min-w-0 truncate">{r.pattern.title}</span>
                            <span className="tnum shrink-0 font-semibold text-body">{r.fit.score}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-faint">and {ranked.length - 1 - rest.length} more below</p>
                    </div>
                  </div>
                </div>
              )}

              {step === "draft" && (
                <div>
                  <h2 className={TITLE}>Then it shapes the draft. <Accent>You keep the final say.</Accent></h2>
                  <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className={CARD}>
                      <p className="text-[0.8125rem] font-medium text-ink">3 hooks. Pick the one that sounds like you.</p>
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
                    <div className={CARD}>
                      <p className="text-[0.8125rem] font-medium text-ink">Script, {pkg.lengthSec} seconds</p>
                      <ol className="mt-2 space-y-2">
                        {beats.map((b) => (
                          <li key={b.id} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 text-[0.8125rem] leading-snug">
                            <span className="tnum text-xs text-faint">{b.at}</span>
                            <span className="text-body"><Slots text={b.line} /></span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
                        <Button size="sm" variant={approved ? "ghost" : "dark"} aria-pressed={approved} onClick={() => setApproved((a) => !a)}>{approved ? "Approved" : "Approve draft"}</Button>
                        <span className="text-[0.8125rem] text-muted">{approved ? "You post it. CREO never posts for you." : "Nothing is posted until you approve."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === "learning" && (
                <div>
                  <h2 className={TITLE}>You post it and bring back the numbers. <Accent>CREO learns.</Accent></h2>
                  <div className="mt-5 grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <div className={CARD}>
                      <p className="flex items-center justify-between gap-2 text-[0.8125rem] font-medium text-ink">The result <ExampleTag /></p>
                      <p className="tnum mt-4 font-display text-[2.6rem] font-[650] leading-none tracking-[-0.04em] text-ink">{lesson.lift.toFixed(1)}x</p>
                      <p className="mt-2 text-[0.8125rem] text-muted">views against your usual, on the post you approved</p>
                    </div>
                    <ArrowRight aria-hidden size={20} className="hidden self-center text-faint md:block" />
                    <div className={CARD}>
                      <p className="flex items-center justify-between gap-2 text-[0.8125rem] font-medium text-ink">The lesson <ExampleTag /></p>
                      <p className="tnum mt-4 font-display text-[2.6rem] font-[650] leading-none tracking-[-0.04em] text-ink">{lesson.before.toFixed(1)}x <span className="text-accent">to {lesson.after.toFixed(1)}x</span></p>
                      <p className="mt-2 text-[0.8125rem] text-muted">{lesson.hook} hooks, scored on your posts</p>
                    </div>
                    <ArrowRight aria-hidden size={20} className="hidden self-center text-faint md:block" />
                    <div className={cn(CARD, "bg-soft")}>
                      <p className="text-[0.8125rem] font-medium text-ink">Next time</p>
                      <p className="mt-4 font-display text-[1.25rem] font-medium leading-snug tracking-tight text-ink">The next draft opens with the result.</p>
                      <p className="mt-2 text-[0.8125rem] text-muted">It starts from what worked for you, not from zero.</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[0.8125rem] text-muted">These numbers are an example. In the programme, the result comes from your own post.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 sm:px-6">
          <Button size="md" variant="ghost" onClick={() => go(i - 1, "back")} disabled={i === 0} aria-label="Previous step"><ArrowLeft size={16} /> <span className="max-[400px]:sr-only">Back</span></Button>
          <span className="tnum text-[0.8125rem] text-muted" aria-live="polite">Step {i + 1} of {STEPS.length}</span>
          {last ? (
            <Button size="md" variant="primary" href="/cohort#apply" data-track="join_cohort" data-track-where="demo">
              <span className="max-sm:hidden">Apply for the 30-day programme</span><span className="sm:hidden">Apply</span>
            </Button>
          ) : (
            <Button size="md" variant="dark" onClick={() => go(i + 1, "next")} aria-label="Next step"><span className="max-[400px]:sr-only">Next</span> <ArrowRight size={16} /></Button>
          )}
        </div>
      </div>
    </div>
  );
}
