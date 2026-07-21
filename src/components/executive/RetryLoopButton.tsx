"use client";

import { retryLoopTransitionAction } from "@/lib/platform/operational-loop/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function RetryLoopButton({ auditEntryId }: { auditEntryId: string }) {
  const action = useActionFeedback({
    verb: "run",
    labels: { idle: "Retry", loading: "Retrying…", success: "✓ Retried" },
    successToast: "✓ Transition retried.",
    errorToast: "Unable to retry.",
    progressLabel: "Retrying loop transition…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="run"
      variant="secondary"
      labels={{ idle: "Retry", loading: "Retrying…", success: "✓ Retried" }}
      className="!rounded-lg !border-rose-200 !px-2 !py-1 !text-xs !font-medium !text-rose-700 hover:!bg-rose-100"
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set("audit_entry_id", auditEntryId);
          await retryLoopTransitionAction(fd);
          return { success: true };
        });
      }}
    />
  );
}
