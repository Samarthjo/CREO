"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { MotionRuntime } from "./motion-runtime";

/**
 * Reduced motion, handled in one place. With "user", Motion turns off transform and layout animations when the visitor
 * asks for less motion and keeps gentle opacity fades. The footer switch does the same by hand (data-motion="off" on <html>).
 * Components must not branch their markup on either, because the server cannot know them and hydration would mismatch.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const read = () => setOff(document.documentElement.dataset.motion === "off");
    read();
    window.addEventListener("creo:motion", read);
    return () => window.removeEventListener("creo:motion", read);
  }, []);
  return (
    <MotionConfig reducedMotion={off ? "always" : "user"}>
      <MotionRuntime />
      {children}
    </MotionConfig>
  );
}
