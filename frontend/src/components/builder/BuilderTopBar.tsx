"use client";

import { Check, CloudOff, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import type { FormMeta } from "./draft";
import type { SaveState } from "./useFormEditor";

export type BuilderTab = "create" | "workflow" | "connect" | "share";

const TABS: { id: BuilderTab | "results"; label: string }[] = [
  { id: "create", label: "Create" },
  { id: "workflow", label: "Workflow" },
  { id: "connect", label: "Connect" },
  { id: "share", label: "Share" },
  { id: "results", label: "Results" },
];

interface Props {
  meta: FormMeta;
  tab: BuilderTab;
  onTab: (tab: BuilderTab) => void;
  saveState: SaveState;
  onRetrySave: () => void;
  onRename: (title: string) => void;
  onPreview: () => void;
  canPreview: boolean;
  onPublish: () => void;
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-black/50">
        <Loader2 size={12} className="animate-spin" /> Saving
      </span>
    );
  if (state === "error")
    return (
      <button type="button" onClick={onRetry} className="flex items-center gap-1 text-xs text-[#C42525] hover:underline">
        <CloudOff size={13} /> Not saved. Retry
      </button>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-black/50">
      <Check size={13} /> Saved
    </span>
  );
}

export function BuilderTopBar(props: Props) {
  const { meta, tab } = props;
  const published = meta.status === "published";

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-black/10 bg-white px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/forms" className="shrink-0 text-black/50 hover:text-black">
          My workspace
        </Link>
        <span className="text-black/30">/</span>
        <input
          className="min-w-0 max-w-64 flex-1 truncate rounded px-1.5 py-1 font-medium outline-none hover:bg-black/5 focus:bg-black/5"
          value={meta.title}
          aria-label="Form name"
          maxLength={255}
          onChange={(e) => props.onRename(e.target.value)}
          onBlur={(e) => !e.target.value.trim() && props.onRename("My new form")}
        />
        <SaveIndicator state={props.saveState} onRetry={props.onRetrySave} />
      </div>

      <nav aria-label="Form sections" className="flex h-14 items-stretch">
        {TABS.map(({ id, label }) =>
          id === "results" ? (
            <Link key={id} href={`/forms/${meta.id}/results`} className="flex items-center px-3 text-black/60 hover:text-black">
              {label}
            </Link>
          ) : (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => props.onTab(id)}
              className={`border-b-2 px-3 ${tab === id ? "border-[#262627] font-medium" : "border-transparent text-black/60 hover:text-black"}`}
            >
              {label}
            </button>
          ),
        )}
      </nav>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="icon-btn"
          aria-label="Preview form"
          title="Preview"
          onClick={props.onPreview}
          disabled={!props.canPreview}
        >
          <Eye size={18} />
        </button>
        <button type="button" className={published ? "btn btn-secondary" : "btn btn-primary"} onClick={props.onPublish}>
          {published ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[#2A9447]" aria-hidden /> Published
            </>
          ) : (
            "Publish"
          )}
        </button>
      </div>
    </header>
  );
}
