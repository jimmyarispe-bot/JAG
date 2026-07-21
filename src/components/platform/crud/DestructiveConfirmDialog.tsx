"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useFocusTrap } from "@/components/experience-system/interaction";
import {
  DELETE_CONFIRMATION_TOKEN,
  type DeleteContext,
  type DependencyReport,
} from "@/lib/platform/crud";
import { crudBtn } from "./button-styles";

export interface DestructiveConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** Load delete context (name, id, deps) */
  loadContext: () => Promise<
    | { ok: true; context: DeleteContext }
    | { ok: false; error: string }
  >;
  onClose: () => void;
  onConfirmDelete: (input: {
    confirmationText: string;
    acknowledged: boolean;
  }) => Promise<{ ok: boolean; error?: string; code?: string }>;
  /** When deps block delete */
  onArchiveInstead?: () => Promise<{ ok: boolean; error?: string }>;
  archiveLabel?: string;
  deleteLabel?: string;
  entityLabel?: string;
}

/**
 * AcademyOS destructive confirmation:
 * shows Name / ID / Dependencies / Impact,
 * requires checkbox + typing DELETE,
 * blocks when dependencies exist and offers Archive.
 */
export function DestructiveConfirmDialog({
  open,
  title,
  description = "You are about to permanently delete this record.",
  loadContext,
  onClose,
  onConfirmDelete,
  onArchiveInstead,
  archiveLabel = "Archive instead",
  deleteLabel = "Delete permanently",
  entityLabel = "Record",
}: DestructiveConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, dialogRef);
  const titleId = useId();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [context, setContext] = useState<DeleteContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLoadError(null);
    setAcknowledged(false);
    setConfirmationText("");
    setContext(null);
    (async () => {
      const result = await loadContext();
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error);
        setLoading(false);
        return;
      }
      setContext(result.context);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loadContext]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const deps: DependencyReport | null = context?.dependencies ?? null;
  const blocked = Boolean(deps && (!deps.canDelete || deps.blocking.length > 0));
  const canSubmit =
    acknowledged && confirmationText === DELETE_CONFIRMATION_TOKEN && !pending && !blocked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <p className="mt-1 text-sm font-medium text-rose-700">This action cannot be undone.</p>

        {loading ? <p className="mt-4 text-sm text-slate-500">Loading details…</p> : null}
        {loadError ? <p className="mt-4 text-sm text-rose-700">{loadError}</p> : null}

        {context ? (
          <div className="mt-4 space-y-3">
            <dl className="grid gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{entityLabel}</dt>
                <dd className="font-medium text-slate-900">{context.displayName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">ID</dt>
                <dd className="font-mono text-xs font-medium text-slate-900">
                  {context.entityId}
                </dd>
              </div>
              {context.fields.map((f) => (
                <div key={f.label} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{f.label}</dt>
                  <dd className="font-medium text-slate-900">{f.value}</dd>
                </div>
              ))}
            </dl>

            {context.notices?.map((n) => (
              <div
                key={n.title}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  n.tone === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="mt-1">{n.body}</p>
              </div>
            ))}

            {blocked ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                <p className="font-medium">Related records prevent permanent deletion.</p>
                <p className="mt-1">Archive this {entityLabel.toLowerCase()} instead.</p>
                {deps && deps.blocking.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5">
                    {deps.blocking.map((d) => (
                      <li key={d.key}>
                        {d.label} ({d.count})
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  <span>I understand this cannot be undone.</span>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-600">
                    Type{" "}
                    <span className="font-mono font-semibold">{DELETE_CONFIRMATION_TOKEN}</span>{" "}
                    to continue.
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
              </>
            )}

            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={crudBtn.secondary} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          {blocked && onArchiveInstead ? (
            <button
              type="button"
              disabled={pending}
              className={crudBtn.primary}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await onArchiveInstead();
                  if (!result.ok) {
                    setError(result.error ?? "Unable to archive");
                    return;
                  }
                  onClose();
                })
              }
            >
              {archiveLabel}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit || loading || !context}
              className={crudBtn.dangerSolid}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await onConfirmDelete({
                    confirmationText,
                    acknowledged,
                  });
                  if (!result.ok) {
                    setError(result.error ?? "Unable to delete");
                    return;
                  }
                  onClose();
                })
              }
            >
              {deleteLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
