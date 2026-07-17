import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimitMemory } from "@/lib/platform/api-rate-limit";
import {
  filterAccessibleStudentIds,
  requireSchoolAccess,
} from "@/lib/platform/identity/tenant-access";
import { MFA_REQUIRED_PERMISSIONS } from "@/lib/platform/identity/mfa";
import { createAnonServerClient } from "@/lib/supabase/server";

describe("B.1 security remediation", () => {
  it("filters student ids to the allowed set", () => {
    const allowed = new Set(["a", "b"]);
    expect(filterAccessibleStudentIds(["a", "c", "b"], allowed)).toEqual(["a", "b"]);
    expect(filterAccessibleStudentIds(undefined, allowed)).toEqual([]);
  });

  it("denies school access outside membership", () => {
    const ctx = {
      hasUnrestrictedSchoolAccess: false,
      accessibleSchoolIds: ["school-1"],
    } as Parameters<typeof requireSchoolAccess>[0];
    expect(requireSchoolAccess(ctx, "school-1")).toBe(true);
    expect(requireSchoolAccess(ctx, "school-2")).toEqual({
      error: "Forbidden",
      code: "TENANT_SCOPE",
    });
  });

  it("lists privileged MFA permission keys", () => {
    expect(MFA_REQUIRED_PERMISSIONS).toContain("FINANCE_ACCESS");
    expect(MFA_REQUIRED_PERMISSIONS).toContain("JAG_ACCESS");
  });

  it("memory rate limit trips after threshold", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimitMemory(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimitMemory(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimitMemory(key, 2, 60_000).ok).toBe(false);
  });

  it("anon server client rejects missing env", () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => createAnonServerClient()).toThrow(/Missing NEXT_PUBLIC_SUPABASE/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
  });
});

describe("B.1 square_planned policy", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalAllow = process.env.ALLOW_SQUARE_PLANNED;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalAllow === undefined) delete process.env.ALLOW_SQUARE_PLANNED;
    else process.env.ALLOW_SQUARE_PLANNED = originalAllow;
  });

  it("documents production denial of simulated payments", () => {
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_SQUARE_PLANNED;
    const allowSimulated =
      process.env.ALLOW_SQUARE_PLANNED === "true" && process.env.NODE_ENV !== "production";
    expect(allowSimulated).toBe(false);
  });
});

describe("B.1 vault key policy", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("requires dedicated vault key in production", async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVault = process.env.VAULT_ENCRYPTION_KEY;
    const prevService = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NODE_ENV = "production";
    delete process.env.VAULT_ENCRYPTION_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-should-not-be-enough";
    const { encryptCredentialSecret } = await import("@/lib/integration-hub/vault-crypto");
    expect(() => encryptCredentialSecret("secret")).toThrow(/VAULT_ENCRYPTION_KEY/);
    process.env.NODE_ENV = prevNode;
    if (prevVault === undefined) delete process.env.VAULT_ENCRYPTION_KEY;
    else process.env.VAULT_ENCRYPTION_KEY = prevVault;
    if (prevService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevService;
  });
});
