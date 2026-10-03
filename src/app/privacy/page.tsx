import type { Metadata } from "next";
import Link from "next/link";
import { Doc, DocSection } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

const a = "font-medium text-ink underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <SubPage title="Privacy Policy" flow="short">
      <Doc eyebrow="Legal" title="Privacy Policy." intro="Last updated October 2026. This explains what CREO collects through this website, why, and what you can ask us to do with it.">
        <DocSection title="What we collect">
          <p><strong className="font-semibold text-ink">When you apply to the cohort:</strong> your name, creator handle, WhatsApp number or email, follower range, and your answers to the optional questions (platform, niche, how often you post, main goal, whether brands contact you, and your biggest creator problem). We also record that you agreed to share weekly feedback.</p>
          <p><strong className="font-semibold text-ink">When you contact us:</strong> your name, WhatsApp number or email, and your message.</p>
          <p>That is all. We do not ask for passwords, payment details or access to your accounts on this website.</p>
        </DocSection>
        <DocSection title="Why we use it">
          <p>To read your application, decide who can join the cohort, and reach you about it. To answer your message. We do not use it for advertising, and we do not sell it.</p>
        </DocSection>
        <DocSection title="Where it is kept and who sees it">
          <p>Applications and messages are stored in a database run by our service provider Supabase. The website is hosted by Vercel. People at CREO who review applications and messages can see them. Other than these providers and where the law requires it, we do not share your information.</p>
        </DocSection>
        <DocSection title="Tracking and cookies">
          <p>This website has no advertising or analytics trackers. If you enter an access code to open the workspace, one cookie lets the server serve it to you until you close your browser, and the workspace asks for the code every time it opens; otherwise it sets none. See <Link href="/cookies" className={a}>Cookies Settings</Link> for that cookie and the two small things the site keeps on your own device.</p>
        </DocSection>
        <DocSection title="Your choices">
          <p>You can ask us to show you what we hold about you, correct it, or delete it. <Link href="/contact" className={a}>Contact us</Link> or write to <a href={`mailto:${CONTACT_EMAIL}`} className={a}>{CONTACT_EMAIL}</a> from the same WhatsApp number or email you used, and we will take care of it. We keep applications and messages only as long as we need them for the reasons above.</p>
        </DocSection>
        <DocSection title="Changes">
          <p>If we change how we handle your information, we will update this page and its date.</p>
        </DocSection>
      </Doc>
    </SubPage>
  );
}
