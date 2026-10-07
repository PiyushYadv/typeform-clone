import type {
  AnswerValue,
  FormDetail,
  FormListItem,
  FormSummary,
  PublicForm,
  QuestionPayload,
  ResponseRecord,
  Theme,
  ThankYou,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Error from the API. `fieldErrors` maps question id → message for 422 responses. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const message = typeof detail === "string" ? detail : (detail?.message ?? "Something went wrong");
    throw new ApiError(res.status, message, detail?.errors ?? {});
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const publicApi = {
  getForm: (slug: string) => request<PublicForm>(`/api/public/forms/${slug}`),

  /** Marks that the respondent pressed Start, so drop-off can be measured. */
  start: (slug: string) =>
    request<{ response_id: number }>(`/api/public/forms/${slug}/start`, { method: "POST" }),

  submit: (slug: string, answers: Record<number, AnswerValue>, startedAt: string, responseId: number | null) =>
    request<{ response_id: number }>(`/api/public/forms/${slug}/responses`, {
      method: "POST",
      body: JSON.stringify({
        started_at: startedAt,
        response_id: responseId,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          question_id: Number(questionId),
          value,
        })),
      }),
    }),
};

export interface FormPatch {
  title?: string;
  theme?: Theme;
  thank_you?: ThankYou;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** Creator-side endpoints. Auth is simplified to one default creator. */
export const formsApi = {
  list: () => request<FormListItem[]>("/api/forms"),
  create: () => request<FormDetail>("/api/forms", json("POST", {})),
  get: (id: number) => request<FormDetail>(`/api/forms/${id}`),
  update: (id: number, patch: FormPatch) => request<FormDetail>(`/api/forms/${id}`, json("PATCH", patch)),
  remove: (id: number) => request<void>(`/api/forms/${id}`, json("DELETE")),
  duplicate: (id: number) => request<FormDetail>(`/api/forms/${id}/duplicate`, json("POST")),
  publish: (id: number) => request<FormDetail>(`/api/forms/${id}/publish`, json("POST")),
  unpublish: (id: number) => request<FormDetail>(`/api/forms/${id}/unpublish`, json("POST")),
  saveQuestions: (id: number, questions: QuestionPayload[]) =>
    request<FormDetail>(`/api/forms/${id}/questions`, json("PUT", { questions })),
};

/** The shareable link respondents open. Client-side only. */
export function publicLink(slug: string): string {
  return `${window.location.origin}/to/${slug}`;
}

export const resultsApi = {
  responses: (id: number) => request<ResponseRecord[]>(`/api/forms/${id}/responses`),
  summary: (id: number) => request<FormSummary>(`/api/forms/${id}/summary`),
  csvUrl: (id: number) => `${API_URL}/api/forms/${id}/export.csv`,
};
