import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsChoice } from "@/components/analytics-consent";
import { CookieSettings } from "@/components/landing/cookie-settings";
import { Doc, DocSection } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "Cookies Settings" };

export default function CookiesPage() {
  return (
    <SubPage title="Cookies Settings" flow="short">
      <Doc eyebrow="Legal" title="Cookies Settings." intro="CREO counts visits with PostHog and runs no advertising trackers. It stores nothing on your device for analytics unless you say yes.">
        <DocSection title="What is kept in your browser">
          <p>A few small things can stay on your own device, in your browser's storage.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Your light or dark theme choice, so the site looks the way you left it.</li>
            <li>The workspace preview: what you change there, so it is still there when you come back. It never leaves your device.</li>
            <li>Your analytics choice (below), so we do not ask twice.</li>
            <li>Only if you allow analytics: an anonymous visitor ID from PostHog, in a cookie and in local storage under names that start with ph_, so a returning visit is recognised.</li>
          </ul>
          <p>One cookie is set only if you enter an access code to open the workspace. It lets the server serve the workspace to you, does not contain the code, and is deleted when you close your browser. The code itself is never saved: the workspace asks for it every time you open it.</p>
        </DocSection>
        <DocSection title="Analytics">
          <p>CREO uses PostHog, whose servers are in the United States, to learn which pages and steps help creators and which do not.</p>
          <p><strong className="font-semibold text-ink">Until you choose,</strong> visits are counted without cookies or storage. PostHog makes an anonymous number from the request that changes every day, so a visit can be counted but nobody can be followed from one day to the next. We see the page, where the visit came from, the device and country, how long it lasted, and errors.</p>
          <p><strong className="font-semibold text-ink">If you allow analytics,</strong> PostHog also remembers you between visits and records clicks, scrolling and anonymous recordings of how the site is used. Everything you type is hidden in recordings, and inside the workspace all text on screen is hidden too. Recordings are deleted after 30 days.</p>
          <p><strong className="font-semibold text-ink">Never:</strong> your name, handle, contact details, access code, or anything you write in the forms or the workspace is sent to analytics. If your browser sends Do Not Track or Global Privacy Control, CREO counts nothing at all.</p>
          <AnalyticsChoice />
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
