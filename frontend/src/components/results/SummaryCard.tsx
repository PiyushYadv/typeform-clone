import { Star } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import type { QuestionSummary } from "@/lib/types";
import { QuestionBadge } from "../ui/QuestionBadge";

interface Bar {
  label: React.ReactNode;
  count: number;
  percent: number;
}

/** Horizontal bars with the share of answers; the most-picked answer is emphasised. */
function Bars({ rows, color }: { rows: Bar[]; color: string }) {
  const top = Math.max(0, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2">
      {rows.map((row, i) => (
        <li key={i} className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
          <div className="relative h-9 overflow-hidden rounded-md bg-black/[0.04]">
            <div className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${row.percent}%`, background: color }} />
            <span className={`relative flex h-9 items-center truncate px-3 ${row.count === top && top > 0 ? "font-medium" : ""}`}>
              {row.label}
            </span>
          </div>
          <span className="text-right tabular-nums">
            {row.percent}% <span className="text-black/50">({row.count})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <p className="text-black/60">{label}</p>
      <p className="mt-0.5 text-2xl font-medium tabular-nums">{value === null || value === undefined ? "—" : formatNumber(value)}</p>
    </div>
  );
}

interface Props {
  summary: QuestionSummary;
  number: number;
  total: number;
  onSeeAll: () => void;
}

export function SummaryCard({ summary, number, total, onSeeAll }: Props) {
  const { type, stats } = summary;
  const color = QUESTION_TYPES[type].color;

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <header className="mb-5">
        <h3 className="flex items-start gap-2.5 text-base font-medium">
          <QuestionBadge type={type} number={number} />
          <span>{summary.title || "Untitled question"}</span>
        </h3>
        <p className="mt-1.5 text-black/60">
          {summary.answered} out of {total} people answered this question
        </p>
      </header>

      {summary.answered === 0 ? (
        <p className="text-black/50">No answers yet.</p>
      ) : stats.options ? (
        <Bars rows={stats.options} color={color} />
      ) : stats.distribution ? (
        <div className="grid gap-6 sm:grid-cols-[140px_1fr]">
          <div>
            <p className="text-4xl font-medium tabular-nums">{(stats.average ?? 0).toFixed(1)}</p>
            <p className="text-black/60">average rating</p>
          </div>
          <Bars
            color={color}
            rows={[...stats.distribution].reverse().map((d) => ({
              ...d,
              label: (
                <span className="flex items-center gap-1">
                  {d.rating} <Star size={14} aria-label="stars" />
                </span>
              ),
            }))}
          />
        </div>
      ) : type === "number" ? (
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Average" value={stats.average} />
          <Stat label="Lowest" value={stats.min} />
          <Stat label="Highest" value={stats.max} />
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs font-medium text-black/50">Latest answers</p>
          <ul className="divide-y divide-black/5">
            {stats.latest?.map((answer, i) => (
              <li key={i} className="py-2.5 whitespace-pre-line">
                {answer}
              </li>
            ))}
          </ul>
          {summary.answered > (stats.latest?.length ?? 0) && (
            <button type="button" className="mt-2 text-sm underline underline-offset-4" onClick={onSeeAll}>
              See all {summary.answered} answers
            </button>
          )}
        </div>
      )}
    </section>
  );
}
