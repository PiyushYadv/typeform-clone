import { Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ThankYou } from "@/lib/types";
import { OkButton } from "./OkButton";

export function WelcomeScreen({ title, questionCount, onStart }: { title: string; questionCount: number; onStart: () => void }) {
  const minutes = Math.max(1, Math.round((questionCount * 12) / 60));
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]">{title}</h1>
      <div className="mt-8 flex flex-col items-center gap-3">
        <OkButton label="Start" onClick={onStart} />
        <p className="tf-enter-hint flex items-center gap-1.5">
          <Clock size={14} aria-hidden />
          Takes {minutes} minute{minutes === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

export function ThankYouScreen({ thankYou }: { thankYou: ThankYou }) {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]">
        {thankYou.title || "Thanks for completing this form"}
      </h1>
      <p className="tf-question-desc max-w-lg">
        {thankYou.description || "Now create your own. It's free, easy and beautiful."}
      </p>
      <Link href="/" className="tf-button mt-8 no-underline">
        Create your own form
      </Link>
    </div>
  );
}

export function ClosedScreen() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-[28px] leading-9">This form is now closed</h1>
      <p className="tf-question-desc">It isn&apos;t accepting responses at the moment.</p>
      <Link href="/" className="tf-button mt-8 no-underline">
        Create your own form
      </Link>
    </div>
  );
}

export function LoadingScreen() {
  return <Loader2 size={36} className="animate-spin text-[var(--tf-answer)]" aria-label="Loading form" />;
}
