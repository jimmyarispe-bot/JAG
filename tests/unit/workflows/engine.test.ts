import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import type { IdentityContext } from "@/lib/platform/identity/context";

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  canEditWorkflows,
  canManageCategory,
  canViewWorkflows,
} from "@/lib/workflows/access";
import {
  evaluateConditionGroup,
  evaluateConditionRule,
} from "@/lib/workflows/conditions";
import { executeWorkflow } from "@/lib/workflows/engine";
import { triggersForActivityEvent } from "@/lib/workflows/triggers";
import { STARTER_WORKFLOW_TEMPLATES } from "@/lib/workflows/templates";
import { emptyDefinition, validateDefinition } from "@/lib/workflows/definition";
import type { WorkflowRow } from "@/lib/workflows/types";

const WORKFLOW_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const EXEC_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function identityWithRoles(roles: string[], permissions: string[] = []): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: permissions as IdentityContext["permissions"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("CEO") || roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

function sampleWorkflow(overrides: Partial<WorkflowRow> = {}): WorkflowRow {
  const definition = emptyDefinition("students.student_created");
  // add an action before end
  const action = {
    id: "node-action-1",
    type: "action" as const,
    label: "Notify",
    config: { actionType: "add_timeline_event", title: "Student created workflow" },
  };
  const end = definition.nodes.find((n) => n.type === "end")!;
  definition.nodes = [definition.nodes[0], action, end];
  definition.edges = [
    { id: "e1", from: definition.entryNodeId, to: action.id, branch: "default" },
    { id: "e2", from: action.id, to: end.id, branch: "default" },
  ];

  return {
    id: WORKFLOW_ID,
    audit_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    organization_id: TEST_UUIDS.organization,
    school_id: TEST_UUIDS.school,
    name: "Student created notify",
    description: "test",
    category: "students",
    trigger_key: "students.student_created",
    definition,
    enabled: true,
    version: 1,
    status: "active",
    created_by: TEST_UUIDS.user,
    updated_by: TEST_UUIDS.user,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    last_run_at: null,
    run_count: 0,
    success_count: 0,
    failure_count: 0,
    max_retries: 1,
    retry_backoff_ms: 1,
    ...overrides,
  };
}

describe("Workflow permissions", () => {
  it("CEO can edit; parents cannot view", () => {
    expect(canEditWorkflows(identityWithRoles(["CEO"]))).toBe(true);
    expect(canViewWorkflows(identityWithRoles(["PARENT"]))).toBe(false);
    expect(canViewWorkflows(identityWithRoles(["TEACHER"]))).toBe(true);
  });

  it("Admissions can manage admissions category only", () => {
    const ctx = identityWithRoles(["ADMISSIONS"]);
    expect(canManageCategory(ctx, "admissions")).toBe(true);
    expect(canManageCategory(ctx, "billing")).toBe(false);
  });
});

describe("Trigger evaluation", () => {
  it("maps activity events to trigger keys", () => {
    expect(triggersForActivityEvent("student.created")).toContain("students.student_created");
    expect(triggersForActivityEvent("family.merged")).toContain("families.family_merged");
    expect(triggersForActivityEvent("communication.sent")).toContain(
      "communications.message_sent"
    );
    expect(triggersForActivityEvent("unknown.event")).toEqual([]);
  });
});

describe("Condition evaluation", () => {
  it("evaluates equals / gt / exists", () => {
    const ctx = {
      triggerKey: "x",
      schoolId: TEST_UUIDS.school,
      facts: { student_status: "active", balance: 150, guardian_exists: true },
    };
    expect(
      evaluateConditionRule(
        { id: "1", field: "student_status", operator: "equals", value: "active" },
        ctx
      )
    ).toBe(true);
    expect(
      evaluateConditionRule({ id: "2", field: "balance", operator: "gt", value: 100 }, ctx)
    ).toBe(true);
    expect(
      evaluateConditionRule({ id: "3", field: "guardian_exists", operator: "exists" }, ctx)
    ).toBe(true);
  });

  it("supports AND / OR groups", () => {
    const ctx = {
      triggerKey: "x",
      facts: { student_status: "active", balance: 10 },
    };
    expect(
      evaluateConditionGroup(
        {
          id: "g1",
          op: "AND",
          rules: [
            { id: "a", field: "student_status", operator: "equals", value: "active" },
            { id: "b", field: "balance", operator: "gt", value: 100 },
          ],
        },
        ctx
      )
    ).toBe(false);
    expect(
      evaluateConditionGroup(
        {
          id: "g2",
          op: "OR",
          rules: [
            { id: "a", field: "student_status", operator: "equals", value: "active" },
            { id: "b", field: "balance", operator: "gt", value: 100 },
          ],
        },
        ctx
      )
    ).toBe(true);
  });
});

describe("Definition + templates", () => {
  it("validates definitions", () => {
    expect(validateDefinition(emptyDefinition("system.manual")).ok).toBe(true);
    expect(validateDefinition({ version: "1.0", entryNodeId: "x", nodes: [], edges: [] }).ok).toBe(
      false
    );
  });

  it("ships starter templates", () => {
    expect(STARTER_WORKFLOW_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    expect(STARTER_WORKFLOW_TEMPLATES.some((t) => t.key === "new_lead_welcome")).toBe(true);
  });
});

describe("Execution engine", () => {
  beforeEach(() => vi.clearAllMocks());

  it("executes matching workflow and publishes events", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_workflow_executions" && operation === "maybeSingle") {
        return { data: null, error: null };
      }
      if (table === "platform_workflow_executions" && operation === "single") {
        return { data: { id: EXEC_ID }, error: null };
      }
      if (table === "platform_workflow_execution_steps") {
        return { data: null, error: null };
      }
      if (table === "platform_workflows" && operation === "update") {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const result = await executeWorkflow(supabase, sampleWorkflow(), {
      triggerKey: "students.student_created",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      studentId: TEST_UUIDS.student,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      activityEventId: TEST_UUIDS.activity,
      dedupeKey: `students.student_created:${TEST_UUIDS.activity}`,
      facts: { student_status: "active" },
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "workflow.executed" })
    );
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "workflow.completed" })
    );
  });

  it("skips when conditions fail", async () => {
    const workflow = sampleWorkflow({
      definition: {
        ...sampleWorkflow().definition,
        conditionGroups: [
          {
            id: "g",
            op: "AND",
            rules: [
              { id: "r", field: "student_status", operator: "equals", value: "inactive" },
            ],
          },
        ],
      },
    });

    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_workflow_executions" && operation === "maybeSingle") {
        return { data: null, error: null };
      }
      if (table === "platform_workflow_executions" && operation === "single") {
        return { data: { id: EXEC_ID }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await executeWorkflow(supabase, workflow, {
      triggerKey: "students.student_created",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      facts: { student_status: "active" },
    });

    expect(result.skipped).toBe(true);
    expect(result.status).toBe("skipped");
  });

  it("prevents duplicate execution", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_workflow_executions" && operation === "maybeSingle") {
        return { data: { id: EXEC_ID }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await executeWorkflow(supabase, sampleWorkflow(), {
      triggerKey: "students.student_created",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      dedupeKey: "dup-key",
    });

    expect(result.skipped).toBe(true);
    expect(result.error).toMatch(/Duplicate/i);
  });

  it("skips disabled workflows", async () => {
    const supabase = createMockSupabase(() => ({ data: null, error: null }));
    const result = await executeWorkflow(supabase, sampleWorkflow({ enabled: false }), {
      triggerKey: "students.student_created",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
    });
    expect(result.skipped).toBe(true);
  });
});
