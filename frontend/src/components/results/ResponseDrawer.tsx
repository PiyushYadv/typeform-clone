"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect } from "react";
import { formatDateTime, formatDuration, parseApiDate } from "@/lib/format";
import type { Question, ResponseRecord } from "@/lib/types";
import { QuestionBadge } from "../ui/QuestionBadge";
import { formatAnswer } from "./answerFormat";

interface Props {
  response: ResponseRecord;
  questions: Question[];
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

/** A single response in full, with up/down to step through the others. */
export function ResponseDrawer({ response, questions, position, total, onPrev, onNext, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp") onPrev();
      if (e.key === "ArrowDown") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  const byQuestion = new Map(response.answers.map((a) => [a.question_id, a.value]));
  const currentIds = new Set(questions.map((q) => q.id));
  // Answers kept from questions that were later deleted from the form.
  const orphaned = response.answers.filter((a) => !currentIds.has(a.question_id));
  const seconds = (parseApiDate(response.submitted_at).getTime() - parseApiDate(response.started_at).getTime()) / 1000;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Response"
        className="app-ui flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <div>
            <p className="font-medium">{formatDateTime(response.submitted_at)}</p>
            <p className="text-xs text-black/50">
              Response {position + 1} of {total} · took {formatDuration(seconds)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="icon-btn" aria-label="Previous response" onClick={onPrev} disabled={position === 0}>
              <ChevronUp size={18} />
            </button>
            <button type="button" className="icon-btn" aria-label="Next response" onClick={onNext} disabled={position === total - 1}>
              <ChevronDown size={18} />
            </button>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </header>

        <ol className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {questions.map((q, i) => {
            const text = formatAnswer(q, byQuestion.get(q.id) ?? null);
            return (
              <li key={q.id}>
                <p className="flex items-start gap-2 text-black/70">
                  <QuestionBadge type={q.type} number={i + 1} />
                  <span>{q.title || "Untitled question"}</span>
                </p>
                <p className={`mt-1.5 pl-1 text-base whitespace-pre-line ${text ? "" : "text-black/30"}`}>
                  {text || "Skipped"}
                </p>
              </li>
            );
          })}
          {orphaned.length > 0 && (
            <li className="border-t border-black/10 pt-4">
              <p className="mb-2 text-xs font-medium text-black/50">Answers to questions since deleted</p>
              {orphaned.map((a) => (
                <div key={a.question_id} className="py-1.5">
                  <p className="text-black/60">{a.question_title || "Untitled question"}</p>
                  <p className="mt-0.5 text-base">{formatAnswer(undefined, a.value)}</p>
                </div>
              ))}
            </li>
          )}
        </ol>
      </motion.aside>
    </div>
  );
}
