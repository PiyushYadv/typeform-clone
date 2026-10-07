import { ArrowRight } from "lucide-react";
import type { Question } from "@/lib/types";

/** "1 → Question title *" with optional description, as Typeform lays it out. */
export function QuestionHeader({ question, number }: { question: Question; number: number }) {
  return (
    <div className="relative flex gap-2 md:block">
      {/* On desktop the number hangs in the left margin, so titles line up with answers. */}
      <span className="tf-number flex shrink-0 items-center gap-1 md:absolute md:right-full md:top-0 md:mr-2">
        {number}
        <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
      </span>
      <div>
        <h1 className="tf-question-title">
          {question.title || "..."}
          {question.required && <span aria-label="required"> *</span>}
        </h1>
        {question.description && <p className="tf-question-desc">{question.description}</p>}
      </div>
    </div>
  );
}
