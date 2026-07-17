import type { IamAuditEmitter } from "@/lib/platform/iam/audit/emitter";
import type { AuthorizationEngine } from "@/lib/platform/iam/authorization/engine";
import type { AuthenticationPort } from "@/lib/platform/iam/identity/auth-port";
import type {
  IamAuthzSnapshot,
  IamProfile,
  IamSession,
  IamUser,
} from "@/lib/platform/iam/types";

export type IdentityServiceDependencies = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  authorization: AuthorizationEngine;
  authPort?: AuthenticationPort | null;
  audit?: IamAuditEmitter | null;
  /** Default session TTL in milliseconds. */
  sessionTtlMs?: number;
};

export class IdentityService {
  private readonly users = new Map<string, IamUser>();
  private readonly profiles = new Map<string, IamProfile>();
  private readonly sessions = new Map<string, IamSession>();
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly authorization: AuthorizationEngine;
  private readonly authPort: AuthenticationPort | null;
  private readonly audit: IamAuditEmitter | null;
  private readonly sessionTtlMs: number;

  constructor(dependencies: IdentityServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.authorization = dependencies.authorization;
    this.authPort = dependencies.authPort ?? null;
    this.audit = dependencies.audit ?? null;
    this.sessionTtlMs = dependencies.sessionTtlMs ?? 8 * 60 * 60 * 1000;
  }

  upsertUser(input: {
    id?: string;
    email: string;
    status?: IamUser["status"];
    fullName?: string;
  }): IamUser {
    const ts = this.now().toISOString();
    const id = input.id ?? this.createId("user");
    const existing = this.users.get(id);
    const user: IamUser = {
      id,
      email: input.email,
      status: input.status ?? existing?.status ?? "active",
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
    };
    this.users.set(id, user);
    if (input.fullName || !this.profiles.has(id)) {
      this.profiles.set(id, {
        userId: id,
        fullName: input.fullName ?? input.email.split("@")[0] ?? "User",
        avatarUrl: this.profiles.get(id)?.avatarUrl ?? null,
        title: this.profiles.get(id)?.title ?? null,
        metadata: this.profiles.get(id)?.metadata ?? {},
        updatedAt: ts,
      });
    }
    return user;
  }

  getUser(userId: string, actor: IamAuthzSnapshot): IamUser {
    this.authorization.requirePermission(actor, "users.read");
    const user = this.users.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    return user;
  }

  getProfile(userId: string, actor: IamAuthzSnapshot): IamProfile {
    this.authorization.requirePermission(actor, "users.read");
    const profile = this.profiles.get(userId);
    if (!profile) throw new Error(`Profile not found: ${userId}`);
    return profile;
  }

  updateProfile(
    userId: string,
    patch: Partial<Pick<IamProfile, "fullName" | "avatarUrl" | "title">>,
    actor: IamAuthzSnapshot
  ): IamProfile {
    const self = actor.userId === userId;
    if (!self) {
      this.authorization.requirePermission(actor, "users.manage");
    }
    const existing = this.profiles.get(userId);
    if (!existing) throw new Error(`Profile not found: ${userId}`);
    const updated: IamProfile = {
      ...existing,
      ...patch,
      updatedAt: this.now().toISOString(),
    };
    this.profiles.set(userId, updated);
    return updated;
  }

  async resolveAuthenticatedUser(): Promise<IamUser | null> {
    if (!this.authPort) return null;
    const subject = await this.authPort.getAuthenticatedSubject();
    if (!subject) return null;
    return this.upsertUser({
      id: subject.subjectId,
      email: subject.email,
    });
  }

  issueSession(input: {
    userId: string;
    organizationId?: string | null;
    overlayIds?: readonly string[];
    ttlMs?: number;
  }): IamSession {
    const user = this.users.get(input.userId);
    if (!user || user.status !== "active") {
      throw new Error(`Cannot issue session for user: ${input.userId}`);
    }
    const issuedAt = this.now();
    const expiresAt = new Date(
      issuedAt.getTime() + (input.ttlMs ?? this.sessionTtlMs)
    );
    const session: IamSession = {
      id: this.createId("session"),
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revokedAt: null,
      overlayIds: input.overlayIds ?? [],
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): IamSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.revokedAt) return null;
    if (new Date(session.expiresAt).getTime() <= this.now().getTime()) {
      return null;
    }
    return session;
  }

  revokeSession(sessionId: string, actor: IamAuthzSnapshot): IamSession {
    this.authorization.requirePermission(actor, "session.manage");
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    const updated: IamSession = {
      ...session,
      revokedAt: this.now().toISOString(),
    };
    this.sessions.set(sessionId, updated);
    this.audit?.emit({
      kind: "session.revoked",
      actorUserId: actor.userId,
      subjectUserId: session.userId,
      organizationId: session.organizationId,
      detail: { sessionId },
    });
    return updated;
  }
}
