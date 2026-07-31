export { AutomationService } from "@/lib/platform/automation/operating/service";
export type { AutomationServiceApi } from "@/lib/platform/automation/operating/service";

export type {
  AssignDecisionActionParams,
  AutomationAction,
  AutomationActionType,
  AutomationBatchResult,
  AutomationCondition,
  AutomationConditionGroup,
  AutomationRule,
  AutomationRun,
  AutomationRunStatus,
  AutomationScheduleCadence,
  AutomationStatusSnapshot,
  AutomationTriggerKind,
  ConditionOperator,
  CreateDecisionActionParams,
  CreateNotificationActionParams,
  DecisionTargetActionParams,
  EscalatePriorityActionParams,
  OperationalFacts,
  RunAutomationInput,
} from "@/lib/platform/automation/operating/types";

export {
  evaluateCondition,
  evaluateConditions,
  getFactValue,
} from "@/lib/platform/automation/operating/conditions";

export {
  expandTriggerSubjects,
  triggerLabel,
} from "@/lib/platform/automation/operating/triggers";

export { executeAction } from "@/lib/platform/automation/operating/actions";
export type {
  ActionExecutionContext,
  ActionExecutionResult,
} from "@/lib/platform/automation/operating/actions";

export {
  getAutomationRule,
  listAutomationRules,
  listEnabledAutomationRules,
  registerAutomationRule,
  registerAutomationRules,
  resetAutomationRegistryForTests,
  setAutomationRuleEnabled,
} from "@/lib/platform/automation/operating/registry";

export {
  DEFAULT_AUTOMATION_RULES,
  ensureDefaultAutomationRules,
  resetDefaultAutomationRulesFlagForTests,
} from "@/lib/platform/automation/operating/rules";

export {
  listAutomationRuns,
  resetAutomationRunStoreForTests,
  runAutomationEngine,
} from "@/lib/platform/automation/operating/engine";

export {
  AutomationScheduler,
  runAllScheduledCadences,
} from "@/lib/platform/automation/operating/scheduler";

export {
  buildOperationalFacts,
  factsFromIntelligenceSignals,
} from "@/lib/platform/automation/operating/facts";
