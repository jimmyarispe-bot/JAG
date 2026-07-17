import { describe, expect, it } from "vitest";
import { evaluateAcademicHealth } from "@/lib/platform/intelligence/organization-health/academic";
import { PERMISSION_KEYS } from "@/lib/platform/identity/types";
import { permissionsForGroup } from "@/lib/platform/identity/permission-groups";

describe("A.1 architecture remediation", () => {
  it("marks academic health as unavailable stub (not false critical)", async () => {
    const result = await evaluateAcademicHealth();
    expect(result.stub).toBe(true);
    expect(result.status).toBe("unavailable");
  });

  it("includes teacher.* and students.attendance in the permission catalog", () => {
    expect(PERMISSION_KEYS).toContain("teacher.view");
    expect(PERMISSION_KEYS).toContain("teacher.attendance");
    expect(PERMISSION_KEYS).toContain("students.attendance");
  });

  it("maps TEACHER_ACCESS group to teacher.* fine permissions", () => {
    const perms = permissionsForGroup("TEACHER_ACCESS");
    expect(perms).toContain("teacher.view");
    expect(perms).toContain("teacher.manage");
    expect(perms).toContain("students.attendance");
  });
});
