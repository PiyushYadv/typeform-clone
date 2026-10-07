"use client";

import { BarChart3, Copy, Ellipsis, Link as LinkIcon, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { plural, timeAgo } from "@/lib/format";
import type { FormListItem } from "@/lib/types";
import { Menu } from "../ui/Menu";

// A stable tile color per form, so each one is recognisable in the list.
const TILE_COLORS = ["#DCD0F2", "#C6DDF4", "#C9E7D0", "#F7DDB5", "#F5C9D6"];

interface Props {
  form: FormListItem;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}

export function FormRow({ form, onRename, onDuplicate, onDelete, onCopyLink }: Props) {
  const router = useRouter();
  const published = form.status === "published";
  const open = () => router.push(`/forms/${form.id}/create`);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 border-b border-black/5 px-4 py-3 hover:bg-black/[0.02] md:grid-cols-[minmax(0,1fr)_110px_110px_120px_40px]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
          style={{ background: TILE_COLORS[form.id % TILE_COLORS.length] }}
        >
          {form.title.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{form.title}</p>
          <p className="text-xs text-black/50">{plural(form.question_count, "question")}</p>
        </div>
      </div>

      <span className="hidden md:block">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            published ? "bg-[#E3F4E7] text-[#1E6B34]" : "bg-black/5 text-black/60"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-[#2A9447]" : "bg-black/40"}`} />
          {published ? "Published" : "Draft"}
        </span>
      </span>

      <button
        type="button"
        className="hidden text-left hover:underline md:block"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/forms/${form.id}/results`);
        }}
      >
        {form.response_count === 0 ? <span className="text-black/40">No responses</span> : plural(form.response_count, "response")}
      </button>

      <span className="hidden text-black/60 md:block">{timeAgo(form.updated_at)}</span>

      <Menu
        label={`Actions for ${form.title}`}
        triggerClassName="icon-btn"
        trigger={<Ellipsis size={18} />}
        items={[
          { label: "Edit", icon: Pencil, onSelect: open },
          { label: "View results", icon: BarChart3, onSelect: () => router.push(`/forms/${form.id}/results`) },
          { label: "Copy link", icon: LinkIcon, onSelect: onCopyLink, disabled: !published },
          { label: "Rename", icon: Pencil, onSelect: onRename },
          { label: "Duplicate", icon: Copy, onSelect: onDuplicate },
          { label: "Delete", icon: Trash2, onSelect: onDelete, danger: true },
        ]}
      />
    </div>
  );
}
