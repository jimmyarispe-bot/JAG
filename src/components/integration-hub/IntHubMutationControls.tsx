"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import type { ActionVerb } from "@/components/experience-system/feedback/action-labels";
import type { ActionChipSize, ActionChipVariant } from "@/components/experience-system/feedback";

export { ExperienceForm };

type ServerAction = (fd: FormData) => Promise<void | { error?: string }>;
type VoidAction = () => Promise<void | { error?: string }>;

export function IntHubIdButton({
  action: serverAction,
  idField,
  idValue,
  verb = "save",
  labels,
  progressLabel,
  successToast,
  errorToast,
  variant = "secondary",
  size = "sm",
  className,
}: {
  action: ServerAction;
  idField: string;
  idValue: string;
  verb?: ActionVerb;
  labels: { idle: string; loading?: string; success?: string };
  progressLabel: string;
  successToast?: string;
  errorToast?: string;
  variant?: ActionChipVariant;
  size?: ActionChipSize;
  className?: string;
}) {
  const action = useActionFeedback({
    verb,
    labels: { idle: labels.idle, loading: labels.loading, success: labels.success },
    successToast,
    errorToast,
    progressLabel,
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb={verb}
      variant={variant}
      size={size}
      labels={labels}
      className={className}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set(idField, idValue);
          const result = await serverAction(fd);
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    />
  );
}

export function IntHubVoidButton({
  action: serverAction,
  verb = "sync",
  labels,
  progressLabel,
  successToast,
  errorToast,
  className,
}: {
  action: VoidAction;
  verb?: ActionVerb;
  labels: { idle: string; loading?: string; success?: string };
  progressLabel: string;
  successToast?: string;
  errorToast?: string;
  className?: string;
}) {
  const action = useActionFeedback({
    verb,
    labels: { idle: labels.idle, loading: labels.loading, success: labels.success },
    successToast,
    errorToast,
    progressLabel,
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb={verb}
      labels={labels}
      className={className}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const result = await serverAction();
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    />
  );
}
