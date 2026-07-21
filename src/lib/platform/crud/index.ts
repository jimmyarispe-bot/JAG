export type {
  CrudAction,
  CrudEntityKey,
  DependencyHit,
  DependencyReport,
  DeleteContext,
  DeleteContextField,
  EntityCapability,
  LifecycleErrorCode,
  LifecycleResult,
} from "./types";
export { DELETE_CONFIRMATION_TOKEN } from "./types";

export {
  validateDeleteConfirmation,
  assertCanHardDelete,
  emptyDependencyReport,
  ENTITY_SHORTCUTS,
  isEditableTarget,
} from "./policy";

export {
  ENTITY_CAPABILITIES,
  getEntityCapability,
  entitySupports,
  listEntityCapabilities,
} from "./registry";

export { lifecycleEventType, LIFECYCLE_CATALOG_EVENTS } from "./activity";

export {
  CRUD_COMPLETION_RULE,
  REQUIRED_ACTIONS_FOR_COMPLETION,
  SOFT_END_STATE_ACTIONS,
  ENTITY_RELEASE_STATUS,
  getEntityReleaseStatus,
  evaluateCrudCompliance,
  canMarkModuleComplete,
  validateCrudCompletionGate,
} from "./completion-gate";
export type {
  CrudReleaseStatus,
  CrudComplianceIssue,
  CrudComplianceResult,
  EntityCapabilityWithStatus,
} from "./completion-gate";
