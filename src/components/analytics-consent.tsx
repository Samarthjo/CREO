"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { denyConsent, getConsent, grantConsent, subscribeConsent, type Consent } from "@/lib/analytics";
import { Button } from "./ui/kit";

/** What the visitor has decided about analytics. "off" on the server and wherever analytics is not running. */
export function useConsent(): Consent {
  return useSyncExternalStore(subscribeConsent, getConsent, () => "off");
}

/**
 * The one question about analytics, asked once. Until it is answered nothing is stored on the visitor's device (see lib/analytics.ts),
 * and both answers are the same size, so neither is pushed. It appears a moment after the page, so it never competes with it.
 */
export function AnalyticsConsent() {
  const consent = useConsent();
  const path = usePathname();
  const [late, setLate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLate(true), 1200);
    return () => clearTimeout(t);
  }, []);
  // Cookies Settings has the same choice on the page itself.
  if (consent !== "pending" || !late || path === "/cookies") return null;
  return (
    <div role="region" aria-label="Analytics choice" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-[34rem] rounded-panel border border-line bg-surface p-4 shadow-pop sm:p-5">
      <p className="text-[0.9375rem] font-medium text-ink">Help us improve CREO?</p>
      <p className="mt-1.5 text-sm leading-relaxed text-body">
        We use PostHog to see which pages help. No ads, nothing sold. Allow it and we remember you between visits and record anonymous clicks, with everything you type hidden. Say no and we only count visits.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={grantConsent}>Allow analytics</Button>
        <Button variant="ghost" onClick={denyConsent}>No thanks</Button>
        <Link href="/cookies" className="ml-1 inline-flex min-h-9 items-center text-[0.8125rem] font-medium text-muted underline underline-offset-4 hover:text-ink pointer-coarse:min-h-11">Details</Link>
      </div>
    </div>
  );
}

const STATUS: Record<Consent, string> = {
  off: "Analytics is not running in this browser. Either the browser asks websites not to track it, which CREO respects, or this copy of the site has analytics switched off.",
  pending: "You have not chosen yet. Until you do, CREO only counts visits and stores nothing on your device.",
  granted: "Analytics is on. PostHog remembers your visits and records how you use the site, with everything you type hidden.",
  denied: "Analytics is off. CREO only counts visits and stores nothing on your device.",
};

/** The same choice, on the Cookies Settings page, so it can be changed whenever someone likes. */
export function AnalyticsChoice() {
  const consent = useConsent();
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="status" className="max-w-[60ch] text-sm text-body">{STATUS[consent]}</p>
      {consent !== "off" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={grantConsent} disabled={consent === "granted"}>Allow analytics</Button>
          <Button variant="ghost" onClick={denyConsent} disabled={consent === "denied"}>Turn analytics off</Button>
        </div>
      )}
    </div>
  );
}
