/**
 * JAG CFO™ — public platform entry (P-013).
 */

export const CFO_ID = "jag-cfo" as const;
export const CFO_VERSION = "1.0.0" as const;

export const CFO_DESCRIPTOR = Object.freeze({
  id: CFO_ID,
  name: "JAG CFO™" as const,
  version: CFO_VERSION,
  type: "platform-capability" as const,
  description:
    "Financial reasoning engine for organizational health, EBITDA, runway, QoE, valuation, scenarios, board reporting, and recommendations — consumes FinanceEngine; never replaces the ledger.",
});

export { CFO_GUARDS } from "./types";
export type {
  AssistantAnswer,
  BoardReport,
  CashRunwayReport,
  CfoInsight,
  CfoRecommendation,
  CfoScenarioKind,
  CfoScenarioResult,
  EbitdaAdjustment,
  EbitdaReport,
  FinancialAnalysis,
  MetricDefinition,
  MetricKey,
  MetricSnapshot,
  QoeReport,
  RecommendationKind,
  ValuationApproach,
  ValuationReport,
} from "./types";

export {
  ChiefFinancialOfficerEngine,
  createChiefFinancialOfficerEngine,
} from "./engine";

export { resetCfoStoreForTests } from "./store";
export {
  CFO_SINKS,
  listCfoEvents,
  listCfoEvidence,
  listCfoMemory,
  listCfoTwin,
  resetCfoOpsStoreForTests,
} from "./events";
export {
  METRIC_REGISTRY,
  evaluateMetrics,
  getMetricDefinition,
  listMetricDefinitions,
  metricValue,
} from "./metrics";
