"use client";

import { refreshEdiAction } from "@/lib/edi/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function RefreshEdiButton() {
  const action = useActionFeedback({
    verb: "sync",
    labels: { idle: "Refresh decision intelligence", loading: "Refreshing…", success: "✓ Refreshed" },
    successToast: "✓ Decision intelligence refreshed.",
    errorToast: "Unable to refresh.",
    progressLabel: "Refreshing decision intelligence…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="sync"
      labels={{ idle: "Refresh decision intelligence", loading: "Refreshing…", success: "✓ Refreshed" }}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          await refreshEdiAction(new FormData());
          return { success: true };
        });
      }}
    />
  );
}
