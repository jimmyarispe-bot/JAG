import { createHash } from "crypto";
import type { OrganizationPlatformStore } from "../store";
import {
  assertPermission,
  assertSameOrganization,
  type ActorContext,
} from "../rbac";
import type {
  AuthMethod,
  MembershipRecord,
  OrganizationPlatformRole,
  PlatformUser,
  SessionRecord,
} from "../types";

function now(): string {
  return new Date().toISOString();
}

function hashPassword(password: string): string {
  return createHash("sha256").update(`jag-org:${password}`).digest("hex");
}

function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export class UserService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  createUser(input: {
    email: string;
    fullName: string;
    authMethods?: AuthMethod[];
    password?: string;
  }): PlatformUser {
    const email = input.email.trim().toLowerCase();
    const existing = [...this.store.users.values()].find((u) => u.email === email);
    if (existing) return existing;
    const ts = now();
    const user: PlatformUser = {
      id: this.store.createId("user"),
      email,
      fullName: input.fullName,
      status: "active",
      authMethods: input.authMethods ?? ["email_password"],
      createdAt: ts,
      updatedAt: ts,
      lastLoginAt: null,
    };
    this.store.users.set(user.id, user);
    if (input.password) {
      this.store.credentials.set(email, {
        userId: user.id,
        passwordHash: hashPassword(input.password),
      });
    }
    return user;
  }

  invite(
    input: {
      organizationId: string;
      email: string;
      fullName: string;
      role: OrganizationPlatformRole;
      locationIds?: string[];
      departmentIds?: string[];
      teamIds?: string[];
    },
    actor: ActorContext
  ): { user: PlatformUser; membership: MembershipRecord } {
    assertPermission(actor, "users.invite");
    assertSameOrganization(input.organizationId, actor.organizationId, "organization");
    const user = this.createUser({
      email: input.email,
      fullName: input.fullName,
      authMethods: ["email_password", "magic_link"],
    });
    user.status = "invited";
    this.store.users.set(user.id, user);

    const membership: MembershipRecord = {
      id: this.store.createId("mem"),
      organizationId: input.organizationId,
      userId: user.id,
      role: input.role,
      locationIds: input.locationIds ?? [],
      departmentIds: input.departmentIds ?? [],
      teamIds: input.teamIds ?? [],
      status: "invited",
      invitedAt: now(),
      joinedAt: null,
    };
    this.store.memberships.set(membership.id, membership);
    this.store.appendAudit({
      organizationId: input.organizationId,
      actorUserId: actor.userId,
      action: "user.invited",
      detail: { email: user.email, role: input.role },
    });
    return { user, membership };
  }

  assignRole(
    membershipId: string,
    role: OrganizationPlatformRole,
    actor: ActorContext
  ): MembershipRecord {
    assertPermission(actor, "roles.assign");
    const membership = this.store.memberships.get(membershipId);
    if (!membership) throw new Error(`Membership not found: ${membershipId}`);
    assertSameOrganization(membership.organizationId, actor.organizationId, "membership");
    const next = { ...membership, role };
    this.store.memberships.set(membershipId, next);
    this.store.appendAudit({
      organizationId: membership.organizationId,
      actorUserId: actor.userId,
      action: "role.assigned",
      detail: { membershipId, role },
    });
    return next;
  }

  assignLocation(
    membershipId: string,
    locationIds: string[],
    actor: ActorContext
  ): MembershipRecord {
    assertPermission(actor, "users.manage");
    const membership = this.store.memberships.get(membershipId);
    if (!membership) throw new Error(`Membership not found: ${membershipId}`);
    assertSameOrganization(membership.organizationId, actor.organizationId, "membership");
    for (const locId of locationIds) {
      const loc = this.store.locations.get(locId);
      if (!loc || loc.organizationId !== membership.organizationId) {
        throw new Error(`Location ${locId} not in organization`);
      }
    }
    const next = { ...membership, locationIds };
    this.store.memberships.set(membershipId, next);
    return next;
  }

  assignDepartment(
    membershipId: string,
    departmentIds: string[],
    actor: ActorContext
  ): MembershipRecord {
    assertPermission(actor, "users.manage");
    const membership = this.store.memberships.get(membershipId);
    if (!membership) throw new Error(`Membership not found: ${membershipId}`);
    assertSameOrganization(membership.organizationId, actor.organizationId, "membership");
    const next = { ...membership, departmentIds };
    this.store.memberships.set(membershipId, next);
    return next;
  }

  deactivate(userId: string, organizationId: string, actor: ActorContext): MembershipRecord {
    assertPermission(actor, "users.deactivate");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const membership = [...this.store.memberships.values()].find(
      (m) => m.userId === userId && m.organizationId === organizationId
    );
    if (!membership) throw new Error("Membership not found");
    const next = { ...membership, status: "deactivated" as const };
    this.store.memberships.set(membership.id, next);
    const user = this.store.users.get(userId);
    if (user) {
      const otherActive = this.store.membershipsForUser(userId).filter(
        (m) => m.organizationId !== organizationId
      );
      if (otherActive.length === 0) {
        this.store.users.set(userId, {
          ...user,
          status: "deactivated",
          updatedAt: now(),
        });
      }
    }
    this.store.appendAudit({
      organizationId,
      actorUserId: actor.userId,
      action: "user.deactivated",
      detail: { userId },
    });
    return next;
  }

  listMembers(organizationId: string, actor: ActorContext): Array<{
    user: PlatformUser;
    membership: MembershipRecord;
  }> {
    assertPermission(actor, "users.read");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    return this.store
      .listMemberships(organizationId)
      .map((membership) => {
        const user = this.store.users.get(membership.userId);
        if (!user) return null;
        return { user, membership };
      })
      .filter((row): row is { user: PlatformUser; membership: MembershipRecord } => Boolean(row));
  }
}

