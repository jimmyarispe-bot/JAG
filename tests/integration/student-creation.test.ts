import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_PROGRAM_ALIASES,
  PROGRAMS,
  parseProgramValue,
  STUDENTS_PROGRAM_CODES,
} from "@/lib/constants/programs";
import { resolveStudentCreateUiState } from "@/lib/students/create-result";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";

/** Mirrors public.students_program_check from 053_phase1_sis_tables.sql */
const DB_STUDENTS_PROGRAM_CHECK = [
  "academy_fl_campus",
  "academy_fl_virtual",
  "academy_ga_campus",
  "academy_ga_hybrid",
  "academy_hs",
  "academy_virtual",
] as const;

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/platform/identity/action-guards", () => ({
  assertPermission: vi.fn(),
}));

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
  extractSchoolOrganizationId: vi.fn(() => TEST_UUIDS.organization),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

vi.mock("@/lib/students/platform-sync", () => ({
  syncStudentPlatformRelationships: vi.fn(async () => undefined),
  syncEnrollmentRelationship: vi.fn(async () => undefined),
  syncGuardianStudentRelationships: vi.fn(async () => undefined),
}));

import { assertPermission } from "@/lib/platform/identity/action-guards";
import { recordActivity } from "@/lib/platform/activity";
import { syncStudentPlatformRelationships } from "@/lib/students/platform-sync";
import { createStudent } from "@/lib/students/actions";
import { programLabel } from "@/lib/constants/programs";

function formWith(
  overrides: Record<string, string> = {}
): FormData {
  const formData = new FormData();
  formData.set("school_id", TEST_UUIDS.school);
  formData.set("first_name", "Launch");
  formData.set("last_name", "Student");
  formData.set("program", "academy_fl_campus");
  formData.set("grade_level", "3rd_grade");
  formData.set("enrollment_status", "enrolled");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("Student enrollment — program integrity (Academy Launch 001)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UI PROGRAMS values are exactly the students_program_check set", () => {
    expect([...STUDENTS_PROGRAM_CODES].sort()).toEqual([...DB_STUDENTS_PROGRAM_CHECK].sort());
    for (const program of PROGRAMS) {
      expect(DB_STUDENTS_PROGRAM_CHECK).toContain(program.value);
    }
  });

  it("maps historical aliases for read/display only (not StudentForm writes)", () => {
    expect(parseProgramValue("academy_hs_experience")).toBe("academy_hs");
    expect(parseProgramValue("academy_fl_in_person")).toBe("academy_fl_campus");
    expect(parseProgramValue("academy_ga_virtual")).toBe("academy_ga_hybrid");
    expect(parseProgramValue("academy_virtual_full_school")).toBe("academy_virtual");
    expect(parseProgramValue("not_a_program")).toBeNull();
    expect(
      Object.values(LEGACY_PROGRAM_ALIASES).every((v) =>
        (DB_STUDENTS_PROGRAM_CHECK as readonly string[]).includes(v)
      )
    ).toBe(true);
  });

  it("creates a student via atomic RPC with school, program, grade, and family", async () => {
    const rpcCalls: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "create_student_record" && operation === "rpc") {
        rpcCalls.push(payload as Record<string, unknown>);
        const program = (payload as { p_program?: string | null })?.p_program;
        if (
          program != null &&
          !(DB_STUDENTS_PROGRAM_CHECK as readonly string[]).includes(program)
        ) {
          return {
            data: null,
            error: {
              message: `new row for relation "students" violates check constraint "students_program_check"`,
            },
          };
        }
        return { data: TEST_UUIDS.student, error: null };
      }
      return { data: null, error: null };
    });

    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);

    const result = await createStudent(
      formWith({ family_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" })
    );

    expect(result).toEqual({ id: TEST_UUIDS.student });
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0]).toMatchObject({
      p_school_id: TEST_UUIDS.school,
      p_family_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      p_first_name: "Launch",
      p_last_name: "Student",
      p_program: "academy_fl_campus",
      p_grade_level: "3rd_grade",
      p_enrollment_status: "enrolled",
    });
    expect(programLabel(rpcCalls[0].p_program as string)).toBe(
      "The Academy FL – In-Person"
    );
  });

  it("rejects historical aliases on create (no silent remap to DB)", async () => {
    let wrote = false;
    const supabase = createMockSupabase(({ operation }) => {
      if (operation === "rpc") wrote = true;
      return { data: null, error: { message: "should not insert" } };
    });

    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);

    const result = await createStudent(
      formWith({ program: "academy_hs_experience", grade_level: "9th_grade" })
    );

    expect(wrote).toBe(false);
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toContain("outdated");
    expect((result as { error: string }).error).toContain("academy_hs");
  });

  it("rejects unknown programs before any database write", async () => {
    let wrote = false;
    const supabase = createMockSupabase(({ operation }) => {
      if (operation === "rpc") wrote = true;
      return { data: null, error: { message: "should not insert" } };
    });
    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);

    const result = await createStudent(formWith({ program: "totally_invalid_program" }));

    expect(wrote).toBe(false);
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toContain("Invalid program");
  });
});

describe("Student creation atomicity & UI error state (Academy Launch 001)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only an error when the atomic RPC fails (no student id)", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "create_student_record" && operation === "rpc") {
        return {
          data: null,
          error: {
            message: `new row for relation "students" violates check constraint "students_program_check"`,
          },
        };
      }
      return { data: null, error: null };
    });
    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);

    const result = await createStudent(formWith({ program: "academy_fl_campus" }));

    expect(result).toEqual({
      error: `new row for relation "students" violates check constraint "students_program_check"`,
    });
    expect("id" in result && result.id).toBeFalsy();
  });

  it("still returns success id when post-commit side effects fail", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "create_student_record" && operation === "rpc") {
        return { data: TEST_UUIDS.student, error: null };
      }
      return { data: null, error: null };
    });
    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);
    vi.mocked(recordActivity).mockRejectedValueOnce(
      new Error(`violates check constraint "students_program_check"`)
    );
    vi.mocked(syncStudentPlatformRelationships).mockRejectedValueOnce(
      new Error("relationship sync failed")
    );

    const result = await createStudent(formWith());

    expect(result).toEqual({ id: TEST_UUIDS.student });
    expect("error" in result).toBe(false);
  });

  it("successful create does not leave the UI in an error state", () => {
    const ui = resolveStudentCreateUiState({ id: TEST_UUIDS.student });
    expect(ui).toEqual({
      status: "success",
      studentId: TEST_UUIDS.student,
      errorMessage: null,
    });
  });

  it("ignores stale error strings when a student id was returned", () => {
    const ui = resolveStudentCreateUiState({
      id: TEST_UUIDS.student,
      error: `new row for relation "students" violates check constraint "students_program_check"`,
    });
    expect(ui.status).toBe("success");
    expect(ui.errorMessage).toBeNull();
    expect(ui.studentId).toBe(TEST_UUIDS.student);
  });

  it("maps failed creates to a UI error without a student id", () => {
    const ui = resolveStudentCreateUiState({
      error: `new row for relation "students" violates check constraint "students_program_check"`,
    });
    expect(ui).toEqual({
      status: "error",
      studentId: null,
      errorMessage: `new row for relation "students" violates check constraint "students_program_check"`,
    });
  });
});
