"use client";

import { useEffect, useId, useRef } from "react";

export type ListeningPublishSummary = {
  readonly questionCount: number;
  readonly sectionCount: number;
  readonly estimatedMinutes: number;
  readonly campaigns: readonly { id: string; title: string; status: string }[];
};

export function ListeningPublishDialog({
  open,
  pending,
  summary,
  onCancel,
  onConfirm,
}: {
  readonly open: boolean;
  readonly pending: boolean;
  readonly summary: ListeningPublishSummary;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="listening-publish-dialog"
        className="w-full max-w-md rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-5 shadow-lg outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-medium text-[var(--jag-text)]">
          Publish this version?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--jag-muted)]">
          Published versions become immutable. You will not be able to edit
          questions, options, or sections afterward. Create a new draft to make
          changes.
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--jag-muted)]">Questions</dt>
            <dd className="text-[var(--jag-text)]">{summary.questionCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Sections</dt>
            <dd className="text-[var(--jag-text)]">{summary.sectionCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Est. completion</dt>
            <dd className="text-[var(--jag-text)]">
              ~{summary.estimatedMinutes} min
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Campaigns</dt>
            <dd className="text-[var(--jag-text)]">
              {summary.campaigns.length}
            </dd>
          </div>
        </dl>

        {summary.campaigns.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-[var(--jag-muted)]">
            {summary.campaigns.map((c) => (
              <li key={c.id}>
                {c.title} · {c.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-[var(--jag-muted-2)]">
            No campaigns use this version yet. You can create one after publish.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || summary.questionCount === 0}
            data-testid="listening-publish-confirm"
            className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {pending ? "Publishing…" : "Publish version"}
          </button>
        </div>
      </div>
    </div>
  );
}
