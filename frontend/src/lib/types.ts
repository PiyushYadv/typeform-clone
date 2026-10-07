// Shapes returned by the FastAPI backend. Keep in sync with backend/app/schemas.py.

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export interface Option {
  id: number;
  position: number;
  label: string;
}

export interface Question {
  id: number;
  position: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  properties: Record<string, unknown>;
  options: Option[];
}

export interface Theme {
  background?: string;
  question_color?: string;
  answer_color?: string;
  button_color?: string;
  button_text_color?: string;
  font?: string;
}

export interface ThankYou {
  title?: string;
  description?: string;
}

export interface PublicForm {
  title: string;
  slug: string;
  theme: Theme;
  thank_you: ThankYou;
  questions: Question[];
}

/** What the respondent has entered. Choice answers hold the option id. */
export type AnswerValue = string | number | null;

export type FormStatus = "draft" | "published";

export interface FormListItem {
  id: number;
  title: string;
  slug: string;
  status: FormStatus;
  response_count: number;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormDetail extends PublicForm {
  id: number;
  status: FormStatus;
  created_at: string;
  updated_at: string;
}

/** What the builder sends to PUT /questions. No id = create. */
export interface QuestionPayload {
  id?: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  properties: Record<string, unknown>;
  options: { id?: number; label: string }[];
}

export interface ResponseRecord {
  id: number;
  started_at: string;
  submitted_at: string;
  answers: { question_id: number; question_title: string; value: string | number | null }[];
}

export interface QuestionSummary {
  question_id: number;
  title: string;
  type: QuestionType;
  answered: number;
  skipped: number;
  stats: {
    options?: { option_id?: number; label: string; count: number; percent: number }[];
    distribution?: { rating: number; count: number; percent: number }[];
    average?: number | null;
    min?: number | null;
    max?: number | null;
    latest?: string[];
  };
}

export interface FormSummary {
  total_responses: number;
  total_started: number;
  completion_rate: number;
  questions: QuestionSummary[];
}
