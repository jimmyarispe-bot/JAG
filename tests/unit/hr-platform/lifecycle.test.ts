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

vi.mock("@/lib/hr/automation", () => ({
  seedDefaultOnboardingTasks: vi.fn(async () => undefined),
}));

vi.mock("@/lib/documents/service", () => ({
  createDocument: vi.fn(async () => ({
    ok: true as const,
    documentId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    auditId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  })),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  canEditHcm,
  canManageAllHcm,
  canViewOwnEmployeeProfile,
  canViewPayrollInfo,
  canViewSchoolEmployees,
} from "@/lib/hr-platform/access";
import {
  canTransition,
  transitionEmployeeLifecycle,
  promoteEmployee,
} from "@/lib/hr-platform/lifecycle";
import { extendOffer, hireApplicant, scheduleInterview } from "@/lib/hr-platform/recruiting";
import {
  completeOnboardingTask,
  ensureExtendedOnboardingTasks,
} from "@/lib/hr-platform/onboarding";
import {
  createEmploymentContract,
  updateContractStatus,
} from "@/lib/hr-platform/contracts";
import { emitCertificationExpiringAlerts } from "@/lib/hr-platform/certifications";
import { completePerformanceReview, createPerformanceReview } from "@/lib/hr-platform/performance";
import { decideLeaveRequest, submitLeaveRequest } from "@/lib/hr-platform/leave";
import { assignEmployee } from "@/lib/hr-platform/assignments";
import {
  ensureHrisExtensionsRegistered,
  syncHrisProvider,
} from "@/lib/hr-platform/integrations";
import { getExtension } from "@/lib/workflows/extension";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { WORKFLOW_ACTION_LIBRARY } from "@/lib/workflows/actions";
import { WORKFLOW_TRIGGER_LIBRARY } from "@/lib/workflows/triggers";
import { LIFECYCLE_STATES } from "@/lib/hr-platform/types";

const EMPLOYEE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const APPLICATION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LEAVE_ID = "llllllll-llll-4lll-8lll-llllllllllll";
const EVAL_ID = "vvvvvvvv-vvvv-4vvv-8vvv-vvvvvvvvvvvv";
const TASK_ID = "tttttttt-tttt-4ttt-8ttt-tttttttttttt";
const CONTRACT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CERT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

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

describe("HCM permissions", () => {
  it("scopes Founder/CEO/HR, school leader, teacher, and finance correctly", () => {
    expect(canManageAllHcm(identityWithRoles(["CEO"]))).toBe(true);
    expect(canManageAllHcm(identityWithRoles(["FOUNDER"]))).toBe(true);
    expect(canEditHcm(identityWithRoles([], ["HR_ACCESS"]))).toBe(true);
    expect(canViewSchoolEmployees(identityWithRoles(["SCHOOL_LEADER"]))).toBe(true);
    expect(canViewOwnEmployeeProfile(identityWithRoles(["TEACHER"]))).toBe(true);
    expect(canViewPayrollInfo(identityWithRoles([], ["finance.payroll"]))).toBe(true);
    expect(canManageAllHcm(identityWithRoles(["TEACHER"]))).toBe(false);
  });
});

describe("lifecycle transitions", () => {
  it("allows valid transitions and rejects invalid ones", () => {
    expect(canTransition("applicant", "interviewing")).toBe(true);
    expect(canTransition("offer_extended", "onboarding")).toBe(true);
    expect(canTransition("active", "leave_of_absence")).toBe(true);
    expect(canTransition("terminated", "active")).toBe(false);
    expect(LIFECYCLE_STATES).toContain("retired");
  });

  it("transitions employee and emits EI events", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "employees") {
        return {
          data: {
            id: EMPLOYEE_ID,
            school_id: TEST_UUIDS.school,
            employment_status: "active",
            lifecycle_stage: "active",
          },
          error: null,
        };
      }
      return { data: { id: "hist" }, error: null };
    });

    const result = await transitionEmployeeLifecycle(supabase, {
      employeeId: EMPLOYEE_ID,
      toState: "leave_of_absence",
      title: "Medical leave",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.toState).toBe("leave_of_absence");
    }
    expect(recordActivity).toHaveBeenCalled();
  });

  it("emits employee.promoted on promotion", async () => {
    vi.mocked(recordActivity).mockClear();
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "employees") {
        return {
          data: {
            id: EMPLOYEE_ID,
            school_id: TEST_UUIDS.school,
            employment_status: "active",
            lifecycle_stage: "active",
          },
          error: null,
        };
      }
      return { data: { id: "x" }, error: null };
    });
    const result = await promoteEmployee(supabase, {
      employeeId: EMPLOYEE_ID,
      title: "Lead Teacher",
    });
    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.promoted" })
    );
  });
});

