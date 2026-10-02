"use client";

import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives a step story from scroll. On large screens with motion allowed the section is tall and its stage sticks,
 * so scroll position picks the step; scroll speed is never altered. Everywhere else the steps are plain state
 * (tap, click or keyboard) and nothing is pinned.
 */
export function usePinnedSteps(count: number) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setPinned(mq.matches && !reduce);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!pinned) return;
    setActive(Math.min(count - 1, Math.max(0, Math.floor(v * count))));
  });

  const go = useCallback(
    (i: number) => {
      setActive(i);
      const el = ref.current;
      if (!el || !pinned) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const span = el.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + ((i + 0.5) / count) * span, behavior: reduce ? "auto" : "smooth" });
    },
    [count, pinned, reduce],
  );

  return { ref, pinned, active, go };
}
