"use client";

import { Cursor, Pause, Play } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useInView, useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState, type RefObject, type SyntheticEvent } from "react";
import { track } from "@/lib/analytics";
import { Button, cn } from "../ui/kit";

/**
 * A slow guided tour of the hero window. A pointer glides to each tab, a ring marks the thing it is about to press, a short note says
 * what to press (or what to look at), and the window changes the way it would for a visitor. Plays once when the window is on screen,
 * stops the moment the visitor touches anything, can be paused and replayed, and does not start by itself with reduced motion.
 *
 * Everything the tour touches carries a data-tour="id" attribute (see hero-product.tsx). The pointer, the note and the caption bar live
 * here; the highlight ring is plain CSS on [data-tour-on] (globals.css).
 */

export type TourView = "hq" | "trend" | "studio" | "collab" | "memory";

export type TourBeat = {
  /** The data-tour id the pointer goes to. */
  target: string;
  /** The note shown beside it. */
  say: string;
  /** Press it: a ripple, then `act` runs. */
  click?: boolean;
  act?: () => void;
  /** Which tab step this belongs to (for the caption bar). */
  step: number;
  /** Seconds the pointer takes to arrive, and seconds it stays once there. */
  travel: number;
  hold: number;
  /** Where in the target the pointer lands, as fractions of its width and height. */
  aim?: [number, number];
};

export const TOUR_STEPS = [
  { lead: "HQ", rest: "shows your next best move and why it fits you." },
  { lead: "Trend", rest: "scores your saved ideas against your history, best fit first." },
  { lead: "Studio", rest: "drafts hooks and a script. You pick the hook that sounds like you." },
  { lead: "Collab Inbox", rest: "prices a brand offer. Nothing is sent until you approve." },
  { lead: "Memory", rest: "keeps every approval and edit, so the next draft starts from it." },
] as const;

/** The whole tour, beat by beat. About 45 seconds, about nine per tab. */
export function tourBeats(a: { go: (v: TourView) => void; pick: (hookId: string) => void; approve: (on: boolean) => void; altHook: string; reset: () => void; phone?: boolean }): TourBeat[] {
  const tab = (id: TourView, step: number, travel = 1.5, hold = 0.9): TourBeat => ({ target: `tab-${id}`, say: TOUR_STEPS[step]!.lead, click: true, act: () => a.go(id), step, travel, hold, aim: [0.3, 0.5] });
  return [
    { target: "hq-fit", say: "CREO scores each idea against your history", step: 0, travel: 2, hold: 2.6 },
    { target: "hq-why", say: "and shows why it fits you", step: 0, travel: 1.2, hold: 2.8, aim: [0.2, 0.4] },

    tab("trend", 1),
    { target: "trend-first", say: "Every saved idea is ranked by fit, best first", step: 1, travel: 1.3, hold: 3.2, aim: [0.06, 0.5] },

    tab("studio", 2, 1.5, 2.4),
    { target: `hook-${a.altHook}`, say: "the hook that sounds like you", click: true, act: () => a.pick(a.altHook), step: 2, travel: 1.5, hold: 1, aim: [0.5, 0.55] },
    { target: "script-hook", say: "Your pick opens the script", step: 2, travel: 1.2, hold: 3, aim: [0.3, 0.5] },

    tab("collab", 3),
    { target: "collab-price", say: "CREO prices the offer and sets a walk-away number", step: 3, travel: 1.3, hold: 3, aim: [0.18, 0.5] },
    { target: "collab-approve", say: "Approve. Nothing is sent until you do", click: true, act: () => a.approve(true), step: 3, travel: 1.3, hold: 2.6 },

    tab("memory", 4),
    { target: "memory-list", say: "Every approval and edit is kept for your next draft", step: 4, travel: 1.3, hold: 3.4, aim: [0.3, 0.18] },

    { target: "tab-hq", say: a.phone ? "Back to today" : "HQ", click: true, act: a.reset, step: 0, travel: 1.5, hold: 1.4, aim: a.phone ? [0.5, 0.5] : [0.3, 0.5] },
  ];
}

type Status = "idle" | "playing" | "paused" | "done" | "stopped";
type Place = { left?: number; right?: number; top: number; shift: "none" | "up" | "mid" };
type Note = { key: number; text: string; click: boolean; place: Place };
type Rect = { x: number; y: number; w: number; h: number };

