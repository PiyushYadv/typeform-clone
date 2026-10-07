"use client";

import { Loader2, Plug, Share2, Workflow } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "../ui/Modal";
import { AddQuestionModal } from "./AddQuestionModal";
import { BuilderTopBar, type BuilderTab } from "./BuilderTopBar";
import { Canvas } from "./Canvas";
import { ComingSoon } from "./ComingSoon";
import { ContentPanel } from "./ContentPanel";
import { DesignMenu } from "./DesignMenu";
import { PreviewOverlay } from "./PreviewOverlay";
import { SettingsPanel } from "./SettingsPanel";
import { SharePanel } from "./SharePanel";
import { ENDING, toPreviewForm } from "./draft";
import { useFormEditor } from "./useFormEditor";

export function Builder({ formId }: { formId: number }) {
  const editor = useFormEditor(formId);
  const { meta, questions, selected } = editor;
  const [tab, setTab] = useState<BuilderTab>("create");
  const [adding, setAdding] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (editor.loadError) {
    return (
      <div className="app-ui flex h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">We couldn&apos;t open this form</p>
        <p className="text-black/60">{editor.loadError}</p>
        <Link href="/forms" className="btn btn-primary mt-2">
          Back to my workspace
        </Link>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="app-ui flex h-dvh items-center justify-center">
        <Loader2 className="animate-spin text-black/40" aria-label="Loading form" />
      </div>
    );
  }

  const index = questions.findIndex((q) => q.key === selected);
  const question = questions[index];
  const showEnding = selected === ENDING || !question;

  const publish = async () => {
    if (meta.status === "published") return setSharing(true);
    if (questions.length === 0) return toast.error("Add at least one question before publishing");
    try {
      await editor.setPublished(true);
      setSharing(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="app-ui flex h-dvh flex-col bg-[#F2F2F0]">
      <BuilderTopBar
        meta={meta}
        tab={tab}
        onTab={setTab}
        saveState={editor.saveState}
        onRetrySave={() => void editor.retrySave()}
        onRename={(title) => editor.updateMeta({ title })}
        onPreview={() => setPreviewing(true)}
        canPreview={questions.length > 0}
        onPublish={publish}
      />

      {tab === "create" && (
        <div className="flex min-h-0 flex-1">
          <ContentPanel
            questions={questions}
            selected={selected}
            onSelect={editor.setSelected}
            onMove={editor.moveQuestion}
            onAdd={() => setAdding(true)}
          />

          <main className="flex min-w-0 flex-1 flex-col items-center gap-3 overflow-y-auto p-4 md:p-6">
            <div className="flex w-full max-w-[1000px] items-center justify-between">
              <DesignMenu theme={meta.theme} onChange={(theme) => editor.updateMeta({ theme })} />
              <span className="text-xs text-black/50">Changes save automatically</span>
            </div>
            <Canvas
              question={showEnding ? undefined : question}
              index={index}
              isLast={index === questions.length - 1}
              showEnding={showEnding && questions.length > 0 ? true : selected === ENDING}
              theme={meta.theme}
              thankYou={meta.thank_you}
              onChangeQuestion={(patch) => question && editor.updateQuestion(question.key, patch)}
              onChangeThankYou={(thank_you) => editor.updateMeta({ thank_you })}
              onAddQuestion={() => setAdding(true)}
            />
          </main>

          <SettingsPanel
            question={showEnding ? undefined : question}
            showEnding={showEnding}
            onChange={(patch) => question && editor.updateQuestion(question.key, patch)}
            onChangeType={(type) => question && editor.setQuestionType(question.key, type)}
            onDuplicate={() => question && editor.duplicateQuestion(question.key)}
            onDelete={() => {
              if (!question) return;
              editor.deleteQuestion(question.key);
              toast("Question deleted");
            }}
          />
        </div>
      )}

      {tab === "workflow" && (
        <ComingSoon icon={Workflow} title="Logic jumps" text="Send people to different questions depending on how they answer." />
      )}
      {tab === "connect" && (
        <ComingSoon icon={Plug} title="Integrations" text="Send responses to Google Sheets, Slack, webhooks and more." />
      )}
      {tab === "share" && (
        <div className="flex flex-1 items-start justify-center p-8">
          <section className="w-full max-w-xl rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <Share2 size={18} aria-hidden /> Share your form
            </h2>
            <SharePanel meta={meta} onSetPublished={editor.setPublished} />
          </section>
        </div>
      )}

      <AddQuestionModal open={adding} onClose={() => setAdding(false)} onPick={editor.addQuestion} />

      <Modal open={sharing} onClose={() => setSharing(false)} title="Your form is live" width={520}>
        <SharePanel meta={meta} onSetPublished={editor.setPublished} />
      </Modal>

      {previewing && <PreviewOverlay form={toPreviewForm(meta, questions)} onClose={() => setPreviewing(false)} />}
    </div>
  );
}
