export type {
  ProcessContext,
  ProcessDefinition,
  ProcessEvent,
  ProcessEventType,
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
} from "@/jag/processes/contracts/definitions";

export type {
  CommunicationsExtensionPort,
  DocumentsExtensionPort,
  EntityExtensionPort,
  ExtensionCallResult,
  FormsExtensionPort,
  IntelligenceExtensionPort,
  NavigationExtensionPort,
  ProcessExtensionPorts,
  WorkflowExtensionPort,
} from "@/jag/processes/contracts/extensions";

export {
  bindProcessExtensions,
  getProcessExtensions,
  resetProcessExtensionsForTests,
} from "@/jag/processes/contracts/extensions";

export type {
  JagProcessDefinition,
  JagProcessId,
  JagProcessRuntimePort,
  JagProcessStageDefinition,
  JagProcessStageId,
} from "@/jag/processes/contracts/compat";

export { normalizeProcessDefinition } from "@/jag/processes/contracts/compat";
