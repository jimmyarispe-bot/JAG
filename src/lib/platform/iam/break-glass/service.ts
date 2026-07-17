import type { IamAuditEmitter } from "@/lib/platform/iam/audit/emitter";
import type { AuthorizationEngine } from "@/lib/platform/iam/authorization/engine";
import type {
  BreakGlassStatus,
  IamAuthzSnapshot,
  IamBreakGlassSession,
} from "@/lib/platform/iam/types";

export type BreakGlassServiceDependencies = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  authorization: AuthorizationEngine;
  audit?: IamAuditEmitter | null;
  /** Default emergency TTL once activated. */
  defaultTtlMs?: number;
};

export class BreakGlassService {
  private readonly store = new Map<string, IamBreakGlassSession>();
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly authorization: AuthorizationEngine;
  private readonly audit: IamAuditEmitter | null;
  private readonly defaultTtlMs: number;

  constructor(dependencies: BreakGlassServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.authorization = dependencies.authorization;
    this.audit = dependencies.audit ?? null;
    this.defaultTtlMs = dependencies.defaultTtlMs ?? 60 * 60 * 1000;
  }

  request(input: {
    requester: IamAuthzSnapshot;
    organizationId: string;
    permissionKeys: readonly string[];
    reason: string;
    ticketRef?: string | null;
  }): IamBreakGlassSession {
    this.authorization.requirePermission(
      input.requester,
      "iam.break_glass.request"
    );
    if (!input.reason.trim()) {
      throw new Error("Break glass reason is required");
    }
    if (!input.permissionKeys.length) {
      throw new Error("Break glass requires at least one permission");
    }

    const session: IamBreakGlassSession = {
      id: this.createId("break-glass"),
      requesterUserId: input.requester.userId,
      approverUserId: null,
      organizationId: input.organizationId,
      permissionKeys: input.permissionKeys,
      reason: input.reason.trim(),
      ticketRef: input.ticketRef ?? null,
      status: "pending_approval",
      requestedAt: this.now().toISOString(),
      approvedAt: null,
      activatedAt: null,
      expiresAt: null,
      revokedAt: null,
    };
    this.store.set(session.id, session);
    this.audit?.emit({
      kind: "break_glass.requested",
      actorUserId: input.requester.userId,
      subjectUserId: input.requester.userId,
      organizationId: input.organizationId,
      detail: {
        sessionId: session.id,
        permissionKeys: session.permissionKeys,
        reason: session.reason,
        ticketRef: session.ticketRef,
      },
      immutable: true,
    });
    return session;
  }

  approve(sessionId: string, approver: IamAuthzSnapshot): IamBreakGlassSession {
    this.authorization.requirePermission(approver, "iam.break_glass.approve");
    const existing = this.require(sessionId);
    if (existing.status !== "pending_approval") {
      throw new Error(`Break glass session is not pending: ${sessionId}`);
    }
    if (approver.userId === existing.requesterUserId) {
      throw new Error("Break glass requester cannot approve their own request");
    }
    const updated: IamBreakGlassSession = {
      ...existing,
      status: "approved",
      approverUserId: approver.userId,
      approvedAt: this.now().toISOString(),
    };
    this.store.set(sessionId, updated);
    this.audit?.emit({
      kind: "break_glass.approved",
      actorUserId: approver.userId,
      subjectUserId: existing.requesterUserId,
      organizationId: existing.organizationId,
      detail: { sessionId },
      immutable: true,
    });
    return updated;
  }

  deny(sessionId: string, approver: IamAuthzSnapshot): IamBreakGlassSession {
    this.authorization.requirePermission(approver, "iam.break_glass.approve");
    const existing = this.require(sessionId);
    if (existing.status !== "pending_approval") {
      throw new Error(`Break glass session is not pending: ${sessionId}`);
    }
    const updated: IamBreakGlassSession = {
      ...existing,
      status: "denied",
      approverUserId: approver.userId,
      approvedAt: this.now().toISOString(),
    };
    this.store.set(sessionId, updated);
    this.audit?.emit({
      kind: "break_glass.denied",
      actorUserId: approver.userId,
      subjectUserId: existing.requesterUserId,
      organizationId: existing.organizationId,
      detail: { sessionId },
      immutable: true,
    });
    return updated;
  }

