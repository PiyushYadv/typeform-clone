import { Suspense } from "react";
import { Results } from "@/components/results/Results";

type Params = Promise<{ id: string }>;

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <ResultsForId params={params} />
    </Suspense>
  );
}

async function ResultsForId({ params }: { params: Params }) {
  const { id } = await params;
  return <Results key={id} formId={Number(id)} />;
}
