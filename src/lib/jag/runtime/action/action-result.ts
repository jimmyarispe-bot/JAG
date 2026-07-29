import type { RuntimeAction, RuntimeActionStatus } from "../contracts/action";
import type { RuntimeEvidenceReference } from "../contracts/evidence";
import type { RuntimeMemoryReference } from "../contracts/memory";
import type { RuntimeTwinReference } from "../contracts/twin";
import type {
  ActionGateRequirement,
  RuntimeActionRejected,
} from "./action-types";

/**
 * Normalized action execution result.
 * Compatible with kernel {@link RuntimeAction}.
 */
export interface RuntimeActionResult {
  actionId: string;
  status: RuntimeActionStatus;
  providerId?: string;
  domainPackageId?: string;
  workflowInstanceId?: string;
  evidenceRefs: readonly RuntimeEvidenceReference[];
  memoryRefs: readonly RuntimeMemoryReference[];
  twinRefs: readonly RuntimeTwinReference[];
  auditEventId: string;
  undoToken?: string;
  error?: { code: string; message: string };
  /** Present when status is rejected due to gate failure. */
  missing?: readonly ActionGateRequirement[];
  attributes?: Readonly<Record<string, unknown>>;
  completedAt: string;
}

export function isActionRejected(
  result: RuntimeActionResult
): result is RuntimeActionResult & RuntimeActionRejected {
  return result.status === "rejected";
}

export function toActionRejected(
  result: RuntimeActionResult
): RuntimeActionRejected | null {
  if (result.status !== "rejected") return null;
  return {
    status: "rejected",
    actionId: result.actionId,
    code: result.error?.code ?? "ACTION_REJECTED",
    message: result.error?.message ?? "Action rejected",
    auditEventId: result.auditEventId,
    missing: result.missing,
    completedAt: result.completedAt,
  };
}

export function toRuntimeAction(result: RuntimeActionResult): RuntimeAction {
  return {
    actionId: result.actionId,
    status: result.status,
    domainPackageId: result.domainPackageId,
    workflowInstanceId: result.workflowInstanceId,
    evidenceRefs: result.evidenceRefs,
    memoryRefs: result.memoryRefs,
    twinRefs: result.twinRefs,
    undoToken: result.undoToken,
    error: result.error,
    attributes: {
      ...(result.attributes ?? {}),
      providerId: result.providerId,
      auditEventId: result.auditEventId,
      completedAt: result.completedAt,
    },
  };
}

export function rejectedResult(
  actionId: string,
  auditEventId: string,
  code: string,
  message: string,
  nowIso: string,
  missing?: readonly ActionGateRequirement[]
): RuntimeActionResult {
  return {
    actionId,
    status: "rejected",
    evidenceRefs: [],
    memoryRefs: [],
    twinRefs: [],
    auditEventId,
    error: { code, message },
    missing,
    completedAt: nowIso,
  };
}

export function failedResult(
  actionId: string,
  auditEventId: string,
  code: string,
  message: string,
  nowIso: string,
  providerId?: string
): RuntimeActionResult {
  return {
    actionId,
    status: "failed",
    providerId,
    evidenceRefs: [],
    memoryRefs: [],
    twinRefs: [],
    auditEventId,
    error: { code, message },
    completedAt: nowIso,
  };
}
