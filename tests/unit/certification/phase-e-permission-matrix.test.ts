import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import {
  filterAccessibleStudentIds,
  requireSchoolAccess,
} from "@/lib/platform/identity/tenant-access";
import { PERMISSION_KEYS } from "@/lib/platform/identity/types";
import type { IdentityContext } from "@/lib/platform/identity/context";

function ctx(permissions: string[], schools: string[] = ["school-1"]): IdentityContext {
  return {
    id: "user-1",
    effectiveUserId: "user-1",
    email: "cert@academyos.org",
    fullName: "Cert User",
    roleLabel: "Staff",
    roles: [],
    primaryRole: null,
    permissions,
    orgAssignments: [],
    accessibleSchoolIds: schools,
    hasUnrestrictedSchoolAccess: false,
    isFounder: false,
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

describe("Phase E — permission matrix certification", () => {
  it("exposes a non-empty official permission catalog", () => {
    expect(PERMISSION_KEYS.length).toBeGreaterThan(20);
    expect(PERMISSION_KEYS).toContain("FINANCE_ACCESS");
    expect(PERMISSION_KEYS).toContain("JAG_ACCESS");
    expect(PERMISSION_KEYS).toContain("TEACHER_ACCESS");
  });

  it("denies privileged actions without the matching permission", () => {
    const teacher = ctx(["TEACHER_ACCESS"]);
    expect(hasPermission(teacher, "FINANCE_ACCESS")).toBe(false);
    expect(hasPermission(teacher, "HR_ACCESS")).toBe(false);
    expect(hasPermission(teacher, "JAG_ACCESS")).toBe(false);
  });

  it("allows actions only when the permission is present", () => {
    const finance = ctx(["FINANCE_ACCESS"]);
    expect(hasPermission(finance, "FINANCE_ACCESS")).toBe(true);
    expect(hasPermission(finance, "HR_ACCESS")).toBe(false);
  });

  it("enforces school-scoped tenant access", () => {
    const local = ctx(["students.view"], ["school-1"]);
    expect(requireSchoolAccess(local, "school-1")).toBe(true);
    expect(requireSchoolAccess(local, "school-2")).toEqual({
      error: "Forbidden",
      code: "TENANT_SCOPE",
    });
  });

  it("filters student ids to the authorized set (no leakage)", () => {
    const allowed = new Set(["stu-a", "stu-b"]);
    expect(filterAccessibleStudentIds(["stu-a", "stu-x", "stu-b"], allowed)).toEqual([
      "stu-a",
      "stu-b",
    ]);
    expect(filterAccessibleStudentIds(["stu-x"], allowed)).toEqual([]);
  });
});
