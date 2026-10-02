import { layerBus } from "./bus";

/** From this progress on, the CTA covers the stage and nothing behind it needs drawing. */
export const CTA_PROGRESS = 0.92;

export interface LoopOptions {
  /** Observed for visibility; the loop pauses while it is outside the viewport. */
  target: Element;
  /** Draw one frame. Returns true if it drew. */
  frame: (timeMs: number) => boolean;
  /** After each frame. frameMs is null on the first frame after a start or resume, because that gap is not a frame time. */
  onFrame?: (frameMs: number | null, drew: boolean, timeMs: number) => void;
}

export interface Loop {
  dispose(): void;
}

/** One requestAnimationFrame loop. It schedules nothing while the tab is hidden, the CTA covers the stage or the target is off screen. */
export function createLoop({ target, frame, onFrame }: LoopOptions): Loop {
  let raf = 0;
  let check = 0;
  let last = -1;
  let visible = true;
  let disposed = false;

  const canRun = () => !disposed && visible && !document.hidden && layerBus.progress < CTA_PROGRESS;

  const tick = (t: number) => {
    raf = 0;
    if (!canRun()) {
      last = -1;
      return;
    }
    const drew = frame(t);
    onFrame?.(last < 0 ? null : t - last, drew, t);
    last = t;
    if (!disposed) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (canRun()) {
      if (!raf) raf = requestAnimationFrame(tick);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = -1;
    }
  };

  // layerBus.progress has no event of its own, so a scroll re-checks it. The check waits one frame so the page's own scroll handler has already written it.
  const onScroll = () => {
    if (raf || check) return;
    check = requestAnimationFrame(() => {
      check = 0;
      wake();
    });
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    wake();
  });
  io.observe(target);
  document.addEventListener("visibilitychange", wake);
  addEventListener("scroll", onScroll, { passive: true });
  wake();

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(check);
      raf = check = 0;
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      removeEventListener("scroll", onScroll);
    },
  };
}
