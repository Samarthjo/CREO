import { Suspense } from "react";
import { Skeleton } from "@/components/ui/kit";
import { DnaClient } from "./dna-client";

export default function DnaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <DnaClient />
    </Suspense>
  );
}
