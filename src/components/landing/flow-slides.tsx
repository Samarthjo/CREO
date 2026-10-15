"use client";

import { ArrowLeft, ArrowRight, Barbell, CookingPot, Cpu } from "@phosphor-icons/react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { Button, cn } from "../ui/kit";
import { useReduce } from "../ui/use-reduce";
import type { FlowCase } from "./flow-cases";
import { FlowPlayer } from "./flow-player";
import { SCENES } from "./flow-scenes";

const STEPS = ["CREO sees", "CREO understands", "CREO recommends", "You create", "Real results", "CREO learns"] as const;
const ICON = { tech: Cpu, fitness: Barbell, food: CookingPot } as const;
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * How CREO works, as six steps a creator can follow in under a minute.
 * On the left is the problem, in the creator's own words. On the right, at the same moment, an example video of CREO solving it.
 * Three made-up creators (see flow-cases.ts) go through the same six steps, so a creator can pick the one closest to them.
 * Nothing moves on to the next step by itself: the steps are moved by hand (buttons, tabs, arrow keys or a swipe), and each video can be paused.
 */
export function FlowSlides({ cases }: { cases: FlowCase[] }) {
  const reduce = useReduce();
  const [i, setI] = useState(0);
  const [who, setWho] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const dots = useRef<(HTMLButtonElement | null)[]>([]);
  const picks = useRef<(HTMLButtonElement | null)[]>([]);
  const strip = useRef<HTMLDivElement>(null);
  const last = STEPS.length - 1;
  const c = cases[who]!;
  const [lead, rest] = c.problems[i]!;

  const go = (to: number, via: "next" | "back" | "tab" | "key" | "swipe") => {
    const n = ((to % STEPS.length) + STEPS.length) % STEPS.length;
    if (n === i) return;
    setI(n);
    track("flow_step", { step: n + 1, via });
  };
  const pick = (n: number) => {
    const m = (n + cases.length) % cases.length;
    if (m === who) return;
    setWho(m);
    track("flow_case", { creator: cases[m]!.id });
  };
  const onKey = (e: React.KeyboardEvent) => {
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null || to < 0 || to > last) return;
    e.preventDefault();
    go(to, "key");
    // The step tabs show from the tablet up and the progress bar on a phone: focus whichever one is on screen.
    const tab = tabs.current[to];
    (tab && tab.offsetParent !== null ? tab : dots.current[to])?.focus();
  };
  const onPickKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const m = (who + d + cases.length) % cases.length;
    pick(m);
    picks.current[m]?.focus();
  };
  const onPanEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60 || Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    if (info.offset.x < 0 && i < last) go(i + 1, "swipe");
    else if (info.offset.x > 0 && i > 0) go(i - 1, "swipe");
  };

  // When the step tabs are too wide for the screen they scroll sideways: keep the current one centred without moving the page.
  useEffect(() => {
    const s = strip.current;
    const t = tabs.current[i];
    if (!s || !t || s.scrollWidth <= s.clientWidth + 4) return;
    s.scrollTo({ left: t.offsetLeft - (s.clientWidth - t.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [i, reduce]);

  return (
    // On a phone the card runs edge to edge (the section's 20px side padding is cancelled), so the video gets the whole screen width.
    <div className="-mx-5 sm:mx-auto sm:w-full sm:max-w-[64rem]" data-flow-slides="">
      {/* overflow-clip, not hidden: it rounds the corners the same way but keeps the phone's Back and Next bar sticky to the screen. */}
      <div className="overflow-clip rounded-none border-y border-line bg-surface sm:rounded-[1.75rem] sm:border sm:shadow-panel">
        <div className="border-b border-line bg-surface/60 px-4 pb-2 sm:hidden">
          <div role="tablist" aria-label="The six steps" onKeyDown={onKey} className="grid grid-cols-6 gap-1.5">
            {STEPS.map((label, n) => (
              <button
                key={label}
                ref={(el) => { dots.current[n] = el; }}
                type="button"
                role="tab"
                id={`flow-dot-${n}`}
                aria-selected={n === i}
                aria-label={label}
                aria-controls="flow-panel"
                tabIndex={n === i ? 0 : -1}
                onClick={() => go(n, "tab")}
                className="grid h-10 place-items-center"
              >
                <span className={cn("block h-1.5 w-full rounded-full transition-colors duration-300", n === i ? "bg-accent" : n < i ? "bg-accent/45" : "bg-line-strong")} />
              </button>
            ))}
          </div>
          <p aria-hidden className="pointer-events-none -mt-1 flex items-baseline gap-2 text-[0.9375rem] font-medium text-ink"><span className="tnum text-xs font-normal text-muted">{i + 1} of {STEPS.length}</span>{STEPS[i]}</p>
        </div>

        <div ref={strip} role="tablist" aria-label="The six steps" onKeyDown={onKey} className="scroll-thin hidden gap-1 overflow-x-auto border-b border-line bg-surface/60 px-3 py-2 sm:flex sm:px-5">
          {STEPS.map((label, n) => {
            const on = n === i;
            return (
              <button
                key={label}
                ref={(el) => { tabs.current[n] = el; }}
                type="button"
                role="tab"
                id={`flow-tab-${n}`}
                aria-selected={on}
                aria-controls="flow-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => go(n, "tab")}
                className={cn("flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium leading-5 transition pointer-coarse:min-h-11 sm:flex-1 sm:justify-center", on ? "bg-eyebrow text-on-eyebrow" : "text-muted hover:bg-sunk hover:text-ink")}
              >
                <span className="tnum text-xs opacity-70">{String(n + 1).padStart(2, "0")}</span>
                {label}
              </button>
            );
          })}
        </div>

        <motion.div id="flow-panel" role="tabpanel" aria-labelledby={`flow-tab-${i}`} onPanEnd={onPanEnd} style={{ touchAction: "pan-y" }} className="flow-grid grid gap-4 p-4 sm:gap-7 sm:p-8 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-x-10 md:p-10">
          <div className="flow-problem relative">
            <p className="text-[0.8125rem] font-medium text-accent">The problem</p>
            <div className="relative mt-3 sm:min-h-[8.5rem] md:min-h-[10.5rem]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.h3
                  key={`${c.id}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.12 : 0.3, ease: EASE }}
                  className="font-display text-[clamp(1.75rem,3.6vw,3.1rem)] font-normal leading-[1.08] tracking-[-0.035em] text-ink"
                >
                  <span aria-hidden className="text-accent">&ldquo;</span>{lead}{rest ? <> <span className="text-faint">{rest}</span></> : null}<span aria-hidden className="text-faint">&rdquo;</span>
                </motion.h3>
              </AnimatePresence>
            </div>
          </div>

          <div className="flow-player -mx-4 sm:mx-0 sm:rounded-[1.5rem] sm:bg-soft sm:p-4 sm:[background-image:radial-gradient(75%_60%_at_85%_0%,var(--glow-a),transparent_70%)]">
            <FlowPlayer key={`${c.id}-${i}`} scene={SCENES[i]!} c={c} />
          </div>

          <div className="flow-persona">
            <p id="flow-who" className="text-[0.8125rem] font-medium text-muted"><span className="sm:hidden">Pick your next competitor</span><span className="max-sm:hidden">Pick an example creator</span></p>
            <div role="radiogroup" aria-labelledby="flow-who" onKeyDown={onPickKey} className="mt-2.5 flex flex-wrap gap-2">
              {cases.map((k, n) => {
                const on = n === who;
                const Icon = ICON[k.id];
                return (
                  <button
                    key={k.id}
                    ref={(el) => { picks.current[n] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => pick(n)}
                    className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium leading-5 transition active:translate-y-px pointer-coarse:min-h-11 sm:px-3.5 sm:py-2", on ? "border-transparent bg-eyebrow text-on-eyebrow" : "border-line-strong text-muted hover:bg-sunk hover:text-ink")}
                  >
                    <Icon size={16} weight={on ? "fill" : "regular"} />
                    {k.niche}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[0.8125rem] leading-snug text-muted"><span className="sm:hidden">Your next competitor</span><span className="max-sm:hidden">Example creator</span>, {c.who}. The numbers are for illustration.</p>
          </div>
        </motion.div>

        {/* On a phone this bar stays at the bottom of the screen while the card is in view, so changing step never needs a scroll. */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 shadow-[0_-14px_24px_-18px_rgb(17_20_12/0.4)] sm:px-6 md:static md:z-auto md:shadow-none">
          <Button size="md" variant="ghost" onClick={() => go(i - 1, "back")} disabled={i === 0} aria-label="Previous step"><ArrowLeft size={16} /> Back</Button>
          <span className="sr-only" aria-live="polite">Step {i + 1} of {STEPS.length}: {STEPS[i]}</span>
          <Button size="md" variant="dark" onClick={() => go(i === last ? 0 : i + 1, "next")} aria-label={i === last ? "Start over" : "Next step"} className="max-sm:flex-1">{i === last ? "Start over" : "Next"} {i === last ? <ArrowLeft size={16} className="rotate-180" /> : <ArrowRight size={16} />}</Button>
        </div>
      </div>
    </div>
  );
}
