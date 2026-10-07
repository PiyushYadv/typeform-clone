"use client";

import { useEffect, useRef } from "react";
import type { AnswerInputProps } from "../types";

const NUMBER_PATTERN = /^-?\d*\.?\d*$/;

/** Short text, long text, email and number: one underlined field. */
export function TextAnswer({ question, value, onChange, onSubmit, interactive = true, autoFocus }: AnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const text = value === null || value === undefined ? "" : String(value);
  const isLong = question.type === "long_text";

  // Focus after the slide-in finishes, so the page doesn't jump mid-animation.
  useEffect(() => {
    if (!autoFocus || !interactive) return;
    const timer = setTimeout(() => {
      (inputRef.current ?? areaRef.current)?.focus({ preventScroll: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [autoFocus, interactive]);

  // Long answers grow with their content instead of scrolling inside a box.
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  if (isLong) {
    return (
      <div>
        <textarea
          ref={areaRef}
          className="tf-input"
          rows={1}
          value={text}
          placeholder="Type your answer here..."
          readOnly={!interactive}
          aria-label={question.title}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <p className="tf-enter-hint mt-2">
          <strong>Shift ⇧ + Enter ↵</strong> to make a line break
        </p>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      className="tf-input"
      type={question.type === "email" ? "email" : "text"}
      inputMode={question.type === "number" ? "decimal" : question.type === "email" ? "email" : "text"}
      autoComplete={question.type === "email" ? "email" : "off"}
      value={text}
      placeholder={question.type === "email" ? "name@example.com" : "Type your answer here..."}
      readOnly={!interactive}
      aria-label={question.title}
      onChange={(e) => {
        const next = e.target.value;
        if (question.type === "number" && !NUMBER_PATTERN.test(next)) return;
        onChange(next);
      }}
      onKeyDown={handleKeyDown}
    />
  );
}
