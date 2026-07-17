import { describe, expect, it } from "vitest";
import {
  PermissionGroupRegistry,
  PermissionRegistry,
  expandPermissionKeys,
  resolveEffectivePermissions,
} from "@/lib/platform/iam";

describe("IAM permission inheritance", () => {
  it("expands child permissions to include parents", () => {
    const registry = new PermissionRegistry();
    const expanded = expandPermissionKeys(registry, ["org.write"]);
    expect(expanded.has("org.write")).toBe(true);
    expect(expanded.has("org.read")).toBe(true);
  });

  it("expands permission groups then inheritance", () => {
    const registry = new PermissionRegistry();
    const groups = new PermissionGroupRegistry();
    const member = groups.getByKey("org.member")!;
    const effective = resolveEffectivePermissions(registry, groups, {
      groupIds: [member.id],
      directKeys: ["org.settings"],
    });
    expect(effective.has("org.read")).toBe(true);
    expect(effective.has("org.write")).toBe(true);
    expect(effective.has("org.settings")).toBe(true);
  });
});
