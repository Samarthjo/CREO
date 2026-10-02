import type { Metadata } from "next";
import { HeroProduct } from "@/components/landing/hero-product";
import { StudioSection } from "@/components/landing/studio-section";
import { SubPage } from "@/components/landing/subpage";
import { TrendSection } from "@/components/landing/trend-section";

export const metadata: Metadata = { title: "Product" };

export default function ProductPage() {
  return (
    <SubPage title="Product">
      <section className="relative isolate pb-16 pt-6 lg:pb-24">
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[linear-gradient(to_bottom,var(--bg),var(--soft)_55%,var(--bg))] lg:h-[36rem]" />
        <div className="px-4 pt-10 sm:px-6"><HeroProduct /></div>
      </section>
      <TrendSection />
      <StudioSection />
    </SubPage>
  );
}
