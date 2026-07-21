"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ActionChip, type ActionChipSize, type ActionChipVariant } from "./ActionChip";
import type { ActionLabelSet, ActionStatus, ActionVerb } from "./action-labels";

/** UX-003/004 — variants shared with ActionChip. */
export type ActionVariant = ActionChipVariant;

/**
 * UX-004 canonical mutation control — thin wrapper over ActionChip.
 *
 * Prefer:
 * ```tsx
 * <ActionButton status={action.status} verb="save" errorMessage={action.errorMessage} onRetry={() => void action.run(...)} />
 * ```
 * or the docs-shaped API:
 * ```tsx
 * <ActionButton loading={isLoading} success={justSaved} variant="primary" />
 * ```
 */
export type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  status?: ActionStatus;
  pending?: boolean;
  loading?: boolean;
  success?: boolean;
  verb?: ActionVerb;
  labels?: Partial<ActionLabelSet>;
  variant?: ActionVariant;
  size?: ActionChipSize;
  icon?: ReactNode;
  errorMessage?: string | null;
  errorHint?: string;
  onRetry?: () => void;
  children?: ReactNode;
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  props,
  ref
) {
  return <ActionChip ref={ref} {...props} />;
});

/**
 * Convenience wrapper for useTransition migrations.
 * Prefer `useActionFeedback` + `ActionButton` for new code.
 */
export function PendingActionButton({
  pending,
  justSucceeded,
  ...props
}: ActionButtonProps & { justSucceeded?: boolean }) {
  const status: ActionStatus | undefined = pending
    ? "loading"
    : justSucceeded
      ? "success"
      : props.status;

  return <ActionButton {...props} pending={pending} status={status} />;
}
