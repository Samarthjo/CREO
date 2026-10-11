import { AfterCohort } from "@/components/landing/cohort";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import { Rail } from "@/components/landing/rail";
import { Horizon } from "@/components/scene/backdrop";
import { Section } from "@/components/landing/section";

// Short first page: the hero, the core story, what you keep after 30 days, and one call to action.
// Product depth lives on its own pages: /product, /learning-loop, /collab-inbox, /cohort and /faq.
// The page is one day: dawn behind the hero, morning and afternoon behind the story, dusk (the horizon strip) and then the night scene.
export default function Home() {
  return (
    <div className="day" data-flow="home">
      <Nav />
      <main>
        <Hero />
        <Rail />
        <Section id="after-30-days" className="pt-6 lg:pt-10"><AfterCohort applyHref="#cohort" /></Section>
        <Horizon />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
