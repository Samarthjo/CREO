import type { Metadata } from "next";
import { LoopSection } from "@/components/landing/loop-section";
import { StrategistSection } from "@/components/landing/strategist-section";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "Learning loop" };

export default function LearningLoopPage() {
  return (
    <SubPage title="Learning loop">
      <LoopSection />
      <StrategistSection />
    </SubPage>
  );
}
