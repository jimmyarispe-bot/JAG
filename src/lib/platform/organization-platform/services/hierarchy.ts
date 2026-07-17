import type { OrganizationPlatformStore } from "../store";
import {
  assertPermission,
  assertSameOrganization,
  type ActorContext,
} from "../rbac";
import { roleHasPermission } from "../roles";
import type { LocationKind, LocationRecord, OrganizationRecord, UnitKind, UnitRecord } from "../types";

function now(): string {
  return new Date().toISOString();
}

export class OrganizationService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  create(
    input: {
      name: string;
      slug: string;
      industry?: string;
      ownerUserId?: string | null;
    },
    actor?: ActorContext | null
  ): OrganizationRecord {
    if (actor) {
      assertPermission(actor, "platform.admin");
    }
    const existing = [...this.store.organizations.values()].find((o) => o.slug === input.slug);
    if (existing) {
      throw new Error(`Organization slug already exists: ${input.slug}`);
    }
    const ts = now();
    const org: OrganizationRecord = {
      id: this.store.createId("org"),
      name: input.name,
      slug: input.slug,
      status: "active",
      industry: input.industry ?? "education",
      createdAt: ts,
      updatedAt: ts,
      ownerUserId: input.ownerUserId ?? null,
    };
    this.store.organizations.set(org.id, org);
    this.store.settings.set(org.id, {
      organizationId: org.id,
      companyProfile: { legalName: input.name },
      branding: {
        logoUrl: null,
        primaryColor: "#0f766e",
        accentColor: "#f59e0b",
        productName: "JAG",
      },
      timezone: "America/New_York",
      currency: "USD",
      fiscalYearStartMonth: 7,
      industry: org.industry,
      language: "en",
      region: "US",
      updatedAt: ts,
    });
    this.store.appendAudit({
      organizationId: org.id,
      actorUserId: actor?.userId ?? null,
      action: "organization.created",
      detail: { name: org.name, slug: org.slug },
    });
    return org;
  }

  get(organizationId: string, actor: ActorContext): OrganizationRecord {
    assertPermission(actor, "org.read");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const org = this.store.organizations.get(organizationId);
    if (!org) throw new Error(`Organization not found: ${organizationId}`);
    return org;
  }

  listForActor(actor: ActorContext): OrganizationRecord[] {
    // Permission-based platform scope — never role-name equality checks.
    if (roleHasPermission(actor.role, "platform.admin")) {
      return this.store.listOrganizations();
    }
    assertPermission(actor, "org.read");
    const org = this.store.organizations.get(actor.organizationId);
    return org ? [org] : [];
  }

  listAccessible(userId: string): OrganizationRecord[] {
    const memberships = this.store.membershipsForUser(userId);
    return memberships
      .map((m) => this.store.organizations.get(m.organizationId))
      .filter((o): o is OrganizationRecord => Boolean(o));
  }

  update(
    organizationId: string,
    patch: Partial<Pick<OrganizationRecord, "name" | "industry" | "status">>,
    actor: ActorContext
  ): OrganizationRecord {
    assertPermission(actor, "org.write");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const org = this.store.organizations.get(organizationId);
    if (!org) throw new Error(`Organization not found: ${organizationId}`);
    const next = { ...org, ...patch, updatedAt: now() };
    this.store.organizations.set(organizationId, next);
    this.store.appendAudit({
      organizationId,
      actorUserId: actor.userId,
      action: "organization.updated",
      detail: { patch },
    });
    return next;
  }
}

export class LocationService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  create(
    input: {
      organizationId: string;
      kind: LocationKind;
      name: string;
      code?: string;
      parentLocationId?: string | null;
      timezone?: string;
    },
    actor: ActorContext
  ): LocationRecord {
    assertPermission(actor, "locations.manage");
    assertSameOrganization(input.organizationId, actor.organizationId, "organization");
    const loc: LocationRecord = {
      id: this.store.createId("loc"),
      organizationId: input.organizationId,
      kind: input.kind,
      name: input.name,
      code: input.code,
      parentLocationId: input.parentLocationId ?? null,
      timezone: input.timezone,
      createdAt: now(),
    };
    this.store.locations.set(loc.id, loc);
    this.store.appendAudit({
      organizationId: input.organizationId,
      actorUserId: actor.userId,
      action: "location.created",
      detail: { locationId: loc.id, kind: loc.kind, name: loc.name },
    });
    return loc;
  }

  list(organizationId: string, actor: ActorContext): LocationRecord[] {
    assertPermission(actor, "org.read");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const rows = this.store.listLocations(organizationId);
    if (actor.membership.locationIds.length === 0) return rows;
    return rows.filter((l) => actor.membership.locationIds.includes(l.id));
  }
}

export class UnitService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  create(
    input: {
      organizationId: string;
      kind: UnitKind;
      name: string;
      locationId?: string | null;
      code?: string;
      parentUnitId?: string | null;
    },
    actor: ActorContext
  ): UnitRecord {
    const perm =
      input.kind === "team" || input.kind === "program"
        ? "teams.manage"
        : "departments.manage";
    assertPermission(actor, perm);
    assertSameOrganization(input.organizationId, actor.organizationId, "organization");
    const unit: UnitRecord = {
      id: this.store.createId("unit"),
      organizationId: input.organizationId,
      locationId: input.locationId ?? null,
      kind: input.kind,
      name: input.name,
      code: input.code,
      parentUnitId: input.parentUnitId ?? null,
      createdAt: now(),
    };
    this.store.units.set(unit.id, unit);
    this.store.appendAudit({
      organizationId: input.organizationId,
      actorUserId: actor.userId,
      action: "unit.created",
      detail: { unitId: unit.id, kind: unit.kind, name: unit.name },
    });
    return unit;
  }

  list(
    organizationId: string,
    actor: ActorContext,
    kind?: UnitKind
  ): UnitRecord[] {
    assertPermission(actor, "org.read");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    return this.store.listUnits(organizationId, kind);
  }
}
