"use client";

import type { ReactNode } from "react";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import type { ActionVerb } from "@/components/experience-system/feedback/action-labels";
import type { ActionChipSize, ActionChipVariant } from "@/components/experience-system/feedback";

type ServerAction = (fd: FormData) => Promise<void | { error?: string }>;

interface ExperienceFormProps {
  action: ServerAction;
  verb?: ActionVerb;
  labels?: { idle: string; loading?: string; success?: string };
  progressLabel: string;
  successToast?: string;
  errorToast?: string;
  className?: string;
  children?: ReactNode;
  buttonClassName?: string;
  buttonVariant?: ActionChipVariant;
  buttonSize?: ActionChipSize;
}

export function ExperienceForm({
  action: serverAction,
  verb = "save",
  labels,
  progressLabel,
  successToast,
  errorToast,
  className,
  children,
  buttonClassName,
  buttonVariant = "primary",
  buttonSize = "sm",
}: ExperienceFormProps) {
  const feedback = useActionFeedback({
    verb,
    labels: labels
      ? { idle: labels.idle, loading: labels.loading, success: labels.success }
      : undefined,
    successToast,
    errorToast,
    progressLabel,
  });

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        void feedback.run(async () => {
          const result = await serverAction(new FormData(form));
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    >
      {children}
      <ActionButton
        type="submit"
        status={feedback.status}
        verb={verb}
        variant={buttonVariant}
        size={buttonSize}
        labels={labels}
        className={buttonClassName}
        errorMessage={feedback.errorMessage}
      />
    </form>
  );
}

export function ApprovalReviewButtons({
  approvalId,
  reviewAction,
}: {
  approvalId: string;
  reviewAction: ServerAction;
}) {
  const action = useActionFeedback({
    verb: "approve",
    successToast: "✓ Approval updated.",
    errorToast: "Unable to update approval.",
    progressLabel: "Updating approval…",
  });

  function review(status: "approved" | "rejected") {
    void action.run(async () => {
      const fd = new FormData();
      fd.set("approval_id", approvalId);
      fd.set("status", status);
      const result = await reviewAction(fd);
      assertActionResult(result);
      return result ?? { success: true };
    });
  }

  return (
    <div className="mt-2 flex gap-2">
      <ActionButton
        type="button"
        status={action.status}
        verb="approve"
        variant="success"
        labels={{ idle: "Approve", loading: "Approving…", success: "✓ Approved" }}
        onClick={() => review("approved")}
      />
      <ActionButton
        type="button"
        status={action.status}
        verb="custom"
        variant="danger"
        labels={{ idle: "Reject", loading: "Rejecting…", success: "✓ Rejected", error: "Unable to reject" }}
        errorMessage={action.errorMessage}
        onClick={() => review("rejected")}
      />
    </div>
  );
}

export function PublishPromptButton({
  promptId,
  promptName,
  publishAction,
}: {
  promptId: string;
  promptName: string;
  publishAction: ServerAction;
}) {
  const action = useActionFeedback({
    verb: "publish",
    labels: { idle: `Publish ${promptName}`, loading: "Publishing…", success: "✓ Published" },
    successToast: "✓ Prompt published.",
    errorToast: "Unable to publish.",
    progressLabel: "Publishing prompt…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="publish"
      variant="success"
      labels={{ idle: `Publish ${promptName}`, loading: "Publishing…", success: "✓ Published" }}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set("prompt_id", promptId);
          const result = await publishAction(fd);
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    />
  );
}

export function CancelJobButton({
  jobId,
  cancelAction,
}: {
  jobId: string;
  cancelAction: ServerAction;
}) {
  const action = useActionFeedback({
    verb: "custom",
    labels: { idle: "Cancel", loading: "Cancelling…", success: "✓ Cancelled", error: "Unable to cancel" },
    successToast: "✓ Job cancelled.",
    errorToast: "Unable to cancel job.",
    progressLabel: "Cancelling job…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="custom"
      variant="danger"
      labels={{ idle: "Cancel", loading: "Cancelling…", success: "✓ Cancelled", error: "Unable to cancel" }}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set("job_id", jobId);
          const result = await cancelAction(fd);
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    />
  );
}
