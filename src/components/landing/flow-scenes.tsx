"use client";

import { ArrowsClockwise, Check, Cursor, TrendUp } from "@phosphor-icons/react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { MemoryRow } from "../product/memory";
import { Chip, cn } from "../ui/kit";
import type { FlowCase, TrendRow } from "./flow-cases";

/**
 * The six scenes of the "how CREO works" example video.
 *
 * Every scene is a pure function of one clock (seconds since the scene began). Nothing here keeps its own timer,
 * so the player can pause, scrub and replay by moving the clock, and every frame is the same whenever it is drawn.
 * The scenes are laid out on a fixed 400 x 270 stage that the player scales to fit, like a screen recording,
 * so a pointer lands on the same spot at every screen width.
 */

export type Clock = MotionValue<number>;
export type SceneProps = { clock: Clock; c: FlowCase };
export const STAGE = { w: 400, h: 270 } as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Ease = (t: number) => number;
const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  line: (t) => t,
} satisfies Record<string, Ease>;
/** 0 to 1 between two moments of the scene. */
const span = (t: number, from: number, to: number, fn: Ease = ease.out) => fn(clamp01((t - from) / (to - from)));
const useSpan = (clock: Clock, from: number, to: number, fn: Ease = ease.out) => useTransform(clock, (t) => span(t, from, to, fn));

/** Fades and lifts a block into place at a given moment. */
function Appear({ clock, at, dur = 0.5, y = 8, className, children }: { clock: Clock; at: number; dur?: number; y?: number; className?: string; children: ReactNode }) {
  const p = useSpan(clock, at, at + dur);
  const ty = useTransform(p, (v) => (1 - v) * y);
  return <motion.div className={className} style={{ opacity: p, y: ty }}>{children}</motion.div>;
}

/** Text that changes with the clock. It writes straight into the page, so a counting or typing line never re-renders React. */
function Text({ value, className }: { value: MotionValue<string>; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(value, "change", (v) => { if (ref.current) ref.current.textContent = v; });
  return <span ref={ref} className={className}>{value.get()}</span>;
}
function Num({ clock, from, to, value, decimals = 0, suffix = "", fn = ease.out, className }: { clock: Clock; from: number; to: number; value: number; decimals?: number; suffix?: string; fn?: Ease; className?: string }) {
  const mv = useTransform(clock, (t) => `${(value * span(t, from, to, fn)).toFixed(decimals)}${suffix}`);
  return <Text value={mv} className={cn("tnum", className)} />;
}

/** A word that arrives on its own beat, so a draft reads as if it were being written. */
function Word({ clock, at, children }: { clock: Clock; at: number; children: ReactNode }) {
  const p = useSpan(clock, at, at + 0.3);
  const y = useTransform(p, (v) => (1 - v) * 5);
  return <motion.span className="inline-block whitespace-nowrap" style={{ opacity: p, y }}>{children}</motion.span>;
}

/** The creator's own words in the hook: [bracketed] details are the product's marker. */
function Marked({ t }: { t: string }) {
  const m = t.match(/^(.*?)(\[[^\]]+\])(.*)$/);
  if (!m) return <>{t}</>;
  return <>{m[1]}<mark className="mark">{m[2]!.replace(/ /g, " ")}</mark>{m[3]}</>;
}
const hookTokens = (h: FlowCase["hook"]) => (h.before + h.slot.replace(/ /g, " ") + h.after).split(" ").filter(Boolean);

type Stop = { t: number; x: number; y: number };
function along(stops: Stop[], t: number, key: "x" | "y") {
  const first = stops[0]!;
  if (t <= first.t) return first[key];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    if (t <= b.t) return a[key] + (b[key] - a[key]) * span(t, a.t, b.t, ease.inOut);
  }
  return stops[stops.length - 1]![key];
}

