/**
 * JAG External Pilot Foundation — org-scoped authority + cross-tenant guards.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  authorizeJagEntry,
  canEnterJag,
} from "@/lib/platform/identity/founder-protection";
import {
  authorizeJagWorkspaceEntry,
  isJagOrganizationOperator,
  isJagPlatformSteward,
  resolveJagAuthorityKind,
} from "@/lib/platform/identity/jag-authority";
import { buildAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import { permissionsForMappedRole } from "@/lib/platform/identity/permission-groups";
import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import {
  decodeJagPlatformSession,
  encodeJagPlatformSession,
} from "@/lib/jag-platform/session";
import { resolveJagPlatformRoleFromAuthz } from "@/lib/jag-platform/login";

const ROOT = process.cwd();
const SIGNING_SECRET = "test-jag-session-signing-secret-32chars!!";

describe("platform steward vs customer org admin", () => {
  it("FOUNDER is a platform steward with JAG_ACCESS", () => {
    const snap = buildAuthzSnapshot("u-founder", ["FOUNDER"]);
    expect(authorizeJagEntry(snap)).toBe(true);
    expect(isJagPlatformSteward(snap)).toBe(true);
    expect(isJagOrganizationOperator(snap)).toBe(false);
    expect(resolveJagAuthorityKind(snap)).toBe("platform");
  });

  it("PLATFORM_OWNER is a platform steward", () => {
    const snap = buildAuthzSnapshot("u-po", ["PLATFORM_OWNER"]);
    expect(authorizeJagWorkspaceEntry(snap)).toBe(true);
    expect(isJagPlatformSteward(snap)).toBe(true);
    expect(permissionsForMappedRole("PLATFORM_OWNER")).toContain("JAG_ACCESS");
    expect(permissionsForMappedRole("PLATFORM_OWNER")).toContain(
      "JAG_PLATFORM_ADMIN"
    );
  });

  it("JAG_ORG_ADMIN enters via JAG_ORG_ACCESS and is not a platform steward", () => {
    const snap = buildAuthzSnapshot("u-admin", ["JAG_ORG_ADMIN"]);
    expect(authorizeJagEntry(snap)).toBe(true);
    expect(canEnterJag(snap)).toBe(true);
    expect(isJagOrganizationOperator(snap)).toBe(true);
    expect(isJagPlatformSteward(snap)).toBe(false);
    expect(resolveJagAuthorityKind(snap)).toBe("organization");

    const keys = permissionsForMappedRole("JAG_ORG_ADMIN");
    expect(keys).toContain("JAG_ORG_ACCESS");
    expect(keys).not.toContain("JAG_ACCESS");
    expect(keys).not.toContain("JAG_PLATFORM_ADMIN");
    expect(keys).not.toContain("founder.override");
  });

  it("CEO does not receive JAG entry", () => {
    const snap = buildAuthzSnapshot("u-ceo", ["CEO"]);
    expect(authorizeJagEntry(snap)).toBe(false);
    expect(resolveJagAuthorityKind(snap)).toBeNull();
  });

  it("maps org admin roles to ORG_OWNER session claim", () => {
    expect(
      resolveJagPlatformRoleFromAuthz(["JAG_ORG_ADMIN"], "organization")
    ).toBe("ORG_OWNER");
    expect(resolveJagPlatformRoleFromAuthz(["FOUNDER"], "platform")).toBe(
      "FOUNDER"
    );
    expect(
      resolveJagPlatformRoleFromAuthz(["PLATFORM_OWNER"], "platform")
    ).toBe("PLATFORM_OWNER");
  });
});

describe("cross-tenant session access", () => {
  beforeEach(() => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", SIGNING_SECRET);
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("org operator cannot access another organization id", () => {
    expect(
      sessionCanAccessOrganization(
        { authority: "organization", organizationId: "org-b" },
        "org-academy"
      )
    ).toBe(false);
    expect(
      sessionCanAccessOrganization(
        { authority: "organization", organizationId: "org-b" },
        "org-b"
      )
    ).toBe(true);
  });

  it("platform steward can access any organization id", () => {
    expect(
      sessionCanAccessOrganization(
        { authority: "platform", organizationId: null },
        "org-academy"
      )
    ).toBe(true);
    expect(
      sessionCanAccessOrganization(
        { authority: "platform", organizationId: "org-b" },
        "org-academy"
      )
    ).toBe(true);
  });

  it("signed session preserves organization binding", async () => {
    const token = await encodeJagPlatformSession({
      userId: "u-b",
      email: "admin@abc.example",
      displayName: "ABC Admin",
      role: "ORG_OWNER",
      authority: "organization",
      organizationId: "org-b",
      issuedAt: new Date().toISOString(),
    });
    expect(token).toBeTruthy();
    const decoded = await decodeJagPlatformSession(token);
    expect(decoded?.authority).toBe("organization");
    expect(decoded?.organizationId).toBe("org-b");
    expect(sessionCanAccessOrganization(decoded!, "org-academy")).toBe(false);
  });
});

describe("migration + resolver fail-closed invariants", () => {
  it("migration 212 introduces steward helper and removes CEO global org bypass", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/212_jag_org_scoped_authorization.sql"),
      "utf8"
    );
    expect(sql).toContain("is_platform_steward");
    expect(sql).toContain("JAG_ORG_ACCESS");
    expect(sql).toContain("JAG_ORG_ADMIN");
    expect(sql).toContain("PLATFORM_OWNER");
    expect(sql).toContain("user_can_access_organization");
    expect(sql).toContain("is_enterprise_admin_for_organization");
    expect(sql).toMatch(
      /user_can_access_organization[\s\S]*is_platform_steward/
    );
    expect(sql).not.toMatch(
      /user_can_access_organization[\s\S]*r\.name in \('FOUNDER', 'CEO'\)/
    );
  });

  it("org-membership exports fail-closed resolver", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/platform/identity/org-membership.ts"),
      "utf8"
    );
    expect(src).toContain("resolveOrganizationIdForUser");
    expect(src).toContain("allowSeedFallback");
  });

  it("JAG org-context never queries seed slug or first-org fallback", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/jag-platform/org-context.ts"),
      "utf8"
    );
    expect(src).toContain("resolveJagOrganizationContext");
    expect(src).not.toContain('.eq("slug"');
    expect(src).not.toContain("order(\"created_at\"");
    expect(src).toContain("loadActiveMemberships");
  });
});
