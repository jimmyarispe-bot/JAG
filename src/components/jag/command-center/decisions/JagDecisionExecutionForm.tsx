"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDecisionCenterExecutionUpdate } from "@/lib/jag-command-center/decision-center/actions";
import type { JagDecisionExecutionEventKind } from "@/lib/jag-command-center/decision-center/types";

type ExecKind = Extract<
  JagDecisionExecutionEventKind,
  "started" | "progress" | "completed" | "outcome_note" | "evidence_added"
>;

export function JagDecisionExecutionForm({
  decisionId,
}: {
  readonly decisionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<ExecKind>("progress");
  const [message, setMessage] = useState("");
  const [progressPct, setProgressPct] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const pct = progressPct.trim()
            ? Number(progressPct)
            : undefined;
          const result = await addDecisionCenterExecutionUpdate({
            decisionId,
            kind,
            message,
            progressPct:
              typeof pct === "number" && !Number.isNaN(pct) ? pct : undefined,
            evidenceRef: evidenceRef || undefined,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage("");
          setEvidenceRef("");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Update type
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ExecKind)}
            className={fieldClass}
          >
            <option value="started">Started</option>
            <option value="progress">Progress</option>
            <option value="completed">Completion</option>
            <option value="outcome_note">Outcome notes</option>
            <option value="evidence_added">Evidence added</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Progress %
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={progressPct}
            onChange={(e) => setProgressPct(e.target.value)}
            placeholder="optional"
            className={fieldClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Evidence reference
          </span>
          <input
            value={evidenceRef}
            onChange={(e) => setEvidenceRef(e.target.value)}
            placeholder="Evidence id or URL (optional)"
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
          Notes
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={2}
          className={`${fieldClass} mt-1 resize-y`}
          placeholder="What changed?"
        />
      </label>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : "Add execution update"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}

const fieldClass =
  "mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)]";
const buttonClass =
  "rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-3 py-1.5 text-xs text-[var(--jag-text)] disabled:opacity-50";
