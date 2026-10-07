"use client";

import { useState } from "react";
import type { AnswerInputProps } from "../types";
import { AUTO_ADVANCE_MS, useShortcutKeys } from "../useShortcutKeys";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A row of stars numbered underneath; number keys pick a rating. */
export function RatingAnswer({ question, value, onChange, onSubmit, interactive = true }: AnswerInputProps) {
  const steps = Number(question.properties.steps ?? 5);
  const [hovered, setHovered] = useState<number | null>(null);
  const current = typeof value === "number" ? value : null;
  const shown = hovered ?? current ?? 0;

  const pick = (rating: number) => {
    if (!interactive) return;
    onChange(rating);
    setTimeout(onSubmit, AUTO_ADVANCE_MS);
  };

  useShortcutKeys((key) => {
    const rating = key === "0" ? 10 : Number(key);
    if (Number.isInteger(rating) && rating >= 1 && rating <= steps) {
      pick(rating);
      return true;
    }
    return false;
  }, interactive);

  return (
    <div role="radiogroup" aria-label={question.title} className="flex flex-wrap gap-1 sm:gap-3">
      {Array.from({ length: steps }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          role="radio"
          aria-checked={current === rating}
          aria-label={`${rating} out of ${steps}`}
          className="tf-rating-star"
          tabIndex={interactive ? 0 : -1}
          onPointerEnter={(e) => interactive && e.pointerType === "mouse" && setHovered(rating)}
          onPointerLeave={() => setHovered(null)}
          onClick={() => pick(rating)}
        >
          <Star filled={rating <= shown} />
          <span>{rating}</span>
        </button>
      ))}
    </div>
  );
}