  activate(
    sessionId: string,
    actor: IamAuthzSnapshot,
    ttlMs?: number
  ): IamBreakGlassSession {
    const existing = this.require(sessionId);
    if (existing.status !== "approved") {
      throw new Error(`Break glass session is not approved: ${sessionId}`);
    }
    if (actor.userId !== existing.requesterUserId) {
      throw new Error("Only the requester may activate an approved session");
    }
    const activatedAt = this.now();
    const expiresAt = new Date(
      activatedAt.getTime() + (ttlMs ?? this.defaultTtlMs)
    );
    const updated: IamBreakGlassSession = {
      ...existing,
      status: "active",
      activatedAt: activatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    this.store.set(sessionId, updated);
    this.audit?.emit({
      kind: "break_glass.activated",
      actorUserId: actor.userId,
      subjectUserId: actor.userId,
      organizationId: existing.organizationId,
      detail: {
        sessionId,
        expiresAt: updated.expiresAt,
      },
      immutable: true,
    });
    return updated;
  }

  revoke(sessionId: string, actor: IamAuthzSnapshot): IamBreakGlassSession {
    this.authorization.requirePermission(actor, "iam.break_glass.approve");
    const existing = this.require(sessionId);
    if (existing.status !== "active" && existing.status !== "approved") {
      throw new Error(`Break glass session cannot be revoked: ${sessionId}`);
    }
    const updated: IamBreakGlassSession = {
      ...existing,
      status: "revoked",
      revokedAt: this.now().toISOString(),
    };
    this.store.set(sessionId, updated);
    this.audit?.emit({
      kind: "break_glass.revoked",
      actorUserId: actor.userId,
      subjectUserId: existing.requesterUserId,
      organizationId: existing.organizationId,
      detail: { sessionId },
      immutable: true,
    });
    return updated;
  }

  expireDue(): number {
    const nowMs = this.now().getTime();
    let count = 0;
    for (const [id, session] of this.store) {
      if (session.status !== "active" || !session.expiresAt) continue;
      if (new Date(session.expiresAt).getTime() > nowMs) continue;
      this.store.set(id, { ...session, status: "expired" });
      count += 1;
      this.audit?.emit({
        kind: "break_glass.expired",
        actorUserId: null,
        subjectUserId: session.requesterUserId,
        organizationId: session.organizationId,
        detail: { sessionId: id },
        immutable: true,
      });
    }
    return count;
  }

  listActiveForUser(userId: string): readonly IamBreakGlassSession[] {
    this.expireDue();
    const nowMs = this.now().getTime();
    return [...this.store.values()].filter(
      (s) =>
        s.requesterUserId === userId &&
        s.status === "active" &&
        s.expiresAt != null &&
        new Date(s.expiresAt).getTime() > nowMs
    );
  }

  overlayPermissionsForUser(userId: string): {
    permissions: string[];
    overlayIds: string[];
  } {
    const active = this.listActiveForUser(userId);
    const permissions = new Set<string>();
    const overlayIds: string[] = [];
    for (const s of active) {
      overlayIds.push(s.id);
      for (const key of s.permissionKeys) {
        permissions.add(key);
      }
    }
    return { permissions: [...permissions], overlayIds };
  }

  /** Record an action taken under an active break-glass session (immutable). */
  recordAction(
    sessionId: string,
    userId: string,
    detail: Readonly<Record<string, unknown>>
  ): void {
    const s = this.store.get(sessionId);
    if (!s || s.requesterUserId !== userId || s.status !== "active") return;
    this.audit?.emit({
      kind: "break_glass.action",
      actorUserId: userId,
      subjectUserId: userId,
      organizationId: s.organizationId,
      detail: { sessionId, ...detail },
      immutable: true,
    });
  }

  get(sessionId: string): IamBreakGlassSession | undefined {
    return this.store.get(sessionId);
  }

  list(status?: BreakGlassStatus): readonly IamBreakGlassSession[] {
    const all = [...this.store.values()];
    return status ? all.filter((s) => s.status === status) : all;
  }

  private require(sessionId: string): IamBreakGlassSession {
    const s = this.store.get(sessionId);
    if (!s) throw new Error(`Break glass session not found: ${sessionId}`);
    return s;
  }
}
