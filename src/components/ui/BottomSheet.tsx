import type { ReactNode } from "react";
import type { AnimationEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
  showHandle?: boolean;
  backdropClassName?: string;
  centerOnDesktop?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  ariaLabel,
  showHandle = true,
  backdropClassName,
  centerOnDesktop = false,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIsExiting(false);
    } else if (shouldRender) {
      setIsExiting(true);
    }
  }, [open, shouldRender]);

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
    if (!shouldRender) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shouldRender]);

  const handlePanelAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!isExiting) return;
    setShouldRender(false);
    setIsExiting(false);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={[
        "bottom-sheet-root",
        centerOnDesktop ? "bottom-sheet-root--center-dialog" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="presentation"
    >
      <div
        className={["bottom-sheet-backdrop", backdropClassName ?? "", isExiting ? "bottom-sheet-backdrop--exiting" : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className={["bottom-sheet-panel", isExiting ? "bottom-sheet-panel--exiting" : ""]
          .filter(Boolean)
          .join(" ")}
        onAnimationEnd={handlePanelAnimationEnd}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : ariaLabel}
        tabIndex={-1}
      >
        {showHandle && <div className="bottom-sheet-handle" aria-hidden />}
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
