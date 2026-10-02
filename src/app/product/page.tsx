import type { Metadata } from "next";
import { Landscape } from "@/components/scene/landscape";
import { WindClouds } from "@/components/scene/wind-clouds";
import { HeroProduct } from "@/components/landing/hero-product";
import { MemorySection } from "@/components/landing/memory-section";
import { StudioSection } from "@/components/landing/studio-section";
import { SubPage } from "@/components/landing/subpage";
import { TrendSection } from "@/components/landing/trend-section";
import { Accent, Eyebrow } from "@/components/ui/kit";

export const metadata: Metadata = { title: "Product" };

export default function ProductPage() {
  return (
    <SubPage title="Product">
      <section className="relative isolate pb-16 pt-6 lg:pb-24">
        <Landscape time="dawn" fadeTop="long" sky={<WindClouds time="dawn" />} className="absolute inset-x-0 top-0 -z-10 h-[40rem] rounded-b-[2.5rem] sm:h-[46rem] lg:h-[54rem] lg:rounded-b-[4rem]" />
        <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 pt-10 text-center sm:px-6">
          <Eyebrow>CREO Intelligence</Eyebrow>
          <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2.3rem,5vw,4.25rem)] font-normal leading-[1.02] tracking-[-0.04em]">One AI Creator Manager that <Accent>remembers</Accent>.</h2>
          <p className="mt-4 max-w-[40rem] text-[1.0625rem] leading-relaxed text-body sm:text-[1.125rem]">Creators have plenty of tools, and none of them keep what they learn about you. CREO analyzes your content, remembers every decision and result, and turns it into your next best move.</p>
        </div>
        <div className="mt-8 px-4 sm:px-6 lg:mt-10"><HeroProduct /></div>
      </section>
      <TrendSection />
      <StudioSection />
      <MemorySection />
    </SubPage>
  );
}
