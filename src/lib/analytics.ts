// Analytics: PostHog, started once in the browser (see instrumentation-client.ts).
//
// The promise, which the Cookies Settings page repeats:
//  - Until a visitor says yes, nothing is stored on their device. Visits are counted without a cookie, by a number PostHog makes from the
//    request and throws away at the end of the day, so nobody can be followed from one day to the next. Clicks, scrolling and recordings
//    are not collected at all.
//  - After a yes, PostHog remembers the visit and also records clicks and how the site is used. Everything typed is hidden in recordings.
//  - A browser that asks not to be tracked (Do Not Track, Global Privacy Control) is not counted, not even without cookies.
//  - Events carry choices, counts and yes/no answers, never what someone typed (see analytics-events.ts).
import posthog from "posthog-js";
import { ctaProps, NEEDS_CONSENT, type EventMap, type EventName, type TrackedEvent } from "./analytics-events.ts";

/** The project's public key. It is set on the production deployment only, so previews and local runs send nothing. */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** What a visitor has decided. "off" means analytics is not running at all in this browser. */
export type Consent = "off" | "pending" | "granted" | "denied";

let running = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Do Not Track or Global Privacy Control: the browser is asking not to be tracked. */
function asksNotToBeTracked(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  return n.globalPrivacyControl === true || n.doNotTrack === "1" || (window as { doNotTrack?: string }).doNotTrack === "1" || n.msDoNotTrack === "1";
}

export function getConsent(): Consent {
  if (!running) return "off";
  try {
    return posthog.get_explicit_consent_status();
  } catch {
    return "off";
  }
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Removes what PostHog keeps in this browser: its visitor ID, session and window markers. The visitor's own yes/no stays unless asked otherwise. */
function sweep(keepChoice: boolean): void {
  const mine = (k: string) => (k.startsWith("ph_") || k.startsWith("__ph_")) && !(keepChoice && k.startsWith("__ph_opt_in_out_"));
  try {
    for (const store of [localStorage, sessionStorage]) for (const k of Object.keys(store)) if (mine(k)) store.removeItem(k);
    for (const c of document.cookie.split(";")) {
      const k = c.split("=")[0].trim();
      if (mine(k)) document.cookie = `${k}=; Max-Age=0; path=/`;
    }
  } catch { /* storage is blocked: there is nothing to clear */ }
}

/** The visitor said yes: PostHog may now remember them and record how the site is used. */
export function grantConsent(): void {
  if (!running) return;
  try { posthog.opt_in_capturing(); } catch { /* analytics never breaks the page */ }
  notify();
}

/** The visitor said no (or changed their mind): visits are counted without storing anything, and recording stops. */
export function denyConsent(): void {
  if (!running) return;
  try { posthog.opt_out_capturing(); } catch { /* analytics never breaks the page */ }
  sweep(true);
  notify();
}

/** "Clear what CREO saved in this browser": forget the visitor and the choice, so the question is asked again. */
export function forgetAnalytics(): void {
  if (!running) return;
  try {
    posthog.opt_out_capturing();
    posthog.reset();
    posthog.clear_opt_in_out_capturing();
  } catch { /* analytics never breaks the page */ }
  sweep(false);
  notify();
}

/** Send one event. Only the events and properties named in analytics-events.ts exist. */
export function track<K extends EventName>(name: K, props: EventMap[K]): void {
  if (!running) return;
  try { posthog.capture(name, props as Record<string, unknown>); } catch { /* analytics never breaks the page */ }
}

/** The same, for an event that arrives as a [name, properties] pair. */
export function trackEvent(event: TrackedEvent): void {
  if (!running) return;
  try { posthog.capture(event[0], event[1] as Record<string, unknown>); } catch { /* analytics never breaks the page */ }
}

// Clicks on anything marked data-track="id" become one event, so server-rendered links can be counted without becoming client components.
function onClick(e: MouseEvent) {
  const el = (e.target as Element | null)?.closest?.("[data-track]");
  const props = el && ctaProps(el);
  if (props) track("cta_clicked", props);
}

const CLICK_EVENTS: ReadonlySet<string> = new Set(["$autocapture", "$rageclick", "$dead_click"]);

export function initAnalytics(): void {
  if (running || typeof window === "undefined" || !KEY || asksNotToBeTracked()) return;
  try {
    posthog.init(KEY, {
      // Our own address; next.config.ts forwards it to PostHog.
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-08-30",
      // Nothing is stored and nothing is recorded until a visitor says yes. "on_reject" counts visits cookielessly in the meantime.
      cookieless_mode: "on_reject",
      opt_out_capturing_by_default: true,
      // A person profile only exists for someone we identify, and we identify nobody.
      person_profiles: "identified_only",
      cross_subdomain_cookie: false,
      capture_pageview: "history_change",
      capture_pageleave: true,
      capture_exceptions: true,
      capture_performance: { web_vitals: true },
      autocapture: true,
      capture_heatmaps: true,
      capture_dead_clicks: true,
      disable_surveys: true,
      session_recording: { maskAllInputs: true },
      before_send: (event) => {
        if (!event) return event;
        // Clicks, scrolling and recordings need a yes.
        if (NEEDS_CONSENT.has(event.event) && getConsent() !== "granted") return null;
        // Inside the workspace the screen is the creator's own work (topics, hooks, brand messages), so clicks there are not captured with their text.
        if (CLICK_EVENTS.has(event.event) && String(event.properties?.$pathname ?? "").startsWith("/app")) return null;
        return event;
      },
      loaded: (ph) => {
        const release = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
        if (release) ph.register({ release });
      },
    });
    running = true;
    document.addEventListener("click", onClick, true);
  } catch {
    running = false;
  }
}
