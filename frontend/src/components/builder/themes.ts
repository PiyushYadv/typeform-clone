import type { Theme } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/theme";

export interface ThemePreset {
  name: string;
  theme: Theme;
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: "Classic", theme: DEFAULT_THEME },
  {
    name: "Midnight",
    theme: { ...DEFAULT_THEME, background: "#1F1F2B", question_color: "#FFFFFF", answer_color: "#C7B9FF", button_color: "#C7B9FF", button_text_color: "#1F1F2B" },
  },
  {
    name: "Forest",
    theme: { ...DEFAULT_THEME, background: "#EEF3EC", question_color: "#1D3324", answer_color: "#2E6B3C", button_color: "#2E6B3C", button_text_color: "#FFFFFF" },
  },
  {
    name: "Berry",
    theme: { ...DEFAULT_THEME, background: "#FFF3F6", question_color: "#3B1024", answer_color: "#B4235A", button_color: "#B4235A", button_text_color: "#FFFFFF" },
  },
  {
    name: "Ocean",
    theme: { ...DEFAULT_THEME, background: "#0E3654", question_color: "#FFFFFF", answer_color: "#9BE3FF", button_color: "#9BE3FF", button_text_color: "#0E3654" },
  },
  {
    name: "Mono",
    theme: { ...DEFAULT_THEME, background: "#FFFFFF", question_color: "#191919", answer_color: "#191919", button_color: "#191919", button_text_color: "#FFFFFF" },
  },
];

export function isSameTheme(a: Theme, b: Theme): boolean {
  const merged = { ...DEFAULT_THEME, ...a };
  return (Object.keys(DEFAULT_THEME) as (keyof Theme)[]).every((k) => merged[k] === b[k]);
}
