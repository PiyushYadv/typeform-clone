import type { AnswerValue, Question } from "@/lib/types";

/** Props shared by every answer input. */
export interface AnswerInputProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  /** Move to the next question (Enter, OK button, or auto-advance after a choice). */
  onSubmit: () => void;
  /** False in the builder's preview canvas: shows the input but ignores keys and clicks. */
  interactive?: boolean;
  autoFocus?: boolean;
}
