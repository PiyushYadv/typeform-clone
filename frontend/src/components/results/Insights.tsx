import { formatDuration, parseApiDate } from "@/lib/format";
import type { FormSummary, ResponseRecord } from "@/lib/types";

function averageSeconds(responses: ResponseRecord[]): number | null {
  if (!responses.length) return null;
  const total = responses.reduce(
    (sum, r) => sum + (parseApiDate(r.submitted_at).getTime() - parseApiDate(r.started_at).getTime()) / 1000,
    0,
  );
  return total / responses.length;
}

/** Headline numbers: how many started, how many finished, and how long it took. */
export function Insights({ summary, responses }: { summary: FormSummary; responses: ResponseRecord[] }) {
  const avg = averageSeconds(responses);
  const stats = [
    { label: "Responses", value: summary.total_responses.toLocaleString() },
    { label: "Started", value: summary.total_started.toLocaleString() },
    { label: "Completion rate", value: summary.total_started ? `${summary.completion_rate}%` : "—" },
    { label: "Average time to complete", value: avg === null ? "—" : formatDuration(avg) },
  ];

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg bg-white shadow-sm md:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={`p-5 ${i > 0 ? "md:border-l" : ""} ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t md:border-t-0" : ""} border-black/5`}>
          <dt className="text-black/60">{s.label}</dt>
          <dd className="mt-1 text-2xl font-medium tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
