"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { PublicForm } from "@/lib/types";
import { FormRunner } from "../respondent/FormRunner";

/** Full-screen run-through of the current draft. Nothing is submitted. */
export function PreviewOverlay({ form, onClose }: { form: PublicForm; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Form preview">
      <FormRunner form={form} preview />
      <div className="app-ui absolute top-3 right-3 z-20 flex items-center gap-2">
        <span className="rounded-full bg-[#262627] px-2.5 py-1 text-xs text-white">Preview: responses aren&apos;t saved</span>
        <button type="button" className="btn btn-secondary h-8" onClick={onClose}>
          <X size={15} /> Close
        </button>
      </div>
    </div>
  );
}
