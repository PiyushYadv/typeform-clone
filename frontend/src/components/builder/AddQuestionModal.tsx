"use client";

import { CreditCard, Upload } from "lucide-react";
import { QUESTION_TYPES, TYPE_ORDER } from "@/lib/questionTypes";
import type { QuestionType } from "@/lib/types";
import { Modal } from "../ui/Modal";

const GROUPS = ["Contact info", "Text", "Choice", "Rating", "Other"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (type: QuestionType) => void;
}

export function AddQuestionModal({ open, onClose, onPick }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add a question" width={640}>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group}>
            <h3 className="mb-1.5 text-xs font-medium text-black/50">{group}</h3>
            <ul>
              {TYPE_ORDER.filter((t) => QUESTION_TYPES[t].group === group).map((type) => {
                const { label, icon: Icon, color } = QUESTION_TYPES[type];
                return (
                  <li key={type}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-black/5"
                      onClick={() => {
                        onPick(type);
                        onClose();
                      }}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded" style={{ background: color }}>
                        <Icon size={15} aria-hidden />
                      </span>
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section>
          <h3 className="mb-1.5 text-xs font-medium text-black/50">Coming soon</h3>
          <ul>
            {[
              { label: "File upload", icon: Upload },
              { label: "Payment", icon: CreditCard },
            ].map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3 px-2 py-1.5 text-black/40">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-black/5">
                  <Icon size={15} aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
