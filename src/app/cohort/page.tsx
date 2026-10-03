import type { Metadata } from "next";
import { Cohort } from "@/components/landing/cohort";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "Cohort" };

export default function CohortPage() {
  return <SubPage title="Cohort" flow="dusk"><Cohort /></SubPage>;
}