describe("recruiting", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("schedules interviews", async () => {
    const supabase = createMockSupabase(() => ({
      data: { id: "interview-1" },
      error: null,
    }));
    const result = await scheduleInterview(supabase, {
      applicationId: APPLICATION_ID,
      scheduledAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(true);
  });

  it("extends offers with EI + communications", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "hr_job_applications") {
        return {
          data: {
            id: APPLICATION_ID,
            candidate_name: "Ada Lovelace",
            job_posting_id: "job-1",
            hired_employee_id: null,
            hr_job_postings: { school_id: TEST_UUIDS.school },
          },
          error: null,
        };
      }
      if (ctx.table === "platform_communications") {
        return { data: { id: "comm-1" }, error: null };
      }
      return { data: { id: APPLICATION_ID }, error: null };
    });
    const result = await extendOffer(supabase, { applicationId: APPLICATION_ID });
    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.offer.extended" })
    );
  });

  it("hires applicants into onboarding", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "hr_job_applications") {
        return {
          data: {
            id: APPLICATION_ID,
            candidate_name: "Grace Hopper",
            candidate_email: "grace@example.com",
            candidate_phone: null,
            background_check_status: "cleared",
            job_posting_id: "job-1",
            hr_job_postings: {
              title: "Teacher",
              school_id: TEST_UUIDS.school,
              department: "STEM",
              employment_type: "full_time",
            },
          },
          error: null,
        };
      }
      if (ctx.table === "employees") {
        return {
          data: {
            id: EMPLOYEE_ID,
            school_id: TEST_UUIDS.school,
            audit_id: "audit-1",
          },
          error: null,
        };
      }
      return { data: { id: "row" }, error: null };
    });
    const result = await hireApplicant(supabase, {
      applicationId: APPLICATION_ID,
      schoolId: TEST_UUIDS.school,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.employeeId).toBe(EMPLOYEE_ID);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.hired" })
    );
  });
});

describe("onboarding", () => {
  it("seeds extended onboarding tasks", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "hr_onboarding_tasks" && ctx.operation === "select") {
        return { data: [], error: null };
      }
      if (ctx.table === "hr_onboarding_tasks") {
        return { data: { id: TASK_ID }, error: null };
      }
      return { data: { id: TASK_ID }, error: null };
    });
    const inserted = await ensureExtendedOnboardingTasks(supabase, EMPLOYEE_ID);
    expect(inserted).toBeGreaterThan(0);
  });

  it("completes last task and moves to active", async () => {
    vi.mocked(recordActivity).mockClear();
    let taskSelects = 0;
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "hr_onboarding_tasks") {
        if (ctx.operation === "maybeSingle" || ctx.operation === "single") {
          return { data: { id: TASK_ID, employee_id: EMPLOYEE_ID }, error: null };
        }
        if (ctx.operation === "select") {
          taskSelects += 1;
          // After completion, pending list is empty
          return { data: taskSelects === 1 ? [] : [], error: null };
        }
        return { data: { id: TASK_ID }, error: null };
      }
      if (ctx.table === "employees") {
        return {
          data: {
            id: EMPLOYEE_ID,
            school_id: TEST_UUIDS.school,
            employment_status: "active",
            lifecycle_stage: "onboarding",
          },
          error: null,
        };
      }
      return { data: { id: "x" }, error: null };
    });
    const result = await completeOnboardingTask(supabase, TASK_ID);
    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.onboarding.completed" })
    );
  });
});

describe("contracts", () => {
  it("creates draft contracts linked to documents", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "employees") {
        return { data: { id: EMPLOYEE_ID, school_id: TEST_UUIDS.school }, error: null };
      }
      if (ctx.table === "hr_employment_contracts") {
        return { data: { id: CONTRACT_ID, audit_id: "audit-c" }, error: null };
      }
      return { data: { id: "x" }, error: null };
    });
    const created = await createEmploymentContract(supabase, {
      employeeId: EMPLOYEE_ID,
      title: "FY26 Contract",
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.documentId).toBeTruthy();
      expect(created.contractId).toBe(CONTRACT_ID);
    }
    const updated = await updateContractStatus(supabase, CONTRACT_ID, "active");
    expect(updated.ok).toBe(true);
  });
});

describe("certifications", () => {
  it("emits expiring certification alerts", async () => {
    vi.mocked(recordActivity).mockClear();
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "employee_certifications") {
        return {
          data: [
            {
              id: CERT_ID,
              employee_id: EMPLOYEE_ID,
              certification_name: "CPR",
              expiration_date: "2026-08-01",
              reminder_sent_at: null,
              employees: { id: EMPLOYEE_ID, school_id: TEST_UUIDS.school },
            },
          ],
          error: null,
        };
      }
      if (ctx.table === "platform_communications") {
        return { data: { id: "comm" }, error: null };
      }
      return { data: { id: "x" }, error: null };
    });
    const count = await emitCertificationExpiringAlerts(supabase, {
      schoolId: TEST_UUIDS.school,
    });
    expect(count).toBe(1);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.certification.expiring" })
    );
  });
});

