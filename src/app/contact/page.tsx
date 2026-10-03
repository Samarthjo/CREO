import { ArrowUpRight, EnvelopeSimple, InstagramLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ContactForm } from "@/components/landing/contact-form";
import { Doc } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";
import { CONTACT_EMAIL, SOCIALS } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

const ICONS: Record<(typeof SOCIALS)[number]["key"], ReactNode> = {
  instagram: <InstagramLogo size={22} />,
  x: <XLogo size={22} />,
  linkedin: <LinkedinLogo size={22} />,
};

const card = "group flex items-center gap-3.5 rounded-[1.25rem] border border-line bg-surface px-4 py-3.5 transition";

/** One way to reach us: an icon, what it is, and the address. A link when there is somewhere to go, plain text when not yet. */
function Way({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href: string | null }) {
  const inner = (
    <>
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-sunk text-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8125rem] text-muted">{label}</span>
        <span className="block truncate text-[0.9375rem] font-medium text-ink">{value}</span>
      </span>
      {href && <ArrowUpRight aria-hidden size={18} className="shrink-0 text-muted transition group-hover:text-ink" />}
    </>
  );
  if (!href) return <div className={`${card} opacity-70`}>{inner}</div>;
  const external = /^https?:/.test(href);
  return <a href={href} className={`${card} hover:border-line-strong hover:bg-raised`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>;
}

export default function ContactPage() {
  return (
    <SubPage title="Contact us" flow="short">
      <Doc eyebrow="Contact us" title="Say hello." intro="Questions about the cohort, press or partnerships? Write to us, find us on social, or leave a note below.">
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="sm:col-span-2"><Way icon={<EnvelopeSimple size={22} />} label="Email" value={CONTACT_EMAIL} href={`mailto:${CONTACT_EMAIL}`} /></li>
          {SOCIALS.map((s) => <li key={s.key}><Way icon={ICONS[s.key]} label={s.name} value={s.handle} href={s.href} /></li>)}
        </ul>
        <div>
          <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">Or leave a note</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">Add a WhatsApp number or an email and we will reply there.</p>
          <div className="mt-5 rounded-[1.75rem] border border-line bg-surface p-6 shadow-pop sm:p-8"><ContactForm /></div>
        </div>
      </Doc>
    </SubPage>
  );
}
