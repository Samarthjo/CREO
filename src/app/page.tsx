import type { Viewport } from "next";
import { Cta } from "@/components/layer/cta";
import { Footer } from "@/components/layer/footer";
import { Hero } from "@/components/layer/hero";
import { Nav } from "@/components/layer/nav";
import { LayerRoot } from "@/components/layer/root";
import { ScrollBus } from "@/components/layer/scroll-bus";
import { Story } from "@/components/layer/story";

export const viewport: Viewport = { themeColor: "#07080B", colorScheme: "dark" };

// One fixed stage behind everything: hero, five-beat story, one call to action.
// The long sections under components/landing stay in the repo and are no longer used on this page.
export default function Home() {
  return (
    <LayerRoot>
      <ScrollBus />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Story />
        <Cta />
      </main>
      <Footer />
    </LayerRoot>
  );
}
