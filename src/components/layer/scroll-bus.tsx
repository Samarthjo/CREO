"use client";

import { useEffect } from "react";
import { layerBus } from "./bus";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round = (n: number) => Math.round(n * 1000) / 1000;

/** The scroll length that drives the hero fade: a little under one screen. */
const HERO_SCREENS = 0.7;

/**
 * Writes the scroll position to the bus and to CSS. layerBus.progress and --p on .layer run from 0 at the top to 1 at
 * the end of the story; --hp runs from 0 to 1 over the first screen and fades the hero. No React state, one rAF per scroll.
 */
export function ScrollBus() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".layer");
    if (!root) return;
    const fades = root.querySelectorAll<HTMLElement>("[data-hp]");
    let raf = 0;
    let p = -1;
    let hp = -1;

    const storyEnd = () => {
      const el = document.getElementById("story-end") ?? document.getElementById("story");
      return el ? el.getBoundingClientRect().bottom + scrollY : document.documentElement.scrollHeight;
    };

    const update = () => {
      raf = 0;
      const nextP = round(clamp01(scrollY / Math.max(1, storyEnd() - innerHeight)));
      const nextHp = round(clamp01(scrollY / (innerHeight * HERO_SCREENS)));
      layerBus.progress = nextP;
      if (nextP !== p) {
        p = nextP;
        root.style.setProperty("--p", String(p));
      }
      if (nextHp !== hp) {
        hp = nextHp;
        for (const el of fades) el.style.setProperty("--hp", String(hp));
      }
    };

    const schedule = () => {
      raf ||= requestAnimationFrame(update);
    };

    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
