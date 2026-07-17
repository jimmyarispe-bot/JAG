import { describe, expect, it, beforeEach } from "vitest";
import {
  createIntegrationPlatform,
  registerAllConnectors,
} from "@/lib/platform/integrations";
import {
  createOrganizationPlatform,
  PermissionDeniedError,
  TenantIsolationError,
  resetOrganizationPlatformForTests,
  type OrganizationPlatform,
} from "@/lib/platform/organization-platform";

describe("Organization Platform — multi-tenant foundation", () => {
  let platform: OrganizationPlatform;
  let orgAId: string;
  let orgBId: string;
  let ownerAId: string;
  let ownerBId: string;

  beforeEach(() => {
    resetOrganizationPlatformForTests();
    const integrations = registerAllConnectors(createIntegrationPlatform());
    platform = createOrganizationPlatform({ seedDemo: true, integrations });
    const orgs = platform.store.listOrganizations();
    expect(orgs.length).toBeGreaterThanOrEqual(2);
    orgAId = orgs.find((o) => o.slug === "acme-education")!.id;
    orgBId = orgs.find((o) => o.slug === "beta-learning")!.id;
    ownerAId = [...platform.store.users.values()].find((u) => u.email === "owner.a@acme.local")!.id;
    ownerBId = [...platform.store.users.values()].find((u) => u.email === "owner.b@beta.local")!.id;
  });

  it("keeps organizations completely isolated for reads", () => {
    const actorA = platform.resolveActor(ownerAId, orgAId);
    const actorB = platform.resolveActor(ownerBId, orgBId);

    expect(platform.organizations.listForActor(actorA).map((o) => o.id)).toEqual([orgAId]);
    expect(platform.organizations.listForActor(actorB).map((o) => o.id)).toEqual([orgBId]);

    expect(() => platform.organizations.get(orgBId, actorA)).toThrow(TenantIsolationError);
    expect(() => platform.organizations.get(orgAId, actorB)).toThrow(TenantIsolationError);
  });

  it("denies cross-organization location and member listing", () => {
    const actorA = platform.resolveActor(ownerAId, orgAId);
    expect(() => platform.locations.list(orgBId, actorA)).toThrow(TenantIsolationError);
    expect(() => platform.users.listMembers(orgBId, actorA)).toThrow(TenantIsolationError);
  });

  it("enforces RBAC permissions by role", () => {
    const actorA = platform.resolveActor(ownerAId, orgAId);
    const guest = platform.users.createUser({
      email: "guest.a@acme.local",
      fullName: "Guest A",
    });
    const memId = platform.store.createId("mem");
    platform.store.memberships.set(memId, {
      id: memId,
      organizationId: orgAId,
      userId: guest.id,
      role: "guest",
      locationIds: [],
      departmentIds: [],
      teamIds: [],
      status: "active",
    });
    const guestActor = platform.resolveActor(guest.id, orgAId);

    expect(() => platform.users.invite(
      {
        organizationId: orgAId,
        email: "new@acme.local",
        fullName: "New Hire",
        role: "employee",
      },
      guestActor
    )).toThrow(PermissionDeniedError);

    const invited = platform.users.invite(
      {
        organizationId: orgAId,
        email: "new@acme.local",
        fullName: "New Hire",
        role: "employee",
      },
      actorA
    );
    expect(invited.membership.organizationId).toBe(orgAId);
    expect(invited.user.status).toBe("invited");
  });

  it("scopes intelligence queries to organization/location/department/role", () => {
    const session = platform.sessions.listForUser(ownerAId)[0]!;
    const ctx = platform.resolveExecutiveTenantContext(session.id);
    expect(ctx.organizationId).toBe(orgAId);
    expect(ctx.intelligenceScope.organizationId).toBe(orgAId);
    expect(ctx.permissions).toContain("intelligence.query");
    expect(ctx.permissions).toContain("exec.access");
  });

  it("isolates connector instances per organization", async () => {
    const actorA = platform.resolveActor(ownerAId, orgAId);
    const actorB = platform.resolveActor(ownerBId, orgBId);

    await platform.integrationBridge.ensureConnector(orgAId, "quickbooks", actorA);
    await platform.integrationBridge.ensureConnector(orgAId, "google", actorA);
    await platform.integrationBridge.ensureConnector(orgAId, "plaid", actorA);
    await platform.integrationBridge.ensureConnector(orgAId, "academyos", actorA);

    await platform.integrationBridge.ensureConnector(orgBId, "quickbooks", actorB);
    await platform.integrationBridge.ensureConnector(orgBId, "microsoft", actorB);
    await platform.integrationBridge.ensureConnector(orgBId, "hubspot", actorB);
    await platform.integrationBridge.ensureConnector(orgBId, "stripe", actorB);

    const aInstances = platform.integrationBridge.listInstances(orgAId, actorA);
    const bInstances = platform.integrationBridge.listInstances(orgBId, actorB);

    expect(aInstances.map((c) => c.connectorId).sort()).toEqual(
      ["academyos", "google", "plaid", "quickbooks"].sort()
    );
    expect(bInstances.map((c) => c.connectorId).sort()).toEqual(
      ["hubspot", "microsoft", "quickbooks", "stripe"].sort()
    );

    expect(() => platform.integrationBridge.listInstances(orgBId, actorA)).toThrow(
      TenantIsolationError
    );
  });

  it("supports organization switching without leaking sessions", () => {
    const admin = [...platform.store.users.values()].find(
      (u) => u.email === "platform.admin@jag.local"
    )!;
    const session = platform.sessions.create(admin.id, "email_password", orgAId);
    expect(session.activeOrganizationId).toBe(orgAId);

    const switched = platform.sessions.switchOrganization(session.id, orgBId);
    expect(switched.activeOrganizationId).toBe(orgBId);

    const employee = platform.users.createUser({
      email: "only-a@acme.local",
      fullName: "Only A",
    });
    const memId = platform.store.createId("mem");
    platform.store.memberships.set(memId, {
      id: memId,
      organizationId: orgAId,
      userId: employee.id,
      role: "employee",
      locationIds: [],
      departmentIds: [],
      teamIds: [],
      status: "active",
    });
    const empSession = platform.sessions.create(employee.id, "email_password", orgAId);
    expect(() => platform.sessions.switchOrganization(empSession.id, orgBId)).toThrow(
      /No active membership/
    );
  });

  it("keeps org secrets and API credentials tenant-bound", () => {
    const actorA = platform.resolveActor(ownerAId, orgAId);
    const actorB = platform.resolveActor(ownerBId, orgBId);

    platform.secrets.put(orgAId, "qb_client_secret", "secret-a", actorA);
    platform.secrets.put(orgBId, "qb_client_secret", "secret-b", actorB);

    expect(platform.secrets.getValue(orgAId, "qb_client_secret", actorA)).toBe("secret-a");
    expect(() => platform.secrets.getValue(orgAId, "qb_client_secret", actorB)).toThrow(
      TenantIsolationError
    );

    const { credential, rawToken } = platform.apiCredentials.create(
      orgAId,
      "CI",
      actorA
    );
    expect(rawToken.startsWith("jag_")).toBe(true);
    expect(platform.apiCredentials.list(orgAId, actorA).map((c) => c.id)).toContain(
      credential.id
    );
    expect(() => platform.apiCredentials.list(orgAId, actorB)).toThrow(TenantIsolationError);
  });

  it("authenticates email/password, magic link, and OAuth providers", () => {
    const user = platform.auth.authenticateEmailPassword(
      "owner.a@acme.local",
      "change-me-a"
    );
    expect(user.id).toBe(ownerAId);

    const token = platform.auth.issueMagicLinkToken("owner.a@acme.local");
    const redeemed = platform.auth.redeemMagicLink("owner.a@acme.local", token);
    expect(redeemed.email).toBe("owner.a@acme.local");

    const google = platform.auth.authenticateOAuth("google", {
      email: "google.user@acme.local",
      fullName: "Google User",
      subject: "google-sub-1",
    });
    expect(google.authMethods).toContain("google");

    expect(platform.auth.beginSso(orgAId).status).toBe("not_configured");
  });

  it("updates organization settings and branding within tenant", () => {
    const actorA = platform.resolveActor(ownerAId, orgAId);
    const updated = platform.settings.update(
      orgAId,
      {
        branding: { primaryColor: "#111827", productName: "Acme OS" },
        currency: "CAD",
        language: "en",
      },
      actorA
    );
    expect(updated.branding.primaryColor).toBe("#111827");
    expect(updated.currency).toBe("CAD");

    const actorB = platform.resolveActor(ownerBId, orgBId);
    expect(() => platform.settings.update(orgAId, { currency: "EUR" }, actorB)).toThrow(
      TenantIsolationError
    );
  });

  it("deactivates users and records audit events per organization", () => {
    const actorA = platform.resolveActor(ownerAId, orgAId);
    const { user } = platform.users.invite(
      {
        organizationId: orgAId,
        email: "temp@acme.local",
        fullName: "Temp",
        role: "employee",
      },
      actorA
    );
    // activate membership for deactivate path
    const mem = platform.store.listMemberships(orgAId).find((m) => m.userId === user.id)!;
    platform.store.memberships.set(mem.id, { ...mem, status: "active" });
    platform.store.users.set(user.id, { ...user, status: "active" });

    platform.users.deactivate(user.id, orgAId, actorA);
    const after = platform.store.memberships.get(mem.id)!;
    expect(after.status).toBe("deactivated");

    const audit = platform.store.listAudit(orgAId);
    expect(audit.some((a) => a.action === "user.deactivated")).toBe(true);
    expect(audit.every((a) => a.organizationId === orgAId || a.organizationId === null)).toBe(
      true
    );
  });
});
