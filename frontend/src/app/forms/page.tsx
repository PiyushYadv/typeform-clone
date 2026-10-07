"use client";

import { FolderOpen, Loader2, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/workspace/AppHeader";
import { FormRow } from "@/components/workspace/FormRow";
import { Modal } from "@/components/ui/Modal";
import { formsApi, publicLink } from "@/lib/api";
import type { FormListItem } from "@/lib/types";

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<FormListItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deleting, setDeleting] = useState<FormListItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    formsApi
      .list()
      .then((list) => {
        setForms(list);
        setLoadError(null);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  useEffect(load, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const form = await formsApi.create();
      router.push(`/forms/${form.id}/create`);
    } catch (e) {
      toast.error((e as Error).message);
      setCreating(false);
    }
  };

  const duplicate = async (form: FormListItem) => {
    try {
      await formsApi.duplicate(form.id);
      toast.success(`Duplicated "${form.title}"`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const rename = async () => {
    if (!renaming || !newTitle.trim()) return;
    setBusy(true);
    try {
      await formsApi.update(renaming.id, { title: newTitle.trim() });
      toast.success("Form renamed");
      setRenaming(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await formsApi.remove(deleting.id);
      toast.success(`Deleted "${deleting.title}"`);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (form: FormListItem) => {
    await navigator.clipboard.writeText(publicLink(form.slug));
    toast.success("Link copied");
  };

  return (
    <div className="app-ui flex h-dvh flex-col bg-[#F7F7F6]">
      <AppHeader />
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Workspaces" className="hidden w-60 shrink-0 border-r border-black/10 bg-white p-3 md:block">
          <p className="px-2 pb-2 text-xs font-medium text-black/50">Workspaces</p>
          <a
            href="#"
            aria-current="page"
            className="flex items-center justify-between rounded-md bg-black/5 px-2 py-1.5 font-medium"
          >
            <span className="flex items-center gap-2">
              <FolderOpen size={16} aria-hidden /> My workspace
            </span>
            <span className="text-xs text-black/50">{forms?.length ?? ""}</span>
          </a>
          <div className="mt-1 flex items-center justify-between rounded-md px-2 py-1.5 text-black/40">
            <span className="flex items-center gap-2">
              <Users size={16} aria-hidden /> Shared with me
            </span>
            <span className="rounded bg-black/5 px-1.5 py-0.5 text-[11px]">Soon</span>
          </div>
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h1 className="text-2xl font-medium">My workspace</h1>
              <button type="button" className="btn btn-primary" onClick={create} disabled={creating}>
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create form
              </button>
            </div>

            {loadError && (
              <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                <p className="font-medium">Couldn&apos;t load your forms</p>
                <p className="mt-1 text-black/60">{loadError}</p>
                <button type="button" className="btn btn-secondary mt-4" onClick={load}>
                  Try again
                </button>
              </div>
            )}

            {!loadError && forms === null && (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-black/40" aria-label="Loading forms" />
              </div>
            )}

            {forms?.length === 0 && (
              <div className="rounded-lg bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-medium">Create your first form</p>
                <p className="mt-1 text-black/60">Ask one question at a time and get more answers.</p>
                <button type="button" className="btn btn-primary mt-5" onClick={create}>
                  <Plus size={16} /> Create form
                </button>
              </div>
            )}

            {forms && forms.length > 0 && (
              <div className="rounded-lg bg-white shadow-sm">
                <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_120px_40px] gap-4 border-b border-black/10 px-4 py-2.5 text-xs font-medium text-black/50 md:grid">
                  <span>Name</span>
                  <span>Status</span>
                  <span>Responses</span>
                  <span>Updated</span>
                  <span />
                </div>
                {forms.map((form) => (
                  <FormRow
                    key={form.id}
                    form={form}
                    onRename={() => {
                      setRenaming(form);
                      setNewTitle(form.title);
                    }}
                    onDuplicate={() => duplicate(form)}
                    onDelete={() => setDeleting(form)}
                    onCopyLink={() => copyLink(form)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal open={renaming !== null} onClose={() => setRenaming(null)} title="Rename form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void rename();
          }}
        >
          <label htmlFor="rename-input" className="mb-1.5 block text-sm text-black/60">
            Form name
          </label>
          <input
            id="rename-input"
            className="app-input"
            value={newTitle}
            autoFocus
            maxLength={255}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setRenaming(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy || !newTitle.trim()}>
              Rename
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete this form?">
        <p className="text-black/70">
          &ldquo;{deleting?.title}&rdquo; and its {deleting?.response_count ?? 0} responses will be deleted
          permanently. Anyone with the link will see that the form is closed.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleting(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
            Delete form
          </button>
        </div>
      </Modal>
    </div>
  );
}
