import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
}

export function BottomSheet({ open, onClose, title, children, ariaLabel }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      (focusable ?? panel).focus({ preventScroll: true });
    }
    return () => {
      const prev = lastFocusRef.current;
      lastFocusRef.current = null;
      if (prev && typeof prev.focus === "function") {
        prev.focus({ preventScroll: true });
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="bottom-sheet-root" role="presentation">
      <div
        className="bottom-sheet-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="bottom-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : ariaLabel}
        tabIndex={-1}
      >
        <div className="bottom-sheet-handle" aria-hidden />
        {title !== undefined && (
          <div className="bottom-sheet-header">
            <div className="bottom-sheet-title">{title}</div>
            <button
              type="button"
              className="bottom-sheet-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>
  );
}
