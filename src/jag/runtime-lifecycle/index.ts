/**
 * JAG Runtime Lifecycle Manager — public API.
 */

export type {
  CapabilityPackVersionRef,
  CreateRuntimeVersionInput,
  LifecycleOperationResult,
  RuntimeApproval,
  RuntimeApprovalKind,
  RuntimeHistoryEntry,
  RuntimeLifecycleState,
  RuntimeLineage,
  RuntimePromotionEvent,
  RuntimeRollbackRecord,
  RuntimeSnapshot,
  RuntimeVersion,
  SnapshotCompareResult,
  ValidationGateId,
  ValidationGateResult,
} from "@/jag/runtime-lifecycle/contracts";

export { RuntimeLifecycleManager } from "@/jag/runtime-lifecycle/manager";
export {
  RUNTIME_GENERATOR_VERSION,
  checksumRuntimeSpecification,
  createRuntimeVersion,
  resetRuntimeVersionSequenceForTests,
} from "@/jag/runtime-lifecycle/versioning";
export {
  allowedTransitions,
  assertTransition,
  canTransition,
} from "@/jag/runtime-lifecycle/promotion";
export {
  DEFAULT_PUBLISH_APPROVAL_REQUIREMENTS,
  createApproval,
  hasRequiredApprovals,
} from "@/jag/runtime-lifecycle/approval";
export {
  compareSnapshots,
  createSnapshot,
  restoreCandidate,
} from "@/jag/runtime-lifecycle/snapshots";
export { createRollbackRecord } from "@/jag/runtime-lifecycle/rollback";
export {
  runApprovalReadyGate,
  runDiffAnalysisGate,
  runPublishReadyGate,
  runReferenceGate,
  runStructuralGate,
  runValidationGates,
} from "@/jag/runtime-lifecycle/validation";
export { buildLineage } from "@/jag/runtime-lifecycle/history";
export {
  createTestLifecycleManager,
  resetRuntimeLifecycleForTests,
} from "@/jag/runtime-lifecycle/testing";
