import type { IamAuditEmitter } from "@/lib/platform/iam/audit/emitter";
import type { AuthorizationEngine } from "@/lib/platform/iam/authorization/engine";
import type {
  IamAuthzSnapshot,
  IamDelegation,
  IamDelegationStatus,
} from "@/lib/platform/iam/types";

export type DelegationServiceDependencies = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  authorization: AuthorizationEngine;
  audit?: IamAuditEmitter | null;
};

export class DelegationService {
  private readonly store = new Map<string, IamDelegation>();
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly authorization: AuthorizationEngine;
  private readonly audit: IamAuditEmitter | null;

  constructor(dependencies: DelegationServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.authorization = dependencies.authorization;
    this.audit = dependencies.audit ?? null;
  }

  grant(input: {
    grantor: IamAuthzSnapshot;
    granteeUserId: string;
    organizationId?: string | null;
    permissionKeys: readonly string[];
    reason: string;
    startsAt?: string;
    expiresAt: string;
  }): IamDelegation {
    this.authorization.requirePermission(input.grantor, "iam.delegation.grant");
    if (!input.reason.trim()) {
      throw new Error("Delegation reason is required");
    }
    if (!input.permissionKeys.length) {
      throw new Error("Delegation requires at least one permission");
    }

    // Grantor cannot delegate permissions they do not hold.
    for (const key of input.permissionKeys) {
      if (!this.authorization.hasPermission(input.grantor, key)) {
        throw new Error(`Grantor lacks permission to delegate: ${key}`);
      }
    }

    const startsAt = input.startsAt ?? this.now().toISOString();
    if (new Date(input.expiresAt).getTime() <= new Date(startsAt).getTime()) {
      throw new Error("Delegation expiration must be after start");
    }

    const delegation: IamDelegation = {
      id: this.createId("delegation"),
      grantorUserId: input.grantor.userId,
      granteeUserId: input.granteeUserId,
      organizationId: input.organizationId ?? input.grantor.organizationId,
      permissionKeys: input.permissionKeys,
      reason: input.reason.trim(),
      startsAt,
      expiresAt: input.expiresAt,
      revokedAt: null,
      status: "active",
    };
    this.store.set(delegation.id, delegation);
    this.audit?.emit({
      kind: "delegation.granted",
      actorUserId: input.grantor.userId,
      subjectUserId: input.granteeUserId,
      organizationId: delegation.organizationId,
      detail: {
        delegationId: delegation.id,
        permissionKeys: delegation.permissionKeys,
        reason: delegation.reason,
        expiresAt: delegation.expiresAt,
      },
    });
    return delegation;
  }

  revoke(delegationId: string, actor: IamAuthzSnapshot): IamDelegation {
    this.authorization.requirePermission(actor, "iam.delegation.revoke");
    const existing = this.require(delegationId);
    const updated: IamDelegation = {
      ...existing,
      revokedAt: this.now().toISOString(),
      status: "revoked",
    };
    this.store.set(delegationId, updated);
    this.audit?.emit({
      kind: "delegation.revoked",
      actorUserId: actor.userId,
      subjectUserId: existing.granteeUserId,
      organizationId: existing.organizationId,
      detail: { delegationId },
    });
    return updated;
  }

  /** Expire due delegations; returns count expired. */
  expireDue(): number {
    const nowMs = this.now().getTime();
    let count = 0;
    for (const [id, delegation] of this.store) {
      if (delegation.status !== "active") continue;
      if (new Date(delegation.expiresAt).getTime() > nowMs) continue;
      const updated: IamDelegation = { ...delegation, status: "expired" };
      this.store.set(id, updated);
      count += 1;
      this.audit?.emit({
        kind: "delegation.expired",
        actorUserId: null,
        subjectUserId: delegation.granteeUserId,
        organizationId: delegation.organizationId,
        detail: { delegationId: id },
      });
    }
    return count;
  }

  listActiveForUser(userId: string): readonly IamDelegation[] {
    this.expireDue();
    const nowMs = this.now().getTime();
    return [...this.store.values()].filter(
      (d) =>
        d.granteeUserId === userId &&
        d.status === "active" &&
        new Date(d.startsAt).getTime() <= nowMs &&
        new Date(d.expiresAt).getTime() > nowMs
    );
  }

  overlayPermissionsForUser(userId: string): {
    permissions: string[];
    overlayIds: string[];
  } {
    const active = this.listActiveForUser(userId);
    const permissions = new Set<string>();
    const overlayIds: string[] = [];
    for (const d of active) {
      overlayIds.push(d.id);
      for (const key of d.permissionKeys) {
        permissions.add(key);
      }
    }
    return { permissions: [...permissions], overlayIds };
  }

  /** Optional audit when a delegated permission is exercised. */
  recordUse(delegationId: string, userId: string, permission: string): void {
    const d = this.store.get(delegationId);
    if (!d || d.granteeUserId !== userId || d.status !== "active") return;
    this.audit?.emit({
      kind: "delegation.used",
      actorUserId: userId,
      subjectUserId: userId,
      organizationId: d.organizationId,
      permission,
      detail: { delegationId },
    });
  }

  get(delegationId: string): IamDelegation | undefined {
    return this.store.get(delegationId);
  }

  list(status?: IamDelegationStatus): readonly IamDelegation[] {
    const all = [...this.store.values()];
    return status ? all.filter((d) => d.status === status) : all;
  }

  private require(delegationId: string): IamDelegation {
    const d = this.store.get(delegationId);
    if (!d) throw new Error(`Delegation not found: ${delegationId}`);
    return d;
  }
}
