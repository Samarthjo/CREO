"use client";

import { useMemo, useState } from "react";
import type { StudioPackage } from "@/lib/engine/types";
import { PackageView } from "../product/studio";

/** A read-only package where the visitor can still pick which hook leads. Remount with a new key when the package changes. */
export function LivePackage({ pkg }: { pkg: StudioPackage }) {
  const [chosen, setChosen] = useState(pkg.chosenHook);
  const view = useMemo(() => {
    const h = pkg.hooks.find((x) => x.id === chosen) ?? pkg.hooks[0]!;
    return { ...pkg, chosenHook: h.id, script: pkg.script.map((b) => (b.id === "hook" ? { ...b, line: h.text } : b)) };
  }, [pkg, chosen]);
  return <PackageView pkg={view} onChooseHook={setChosen} />;
}
