import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import { Rail } from "@/components/landing/rail";

// Short first page: one hero, one five-caption rail, one call to action.
// The long sections (DNA, Trend, Studio, loop, Collab, HQ, FAQ) are unused on this page and remain in git history and /app.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Rail />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
