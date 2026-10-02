"use client";

import { useEffect } from "react";
import { layerBus } from "../bus";

// The same query as story.css, so the script and the stylesheet always agree on which layout is showing. The height is in
// rem so that a larger text setting, which makes the cards taller, switches to the stacked layout sooner (see story.css).
const PINNED = "(min-width: 1024px) and (min-height: 36rem) and (prefers-reduced-motion: no-preference)";
const REDUCED = "(prefers-reduced-motion: reduce)";
const BEATS = 5;
/** Beat 1 starts this many screens before the section pins, so its card is already rising into view. */
const LEAD = 0.5;
/** A beat draws over the first DRAW of its slot, then holds fully drawn for the rest. */
const DRAW = 0.65;
/** A beat is never empty when it arrives: its progress starts here rather than at 0. */
const HEAD = 0.12;
/** Where in a beat a rail click lands: past the point where its object has finished drawing (above DRAW). */
const LAND = 0.78;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round = (n: number) => Math.round(n * 500) / 500;

/**
 * Drives the story from scroll with no React state. It works out the active beat, toggles data-active and data-pos on the
 * beats and the rail, writes --bu (0 to 1 progress inside a beat) on each beat and --q (0 to 1 across the story) on the
 * section, and writes the beat to layerBus. Pinned layout reads the pinned scroll range; the stacked layout reads where
 * each beat sits in the viewport. Whichever layout shows, scrolling back or jumping leaves a state that is valid for the
 * position, because nothing is accumulated.
 */
export function StoryScroll() {
  useEffect(() => {
    const root = document.getElementById("story");
    if (!root) return;
    const beats = [...root.querySelectorAll<HTMLElement>("[data-beat]")];
    const rail = [...root.querySelectorAll<HTMLElement>("[data-rail]")];
    const pinnedMq = matchMedia(PINNED);
    const reducedMq = matchMedia(REDUCED);
    let raf = 0;
    let active = -2;
    let q = -1;
    const bu: number[] = [];

    const show = (i: number) => {
      active = i;
      layerBus.beat = i;
      beats.forEach((el, k) => mark(el, k, i));
      rail.forEach((el, k) => {
        mark(el, k, i);
        const a = el.querySelector("a");
        if (k === i) a?.setAttribute("aria-current", "step");
        else a?.removeAttribute("aria-current");
      });
    };

    const update = () => {
      raf = 0;
      const vh = innerHeight;
      const motion = !reducedMq.matches;
      const top = root.getBoundingClientRect().top + scrollY;

      let next: number;
      let nextQ = -1;
      const bs: number[] = beats.map(() => 0);
      if (pinnedMq.matches) {
        const start = top - LEAD * vh;
        const len = root.offsetHeight - vh + LEAD * vh;
        const raw = (scrollY - start) / Math.max(1, len);
        nextQ = clamp01(raw);
        next = raw < 0 ? -1 : Math.min(BEATS - 1, Math.floor(raw * BEATS));
        beats.forEach((_, i) => (bs[i] = clamp01((nextQ * BEATS - i) / DRAW + HEAD)));
      } else {
        // Stacked: the beat nearest the middle of the screen is the active one; each beat fills in as it rises into view.
        next = -1;
        let near = Infinity;
        beats.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          bs[i] = clamp01((vh * 0.95 - r.top) / (vh * 0.55));
          const d = Math.abs(r.top + r.height / 2 - vh / 2);
          if (r.top < vh * 0.85 && r.bottom > 0 && d < near) [near, next] = [d, i];
        });
      }

      if (next !== active) show(next);
      if (!motion || !pinnedMq.matches) {
        if (q !== -1) root.style.removeProperty("--q");
        q = -1;
      } else if (round(nextQ) !== q) {
        q = round(nextQ);
        root.style.setProperty("--q", String(q));
      }
      beats.forEach((el, i) => {
        if (!motion) {
          if (bu[i] !== undefined) el.style.removeProperty("--bu");
          delete bu[i];
          return;
        }
        const v = round(bs[i]!);
        if (v !== bu[i]) {
          bu[i] = v;
          el.style.setProperty("--bu", String(v));
        }
      });
    };

    const schedule = () => {
      raf ||= requestAnimationFrame(update);
    };

    const go = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-go]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const i = Number(a.dataset.go);
      const target = beats[i];
      if (!target) return;
      e.preventDefault();
      const vh = innerHeight;
      let y: number;
      if (pinnedMq.matches) {
        const start = root.getBoundingClientRect().top + scrollY - LEAD * vh;
        const len = root.offsetHeight - vh + LEAD * vh;
        y = start + ((i + LAND) / BEATS) * len;
      } else {
        const r = target.getBoundingClientRect();
        y = r.top + scrollY - Math.max(0, (vh - r.height) / 2);
      }
      scrollTo({ top: y, behavior: reducedMq.matches ? "auto" : "smooth" });
      // Keyboard activation (Enter gives detail 0): once the beat is showing, move focus into it, so the next Tab
      // reaches that beat's own controls instead of the four remaining rail links.
      if (e.detail === 0) focusBeatWhenShown(i);
    };

    const focusBeatWhenShown = (i: number) => {
      let timer = 0;
      const land = () => {
        removeEventListener("scrollend", land);
        clearTimeout(timer);
        const el = beats[i];
        if (!el || active !== i) return;
        el.tabIndex = -1;
        el.focus({ preventScroll: true });
      };
      addEventListener("scrollend", land, { once: true });
      timer = window.setTimeout(land, 1400);
    };

    // Tabbing onto a rail link brings its beat into view, so a keyboard user can read what they land on.
    const focusRail = (e: FocusEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-go]");
      if (!a || !pinnedMq.matches) return;
      const i = Number(a.dataset.go);
      if (i === active) return;
      const vh = innerHeight;
      const start = root.getBoundingClientRect().top + scrollY - LEAD * vh;
      const len = root.offsetHeight - vh + LEAD * vh;
      scrollTo({ top: start + ((i + LAND) / BEATS) * len, behavior: "auto" });
    };

    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    pinnedMq.addEventListener("change", schedule);
    reducedMq.addEventListener("change", schedule);
    root.addEventListener("click", go);
    root.addEventListener("focusin", focusRail);
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      pinnedMq.removeEventListener("change", schedule);
      reducedMq.removeEventListener("change", schedule);
      root.removeEventListener("click", go);
      root.removeEventListener("focusin", focusRail);
      cancelAnimationFrame(raf);
      layerBus.beat = -1;
    };
  }, []);

  return null;
}

function mark(el: HTMLElement, k: number, active: number) {
  el.dataset.active = String(k === active);
  el.dataset.pos = k < active ? "past" : k === active ? "now" : "next";
}
