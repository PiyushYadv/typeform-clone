import { formatDateTime } from "@/lib/format";
import type { Question, ResponseRecord } from "@/lib/types";
import { QuestionBadge } from "../ui/QuestionBadge";
import { formatAnswer } from "./answerFormat";

interface Props {
  questions: Question[];
  responses: ResponseRecord[];
  onOpen: (index: number) => void;
}

/** One row per submission, one column per question. Click a row to read it in full. */
export function ResponsesTable({ questions, responses, onOpen }: Props) {
  return (
    <div className="overflow-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-max border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-black/10">
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap text-black/60">
              Submitted
            </th>
            {questions.map((q, i) => (
              <th key={q.id} scope="col" className="px-4 py-3 font-medium">
                <span className="flex max-w-60 items-center gap-2">
                  <QuestionBadge type={q.type} number={i + 1} />
                  <span className="truncate" title={q.title}>
                    {q.title || "Untitled question"}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((response, index) => {
            const byQuestion = new Map(response.answers.map((a) => [a.question_id, a.value]));
            return (
              <tr
                key={response.id}
                tabIndex={0}
                aria-label={`Open response from ${formatDateTime(response.submitted_at)}`}
                onClick={() => onOpen(index)}
                onKeyDown={(e) => e.key === "Enter" && onOpen(index)}
                className="cursor-pointer border-b border-black/5 hover:bg-black/[0.025] focus-visible:bg-black/[0.04]"
              >
                <td className="px-4 py-3 whitespace-nowrap text-black/60">{formatDateTime(response.submitted_at)}</td>
                {questions.map((q) => {
                  const text = formatAnswer(q, byQuestion.get(q.id) ?? null);
                  return (
                    <td key={q.id} className="px-4 py-3">
                      <span className="block max-w-60 truncate" title={text}>
                        {text || <span className="text-black/30">—</span>}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
