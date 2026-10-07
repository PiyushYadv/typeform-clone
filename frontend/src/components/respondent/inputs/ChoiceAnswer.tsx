"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { AnswerInputProps } from "../types";
import { AUTO_ADVANCE_MS, useShortcutKeys } from "../useShortcutKeys";

interface Choice {
  key: string;
  label: string;
  value: string | number;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function choicesFor({ question }: AnswerInputProps): Choice[] {
  if (question.type === "yes_no") {
    return [
      { key: "Y", label: "Yes", value: "yes" },
      { key: "N", label: "No", value: "no" },
    ];
  }
  return question.options.map((o, i) => ({ key: LETTERS[i] ?? "", label: o.label, value: o.id }));
}

/** Multiple choice and yes/no: lettered options that blink, then auto-advance. */
export function ChoiceAnswer(props: AnswerInputProps) {
  const { value, onChange, onSubmit, interactive = true } = props;
  const choices = choicesFor(props);
  const [blinking, setBlinking] = useState<string | number | null>(null);

  const select = (choice: Choice) => {
    if (!interactive) return;
    onChange(choice.value);
    setBlinking(choice.value);
    setTimeout(() => setBlinking(null), AUTO_ADVANCE_MS);
    setTimeout(onSubmit, AUTO_ADVANCE_MS);
  };

  useShortcutKeys((key) => {
    const choice = choices.find((c) => c.key === key);
    if (choice) select(choice);
    return Boolean(choice);
  }, interactive);

  return (
    <div
      role="radiogroup"
      aria-label={props.question.title}
      className="flex w-full max-w-full flex-col gap-2 sm:w-fit sm:min-w-[260px]"
    >
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <button
            key={choice.key + choice.label}
            type="button"
            role="radio"
            aria-checked={selected}
            className="tf-choice"
            data-selected={selected}
            data-blink={blinking === choice.value}
            tabIndex={interactive ? 0 : -1}
            onClick={() => select(choice)}
          >
            <span className="tf-key" aria-hidden>
              {choice.key}
            </span>
            <span className="flex-1 pr-6">{choice.label}</span>
            {selected && <Check size={20} strokeWidth={2.5} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
