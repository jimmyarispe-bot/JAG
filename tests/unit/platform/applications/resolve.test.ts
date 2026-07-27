import { describe, expect, it } from "vitest";
import {
  ACADEMYOS_APPLICATION_KEY,
  DEFAULT_APPLICATION_KEY,
  PLATFORM_NAME,
  TENANT_ONE_SLUG,
  buildTenantApplicationSnapshot,
  isApplicationEnabled,
  resolveEnabledApplicationKeys,
} from "@/lib/platform/applications";

describe("application registry resolve (Sprint 059)", () => {
  it("exposes platform / app / tenant #1 constants", () => {
    expect(PLATFORM_NAME).toBe("JAG");
    expect(DEFAULT_APPLICATION_KEY).toBe("academyos");
    expect(ACADEMYOS_APPLICATION_KEY).toBe("academyos");
    expect(TENANT_ONE_SLUG).toBe("the-academy-way");
  });

  it("soft-defaults to AcademyOS when enablement is missing", () => {
    expect(resolveEnabledApplicationKeys(null)).toEqual({
      keys: ["academyos"],
      usedSoftDefault: true,
    });
    expect(resolveEnabledApplicationKeys([])).toEqual({
      keys: ["academyos"],
      usedSoftDefault: true,
    });
  });

  it("honors explicit disabled enablement (no soft default)", () => {
    expect(
      resolveEnabledApplicationKeys([
        { applicationKey: "academyos", status: "disabled" },
      ])
    ).toEqual({
      keys: [],
      usedSoftDefault: false,
    });
  });

  it("returns explicit enabled keys", () => {
    const resolved = resolveEnabledApplicationKeys([
      { applicationKey: "academyos", status: "enabled" },
      { applicationKey: "healthcareos", status: "disabled" },
    ]);
    expect(resolved).toEqual({
      keys: ["academyos"],
      usedSoftDefault: false,
    });
    expect(isApplicationEnabled(resolved.keys, "academyos")).toBe(true);
    expect(isApplicationEnabled(resolved.keys, "healthcareos")).toBe(false);
  });

  it("builds a tenant snapshot for The Academy Way shape", () => {
    const snapshot = buildTenantApplicationSnapshot({
      organizationId: "org-1",
      enablements: [{ applicationKey: "academyos", status: "enabled" }],
    });
    expect(snapshot).toEqual({
      platformName: "JAG",
      organizationId: "org-1",
      enabledApplicationKeys: ["academyos"],
      usedSoftDefault: false,
    });
  });
});