describe("performance", () => {
  it("creates and completes reviews with EI", async () => {
    vi.mocked(recordActivity).mockClear();
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "performance_evaluations") {
        return {
          data: {
            id: EVAL_ID,
            employee_id: EMPLOYEE_ID,
            school_id: TEST_UUIDS.school,
          },
          error: null,
        };
      }
      return { data: { id: "x" }, error: null };
    });
    const created = await createPerformanceReview(supabase, {
      employeeId: EMPLOYEE_ID,
      schoolId: TEST_UUIDS.school,
      evaluationType: "annual",
    });
    expect(created.ok).toBe(true);
    const completed = await completePerformanceReview(supabase, EVAL_ID, {
      overallRating: "exceeds",
    });
    expect(completed.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.review.completed" })
    );
  });
});

describe("time off", () => {
  it("submits and approves leave with EI", async () => {
    vi.mocked(recordActivity).mockClear();
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "leave_requests") {
        return {
          data: {
            id: LEAVE_ID,
            employee_id: EMPLOYEE_ID,
            school_id: TEST_UUIDS.school,
            leave_type: "sick",
            start_date: "2026-08-01",
            end_date: "2026-08-02",
            status: "pending",
          },
          error: null,
        };
      }
      if (ctx.table === "platform_communications") {
        return { data: { id: "comm" }, error: null };
      }
      if (ctx.table === "employees") {
        return {
          data: {
            id: EMPLOYEE_ID,
            school_id: TEST_UUIDS.school,
            employment_status: "active",
            lifecycle_stage: "active",
          },
          error: null,
        };
      }
      return { data: { id: "x" }, error: null };
    });
    const submitted = await submitLeaveRequest(supabase, {
      employeeId: EMPLOYEE_ID,
      schoolId: TEST_UUIDS.school,
      leaveType: "sick",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
    });
    expect(submitted.ok).toBe(true);
    const decided = await decideLeaveRequest(supabase, {
      leaveId: LEAVE_ID,
      decision: "approved",
      setLeaveOfAbsence: false,
    });
    expect(decided.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.leave.approved" })
    );
  });
});

describe("assignments", () => {
  it("assigns employees across entities and emits EI", async () => {
    vi.mocked(recordActivity).mockClear();
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "hr_employee_assignments") {
        return { data: { id: "assign-1" }, error: null };
      }
      if (ctx.table === "employees") {
        return { data: { school_id: TEST_UUIDS.school }, error: null };
      }
      return { data: { id: "x" }, error: null };
    });
    const result = await assignEmployee(supabase, {
      employeeId: EMPLOYEE_ID,
      entityType: "program",
      entityId: "prog-1",
      entityLabel: "STEM Academy",
      effectiveStart: "2026-07-01",
    });
    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "employee.assigned" })
    );
  });
});

describe("extensions + workflow + EI wiring", () => {
  it("registers deferred HRIS adapters", async () => {
    ensureHrisExtensionsRegistered();
    expect(getExtension("adp")).toBeTruthy();
    expect(getExtension("paychex")).toBeTruthy();
    expect(getExtension("bamboohr")).toBeTruthy();
    expect(getExtension("ukg")).toBeTruthy();
    expect(getExtension("rippling")).toBeTruthy();

    const sync = await syncHrisProvider({
      operation: "sync_employees",
      organizationId: TEST_UUIDS.organization,
      provider: "adp",
    });
    expect(sync.deferred).toBe(true);
  });

  it("registers required HCM EI events", () => {
    for (const key of [
      "employee.created",
      "employee.updated",
      "employee.hired",
      "employee.promoted",
      "employee.assigned",
      "employee.certification.expiring",
      "employee.review.completed",
      "employee.leave.approved",
      "employee.terminated",
      "employee.onboarding.completed",
      "employee.offer.extended",
      "employee.deactivated",
      "employee.restored",
    ]) {
      expect(ACTIVITY_EVENT_CATALOG[key]).toBeTruthy();
    }
  });

  it("exposes HCM workflow actions and triggers", () => {
    const types = WORKFLOW_ACTION_LIBRARY.map((a) => a.type);
    expect(types).toContain("transition_employee_lifecycle");
    expect(types).toContain("approve_leave_request");
    expect(types).toContain("start_employee_onboarding");
    expect(types).toContain("send_hcm_reminder");
    expect(types).toContain("emit_certification_alerts");

    const events = new Set(
      WORKFLOW_TRIGGER_LIBRARY.flatMap((t) => t.activityEventTypes ?? [])
    );
    expect(events.has("employee.hired")).toBe(true);
    expect(events.has("employee.leave.approved")).toBe(true);
    expect(events.has("employee.certification.expiring")).toBe(true);
  });
});
