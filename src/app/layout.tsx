import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/instrument-sans/wght-italic.css";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

// Social preview images need an absolute address. Vercel exposes the production host at build time.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "CREO | The Intelligence Layer for Creators", template: "%s | CREO" },
  description:
    "Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.",
  openGraph: {
    title: "CREO | The Intelligence Layer for Creators",
    description: "Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.",
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

// Runs before paint so a saved theme or motion choice never flashes the other one.
const themeInit = `try{var t=localStorage.getItem("creo.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;if(localStorage.getItem("creo.motion")==="off")document.documentElement.dataset.motion="off"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
