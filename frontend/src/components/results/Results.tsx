"use client";

import { Download, Inbox, Link as LinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formsApi, publicLink, resultsApi } from "@/lib/api";
import type { FormDetail, FormSummary, ResponseRecord } from "@/lib/types";
import { Insights } from "./Insights";
import { ResponseDrawer } from "./ResponseDrawer";
import { ResponsesTable } from "./ResponsesTable";
import { SummaryCard } from "./SummaryCard";

type Tab = "summary" | "responses";

interface Data {
  form: FormDetail;
  responses: ResponseRecord[];
  summary: FormSummary;
}

function Header({ form, hasResponses }: { form: FormDetail; hasResponses: boolean }) {
  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-black/10 bg-white px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/forms" className="shrink-0 text-black/50 hover:text-black">
          My workspace
        </Link>
        <span className="text-black/30">/</span>
        <span className="truncate font-medium">{form.title}</span>
      </div>
      <nav aria-label="Form sections" className="flex h-14 items-stretch">
        <Link href={`/forms/${form.id}/create`} className="flex items-center px-3 text-black/60 hover:text-black">
          Create
        </Link>
        <span aria-current="page" className="flex items-center border-b-2 border-[#262627] px-3 font-medium">
          Results
        </span>
      </nav>
      <div className="flex justify-end">
        {hasResponses ? (
          <a href={resultsApi.csvUrl(form.id)} download className="btn btn-secondary">
            <Download size={15} /> Download CSV
          </a>
        ) : (
          <button type="button" className="btn btn-secondary" disabled title="Nothing to download yet">
            <Download size={15} /> Download CSV
          </button>
        )}
      </div>
    </header>
  );
}

function NoResponses({ form }: { form: FormDetail }) {
  const published = form.status === "published";
  return (
    <div className="rounded-lg bg-white px-6 py-14 text-center shadow-sm">
      <Inbox className="mx-auto text-black/30" size={32} aria-hidden />
      <p className="mt-3 text-lg font-medium">No responses yet</p>
      <p className="mt-1 text-black/60">
        {published ? "Share your form's link to start collecting answers." : "Publish your form to start collecting answers."}
      </p>
      {published ? (
        <button
          type="button"
          className="btn btn-primary mt-5"
          onClick={async () => {
            await navigator.clipboard.writeText(publicLink(form.slug));
            toast.success("Link copied");
          }}
        >
          <LinkIcon size={15} /> Copy link
        </button>
      ) : (
        <Link href={`/forms/${form.id}/create`} className="btn btn-primary mt-5">
          Go to the builder
        </Link>
      )}
    </div>
  );
}

export function Results({ formId }: { formId: number }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([formsApi.get(formId), resultsApi.responses(formId), resultsApi.summary(formId)])
      .then(([form, responses, summary]) => setData({ form, responses, summary }))
      .catch((e: Error) => setError(e.message));
  }, [formId]);

  const total = data?.responses.length ?? 0;
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? i : Math.max(0, i - 1))), []);
  const next = useCallback(() => setOpenIndex((i) => (i === null ? i : Math.min(total - 1, i + 1))), [total]);
  const close = useCallback(() => setOpenIndex(null), []);

  if (error) {
    return (
      <div className="app-ui flex h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">We couldn&apos;t load these results</p>
        <p className="text-black/60">{error}</p>
        <Link href="/forms" className="btn btn-primary mt-2">
          Back to my workspace
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-ui flex h-dvh items-center justify-center">
        <Loader2 className="animate-spin text-black/40" aria-label="Loading results" />
      </div>
    );
  }

  const { form, responses, summary } = data;

  return (
    <div className="app-ui flex h-dvh flex-col bg-[#F7F7F6]">
      <Header form={form} hasResponses={total > 0} />

      <div className="border-b border-black/10 bg-white px-4 md:px-8">
        <div role="tablist" aria-label="Results views" className="mx-auto flex max-w-5xl gap-1">
          {(["summary", "responses"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-3 py-3 ${tab === t ? "border-[#262627] font-medium" : "border-transparent text-black/60 hover:text-black"}`}
            >
              {t === "summary" ? "Summary" : `Responses (${total})`}
            </button>
          ))}
        </div>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {tab === "summary" && (
            <>
              <Insights summary={summary} responses={responses} />
              {total === 0 ? (
                <NoResponses form={form} />
              ) : (
                summary.questions.map((q, i) => (
                  <SummaryCard
                    key={q.question_id}
                    summary={q}
                    number={i + 1}
                    total={summary.total_responses}
                    onSeeAll={() => setTab("responses")}
                  />
                ))
              )}
            </>
          )}

          {tab === "responses" &&
            (total === 0 ? (
              <NoResponses form={form} />
            ) : (
              <ResponsesTable questions={form.questions} responses={responses} onOpen={setOpenIndex} />
            ))}
        </div>
      </main>

      {openIndex !== null && responses[openIndex] && (
        <ResponseDrawer
          response={responses[openIndex]}
          questions={form.questions}
          position={openIndex}
          total={total}
          onPrev={prev}
          onNext={next}
          onClose={close}
        />
      )}
    </div>
  );
}
