/**
 * JAG OS — Universal Decision Engine (public API).
 */

export type {
  CommunicationsDecisionPort,
  DecisionCondition,
  DecisionConditionOperator,
  DecisionConflictStrategy,
  DecisionContext,
  DecisionDefinition,
  DecisionEvent,
  DecisionEventType,
  DecisionExplanation,
  DecisionExtensionCallResult,
  DecisionExtensionPorts,
  DecisionId,
  DecisionInput,
  DecisionMetrics,
  DecisionPolicy,
  DecisionReason,
  DecisionResult,
  DecisionRule,
  EntityDecisionPort,
  FormsDecisionPort,
  IntelligenceDecisionPort,
  PolicyId,
  ProcessDecisionPort,
  RuleId,
  TelemetryDecisionPort,
  WorkflowDecisionPort,
} from "@/jag/decisions/contracts";

export {
  bindDecisionExtensions,
  getDecisionExtensions,
  resetDecisionExtensionsForTests,
} from "@/jag/decisions/contracts";

export {
  DecisionRegistry,
  assertDecisionRegistered,
  getDecisionDefinition,
  listDecisionDefinitions,
  registerDecision,
  resetDecisionRegistryForTests,
  unregisterDecision,
  validateDecisionRegistryDependencies,
} from "@/jag/decisions/registry";

export {
  DecisionRuntime,
  compareDecisions,
  decisionNow,
  evaluateDecision,
  explainDecision,
  replaceDecisionDefinition,
  resetDecisionClockForTests,
  resetDecisionIdsForTests,
  setDecisionClockForTests,
  setDecisionIdPrefixForTests,
  simulateDecision,
  validateDecision,
} from "@/jag/decisions/runtime";

export {
  evaluateAllConditions,
  evaluateCondition,
  evaluatePolicy,
  orderPolicies,
} from "@/jag/decisions/policies";

export { buildExplanation } from "@/jag/decisions/results";

export {
  cacheKey,
  fingerprintFacts,
  getCachedContext,
  mergeFacts,
  putCachedContext,
  readFactPath,
  resetDecisionContextCacheForTests,
} from "@/jag/decisions/context";

export type {
  DecisionAuditRepository,
  DecisionMetricsRepository,
  DecisionPersistencePorts,
  DecisionRepository,
} from "@/jag/decisions/persistence";

export type { DecisionTelemetryEvent } from "@/jag/decisions/telemetry";
export {
  emitDecisionEvent,
  listDecisionEvents,
  resetDecisionEventsForTests,
  resetDecisionTelemetryForTests,
  subscribeDecisionEvents,
  subscribeDecisionTelemetry,
  trackDecisionEvaluation,
  trackPolicyChange,
} from "@/jag/decisions/telemetry";

export {
  createTestDecisionDefinition,
  freezeDecisionEngineForTests,
  resetDecisionEngineForTests,
} from "@/jag/decisions/testing";
