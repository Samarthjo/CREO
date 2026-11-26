import type { Metadata } from "next";
import Link from "next/link";
import { Doc, DocSection } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";
import { TrialForm } from "@/components/landing/trial-form";
import { Accent, Panel } from "@/components/ui/kit";
import { KEEP_PRICE } from "@/lib/trial";

export const metadata: Metadata = {
  title: "Try 14 days free",
  description: "Try the CREO workspace free for 14 days. No card. It learns which hooks and formats work for your audience and drafts your next post. You approve it.",
};

const link = "font-medium text-ink underline underline-offset-4 hover:no-underline";

export default function TrialPage() {
  return (
    <SubPage title="Try 14 days free" flow="short">
      <Doc
        eyebrow="14-day free trial"
        title={<>Try CREO free for <Accent>14 days.</Accent></>}
        intro={`No card. Sign up and the workspace opens right away on this browser. After 14 days it locks, and keeping CREO is ${KEEP_PRICE}.`}
      >
        <Panel className="p-6 sm:p-8"><TrialForm /></Panel>
        <DocSection title="What you get">
          <p>The full CREO workspace: Trend, Studio, Collab Inbox, Approvals, Creator DNA and Memory. It learns from the posts and deals you add, drafts your next post, and nothing leaves CREO without your approval.</p>
          <p>Your work is saved in this browser. CREO does not connect to your accounts, and it cannot promise any result.</p>
        </DocSection>
        <DocSection title="After 14 days">
          <p>The workspace locks and asks you to keep CREO for {KEEP_PRICE}. Your saved work stays on this device and is there again once you are unlocked. You are never charged without being asked.</p>
          <p>Started a trial before? Enter the same email and you will pick up where you left off.</p>
        </DocSection>
        <p className="text-[0.9375rem] leading-relaxed text-body">
          Want hands-on help instead? See the <Link href="/cohort" className={link}>30-Day Founding Cohort</Link>.
        </p>
      </Doc>
    </SubPage>
  );
}
