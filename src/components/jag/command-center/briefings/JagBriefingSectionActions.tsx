"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addExecutiveBriefingNote,
  approveBriefingDecision,
  createFollowUpBriefing,
  scheduleBriefingFollowUpReview,
} from "@/lib/jag-command-center/briefing-engine/actions";
import type {
  JagBriefingSection,
  JagBriefingSectionAction,
} from "@/lib/jag-command-center/briefing-engine/types";

export function JagBriefingSectionActions({
  briefingId,
  section,
  readOnly,
}: {
  readonly briefingId: string;
  readonly section: JagBriefingSection;
  readonly readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const primaryDecisionId = section.decisionIds[0] ?? null;

  if (readOnly) return null;

  function run(action: JagBriefingSectionAction) {
    setError(null);
    startTransition(async () => {
      if (action === "approve_decision") {
        if (!primaryDecisionId) {
          setError("No decision linked in this section.");
          return;
        }
        const result = await approveBriefingDecision({
          briefingId,
          decisionId: primaryDecisionId,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
        return;
      }
      if (action === "add_executive_note") {
        if (!note.trim()) {
          setError("Enter a note first.");
          return;
        }
        const result = await addExecutiveBriefingNote({
          briefingId,
          text: note,
          sectionId: section.id,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setNote("");
        router.refresh();
        return;
      }
      if (action === "create_follow_up") {
        const result = await createFollowUpBriefing({
          sourceBriefingId: briefingId,
          kind: "weekly_executive_review",
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/jag/briefings/${result.briefingId}`);
        return;
      }
      if (action === "schedule_review") {
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 7);
        const result = await scheduleBriefingFollowUpReview({
          briefingId,
          at: tomorrow.toISOString().slice(0, 10),
          note: `Review scheduled from section ${section.title}`,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 space-y-2 border-t border-[var(--jag-border)] pt-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
        Actions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {section.availableActions.includes("open_decision") &&
        primaryDecisionId ? (
          <Link
            href={`/jag/decisions/${primaryDecisionId}`}
            className={actionClass}
          >
            Open Decision
          </Link>
        ) : null}
        {section.availableActions.includes("approve_decision") ? (
          <button
            type="button"
            disabled={pending || !primaryDecisionId}
            className={actionClass}
            onClick={() => run("approve_decision")}
          >
            Approve Decision
          </button>
        ) : null}
        {section.availableActions.includes("assign") && primaryDecisionId ? (
          <Link
            href={`/jag/decisions/${primaryDecisionId}#assignment`}
            className={actionClass}
          >
            Assign
          </Link>
        ) : null}
        {section.availableActions.includes("create_follow_up") ? (
          <button
            type="button"
            disabled={pending}
            className={actionClass}
            onClick={() => run("create_follow_up")}
          >
            Create Follow-up
          </button>
        ) : null}
        {section.availableActions.includes("schedule_review") ? (
          <button
            type="button"
            disabled={pending}
            className={actionClass}
            onClick={() => run("schedule_review")}
          >
            Schedule Review
          </button>
        ) : null}
      </div>
      {section.availableActions.includes("add_executive_note") ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Executive note"
            className="min-w-[12rem] flex-1 rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)]"
          />
          <button
            type="button"
            disabled={pending}
            className={actionClass}
            onClick={() => run("add_executive_note")}
          >
            Add Executive Note
          </button>
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

const actionClass =
  "rounded border border-[var(--jag-border)] px-2 py-1 text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)] disabled:opacity-40";
