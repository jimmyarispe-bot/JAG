import { runAutomationEngine } from "@/lib/platform/automation/operating/engine";
import type {
  AutomationBatchResult,
  AutomationScheduleCadence,
  OperationalFacts,
  RunAutomationInput,
} from "@/lib/platform/automation/operating/types";

/**
 * Scheduler interface for hourly / daily / weekly automation.
 * Not wired to cron in this sprint — callers invoke manually.
 */
export type AutomationScheduler = {
  /** Supported cadences (excluding manual). */
  cadences: ReadonlyArray<Exclude<AutomationScheduleCadence, "manual">>;
  /** Whether a given cadence should execute in this invocation. */
  shouldRun(
    cadence: AutomationScheduleCadence,
    options?: { include?: AutomationScheduleCadence[] }
  ): boolean;
  /** Execute all rules for a cadence against the provided facts. */
  runCadence(
    cadence: Exclude<AutomationScheduleCadence, "manual">,
    facts: OperationalFacts,
    options?: Omit<RunAutomationInput, "facts" | "cadence" | "trigger">
  ): AutomationBatchResult;
};

export const AutomationScheduler: AutomationScheduler = {
  cadences: ["hourly", "daily", "weekly"],

  shouldRun(cadence, options) {
    if (cadence === "manual") return true;
    if (!options?.include) return true;
    return options.include.includes(cadence);
  },

  runCadence(cadence, facts, options) {
    if (!this.shouldRun(cadence, { include: [cadence] })) {
      return {
        trigger: "schedule",
        cadence,
        ranAt: options?.now ?? facts.observedAt,
        runs: [],
        decisionsCreated: [],
        notificationsCreated: [],
        failures: 0,
      };
    }
    return runAutomationEngine({
      facts,
      cadence,
      actorUserId: options?.actorUserId,
      now: options?.now,
      retainRuns: options?.retainRuns,
    });
  },
};

/** Convenience: run hourly + daily + weekly sequentially (manual ops / tests). */
export function runAllScheduledCadences(
  facts: OperationalFacts,
  options?: Omit<RunAutomationInput, "facts" | "cadence" | "trigger">
): AutomationBatchResult[] {
  return AutomationScheduler.cadences.map((cadence) =>
    AutomationScheduler.runCadence(cadence, facts, options)
  );
}
