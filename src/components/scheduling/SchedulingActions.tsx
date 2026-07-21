"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { runSchedulingIntelligenceAction, resolveScheduleConflictAction } from "@/lib/scheduling/actions";

interface RunIntelligenceButtonProps {
  schoolId?: string;
}

export function RunIntelligenceButton({ schoolId }: RunIntelligenceButtonProps) {
  const action = useActionFeedback({
    verb: "run",
    labels: { idle: "Run conflict scan", loading: "Scanning…", success: "✓ Scanned" },
    successToast: "✓ Conflict scan complete.",
    errorToast: "Unable to run scan.",
    progressLabel: "Running conflict scan…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="run"
      variant="secondary"
      labels={{ idle: "Run conflict scan", loading: "Scanning…", success: "✓ Scanned" }}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          if (schoolId) fd.set("school_id", schoolId);
          const result = await runSchedulingIntelligenceAction(fd);
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    />
  );
}

interface ResolveConflictButtonProps {
  conflictId: string;
}

export function ResolveConflictButton({ conflictId }: ResolveConflictButtonProps) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Resolve", loading: "…", success: "✓ Resolved" },
    successToast: "✓ Conflict resolved.",
    errorToast: "Unable to resolve.",
    progressLabel: "Resolving conflict…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="save"
      variant="warning"
      labels={{ idle: "Resolve", loading: "…", success: "✓ Resolved" }}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set("conflict_id", conflictId);
          const result = await resolveScheduleConflictAction(fd);
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    />
  );
}
