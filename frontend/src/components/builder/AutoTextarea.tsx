"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

/** A borderless textarea that grows with its text, for inline editing on the canvas. */
export function AutoTextarea({ value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      {...props}
      className={`block w-full resize-none border-0 bg-transparent p-0 outline-none placeholder:opacity-40 ${props.className ?? ""}`}
    />
  );
}

/**
 * A textarea as wide as its text (wrapping at the container edge), so
 * something placed after it — like the required asterisk — follows the last
 * word. An invisible copy of the text sizes the grid cell the textarea fills.
 */
export function FitTextarea({ value, placeholder, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  return (
    <span className="inline-grid min-w-0 max-w-full">
      <span aria-hidden className={`invisible col-start-1 row-start-1 whitespace-pre-wrap break-words ${className}`}>
        {(value || placeholder) + " "}
      </span>
      <textarea
        rows={1}
        value={value}
        placeholder={placeholder}
        {...props}
        className={`col-start-1 row-start-1 h-full w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:opacity-40 ${className}`}
      />
    </span>
  );
}