const EASE_X = [0.55, 0, 0.2, 1] as const;
const EASE_Y = [0.35, 0, 0.15, 1] as const;

/** The first visible element carrying this data-tour id (the sidebar and the phone tab strip both carry the tab ids). */
function locate(root: HTMLElement, id: string): HTMLElement | null {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`))) if (el.getClientRects().length > 0) return el;
  return null;
}

/** Brings the target into view inside the scrolling panel or the phone tab strip, so the pointer never points at something hidden. */
async function reveal(el: HTMLElement, reduce: boolean, sleep: (s: number) => Promise<void>): Promise<void> {
  const behavior = reduce ? "auto" : "smooth";
  const panel = el.closest<HTMLElement>("[data-tour-scroll]");
  if (panel && panel.scrollHeight > panel.clientHeight + 4) {
    const p = panel.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.bottom > p.bottom - 12 || r.top < p.top + 12) {
      panel.scrollTo({ top: panel.scrollTop + (r.top - p.top) - 24, behavior });
      await sleep(0.6);
    }
  }
  const strip = el.closest<HTMLElement>("[role=tablist]");
  if (strip && strip.scrollWidth > strip.clientWidth + 4) {
    const s = strip.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.left < s.left + 8 || r.right > s.right - 8) {
      strip.scrollTo({ left: strip.scrollLeft + (r.left - s.left) - (s.width - r.width) / 2, behavior });
      await sleep(0.5);
    }
  }
}

/** Where the note sits: right of a sidebar tab, otherwise under the target (above it near the bottom), anchored to the nearer side. */
function placeNote(r: Rect, W: number, H: number, target: string): Place {
  if (W >= 768 && target.startsWith("tab-")) return { left: r.x + r.w + 16, top: r.y + r.h / 2, shift: "mid" };
  const below = r.y + r.h + 72 < H - 56;
  const top = below ? r.y + r.h + 14 : r.y - 14;
  const shift = below ? "none" : "up";
  return r.x + r.w / 2 > W * 0.6 ? { right: Math.max(10, W - (r.x + r.w)), top, shift } : { left: Math.max(10, r.x), top, shift };
}

export function useProductTour({ enabled, frame, beats, reset, reduce }: { enabled: boolean; frame: RefObject<HTMLDivElement | null>; beats: TourBeat[]; reset: () => void; reduce: boolean }) {
  const inView = useInView(frame, { amount: 0.45 });
  const [awake, setAwake] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [on, setOn] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [clicks, setClicks] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const seen = useMotionValue(0);
  const press = useMotionValue(1);
  const at = useRef(0); // the beat to play next
  const placed = useRef(false); // the pointer has a position on screen
  const auto = useRef(false); // the automatic start has been used or cancelled
  const key = useRef(0);

  // A hidden browser tab throttles timers and animation frames separately, which would put the pointer and the window out of step.
  useEffect(() => {
    const f = () => setAwake(!document.hidden);
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);

  // Starts by itself once, a moment after the window is on screen. Never with reduced motion.
  useEffect(() => {
    if (!enabled || reduce || !inView || status !== "idle" || auto.current) return;
    const t = setTimeout(() => { auto.current = true; setStatus("playing"); }, 1600);
    return () => clearTimeout(t);
  }, [enabled, reduce, inView, status]);

  // The player. Leaving the screen, pausing or a visitor's touch stops it; playing again resumes at the beat it was on.
  useEffect(() => {
    if (!enabled || status !== "playing" || !inView || !awake) return;
    const root = frame.current;
    if (!root) return;
    let alive = true;
    const waits = new Set<() => void>();
    const running: { stop(): void }[] = [];
    let cancel!: () => void;
    const cancelled = new Promise<void>((r) => { cancel = r; });
    const until = (p: PromiseLike<unknown>) => Promise.race([Promise.resolve(p), cancelled]);
    const sleep = (s: number) =>
      new Promise<void>((done) => {
        const release = () => { clearTimeout(t); waits.delete(release); done(); };
        const t = setTimeout(release, s * 1000);
        waits.add(release);
      });

    const play = async (b: TourBeat) => {
      setOn(null);
      let el: HTMLElement | null = null;
      // The next tab may still be fading in, so look for the target for up to three seconds.
      for (let i = 0; i < 30 && alive; i++) {
        el = locate(root, b.target);
        if (el) break;
        await sleep(0.1);
      }
      if (!alive || !el) return;
      await reveal(el, reduce, sleep);
      if (!alive) return;

      const box = root.getBoundingClientRect();
      const t = el.getBoundingClientRect();
      const r: Rect = { x: t.left - box.left, y: t.top - box.top, w: t.width, h: t.height };
      const px = r.x + r.w * (b.aim?.[0] ?? 0.5);
      const py = r.y + r.h * (b.aim?.[1] ?? 0.5);
      if (!placed.current) {
        x.set(box.width - 72);
        y.set(box.height - 110);
        placed.current = true;
      }
      key.current += 1;
      setNote({ key: key.current, text: b.say, click: !!b.click, place: placeNote(r, box.width, box.height, b.target) });
      setStep(b.step);

      const d = reduce ? 0.01 : b.travel;
      const fade = animate(seen, 1, { duration: 0.35 });
      const ax = animate(x, px, { duration: d, ease: EASE_X });
      const ay = animate(y, py, { duration: d * 0.92, ease: EASE_Y });
      running.push(fade, ax, ay);
      await until(Promise.all([ax, ay]));
      if (!alive) return;

      setOn(b.target);
      if (b.click) {
        await sleep(reduce ? 0.25 : 0.6);
        if (!alive) return;
        if (!reduce) running.push(animate(press, [1, 0.82, 1], { duration: 0.34 }));
        setClicks((n) => n + 1);
        await sleep(0.2);
        if (!alive) return;
        b.act?.();
        root.querySelector<HTMLElement>("[data-tour-scroll]")?.scrollTo({ top: 0 });
      }
      await sleep(b.hold);
    };

    (async () => {
      while (alive && at.current < beats.length) {
        await play(beats[at.current]!);
        if (!alive) return;
        at.current += 1;
      }
      if (alive) {
        setStatus("done");
        track("tour_control", { action: "finished" });
      }
    })();

    return () => {
      alive = false;
      cancel();
      waits.forEach((release) => release());
      running.forEach((c) => c.stop());
    };
  }, [enabled, status, inView, awake, beats, frame, reduce, x, y, seen, press]);

  // Once it has finished or been taken over, the pointer, the note and the ring go away.
  useEffect(() => {
    if (status !== "done" && status !== "stopped" && status !== "idle") return;
    setOn(null);
    setNote(null);
    const c = animate(seen, 0, { duration: 0.4 });
    return () => c.stop();
  }, [status, seen]);

  const begin = useCallback(() => {
    at.current = 0;
    placed.current = false;
    auto.current = true;
    reset();
    setStep(0);
    setOn(null);
    setNote(null);
    setStatus("playing");
  }, [reset]);

  const toggle = () => {
    if (status === "playing") { setStatus("paused"); track("tour_control", { action: "pause" }); }
    else if (status === "paused") { setStatus("playing"); track("tour_control", { action: "play" }); }
    else { track("tour_control", { action: status === "idle" ? "play" : "replay" }); begin(); }
  };

  /** Hands the window to the visitor: the pointer, the note and the ring go away. */
  const stop = () => {
    if (status === "playing" || status === "paused") { setStatus("stopped"); track("tour_control", { action: "takeover" }); }
    else if (status === "idle") { auto.current = true; setStatus("stopped"); }
  };

  /** Any press inside the window (other than the tour's own controls) hands it to the visitor. */
  const takeover = (e: SyntheticEvent) => {
    if (!enabled || (e.target as Element).closest?.("[data-tour-ui]")) return;
    // A finger that starts a page scroll on the window is not a visit to the window: only a tap (the click that follows) counts.
    if (e.type === "pointerdown" && (e.nativeEvent as PointerEvent).pointerType === "touch") return;
    stop();
  };

  return { enabled, status, step, on, note, clicks, x, y, seen, press, reduce, toggle, replay: begin, takeover, stop };
}

export type Tour = ReturnType<typeof useProductTour>;

/** The pointer, its click ripple and the note. Decorative: the caption bar carries the same information as text. */
export function TourOverlay({ tour }: { tour: Tour }) {
  const n = tour.note;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {n && (
          <div key={n.key} className="absolute" style={{ left: n.place.left, right: n.place.right, top: n.place.top, transform: n.place.shift === "up" ? "translateY(-100%)" : n.place.shift === "mid" ? "translateY(-50%)" : undefined }}>
            <motion.div
              initial={{ opacity: 0, y: n.place.shift === "up" ? -6 : 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.25 }}
              className="inline-flex max-w-[min(21rem,calc(100vw-3rem))] items-center gap-2 rounded-full bg-ink py-1.5 pl-1.5 pr-3.5 text-[0.8125rem] font-medium leading-snug text-bg shadow-pop"
            >
              {n.click ? (
                <span className="rounded-full bg-lime-400 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#11140c]">Click</span>
              ) : (
                <span className="ml-1.5 size-1.5 shrink-0 rounded-full bg-lime-400" />
              )}
              <span className="min-w-0">{n.text}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div className="absolute left-0 top-0" style={{ x: tour.x, y: tour.y, opacity: tour.seen }}>
        {tour.clicks > 0 && !tour.reduce && (
          <motion.span key={tour.clicks} initial={{ scale: 0.3, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute -left-5 -top-5 size-10 rounded-full border-2 border-accent bg-accent/15" />
        )}
        <motion.div style={{ scale: tour.press, originX: 0, originY: 0 }} className="-ml-[3px] -mt-[2px]">
          <Cursor size={30} weight="fill" className="text-ink [filter:drop-shadow(0_0_1.5px_var(--bg))_drop-shadow(0_5px_8px_rgb(0_0_0/0.28))]" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/** The play or pause button for a phone, which sits in the window's header (the strip along the bottom is not shown there). */
export function TourToggle({ tour, className }: { tour: Tour; className?: string }) {
  const over = tour.status === "done" || tour.status === "stopped";
  const word = tour.status === "playing" ? "Pause" : over ? "Replay" : "Play";
  return (
    <button
      data-tour-ui
      type="button"
      onClick={tour.toggle}
      aria-label={tour.status === "playing" ? "Pause the tour" : over ? "Replay the tour" : "Play the tour"}
      className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-bg transition hover:opacity-90 active:translate-y-px", className)}
    >
      {tour.status === "playing" ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
      <span className="text-[0.8125rem] font-semibold leading-none">{word}</span>
    </button>
  );
}

/** The strip along the bottom of the window: play or pause, five dots (one per tab), and one line saying what the current tab is for. Not shown on a phone. */
export function TourBar({ tour }: { tour: Tour }) {
  const live = tour.status === "playing" || tour.status === "paused";
  const s = TOUR_STEPS[tour.step]!;
  const over = tour.status === "done" || tour.status === "stopped";
  return (
    <div data-tour-ui className="flex min-h-14 items-center gap-3 border-t border-line bg-surface px-4 py-2.5 max-sm:hidden sm:px-5">
      <button
        type="button"
        onClick={tour.toggle}
        aria-label={tour.status === "playing" ? "Pause the tour" : over ? "Replay the tour" : "Play the tour"}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-bg transition hover:opacity-90 active:translate-y-px pointer-coarse:size-11"
      >
        {tour.status === "playing" ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" className="ml-0.5" />}
      </button>
      <ol aria-hidden className="hidden items-center gap-1.5 sm:flex">
        {TOUR_STEPS.map((t, i) => (
          <li key={t.lead} className={cn("h-1.5 rounded-full transition-all duration-500", live && i === tour.step ? "w-7 bg-accent" : live && i < tour.step ? "w-1.5 bg-accent/55" : "w-1.5 bg-line-strong")} />
        ))}
      </ol>
      <p className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-body">
        {live ? (
          <span key={tour.step} className="animate-[tour-caption_0.5s_ease-out_both]"><span className="font-semibold text-ink">{s.lead}</span> {s.rest}</span>
        ) : over ? (
          <><span className="font-semibold text-ink">Your turn.</span> Click any tab to try it yourself.</>
        ) : tour.reduce ? (
          "Press play to watch how each tab works."
        ) : (
          "Watch how each tab works."
        )}
      </p>
      {over && <Button size="sm" variant="ghost" onClick={tour.replay} className="shrink-0">Replay tour</Button>}
    </div>
  );
}
