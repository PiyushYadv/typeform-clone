"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AnswerInputProps } from "../types";

/** Type-to-filter dropdown. Arrow keys move through options, Enter picks one. */
export function DropdownAnswer({ question, value, onChange, onSubmit, interactive = true, autoFocus }: AnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = question.options.find((o) => o.id === value);
  const filtered = question.options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!autoFocus || !interactive) return;
    const timer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    return () => clearTimeout(timer);
  }, [autoFocus, interactive]);

  const choose = (id: number) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keep these keys inside the dropdown instead of moving between questions.
    if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) e.stopPropagation();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[active]) choose(filtered[active].id);
      else onSubmit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          ref={inputRef}
          className="tf-input pr-20"
          value={open ? query : (selected?.label ?? "")}
          placeholder="Type or select an option"
          readOnly={!interactive}
          role="combobox"
          aria-expanded={open}
          aria-controls={`dropdown-${question.id}`}
          aria-label={question.title}
          onFocus={() => interactive && setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute bottom-3 right-0 flex items-center gap-2 text-[var(--tf-answer)]">
          {selected && interactive && (
            <button type="button" aria-label="Clear selection" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(null)}>
              <X size={22} aria-hidden />
            </button>
          )}
          <button
            type="button"
            aria-label={open ? "Close options" : "Show options"}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!interactive) return;
              setOpen((o) => !o);
              inputRef.current?.focus();
            }}
          >
            <ChevronDown size={26} className={open ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden />
          </button>
        </div>
      </div>

      {open && (
        <div id={`dropdown-${question.id}`} role="listbox" className="tf-dropdown-list">
          {filtered.length === 0 && <p className="tf-enter-hint py-2">No matching options</p>}
          {filtered.map((option, i) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className="tf-dropdown-item"
              data-active={i === active}
              // mousedown would blur the input and close the list before the click lands
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
