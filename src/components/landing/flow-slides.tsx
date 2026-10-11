"use client";

import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { CountUp } from "../ui/count-up";
import { Button, Chip, cn } from "../ui/kit";

/** The numbers behind the six steps. They come from the same engine as the app, on a made-up creator (see rail.tsx). */
export type FlowData = { fit: number; subject: string; hook: string; lift: number; posts: number; result: number; after: number };

const STEPS = [
  { label: "CREO sees", caption: "A pattern is emerging." },
  { label: "CREO understands", caption: "Why it fits you." },
  { label: "CREO recommends", caption: "Your next best move, drafted." },
  { label: "You create", caption: "You edit, approve and publish." },
  { label: "Real results", caption: "The post performs." },
  { label: "CREO learns", caption: "Your results shape the next draft." },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;
const NUMBER = "tnum font-display font-normal leading-none tracking-[-0.04em] text-ink";
const BIG = `${NUMBER} text-[clamp(3.5rem,8vw,5.75rem)]`;
/** Two numbers on one line, so a little smaller. */
const PAIR = `${NUMBER} text-[clamp(2.25rem,4.8vw,3.75rem)]`;

/** The fit ring from the workspace, drawn in as the step appears. */
function Ring({ score, size = 100 }: { score: number; size?: number }) {
  const reduce = useReducedMotion();
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const end = c * (1 - score / 100);
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5" role="img" aria-label={`Creator fit ${score} percent`}>
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth="4" />
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: reduce ? end : c }} animate={{ strokeDashoffset: end }} transition={{ duration: 1.1, ease: EASE, delay: 0.25 }} />
        </svg>
        <span className="tnum absolute font-display font-semibold text-ink" style={{ fontSize: size * 0.34 }}><CountUp to={score} duration={1.1} /></span>
      </div>
      <span className="text-xs font-medium text-muted">fit</span>
    </div>
  );
}

/** Items that arrive one after another, so the step reads in order. */
function Stagger({ children, className }: { children: React.ReactNode[]; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      {children.map((c, i) => (
        <motion.div key={i} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.3 + i * 0.22 }}>{c}</motion.div>
      ))}
    </div>
  );
}

function Visual({ i, d }: { i: number; d: FlowData }) {
  switch (i) {
    case 0:
      return (
        <div className="flex items-center gap-5 sm:gap-8">
          <Ring score={d.fit} />
          <div className="min-w-0">
            <Chip tone="lime" className="px-3 py-1 text-[0.8125rem]">Pattern matched</Chip>
            <p className="mt-3 max-w-[20ch] text-[1rem] leading-snug text-muted sm:text-[1.125rem]">{d.subject}</p>
          </div>
        </div>
      );
    case 1:
      return (
        <div>
          <p className={BIG}><CountUp to={d.lift} decimals={1} suffix="x" /></p>
          <p className="mt-3 text-[1rem] text-muted">{d.hook} hooks, {d.posts} posts</p>
        </div>
      );
    case 2:
      return (
        <Stagger className="flex flex-wrap gap-2">
          {["Hooks", "Script", "Shots", "Caption"].map((t) => (
            <Chip key={t} tone="lime" className="gap-1.5 px-3 py-1.5 text-[0.875rem]"><Check size={14} weight="bold" />{t}</Chip>
          ))}
        </Stagger>
      );
    case 3:
      return (
        <Stagger className="space-y-2.5">
          <p className="text-[1.25rem] font-medium text-ink">Approved by you</p>
          <p className="text-[1rem] text-muted">Reel, 24 seconds. You post it.</p>
          <p className="inline-flex items-center gap-2 text-sm text-muted"><span className="relative grid size-2.5 place-items-center"><span className="absolute size-2.5 animate-ping rounded-full bg-ok/50 motion-reduce:hidden" /><span className="size-2 rounded-full bg-ok" /></span> Live</p>
        </Stagger>
      );
    case 4:
      return (
        <div>
          <p className={BIG}><CountUp to={d.result} decimals={1} suffix="x" /></p>
          <p className="mt-3 text-[1rem] text-muted">views against your usual</p>
        </div>
      );
    default:
      return (
        <div>
          <p className={PAIR}>{d.lift.toFixed(1)}x <span className="text-accent">to {d.after.toFixed(1)}x</span></p>
          <p className="mt-3 text-[1rem] text-muted">{d.hook} hooks, after that post</p>
        </div>
      );
  }
}