/** The pointer: glides between stops, presses on each click and leaves. The first stop is where it appears, the last where it goes. */
function Pointer({ clock, stops, clicks }: { clock: Clock; stops: { current: Stop[] }; clicks: number[] }) {
  const x = useTransform(clock, (t) => along(stops.current, t, "x"));
  const y = useTransform(clock, (t) => along(stops.current, t, "y"));
  const o = useTransform(clock, (t) => {
    const s = stops.current;
    return span(t, s[0]!.t, s[0]!.t + 0.4) * (1 - span(t, s[s.length - 1]!.t - 0.5, s[s.length - 1]!.t));
  });
  const since = (t: number) => { const c = [...clicks].reverse().find((k) => t >= k); return c === undefined ? 9 : t - c; };
  const press = useTransform(clock, (t) => 1 - 0.18 * clamp01(1 - Math.abs(since(t) - 0.09) / 0.12));
  const ringS = useTransform(clock, (t) => 0.3 + clamp01(since(t) / 0.7) * 1.5);
  const ringO = useTransform(clock, (t) => { const s = since(t); return s >= 0.7 ? 0 : (1 - s / 0.7) * 0.65; });
  return (
    <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-30" style={{ x, y, opacity: o }}>
      <motion.span className="absolute -left-4 -top-4 size-8 rounded-full border-2 border-ink" style={{ scale: ringS, opacity: ringO }} />
      <motion.span className="block origin-top-left" style={{ scale: press }}>
        <Cursor size={26} weight="fill" className="-ml-0.5 -mt-0.5 text-ink [filter:drop-shadow(0_0_1.5px_var(--bg))_drop-shadow(0_5px_8px_rgb(0_0_0/0.28))]" />
      </motion.span>
    </motion.div>
  );
}

/** Where an element sits on the stage, found by measuring it, so a pointer can aim at text that wraps differently per creator. */
function centreOn(el: HTMLElement | null) {
  const stage = el?.closest<HTMLElement>("[data-stage]");
  if (!el || !stage) return null;
  const s = stage.getBoundingClientRect().width / STAGE.w || 1;
  const a = el.getBoundingClientRect();
  const b = stage.getBoundingClientRect();
  return { x: (a.left - b.left) / s + a.width / (2 * s), y: (a.top - b.top) / s + a.height / (2 * s) };
}

const Label = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cn("text-[12.5px] font-medium text-muted", className)}>{children}</span>;
const Dot = ({ children }: { children: ReactNode }) => <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sunk text-ink">{children}</span>;

/* 1. CREO sees: the saved trends, scanned one by one, until the pattern worth your time stands out and rises to the top. */

const ROW_H = 38;
const PITCH = 44;
const LIST_TOP = 42;

function TrendLine({ clock, row, i, to }: { clock: Clock; row: TrendRow; i: number; to: number }) {
  const scan = 0.9 + i * 0.45;
  const enter = useSpan(clock, 0.2 + i * 0.09, 0.65 + i * 0.09);
  const dim = useSpan(clock, 3.5, 4.0);
  const lit = useSpan(clock, 3.5, 4.1);
  const move = useSpan(clock, 4.4, 5.3, ease.inOut);
  const chip = useSpan(clock, scan + 0.1, scan + 0.4, ease.back);
  const y = useTransform([enter, move], ([e, m]: number[]) => LIST_TOP + PITCH * (i + (to - i) * m!) + (1 - e!) * 10);
  const opacity = useTransform([enter, dim], ([e, d]: number[]) => e! * (row.top ? 1 : 1 - 0.5 * d!));
  const scale = useTransform(lit, (v) => (row.top ? 1 + 0.03 * v : 1));
  const chipScale = useTransform(chip, (v) => 0.6 + 0.4 * v);
  return (
    <motion.div className="absolute inset-x-4 top-0" style={{ y, opacity, scale, height: ROW_H }}>
      <div className="relative flex h-full items-center gap-2.5 rounded-xl border border-line bg-surface px-3">
        {row.top && <motion.div aria-hidden className="absolute inset-0 rounded-xl border border-line-strong bg-soft" style={{ opacity: lit }} />}
        <span className="relative"><Dot><TrendUp size={14} /></Dot></span>
        <span className="relative min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{row.title}</span>
        <motion.span className="relative shrink-0" style={{ opacity: chip, scale: chipScale }}>
          <Chip tone={row.top ? "mark" : row.status === "stable" ? "outline" : "neutral"}>{row.status}</Chip>
        </motion.span>
      </div>
    </motion.div>
  );
}

function ScanBand({ clock }: { clock: Clock }) {
  const y = useTransform(clock, (t) => {
    const k = clamp01((t - 0.9) / (4 * 0.45)) * 4;
    const base = Math.min(4, Math.floor(k));
    return LIST_TOP + PITCH * (base + (base < 4 ? span(k - base, 0, 0.4, ease.inOut) : 0));
  });
  const o = useTransform(clock, (t) => span(t, 0.7, 1.0) * (1 - span(t, 3.1, 3.5)));
  return <motion.div aria-hidden className="pointer-events-none absolute inset-x-3 top-0 z-10 rounded-2xl border border-mark bg-mark/20" style={{ y, opacity: o, height: ROW_H + 6, marginTop: -3 }} />;
}

