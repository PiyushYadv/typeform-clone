"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ApiError, publicApi } from "@/lib/api";
import { themeStyle } from "@/lib/theme";
import type { AnswerValue, PublicForm } from "@/lib/types";
import { isBlank, toPayloadValue, validateAnswer } from "@/lib/validation";
import { NavArrows } from "./NavArrows";
import { ProgressBar } from "./ProgressBar";
import { QuestionView } from "./QuestionView";
import { ThankYouScreen, WelcomeScreen } from "./Screens";

type Stage = "welcome" | "questions" | "done";

// Questions slide up when moving forward and down when going back.
const slide: Variants = {
  enter: (dir: number) => ({ y: dir > 0 ? "45vh" : "-45vh", opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? "-45vh" : "45vh", opacity: 0 }),
};
const fade: Variants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

interface Props {
  form: PublicForm;
  /** Preview mode (from the builder) walks the whole flow but never saves a response. */
  preview?: boolean;
}

export function FormRunner({ form, preview = false }: Props) {
  const { questions } = form;
  const [stage, setStage] = useState<Stage>("welcome");
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const reduceMotion = useReducedMotion();

  // Take keyboard focus on arrival, so Enter starts the form instead of
  // re-pressing whatever button opened it (e.g. the builder's Preview button).
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  // Timers (auto-advance) and the window key listener outlive a single render,
  // so they read live state from refs instead of stale closures.
  const live = useRef({ stage, index, answers, submitting });
  const startedAt = useRef(new Date().toISOString());
  const responseId = useRef<number | null>(null);
  useEffect(() => {
    live.current.stage = stage;
    live.current.index = index;
    live.current.submitting = submitting;
  }, [stage, index, submitting]);

  const goTo = (next: number) => {
    setDirection(next >= live.current.index ? 1 : -1);
    live.current.index = next;
    setIndex(next);
  };

  const setAnswer = (questionId: number, value: AnswerValue) => {
    live.current.answers = { ...live.current.answers, [questionId]: value };
    setAnswers(live.current.answers);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const showError = (questionId: number, message: string) =>
    setErrors((prev) => ({ ...prev, [questionId]: message }));

  const submit = async () => {
    // Catch anything skipped by jumping back with the arrows.
    for (let i = 0; i < questions.length; i++) {
      const message = validateAnswer(questions[i], live.current.answers[questions[i].id]);
      if (message) {
        showError(questions[i].id, message);
        goTo(i);
        return;
      }
    }

    if (preview) {
      setDirection(1);
      setStage("done");
      return;
    }

    setSubmitting(true);
    live.current.submitting = true;
    try {
      const payload = Object.fromEntries(
        questions.map((q) => [q.id, toPayloadValue(q, live.current.answers[q.id])]),
      );
      await publicApi.submit(form.slug, payload, startedAt.current, responseId.current);
      setDirection(1);
      setStage("done");
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        const fieldErrors = Object.fromEntries(
          Object.entries(err.fieldErrors).map(([id, message]) => [Number(id), message]),
        );
        setErrors(fieldErrors);
        const first = questions.findIndex((q) => q.id in fieldErrors);
        if (first >= 0) goTo(first);
      } else {
        showError(questions[live.current.index].id, err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setSubmitting(false);
      live.current.submitting = false;
    }
  };

  /** Validate the current question, then advance (or submit on the last one). */
  const goNext = (fromIndex: number) => {
    const { stage, index, submitting } = live.current;
    // Ignore late auto-advance timers if the respondent has already moved on.
    if (stage !== "questions" || fromIndex !== index || submitting) return;

    const question = questions[index];
    const message = validateAnswer(question, live.current.answers[question.id]);
    if (message) return showError(question.id, message);

    if (index === questions.length - 1) void submit();
    else goTo(index + 1);
  };

  const goPrev = () => {
    if (live.current.index > 0) goTo(live.current.index - 1);
  };

  const start = () => {
    startedAt.current = new Date().toISOString();
    // Fire-and-forget: if it fails, the submission still creates the response.
    if (!preview) {
      publicApi
        .start(form.slug)
        .then(({ response_id }) => (responseId.current = response_id))
        .catch(() => {});
    }
    setDirection(1);
    setStage("questions");
  };

  // Keyboard: Enter starts / advances, ↓ and ↑ move between questions.
  const actions = useRef({ goNext, goPrev, start });
  useEffect(() => {
    actions.current = { goNext, goPrev, start };
  });
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const current = live.current;

      if (e.key === "Enter" && !e.shiftKey) {
        // Fields and buttons handle their own Enter.
        if (["INPUT", "TEXTAREA", "BUTTON", "A"].includes(tag)) return;
        e.preventDefault();
        if (current.stage === "welcome") actions.current.start();
        else actions.current.goNext(current.index);
        return;
      }

      if (current.stage !== "questions") return;
      if (tag === "TEXTAREA" || target.getAttribute("role") === "combobox") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        actions.current.goNext(current.index);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        actions.current.goPrev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const answeredCount = questions.filter((q) => !isBlank(answers[q.id])).length;
  const question = questions[index];
  const screenKey = stage === "questions" ? `q-${question.id}` : stage;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="tf-root fixed inset-0 overflow-hidden outline-none"
      style={themeStyle(form.theme)}
    >
      {stage === "questions" && (
        <div className="absolute inset-x-0 top-0 z-10">
          <ProgressBar value={answeredCount / questions.length} />
        </div>
      )}

      <AnimatePresence initial={false} custom={direction}>
        <motion.section
          key={screenKey}
          custom={direction}
          variants={reduceMotion ? fade : slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
          className="absolute inset-0 flex flex-col overflow-y-auto px-6 py-20"
        >
          <div className="m-auto w-full max-w-[720px] md:pl-10">
            {stage === "welcome" && (
              <WelcomeScreen title={form.title} questionCount={questions.length} onStart={start} />
            )}
            {stage === "questions" && (
              <QuestionView
                question={question}
                number={index + 1}
                value={answers[question.id] ?? null}
                onChange={(value) => setAnswer(question.id, value)}
                onSubmit={() => goNext(index)}
                error={errors[question.id]}
                isLast={index === questions.length - 1}
                submitting={submitting}
              />
            )}
            {stage === "done" && <ThankYouScreen thankYou={form.thank_you} />}
          </div>
        </motion.section>
      </AnimatePresence>

      {stage === "questions" && (
        <div className="absolute bottom-4 right-4 z-10">
          <NavArrows
            onPrev={goPrev}
            onNext={() => goNext(index)}
            canPrev={index > 0}
            canNext={!submitting}
          />
        </div>
      )}
    </div>
  );
}
