"use client";

import { useSyncExternalStore } from "react";

/** The phone layout: below Tailwind's `sm` breakpoint (640px). Matches the `max-sm:` classes. */
const PHONE = "(max-width: 639px)";

const subscribe = (notify: () => void) => {
  const m = matchMedia(PHONE);
  m.addEventListener("change", notify);
  return () => m.removeEventListener("change", notify);
};

/**
 * True on a phone-sized screen. The server and the first client render say false, then it settles on the real answer,
 * so markup built from it still matches what the server sent. Use it for logic (which tab, which text for the tour);
 * for looks, prefer the `max-sm:` classes.
 */
export function usePhone(): boolean {
  return useSyncExternalStore(subscribe, () => matchMedia(PHONE).matches, () => false);
}
