export type {
  ModuleId,
  ModuleReadinessStatus,
  GateId,
  GateVerdict,
  GateResult,
  ModuleReleaseDefinition,
  ModuleReleaseSnapshot,
  ReleaseValidationReport,
} from "./types";
export { GATE_LABELS, READINESS_ORDER } from "./types";

export {
  MODULE_RELEASE_REGISTRY,
  getModuleDefinition,
  listModuleDefinitions,
} from "./registry";

export {
  evaluateCrudGate,
  evaluateSecurityGate,
  evaluateWorkflowGate,
  evaluateEiGate,
  evaluateAuditGate,
  evaluateCommunicationsGate,
  evaluateDocsGate,
  evaluateTestsGate,
  evaluateAccessibilityGate,
  evaluateMobileGate,
  evaluatePerformanceGate,
  evaluateExtensionGate,
  evaluateUxGate,
  evaluateProductionGate,
  evaluateAllGates,
} from "./gates";

export {
  deriveEffectiveStatus,
  buildModuleSnapshot,
  buildReleaseReport,
  buildReleaseDashboardRows,
} from "./evaluate";

export const MODULE_COMPLETION_RULE_V2 =
  "A module cannot be marked complete unless it passes all AcademyOS Module Completion Standard (v2) gates.";
