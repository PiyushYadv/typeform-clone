"use client";

// State and autosave for the builder.
//
// Edits apply locally at once, then save after a short pause (debounce).
// Questions are saved as one ordered list via PUT /questions; the response
// gives new items their server ids, which are matched back by position.
// Only one save runs at a time; edits made during a save trigger another.

import { useCallback, useEffect, useRef, useState } from "react";
import { formsApi, type FormPatch } from "@/lib/api";
import type { QuestionType } from "@/lib/types";
import {
  ENDING,
  changeType,
  fromServer,
  newKey,
  newQuestion,
  savableOptions,
  toPayload,
  type DraftQuestion,
  type FormMeta,
} from "./draft";

export type SaveState = "saved" | "saving" | "error";

const SAVE_DELAY_MS = 700;

export function useFormEditor(formId: number) {
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [selected, setSelected] = useState<string>(ENDING);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");

  const latest = useRef(questions);
  useEffect(() => {
    latest.current = questions;
  }, [questions]);

  const questionsDirty = useRef(false);
  const metaPatch = useRef<FormPatch>({});
  const questionsTimer = useRef<number | undefined>(undefined);
  const metaTimer = useRef<number | undefined>(undefined);
  const saving = useRef<Promise<void> | null>(null);

  // ---------- Load ----------

  useEffect(() => {
    formsApi
      .get(formId)
      .then((form) => {
        const drafts = form.questions.map(fromServer);
        setMeta({
          id: form.id,
          title: form.title,
          slug: form.slug,
          status: form.status,
          theme: form.theme,
          thank_you: form.thank_you,
        });
        setQuestions(drafts);
        latest.current = drafts;
        setSelected(drafts[0]?.key ?? ENDING);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [formId]);

  // ---------- Saving ----------

  const isPending = () => questionsDirty.current || Object.keys(metaPatch.current).length > 0;

  const saveQuestions = useCallback(async () => {
    const snapshot = latest.current;
    const sentOptionKeys = snapshot.map((q) => savableOptions(q).map((o) => o.key));
    questionsDirty.current = false;

    const form = await formsApi.saveQuestions(formId, snapshot.map(toPayload));

    // Give newly created questions/options their server ids. The response lists
    // them in the order we sent them, so match by position in the snapshot.
    const sentIndex = new Map(snapshot.map((q, i) => [q.key, i]));
    setQuestions((current) =>
      current.map((q) => {
        const i = sentIndex.get(q.key);
        const saved = i === undefined ? undefined : form.questions[i];
        if (i === undefined || !saved) return q;
        return {
          ...q,
          id: saved.id,
          options: q.options.map((o) => {
            const j = sentOptionKeys[i].indexOf(o.key);
            return j >= 0 && saved.options[j] ? { ...o, id: saved.options[j].id } : o;
          }),
        };
      }),
    );
  }, [formId]);

  const saveMeta = useCallback(async () => {
    const patch = metaPatch.current;
    metaPatch.current = {};
    await formsApi.update(formId, patch);
  }, [formId]);

  /** Save everything pending now. Waits for any save already in flight. */
  const flush = useCallback(async (): Promise<boolean> => {
    window.clearTimeout(questionsTimer.current);
    window.clearTimeout(metaTimer.current);
    while (saving.current) await saving.current.catch(() => {});
    if (!isPending()) return true;

    setSaveState("saving");
    try {
      // Keep going until nothing is pending: edits can arrive mid-save.
      while (isPending()) {
        const run = (async () => {
          if (Object.keys(metaPatch.current).length) await saveMeta();
          if (questionsDirty.current) await saveQuestions();
        })();
        saving.current = run;
        await run;
        saving.current = null;
      }
      setSaveState("saved");
      return true;
    } catch {
      questionsDirty.current = true; // retry the full list next time
      setSaveState("error");
      return false;
    } finally {
      saving.current = null;
    }
  }, [saveMeta, saveQuestions]);

  const scheduleSave = useCallback(() => {
    setSaveState("saving");
    window.clearTimeout(questionsTimer.current);
    questionsTimer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS);
  }, [flush]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isPending() || saving.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ---------- Question edits ----------

  const editQuestions = useCallback(
    (update: (qs: DraftQuestion[]) => DraftQuestion[]) => {
      setQuestions((qs) => {
        const next = update(qs);
        latest.current = next;
        return next;
      });
      questionsDirty.current = true;
      scheduleSave();
    },
    [scheduleSave],
  );

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) =>
    editQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  const setQuestionType = (key: string, type: QuestionType) =>
    editQuestions((qs) => qs.map((q) => (q.key === key ? changeType(q, type) : q)));

  /** Adds a question after the selected one (or at the end). */
  const addQuestion = (type: QuestionType) => {
    const question = newQuestion(type);
    editQuestions((qs) => {
      const at = qs.findIndex((q) => q.key === selected);
      const insertAt = at === -1 ? qs.length : at + 1;
      return [...qs.slice(0, insertAt), question, ...qs.slice(insertAt)];
    });
    setSelected(question.key);
  };

  const duplicateQuestion = (key: string) => {
    const source = questions.find((q) => q.key === key);
    if (!source) return;
    const copy: DraftQuestion = {
      ...source,
      key: newKey(),
      id: undefined,
      options: source.options.map((o) => ({ key: newKey(), label: o.label })),
    };
    editQuestions((qs) => {
      const at = qs.findIndex((q) => q.key === key);
      return [...qs.slice(0, at + 1), copy, ...qs.slice(at + 1)];
    });
    setSelected(copy.key);
  };

  const deleteQuestion = (key: string) => {
    const at = questions.findIndex((q) => q.key === key);
    const remaining = questions.filter((q) => q.key !== key);
    editQuestions(() => remaining);
    setSelected(remaining[Math.min(at, remaining.length - 1)]?.key ?? ENDING);
  };

  const moveQuestion = (fromKey: string, toKey: string) =>
    editQuestions((qs) => {
      const from = qs.findIndex((q) => q.key === fromKey);
      const to = qs.findIndex((q) => q.key === toKey);
      if (from < 0 || to < 0) return qs;
      const next = [...qs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // ---------- Form-level edits (title, theme, thank-you) ----------

  const updateMeta = (patch: FormPatch) => {
    setMeta((m) => (m ? { ...m, ...patch } : m));
    metaPatch.current = { ...metaPatch.current, ...patch };
    setSaveState("saving");
    window.clearTimeout(metaTimer.current);
    metaTimer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS);
  };

  // ---------- Publishing ----------

  const setPublished = async (publish: boolean) => {
    const saved = await flush();
    if (!saved) throw new Error("Couldn't save your latest changes. Try again.");
    const form = publish ? await formsApi.publish(formId) : await formsApi.unpublish(formId);
    setMeta((m) => (m ? { ...m, status: form.status } : m));
  };

  return {
    meta,
    questions,
    selected,
    setSelected,
    loadError,
    saveState,
    retrySave: flush,
    updateQuestion,
    setQuestionType,
    addQuestion,
    duplicateQuestion,
    deleteQuestion,
    moveQuestion,
    updateMeta,
    setPublished,
  };
}

export type FormEditor = ReturnType<typeof useFormEditor>;
