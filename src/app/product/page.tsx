import type { Metadata } from "next";
import { Landscape } from "@/components/scene/landscape";
import { WindClouds } from "@/components/scene/wind-clouds";
import { HeroProduct } from "@/components/landing/hero-product";
import { MemorySection } from "@/components/landing/memory-section";
import { StudioSection } from "@/components/landing/studio-section";
import { SubPage } from "@/components/landing/subpage";
import { TrendSection } from "@/components/landing/trend-section";
import { Accent, Eyebrow, ExampleNote } from "@/components/ui/kit";

export const metadata: Metadata = { title: "Product", description: "Bring an idea and your post history. CREO finds the angle, shapes the draft and learns from what you publish. You keep the final say." };

export default function ProductPage() {
  return (
    <SubPage title="Product" flow="long">
      <section className="relative isolate overflow-x-clip pb-16 pt-6 lg:pb-24">
        <Landscape time="dawn" fadeTop="long" sky={<WindClouds time="dawn" />} className="absolute inset-x-0 top-0 -z-10 h-[40rem] rounded-b-[2.5rem] sm:h-[46rem] lg:h-[54rem] lg:rounded-b-[4rem]" />
        <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 pt-10 text-center sm:px-6">
          <Eyebrow>CREO Intelligence</Eyebrow>
          <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2.3rem,5vw,4.25rem)] font-normal leading-[1.02] tracking-[-0.04em]">From one idea to a draft that sounds like <Accent>you</Accent>.</h2>
          <p className="mt-4 max-w-[40rem] text-[1.0625rem] leading-relaxed text-body sm:text-[1.125rem]">Creators have plenty of tools, and none of them keep what they learn about you. Bring an idea and your post history. CREO finds the angle that fits you, shapes the draft, and learns from what you publish. You keep the final say.</p>
        </div>
        <div className="mt-8 px-4 sm:px-6 lg:mt-10"><HeroProduct /><ExampleNote className="mt-4" /></div>
      </section>
      <TrendSection />
      <StudioSection />
      <MemorySection />
    </SubPage>
  );
}