/**
 * The six steps of the workspace as a slideshow: one step at a time, moved by hand (buttons, step tabs, arrow keys or a swipe).
 * Nothing plays by itself. The last step leads back to the first, because CREO learning feeds the next recommendation.
 */
export function FlowSlides({ data }: { data: FlowData }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const strip = useRef<HTMLDivElement>(null);
  const last = STEPS.length - 1;

  const go = (to: number, via: "next" | "back" | "tab" | "key" | "swipe") => {
    const n = ((to % STEPS.length) + STEPS.length) % STEPS.length;
    if (n === i) return;
    setDir(to > i && !(i === last && n === 0 && via !== "next") ? 1 : to < i ? -1 : 1);
    setI(n);
    track("flow_step", { step: n + 1, via });
  };
  const onKey = (e: React.KeyboardEvent) => {
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null || to < 0 || to > last) return;
    e.preventDefault();
    go(to, "key");
    tabs.current[to]?.focus();
  };
  const onPanEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60 || Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    if (info.offset.x < 0 && i < last) go(i + 1, "swipe");
    else if (info.offset.x > 0 && i > 0) go(i - 1, "swipe");
  };

  // On a phone the step tabs scroll sideways: keep the current one centred without moving the page.
  useEffect(() => {
    const s = strip.current;
    const t = tabs.current[i];
    if (!s || !t || s.scrollWidth <= s.clientWidth + 4) return;
    s.scrollTo({ left: t.offsetLeft - (s.clientWidth - t.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [i, reduce]);

  const step = STEPS[i]!;
  const slide = {
    in: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 56 }),
    on: { opacity: 1, x: 0 },
    out: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -56 }),
  };

  return (
    <div className="mx-auto w-full max-w-[64rem]" data-flow-slides="">
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-panel">
        <div ref={strip} role="tablist" aria-label="The six steps" onKeyDown={onKey} className="scroll-thin flex gap-1 overflow-x-auto border-b border-line bg-surface/60 px-3 py-2 sm:px-5">
          {STEPS.map((s, n) => {
            const on = n === i;
            return (
              <button
                key={s.label}
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
                {s.label}
              </button>
            );
          })}
        </div>

        <motion.div id="flow-panel" role="tabpanel" aria-labelledby={`flow-tab-${i}`} onPanEnd={onPanEnd} style={{ touchAction: "pan-y" }} className="relative min-h-[26rem] overflow-hidden md:min-h-[21rem]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div key={i} custom={dir} variants={slide} initial="in" animate="on" exit="out" transition={{ duration: reduce ? 0.2 : 0.42, ease: EASE }} className="grid items-center gap-8 p-6 sm:p-9 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-12 lg:p-12">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">{String(i + 1).padStart(2, "0")} · {step.label}{i === last ? " ↺" : ""}</p>
                <h3 className="mt-4 min-h-[4.3rem] max-w-[15ch] font-display text-[clamp(2rem,4vw,3.25rem)] font-normal leading-[1.04] tracking-[-0.035em] text-ink md:min-h-0">{step.caption}</h3>
              </div>
              <div className="flex min-h-[14rem] items-center rounded-panel border border-line bg-soft px-6 py-8 sm:px-9">
                <Visual i={i} d={data} />
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 sm:px-6">
          <Button size="md" variant="ghost" onClick={() => go(i - 1, "back")} disabled={i === 0} aria-label="Previous step"><ArrowLeft size={16} /> <span className="max-[400px]:sr-only">Back</span></Button>
          <span className="tnum text-[0.8125rem] text-muted" aria-live="polite">Step {i + 1} of {STEPS.length}</span>
          <Button size="md" variant="dark" onClick={() => go(i === last ? 0 : i + 1, "next")} aria-label={i === last ? "Start over" : "Next step"}><span className="max-[400px]:sr-only">{i === last ? "Start over" : "Next"}</span> {i === last ? <ArrowLeft size={16} className="rotate-180" /> : <ArrowRight size={16} />}</Button>
        </div>
      </div>
    </div>
  );
}
