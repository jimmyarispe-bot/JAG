/**
 * Production readiness validation — Sprint 209.
 * Application-layer GA checks. No new intelligence capabilities.
 */

export type {
  ValidationCheck,
  ValidationCheckResult,
  ValidationReport,
  WorkflowLink,
  CapabilityHealthReport,
} from "./types";

export {
  WORKFLOW_MATRIX,
  WORKFLOW_STAGES,
  runWorkflowMatrix,
} from "./workflow-matrix";

export { validateRegisteredCapabilities } from "./capability-validation";

export { ProductionReadinessService } from "./ProductionReadinessService";

export {
  recordReadinessObservation,
  listReadinessObservations,
  clearReadinessObservationsForTests,
  type ReadinessObservation,
  type ReadinessObservationKind,
} from "./observability";

export {
  loadReadinessWorkspace,
  type JagReadinessWorkspaceModel,
} from "./load-readiness";
