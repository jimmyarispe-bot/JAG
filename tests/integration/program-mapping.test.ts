import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  HISTORICAL_PROGRAM_ALIASES,
  PROGRAMS,
  STUDENTS_PROGRAM_CODES,
  assertCanonicalProgramForWrite,
  auditProgramOptions,
  parseProgramValue,
  programLabel,
} from "@/lib/constants/programs";
import { validateStudentFormProgram } from "@/components/students/StudentForm";
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
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
import { createStudent } from "@/lib/students/actions";

function formWith(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("school_id", TEST_UUIDS.school);
  formData.set("first_name", "Launch");
  formData.set("last_name", "Student");
  formData.set("grade_level", "3rd_grade");
  formData.set("enrollment_status", "enrolled");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("Academy Launch 002.1 — Program mapping audit", () => {
  it("every visible StudentForm option maps 1:1 to students_program_check", () => {
    const rows = auditProgramOptions();

    // Explicit matrix for the deliverable
    const expected: Array<{
      uiLabel: string;
      submittedValue: string;
      canonicalDbCode: string;
      pass: boolean;
    }> = [
      {
        uiLabel: "The Academy FL – In-Person",
        submittedValue: "academy_fl_campus",
        canonicalDbCode: "academy_fl_campus",
        pass: true,
      },
      {
        uiLabel: "The Academy FL – Virtual",
        submittedValue: "academy_fl_virtual",
        canonicalDbCode: "academy_fl_virtual",
        pass: true,
      },
      {
        uiLabel: "The Academy GA – In-Person",
        submittedValue: "academy_ga_campus",
        canonicalDbCode: "academy_ga_campus",
        pass: true,
      },
      {
        uiLabel: "The Academy GA – Hybrid",
        submittedValue: "academy_ga_hybrid",
        canonicalDbCode: "academy_ga_hybrid",
        pass: true,
      },
      {
        uiLabel: "The Academy HS",
        submittedValue: "academy_hs",
        canonicalDbCode: "academy_hs",
        pass: true,
      },
      {
        uiLabel: "The Academy Virtual – Full School Program",
        submittedValue: "academy_virtual",
        canonicalDbCode: "academy_virtual",
        pass: true,
      },
    ];

    expect(rows).toEqual(expected);
    expect(rows.every((r) => r.pass)).toBe(true);
    expect([...STUDENTS_PROGRAM_CODES].sort()).toEqual([...DB_STUDENTS_PROGRAM_CHECK].sort());
  });

  it("historical aliases are not offered as StudentForm option values", () => {
    const optionValues = new Set(PROGRAMS.map((p) => p.value));
    for (const alias of Object.keys(HISTORICAL_PROGRAM_ALIASES)) {
      expect(optionValues.has(alias as never)).toBe(false);
    }
  });

  it("write-path rejects historical aliases instead of silently remapping", () => {
    for (const [alias, canonical] of Object.entries(HISTORICAL_PROGRAM_ALIASES)) {
      const gate = assertCanonicalProgramForWrite(alias);
      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(gate.error).toContain(alias);
        expect(gate.error).toContain(canonical);
      }
      // Reading/display still resolves them
      expect(parseProgramValue(alias)).toBe(canonical);
      expect(programLabel(alias)).toBe(programLabel(canonical));
    }
  });
});

describe("Academy Launch 002.1 — createStudent for every program option", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(PROGRAMS.map((p) => [p.label, p.value] as const))(
    "creates successfully for %s (%s)",
    async (_label, programValue) => {
      const rpcCalls: Record<string, unknown>[] = [];
      const supabase = createMockSupabase(({ table, operation, payload }) => {
        if (table === "create_student_record" && operation === "rpc") {
          rpcCalls.push(payload as Record<string, unknown>);
          const program = (payload as { p_program?: string | null }).p_program;
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

      const clientError = validateStudentFormProgram(formWith({ program: programValue }));
      expect(clientError).toBeNull();

      const result = await createStudent(formWith({ program: programValue }));
      expect(result).toEqual({ id: TEST_UUIDS.student });
      expect(rpcCalls[0]?.p_program).toBe(programValue);
    }
  );

  it("client validation blocks historical aliases before the server action", () => {
    const error = validateStudentFormProgram(formWith({ program: "academy_hs_experience" }));
    expect(error).toContain("outdated");
    expect(error).toContain("academy_hs");
  });

  it("server rejects historical aliases before RPC", async () => {
    let wrote = false;
    const supabase = createMockSupabase(({ operation }) => {
      if (operation === "rpc") wrote = true;
      return { data: null, error: { message: "should not insert" } };
    });
    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);

    const result = await createStudent(formWith({ program: "academy_fl_in_person" }));

    expect(wrote).toBe(false);
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toContain("outdated");
  });

  it("empty program remains allowed (null at DB)", async () => {
    const rpcCalls: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "create_student_record" && operation === "rpc") {
        rpcCalls.push(payload as Record<string, unknown>);
        return { data: TEST_UUIDS.student, error: null };
      }
      return { data: null, error: null };
    });
    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);

    expect(validateStudentFormProgram(formWith({ program: "" }))).toBeNull();
    const result = await createStudent(formWith({ program: "" }));
    expect(result).toEqual({ id: TEST_UUIDS.student });
    expect(rpcCalls[0]?.p_program).toBeNull();
  });
});