export function SeeScene({ clock, c }: SceneProps) {
  const topAt = c.trends.findIndex((r) => r.top);
  const to = (i: number) => (i === topAt ? 0 : i < topAt ? i + 1 : i);
  return (
    <>
      <Appear clock={clock} at={0.1} className="absolute inset-x-4 top-3.5 flex items-center justify-between">
        <Label>Your saved trends</Label>
        <Label className="tnum">{c.saved} in all</Label>
      </Appear>
      <ScanBand clock={clock} />
      {c.trends.map((row, i) => <TrendLine key={row.title} clock={clock} row={row} i={i} to={to(i)} />)}
    </>
  );
}

/* 2. CREO understands: the fit score draws in, then the reasons behind it, in the engine's own words. */

function Reason({ clock, at, text }: { clock: Clock; at: number; text: string }) {
  const p = useSpan(clock, at + 0.05, at + 0.4, ease.back);
  const s = useTransform(p, (v) => 0.5 + 0.5 * v);
  return (
    <Appear clock={clock} at={at} className="flex items-start gap-2.5">
      <motion.span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-eyebrow text-on-eyebrow" style={{ scale: s }}><Check size={12} weight="bold" /></motion.span>
      <p className="text-[13.5px] leading-snug text-ink">{text}</p>
    </Appear>
  );
}

export function UnderstandScene({ clock, c }: SceneProps) {
  const size = 96;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const draw = useSpan(clock, 0.8, 2.6, ease.expo);
  const dash = useTransform(draw, (v) => circ * (1 - (c.fit.score / 100) * v));
  return (
    <>
      <Appear clock={clock} at={0.1} className="absolute inset-x-4 top-3.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-line-strong bg-soft px-3 py-2.5">
          <Dot><TrendUp size={14} /></Dot>
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{c.fit.title}</span>
          <Chip tone="mark">{c.fit.status}</Chip>
        </div>
      </Appear>
      <Appear clock={clock} at={0.4} className="absolute left-4 top-[70px] flex flex-col items-center gap-1.5">
        <div className="relative grid place-items-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth="4" />
            <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} style={{ strokeDashoffset: dash }} />
          </svg>
          <Num clock={clock} from={0.8} to={2.6} value={c.fit.score} fn={ease.expo} className="absolute font-display text-[32px] font-semibold leading-none text-ink" />
        </div>
        <span className="text-xs font-medium text-muted">fit</span>
      </Appear>
      <div className="absolute left-[128px] right-4 top-[72px] space-y-3">
        {c.fit.why.map((w, i) => <Reason key={w} clock={clock} at={2.0 + i * 1.0} text={w} />)}
      </div>
      <Appear clock={clock} at={5.4} className="absolute bottom-4 left-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-soft px-3.5 py-1.5 text-[13px] font-medium text-ink"><Check size={14} weight="bold" className="text-accent" />{c.fit.verdict}</div>
      </Appear>
    </>
  );
}

/* 3. CREO recommends: the draft arrives as a hook, a second-by-second plan and the pieces ready to shoot. */

function Beat({ clock, at, label, sec, total, first }: { clock: Clock; at: number; label: string; sec: number; total: number; first: boolean }) {
  const p = useSpan(clock, at, at + 0.45);
  const sx = useTransform(p, (v) => 0.2 + 0.8 * v);
  return (
    <motion.div className={cn("grid h-[30px] origin-left place-items-center overflow-hidden rounded-lg border px-1 text-[11.5px] font-medium leading-none", first ? "border-line-strong bg-mark-wash text-ink" : "border-line bg-soft text-body")} style={{ flexGrow: sec / total, flexBasis: 0, opacity: p, scaleX: sx }}>
      <span className="truncate">{label}</span>
    </motion.div>
  );
}

function Made({ clock, at, children }: { clock: Clock; at: number; children: ReactNode }) {
  const p = useSpan(clock, at, at + 0.4, ease.back);
  const s = useTransform(p, (v) => 0.7 + 0.3 * v);
  const o = useTransform(p, (v) => clamp01(v * 1.6));
  return <motion.span style={{ scale: s, opacity: o }} className="inline-flex"><Chip tone="lime" className="gap-1.5 px-3 py-1.5 text-[13px]"><Check size={13} weight="bold" />{children}</Chip></motion.span>;
}

