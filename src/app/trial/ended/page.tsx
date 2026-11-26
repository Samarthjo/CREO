import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Doc, DocSection } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";
import { Accent, Button, Panel } from "@/components/ui/kit";
import { KEEP_PRICE, TRIAL_COOKIE, trialState } from "@/lib/trial";

export const metadata: Metadata = { title: "Keep CREO", robots: { index: false } };

const link = "font-medium text-ink underline underline-offset-4 hover:no-underline";

/** Where a visitor lands when the trial has ended (the proxy sends them here), and where "Keep CREO" in the workspace leads. */
export default async function TrialEndedPage() {
  const trial = trialState((await cookies()).get(TRIAL_COOKIE)?.value);
  const ended = trial.state === "expired";
  return (
    <SubPage title="Keep CREO" flow="short">
      <Doc
        eyebrow={ended ? "Your trial has ended" : "Keep CREO"}
        title={ended ? <>Your 14 days are <Accent>up.</Accent></> : <>Keep CREO after your <Accent>trial.</Accent></>}
        intro={ended ? "The workspace is locked. Everything you saved is still on this device and comes back as soon as you are unlocked." : `Your trial is still running. When it ends, the workspace locks and keeping CREO is ${KEEP_PRICE}.`}
      >
        <Panel className="p-6 sm:p-8">
          <p className="font-display text-[clamp(2.6rem,6vw,4rem)] font-semibold leading-none tracking-[-0.04em]">{KEEP_PRICE}</p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-body">Full workspace access, same as the trial. Online payment is opening soon. Until then, tell us you want to keep CREO and we will unlock you.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button href="/contact" variant="primary" size="lg" data-track="keep_creo" data-track-where="trial_ended">Tell us I want to keep CREO</Button>
            {!ended && <Button href="/app" variant="quiet" size="md">Back to the workspace</Button>}
          </div>
        </Panel>
        <DocSection title="Already unlocked, or started before?">
          <p>Enter the same email on <Link href="/trial" className={link}>the trial page</Link> and the workspace opens again on this browser.</p>
        </DocSection>
        <DocSection title="Prefer hands-on help?">
          <p>The <Link href="/cohort" className={link}>30-Day Founding Cohort</Link> is still open: a strategist works alongside CREO. It uses the same workspace.</p>
        </DocSection>
      </Doc>
    </SubPage>
  );
}
