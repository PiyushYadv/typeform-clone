"use client";

import type { AnswerValue, Question } from "@/lib/types";
import { ErrorPill } from "./ErrorPill";
import { OkButton } from "./OkButton";
import { QuestionHeader } from "./QuestionHeader";
import { ChoiceAnswer } from "./inputs/ChoiceAnswer";
import { DropdownAnswer } from "./inputs/DropdownAnswer";
import { RatingAnswer } from "./inputs/RatingAnswer";
import { TextAnswer } from "./inputs/TextAnswer";
import type { AnswerInputProps } from "./types";

function AnswerInput(props: AnswerInputProps) {
  switch (props.question.type) {
    case "multiple_choice":
    case "yes_no":
      return <ChoiceAnswer {...props} />;
    case "dropdown":
      return <DropdownAnswer {...props} />;
    case "rating":
      return <RatingAnswer {...props} />;
    default:
      return <TextAnswer {...props} />;
  }
}

interface Props {
  question: Question;
  number: number;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onSubmit: () => void;
  error?: string | null;
  isLast?: boolean;
  submitting?: boolean;
  /** False in the builder canvas: same look, no interaction. */
  interactive?: boolean;
}

/**
 * One full question screen. Used by the respondent flow and, read-only,
 * by the builder's live preview so both always look identical.
 */
export function QuestionView({
  question,
  number,
  value,
  onChange,
  onSubmit,
  error,
  isLast,
  submitting,
  interactive = true,
}: Props) {
  return (
    <div className="w-full">
      <QuestionHeader question={question} number={number} />
      <div className="mt-8">
        <AnswerInput
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          interactive={interactive}
          autoFocus
        />
      </div>
      {/* Typeform swaps the OK button for the error message in the same spot. */}
      <div className="mt-6 min-h-11">
        {error ? (
          <ErrorPill message={error} />
        ) : (
          <OkButton
            label={isLast ? "Submit" : "OK"}
            showCheck={!isLast}
            loading={submitting}
            onClick={onSubmit}
            disabled={!interactive}
          />
        )}
      </div>
    </div>
  );
}
