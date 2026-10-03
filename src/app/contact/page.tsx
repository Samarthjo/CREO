import type { Metadata } from "next";
import { ContactForm } from "@/components/landing/contact-form";
import { Doc } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <SubPage title="Contact us" flow="short">
      <Doc eyebrow="Contact us" title="Say hello." intro="Questions about the cohort, press or partnerships? Leave a note and a way to reach you. We reply on WhatsApp or email.">
        <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-pop sm:p-8"><ContactForm /></div>
      </Doc>
    </SubPage>
  );
}
