// Mirrors backend/app/validation.py so respondents get instant feedback.
// The server re-checks everything; this is only for speed.

import type { AnswerValue, Question } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const MESSAGES = {
  required: "Please fill this in",
  selection: "Oops! Please make a selection",
  email: "Hmm... that email doesn't look right",
  number: "Numbers only please",
};

export function isBlank(value: AnswerValue | undefined): boolean {
  return value === null || value === undefined || (typeof value === "string" && !value.trim());
}

/** Returns an error message, or null if the answer is fine. */
export function validateAnswer(question: Question, value: AnswerValue | undefined): string | null {
  if (isBlank(value)) {
    if (!question.required) return null;
    const isChoice = ["multiple_choice", "dropdown", "yes_no", "rating"].includes(question.type);
    return isChoice ? MESSAGES.selection : MESSAGES.required;
  }

  const props = question.properties as { min?: number; max?: number };

  switch (question.type) {
    case "email":
      return EMAIL_RE.test(String(value).trim()) ? null : MESSAGES.email;
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n)) return MESSAGES.number;
      if (props.min !== undefined && n < props.min) return `Please enter a number of ${props.min} or more`;
      if (props.max !== undefined && n > props.max) return `Please enter a number of ${props.max} or less`;
      return null;
    }
    case "short_text":
      return String(value).trim().length > 255 ? "Please keep it under 255 characters" : null;
    default:
      return null;
  }
}

/** Converts what the input holds into what the API expects. */
export function toPayloadValue(question: Question, value: AnswerValue | undefined): AnswerValue {
  if (isBlank(value)) return null;
  if (question.type === "number") return Number(value);
  if (typeof value === "string") return value.trim();
  return value ?? null;
}
