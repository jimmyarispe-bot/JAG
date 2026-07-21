"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { crudBtn } from "@/components/platform/crud/button-styles";
import { LifecycleWarningIcon } from "./LifecycleWarningIcon";
import {
  DELETE_CONFIRMATION_TOKEN,
  canSubmitLifecycleDelete,
  lifecycleConfirmLabel,
  lifecycleModalBody,
  lifecycleModalTitle,
  type LifecycleConfirmAction,
} from "./lifecycle-copy";

export type { LifecycleConfirmAction };

export interface LifecycleConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  action: LifecycleConfirmAction;
  /** Singular display name, e.g. "Student", "Family" */
  entityLabel: string;
  title?: string;
  /** Override default body paragraphs */
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Archive / restore confirmation.
   * Delete uses `onConfirmDelete` instead.
   */
  onConfirm?: () => Promise<{ ok: boolean; error?: string }>;
  /** Permanent delete — receives checkbox + typed token. */
  onConfirmDelete?: (input: {
    confirmationText: string;
    acknowledged: boolean;
  }) => Promise<{ ok: boolean; error?: string; code?: string }>;
  /**
   * When false, backdrop clicks do not dismiss (default: false for archive/delete,
   * true for restore).
   */
  closeOnBackdrop?: boolean;
}

/**
 * Centered lifecycle confirmation modal (archive / restore / delete).
 * Presentation only — callers supply server actions.
 */
export function LifecycleConfirmationModal({
  open,
  onClose,
  action,
  entityLabel,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onConfirmDelete,
  closeOnBackdrop,
}: LifecycleConfirmationModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const allowBackdropClose =
    closeOnBackdrop ?? (action === "restore");

  const resolvedTitle = title ?? lifecycleModalTitle(action, entityLabel);
  const resolvedConfirm =
    confirmLabel ?? lifecycleConfirmLabel(action, entityLabel);
  const defaultBody = lifecycleModalBody(action, entityLabel);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      setError(null);
      setAcknowledged(false);
      setConfirmationText("");
      return;
    }

    previousFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const enterId = requestAnimationFrame(() => setEntered(true));
    const focusId = window.setTimeout(() => cancelRef.current?.focus(), 0);

    return () => {
      cancelAnimationFrame(enterId);
      window.clearTimeout(focusId);
      document.body.style.overflow = prevOverflow;
      const restore = previousFocus.current;
      if (restore && document.contains(restore)) {
        restore.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const runConfirm = useCallback(() => {
    startTransition(async () => {
      setError(null);
      if (action === "delete") {
        if (!onConfirmDelete) return;
        const result = await onConfirmDelete({
          confirmationText,
          acknowledged,
        });
        if (!result.ok) {
          setError(result.error ?? "Unable to delete");
          return;
        }
        onClose();
        return;
      }
      if (!onConfirm) return;
      const result = await onConfirm();
      if (result && !result.ok) {
        setError(result.error ?? "Unable to complete action");
        return;
      }
      onClose();
    });
  }, [
    action,
    acknowledged,
    confirmationText,
    onClose,
    onConfirm,
    onConfirmDelete,
  ]);

  if (!open || !mounted) return null;

  const deleteReady = canSubmitLifecycleDelete(
    acknowledged,
    confirmationText,
    pending
  );
  const confirmDisabled =
    pending || (action === "delete" ? !deleteReady : false);

  const confirmClass =
    action === "delete" ? crudBtn.dangerSolid : crudBtn.primary;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-[180ms] ease-out motion-reduce:transition-none ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
        onClick={allowBackdropClose ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative z-10 w-full max-w-[560px] max-h-[min(90vh,calc(100vh-2rem))] overflow-y-auto rounded-[16px] border border-slate-200 bg-white p-6 shadow-xl transition-[opacity,transform] duration-[180ms] ease-out motion-reduce:transition-none motion-reduce:transform-none ${
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-1 scale-95 opacity-0"
        }`}
      >
        {action === "delete" ? (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <LifecycleWarningIcon className="h-7 w-7" />
          </div>
        ) : null}

        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {resolvedTitle}
        </h2>

        <div id={descriptionId} className="mt-3 space-y-2 text-sm text-slate-600">
          {body ??
            defaultBody.map((paragraph) => (
              <p
                key={paragraph}
                className={
                  action === "delete" && paragraph === "This cannot be undone."
                    ? "font-medium text-rose-700"
                    : undefined
                }
              >
                {paragraph}
              </p>
            ))}
        </div>

        {action === "delete" ? (
          <div className="mt-5 space-y-4">
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>I understand this action cannot be undone.</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">
                Type{" "}
                <span className="font-mono font-semibold">
                  {DELETE_CONFIRMATION_TOKEN}
                </span>
              </span>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                autoComplete="off"
                placeholder={DELETE_CONFIRMATION_TOKEN}
                aria-label={`Type ${DELETE_CONFIRMATION_TOKEN} to confirm`}
              />
            </label>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className={crudBtn.secondary}
            onClick={onClose}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClass}
            disabled={confirmDisabled}
            onClick={runConfirm}
          >
            {pending ? "Working…" : resolvedConfirm}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
