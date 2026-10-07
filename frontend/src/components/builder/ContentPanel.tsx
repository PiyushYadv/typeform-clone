"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Flag, GripVertical, Plus } from "lucide-react";
import { QuestionBadge } from "../ui/QuestionBadge";
import { ENDING, type DraftQuestion } from "./draft";

interface Props {
  questions: DraftQuestion[];
  selected: string;
  onSelect: (key: string) => void;
  onMove: (fromKey: string, toKey: string) => void;
  onAdd: () => void;
}

function SortableRow({
  question,
  number,
  active,
  onSelect,
}: {
  question: DraftQuestion;
  number: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.key,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative ${isDragging ? "z-10" : ""}`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className={`flex w-full items-center gap-2 rounded-md py-2 pr-2 pl-6 text-left ${
          active ? "bg-black/[0.06]" : "hover:bg-black/[0.03]"
        } ${isDragging ? "bg-white shadow-lg" : ""}`}
        {...attributes}
        {...listeners}
        aria-roledescription="Draggable question"
      >
        <GripVertical
          size={14}
          aria-hidden
          className="absolute left-1.5 text-black/30 opacity-0 group-hover:opacity-100"
        />
        <QuestionBadge type={question.type} number={number} />
        <span className={`truncate ${question.title ? "" : "text-black/40"}`}>
          {question.title || "Untitled question"}
        </span>
      </button>
    </li>
  );
}

/** Left panel: question list (drag to reorder) and the thank-you ending. */
export function ContentPanel({ questions, selected, onSelect, onMove, onAdd }: Props) {
  const sensors = useSensors(
    // A small distance lets a plain click select the row instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-black/10 bg-white">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="font-medium">Content</h2>
        <button type="button" className="icon-btn" aria-label="Add question" title="Add question" onClick={onAdd}>
          <Plus size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={questions.map((q) => q.key)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-0.5">
              {questions.map((q, i) => (
                <SortableRow
                  key={q.key}
                  question={q}
                  number={i + 1}
                  active={selected === q.key}
                  onSelect={() => onSelect(q.key)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>

        <button type="button" className="btn btn-ghost mt-2 w-full justify-start text-black/60" onClick={onAdd}>
          <Plus size={16} /> Add question
        </button>

        <h3 className="mt-5 px-2 pb-1 text-xs font-medium text-black/50">Endings</h3>
        <button
          type="button"
          onClick={() => onSelect(ENDING)}
          aria-current={selected === ENDING ? "true" : undefined}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left ${
            selected === ENDING ? "bg-black/[0.06]" : "hover:bg-black/[0.03]"
          }`}
        >
          <span className="inline-flex h-6 w-7 items-center justify-center rounded bg-[#E4E4E1]">
            <Flag size={13} aria-hidden />
          </span>
          Thank you screen
        </button>
      </div>
    </aside>
  );
}
