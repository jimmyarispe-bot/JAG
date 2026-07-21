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
  archiveStudent,
  canManageStudentLifecycle,
  deleteStudent,
  restoreStudent,
} from "@/lib/students/lifecycle";
import { inspectStudentDependencies } from "@/lib/students/lifecycle/dependencies";

function identityWithRoles(roles: string[]): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: ["students.edit"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("CEO") || roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

const FAMILY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function studentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_UUIDS.student,
    school_id: TEST_UUIDS.school,
    family_id: null,
    first_name: "Ava",
    last_name: "Nguyen",
    status: "active",
    previous_status: null,
    enrollment_status: "enrolled",
    program: "academy_fl_campus",
    student_number: "S-100",
    archived_at: null,
    ...overrides,
  };
}

describe("Student lifecycle permissions", () => {
  it("CEO can archive", () => {
    expect(canManageStudentLifecycle(identityWithRoles(["CEO"]))).toBe(true);
  });

  it("School Leader can archive", () => {
    expect(canManageStudentLifecycle(identityWithRoles(["SCHOOL_LEADER"]))).toBe(true);
  });

  it("Teacher cannot archive", () => {
    expect(canManageStudentLifecycle(identityWithRoles(["TEACHER"]))).toBe(false);
  });

  it("Parent cannot archive", () => {
    expect(canManageStudentLifecycle(identityWithRoles(["PARENT"]))).toBe(false);
  });
});

describe("archiveStudent / restoreStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archives an active student and records audit", async () => {
    const updates: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "students" && operation === "maybeSingle") {
        // loadStudent: no patch; applyStudentUpdate: patch present
        if (payload && typeof payload === "object" && "status" in (payload as object)) {
          updates.push(payload as Record<string, unknown>);
          return {
            data: { id: TEST_UUIDS.student },
            error: null,
          };
        }
        return { data: studentRow(), error: null };
      }
      return { data: null, error: null };
    });

    const result = await archiveStudent(supabase, {
      studentId: TEST_UUIDS.student,
      reason: "End of year",
    });

    expect(result.ok).toBe(true);
    expect(updates[0]).toMatchObject({
      status: "archived",
      previous_status: "active",
    });
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        eventType: "student.archived",
        entityId: TEST_UUIDS.student,
      })
    );
  });

  it("surfaces DB errors instead of Student not found", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "students" && operation === "maybeSingle") {
        return {
          data: null,
          error: { message: "column students.previous_status does not exist" },
        };
      }
      return { data: null, error: null };
    });

    const result = await archiveStudent(supabase, {
      studentId: TEST_UUIDS.student,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("failed");
      expect(result.error).toMatch(/Unable to load student|previous_status/i);
      expect(result.error).not.toBe("Student not found");
    }
  });

  it("accepts non-RFC UUID-shaped ids (no version/variant gate)", async () => {
    // UUID v7-style version nibble — previously rejected by RFC [1-5]/[89ab] regex
    const v7 = "018f3c2a-7b6e-7c3d-9e1a-2b4c6d8e0f12";
    const updates: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "students" && operation === "maybeSingle") {
        if (payload && typeof payload === "object" && "status" in (payload as object)) {
          updates.push(payload as Record<string, unknown>);
          return { data: { id: v7 }, error: null };
        }
        return { data: studentRow({ id: v7 }), error: null };
      }
      return { data: null, error: null };
    });

    const result = await archiveStudent(supabase, { studentId: v7 });
    expect(result.ok).toBe(true);
    expect(updates[0]).toMatchObject({ status: "archived" });
  });

  it("reports empty studentId clearly without querying", async () => {
    const supabase = createMockSupabase(() => {
      throw new Error("should not query");
    });
    const result = await archiveStudent(supabase, { studentId: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/missing student id/i);
    }
  });

  it("restore succeeds for archived student", async () => {
    const updates: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "students" && operation === "maybeSingle") {
        if (payload && typeof payload === "object" && "status" in (payload as object)) {
          updates.push(payload as Record<string, unknown>);
          return { data: { id: TEST_UUIDS.student }, error: null };
        }
        return {
          data: studentRow({ status: "archived", previous_status: "active" }),
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await restoreStudent(supabase, { studentId: TEST_UUIDS.student });
    expect(result.ok).toBe(true);
    expect(updates[0]).toMatchObject({
      status: "active",
      previous_status: null,
      archived_at: null,
    });
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "student.restored" })
    );
  });
});

