import { Suspense } from "react";
import { Builder } from "@/components/builder/Builder";

type Params = Promise<{ id: string }>;

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <BuilderForId params={params} />
    </Suspense>
  );
}

async function BuilderForId({ params }: { params: Params }) {
  const { id } = await params;
  // key resets editor state when switching between forms
  return <Builder key={id} formId={Number(id)} />;
}
