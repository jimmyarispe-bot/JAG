import type { IamAuditEmitter } from "@/lib/platform/iam/audit/emitter";
import type { AuthorizationEngine } from "@/lib/platform/iam/authorization/engine";
import {
  assertOrganizationActive,
  assertSameOrganization,
  TenantIsolationError,
} from "@/lib/platform/iam/organizations/isolation";
import type {
  IamAuthzSnapshot,
  IamOrganization,
  IamOrganizationSettings,
  OrganizationLifecycleStatus,
} from "@/lib/platform/iam/types";

const DEFAULT_SETTINGS: IamOrganizationSettings = {
  timezone: "UTC",
  locale: "en",
  currency: "USD",
  branding: {
    displayName: null,
    primaryColor: null,
    logoUrl: null,
  },
  featureFlags: {},
};

export type OrganizationServiceDependencies = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  authorization: AuthorizationEngine;
  audit?: IamAuditEmitter | null;
};

export class OrganizationService {
  private readonly orgs = new Map<string, IamOrganization>();
  private readonly memberships = new Map<string, Set<string>>(); // orgId → userIds
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly authorization: AuthorizationEngine;
  private readonly audit: IamAuditEmitter | null;

  constructor(dependencies: OrganizationServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.authorization = dependencies.authorization;
    this.audit = dependencies.audit ?? null;
  }

  create(
    input: {
      slug: string;
      name: string;
      ownerUserId?: string | null;
      settings?: Partial<IamOrganizationSettings>;
    },
    actor: IamAuthzSnapshot
  ): IamOrganization {
    this.authorization.requirePermission(actor, "org.write");
    if ([...this.orgs.values()].some((o) => o.slug === input.slug)) {
      throw new Error(`Organization slug already exists: ${input.slug}`);
    }
    const ts = this.now().toISOString();
    const org: IamOrganization = {
      id: this.createId("org"),
      slug: input.slug,
      name: input.name,
      status: "draft",
      ownerUserId: input.ownerUserId ?? actor.userId,
      settings: {
        ...DEFAULT_SETTINGS,
        ...input.settings,
        branding: {
          ...DEFAULT_SETTINGS.branding,
          ...input.settings?.branding,
        },
        featureFlags: {
          ...DEFAULT_SETTINGS.featureFlags,
          ...input.settings?.featureFlags,
        },
      },
      createdAt: ts,
      updatedAt: ts,
    };
    this.orgs.set(org.id, org);
    this.memberships.set(org.id, new Set(org.ownerUserId ? [org.ownerUserId] : []));
    this.auditLifecycle(actor, org, "created");
    return org;
  }

  get(organizationId: string, actor: IamAuthzSnapshot): IamOrganization {
    this.authorization.requirePermission(actor, "org.read");
    const org = this.requireOrg(organizationId);
    assertSameOrganization(org.id, actor.organizationId, "organization");
    return org;
  }

  listForActor(actor: IamAuthzSnapshot): readonly IamOrganization[] {
    this.authorization.requirePermission(actor, "org.read");
    if (this.authorization.hasPermission(actor, "iam.admin")) {
      return [...this.orgs.values()];
    }
    if (!actor.organizationId) return [];
    const org = this.orgs.get(actor.organizationId);
    return org ? [org] : [];
  }

  updateSettings(
    organizationId: string,
    patch: Partial<IamOrganizationSettings>,
    actor: IamAuthzSnapshot
  ): IamOrganization {
    this.authorization.requirePermission(actor, "org.settings");
    const org = this.requireOrg(organizationId);
    assertSameOrganization(org.id, actor.organizationId, "organization");
    assertOrganizationActive(org.status, org.id);
    const updated: IamOrganization = {
      ...org,
      settings: {
        ...org.settings,
        ...patch,
        branding: { ...org.settings.branding, ...patch.branding },
        featureFlags: { ...org.settings.featureFlags, ...patch.featureFlags },
      },
      updatedAt: this.now().toISOString(),
    };
    this.orgs.set(organizationId, updated);
    return updated;
  }

  transitionLifecycle(
    organizationId: string,
    status: OrganizationLifecycleStatus,
    actor: IamAuthzSnapshot
  ): IamOrganization {
    this.authorization.requirePermission(actor, "org.lifecycle");
    const org = this.requireOrg(organizationId);
    if (!this.authorization.hasPermission(actor, "iam.admin")) {
      assertSameOrganization(org.id, actor.organizationId, "organization");
    }
    const updated: IamOrganization = {
      ...org,
      status,
      updatedAt: this.now().toISOString(),
    };
    this.orgs.set(organizationId, updated);
    this.auditLifecycle(actor, updated, status);
    return updated;
  }

  addMember(organizationId: string, userId: string, actor: IamAuthzSnapshot): void {
    this.authorization.requirePermission(actor, "users.manage");
    const org = this.requireOrg(organizationId);
    assertSameOrganization(org.id, actor.organizationId, "organization");
    const set = this.memberships.get(organizationId) ?? new Set<string>();
    set.add(userId);
    this.memberships.set(organizationId, set);
  }

  userBelongsToOrganization(userId: string, organizationId: string): boolean {
    return this.memberships.get(organizationId)?.has(userId) ?? false;
  }

  assertMembership(userId: string, organizationId: string): void {
    if (!this.userBelongsToOrganization(userId, organizationId)) {
      throw new TenantIsolationError(
        `User ${userId} is not a member of organization ${organizationId}`
      );
    }
  }

  private requireOrg(organizationId: string): IamOrganization {
    const org = this.orgs.get(organizationId);
    if (!org) throw new Error(`Organization not found: ${organizationId}`);
    return org;
  }

  private auditLifecycle(
    actor: IamAuthzSnapshot,
    org: IamOrganization,
    action: string
  ): void {
    this.audit?.emit({
      kind: "organization.lifecycle",
      actorUserId: actor.userId,
      organizationId: org.id,
      detail: { action, status: org.status, slug: org.slug },
    });
  }
}
