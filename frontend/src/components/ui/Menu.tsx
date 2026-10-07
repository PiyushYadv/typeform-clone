"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface Props {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
  triggerClassName?: string;
}

/** A small popover menu that closes on outside click or Escape. */
export function Menu({ label, trigger, items, align = "right", triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-40 mt-1 min-w-48 rounded-lg border border-black/10 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, danger, disabled }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              disabled={disabled}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-40 ${
                danger ? "text-[#C42525]" : ""
              }`}
              onClick={() => {
                setOpen(false);
                onSelect();
              }}
            >
              {Icon && <Icon size={16} aria-hidden />}
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
