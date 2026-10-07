// The builder edits a local "draft" copy of the form. Every question and option
// has a client-side `key`, so React and drag-and-drop work before the server
// has assigned ids. `id` is filled in after the first save.

import { isChoiceType } from "@/lib/questionTypes";
import type { FormDetail, PublicForm, Question, QuestionPayload, QuestionType, ThankYou, Theme } from "@/lib/types";

export interface DraftOption {
  key: string;
  id?: number;
  label: string;
}

export interface DraftQuestion {
  key: string;
  id?: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  properties: Record<string, unknown>;
  options: DraftOption[];
}

export interface FormMeta {
  id: number;
  title: string;
  slug: string;
  status: FormDetail["status"];
  theme: Theme;
  thank_you: ThankYou;
}

/** Selection key for the thank-you screen in the content list. */
export const ENDING = "__ending__";

export const newKey = () => crypto.randomUUID();

const defaultOptions = (): DraftOption[] => [
  { key: newKey(), label: "Choice 1" },
  { key: newKey(), label: "Choice 2" },
];

export function newQuestion(type: QuestionType): DraftQuestion {
  return {
    key: newKey(),
    type,
    title: "",
    description: null,
    required: false,
    properties: type === "rating" ? { steps: 5 } : {},
    options: isChoiceType(type) ? defaultOptions() : [],
  };
}

/** Switching type keeps the wording; it only adds what the new type needs. */
export function changeType(question: DraftQuestion, type: QuestionType): DraftQuestion {
  return {
    ...question,
    type,
    properties: type === "rating" ? { steps: 5 } : {},
    options: isChoiceType(type) && question.options.length === 0 ? defaultOptions() : question.options,
  };
}

export function fromServer(q: Question): DraftQuestion {
  return { ...q, key: newKey(), options: q.options.map((o) => ({ ...o, key: newKey() })) };
}

/** Options with empty labels are skipped when saving (the API rejects them). */
export const savableOptions = (q: DraftQuestion) =>
  isChoiceType(q.type) ? q.options.filter((o) => o.label.trim()) : [];

export function toPayload(q: DraftQuestion): QuestionPayload {
  return {
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description?.trim() ? q.description : null,
    required: q.required,
    properties: q.properties,
    options: savableOptions(q).map((o) => ({ id: o.id, label: o.label.trim() })),
  };
}

/**
 * Turns draft questions into the shape the respondent components expect,
 * so the canvas and preview reuse them. Unsaved items get stand-in ids.
 */
export function toQuestion(q: DraftQuestion, index: number): Question {
  return {
    id: q.id ?? -(index + 1),
    position: index,
    type: q.type,
    title: q.title,
    description: q.description,
    required: q.required,
    properties: q.properties,
    options: q.options.map((o, i) => ({ id: o.id ?? -(i + 1), position: i, label: o.label })),
  };
}

export function toPreviewForm(meta: FormMeta, questions: DraftQuestion[]): PublicForm {
  return {
    title: meta.title,
    slug: meta.slug,
    theme: meta.theme,
    thank_you: meta.thank_you,
    questions: questions.map(toQuestion),
  };
}
