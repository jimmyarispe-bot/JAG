"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordDecisionCenterOutcome } from "@/lib/jag-command-center/decision-center/actions";
import type {
  JagDecisionFeedback,
  JagDecisionFuturePriority,
  JagDecisionOutcome,
  JagDecisionOutcomeResult,
} from "@/lib/jag-command-center/decision-center/types";

export function JagDecisionOutcomeForm({
  decisionId,
  outcome,
  feedback,
}: {
  readonly decisionId: string;
  readonly outcome: JagDecisionOutcome | null;
  readonly feedback: JagDecisionFeedback | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expectedOutcome, setExpected] = useState(
    outcome?.expectedOutcome ?? ""
  );
  const [actualOutcome, setActual] = useState(outcome?.actualOutcome ?? "");
  const [confidence, setConfidence] = useState(
    outcome ? String(outcome.confidence) : "0.8"
  );
  const [result, setResult] = useState<JagDecisionOutcomeResult>(
    outcome?.result ?? "success"
  );
  const [lessonsLearned, setLessons] = useState(
    outcome?.lessonsLearned ?? ""
  );
  const [achieved, setAchieved] = useState(
    feedback?.achievedIntendedResult ?? true
  );
  const [futurePriority, setFuture] = useState<JagDecisionFuturePriority>(
    feedback?.futurePriority ?? "same"
  );
  const [feedbackNotes, setFeedbackNotes] = useState(feedback?.notes ?? "");

  return (
    <div className="space-y-4">
      {outcome ? (
        <div className="space-y-2 text-xs text-[var(--jag-muted)]">
          <p>
            Result:{" "}
            <span className="text-[var(--jag-text)]">{outcome.result}</span>
            {" · confidence "}
            {outcome.confidence.toFixed(2)}
            {" · "}
            {outcome.reviewedBy}
          </p>
          <p>
            <span className="text-[var(--jag-muted-2)]">Expected:</span>{" "}
            {outcome.expectedOutcome}
          </p>
          <p>
            <span className="text-[var(--jag-muted-2)]">Actual:</span>{" "}
            {outcome.actualOutcome}
          </p>
          {outcome.lessonsLearned ? (
            <p>
              <span className="text-[var(--jag-muted-2)]">Lessons:</span>{" "}
              {outcome.lessonsLearned}
            </p>
          ) : null}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded border border-[var(--jag-border)] px-3 py-2 text-xs text-[var(--jag-muted)]">
          <p className="text-[var(--jag-text)]">Feedback</p>
          <p className="mt-1">
            Did the decision achieve its intended result?{" "}
            <span className="text-[var(--jag-text)]">
              {feedback.achievedIntendedResult ? "Yes" : "No"}
            </span>
          </p>
          <p className="mt-1">
            Should similar recommendations be prioritized{" "}
            <span className="text-[var(--jag-text)]">
              {feedback.futurePriority}
            </span>{" "}
            in the future?
          </p>
          {feedback.notes ? (
            <p className="mt-1 text-[var(--jag-muted-2)]">{feedback.notes}</p>
          ) : null}
        </div>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const conf = Number(confidence);
            const res = await recordDecisionCenterOutcome({
              decisionId,
              expectedOutcome,
              actualOutcome,
              confidence: Number.isNaN(conf) ? 0 : conf,
              result,
              lessonsLearned,
              achievedIntendedResult: achieved,
              futurePriority,
              feedbackNotes: feedbackNotes || undefined,
            });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Expected outcome
            </span>
            <textarea
              required
              rows={2}
              value={expectedOutcome}
              onChange={(e) => setExpected(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Actual outcome
            </span>
            <textarea
              required
              rows={2}
              value={actualOutcome}
              onChange={(e) => setActual(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Confidence (0–1)
            </span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Result
            </span>
            <select
              value={result}
              onChange={(e) =>
                setResult(e.target.value as JagDecisionOutcomeResult)
              }
              className={fieldClass}
            >
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Lessons learned
            </span>
            <textarea
              rows={2}
              value={lessonsLearned}
              onChange={(e) => setLessons(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="space-y-2 rounded border border-[var(--jag-border)] p-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Feedback (application metadata only)
          </p>
          <label className="flex items-center gap-2 text-xs text-[var(--jag-muted)]">
            <input
              type="checkbox"
              checked={achieved}
              onChange={(e) => setAchieved(e.target.checked)}
            />
            Decision achieved its intended result
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Future priority for similar recommendations
            </span>
            <select
              value={futurePriority}
              onChange={(e) =>
                setFuture(e.target.value as JagDecisionFuturePriority)
              }
              className={fieldClass}
            >
              <option value="higher">Higher</option>
              <option value="same">Same</option>
              <option value="lower">Lower</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              Feedback notes
            </span>
            <input
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <button type="submit" disabled={pending} className={buttonClass}>
          {pending
            ? "Saving…"
            : outcome
              ? "Update outcome review"
              : "Record outcome review"}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </form>
    </div>
  );
}

const fieldClass =
  "mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)]";
const buttonClass =
  "rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-3 py-1.5 text-xs text-[var(--jag-text)] disabled:opacity-50";
