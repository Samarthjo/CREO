"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * The visitor's reduced-motion setting, safe to build markup from.
 * Motion reads the setting on the very first client render, which the server cannot know, so markup that depends on it
 * would not match what the server sent. This stays false until the page has hydrated, then settles on the real value.
 */
export function useReduce(): boolean {
  const pref = useReducedMotion();
  const [on, setOn] = useState(false);
  useEffect(() => setOn(!!pref), [pref]);
  return on;
}
