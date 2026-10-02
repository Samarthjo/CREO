import type { Metadata } from "next";
import { Landscape } from "@/components/scene/landscape";
import { WindClouds } from "@/components/scene/wind-clouds";
import { HeroProduct } from "@/components/landing/hero-product";
import { StudioSection } from "@/components/landing/studio-section";
import { SubPage } from "@/components/landing/subpage";
import { TrendSection } from "@/components/landing/trend-section";

export const metadata: Metadata = { title: "Product" };

export default function ProductPage() {
  return (
    <SubPage title="Product">
      <section className="relative isolate pb-16 pt-6 lg:pb-24">
        <Landscape time="dawn" fadeTop="long" sky={<WindClouds time="dawn" />} className="absolute inset-x-0 top-0 -z-10 h-[34rem] rounded-b-[2.5rem] sm:h-[40rem] lg:h-[46rem] lg:rounded-b-[4rem]" />
        <div className="px-4 pt-10 sm:px-6"><HeroProduct /></div>
      </section>
      <TrendSection />
      <StudioSection />
    </SubPage>
  );
}