export function RecommendScene({ clock, c }: SceneProps) {
  const total = c.plan.reduce((a, b) => a + b.sec, 0);
  const tokens = hookTokens(c.hook);
  const sweep = useSpan(clock, 2.8, 4.8, ease.inOut);
  const headX = useTransform(sweep, (v) => v * 368);
  const headO = useTransform(clock, (t) => span(t, 2.7, 2.9) * (1 - span(t, 4.8, 5.1)));
  let at = 2.8;
  return (
    <>
      <Appear clock={clock} at={0.1} className="absolute inset-x-4 top-3.5 flex items-center gap-2">
        <Chip tone="mark">{c.hook.style}</Chip>
        <Label>Recommended hook</Label>
      </Appear>
      <p className="absolute inset-x-4 top-[40px] font-display text-[18px] font-medium leading-[1.35] tracking-tight text-ink">
        {tokens.map((t, i) => <span key={i}><Word clock={clock} at={0.6 + i * 0.14}><Marked t={t} /></Word>{" "}</span>)}
      </p>
      <Appear clock={clock} at={2.4} className="absolute inset-x-4 top-[108px]">
        <Label>A {c.lengthSec} second Reel, planned beat by beat</Label>
      </Appear>
      <div className="absolute inset-x-4 top-[130px]">
        <div className="flex gap-[3px]">
          {c.plan.map((b, i) => {
            const start = at;
            at += 0.3;
            return <Beat key={`${b.label}${i}`} clock={clock} at={start} label={b.label} sec={b.sec} total={total} first={i === 0} />;
          })}
        </div>
        <motion.span aria-hidden className="absolute -top-0.5 left-0 h-[34px] w-0.5 rounded-full bg-ink" style={{ x: headX, opacity: headO }} />
      </div>
      <div className="absolute inset-x-4 top-[182px] flex flex-wrap gap-2">
        <Made clock={clock} at={5.2}>Script</Made>
        <Made clock={clock} at={5.55}>{c.shots} shots</Made>
        <Made clock={clock} at={5.9}>Caption</Made>
        <Made clock={clock} at={6.25}>{c.titles} titles</Made>
      </div>
      <Appear clock={clock} at={6.9} className="absolute inset-x-4 top-[230px] text-[12px] text-muted">
        <p>Highlighted words are yours. CREO never invents results.</p>
      </Appear>
    </>
  );
}

/* 4. You create: the pointer fills the highlighted gap with a real result, approves the draft, and nothing goes out until then. */

const FILL_AT = 2.1;
const FILL_END = 3.9;
const APPROVE_AT = 6.0;

