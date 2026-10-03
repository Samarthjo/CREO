import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettings } from "@/components/landing/cookie-settings";
import { Doc, DocSection } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "Cookies Settings" };

export default function CookiesPage() {
  return (
    <SubPage title="Cookies Settings" flow="short">
      <Doc eyebrow="Legal" title="Cookies Settings." intro="CREO sets no cookies and runs no advertising or analytics trackers, so there is nothing to switch off.">
        <DocSection title="What is kept in your browser">
          <p>Two small things stay on your own device, in your browser's local storage. They never leave it.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Your light or dark theme choice, so the site looks the way you left it.</li>
            <li>The workspace preview: what you change there, so it is still there when you come back.</li>
          </ul>
        </DocSection>
        <DocSection title="Forget them">
          <CookieSettings />
        </DocSection>
        <DocSection title="More">
          <p>How we handle what you send us through the forms is in the <Link href="/privacy" className="font-medium text-ink underline underline-offset-4">Privacy Policy</Link>.</p>
        </DocSection>
      </Doc>
    </SubPage>
  );
}
