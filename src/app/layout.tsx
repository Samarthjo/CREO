import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/instrument-sans/wght-italic.css";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CREO | The Intelligence Layer for Creators", template: "%s | CREO" },
  description:
    "Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.",
  openGraph: {
    title: "CREO | The Intelligence Layer for Creators",
    description: "Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.",
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
