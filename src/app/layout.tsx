import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/instrument-sans/wght-italic.css";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";
import "./wind.css";
import "./backdrop.css";

// Social preview images need an absolute address. Vercel exposes the production host at build time.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "CREO | Stop guessing what to post next", template: "%s | CREO" },
  description:
    "CREO is a 30-day creator cohort that learns which hooks and formats work for your audience, then drafts your next post. You approve it.",
  openGraph: {
    title: "CREO | Stop guessing what to post next",
    description: "A 30-day creator cohort that learns what works for your audience and drafts what to make next. You approve it.",
    type: "website",
    siteName: "CREO",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1030" },
  ],
};

// Runs before paint so a saved theme never flashes the other one.
const themeInit = `try{var t=localStorage.getItem("creo.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body><MotionProvider>{children}</MotionProvider><AnalyticsConsent /></body>
    </html>
  );
}