export class AuthService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  /** Supported authentication methods (SSO reserved). */
  supportedMethods(): AuthMethod[] {
    return ["email_password", "magic_link", "google", "microsoft", "sso_future"];
  }

  authenticateEmailPassword(email: string, password: string): PlatformUser {
    const key = email.trim().toLowerCase();
    const cred = this.store.credentials.get(key);
    if (!cred || cred.passwordHash !== hashPassword(password)) {
      throw new Error("Invalid email or password");
    }
    const user = this.store.users.get(cred.userId);
    if (!user || user.status === "deactivated") {
      throw new Error("User inactive");
    }
    const updated = { ...user, lastLoginAt: now(), updatedAt: now() };
    this.store.users.set(user.id, updated);
    this.store.appendAudit({
      organizationId: null,
      actorUserId: user.id,
      action: "auth.email_password",
      detail: { email: key },
    });
    return updated;
  }

  /** Magic-link token exchange (foundation — token is opaque email+nonce hash). */
  issueMagicLinkToken(email: string): string {
    const key = email.trim().toLowerCase();
    const user = [...this.store.users.values()].find((u) => u.email === key);
    if (!user) throw new Error("User not found");
    const token = createHash("sha256")
      .update(`magic:${key}:${Date.now()}`)
      .digest("hex");
    this.store.appendAudit({
      organizationId: null,
      actorUserId: user.id,
      action: "auth.magic_link.issued",
      detail: { email: key, tokenFingerprint: fingerprint(token) },
    });
    return token;
  }

  redeemMagicLink(email: string, token: string): PlatformUser {
    if (!token || token.length < 32) throw new Error("Invalid magic link");
    const key = email.trim().toLowerCase();
    const user = [...this.store.users.values()].find((u) => u.email === key);
    if (!user || user.status === "deactivated") throw new Error("User inactive");
    if (!user.authMethods.includes("magic_link")) {
      throw new Error("Magic link not enabled for user");
    }
    const updated = {
      ...user,
      lastLoginAt: now(),
      updatedAt: now(),
      status: "active" as const,
    };
    this.store.users.set(user.id, updated);
    this.store.appendAudit({
      organizationId: null,
      actorUserId: user.id,
      action: "auth.magic_link.redeemed",
      detail: { email: key, tokenFingerprint: fingerprint(token) },
    });
    return updated;
  }

  authenticateOAuth(
    provider: "google" | "microsoft",
    profile: { email: string; fullName: string; subject: string }
  ): PlatformUser {
    const email = profile.email.trim().toLowerCase();
    let user = [...this.store.users.values()].find((u) => u.email === email);
    if (!user) {
      const users = new UserService(this.store);
      user = users.createUser({
        email,
        fullName: profile.fullName,
        authMethods: [provider],
      });
    } else if (!user.authMethods.includes(provider)) {
      user = {
        ...user,
        authMethods: [...user.authMethods, provider],
        updatedAt: now(),
      };
      this.store.users.set(user.id, user);
    }
    const updated = { ...user, lastLoginAt: now(), status: "active" as const };
    this.store.users.set(user.id, updated);
    this.store.appendAudit({
      organizationId: null,
      actorUserId: user.id,
      action: `auth.${provider}`,
      detail: { subject: profile.subject },
    });
    return updated;
  }

  /** Future SSO stub — reserved surface. */
  beginSso(_organizationId: string, _providerHint?: string): { status: "not_configured" } {
    return { status: "not_configured" };
  }
}

