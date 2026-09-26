"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { openFormDraftAction } from "@/lib/admissions/interest-form/form-builder-actions";

/**
 * "Edit the wording" — which opens a draft rather than editing the live form.
 *
 * The button says what it does in the words that matter: a draft is opened,
 * and families keep seeing the published version until somebody publishes.
 * A button labelled "Edit" on a form 22 versions deep would imply the change
 * is immediate, and the first person to find out otherwise would be a parent.
 */
export function OpenFormDraftButton({ formId }: { formId: string }) {
  const labels = {
    idle: "Edit the wording",
    loading: "Opening a draft…",
    success: "✓ Draft opened",
  };
  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast: "Draft opened. Nothing families see has changed.",
    errorToast: "The draft could not be opened.",
    progressLabel: "Opening a draft…",
  });

  return (
    <ActionButton
      status={action.status}
      variant="secondary"
      size="sm"
      errorMessage={action.errorMessage}
      labels={labels}
      onClick={() =>
        void action.run(async () => {
          const result = await openFormDraftAction(formId);
          if (result && "error" in result) throw new Error(result.error);
          return { success: true };
        })
      }
    />
  );
}
