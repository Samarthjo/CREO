"use client";

import { Brain, ChartLineUp, Compass, MagnifyingGlass, PaperPlaneTilt, PencilSimpleLine } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Accent, Chip, Eyebrow, FitScore, Mark, cn } from "../ui/kit";
import { Ripples } from "../scene/backdrop";
import { demoPackage, getDemo } from "./demo";
import { usePinnedSteps } from "./use-pinned-steps";

const STEPS = [
  { id: "recommend", title: "CREO recommends", body: "A pattern, scored against your own history, with the reasons shown.", icon: Compass },
  { id: "edit", title: "You edit or approve", body: "You change what is off, or approve it as it is. CREO keeps the before, the after and your reason.", icon: PencilSimpleLine },
  { id: "publish", title: "You publish", body: "Nothing goes out without your approval, and you post it your way.", icon: PaperPlaneTilt },
  { id: "perform", title: "The content performs", body: "Views, saves, shares and comments come back from the post.", icon: ChartLineUp },
  { id: "analyze", title: "CREO analyzes the result", body: "It compares the post with what it expected and with your usual numbers, and works out why.", icon: MagnifyingGlass },
  { id: "improve", title: "Your Creator Intelligence improves", body: "The result and your reason join your Creator Memory, so the next recommendation starts from evidence.", icon: Brain },
] as const;

const N = STEPS.length;
const pos = (i: number, r = 40) => {
  const a = (-90 + (360 / N) * i) * (Math.PI / 180);
  return { left: `${50 + r * Math.cos(a)}%`, top: `${50 + r * Math.sin(a)}%` };
};

