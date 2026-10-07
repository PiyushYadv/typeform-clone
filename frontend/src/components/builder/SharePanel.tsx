"use client";

import { Copy, ExternalLink, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { publicLink } from "@/lib/api";
import type { FormMeta } from "./draft";

interface Props {
  meta: FormMeta;
  onSetPublished: (publish: boolean) => Promise<void>;
}

/** Link, copy and publish controls. Used in the Share tab and the publish dialog. */
export function SharePanel({ meta, onSetPublished }: Props) {
  const [busy, setBusy] = useState(false);
  const published = meta.status === "published";
  const link = publicLink(meta.slug);

  const toggle = async () => {
    setBusy(true);
    try {
      await onSetPublished(!published);
      toast.success(published ? "Unpublished. The link no longer works." : "Published");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="flex items-center gap-2 text-black/70">
        <Globe size={16} aria-hidden />
        {published ? "Anyone with this link can fill in your form." : "Publish your form to get a link you can share."}
      </p>

      <div className="mt-3 flex gap-2">
        <input className="app-input font-mono text-[13px]" value={link} readOnly aria-label="Form link" disabled={!published} />
        <button
          type="button"
          className="btn btn-primary"
          disabled={!published}
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            toast.success("Link copied");
          }}
        >
          <Copy size={15} /> Copy
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {published ? (
          <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 underline-offset-4 hover:underline">
            <ExternalLink size={15} /> Open form
          </a>
        ) : (
          <span />
        )}
        <button type="button" className={published ? "btn btn-ghost text-[#C42525]" : "btn btn-primary"} onClick={toggle} disabled={busy}>
          {published ? "Unpublish" : "Publish"}
        </button>
      </div>
    </div>
  );
}
