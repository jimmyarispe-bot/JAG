"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { endImpersonationAction } from "@/lib/platform/identity/server-actions";

interface ImpersonationBannerProps {
  targetName: string;
  supportModeLabel?: string;
}

export function ImpersonationBanner({
  targetName,
  supportModeLabel = "Support Mode",
}: ImpersonationBannerProps) {
  const action = useActionFeedback({
    verb: "custom",
    labels: {
      idle: "End impersonation",
      loading: "Ending…",
      success: "✓ Ended",
      error: "Unable to end",
    },
    successToast: "✓ Impersonation ended.",
    errorToast: "Unable to end impersonation.",
    progressLabel: "Ending impersonation…",
  });

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span>
          {supportModeLabel} — viewing as <strong>{targetName}</strong>. All actions are logged.
        </span>
        <ActionButton
          type="button"
          status={action.status}
          verb="custom"
          labels={{
            idle: "End impersonation",
            loading: "Ending…",
            success: "✓ Ended",
            error: "Unable to end",
          }}
          className="!rounded-lg !bg-amber-700 !px-3 !py-1 !text-xs !font-medium !text-white hover:!bg-amber-800"
          errorMessage={action.errorMessage}
          onClick={() => {
            void action.run(async () => {
              const result = await endImpersonationAction();
              assertActionResult(result);
              return result ?? { success: true };
            });
          }}
        />
      </div>
    </div>
  );
}
