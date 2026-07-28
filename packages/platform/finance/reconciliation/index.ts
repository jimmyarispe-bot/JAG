/**
 * JAG Reconciliation™ — convert imported activity into verified records (P-010).
 */

export { RECONCILIATION_GUARDS, RECONCILIATION_SIGNAL_TYPES } from "./types";
export type {
  AdjustmentKind,
  ApproverStage,
  MatchCardinality,
  MatchSuggestion,
  ReconciliationAccountKind,
  ReconciliationAdjustment,
  ReconciliationAnalytics,
  ReconciliationApproval,
  ReconciliationException,
  ReconciliationHistoryEntry,
  ReconciliationMatch,
  ReconciliationPeriod,
  ReconciliationSignalEvent,
  ReconciliationSignalEventType,
} from "./types";

export {
  resetReconciliationStoreForTests,
  listPeriods,
  listMatches,
  listExceptions,
  listHistory,
  listSignals,
  subscribeSignals,
} from "./store";

export {
  ReconciliationEngine,
  createReconciliationEngine,
} from "./engine";

export { describeDigitalTwinSignals } from "./events";
export { reconciliationAnalytics } from "./analytics";
