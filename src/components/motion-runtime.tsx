"use client";

import { useEffect } from "react";

/**
 * Pauses the scene's loops (clouds, swaying trees) while their scene is off screen and while the tab is hidden.
 * CSS does the pausing: this only sets data-offscreen on a scene and data-tab-hidden on <html>.
 */
export function MotionRuntime() {
  useEffect(() => {
    const html = document.documentElement;
    const onVisibility = () => html.toggleAttribute("data-tab-hidden", document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)), { rootMargin: "80px" });
    const scan = () => document.querySelectorAll("[data-time]").forEach((el) => { if (!seen.has(el)) { seen.add(el); io.observe(el); } });
    scan();
    // New pages bring new scenes.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      mo.disconnect();
      html.removeAttribute("data-tab-hidden");
    };
  }, []);
  return null;
}