describe("deleteStudent dependency gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks delete when attendance exists", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "students" && operation === "maybeSingle") {
        return { data: studentRow(), error: null };
      }
      if (table === "student_attendance_records" && (operation === "select" || operation === "then")) {
        return { data: null, error: null, count: 2 };
      }
      return { data: null, error: null, count: 0 };
    });

    const deps = await inspectStudentDependencies(supabase, TEST_UUIDS.student, null);
    expect(deps.canDelete).toBe(false);
    expect(deps.blocking.some((b) => b.key === "attendance")).toBe(true);

    const result = await deleteStudent(supabase, {
      studentId: TEST_UUIDS.student,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("has_dependencies");
      expect(result.suggestArchive).toBe(true);
    }
  });

  it("blocks delete when scholarship exists", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "students" && operation === "maybeSingle") {
        return { data: studentRow(), error: null };
      }
      if (table === "scholarship_applications") {
        return { data: null, error: null, count: 1 };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await deleteStudent(supabase, {
      studentId: TEST_UUIDS.student,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("has_dependencies");
  });

  it("blocks delete when billing exists", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "students") {
        return { data: studentRow(), error: null };
      }
      if (table === "invoices") {
        return { data: null, error: null, count: 3 };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await deleteStudent(supabase, {
      studentId: TEST_UUIDS.student,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("has_dependencies");
  });

  it("blocks delete when family exists", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "students") {
        return {
          data: studentRow({ family_id: FAMILY_ID }),
          error: null,
        };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await deleteStudent(supabase, {
      studentId: TEST_UUIDS.student,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("has_dependencies");
      expect(result.dependencies?.blocking.some((b) => b.key === "family")).toBe(true);
    }
  });

  it("delete succeeds with no dependencies only when exactly one row is removed", async () => {
    let deleted = false;
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "students" && operation === "maybeSingle") {
        return { data: studentRow({ family_id: null }), error: null };
      }
      if (table === "students" && operation === "delete") {
        deleted = true;
        return { data: [{ id: TEST_UUIDS.student }], error: null };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await deleteStudent(supabase, {
      studentId: TEST_UUIDS.student,
      confirmationText: "DELETE",
      acknowledged: true,
    });

    expect(result.ok).toBe(true);
    expect(deleted).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        eventType: "student.deleted",
        payload: expect.objectContaining({ confirmed: true, dependenciesChecked: true }),
      })
    );
  });

  it("treats a zero-row delete (RLS / no match) as failure", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "students" && operation === "maybeSingle") {
        return { data: studentRow({ family_id: null }), error: null };
      }
      if (table === "students" && operation === "delete") {
        // PostgREST/RLS shape: error null, empty returning set
        return { data: [], error: null };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await deleteStudent(supabase, {
      studentId: TEST_UUIDS.student,
      confirmationText: "DELETE",
      acknowledged: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("delete_failed");
      expect(result.error).toBe(
        "Student could not be deleted because no row was deleted."
      );
    }
  });

  it("requires confirmation checkbox and DELETE text", async () => {
    const supabase = createMockSupabase(() => ({
      data: studentRow(),
      error: null,
      count: 0,
    }));

    const result = await deleteStudent(supabase, {
      studentId: TEST_UUIDS.student,
      confirmationText: "delete",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("confirmation_required");
  });
});
