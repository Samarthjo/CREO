"use client";

import { ArrowCounterClockwise, Pause, Play } from "@phosphor-icons/react";
import { animate, motion, useInView, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { Logo } from "../product/logo";
import { Chip } from "../ui/kit";
import { useReduce } from "../ui/use-reduce";
import type { FlowCase } from "./flow-cases";
import { STAGE, type SceneDef } from "./flow-scenes";

const clockText = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

/**
 * A short example "video" of CREO at work, drawn live in the page rather than played from a file.
 * It behaves like a video: it starts when it comes into view, can be paused, scrubbed and replayed, and keeps a caption under it.
 * With reduced motion it shows the finished frame and does not move. The scene itself lives in flow-scenes.tsx.
 */
export function FlowPlayer({ scene, c }: { scene: SceneDef; c: FlowCase }) {
  const D = scene.duration;
  const reduce = useReduce();
  const clock = useMotionValue(0);
  const frame = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const inView = useInView(frame, { amount: 0.6 });
  const [scale, setScale] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [run, setRun] = useState(0);

  // The stage is drawn at one fixed size and scaled to the frame, so the picture is the same on every screen.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / STAGE.w);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Playing is only moving the clock. Out of view, paused or finished, the clock stands still.
  useEffect(() => {
    if (reduce) { clock.set(D); setEnded(true); return; }
    if (!inView || paused || clock.get() >= D) return;
    const play = animate(clock, D, { duration: D - clock.get(), ease: "linear", onComplete: () => setEnded(true) });
    return () => play.stop();
  }, [inView, paused, reduce, run, D, clock]);

  useMotionValueEvent(clock, "change", (t) => {
    const r = range.current;
    if (r) {
      r.value = String(Math.round((t / D) * 1000));
      r.style.setProperty("--p", `${(t / D) * 100}%`);
      r.setAttribute("aria-valuetext", `${clockText(t)} of ${clockText(D)}`);
    }
    if (time.current) time.current.textContent = clockText(t);
  });

  const toggle = () => {
    if (ended) {
      clock.set(0);
      setEnded(false);
      setPaused(false);
      setRun((n) => n + 1);
      track("flow_player", { action: "replay" });
      return;
    }
    setPaused(!paused);
    track("flow_player", { action: paused ? "play" : "pause" });
  };
  const scrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = (Number(e.target.value) / 1000) * D;
    setPaused(true);
    setEnded(t >= D - 0.02);
    clock.set(t);
  };

  const playing = !paused && !ended;
  return (
    <div ref={frame} role="group" aria-label="Example: CREO at work" className="overflow-hidden border-y border-line bg-bg shadow-pop sm:rounded-[1.25rem] sm:border">
      <div className="flex h-11 items-center justify-between gap-3 border-b border-line bg-surface px-4">
        <span className="flex items-center gap-2.5">
          <Logo word={false} className="[&_img]:size-6" />
          <span className="text-[0.8125rem] font-medium text-ink">{scene.view}</span>
        </span>
        <Chip tone="outline">Example</Chip>
      </div>

      <motion.div ref={box} aria-hidden initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="relative w-full overflow-hidden" style={{ aspectRatio: `${STAGE.w} / ${STAGE.h}` }}>
        <div data-stage="" className="absolute left-0 top-0 origin-top-left overflow-hidden bg-bg text-body" style={{ width: STAGE.w, height: STAGE.h, transform: `scale(${scale ?? 1})`, visibility: scale === null ? "hidden" : "visible" }}>
          <scene.Body clock={clock} c={c} />
        </div>
      </motion.div>
      <p className="sr-only">{scene.summary(c)}</p>

      <div className="flex min-h-[3.75rem] items-center gap-2.5 border-t border-line bg-surface px-4 py-2.5 sm:min-h-[4.9rem] lg:min-h-[3.75rem]">
        <Chip tone="lime" className="shrink-0">CREO</Chip>
        <span className="text-[0.875rem] leading-snug text-body">{scene.answer}</span>
      </div>

      {!reduce && (
        <div onPointerDown={(e) => e.stopPropagation()} className="flex h-11 items-center gap-3 border-t border-line bg-surface px-3">
          <button type="button" onClick={toggle} aria-label={ended ? "Replay" : playing ? "Pause" : "Play"} className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-bg transition hover:opacity-90 active:translate-y-px pointer-coarse:size-11">
            {ended ? <ArrowCounterClockwise size={15} weight="bold" /> : playing ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
          </button>
          <input ref={range} type="range" min={0} max={1000} step={1} defaultValue={0} onChange={scrub} aria-label="Position in the example" className="scrub min-w-0 flex-1" />
          <span className="tnum hidden w-[5.5rem] shrink-0 text-right text-xs text-muted sm:block"><span ref={time}>0:00</span> / {clockText(D)}</span>
        </div>
      )}
    </div>
  );
}
