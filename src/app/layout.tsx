import type { Metadata, Viewport } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CREO | The AI Creator Manager", template: "%s | CREO" },
  description:
    "CREO turns trends into scripts and brand DMs into priced replies, with your approval. Founding Creator Cohort: 10-15 creators, 30 days, Rs 499.",
  openGraph: {
    title: "CREO | The AI Creator Manager",
    description: "Know what to post. Know what to charge.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e11" },
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
      <body>{children}</body>
    </html>
  );
}
