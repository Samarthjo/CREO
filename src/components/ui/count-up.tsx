"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Counts from 0 to `to` once, the first time it is mostly in view. With reduced motion it jumps straight to the final value.
 * The first render is identical on server and client (always 0), so hydration never mismatches.
 */
export function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 0.9, className }: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (reduce) { setV(to); return; }
    if (!inView) return;
    const controls = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${to.toFixed(decimals)}${suffix}`}>
      <span aria-hidden>{prefix}{v.toFixed(decimals)}{suffix}</span>
    </span>
  );
}
