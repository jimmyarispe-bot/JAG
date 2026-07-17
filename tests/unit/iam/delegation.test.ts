import { describe, expect, it } from "vitest";
import { createIamPlatform } from "@/lib/platform/iam";

describe("IAM delegation", () => {
  it("grants temporary authority with expiry and revocation", () => {
    let nowMs = Date.parse("2026-01-01T00:00:00.000Z");
    const iam = createIamPlatform({
      now: () => new Date(nowMs),
      createId: ((n) => (prefix: string) => `${prefix}-${++n}`)(0),
    });

    const grantorRole = iam.roles.getByKey("ORG_ADMIN")!;
    iam.identity.upsertUser({ id: "grantor", email: "g@example.com" });
    iam.identity.upsertUser({ id: "grantee", email: "r@example.com" });
    iam.roles.assignRole("grantor", grantorRole.id);

    const grantor = iam.buildSubjectSnapshot({
      userId: "grantor",
      organizationId: "org-1",
    });

    const delegation = iam.delegation.grant({
      grantor,
      granteeUserId: "grantee",
      organizationId: "org-1",
      permissionKeys: ["org.settings"],
      reason: "Coverage while on leave",
      expiresAt: "2026-01-02T00:00:00.000Z",
    });

    expect(delegation.status).toBe("active");
    const overlay = iam.delegation.overlayPermissionsForUser("grantee");
    expect(overlay.permissions).toContain("org.settings");

    const granteeSnap = iam.buildSubjectSnapshot({
      userId: "grantee",
      organizationId: "org-1",
    });
    expect(iam.authorization.hasPermission(granteeSnap, "org.settings")).toBe(
      true
    );

    iam.delegation.revoke(delegation.id, grantor);
    expect(iam.delegation.get(delegation.id)?.status).toBe("revoked");
    expect(
      iam.delegation.overlayPermissionsForUser("grantee").permissions
    ).not.toContain("org.settings");

    // Re-grant and expire
    const d2 = iam.delegation.grant({
      grantor,
      granteeUserId: "grantee",
      permissionKeys: ["users.read"],
      reason: "Short cover",
      expiresAt: "2026-01-01T12:00:00.000Z",
    });
    nowMs = Date.parse("2026-01-01T13:00:00.000Z");
    expect(iam.delegation.expireDue()).toBeGreaterThanOrEqual(1);
    expect(iam.delegation.get(d2.id)?.status).toBe("expired");

    expect(
      iam.auditSink.list().some((e) => e.kind === "delegation.granted")
    ).toBe(true);
    expect(
      iam.auditSink.list().some((e) => e.kind === "delegation.revoked")
    ).toBe(true);
    expect(
      iam.auditSink.list().some((e) => e.kind === "delegation.expired")
    ).toBe(true);
  });

  it("rejects delegating permissions the grantor does not hold", () => {
    const iam = createIamPlatform({
      createId: ((n) => (prefix: string) => `${prefix}-${++n}`)(0),
    });
    iam.identity.upsertUser({ id: "m", email: "m@example.com" });
    const limited = iam.roles.createCustomRole({
      key: "DELEGATOR",
      displayName: "Delegator",
      organizationId: "org-1",
      permissionGroupIds: [],
    });
    // Direct permission injection via snapshot (grant right without iam.admin).
    const grantor = {
      userId: "m",
      roles: [limited.key],
      permissions: new Set(["iam.delegation.grant", "org.read"]),
      organizationId: "org-1",
      overlayIds: [],
    };

    expect(() =>
      iam.delegation.grant({
        grantor,
        granteeUserId: "x",
        permissionKeys: ["iam.admin"],
        reason: "Nope",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      })
    ).toThrow(/lacks permission to delegate/);
  });
});
