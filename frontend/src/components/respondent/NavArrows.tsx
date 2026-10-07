import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

/** The joined up/down buttons in the bottom-right corner. */
export function NavArrows({ onPrev, onNext, canPrev, canNext }: Props) {
  return (
    <div className="tf-nav">
      <button type="button" onClick={onPrev} disabled={!canPrev} aria-label="Previous question">
        <ChevronUp size={20} aria-hidden />
      </button>
      <button type="button" onClick={onNext} disabled={!canNext} aria-label="Next question">
        <ChevronDown size={20} aria-hidden />
      </button>
    </div>
  );
}
