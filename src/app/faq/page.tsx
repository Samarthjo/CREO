import type { Metadata } from "next";
import { Faq } from "@/components/landing/faq";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return <SubPage title="FAQ"><Faq /></SubPage>;
}