export class SessionService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  create(
    userId: string,
    authMethod: AuthMethod,
    activeOrganizationId?: string | null
  ): SessionRecord {
    const memberships = this.store.membershipsForUser(userId);
    const orgId =
      activeOrganizationId ??
      memberships.find((m) => m.status === "active")?.organizationId ??
      memberships[0]?.organizationId ??
      null;
    const membership = memberships.find((m) => m.organizationId === orgId);
    const session: SessionRecord = {
      id: this.store.createId("sess"),
      userId,
      activeOrganizationId: orgId,
      activeLocationId: membership?.locationIds[0] ?? null,
      authMethod,
      createdAt: now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      revokedAt: null,
    };
    this.store.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string): SessionRecord | null {
    const session = this.store.sessions.get(sessionId);
    if (!session || session.revokedAt) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    return session;
  }

  switchOrganization(sessionId: string, organizationId: string): SessionRecord {
    const session = this.get(sessionId);
    if (!session) throw new Error("Session not found or expired");
    const membership = this.store.membershipsForUser(session.userId).find(
      (m) => m.organizationId === organizationId && m.status === "active"
    );
    if (!membership) {
      throw new Error("No active membership for organization");
    }
    const next: SessionRecord = {
      ...session,
      activeOrganizationId: organizationId,
      activeLocationId: membership.locationIds[0] ?? null,
    };
    this.store.sessions.set(sessionId, next);
    this.store.appendAudit({
      organizationId,
      actorUserId: session.userId,
      action: "session.organization_switched",
      detail: { sessionId },
    });
    return next;
  }

  switchLocation(sessionId: string, locationId: string | null): SessionRecord {
    const session = this.get(sessionId);
    if (!session || !session.activeOrganizationId) {
      throw new Error("Session has no active organization");
    }
    if (locationId) {
      const loc = this.store.locations.get(locationId);
      if (!loc || loc.organizationId !== session.activeOrganizationId) {
        throw new Error("Location not in active organization");
      }
      const membership = this.store.membershipsForUser(session.userId).find(
        (m) => m.organizationId === session.activeOrganizationId
      );
      if (
        membership &&
        membership.locationIds.length > 0 &&
        !membership.locationIds.includes(locationId)
      ) {
        throw new Error("Location outside membership scope");
      }
    }
    const next = { ...session, activeLocationId: locationId };
    this.store.sessions.set(sessionId, next);
    return next;
  }

  revoke(sessionId: string): void {
    const session = this.store.sessions.get(sessionId);
    if (!session) return;
    this.store.sessions.set(sessionId, {
      ...session,
      revokedAt: now(),
    });
  }

  listForUser(userId: string): SessionRecord[] {
    return [...this.store.sessions.values()].filter(
      (s) => s.userId === userId && !s.revokedAt
    );
  }
}
