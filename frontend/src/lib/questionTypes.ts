import {
  AlignLeft,
  ChevronDown,
  Hash,
  ListChecks,
  Mail,
  Star,
  ToggleRight,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { QuestionType } from "./types";

export interface QuestionTypeInfo {
  label: string;
  icon: LucideIcon;
  /** Tile color, grouped by category like Typeform's question picker. */
  color: string;
  group: "Contact info" | "Text" | "Choice" | "Rating" | "Other";
}

export const QUESTION_TYPES: Record<QuestionType, QuestionTypeInfo> = {
  email: { label: "Email", icon: Mail, color: "#F5C9D6", group: "Contact info" },
  short_text: { label: "Short text", icon: Type, color: "#C6DDF4", group: "Text" },
  long_text: { label: "Long text", icon: AlignLeft, color: "#C6DDF4", group: "Text" },
  multiple_choice: { label: "Multiple choice", icon: ListChecks, color: "#DCD0F2", group: "Choice" },
  dropdown: { label: "Dropdown", icon: ChevronDown, color: "#DCD0F2", group: "Choice" },
  yes_no: { label: "Yes/No", icon: ToggleRight, color: "#DCD0F2", group: "Choice" },
  rating: { label: "Rating", icon: Star, color: "#C9E7D0", group: "Rating" },
  number: { label: "Number", icon: Hash, color: "#F7DDB5", group: "Other" },
};

export const TYPE_ORDER = Object.keys(QUESTION_TYPES) as QuestionType[];

export const isChoiceType = (type: QuestionType) => type === "multiple_choice" || type === "dropdown";
