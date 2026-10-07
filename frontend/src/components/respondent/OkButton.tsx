import { Check, Loader2 } from "lucide-react";

interface Props {
  label: string;
  onClick: () => void;
  loading?: boolean;
  showCheck?: boolean;
  disabled?: boolean;
}

/** The OK / Submit button with Typeform's "press Enter ↵" hint beside it. */
export function OkButton({ label, onClick, loading, showCheck, disabled }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" className="tf-button" onClick={onClick} disabled={disabled || loading}>
        {label}
        {loading ? (
          <Loader2 size={18} className="animate-spin" aria-hidden />
        ) : (
          showCheck && <Check size={18} strokeWidth={3} aria-hidden />
        )}
      </button>
      <span className="tf-enter-hint">
        press <strong>Enter ↵</strong>
      </span>
    </div>
  );
}
