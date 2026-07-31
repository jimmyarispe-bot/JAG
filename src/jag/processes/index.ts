/**
 * JAG OS — Universal Process Engine (public API).
 */

export type {
  CommunicationsExtensionPort,
  DocumentsExtensionPort,
  EntityExtensionPort,
  ExtensionCallResult,
  FormsExtensionPort,
  IntelligenceExtensionPort,
  JagProcessDefinition,
  JagProcessId,
  JagProcessRuntimePort,
  JagProcessStageDefinition,
  JagProcessStageId,
  NavigationExtensionPort,
  ProcessContext,
  ProcessDefinition,
  ProcessEvent,
  ProcessEventType,
  ProcessExtensionPorts,
  ProcessId,
  ProcessInstance,
  ProcessInstanceId,
  ProcessInstanceStatus,
  ProcessMetrics,
  ProcessParticipant,
  ProcessPermission,
  ProcessPermissionAction,
  ProcessResult,
  ProcessResultError,
  ProcessSnapshot,
  StageBehavior,
  StageDefinition,
  StageHistoryEntry,
  StageId,
  StageTransition,
  WorkflowExtensionPort,
} from "@/jag/processes/contracts";

export {
  bindProcessExtensions,
  getProcessExtensions,
  normalizeProcessDefinition,
  resetProcessExtensionsForTests,
} from "@/jag/processes/contracts";

export {
  ProcessRegistry,
  assertProcessRegistered,
  getJagProcessDefinition,
  getProcessDefinition,
  listJagProcessDefinitions,
  listProcessDefinitions,
  registerJagProcessDefinition,
  registerProcess,
  resetJagProcessRegistryForTests,
  resetProcessRegistryForTests,
  unregisterProcess,
  validateProcessRegistryDependencies,
} from "@/jag/processes/registry";

export {
  ProcessRuntime,
  cancelProcess,
  completeProcess,
  getProcessInstance,
  listProcessInstances,
  listProcessSnapshots,
  processNow,
  resetProcessClockForTests,
  resetProcessIdsForTests,
  resetProcessInstanceStoreForTests,
  restoreSnapshot,
  resumeProcess,
  setProcessClockForTests,
  setProcessIdPrefixForTests,
  startProcess,
  suspendProcess,
  transitionProcess,
} from "@/jag/processes/runtime";

export {
  StageRuntime,
  enterStage,
  executeStage,
  leaveStage,
  validateStage,
} from "@/jag/processes/execution";

export type { LifecycleHookHandler, LifecycleHookName } from "@/jag/processes/lifecycle";
export {
  listLifecycleHookNames,
  registerLifecycleHook,
  resetLifecycleHooksForTests,
  runLifecycleHooks,
} from "@/jag/processes/lifecycle";

export {
  emitProcessEvent,
  listProcessEvents,
  resetProcessEventsForTests,
  subscribeProcessEvents,
} from "@/jag/processes/events";

export { checkProcessPermission } from "@/jag/processes/permissions";

export type {
  ProcessEventRepository,
  ProcessPersistencePorts,
  ProcessRepository,
  ProcessSnapshotRepository,
} from "@/jag/processes/persistence";

export type { ProcessTelemetryEvent } from "@/jag/processes/telemetry";
export {
  getProcessMetrics,
  resetProcessTelemetryForTests,
  subscribeProcessTelemetry,
  trackParticipantAction,
  trackProcessCancellation,
  trackProcessCompletion,
  trackProcessStart,
  trackStageChange,
} from "@/jag/processes/telemetry";

export {
  createTestProcessDefinition,
  freezeProcessEngineForTests,
  resetProcessEngineForTests,
} from "@/jag/processes/testing";