export function CreateScene({ clock, c }: SceneProps) {
  const slot = useRef<HTMLSpanElement>(null);
  const stops = useRef<Stop[]>([
    { t: 0.9, x: 372, y: 190 },
    { t: 1.9, x: 70, y: 66 },
    { t: 4.9, x: 70, y: 66 },
    { t: 5.9, x: 332, y: 236 },
    { t: 7.7, x: 332, y: 236 },
  ]);
  const aim = () => {
    const p = centreOn(slot.current);
    if (!p) return;
    stops.current = stops.current.map((s, i) => (i === 1 || i === 2 ? { ...s, x: p.x, y: p.y } : s));
  };
  useEffect(() => {
    aim();
    document.fonts?.ready.then(aim).catch(() => {});
  }, []);
  useMotionValueEvent(clock, "change", (t) => { if (t > 1.2 && t < 1.8) aim(); });

  const text = useTransform(clock, (t) => (t < FILL_AT ? c.hook.slot : c.hook.filled.slice(0, Math.round(c.hook.filled.length * span(t, FILL_AT + 0.15, FILL_END, ease.line)))));
  const marker = useTransform(clock, (t) => `${100 * (1 - span(t, FILL_END + 0.5, FILL_END + 1.1))}% 64%`);
  const caret = useTransform(clock, (t) => (t > FILL_AT && t < FILL_END + 0.8 && Math.floor(t * 3.2) % 2 === 0 ? 1 : 0));
  const done = useSpan(clock, APPROVE_AT, APPROVE_AT + 0.25, ease.line);
  const pressed = useTransform(clock, (t) => 1 - 0.05 * clamp01(1 - Math.abs(t - APPROVE_AT - 0.08) / 0.12));
  const before = c.hook.before.split(" ").filter(Boolean);
  const after = c.hook.after.trim().split(" ").filter(Boolean);
  const glue = c.hook.after.startsWith(" ") ? " " : "";
  const wasDraft = useTransform(done, (v) => 1 - v);

  return (
    <>
      <Appear clock={clock} at={0.1} dur={0.4} y={0} className="absolute inset-x-4 top-3.5 flex items-center gap-2">
        <div className="relative h-[22px] w-[88px]">
          <motion.span className="absolute inset-0" style={{ opacity: wasDraft }}><Chip tone="mark">{c.hook.style}</Chip></motion.span>
          <motion.span className="absolute inset-0" style={{ opacity: done }}><Chip tone="ok" className="gap-1"><Check size={12} weight="bold" />Approved</Chip></motion.span>
        </div>
        <Label>{"Your draft"}</Label>
      </Appear>
      <Appear clock={clock} at={0.1} dur={0.4} y={0} className="absolute inset-x-4 top-[42px]">
        <p className="font-display text-[18px] font-medium leading-[1.35] tracking-tight text-ink">
          {before.map((w, i) => <span key={i}><Marked t={w} />{" "}</span>)}
          <motion.mark ref={slot} className="mark" style={{ backgroundSize: marker }}><Text value={text} /></motion.mark>
          <span aria-hidden className="relative inline-block h-[1.1em] w-0 align-[-0.2em]"><motion.span className="absolute inset-y-0 left-px w-0.5 bg-ink" style={{ opacity: caret }} /></span>
          {glue}{after.map((w, i) => <span key={i}>{i > 0 ? " " : ""}{w}</span>)}
        </p>
      </Appear>
      <Appear clock={clock} at={0.4} className="absolute inset-x-4 top-[116px] flex flex-wrap gap-2">
        {["Script", `${c.shots} shots`, "Caption"].map((t) => <Chip key={t} tone="outline" className="gap-1.5 px-3 py-1.5 text-[13px]"><Check size={13} weight="bold" />{t}</Chip>)}
      </Appear>
      <Appear clock={clock} at={0.7} className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <div className="relative h-8 min-w-0 flex-1 text-[12.5px] leading-snug text-muted">
          <motion.p className="absolute inset-0 flex items-center" style={{ opacity: wasDraft }}>Nothing goes out until you approve.</motion.p>
          <motion.p className="absolute inset-0 flex items-center" style={{ opacity: done }}>You post it. CREO never posts for you.</motion.p>
        </div>
        <motion.div className="relative h-[34px] w-[104px] shrink-0" style={{ scale: pressed }}>
          <motion.span className="absolute inset-0 grid place-items-center rounded-full bg-ink text-[13.5px] font-medium text-bg" style={{ opacity: wasDraft }}>Approve</motion.span>
          <motion.span className="absolute inset-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface text-[13.5px] font-medium text-ink" style={{ opacity: done }}><Check size={14} weight="bold" />Approved</motion.span>
        </motion.div>
      </Appear>
      <Pointer clock={clock} stops={stops} clicks={[FILL_AT, APPROVE_AT]} />
    </>
  );
}

/* 5. Real results: you log the numbers, and CREO sets them against your usual. */

const LOG_FIELD = { x: 152, y: 119 };
const LOG_BUTTON = { x: 336, y: 119 };
const compact = (n: number) => `${(Math.round(n / 100) / 10).toFixed(1)}K`;
const grouped = (n: number) => n.toLocaleString("en-IN");

function Bar({ clock, at, to, label, value, width, tone, className }: { clock: Clock; at: number; to: number; label: string; value: string; width: number; tone: string; className: string }) {
  const p = useSpan(clock, at, to, ease.expo);
  const sx = useTransform(p, (v) => 0.001 + 0.999 * v);
  return (
    <Appear clock={clock} at={at - 0.2} dur={0.4} className={cn("absolute left-0", className)}>
      <p className="text-[12px] text-muted">{label}</p>
      <div className="mt-1 flex items-center gap-2.5">
        <motion.span className={cn("block h-3 origin-left rounded-full", tone)} style={{ width, scaleX: sx }} />
        <span className="tnum text-[13px] font-medium text-ink">{value}</span>
      </div>
    </Appear>
  );
}

