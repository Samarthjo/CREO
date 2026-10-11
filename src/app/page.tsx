import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import { Journey } from "@/components/landing/journey";
import { Programme } from "@/components/landing/programme";
import { Horizon } from "@/components/scene/backdrop";

// Short first page: the hero with a four-slide guided demo, the three-step journey, what the programme is and costs, and one call to action.
// Product depth lives on its own pages: /product, /learning-loop, /collab-inbox, /cohort and /faq.
// The page is one day: dawn behind the hero, morning and afternoon behind the story, dusk (the horizon strip) and then the night scene.
export default function Home() {
  return (
    <div className="day" data-flow="home">
      <Nav />
      <main>
        <Hero />
        <Journey />
        <Programme />
        <Horizon />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
