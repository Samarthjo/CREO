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
    "Bring an idea and your post history. CREO finds the angle, shapes the draft and learns from what you publish. You keep the final say.",
  openGraph: {
    title: "CREO | Stop guessing what to post next",
    description: "Bring an idea and your post history. CREO finds the angle, shapes the draft and learns from what you publish. You keep the final say.",
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

// The home page headline is a split test. This picks "a" (the control) or "b" at random before first paint, from the address (?hook=a|b) when it is there,
// and stores nothing on the device. globals.css shows the matching version; analytics.ts adds it to the visit as hook_variant.
const hookInit = `try{var h=new URLSearchParams(location.search).get("hook");document.documentElement.dataset.hook=h==="a"||h==="b"?h:Math.random()<0.5?"a":"b"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script dangerouslySetInnerHTML={{ __html: hookInit }} />
      </head>
      <body><MotionProvider>{children}</MotionProvider><AnalyticsConsent /></body>
    </html>
  );
}