export function ResultScene({ clock, c }: SceneProps) {
  const { usual, views, lift } = c.result;
  const typed = grouped(views);
  const stops = useRef<Stop[]>([
    { t: 0.9, x: 372, y: 200 },
    { t: 1.8, x: LOG_FIELD.x, y: LOG_FIELD.y },
    { t: 3.2, x: LOG_FIELD.x, y: LOG_FIELD.y },
    { t: 4.0, x: LOG_BUTTON.x, y: LOG_BUTTON.y },
    { t: 5.2, x: LOG_BUTTON.x, y: LOG_BUTTON.y },
  ]);
  const text = useTransform(clock, (t) => typed.slice(0, Math.round(typed.length * span(t, 2.0, 3.0, ease.line))));
  const caret = useTransform(clock, (t) => (t > 1.9 && t < 3.6 && Math.floor(t * 3.2) % 2 === 0 ? 1 : 0));
  const logged = useSpan(clock, 4.25, 4.5, ease.line);
  const unlogged = useTransform(logged, (v) => 1 - v);
  const press = useTransform(clock, (t) => 1 - 0.06 * clamp01(1 - Math.abs(t - 4.2 - 0.08) / 0.12));
  const wide = 190;
  return (
    <>
      <Appear clock={clock} at={0.1} className="absolute inset-x-4 top-3.5">
        <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
          <div className="flex items-center gap-2"><Chip tone="ok" className="gap-1"><Check size={12} weight="bold" />Posted</Chip><Label>2 days ago</Label></div>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink">{c.hook.before}{c.hook.filled}{c.hook.after}</p>
        </div>
      </Appear>
      <Appear clock={clock} at={0.5} className="absolute inset-x-4 top-[100px]">
        <div className="flex items-center gap-2.5">
          <Label>Views</Label>
          <div className="flex h-9 flex-1 items-center rounded-xl border border-line-strong bg-raised px-3 text-[14px] text-ink">
            <Text value={text} className="tnum" />
            <span aria-hidden className="relative inline-block w-0"><motion.span className="absolute left-px top-[-0.6em] h-[1.2em] w-0.5 bg-ink" style={{ opacity: caret }} /></span>
          </div>
          <motion.div className="relative h-9 w-[104px] shrink-0" style={{ scale: press }}>
            <motion.span className="absolute inset-0 grid place-items-center rounded-full bg-ink text-[13px] font-medium text-bg" style={{ opacity: unlogged }}>Log result</motion.span>
            <motion.span className="absolute inset-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface text-[13px] font-medium text-ink" style={{ opacity: logged }}><Check size={13} weight="bold" />Logged</motion.span>
          </motion.div>
        </div>
      </Appear>
      <div className="absolute inset-x-4 top-[156px]">
        <Bar clock={clock} at={4.7} to={5.4} label="Your usual" value={compact(usual)} width={(usual / views) * wide} tone="bg-line-strong" className="top-0" />
        <Bar clock={clock} at={5.0} to={6.2} label="This post" value={compact(views)} width={wide} tone="bg-ink" className="top-[52px]" />
      </div>
      <Appear clock={clock} at={5.4} dur={0.5} className="absolute bottom-4 right-4 w-[118px] text-right">
        <Num clock={clock} from={5.5} to={6.9} value={lift} decimals={1} suffix="x" fn={ease.expo} className="block font-display text-[44px] font-medium leading-none tracking-tight text-ink" />
        <p className="mt-1 text-[12px] leading-tight text-muted">your usual views</p>
      </Appear>
      <Pointer clock={clock} stops={stops} clicks={[1.9, 4.2]} />
    </>
  );
}

/* 6. CREO learns: the result becomes a memory, the hook's lift moves, and the next draft starts from it. */

