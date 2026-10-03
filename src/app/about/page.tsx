import type { Metadata } from "next";
import { Doc, DocSection } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";
import { Accent, Button } from "@/components/ui/kit";

export const metadata: Metadata = { title: "Our story", description: "Why CREO exists: creators have plenty of tools, and none of them keep what they learn about you." };

export default function AboutPage() {
  return (
    <SubPage title="Our story" flow="short">
      <Doc eyebrow="Our story" title={<>Why CREO <Accent>exists</Accent>.</>} intro="Creators have plenty of tools, and none of them keep what they learn about you.">
        <DocSection title="The gap">
          <p>Analytics show what happened. Editors cut what you hand them. Inboxes fill up with offers. Each tool sees one slice of your work, and none of them remember your decisions, your results or why a post worked. So every week starts from zero.</p>
        </DocSection>
        <DocSection title="What CREO does">
          <p>CREO is an AI creator manager. It analyzes your content, remembers every decision and result, and turns that into your next best move: what to make, how to make it, and which deals to take.</p>
          <p>It works for you, not instead of you. Nothing leaves CREO without your approval.</p>
        </DocSection>
        <DocSection title="How we are starting">
          <p>We are opening CREO through the 30-Day Founding Cohort: ₹499 for 30 days. CREO builds your Creator Intelligence while a CREO strategist works alongside you. Seats are limited for each cohort, so every creator gets real attention.</p>
          <div className="pt-2"><Button variant="primary" size="lg" href="/cohort#apply" data-track="join_cohort" data-track-where="about">Join the 30-Day Founding Cohort</Button></div>
        </DocSection>
      </Doc>
    </SubPage>
  );
}
