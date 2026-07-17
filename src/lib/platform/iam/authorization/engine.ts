/**
 * IAM authorization engine — permission-only decisions.
 */

import type { IamAuditEmitter } from "@/lib/platform/iam/audit/emitter";
import type {
  AuthorizationDecision,
  IamAuthzSnapshot,
  IamAuthzSubject,
} from "@/lib/platform/iam/types";

export class PermissionDeniedError extends Error {
  readonly permission: string;
  readonly userId: string;

  constructor(permission: string, userId: string) {
    super(`Permission denied: ${permission}`);
    this.name = "PermissionDeniedError";
    this.permission = permission;
    this.userId = userId;
  }
}

export type AuthorizationEngineDependencies = {
  now?: () => Date;
  audit?: IamAuditEmitter | null;
  /** When true, every decision emits an audit event. Default: emit denials only. */
  auditAllDecisions?: boolean;
};

export function toIamAuthzSnapshot(subject: IamAuthzSubject): IamAuthzSnapshot {
  if (
    "permissions" in subject &&
    subject.permissions instanceof Set &&
    "userId" in subject &&
    typeof (subject as IamAuthzSnapshot).userId === "string" &&
    Array.isArray((subject as IamAuthzSnapshot).roles)
  ) {
    const snap = subject as IamAuthzSnapshot;
    return {
      userId: snap.userId,
      roles: snap.roles,
      permissions: snap.permissions,
      organizationId: snap.organizationId ?? null,
      overlayIds: snap.overlayIds ?? [],
    };
  }

  const permissions = subject.permissions;
  const set =
    permissions instanceof Set ? permissions : new Set(permissions ?? []);
  const userId =
    ("userId" in subject && subject.userId) ||
    ("id" in subject && subject.id) ||
    "";

  return {
    userId,
    roles: subject.roles ?? [],
    permissions: set,
    organizationId:
      "organizationId" in subject ? (subject.organizationId ?? null) : null,
    overlayIds: "overlayIds" in subject ? (subject.overlayIds ?? []) : [],
  };
}

export function buildIamAuthzSnapshot(input: {
  userId: string;
  roles?: readonly string[];
  permissions: Iterable<string>;
  organizationId?: string | null;
  overlayIds?: readonly string[];
}): IamAuthzSnapshot {
  return {
    userId: input.userId,
    roles: input.roles ?? [],
    permissions: new Set(input.permissions),
    organizationId: input.organizationId ?? null,
    overlayIds: input.overlayIds ?? [],
  };
}

export class AuthorizationEngine {
  private readonly now: () => Date;
  private readonly audit: IamAuditEmitter | null;
  private readonly auditAllDecisions: boolean;

  constructor(dependencies: AuthorizationEngineDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.audit = dependencies.audit ?? null;
    this.auditAllDecisions = dependencies.auditAllDecisions ?? false;
  }

  authorize(snapshot: IamAuthzSnapshot, permission: string): boolean {
    const allowed = snapshot.permissions.has(permission);
    this.emitDecision(snapshot, permission, allowed);
    return allowed;
  }

  hasPermission(subject: IamAuthzSubject, permission: string): boolean {
    return this.authorize(toIamAuthzSnapshot(subject), permission);
  }

  hasAnyPermission(
    subject: IamAuthzSubject,
    permissions: readonly string[]
  ): boolean {
    const snapshot = toIamAuthzSnapshot(subject);
    return permissions.some((p) => this.authorize(snapshot, p));
  }

  hasAllPermissions(
    subject: IamAuthzSubject,
    permissions: readonly string[]
  ): boolean {
    const snapshot = toIamAuthzSnapshot(subject);
    return permissions.every((p) => this.authorize(snapshot, p));
  }

  /**
   * Require a permission or throw PermissionDeniedError.
   * Always capable of producing an audit event via the engine hook.
   */
  requirePermission(subject: IamAuthzSubject, permission: string): void {
    const snapshot = toIamAuthzSnapshot(subject);
    if (!this.authorize(snapshot, permission)) {
      throw new PermissionDeniedError(permission, snapshot.userId);
    }
  }

  mergeOverlayPermissions(
    base: IamAuthzSnapshot,
    overlayPermissions: readonly string[],
    overlayIds: readonly string[]
  ): IamAuthzSnapshot {
    const permissions = new Set(base.permissions);
    for (const key of overlayPermissions) {
      permissions.add(key);
    }
    return {
      ...base,
      permissions,
      overlayIds: [...base.overlayIds, ...overlayIds],
    };
  }

  private emitDecision(
    snapshot: IamAuthzSnapshot,
    permission: string,
    allowed: boolean
  ): AuthorizationDecision {
    const decision: AuthorizationDecision = {
      allowed,
      permission,
      userId: snapshot.userId,
      organizationId: snapshot.organizationId,
      overlayIds: snapshot.overlayIds,
      at: this.now().toISOString(),
    };

    if (!this.audit) return decision;
    if (!allowed || this.auditAllDecisions) {
      this.audit.emit({
        kind: allowed ? "authorization.allow" : "authorization.deny",
        actorUserId: snapshot.userId,
        subjectUserId: snapshot.userId,
        organizationId: snapshot.organizationId,
        permission,
        detail: {
          overlayIds: snapshot.overlayIds,
          roles: snapshot.roles,
        },
        immutable: false,
      });
    }
    return decision;
  }
}

/** Module-level helpers for callers that do not need a DI instance. */
const defaultEngine = new AuthorizationEngine();

export function authorize(
  snapshot: IamAuthzSnapshot,
  permission: string
): boolean {
  return defaultEngine.authorize(snapshot, permission);
}

export function hasPermission(
  subject: IamAuthzSubject,
  permission: string
): boolean {
  return defaultEngine.hasPermission(subject, permission);
}

export function requirePermission(
  subject: IamAuthzSubject,
  permission: string
): void {
  defaultEngine.requirePermission(subject, permission);
}
