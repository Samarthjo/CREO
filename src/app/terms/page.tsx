import type { Metadata } from "next";
import Link from "next/link";
import { Doc, DocSection } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <SubPage title="Terms & Conditions" flow="short">
      <Doc eyebrow="Legal" title="Terms & Conditions." intro="Last updated October 2026. By using this website you agree to these terms.">
        <DocSection title="This website">
          <p>This website describes CREO and lets you apply for the Founding Creator Cohort or send us a message. The workspace is a working preview of how CREO behaves. It is open to people with an access code for now, it is there so you can try the ideas, and it does not connect to your accounts.</p>
        </DocSection>
        <DocSection title="Applying to the cohort">
          <p>What you tell us in an application must be true and yours to share. Applying does not guarantee a place: seats are limited for each cohort, and a place is confirmed only when we tell you so.</p>
          <p>The price shown on the site is what we are planning to charge. We will tell you how it works before you are asked to pay anything.</p>
        </DocSection>
        <DocSection title="No promise of results">
          <p>CREO gives suggestions based on what you share with it. Growth, deals and income depend on many things we do not control, so we cannot promise any result.</p>
        </DocSection>
        <DocSection title="Using the site fairly">
          <p>Please do not misuse the site, try to break it, send spam through the forms, or copy it as your own. We may block access that harms the site or other people.</p>
        </DocSection>
        <DocSection title="Our content">
          <p>The CREO name, logo, design, text and software belong to CREO. You may read and share the site, but you may not copy or resell it without asking us first.</p>
        </DocSection>
        <DocSection title="Changes and questions">
          <p>We may update these terms as CREO grows. The date at the top shows the latest version. How we handle your information is in the <Link href="/privacy" className="font-medium text-ink underline underline-offset-4">Privacy Policy</Link>. Questions? <Link href="/contact" className="font-medium text-ink underline underline-offset-4">Contact us</Link>.</p>
        </DocSection>
      </Doc>
    </SubPage>
  );
}
