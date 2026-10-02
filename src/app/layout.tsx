import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/instrument-sans/wght-italic.css";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CREO | Your AI creator strategist", template: "%s | CREO" },
  description:
    "CREO learns how you create. It turns trends into scripts and brand DMs into priced replies, with your approval. Founding Creator Cohort: 10-15 creators, 30 days, Rs 499.",
  openGraph: {
    title: "CREO | Your AI creator strategist",
    description: "CREO learns how you create, from the content you make to the deals you close.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1030" },
  ],
};

// Runs before paint so a saved theme choice never flashes the other theme.
const themeInit = `try{var t=localStorage.getItem("creo.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
