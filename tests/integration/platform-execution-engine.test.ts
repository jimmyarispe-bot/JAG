import { describe, expect, it } from "vitest";
import "@/lib/platform/execution-engine";
import "@/lib/platform/hierarchy";
import "@/lib/platform/rules";
import {
  EXECUTION_PIPELINE_STEPS,
  collectExecutionEngineDiagnostics,
  executeWorkspace,
  getWorkspaceDefinition,
  isExecutionEngineRegistered,
  validateExecutionEngineRegistry,
} from "@/lib/platform/execution-engine";
import type { IdentityContext } from "@/lib/platform/identity/context";

function mockIdentity(overrides: Partial<IdentityContext> = {}): IdentityContext {
  return {
    id: "user-1",
    effectiveUserId: "user-1",
    email: "teacher@academyos.org",
    fullName: "Test Teacher",
    roleLabel: "Teacher",
    roles: ["TEACHER"],
    primaryRole: null,
    permissions: ["teacher.view"],
    orgAssignments: [{ id: "a1", school_id: "school-1", campus_id: null, program_id: null, department_id: null, all_campuses: true, all_programs: true, is_primary: true, schools: { name: "Test School" } }],
    accessibleSchoolIds: ["school-1"],
    hasUnrestrictedSchoolAccess: false,
    isFounder: false,
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
    ...overrides,
  };
}

describe("Execution Engine registry", () => {
  it("registers on import", () => {
    expect(isExecutionEngineRegistered()).toBe(true);
    expect(getWorkspaceDefinition("teacher")).toBeDefined();
  });

  it("passes validation", () => {
    const result = validateExecutionEngineRegistry();
    expect(result.ok).toBe(true);
  });

  it("defines 11 pipeline steps", () => {
    expect(EXECUTION_PIPELINE_STEPS).toHaveLength(11);
    expect(EXECUTION_PIPELINE_STEPS[0]).toBe("resolve-user");
    expect(EXECUTION_PIPELINE_STEPS[10]).toBe("return-workspace-state");
  });
});

describe("Teacher Workspace execution (reference implementation)", () => {
  it("executes full pipeline for authorized teacher", async () => {
    const result = await executeWorkspace({
      workspaceKey: "teacher",
      identity: mockIdentity(),
      activeView: "today",
      recommendationFacts: { role: "admin", has_permission: true },
    });

    expect(result.ok).toBe(true);
    expect(result.state).not.toBeNull();
    expect(result.state!.executable).toBe(true);
    expect(result.state!.workspaceKey).toBe("teacher");
    expect(result.state!.grantedCapabilities.length).toBeGreaterThanOrEqual(2);
    expect(result.state!.protocols.length).toBeGreaterThan(0);
    expect(result.state!.procedures.length).toBeGreaterThan(0);
    expect(result.state!.knowledge.length).toBeGreaterThan(0);
    expect(result.state!.navigation.length).toBe(7);
    expect(result.state!.activeView).toBe("today");
    expect(result.state!.pipeline.map((s) => s.stepId)).toEqual([...EXECUTION_PIPELINE_STEPS]);
  });

  it("denies capabilities without workspace access", async () => {
    const result = await executeWorkspace({
      workspaceKey: "teacher",
      identity: mockIdentity({ permissions: [] }),
    });

    expect(result.state!.grantedCapabilities).toHaveLength(0);
    expect(result.state!.executable).toBe(false);
  });

  it("exposes work-centered navigation perspectives", async () => {
    const result = await executeWorkspace({
      workspaceKey: "teacher",
      identity: mockIdentity({ permissions: ["teacher.view"] }),
    });

    const navIds = result.state!.navigation.map((n) => n.id);
    expect(navIds).toEqual([
      "today",
      "highest_priorities",
      "awaiting_review",
      "needs_human_decision",
      "ready_to_teach",
      "ready_for_family_communication",
      "ready_for_completion",
    ]);
  });

  it("grants instruction and evidence capabilities when teacher.view is present", async () => {
    const result = await executeWorkspace({
      workspaceKey: "teacher",
      identity: mockIdentity({ permissions: ["teacher.view"] }),
    });

    expect(result.state!.navigation.map((n) => n.id)).toContain("ready_to_teach");
    expect(result.state!.navigation.map((n) => n.id)).toContain("ready_for_completion");
  });

  it("resolves JAG Organization context in pipeline", async () => {
    const result = await executeWorkspace({
      workspaceKey: "teacher",
      identity: mockIdentity({ permissions: ["teacher.view"] }),
    });

    const org = result.state!.org;
    expect(org.schoolId).toBe("school-1");
    expect(org.activeScope.schoolName).toBe("Test School");
    expect(org.hierarchy).toBeDefined();
    expect(org.reporting).toBeDefined();
    expect(org.ownership.organizationalOwner.kind).toBe("school");
    expect(org.authority.grantedPermissions).toContain("teacher.view");
    expect(org.visibility.accessibleSchoolIds).toContain("school-1");
  });

  it("executes admissions workspace with work navigation", async () => {
    const result = await executeWorkspace({
      workspaceKey: "admissions",
      identity: mockIdentity({ permissions: ["admissions.view"] }),
      activeView: "today",
    });

    expect(result.state!.workspaceKey).toBe("admissions");
    expect(result.state!.navigation.length).toBe(5);
    expect(result.state!.grantedCapabilities.length).toBeGreaterThanOrEqual(1);
  });

  it("executes students workspace", async () => {
    const result = await executeWorkspace({
      workspaceKey: "students",
      identity: mockIdentity({ permissions: ["students.view", "students.edit"] }),
    });

    expect(result.state!.executable).toBe(true);
    expect(result.state!.navigation.map((n) => n.id)).toContain("enrollment_pending");
  });

  it("executes finance workspace", async () => {
    const result = await executeWorkspace({
      workspaceKey: "finance",
      identity: mockIdentity({ permissions: ["finance.view"] }),
    });

    expect(result.state!.workspaceKey).toBe("finance");
    expect(result.state!.navigation.length).toBe(6);
  });

  it("executes hr workspace", async () => {
    const result = await executeWorkspace({
      workspaceKey: "hr",
      identity: mockIdentity({ permissions: ["hr.view"] }),
    });

    expect(result.state!.executable).toBe(true);
    expect(result.state!.navigation.map((n) => n.id)).toContain("compliance_due");
  });

  it("executes executive workspace", async () => {
    const result = await executeWorkspace({
      workspaceKey: "executive",
      identity: mockIdentity({ permissions: ["executive.intelligence"] }),
    });

    expect(result.state!.workspaceKey).toBe("executive");
    expect(result.state!.navigation.map((n) => n.id)).toContain("strategic_decisions");
  });
});

describe("Execution Engine diagnostics", () => {
  it("collects diagnostics", () => {
    const report = collectExecutionEngineDiagnostics();
    expect(report.registered).toBe(true);
    expect(report.validationOk).toBe(true);
    expect(report.referenceWorkspace).toBe("teacher");
    expect(report.publishedWorkspaceCount).toBeGreaterThanOrEqual(1);
  });
});