/** The learning loop, CREO's main idea: recommendations meet real outcomes. Illustrative sequence on a made-up creator. */
export function LoopSection() {
  const { ref, pinned, active, go } = usePinnedSteps(N);
  const { brief } = getDemo();
  const top = brief.actions.find((a) => a.kind === "create")!;
  const next = brief.actions.filter((a) => a.kind === "create")[1]!;
  const pkg = demoPackage({ topic: "competitor research", proof: "6 hours saved a week", lengthSec: 30, language: "English", trendId: top.id.replace("create-", "") });
  const hook = pkg.hooks.find((h) => h.recommended) ?? pkg.hooks[0]!;
  const progress = (active + 1) / N;

  return (
    <section id="loop" ref={ref} className={cn("relative", pinned && "h-[460svh]")}>
      <div className={cn("relative overflow-hidden", pinned ? "sticky top-0 flex h-svh items-center" : "py-20")}>
        <div className="relative mx-auto grid grid-cols-[minmax(0,1fr)] w-full max-w-[76rem] items-center gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div>
            <Eyebrow>The learning loop</Eyebrow>
            <h2 className="mt-5 max-w-[17ch] font-display text-[clamp(2.1rem,4vw,3.4rem)] font-normal leading-[1.02] tracking-[-0.04em]">
              CREO gets sharper because it sees what happens <Accent>next</Accent>.
            </h2>
            <p className="mt-5 max-w-[31rem] text-[1.0625rem] leading-relaxed text-muted">CREO doesn't just generate content and forget it. It connects recommendations to real outcomes so future decisions start with evidence from your own content history.</p>

            <ol className="mt-8 space-y-1" aria-label="The learning loop, step by step">
              {STEPS.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => go(i)} aria-current={on ? "step" : undefined} className="group flex min-h-11 w-full items-start gap-3.5 rounded-control px-2 py-2 text-left">
                      <span className={cn("tnum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-300", on ? "bg-lime-400 text-[#11140c]" : i < active ? "bg-cta text-on-cta" : "border border-line-strong text-muted")}>{i + 1}</span>
                      <span className="min-w-0">
                        <span className={cn("block text-[0.9375rem] font-medium transition-colors", on ? "text-ink" : "text-muted group-hover:text-ink")}>{s.title}</span>
                        <span className={cn("grid transition-all duration-500 ease-out", on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                          <span className="overflow-hidden text-[0.8125rem] leading-snug text-muted">{s.body}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="relative isolate mx-auto aspect-square w-full max-w-[36rem]">
            <Ripples />
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden focusable="false">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--line-strong)" strokeWidth="0.35" strokeDasharray="0.8 1.6" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--lime-400)" strokeWidth="1.1" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} transform="rotate(-90 50 50)" className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none" />
              <circle cx="50" cy="50" r="31" fill="var(--surface)" opacity="0.55" />
            </svg>

            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const on = i === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  aria-current={on ? "step" : undefined}
                  className={cn("absolute -ml-[22px] -mt-[22px] grid size-11 place-items-center rounded-full border transition-[color,background-color,border-color,box-shadow] duration-500 sm:-ml-7 sm:-mt-7 sm:size-14", on ? "border-transparent bg-lime-400 text-[#11140c] shadow-[0_0_0_8px_rgb(181_207_79/0.25)]" : i < active ? "border-transparent bg-cta text-on-cta" : "border-line-strong bg-bg text-muted hover:text-ink")}
                  style={pos(i)}
                >
                  <Icon size={24} weight={on ? "fill" : "regular"} />
                </button>
              );
            })}

            <div className="absolute left-1/2 top-1/2 w-[54%] -translate-x-1/2 -translate-y-1/2 sm:w-[58%]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={active} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="rounded-panel border border-line bg-raised p-4 shadow-pop sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    {/* Inside the ring on a phone the card is narrow, so the chip shows the step number; the list above names it. */}
                    <Chip tone="lime"><span className="sm:hidden">Step {active + 1}</span><span className="hidden sm:inline">{STEPS[active]!.title}</span></Chip>
                  </div>
                  <StepCard i={active} top={top} next={next} hook={hook.text} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({ i, top, next, hook }: { i: number; top: { subject?: string; fit?: number }; next: { subject?: string; fit?: number }; hook: string }) {
  if (i === 0)
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium text-muted">Recommended</p>
          <p className="mt-0.5 font-display text-[1.0625rem] font-medium leading-snug tracking-tight text-ink">{top.subject}</p>
          <p className="mt-1.5 text-xs text-muted">Already proven in your niche.</p>
        </div>
        {top.fit ? <FitScore score={top.fit} size={50} /> : null}
      </div>
    );
  if (i === 1)
    return (
      <div className="space-y-2 text-[0.8125rem] leading-snug">
        <p className="line-clamp-2 text-muted line-through decoration-risk/60 sm:line-clamp-none">{hook}</p>
        <p className="text-ink"><Mark sweep>Shorter, with your number up front.</Mark></p>
        <p className="text-xs text-muted">Reason saved: <span className="font-medium text-ink">too long for my style</span></p>
      </div>
    );
  if (i === 2)
    return (
      <div className="space-y-1.5 text-[0.8125rem]">
        <p className="font-medium text-ink">Approved by you</p>
        <p className="text-muted">Reel, 24 seconds. You post it.</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted"><span className="size-1.5 rounded-full bg-ok" /> Live</p>
      </div>
    );
  if (i === 3)
    return (
      <div>
        <p className="text-[0.8125rem] font-medium text-ink">Views against your baseline</p>
        <div className="relative mt-3 h-5 overflow-hidden rounded-full bg-sunk">
          <span className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-lime-400" />
          <span className="absolute inset-y-0 left-[38%] w-px bg-ink/60" />
        </div>
        <div className="mt-1.5 flex justify-between text-[0.6875rem] text-muted"><span>1.0x</span><span className="tnum font-medium text-ink">1.6x</span></div>
      </div>
    );
  if (i === 4)
    return (
      <div className="text-[0.8125rem] leading-snug">
        <dl className="grid grid-cols-2 gap-3">
          <div><dt className="text-[0.6875rem] font-medium text-muted">Expected</dt><dd className="tnum mt-0.5 text-[1.0625rem] text-muted">1.3x</dd></div>
          <div><dt className="text-[0.6875rem] font-medium text-muted">Actual</dt><dd className="tnum mt-0.5 text-[1.0625rem] font-medium text-ink">1.6x</dd></div>
        </dl>
        <p className="mt-2.5 text-ink"><Mark sweep>The result was on screen by second 2.</Mark></p>
      </div>
    );
  return (
    <div className="text-[0.8125rem] leading-snug">
      <p className="text-[0.6875rem] font-medium text-muted">Added to your Creator Memory</p>
      <p className="mt-1 text-ink"><Mark sweep>Proof-first hooks under 28 seconds beat your baseline.</Mark></p>
      <p className="mt-2 text-xs text-muted max-[359px]:hidden sm:hidden">The next recommendation starts here.</p>
      <div className="mt-3 hidden items-center justify-between gap-3 border-t border-line pt-3 sm:flex">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium text-muted">Next recommendation</p>
          <p className="mt-0.5 line-clamp-2 font-medium text-ink">{next.subject}</p>
        </div>
        {next.fit ? <FitScore score={Math.min(99, next.fit + 4)} size={40} label={false} /> : null}
      </div>
    </div>
  );
}
