import { QUESTION_TYPES } from "@/lib/questionTypes";
import type { QuestionType } from "@/lib/types";

/** Colored type tile with the question number, as in Typeform's content list. */
export function QuestionBadge({ type, number }: { type: QuestionType; number?: number }) {
  const { icon: Icon, color } = QUESTION_TYPES[type];
  return (
    <span
      className="inline-flex h-6 shrink-0 items-center gap-1 rounded px-1.5 text-xs font-medium text-[#262627]"
      style={{ background: color }}
    >
      <Icon size={13} aria-hidden />
      {number !== undefined && number}
    </span>
  );
}
