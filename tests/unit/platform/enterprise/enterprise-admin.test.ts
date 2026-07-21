/** RC-9 — Enterprise Administration unit tests. */
import { beforeEach, describe, expect, it } from "vitest";
import {
  ENTERPRISE_ADMIN_VERSION,
  ENTERPRISE_CENTERS,
  createEnterpriseAdminEngine,
  buildEnterpriseAdminWorkspace,
  enterpriseAdminStore,
  evaluateRbac,
  evaluateAbac,
} from "@/lib/platform/enterprise";

describe("RC-9 — Enterprise Administration", () => {
  beforeEach(() => {
    enterpriseAdminStore.clear();
  });

  it("exports version and all fourteen centers", () => {
    expect(ENTERPRISE_ADMIN_VERSION).toBe("1.0.0");
    expect(ENTERPRISE_CENTERS).toEqual([
      "sso",
      "saml",
      "scim",
      "rbac",
      "abac",
      "delegated_administration",
      "audit_center",
      "compliance_center",
      "security_center",
      "api_keys",
      "organization_management",
      "license_management",
      "usage_analytics",
      "tenant_provisioning",
    ]);
  });

  it("builds a full enterprise admin workspace with seeded defaults", () => {
    const workspace = buildEnterpriseAdminWorkspace({
      organizationId: "org-ent-demo",
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });

    expect(workspace.version).toBe("1.0.0");
    expect(workspace.centerOrder).toHaveLength(14);
    expect(workspace.governance.mayAutoExecute).toBe(false);
    expect(workspace.centers.rbac.status).toBe("ready");
    expect(workspace.centers.compliance_center.cards.length).toBeGreaterThan(0);
    expect(workspace.centers.security_center.cards.length).toBeGreaterThan(0);
    expect(workspace.centers.organization_management.status).toBe("configured");
    expect(workspace.summary).toMatch(/Enterprise Administration/i);
  });

  it("configures SSO, SAML, SCIM and records audit intents", () => {
    const engine = createEnterpriseAdminEngine();
    const org = "org-sso";

    engine.configureSso(org, {
      key: "okta",
      name: "Okta OIDC",
      protocol: "oidc",
      issuer: "https://example.okta.com",
      clientId: "client-1",
      enabled: true,
      roleMapping: { Admins: "org_admin" },
    });
    engine.configureSaml(org, {
      key: "azure_saml",
      name: "Entra SAML",
      entityId: "https://sts.windows.net/example",
      ssoUrl: "https://login.microsoftonline.com/example/saml2",
      enabled: true,
      attributeMapping: { email: "email" },
    });
    engine.configureScim(org, {
      enabled: true,
      syncUsers: true,
      syncGroups: true,
      endpoint: "https://scim.example/v2",
      bearerTokenHint: "****",
    });
    const sync = engine.runScimSyncDryRun(org);
    expect(sync.ok).toBe(true);

    const ws = engine.build({ organizationId: org, seedDefaults: false });
    expect(ws.centers.sso.status).toBe("configured");
    expect(ws.centers.saml.status).toBe("configured");
    expect(ws.centers.scim.status).toBe("configured");
    expect(ws.centers.audit_center.cards.length).toBeGreaterThan(0);
  });

  it("evaluates RBAC and ABAC decisions", () => {
    const engine = createEnterpriseAdminEngine();
    const org = "org-authz";

    const rbacAllow = evaluateRbac({
      roleKeys: ["org_admin"],
      permission: "enterprise.sso.manage",
    });
    expect(rbacAllow.allowed).toBe(true);

    const rbacDeny = evaluateRbac({
      roleKeys: ["auditor"],
      permission: "enterprise.sso.manage",
    });
    expect(rbacDeny.allowed).toBe(false);

    engine.upsertAbacPolicy(org, {
      id: "pol-finance",
      name: "Finance-only budgets",
      effect: "allow",
      actions: ["budget.read"],
      resource: "budget",
      enabled: true,
      conditions: [{ attribute: "department", operator: "equals", value: "Finance" }],
    });

    const abacAllow = evaluateAbac({
      organizationId: org,
      action: "budget.read",
      resource: "budget",
      attributes: { department: "Finance" },
    });
    expect(abacAllow.allowed).toBe(true);

    const abacDeny = evaluateAbac({
      organizationId: org,
      action: "budget.read",
      resource: "budget",
      attributes: { department: "Sales" },
    });
    expect(abacDeny.allowed).toBe(false);

    const combined = engine.evaluateAccess({
      organizationId: org,
      roleKeys: ["auditor"],
      permission: "enterprise.audit.read",
      action: "budget.read",
      resource: "budget",
      attributes: { department: "Finance" },
    });
    expect(combined.engine).toBe("rbac+abac");
    expect(combined.allowed).toBe(true);
  });

  it("supports API keys, licenses, usage, delegation, and tenant provisioning", () => {
    const engine = createEnterpriseAdminEngine();
    const org = "org-ops";

    const { record, secretOnce } = engine.mintApiKey(org, {
      name: "CI key",
      scopes: ["enterprise.audit.read"],
    });
    expect(secretOnce.startsWith("jag_")).toBe(true);
    expect(record.prefix.length).toBeGreaterThan(5);
    expect(engine.revokeApiKey(org, record.id)?.revokedAt).toBeTruthy();

    engine.assignLicense(org, {
      plan: "enterprise",
      seats: 100,
      seatsUsed: 42,
      status: "active",
      startsAt: "2026-01-01T00:00:00.000Z",
    });
    engine.recordUsage(org, [
      { key: "api_calls", label: "API calls", value: 1200, unit: "calls", period: "30d" },
      { key: "active_seats", label: "Active seats", value: 42, unit: "seats", period: "30d" },
    ]);
    engine.grantDelegation(org, {
      fromUserId: "user-a",
      toUserId: "user-b",
      scope: "school:fl-1",
      permissions: ["enterprise.org.read"],
      expiresAt: "2026-12-31T00:00:00.000Z",
    });

    const job = engine.provisionTenant({
      organizationId: org,
      tenantSlug: "campus-west",
      dryRun: true,
    });
    expect(job.status).toBe("completed");
    expect(job.dryRun).toBe(true);

    const ws = engine.build({ organizationId: org });
    expect(ws.centers.api_keys.cards.length).toBeGreaterThan(0);
    expect(ws.centers.license_management.status).toBe("configured");
    expect(ws.centers.usage_analytics.cards.length).toBe(2);
    expect(ws.centers.delegated_administration.cards.length).toBe(1);
    expect(ws.centers.tenant_provisioning.cards.some((c) => c.title === "campus-west")).toBe(
      true
    );
  });
});
