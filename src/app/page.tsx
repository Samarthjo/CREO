import { CollabSection } from "@/components/landing/collab-section";
import { Cohort } from "@/components/landing/cohort";
import { Experience } from "@/components/landing/experience";
import { FinalCta, Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { MemorySection } from "@/components/landing/memory-section";
import { Nav } from "@/components/landing/nav";
import { StudioSection } from "@/components/landing/studio-section";
import { TrendSection } from "@/components/landing/trend-section";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Experience />
        <TrendSection />
        <StudioSection />
        <CollabSection />
        <MemorySection />
        <Cohort />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