export function LearnScene({ clock, c }: SceneProps) {
  const { from, to, hook, note } = c.learn;
  const px = (v: number) => clamp01(v - 1) * 368;
  const grow = useSpan(clock, 3.3, 4.7, ease.inOut);
  const w = useTransform(grow, (v) => px(from) + (px(to) - px(from)) * v);
  const spin = useSpan(clock, 5.6, 6.6, ease.inOut);
  const rot = useTransform(spin, (v) => v * 360);
  return (
    <>
      <Appear clock={clock} at={0.1} className="absolute inset-x-4 top-3.5"><Label>Saved to Creator Memory</Label></Appear>
      <Appear clock={clock} at={0.5} dur={0.7} y={16} className="absolute inset-x-4 top-[36px]">
        <ul className="rounded-2xl border border-line-strong bg-surface px-3.5 shadow-panel [&>li]:py-2.5 [&_p]:text-[13.5px] [&_p]:leading-snug">
          <MemoryRow item={{ id: "learned", kind: "outcome", text: note, source: "hq", at: "2026-10-04T08:00:00.000Z" }} compact />
        </ul>
      </Appear>
      <Appear clock={clock} at={2.6} className="absolute inset-x-4 top-[150px]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13.5px] font-medium text-ink">{hook} openings</p>
          <p className="font-display text-[22px] font-medium leading-none tracking-tight text-ink"><span className="tnum text-faint">{from.toFixed(1)}x</span> <span className="text-faint">to</span> <LiftNow clock={clock} from={from} to={to} /></p>
        </div>
      </Appear>
      <Appear clock={clock} at={2.9} className="absolute inset-x-4 top-[184px]">
        <div className="relative h-4">
          <span className="absolute left-0 top-1.5 h-0.5 w-full rounded-full bg-line" />
          <motion.span className="absolute left-0 top-1 h-1.5 origin-left rounded-full bg-mark" style={{ width: w }} />
          <motion.span className="absolute top-0 size-4 -translate-x-2 rounded-full border-2 border-bg bg-ink" style={{ left: w }} />
        </div>
        <div className="mt-1 flex justify-between text-[11.5px] text-faint"><span>1x, your usual</span><span>2x</span></div>
      </Appear>
      <Appear clock={clock} at={5.4} className="absolute bottom-3.5 left-4 flex items-center gap-2 text-[13.5px] font-medium text-ink">
        <motion.span style={{ rotate: rot }} className="grid size-6 place-items-center rounded-full bg-eyebrow text-on-eyebrow"><ArrowsClockwise size={14} weight="bold" /></motion.span>
        Your next draft starts from here.
      </Appear>
    </>
  );
}

function LiftNow({ clock, from, to }: { clock: Clock; from: number; to: number }) {
  const mv = useTransform(clock, (t) => `${(from + (to - from) * span(t, 3.3, 4.7, ease.inOut)).toFixed(1)}x`);
  return <Text value={mv} className="tnum" />;
}

/* The six scenes, with the line CREO says under each one and a plain-text description for screen readers. */

export type SceneDef = { view: string; duration: number; answer: string; summary: (c: FlowCase) => string; Body: (p: SceneProps) => ReactNode };

export const SCENES: SceneDef[] = [
  { view: "Trend", duration: 6.4, answer: "CREO reads your trends and spots the one worth your time.", Body: SeeScene, summary: (c) => `CREO goes through ${c.saved} trends and picks out "${c.fit.title}", a ${c.fit.status} pattern.` },
  { view: "Trend", duration: 7.2, answer: "It checks the trend against your own posts and shows why.", Body: UnderstandScene, summary: (c) => `Creator fit ${c.fit.score} out of 100. ${c.fit.why.join(" ")} ${c.fit.verdict}` },
  { view: "Studio", duration: 8.2, answer: "CREO drafts the hook, script, shots and caption.", Body: RecommendScene, summary: (c) => `CREO drafts a ${c.lengthSec} second Reel: a hook, a script, ${c.shots} shots, a caption and ${c.titles} titles. Highlighted words are left for you to fill in.` },
  { view: "Studio", duration: 8.2, answer: "You add your real result and approve. Nothing goes out without you.", Body: CreateScene, summary: (c) => `You fill in your own result, "${c.hook.filled}", and approve the draft. You post it yourself.` },
  { view: "Memory", duration: 8.6, answer: "You log the numbers. CREO compares them with your usual.", Body: ResultScene, summary: (c) => `You log ${c.result.views.toLocaleString("en-IN")} views. CREO sets that against your usual ${c.result.usual.toLocaleString("en-IN")}: ${c.result.lift.toFixed(1)}x.` },
  { view: "Memory", duration: 7.4, answer: "CREO remembers what worked, so the next draft starts ahead.", Body: LearnScene, summary: (c) => `${c.learn.note} ${c.learn.hook} openings move from ${c.learn.from.toFixed(1)}x to ${c.learn.to.toFixed(1)}x. The next draft starts from this.` },
];
