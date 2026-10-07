"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { newKey, type DraftOption } from "./draft";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Props {
  options: DraftOption[];
  onChange: (options: DraftOption[]) => void;
}

/** Choice labels edited in place. Enter adds the next choice, as in Typeform. */
export function EditableChoices({ options, onChange }: Props) {
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const [focusKey, setFocusKey] = useState<string | null>(null);

  useEffect(() => {
    if (focusKey) inputs.current.get(focusKey)?.focus();
  }, [focusKey, options]);

  const add = (afterIndex = options.length - 1) => {
    const option = { key: newKey(), label: `Choice ${options.length + 1}` };
    onChange([...options.slice(0, afterIndex + 1), option, ...options.slice(afterIndex + 1)]);
    setFocusKey(option.key);
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-fit sm:min-w-[300px]">
      {options.map((option, i) => (
        <div key={option.key} className="tf-choice group cursor-text">
          <span className="tf-key" aria-hidden>
            {LETTERS[i]}
          </span>
          <input
            ref={(el) => {
              if (el) inputs.current.set(option.key, el);
              else inputs.current.delete(option.key);
            }}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:opacity-50"
            value={option.label}
            placeholder={`Choice ${i + 1}`}
            aria-label={`Choice ${LETTERS[i]}`}
            onChange={(e) => onChange(options.map((o) => (o.key === option.key ? { ...o, label: e.target.value } : o)))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(i);
              }
            }}
          />
          {options.length > 1 && (
            <button
              type="button"
              aria-label={`Remove choice ${LETTERS[i]}`}
              className="rounded p-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-black/10"
              onClick={() => onChange(options.filter((o) => o.key !== option.key))}
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      {options.length < LETTERS.length && (
        <button
          type="button"
          className="mt-1 flex w-fit items-center gap-1 text-base text-[var(--tf-answer)] underline-offset-4 hover:underline"
          onClick={() => add()}
        >
          <Plus size={16} /> Add choice
        </button>
      )}
    </div>
  );
}
