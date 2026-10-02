"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { MotionRuntime } from "./motion-runtime";

/**
 * Reduced motion, handled in one place. With "user", Motion turns off transform and layout animations when the visitor's
 * device asks for less motion and keeps gentle opacity fades. The scene's CSS loops follow the same media query.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <MotionRuntime />
      {children}
    </MotionConfig>
  );
}
