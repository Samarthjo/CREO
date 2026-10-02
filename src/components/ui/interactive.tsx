"use client";

import { Check, Copy, Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button, cn } from "./kit";

export function Tabs<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-sunk p-1 scroll-thin">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium leading-5 transition pointer-coarse:min-h-11", value === it.id ? "bg-surface text-ink shadow-[0_1px_2px_rgb(18_24_34/0.12)]" : "text-muted hover:text-ink")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <Button
      size="sm"
      variant="ghost"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          setDone(true);
        }
      }}
    >
      {done ? <Check size={16} weight="bold" /> : <Copy size={16} />}
      {done ? "Copied" : label}
    </Button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("grid size-9 place-items-center rounded-full text-muted transition hover:bg-sunk hover:text-ink pointer-coarse:size-11", className)}
      onClick={() => {
        const next = dark ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("creo.theme", next);
        } catch {
          /* private mode */
        }
        setDark(!dark);
      }}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
