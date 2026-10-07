import { formatNumber } from "@/lib/format";
import type { Question } from "@/lib/types";

/** How an answer reads in the table and the response view. */
export function formatAnswer(question: Question | undefined, value: string | number | null): string {
  if (value === null || value === "") return "";
  if (!question) return typeof value === "number" ? formatNumber(value) : value;
  switch (question.type) {
    case "yes_no":
      return value === "yes" ? "Yes" : "No";
    case "rating":
      return `${formatNumber(Number(value))} / ${Number(question.properties.steps ?? 5)}`;
    case "number":
      return formatNumber(Number(value));
    default:
      return String(value);
  }
}
