/**
 * In-memory multi-tenant store — foundation persistence for Organization Platform.
 * Swap for durable DB later without changing service contracts.
 */

import type {
  LocationRecord,
  MembershipRecord,
  OrgAuditEntry,
  OrganizationApiCredential,
  OrganizationRecord,
  OrganizationSecret,
  OrganizationSettings,
  PlatformUser,
  SessionRecord,
  UnitRecord,
} from "./types";

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export class OrganizationPlatformStore {
  readonly organizations = new Map<string, OrganizationRecord>();
  readonly locations = new Map<string, LocationRecord>();
  readonly units = new Map<string, UnitRecord>();
  readonly settings = new Map<string, OrganizationSettings>();
  readonly users = new Map<string, PlatformUser>();
  readonly memberships = new Map<string, MembershipRecord>();
  readonly sessions = new Map<string, SessionRecord>();
  /** email → password hash placeholder (never for production secrets store). */
  readonly credentials = new Map<string, { userId: string; passwordHash: string }>();
  readonly secrets = new Map<string, OrganizationSecret>();
  /** raw secret values keyed by secret id — process memory only. */
  readonly secretValues = new Map<string, string>();
  readonly apiCredentials = new Map<string, OrganizationApiCredential>();
  readonly apiCredentialValues = new Map<string, string>();
  readonly audit: OrgAuditEntry[] = [];

  createId(prefix: string): string {
    return id(prefix);
  }

  appendAudit(entry: Omit<OrgAuditEntry, "id" | "createdAt"> & { id?: string }): OrgAuditEntry {
    const full: OrgAuditEntry = {
      id: entry.id ?? id("audit"),
      organizationId: entry.organizationId,
      actorUserId: entry.actorUserId,
      action: entry.action,
      detail: entry.detail,
      createdAt: new Date().toISOString(),
    };
    this.audit.unshift(full);
    if (this.audit.length > 2000) this.audit.length = 2000;
    return full;
  }

  listOrganizations(): OrganizationRecord[] {
    return [...this.organizations.values()];
  }

  listLocations(organizationId: string): LocationRecord[] {
    return [...this.locations.values()].filter((l) => l.organizationId === organizationId);
  }

  listUnits(organizationId: string, kind?: UnitRecord["kind"]): UnitRecord[] {
    return [...this.units.values()].filter(
      (u) => u.organizationId === organizationId && (!kind || u.kind === kind)
    );
  }

  listMemberships(organizationId: string): MembershipRecord[] {
    return [...this.memberships.values()].filter((m) => m.organizationId === organizationId);
  }

  membershipsForUser(userId: string): MembershipRecord[] {
    return [...this.memberships.values()].filter(
      (m) => m.userId === userId && m.status !== "deactivated"
    );
  }

  listUsers(): PlatformUser[] {
    return [...this.users.values()];
  }

  listAudit(organizationId?: string | null, limit = 50): OrgAuditEntry[] {
    const rows =
      organizationId === undefined
        ? this.audit
        : this.audit.filter((a) => a.organizationId === organizationId);
    return rows.slice(0, limit);
  }
}
