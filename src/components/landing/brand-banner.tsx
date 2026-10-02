/** The CREO banner as a dark card between the five captions and the application. The text in it is part of the image, so the alt text carries it. */
export function BrandBanner() {
  return (
    <section aria-label="CREO" className="px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="mx-auto max-w-[76rem] overflow-hidden rounded-[2rem] border border-line bg-[#0b0908] shadow-pop lg:rounded-[2.5rem]">
        <picture>
          <source media="(max-width: 639px)" srcSet="/brand/creo-banner-sm.webp" width={640} height={383} />
          <img src="/brand/creo-banner.webp" width={1206} height={383} alt="CREO. Your creator's second brain." loading="lazy" decoding="async" className="block h-auto w-full" />
        </picture>
      </div>
    </section>
  );
}
