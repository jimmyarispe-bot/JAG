/**
 * Runtime Lifecycle Manager — in-memory control plane (no persistence).
 */

import type { RuntimeSpecification } from "@/jag/blueprints/contracts";
import {
  createApproval,
  hasRequiredApprovals,
} from "@/jag/runtime-lifecycle/approval";
import type {
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
} from "@/jag/runtime-lifecycle/contracts";
import { appendHistory, buildLineage } from "@/jag/runtime-lifecycle/history";
import { assertTransition } from "@/jag/runtime-lifecycle/promotion";
import { createRollbackRecord } from "@/jag/runtime-lifecycle/rollback";
import {
  compareSnapshots,
  createSnapshot,
  restoreCandidate,
} from "@/jag/runtime-lifecycle/snapshots";
import {
  runApprovalReadyGate,
  runPublishReadyGate,
  runValidationGates,
} from "@/jag/runtime-lifecycle/validation";
import { createRuntimeVersion } from "@/jag/runtime-lifecycle/versioning";

export type RuntimeLifecycleManagerOptions = {
  readonly now?: () => string;
};

export class RuntimeLifecycleManager {
  private readonly versions = new Map<string, RuntimeVersion>();
  private readonly snapshots = new Map<string, RuntimeSnapshot>();
  private readonly promotions: RuntimePromotionEvent[] = [];
  private readonly rollbacks: RuntimeRollbackRecord[] = [];
  private readonly history: RuntimeHistoryEntry[] = [];
  private publishedByOrg = new Map<string, string>();
  private promotionSeq = 0;
  private readonly now: () => string;

  constructor(options: RuntimeLifecycleManagerOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  clear(): void {
    this.versions.clear();
    this.snapshots.clear();
    this.promotions.length = 0;
    this.rollbacks.length = 0;
    this.history.length = 0;
    this.publishedByOrg.clear();
    this.promotionSeq = 0;
  }

  createVersion(
    input: CreateRuntimeVersionInput
  ): LifecycleOperationResult<RuntimeVersion> {
    const version = createRuntimeVersion({
      ...input,
      createdAt: input.createdAt ?? this.now(),
    });
    this.versions.set(version.versionId, version);
    appendHistory(this.history, {
      at: version.createdAt,
      kind: "version_created",
      organizationId: version.organizationId,
      versionId: version.versionId,
      detail: `checksum=${version.checksum}`,
      payload: Object.freeze({
        state: version.state,
        parentVersionId: version.parentVersionId,
      }),
    });
    return { ok: true, value: version };
  }

  getVersion(versionId: string): RuntimeVersion | undefined {
    return this.versions.get(versionId);
  }

  listVersions(organizationId?: string): readonly RuntimeVersion[] {
    const all = [...this.versions.values()];
    const filtered = organizationId
      ? all.filter((v) => v.organizationId === organizationId)
      : all;
    return Object.freeze(
      filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
  }

  /** Draft → Validated via structural / reference / diff gates. */
  validate(
    versionId: string,
    previousSpecification?: RuntimeSpecification
  ): LifecycleOperationResult<RuntimeVersion> {
    const current = this.versions.get(versionId);
    if (!current) {
      return {
        ok: false,
        error: { code: "not_found", message: `Unknown version ${versionId}` },
      };
    }
    const prev =
      previousSpecification ??
      (current.parentVersionId
        ? this.versions.get(current.parentVersionId)?.specification
        : undefined);

    const gateResults = runValidationGates(current, prev);
    const failed = gateResults.filter((g) => !g.ok);
    if (failed.length) {
      appendHistory(this.history, {
        at: this.now(),
        kind: "gate_failed",
        organizationId: current.organizationId,
        versionId,
        detail: failed.map((f) => f.gateId).join(","),
      });
      return {
        ok: false,
        gateResults,
        error: {
          code: "validation_gates_failed",
          message: failed.map((f) => f.messages.join("; ")).join(" | "),
        },
      };
    }

    appendHistory(this.history, {
      at: this.now(),
      kind: "gate_passed",
      organizationId: current.organizationId,
      versionId,
      detail: "structural,reference,diff_analysis",
    });

    return this.promote(versionId, "validated");
  }

  addApproval(
    versionId: string,
    input: {
      readonly kind: RuntimeApprovalKind;
      readonly approverId: string;
      readonly notes?: string;
      readonly id?: string;
    }
  ): LifecycleOperationResult<RuntimeVersion> {
    const current = this.versions.get(versionId);
    if (!current) {
      return {
        ok: false,
        error: { code: "not_found", message: `Unknown version ${versionId}` },
      };
    }
    if (current.state !== "validated" && current.state !== "approved") {
      return {
        ok: false,
        error: {
          code: "invalid_state",
          message: `Approvals only accepted in validated or approved (current: ${current.state})`,
        },
      };
    }

    const approval = createApproval({
      ...input,
      approvedAt: this.now(),
    });
    const next: RuntimeVersion = Object.freeze({
      ...current,
      approvals: Object.freeze([...current.approvals, approval]),
    });
    this.versions.set(versionId, next);
    appendHistory(this.history, {
      at: approval.approvedAt,
      kind: "approval_added",
      organizationId: next.organizationId,
      versionId,
      detail: `${approval.kind}:${approval.approverId}`,
    });
    return { ok: true, value: next };
  }

  promote(
    versionId: string,
    toState: RuntimeLifecycleState,
    options: { readonly actorId?: string; readonly notes?: string } = {}
  ): LifecycleOperationResult<RuntimeVersion> {
    const current = this.versions.get(versionId);
    if (!current) {
      return {
        ok: false,
        error: { code: "not_found", message: `Unknown version ${versionId}` },
      };
    }

    const transition = assertTransition(current.state, toState);
    if (!transition.ok) {
      return {
        ok: false,
        error: { code: transition.code, message: transition.message },
      };
    }

    if (toState === "approved") {
      const gate = runApprovalReadyGate(current);
      if (!gate.ok) {
        return {
          ok: false,
          gateResults: [gate],
          error: {
            code: "approval_ready_failed",
            message: gate.messages.join("; "),
          },
        };
      }
    }

    if (toState === "published") {
      const gate = runPublishReadyGate(
        current.state === "approved"
          ? current
          : Object.freeze({ ...current, state: "approved" as const })
      );
      // Publish requires approved state + approvals on the current version
      if (current.state !== "approved") {
        return {
          ok: false,
          error: {
            code: "publish_requires_approved",
            message: "Publish requires state approved",
          },
        };
      }
      if (!hasRequiredApprovals(current.approvals)) {
        return {
          ok: false,
          gateResults: [runPublishReadyGate(current)],
          error: {
            code: "publish_ready_failed",
            message: "Missing required approvals",
          },
        };
      }
      void gate;
    }

    const at = this.now();
    const next: RuntimeVersion = Object.freeze({
      ...current,
      state: toState,
    });
    this.versions.set(versionId, next);

    this.promotionSeq += 1;
    const event: RuntimePromotionEvent = Object.freeze({
      eventId: `promotion.${this.promotionSeq}`,
      versionId,
      fromState: current.state,
      toState,
      at,
      actorId: options.actorId,
      notes: options.notes,
    });
    this.promotions.push(event);

    if (toState === "published") {
      const previousPublished = this.publishedByOrg.get(next.organizationId);
      if (previousPublished && previousPublished !== versionId) {
        const prev = this.versions.get(previousPublished);
        if (prev && prev.state === "published") {
          this.versions.set(
            previousPublished,
            Object.freeze({ ...prev, state: "archived" })
          );
          appendHistory(this.history, {
            at,
            kind: "archived",
            organizationId: next.organizationId,
            versionId: previousPublished,
            detail: "superseded_by_publish",
          });
        }
      }
      this.publishedByOrg.set(next.organizationId, versionId);
    }

    appendHistory(this.history, {
      at,
      kind: toState === "archived" ? "archived" : "promoted",
      organizationId: next.organizationId,
      versionId,
      detail: `${current.state}→${toState}`,
    });

    return { ok: true, value: next };
  }

  createSnapshot(
    versionId: string,
    options: { readonly label?: string } = {}
  ): LifecycleOperationResult<RuntimeSnapshot> {
    const version = this.versions.get(versionId);
    if (!version) {
      return {
        ok: false,
        error: { code: "not_found", message: `Unknown version ${versionId}` },
      };
    }
    const snapshot = createSnapshot(version, {
      label: options.label,
      createdAt: this.now(),
    });
    this.snapshots.set(snapshot.snapshotId, snapshot);
    appendHistory(this.history, {
      at: snapshot.createdAt,
      kind: "snapshot_created",
      organizationId: version.organizationId,
      versionId,
      snapshotId: snapshot.snapshotId,
      detail: options.label,
    });
    return { ok: true, value: snapshot };
  }

  listSnapshots(versionId?: string): readonly RuntimeSnapshot[] {
    const all = [...this.snapshots.values()];
    const filtered = versionId
      ? all.filter((s) => s.versionId === versionId)
      : all;
    return Object.freeze(
      filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
  }

  compareSnapshots(
    leftSnapshotId: string,
    rightSnapshotId: string
  ): LifecycleOperationResult<SnapshotCompareResult> {
    const left = this.snapshots.get(leftSnapshotId);
    const right = this.snapshots.get(rightSnapshotId);
    if (!left || !right) {
      return {
        ok: false,
        error: {
          code: "not_found",
          message: "One or both snapshots not found",
        },
      };
    }
    return { ok: true, value: compareSnapshots(left, right) };
  }

  restoreCandidate(snapshotId: string) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return {
        ok: false as const,
        error: { code: "not_found", message: `Unknown snapshot ${snapshotId}` },
      };
    }
    return { ok: true as const, value: restoreCandidate(snapshot) };
  }

  recordRollback(input: {
    readonly fromVersionId: string;
    readonly toVersionId: string;
    readonly reason: string;
    readonly approvalId?: string;
  }): LifecycleOperationResult<RuntimeRollbackRecord> {
    const from = this.versions.get(input.fromVersionId);
    const to = this.versions.get(input.toVersionId);
    if (!from || !to) {
      return {
        ok: false,
        error: {
          code: "not_found",
          message: "Rollback versions must both exist",
        },
      };
    }
    if (from.organizationId !== to.organizationId) {
      return {
        ok: false,
        error: {
          code: "org_mismatch",
          message: "Rollback versions must belong to the same organization",
        },
      };
    }
    try {
      const record = createRollbackRecord({
        ...input,
        createdAt: this.now(),
      });
      this.rollbacks.push(record);
      appendHistory(this.history, {
        at: record.createdAt,
        kind: "rollback_recorded",
        organizationId: from.organizationId,
        versionId: input.fromVersionId,
        rollbackId: record.rollbackId,
        detail: record.reason,
        payload: Object.freeze({ toVersionId: input.toVersionId }),
      });
      return { ok: true, value: record };
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "rollback_invalid",
          message: e instanceof Error ? e.message : "Invalid rollback",
        },
      };
    }
  }

  getLineage(organizationId: string): RuntimeLineage | undefined {
    const versions = this.listVersions(organizationId);
    if (!versions.length) return undefined;
    return buildLineage({
      organizationId,
      industryId: versions[0]!.industryId,
      versions,
      promotions: this.promotions.filter((p) =>
        versions.some((v) => v.versionId === p.versionId)
      ),
      snapshots: [...this.snapshots.values()].filter((s) =>
        versions.some((v) => v.versionId === s.versionId)
      ),
      rollbacks: this.rollbacks.filter((r) =>
        versions.some(
          (v) =>
            v.versionId === r.fromVersionId || v.versionId === r.toVersionId
        )
      ),
      history: this.history.filter((h) => h.organizationId === organizationId),
    });
  }

  getPublishedVersion(organizationId: string): RuntimeVersion | undefined {
    const id = this.publishedByOrg.get(organizationId);
    return id ? this.versions.get(id) : undefined;
  }

  /** Expose approvals list helper for tests. */
  listApprovals(versionId: string): readonly RuntimeApproval[] {
    return this.versions.get(versionId)?.approvals ?? Object.freeze([]);
  }
}
