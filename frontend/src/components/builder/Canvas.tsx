"use client";

import { ArrowRight, Plus } from "lucide-react";
import { isChoiceType } from "@/lib/questionTypes";
import { themeStyle } from "@/lib/theme";
import type { Theme, ThankYou } from "@/lib/types";
import { OkButton } from "../respondent/OkButton";
import { ChoiceAnswer } from "../respondent/inputs/ChoiceAnswer";
import { RatingAnswer } from "../respondent/inputs/RatingAnswer";
import { TextAnswer } from "../respondent/inputs/TextAnswer";
import { AutoTextarea, FitTextarea } from "./AutoTextarea";
import { EditableChoices } from "./EditableChoices";
import { toQuestion, type DraftQuestion } from "./draft";

const noop = () => {};

function QuestionCanvas({
  question,
  index,
  isLast,
  onChange,
}: {
  question: DraftQuestion;
  index: number;
  isLast: boolean;
  onChange: (patch: Partial<DraftQuestion>) => void;
}) {
  // The respondent components, rendered read-only, so the canvas matches the live form.
  const preview = { question: toQuestion(question, index), value: null, onChange: noop, onSubmit: noop, interactive: false };

  return (
    <div className="w-full">
      <div className="relative flex gap-2 md:block">
        <span className="tf-number flex shrink-0 items-center gap-1 md:absolute md:right-full md:top-0 md:mr-2">
          {index + 1}
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
        </span>
        <div className="flex-1">
          <div className="flex items-start">
            <FitTextarea
              className="tf-question-title"
              value={question.title}
              placeholder="Your question here."
              aria-label="Question"
              onChange={(e) => onChange({ title: e.target.value })}
            />
            {question.required && (
              <span className="tf-question-title shrink-0 pl-0.5" aria-label="required">
                *
              </span>
            )}
          </div>
          <AutoTextarea
            className="tf-question-desc"
            value={question.description ?? ""}
            placeholder="Description (optional)"
            aria-label="Description"
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-8">
        {isChoiceType(question.type) ? (
          <>
            {question.type === "dropdown" && (
              <div className="mb-4">
                <input className="tf-input" placeholder="Type or select an option" readOnly tabIndex={-1} aria-hidden />
                <p className="tf-enter-hint mt-3">Respondents pick one of these choices:</p>
              </div>
            )}
            <EditableChoices options={question.options} onChange={(options) => onChange({ options })} />
          </>
        ) : question.type === "rating" ? (
          <RatingAnswer {...preview} />
        ) : question.type === "yes_no" ? (
          <ChoiceAnswer {...preview} />
        ) : (
          <TextAnswer {...preview} />
        )}
      </div>

      <div className="pointer-events-none mt-6">
        <OkButton label={isLast ? "Submit" : "OK"} showCheck={!isLast} onClick={noop} />
      </div>
    </div>
  );
}

function EndingCanvas({ thankYou, onChange }: { thankYou: ThankYou; onChange: (t: ThankYou) => void }) {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <AutoTextarea
        className="text-center text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]"
        value={thankYou.title ?? ""}
        placeholder="Thanks for completing this form"
        aria-label="Thank you title"
        onChange={(e) => onChange({ ...thankYou, title: e.target.value })}
      />
      <AutoTextarea
        className="tf-question-desc text-center"
        value={thankYou.description ?? ""}
        placeholder="Now create your own. It's free, easy and beautiful."
        aria-label="Thank you message"
        onChange={(e) => onChange({ ...thankYou, description: e.target.value })}
      />
      <span className="tf-button pointer-events-none mt-8">Create your own form</span>
    </div>
  );
}

interface Props {
  question?: DraftQuestion;
  index: number;
  isLast: boolean;
  showEnding: boolean;
  theme: Theme;
  thankYou: ThankYou;
  onChangeQuestion: (patch: Partial<DraftQuestion>) => void;
  onChangeThankYou: (thankYou: ThankYou) => void;
  onAddQuestion: () => void;
}

/** Center of the builder: a themed card showing the selected screen, editable in place. */
export function Canvas(props: Props) {
  const { question, showEnding } = props;

  return (
    <div
      className="tf-root relative flex min-h-[460px] w-full max-w-[1000px] flex-1 flex-col overflow-y-auto rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      style={themeStyle(props.theme)}
    >
      <div className="m-auto w-full max-w-[720px] px-8 py-16 md:pl-16">
        {showEnding ? (
          <EndingCanvas thankYou={props.thankYou} onChange={props.onChangeThankYou} />
        ) : question ? (
          <QuestionCanvas
            key={question.key}
            question={question}
            index={props.index}
            isLast={props.isLast}
            onChange={props.onChangeQuestion}
          />
        ) : (
          <div className="flex flex-col items-center text-center">
            <p className="tf-question-title">Your form has no questions yet</p>
            <button type="button" className="tf-button mt-6" onClick={props.onAddQuestion}>
              <Plus size={18} /> Add your first question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
