import type { CSSProperties } from "react";
import type { Theme } from "./types";

// Typeform's default theme.
export const DEFAULT_THEME: Required<Theme> = {
  background: "#FFFFFF",
  question_color: "#191919",
  answer_color: "#0445AF",
  button_color: "#0445AF",
  button_text_color: "#FFFFFF",
  font: "Karla",
};

/** Exposes the theme as CSS variables so every component can use it. */
export function themeStyle(theme: Theme = {}): CSSProperties {
  const t = { ...DEFAULT_THEME, ...theme };
  return {
    "--tf-bg": t.background,
    "--tf-question": t.question_color,
    "--tf-answer": t.answer_color,
    "--tf-button": t.button_color,
    "--tf-button-text": t.button_text_color,
    "--tf-font": `"${t.font}", "Helvetica Neue", Arial, sans-serif`,
  } as CSSProperties;
}
