"use client";

import { useState } from "react";
import { Button } from "../ui/kit";

/** What CREO keeps in this browser, and a button that forgets it. Nothing here ever leaves the device. */
export function CookieSettings() {
  const [cleared, setCleared] = useState(false);
  function clear() {
    try {
      localStorage.removeItem("creo.theme");
      localStorage.removeItem("creo.workspace.v1");
      document.documentElement.removeAttribute("data-theme");
    } catch {
      /* storage is blocked: there is nothing to clear */
    }
    setCleared(true);
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="ghost" onClick={clear}>Clear what CREO saved in this browser</Button>
      <p role="status" className="min-h-5 text-sm text-muted">{cleared ? "Cleared. Your theme is back to your device's setting and the workspace starts fresh." : ""}</p>
    </div>
  );
}
