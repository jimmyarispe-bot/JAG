import { describe, expect, it } from "vitest";
import {
  DEMO_EXEC_ORGANIZATION_ID,
  isExecDemoAllowed,
  resolveExecRuntime,
} from "@/lib/exec/scope";
import type { ExecutiveTenantContext } from "@/lib/platform/organization-platform/types";

const tenant: ExecutiveTenantContext = {
  organizationId: "org-acme-1",
  organizationName: "Acme Education Group",
  locationId: "loc-1",
  locationName: "Main Campus",
  role: "executive",
  permissions: ["exec.access"],
  integrationInstanceIds: [],
  intelligenceScope: {
    organizationId: "org-acme-1",
    locationId: "loc-1",
  },
  branding: {
    logoUrl: null,
    primaryColor: "#0f766e",
    accentColor: "#f59e0b",
    productName: "JAG",
  },
  timezone: "UTC",
  currency: "USD",
};

describe("resolveExecRuntime (C-A2)", () => {
  it("binds authenticated tenant scope in tenant mode", () => {
    const runtime = resolveExecRuntime({
      tenant,
      env: { NODE_ENV: "production", EXEC_OPERATING_MODE: "tenant" },
    });
    expect(runtime.mode).toBe("tenant");
    expect(runtime.scope.organizationId).toBe("org-acme-1");
    expect(runtime.scope.schoolId).toBe("loc-1");
    expect(runtime.provenanceLabel).toBe("Tenant mode");
    expect(runtime.organizationName).toBe("Acme Education Group");
  });

  it("defaults to tenant when tenant context exists", () => {
    const runtime = resolveExecRuntime({
      tenant,
      env: { NODE_ENV: "development" },
    });
    expect(runtime.mode).toBe("tenant");
    expect(runtime.scope.organizationId).toBe("org-acme-1");
  });

  it("uses explicit demo mode with exec-demo-org outside production", () => {
    const runtime = resolveExecRuntime({
      tenant,
      env: { NODE_ENV: "development", EXEC_OPERATING_MODE: "demo" },
    });
    expect(runtime.mode).toBe("demo");
    expect(runtime.scope.organizationId).toBe(DEMO_EXEC_ORGANIZATION_ID);
    expect(runtime.provenanceLabel).toBe("Demo mode");
  });

  it("blocks silent demo in production without ALLOW_EXEC_DEMO_MODE", () => {
    expect(() =>
      resolveExecRuntime({
        tenant: null,
        env: { NODE_ENV: "production" },
      })
    ).toThrow(/demo mode is blocked in production/i);
  });

  it("allows demo in production only with explicit allow flag", () => {
    const runtime = resolveExecRuntime({
      tenant: null,
      env: {
        NODE_ENV: "production",
        EXEC_OPERATING_MODE: "demo",
        ALLOW_EXEC_DEMO_MODE: "true",
      },
    });
    expect(runtime.mode).toBe("demo");
    expect(runtime.scope.organizationId).toBe(DEMO_EXEC_ORGANIZATION_ID);
  });

  it("requires tenant when EXEC_OPERATING_MODE=tenant and none is present", () => {
    expect(() =>
      resolveExecRuntime({
        tenant: null,
        env: { NODE_ENV: "development", EXEC_OPERATING_MODE: "tenant" },
      })
    ).toThrow(/requires an authenticated organization/i);
  });
});

describe("isExecDemoAllowed", () => {
  it("allows demo outside production by default", () => {
    expect(isExecDemoAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isExecDemoAllowed({ NODE_ENV: "test" })).toBe(true);
  });

  it("blocks demo in production unless ALLOW_EXEC_DEMO_MODE=true", () => {
    expect(isExecDemoAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(
      isExecDemoAllowed({ NODE_ENV: "production", ALLOW_EXEC_DEMO_MODE: "true" })
    ).toBe(true);
  });
});
