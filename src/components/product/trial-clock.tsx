"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Locks a workspace tab that was left open when the trial ends. The proxy already stops every page load and every click
 * to another workspace page after that moment; this covers the tab that is simply left open on one page.
 *
 * The browser's clock only decides when to ask. The answer comes from the server: refreshing runs the proxy, which sends an
 * ended trial to the keep-CREO page. A device with the wrong time therefore never locks anyone out early; it only asks more often.
 * Timers pause while a laptop or phone sleeps, so the check also runs when the tab wakes up and once a minute besides.
 */
export function TrialClock({ until }: { until: number }) {
  const router = useRouter();
  useEffect(() => {
    const check = () => { if (Date.now() >= until) router.refresh(); };
    const wait = Math.min(Math.max(until - Date.now(), 0) + 250, 2 ** 31 - 1); // a timer cannot be longer than about 24 days; the minute check covers the rest
    const timer = window.setTimeout(check, wait);
    const tick = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    check();
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [until, router]);
  return null;
}
