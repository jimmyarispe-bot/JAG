import {
  listAutomationRuns,
  runAutomationEngine,
} from "@/lib/platform/automation/operating/engine";
import {
  buildOperationalFacts,
  factsFromIntelligenceSignals,
} from "@/lib/platform/automation/operating/facts";
import {
  getAutomationRule,
  listAutomationRules,
  listEnabledAutomationRules,
  registerAutomationRule,
  registerAutomationRules,
  setAutomationRuleEnabled,
} from "@/lib/platform/automation/operating/registry";
import {
  ensureDefaultAutomationRules,
  DEFAULT_AUTOMATION_RULES,
} from "@/lib/platform/automation/operating/rules";
import {
  AutomationScheduler,
  runAllScheduledCadences,
} from "@/lib/platform/automation/operating/scheduler";
import type {
  AutomationStatusSnapshot,
  OperationalFacts,
  RunAutomationInput,
} from "@/lib/platform/automation/operating/types";

function buildStatusSnapshot(recentLimit = 20): AutomationStatusSnapshot {
  ensureDefaultAutomationRules();
  const rules = listAutomationRules();
  const recentRuns = listAutomationRuns(recentLimit);
  const decisionsCreated = recentRuns.reduce(
    (n, r) => n + r.decisionsCreated.length,
    0
  );
  const failures = recentRuns.filter(
    (r) => r.status === "failed" || r.status === "partial"
  ).length;

  return {
    totalRules: rules.length,
    activeRules: rules.filter((r) => r.enabled).length,
    disabledRules: rules.filter((r) => !r.enabled).length,
    recentRuns,
    decisionsCreated,
    failures,
    lastRunAt: recentRuns[0]?.finishedAt ?? null,
  };
}

/**
 * Workflow Automation Service — deterministic OS over Decisions + Notifications.
 */
export const AutomationService = {
  ensureDefaults: ensureDefaultAutomationRules,
  defaultRules: DEFAULT_AUTOMATION_RULES,

  register: registerAutomationRule,
  registerMany: registerAutomationRules,
  getRule: getAutomationRule,
  listRules: listAutomationRules,
  listEnabledRules: listEnabledAutomationRules,
  setEnabled: setAutomationRuleEnabled,

  run(input: RunAutomationInput) {
    return runAutomationEngine(input);
  },

  runTrigger(
    trigger: RunAutomationInput["trigger"],
    facts: OperationalFacts,
    options?: Omit<RunAutomationInput, "facts" | "trigger">
  ) {
    return runAutomationEngine({ ...options, facts, trigger });
  },

  scheduler: AutomationScheduler,
  runScheduled: runAllScheduledCadences,

  buildFacts: buildOperationalFacts,
  factsFromSignals: factsFromIntelligenceSignals,

  listRuns: listAutomationRuns,
  status: buildStatusSnapshot,

  /**
   * Consume EI signals → run matching automations → return fresh status.
   * Does not modify Executive Intelligence logic.
   */
  syncFromIntelligenceSignals(input: {
    organizationId: string | null;
    applicationId?: string | null;
    observedAt: string;
    signals: Array<{ key: string; value: unknown }>;
    actorUserId?: string | null;
  }): AutomationStatusSnapshot {
    const facts = factsFromIntelligenceSignals({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      observedAt: input.observedAt,
      signals: input.signals,
    });
    runAutomationEngine({
      facts,
      actorUserId: input.actorUserId,
      now: input.observedAt,
    });
    return buildStatusSnapshot();
  },
} as const;

export type AutomationServiceApi = typeof AutomationService;
