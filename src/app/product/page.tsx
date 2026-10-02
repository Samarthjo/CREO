import type { Metadata } from "next";
import { Cloud } from "@/components/scene/cloud";
import { Landscape } from "@/components/scene/landscape";
import { GlassTiles, tileSpots } from "@/components/scene/tiles";
import { HeroProduct } from "@/components/landing/hero-product";
import { StudioSection } from "@/components/landing/studio-section";
import { SubPage } from "@/components/landing/subpage";
import { TrendSection } from "@/components/landing/trend-section";

export const metadata: Metadata = { title: "Product" };

const TILES = tileSpots(3, [{ x: 6, y: 40, n: 3, spread: 8 }, { x: 93, y: 34, n: 3, spread: 7 }]);

export default function ProductPage() {
  return (
    <SubPage title="Product">
      <section className="relative isolate pb-16 pt-6 lg:pb-24">
        <Landscape time="dawn" className="absolute inset-x-0 top-0 -z-10 h-[34rem] rounded-b-[2.5rem] sm:h-[40rem] lg:h-[46rem] lg:rounded-b-[4rem]">
          <Cloud time="dawn" seed={2} className="drift-x absolute -left-[6%] top-[10%] w-[16rem] sm:w-[22rem]" style={{ "--dur": "90s" } as React.CSSProperties} />
          <Cloud time="dawn" seed={5} className="drift-x absolute -right-[5%] top-[18%] w-[15rem] sm:w-[21rem]" style={{ "--dur": "110s", "--delay": "-30s" } as React.CSSProperties} />
          <GlassTiles spots={TILES} />
        </Landscape>
        <div className="px-4 pt-10 sm:px-6"><HeroProduct /></div>
      </section>
      <TrendSection />
      <StudioSection />
    </SubPage>
  );
}
