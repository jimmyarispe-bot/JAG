import type { RuntimeEvidenceReference } from "../contracts/evidence";
import type { RuntimeIdentity } from "../contracts/identity";
import type { RuntimeIntent } from "../contracts/intent";
import type { RuntimeOrganizationalContext } from "../contracts/organizational-context";
import type { CognitiveResult } from "../cognition/cognition-types";

/** Generic action kinds — no domain semantics. */
export type ActionKind =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "assign"
  | "notify"
  | "schedule"
  | "generate"
  | "delegate"
  | "review"
  | "investigate"
  | "custom";

export interface ActionCatalogEntry {
  actionId: string;
  kind: ActionKind;
  /** Permission key required to execute. */
  permission: string;
  label?: string;
  requiresConfirmation?: boolean;
  /** When true (default), evidence refs are mandatory. */
  requiresEvidence?: boolean;
  /** When true (default), CognitiveResult is mandatory. */
  requiresCognition?: boolean;
  attributes?: Readonly<Record<string, unknown>>;
}

/**
 * Full execution request — richer than kernel {@link RuntimeActionRequest}.
 */
export interface ActionExecutionRequest {
  actionId: string;
  identity: RuntimeIdentity;
  organizationalContext: RuntimeOrganizationalContext;
  intent?: RuntimeIntent;
  cognition: CognitiveResult;
  /** Law 7 — mutating execution requires evidence. */
  evidenceRefs: readonly RuntimeEvidenceReference[];
  cognitionRecommendationId?: string;
  payload?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  confirmationToken?: string;
  correlationId?: string;
  sessionId?: string;
  signal?: AbortSignal;
  now?: string;
}
