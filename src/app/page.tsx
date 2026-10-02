import { CollabSection } from "@/components/landing/collab-section";
import { Cohort } from "@/components/landing/cohort";
import { DnaSection } from "@/components/landing/dna-section";
import { Faq } from "@/components/landing/faq";
import { FinalCta, Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HqSection } from "@/components/landing/hq-section";
import { HumanAiSection } from "@/components/landing/human-ai-section";
import { LoopSection } from "@/components/landing/loop-section";
import { Nav } from "@/components/landing/nav";
import { ProofSection } from "@/components/landing/proof-section";
import { StudioSection } from "@/components/landing/studio-section";
import { TrendSection } from "@/components/landing/trend-section";

// One day with CREO: dawn (hero) to night (closing CTA). Order follows docs/design-research.md section 7.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <DnaSection />
        <TrendSection />
        <StudioSection />
        <LoopSection />
        <CollabSection />
        <HqSection />
        <HumanAiSection />
        <ProofSection />
        <div className="night bg-bg text-body">
          <Cohort />
          <Faq />
        </div>
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
