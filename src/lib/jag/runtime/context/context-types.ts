import type { RuntimeIdentity } from "../contracts/identity";
import type {
  RuntimeEntityRef,
  RuntimeOrganizationalContext,
} from "../contracts/organizational-context";

/**
 * Generic situational context — no domain object semantics.
 * Distinct from kernel {@link import("../contracts").RuntimeContext} (execution).
 */
export interface ContextSnapshot {
  contextId: string;
  /** Generic family key — not a product brand or domain type. */
  contextFamily: string;
  organizationId: string;
  /** Generic workspace identifier within the organization. */
  workspaceId?: string;
  /** Opaque focus object (type/id only — Runtime does not interpret). */
  focusObject?: RuntimeEntityRef;
  /** Opaque workflow reference. */
  workflowRef?: ContextRef;
  /** Opaque active task reference. */
  activeTaskRef?: ContextRef;
  /** Temporal window for the situation (ISO strings). */
  temporal?: ContextTemporal;
  /** Collaborative session metadata (opaque participant ids). */
  collaborative?: ContextCollaborative;
  /** Which domain packs may be consulted — opaque pack ids. */
  domainHints: readonly string[];
  /** Opaque party facet refs linked to identity — not domain types. */
  partyRefs?: readonly RuntimeEntityRef[];
  mode: "persistent" | "temporary";
  inheritedFrom?: string;
  parentContextId?: string;
  legacySurfaceId?: string;
  /** Nesting depth after inheritance merge (root = 0). */
  depth: number;
  attributes?: Readonly<Record<string, unknown>>;
  resolvedAt: string;
}

export interface ContextRef {
  id: string;
  type?: string;
}

export interface ContextTemporal {
  at?: string;
  rangeStart?: string;
  rangeEnd?: string;
}

export interface ContextCollaborative {
  sessionId?: string;
  participantIds?: readonly string[];
}

/** Discoverable context profile contribution from a provider. */
export interface AvailableContext {
  contextId: string;
  contextFamily: string;
  organizationId: string;
  label?: string;
  parentContextId?: string;
  domainHints?: readonly string[];
  requiredPermissions?: readonly string[];
  legacySurfaceId?: string;
  priority?: number;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ContextSelection {
  contextId?: string;
  workspaceId?: string;
  focusObject?: RuntimeEntityRef;
  workflowRef?: ContextRef;
  activeTaskRef?: ContextRef;
  temporal?: ContextTemporal;
  collaborative?: ContextCollaborative;
  legacySurfaceId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ContextResolutionRequest {
  identity: RuntimeIdentity;
  selection?: ContextSelection;
  /** When true, prefer temporary overlay if present in store. */
  includeTemporary?: boolean;
  correlationId?: string;
  sessionId?: string;
  now?: string;
  signal?: AbortSignal;
}

export type ContextResolutionOutcome =
  | { status: "resolved"; value: ContextSnapshot }
  | { status: "empty"; reason: string };

export interface ContextSnapshotRecord {
  snapshotId: string;
  snapshot: ContextSnapshot;
  persistent: ContextSnapshot | null;
  temporary: ContextSnapshot | null;
  createdAt: string;
}

/** Map situational snapshot onto kernel organizational context contract. */
export function toOrganizationalContext(
  snapshot: ContextSnapshot
): RuntimeOrganizationalContext {
  return {
    contextId: snapshot.contextId,
    contextFamily: snapshot.contextFamily,
    organizationId: snapshot.organizationId,
    focusEntity: snapshot.focusObject,
    domainHints: snapshot.domainHints,
    mode: snapshot.mode,
    inheritedFrom: snapshot.inheritedFrom ?? snapshot.parentContextId,
    legacySurfaceId: snapshot.legacySurfaceId,
    attributes: {
      ...(snapshot.attributes ?? {}),
      workspaceId: snapshot.workspaceId,
      workflowRef: snapshot.workflowRef,
      activeTaskRef: snapshot.activeTaskRef,
      temporal: snapshot.temporal,
      collaborative: snapshot.collaborative,
      partyRefs: snapshot.partyRefs,
      depth: snapshot.depth,
      resolvedAt: snapshot.resolvedAt,
    },
  };
}

export type { RuntimeEntityRef, RuntimeIdentity, RuntimeOrganizationalContext };
