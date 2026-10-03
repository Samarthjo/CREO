"use client";

import { useState } from "react";
import { forgetAnalytics } from "@/lib/analytics";
import { Button } from "../ui/kit";

/** What CREO keeps in this browser, and a button that forgets it: the saved theme and workspace, the access cookie and the analytics choice. */
export function CookieSettings() {
  const [cleared, setCleared] = useState(false);
  async function clear() {
    try {
      await fetch("/api/access", { method: "DELETE" });
    } catch {
      /* offline: the cookie stays until it expires */
    }
    try {
      localStorage.removeItem("creo.theme");
      localStorage.removeItem("creo.workspace.v1");
      document.documentElement.removeAttribute("data-theme");
    } catch {
      /* storage is blocked: there is nothing to clear */
    }
    forgetAnalytics();
    setCleared(true);
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="ghost" onClick={clear}>Clear what CREO saved in this browser</Button>
      <p role="status" className="min-h-5 text-sm text-muted">{cleared ? "Cleared. Your theme is back to your device's setting, the workspace starts fresh, it asks for the access code again, and the analytics question is asked afresh." : ""}</p>
    </div>
  );
}
