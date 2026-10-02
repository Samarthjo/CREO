import type { Metadata } from "next";
import { ClassicHero } from "@/components/landing/classic/hero";
import { ClassicFinalCta, ClassicFooter } from "@/components/landing/classic/footer";
import { CollabSection } from "@/components/landing/collab-section";
import { Cohort } from "@/components/landing/cohort";
import { DnaSection } from "@/components/landing/dna-section";
import { Faq } from "@/components/landing/faq";
import { HqSection } from "@/components/landing/hq-section";
import { HumanAiSection } from "@/components/landing/human-ai-section";
import { LoopSection } from "@/components/landing/loop-section";
import { Nav } from "@/components/landing/nav";
import { ProofSection } from "@/components/landing/proof-section";
import { StudioSection } from "@/components/landing/studio-section";
import { TrendSection } from "@/components/landing/trend-section";

export const metadata: Metadata = { title: "Classic page", description: "The full long page: one day with CREO, dawn to night." };

// The earlier long landing page, kept whole. Order follows docs/design-research.md section 7.
export default function ClassicPage() {
  return (
    <>
      <Nav />
      <main>
        <ClassicHero />
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
        <ClassicFinalCta />
      </main>
      <ClassicFooter />
    </>
  );
}
