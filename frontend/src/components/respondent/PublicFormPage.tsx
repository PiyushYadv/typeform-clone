"use client";

import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";
import { themeStyle } from "@/lib/theme";
import type { PublicForm } from "@/lib/types";
import { FormRunner } from "./FormRunner";
import { ClosedScreen, LoadingScreen } from "./Screens";

type State = { status: "loading" } | { status: "ready"; form: PublicForm } | { status: "closed" };

export function PublicFormPage({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    publicApi
      .getForm(slug)
      .then((form) => {
        document.title = form.title;
        setState(form.questions.length ? { status: "ready", form } : { status: "closed" });
      })
      .catch(() => setState({ status: "closed" }));
  }, [slug]);

  if (state.status === "ready") return <FormRunner form={state.form} />;

  return (
    <div className="tf-root fixed inset-0 flex items-center justify-center px-6" style={themeStyle()}>
      {state.status === "loading" ? <LoadingScreen /> : <ClosedScreen />}
    </div>
  );
}
