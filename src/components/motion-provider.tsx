"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Reduced motion, handled in one place. With "user", Motion turns off transform and layout animations when the visitor
 * asks for less motion and keeps gentle opacity fades. Components must not branch their markup on the preference,
 * because the server cannot know it and hydration would mismatch.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
