import { useIsPresent } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Listens for single-key shortcuts (A/B/C, Y/N, 1–5) while this question is on screen.
 * Ignores keys typed into text fields, and stays silent while the question is
 * animating out (AnimatePresence keeps it mounted for a moment).
 */
export function useShortcutKeys(onKey: (key: string) => boolean, enabled: boolean) {
  const isPresent = useIsPresent();
  const handler = useRef(onKey);
  useEffect(() => {
    handler.current = onKey;
  });

  useEffect(() => {
    if (!enabled || !isPresent) return;
    const listener = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (handler.current(e.key.toUpperCase())) e.preventDefault();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled, isPresent]);
}

/** Selection blinks, then the form moves on, the way Typeform does it. */
export const AUTO_ADVANCE_MS = 600;
