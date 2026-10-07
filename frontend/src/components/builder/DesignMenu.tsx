"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_THEME } from "@/lib/theme";
import type { Theme } from "@/lib/types";
import { THEME_PRESETS, isSameTheme } from "./themes";

/** Theme picker. Choosing a preset restyles the canvas, preview and live form. */
export function DesignMenu({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button type="button" className="btn btn-secondary h-8" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Palette size={15} /> Design
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 w-72 rounded-lg border border-black/10 bg-white p-3 shadow-lg">
          <p className="mb-2 font-medium">Theme</p>
          <div className="grid grid-cols-2 gap-2">
            {THEME_PRESETS.map((preset) => {
              const t = { ...DEFAULT_THEME, ...preset.theme };
              const active = isSameTheme(theme, t);
              return (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange(t)}
                  className={`rounded-lg p-1.5 text-left ${active ? "ring-2 ring-[#262627]" : "ring-1 ring-black/10 hover:ring-black/30"}`}
                >
                  <span className="flex h-14 flex-col justify-center gap-1.5 rounded px-2.5" style={{ background: t.background }}>
                    <span className="h-1.5 w-14 rounded-full" style={{ background: t.question_color }} />
                    <span className="h-3 w-9 rounded-sm" style={{ background: t.button_color }} />
                  </span>
                  <span className="mt-1 flex items-center justify-between px-0.5 text-xs">
                    {preset.name}
                    {active && <Check size={13} aria-hidden />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-black/50">Custom colors and fonts are coming soon.</p>
        </div>
      )}
    </div>
  );
}
