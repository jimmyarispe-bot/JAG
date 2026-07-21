import { cn } from "@/components/workspace-design-system/utils";

/** D.1 — Single EmptyState primitive (re-export). */
export { EmptyState } from "@/components/ui/EmptyState";
export { LiveAnnouncerProvider, useAnnounce } from "./LiveAnnouncer";
export { ActionButton, PendingActionButton } from "./ActionButton";
export type { ActionButtonProps, ActionVariant } from "./ActionButton";
export { ActionChip, CTAButton, ActionChipGroup } from "./ActionChip";
export type {
  ActionChipProps,
  ActionChipButtonProps,
  ActionChipLinkProps,
} from "./ActionChip";
export {
  inferActionChipVariant,
  ACTION_CHIP_BASE,
  ACTION_CHIP_SIZE,
  ACTION_CHIP_VARIANT,
} from "./action-chip-styles";
export type { ActionChipVariant, ActionChipSize } from "./action-chip-styles";
export { OperationProgress } from "./OperationProgress";
export type { OperationProgressProps } from "./OperationProgress";
export { InlineRefresh } from "./InlineRefresh";
export { AiActivity, WorkspaceActivity } from "./AiActivity";
export type { AiActivityProps } from "./AiActivity";
export { useActionFeedback } from "./useActionFeedback";
export type { UseActionFeedbackOptions, UseActionFeedbackResult } from "./useActionFeedback";
export {
  resolveActionLabels,
  DEFAULT_SUCCESS_DURATION_MS,
  DEFAULT_PROCESSING_THRESHOLD_MS,
  DEFAULT_ERROR_HINT,
} from "./action-labels";
export type { ActionVerb, ActionStatus, ActionLabelSet } from "./action-labels";
export { ToastProvider, useToast } from "./Toast";
export type { ToastTone, ToastInput } from "./Toast";
export {
  BackgroundJobsProvider,
  useBackgroundJobs,
  useBackgroundJobsState,
  ShellActivityIndicator,
} from "./BackgroundJobs";
export { GlobalProgressProvider, useGlobalProgress } from "./GlobalProgress";
export { InteractionProviders } from "./InteractionProviders";
export { assertActionResult } from "./runMutation";

export function SuccessBanner({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800", className)} role="status">
      {message}
    </div>
  );
}

export function WarningBanner({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900", className)} role="status">
      {message}
    </div>
  );
}

export function ErrorBanner({ message, title = "Error", className }: { message: string; title?: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800", className)} role="alert">
      <p className="font-medium">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 p-10", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" aria-hidden />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

/** D.1 / UX-002 — Route-level progressive shell (header, toolbar, skeleton body). */
export { RouteLoadingSkeleton } from "@/components/experience-system/skeletons";

export function ProgressIndicator({ value, max = 100, label, className }: { value: number; max?: number; label?: string; className?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className="h-full bg-brand-500 transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BackgroundProcess({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm", className)} role="status">
      <span className="h-3 w-3 animate-pulse rounded-full bg-brand-500" aria-hidden />
      {label}
    </div>
  );
}
