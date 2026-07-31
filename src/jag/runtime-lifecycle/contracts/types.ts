/**
 * Runtime Lifecycle Manager contracts — govern generated Runtime Specifications.
 */

import type { IndustryId, RuntimeSpecification } from "@/jag/blueprints/contracts";
import type { RuntimeSpecificationDiff } from "@/jag/runtime-generation/contracts";

/** Universal lifecycle promotion states. */
export type RuntimeLifecycleState =
  | "draft"
  | "validated"
  | "approved"
  | "published"
  | "archived";

export type RuntimeApprovalKind =
  | "technical"
  | "organization"
  | "compliance"
  | (string & {});

export type RuntimeApproval = {
  readonly id: string;
  readonly kind: RuntimeApprovalKind;
  readonly approverId: string;
  readonly approvedAt: string;
  readonly notes?: string;
};

export type CapabilityPackVersionRef = {
  readonly packId: string;
  readonly version: string;
};

/**
 * Immutable runtime version — a generated Runtime Specification is never edited.
 * New generation = new version.
 */
export type RuntimeVersion = {
  readonly versionId: string;
  readonly createdAt: string;
  readonly state: RuntimeLifecycleState;
  readonly specification: RuntimeSpecification;
  readonly checksum: string;
  readonly generatorVersion: string;
  readonly industryId: IndustryId;
  readonly industryBlueprintVersion: string;
  readonly organizationId: string;
  readonly organizationBlueprintVersion: string;
  readonly packageId: string;
  readonly applicationId: string;
  readonly capabilityPackVersions: readonly CapabilityPackVersionRef[];
  readonly parentVersionId?: string;
  readonly approvals: readonly RuntimeApproval[];
  readonly labels?: readonly string[];
};

export type RuntimeSnapshot = {
  readonly snapshotId: string;
  readonly versionId: string;
  readonly createdAt: string;
  readonly checksum: string;
  readonly label?: string;
  readonly specification: RuntimeSpecification;
};

export type RuntimeRollbackRecord = {
  readonly rollbackId: string;
  readonly fromVersionId: string;
  readonly toVersionId: string;
  readonly reason: string;
  readonly approvalId?: string;
  readonly createdAt: string;
  /** Metadata only — execution is out of scope for Sprint 018. */
  readonly executed: false;
};

export type RuntimePromotionEvent = {
  readonly eventId: string;
  readonly versionId: string;
  readonly fromState: RuntimeLifecycleState;
  readonly toState: RuntimeLifecycleState;
  readonly at: string;
  readonly actorId?: string;
  readonly notes?: string;
};

export type RuntimeHistoryEntry = {
  readonly entryId: string;
  readonly at: string;
  readonly kind:
    | "version_created"
    | "gate_passed"
    | "gate_failed"
    | "approval_added"
    | "promoted"
    | "snapshot_created"
    | "rollback_recorded"
    | "archived";
  readonly organizationId: string;
  readonly versionId?: string;
  readonly snapshotId?: string;
  readonly rollbackId?: string;
  readonly detail?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
};

export type RuntimeLineage = {
  readonly organizationId: string;
  readonly industryId: IndustryId;
  readonly versions: readonly RuntimeVersion[];
  readonly promotions: readonly RuntimePromotionEvent[];
  readonly snapshots: readonly RuntimeSnapshot[];
  readonly rollbacks: readonly RuntimeRollbackRecord[];
  readonly history: readonly RuntimeHistoryEntry[];
  readonly publishedVersionId?: string;
};

export type ValidationGateId =
  | "structural"
  | "reference"
  | "diff_analysis"
  | "approval_ready"
  | "publish_ready";

export type ValidationGateResult = {
  readonly gateId: ValidationGateId;
  readonly ok: boolean;
  readonly messages: readonly string[];
};

export type LifecycleOperationResult<T = void> = {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: { readonly code: string; readonly message: string };
  readonly gateResults?: readonly ValidationGateResult[];
};

export type CreateRuntimeVersionInput = {
  readonly specification: RuntimeSpecification;
  readonly industryId: IndustryId;
  readonly industryBlueprintVersion: string;
  readonly organizationId: string;
  readonly organizationBlueprintVersion: string;
  readonly packageId: string;
  readonly applicationId: string;
  readonly capabilityPackVersions?: readonly CapabilityPackVersionRef[];
  readonly generatorVersion?: string;
  readonly parentVersionId?: string;
  readonly labels?: readonly string[];
  /** Injectable clock for deterministic tests. */
  readonly createdAt?: string;
  readonly versionId?: string;
};

export type SnapshotCompareResult = {
  readonly leftSnapshotId: string;
  readonly rightSnapshotId: string;
  readonly identical: boolean;
  readonly diff: RuntimeSpecificationDiff;
};
