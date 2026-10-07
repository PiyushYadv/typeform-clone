"use client";

import { ChevronDown, Copy, GitBranch, Trash2 } from "lucide-react";
import { QUESTION_TYPES, TYPE_ORDER } from "@/lib/questionTypes";
import type { QuestionType } from "@/lib/types";
import { Menu } from "../ui/Menu";
import { QuestionBadge } from "../ui/QuestionBadge";
import { Toggle } from "../ui/Toggle";
import type { DraftQuestion } from "./draft";

interface Props {
  question?: DraftQuestion;
  showEnding: boolean;
  onChange: (patch: Partial<DraftQuestion>) => void;
  onChangeType: (type: QuestionType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="border-b border-black/5 py-3">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {children}
      </div>
      {hint && <p className="mt-1 text-xs text-black/50">{hint}</p>}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: unknown; onChange: (v: number | undefined) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-black/60">{label}</span>
      <input
        type="number"
        className="app-input"
        value={typeof value === "number" ? value : ""}
        placeholder="None"
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </label>
  );
}

/** Right panel: type, required and type-specific settings for the selected question. */
export function SettingsPanel({ question, showEnding, onChange, onChangeType, onDuplicate, onDelete }: Props) {
  if (showEnding || !question) {
    return (
      <aside className="hidden w-72 shrink-0 border-l border-black/10 bg-white p-4 lg:block">
        <h2 className="font-medium">Thank you screen</h2>
        <p className="mt-2 text-black/60">
          Shown after someone submits. Edit the heading and message right on the screen.
        </p>
      </aside>
    );
  }

  const setProperty = (key: string, value: unknown) => {
    const properties = { ...question.properties };
    if (value === undefined) delete properties[key];
    else properties[key] = value;
    onChange({ properties });
  };

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-black/10 bg-white px-4 pb-6 lg:block">
      <h2 className="pt-4 pb-2 font-medium">Question</h2>

      <Menu
        label="Change question type"
        align="left"
        triggerClassName="flex w-full items-center justify-between rounded-lg px-2 py-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] hover:bg-black/[0.03]"
        trigger={
          <>
            <span className="flex items-center gap-2">
              <QuestionBadge type={question.type} />
              {QUESTION_TYPES[question.type].label}
            </span>
            <ChevronDown size={16} aria-hidden />
          </>
        }
        items={TYPE_ORDER.map((type) => ({
          label: QUESTION_TYPES[type].label,
          icon: QUESTION_TYPES[type].icon,
          onSelect: () => onChangeType(type),
        }))}
      />

      <div className="mt-2">
        <Row label="Required" hint="Respondents can't skip this question.">
          <Toggle label="Required" checked={question.required} onChange={(required) => onChange({ required })} />
        </Row>

        {question.type === "rating" && (
          <Row label="Steps">
            <select
              className="app-input w-20"
              value={Number(question.properties.steps ?? 5)}
              onChange={(e) => setProperty("steps", Number(e.target.value))}
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Row>
        )}

        {question.type === "number" && (
          <div className="grid grid-cols-2 gap-3 border-b border-black/5 py-3">
            <NumberField label="Min number" value={question.properties.min} onChange={(v) => setProperty("min", v)} />
            <NumberField label="Max number" value={question.properties.max} onChange={(v) => setProperty("max", v)} />
          </div>
        )}

        {(question.type === "multiple_choice" || question.type === "dropdown") && (
          <p className="border-b border-black/5 py-3 text-xs text-black/50">
            Edit choices on the screen. Press Enter to add the next one.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-lg bg-black/[0.03] p-3">
        <p className="flex items-center gap-2 font-medium">
          <GitBranch size={15} aria-hidden /> Logic jumps
        </p>
        <p className="mt-1 text-xs text-black/50">Send people to different questions based on their answers. Coming soon.</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" className="btn btn-secondary flex-1" onClick={onDuplicate}>
          <Copy size={15} /> Duplicate
        </button>
        <button type="button" className="btn btn-secondary flex-1 text-[#C42525]" onClick={onDelete}>
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </aside>
  );
}
