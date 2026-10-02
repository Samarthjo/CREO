import { Suspense } from "react";
import { Skeleton } from "@/components/ui/kit";
import { MemoryClient } from "./memory-client";

export default function MemoryPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <MemoryClient />
    </Suspense>
  );
}
