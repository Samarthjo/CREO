"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { takeJustUnlocked } from "@/lib/access-marker";
import { AccessForm } from "../landing/access-form";
import { Panel } from "../ui/kit";
import { Logo } from "./logo";

const link = "font-medium text-ink underline underline-offset-4 hover:no-underline";

/**
 * The workspace asks for the access code every time it is opened: on a first visit, a reload, a new tab, or coming back from the rest of
 * the site. Moving between workspace pages does not ask again. Nothing is saved to make this work: "open" lives only in this page's
 * memory, so any fresh load starts locked. The server's own check (proxy.ts) still keeps the public out; this is the ask on top of it.
 */
export function AccessLock({ children }: { children: ReactNode }) {
  // The first render, on the server and before the browser has looked, shows neither the form nor the workspace.
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const handedOver = useRef<boolean | null>(null);

  useEffect(() => {
    // The code page leaves a one-time note when it hands a visitor over, so they are not asked twice in a row.
    if (handedOver.current === null) handedOver.current = takeJustUnlocked();
    setState(handedOver.current ? "open" : "locked");
    // The back button can restore this page exactly as it was left, unlocked. Ask again.
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setState("locked"); };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  if (state === "open") return <>{children}</>;
  if (state === "checking") {
    return (
      <div className="min-h-dvh">
        <noscript><p className="p-6 text-sm text-body">The CREO workspace needs JavaScript.</p></noscript>
      </div>
    );
  }
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[26rem]">
        <Link href="/" aria-label="CREO home" className="mb-6 inline-flex"><Logo /></Link>
        <Panel className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Enter your access code</h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">The CREO workspace is invite only for now, and asks for the code every time you open it.</p>
          <div className="mt-6"><AccessForm onUnlocked={() => setState("open")} autoFocus /></div>
        </Panel>
        <p className="mt-4 px-1 text-[0.9375rem] leading-relaxed text-body">
          No code yet? <Link href="/cohort#apply" className={link} data-track="join_cohort" data-track-where="access">Join the 30-Day Founding Cohort</Link>, or <Link href="/contact" className={link}>contact us</Link>.
        </p>
      </div>
    </main>
  );
}
