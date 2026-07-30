/**
 * GA certification — Sprint 210.
 * Validation + defect detection only. No new product features.
 */

export type {
  Severity,
  GaRecommendation,
  CertificationPhase,
  Finding,
  AuthCheck,
  RoleCheck,
  SecurityCheck,
  JagSurfaceCheck,
  SystemCheck,
  PhaseResult,
  GaCertificationReport,
  WorkflowDomain,
  ValidationDimension,
  WorkflowInventoryItem,
} from "./types";

export {
  WORKFLOW_INVENTORY,
  listWorkflowInventory,
} from "./workflow-inventory";

export { runAuthValidation } from "./auth-validation";
export { runRoleValidation, ROLE_HOME_PATHS } from "./role-validation";
export { runSecurityValidation } from "./security-validation";
export { runJagValidation, JAG_SURFACE_HREFS } from "./jag-validation";
export { runSystemValidation } from "./system-validation";

export { GaCertificationService } from "./GaCertificationService";

export {
  recordCertificationObservation,
  listCertificationObservations,
  clearCertificationObservationsForTests,
  type CertificationObservation,
  type CertificationObservationKind,
} from "./observability";
