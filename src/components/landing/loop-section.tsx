"use client";

import { BookmarkSimple, ChartLineUp, Compass, PaperPlaneTilt, PencilSimpleLine, TrendUp } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Accent, Chip, Eyebrow, FitScore, Mark, cn } from "../ui/kit";
import { demoPackage, getDemo } from "./demo";
import { usePinnedSteps } from "./use-pinned-steps";

const STEPS = [
  { id: "recommend", title: "CREO recommends", body: "A trend, scored against your own history, with the reasons shown.", icon: Compass },
  { id: "edit", title: "You edit", body: "You change what is off. CREO keeps the before, the after and your reason.", icon: PencilSimpleLine },
  { id: "publish", title: "You publish", body: "Nothing goes out without your approval, and you post it your way.", icon: PaperPlaneTilt },
  { id: "perform", title: "It performs", body: "Views, saves and replies come back from the post.", icon: ChartLineUp },
  { id: "learn", title: "CREO learns", body: "The result and your reason are written to your Memory.", icon: BookmarkSimple },
  { id: "next", title: "The next one is sharper", body: "The next recommendation starts from everything above.", icon: TrendUp },
] as const;

const N = STEPS.length;
const pos = (i: number, r = 40) => {
  const a = (-90 + (360 / N) * i) * (Math.PI / 180);
  return { left: `${50 + r * Math.cos(a)}%`, top: `${50 + r * Math.sin(a)}%` };
};

/** Section 5: the learning loop, CREO's main idea. Illustrative sequence on the sample creator, labelled as such. */
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
      <div className={cn("relative overflow-hidden bg-[linear-gradient(180deg,var(--bg)_0%,var(--sky-tint)_42%,var(--bg)_100%)]", pinned ? "sticky top-0 flex h-svh items-center" : "py-20")}>
        <div className="relative mx-auto grid grid-cols-[minmax(0,1fr)] w-full max-w-[76rem] items-center gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div>
            <Eyebrow>The learning loop</Eyebrow>
            <h2 className="mt-5 max-w-[14ch] font-display text-[clamp(2.3rem,5vw,4.25rem)] font-normal leading-[1.02] tracking-[-0.04em]">
              Every edit makes the next one <Accent>sharper</Accent>.
            </h2>
            <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-muted">Most tools forget you the moment you close them. CREO keeps what you changed, why, and how the post did.</p>

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

          <div className="relative mx-auto aspect-square w-full max-w-[36rem]">
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
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Chip tone="lime">{STEPS[active]!.title}</Chip>
                    <span className="text-[0.6875rem] text-faint">Illustrative</span>
                  </div>
                  <StepCard i={active} top={top} next={next} hook={hook.text} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        <p className="relative mx-auto mt-10 max-w-[76rem] px-5 text-center text-[0.8125rem] text-body sm:px-6 lg:mt-0 lg:absolute lg:bottom-6 lg:left-0 lg:right-0">A sequence on the sample creator to show the mechanism. It is not a result from a live creator.</p>
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
        <p className="text-muted line-through decoration-risk/60">{hook}</p>
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
        <p className="text-[0.6875rem] font-medium text-muted">New memory</p>
        <p className="mt-1 text-ink"><Mark sweep>Proof-first hooks under 28 seconds beat your baseline. Keep them short.</Mark></p>
      </div>
    );
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-medium text-muted">Next recommendation</p>
        <p className="mt-0.5 font-display text-[1.0625rem] font-medium leading-snug tracking-tight text-ink">{next.subject}</p>
        <p className="mt-1.5 text-xs text-muted">Hook already shortened.</p>
      </div>
      {next.fit ? <FitScore score={Math.min(99, next.fit + 4)} size={50} /> : null}
    </div>
  );
}
