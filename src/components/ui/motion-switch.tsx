"use client";

import { useEffect, useState } from "react";
import { cn } from "./kit";

/** The motion off switch. On by default; the choice is remembered. A device that already asks for less motion keeps it off. */
export function MotionSwitch({ className }: { className?: string }) {
  const [off, setOff] = useState(false);
  const [system, setSystem] = useState(false);
  useEffect(() => {
    setOff(document.documentElement.dataset.motion === "off");
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setSystem(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  const on = !off && !system;
  const toggle = () => {
    const next = !off;
    document.documentElement.dataset.motion = next ? "off" : "on";
    try {
      localStorage.setItem("creo.motion", next ? "off" : "on");
    } catch {
      /* private mode */
    }
    window.dispatchEvent(new Event("creo:motion"));
    setOff(next);
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={system}
      title={system ? "Your device already asks for less motion" : undefined}
      onClick={toggle}
      className={cn("inline-flex h-9 items-center gap-2 rounded-full border border-current/40 px-3.5 text-[0.8125rem] font-medium transition hover:border-current disabled:opacity-70 pointer-coarse:h-11", className)}
    >
      Motion
      <span aria-hidden className={cn("grid h-5 w-9 items-center rounded-full border border-current/50 p-0.5 transition", on && "bg-current/15")}>
        <span className={cn("size-3.5 rounded-full bg-current transition-transform", on ? "translate-x-4" : "translate-x-0")} />
      </span>
      <span className="sr-only">{on ? "on" : "off"}</span>
    </button>
  );
}
