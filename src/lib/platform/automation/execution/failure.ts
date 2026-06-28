import type {
  AutomationActionResult,
  AutomationFailureStrategy,
  FailurePolicyDefinition,
} from "@/lib/platform/automation/engine-types";

export interface FailureHandlingDecision {
  strategy: AutomationFailureStrategy;
  shouldStop: boolean;
  shouldRetry: boolean;
  shouldEscalate: boolean;
  error: string;
}

/** Failure Handling Framework — maps failure policies to pipeline decisions. */
export function resolveFailureDecision(
  policy: FailurePolicyDefinition | undefined,
  actionResult: AutomationActionResult
): FailureHandlingDecision {
  const strategy = policy?.strategy ?? "stop";
  const error = actionResult.error ?? "Unknown action failure";

  return {
    strategy,
    shouldStop: strategy === "stop" || strategy === "escalate",
    shouldRetry: strategy === "retry",
    shouldEscalate: strategy === "escalate",
    error,
  };
}

export function aggregateExecutionErrors(
  actionResults: AutomationActionResult[]
): string[] {
  return actionResults
    .filter((result) => !result.success && !result.skipped)
    .map((result) => result.error ?? `Action "${result.actionKey}" failed`);
}

export function determineExecutionStatus(
  actionResults: AutomationActionResult[],
  conditionsPassed: boolean
): "completed" | "failed" | "skipped" {
  if (!conditionsPassed) return "skipped";

  const hasFailure = actionResults.some((r) => !r.success && !r.skipped);
  return hasFailure ? "failed" : "completed";
}

export function buildFailureSummary(
  automationKey: string,
  errors: string[]
): string {
  if (!errors.length) return `Automation "${automationKey}" completed successfully`;
  return `Automation "${automationKey}" failed: ${errors.join("; ")}`;
}
