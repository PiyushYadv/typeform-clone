import { Suspense } from "react";
import { PublicFormPage } from "@/components/respondent/PublicFormPage";

type Params = Promise<{ slug: string }>;

/** Public, shareable link: /to/<slug>. No login needed. */
export default function Page({ params }: { params: Params }) {
  // The slug is only known per request, so it renders inside a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <FormForSlug params={params} />
    </Suspense>
  );
}

async function FormForSlug({ params }: { params: Params }) {
  const { slug } = await params;
  return <PublicFormPage slug={slug} />;
}
