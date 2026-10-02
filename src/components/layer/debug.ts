const HISTORY = 120;
const REFRESH_MS = 500;

export interface DebugInfo {
  tier: string;
  dpr: number;
  renderer: string;
  /** Draw calls of the last frame, when the scene exposes them. */
  calls: () => number | null;
}

export interface Debug {
  set(info: Partial<DebugInfo>): void;
  /** frameMs is the gap between frames, cpuMs the time spent inside scene.frame(). */
  push(frameMs: number, cpuMs: number): void;
  dispose(): void;
}

/** The ?debug overlay: a fixed mono readout, bottom left. Plain DOM, outside React and outside the copy buckets. */
export function createDebug(): Debug {
  const el = document.createElement("pre");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("data-copy-skip", "");
  el.style.cssText =
    "position:fixed;left:8px;bottom:8px;z-index:2147483647;margin:0;padding:6px 8px;pointer-events:none;" +
    "font:11px/1.45 'Geist Mono Variable',ui-monospace,monospace;color:#C6FF3D;background:rgba(7,8,11,.82);" +
    "border:1px solid #2A2D35;border-radius:4px;white-space:pre";
  document.body.append(el);

  const info: DebugInfo = { tier: "-", dpr: 0, renderer: "-", calls: () => null };
  const frames = new Float32Array(HISTORY);
  const cpu = new Float32Array(HISTORY);
  let count = 0;
  let dirty = true;

  const render = () => {
    if (!dirty) return;
    dirty = false;
    const n = Math.min(count, HISTORY);
    let line = "frame  -";
    if (n) {
      const f = frames.slice(0, n).sort();
      const avg = f.reduce((a, b) => a + b, 0) / n;
      const p95 = f[Math.min(n - 1, Math.floor(n * 0.95))];
      const cpuAvg = cpu.slice(0, n).reduce((a, b) => a + b, 0) / n;
      line = `frame  avg ${avg.toFixed(1)} ms  p95 ${p95.toFixed(1)} ms  cpu ${cpuAvg.toFixed(1)} ms  (${n})`;
    }
    const calls = info.calls();
    el.textContent = [
      `tier   ${info.tier}   dpr ${info.dpr ? info.dpr.toFixed(2) : "-"}`,
      `gpu    ${info.renderer}`,
      line,
      ...(calls === null ? [] : [`calls  ${calls}`]),
    ].join("\n");
  };
  render();
  const timer = setInterval(render, REFRESH_MS);

  return {
    set(next) {
      Object.assign(info, next);
      dirty = true;
    },
    push(frameMs, cpuMs) {
      frames[count % HISTORY] = frameMs;
      cpu[count % HISTORY] = cpuMs;
      count++;
      dirty = true;
    },
    dispose() {
      clearInterval(timer);
      el.remove();
    },
  };
}
