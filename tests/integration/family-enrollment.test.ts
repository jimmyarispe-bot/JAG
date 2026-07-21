import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import { FamilySection } from "@/components/students/profile/sections/StudentSectionViews";
import type { StudentProfileEnvelope } from "@/lib/students/profile/types";
import type { StudentRecord } from "@/lib/students/queries";
import { deriveFamilyName } from "@/lib/constants/guardians";
import { permissionsForGroup } from "@/lib/platform/identity/permission-groups";

const FAMILY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const FAMILY_ID_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";
const GUARDIAN_ID = "cccccccc-cccc-4ccc-8ccc-ccccccccccc1";
const SIBLING_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd1";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/platform/identity/action-guards", () => ({
  assertPermission: vi.fn(),
  assertAnyPermission: vi.fn(),
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

vi.mock("@/lib/families/portal-invite", () => ({
  inviteParentPortalGuardians: vi.fn(async () => undefined),
}));

import { assertAnyPermission, assertPermission } from "@/lib/platform/identity/action-guards";
import { createFamilyWithGuardians, linkStudentToFamily } from "@/lib/families/actions";
import { createStudent } from "@/lib/students/actions";

function familyForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("school_id", TEST_UUIDS.school);
  formData.set("primary_first_name", "Pat");
  formData.set("primary_last_name", "Rivera");
  formData.set("primary_relationship", "mother");
  formData.set("primary_email", "pat.rivera@example.com");
  formData.set("primary_phone", "555-0100");
  formData.set("primary_preferred_contact_method", "email");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

function studentForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("school_id", TEST_UUIDS.school);
  formData.set("first_name", "Alex");
  formData.set("last_name", "Rivera");
  formData.set("program", "academy_fl_campus");
  formData.set("grade_level", "3rd_grade");
  formData.set("enrollment_status", "enrolled");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

function studentRecord(overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    id: TEST_UUIDS.student,
    school_id: TEST_UUIDS.school,
    family_id: null,
    first_name: "Alex",
    last_name: "Rivera",
    preferred_name: null,
    date_of_birth: null,
    grade_level: "3rd_grade",
    gender: null,
    program: "academy_fl_campus",
    enrollment_status: "enrolled",
    status: "active",
    student_number: null,
    state_student_ids: [],
    photo_url: null,
    enrollment_start_date: null,
    enrollment_exit_date: null,
    graduation_year: null,
    admissions_lead_id: null,
    admissions_application_id: null,
    lifecycle_stage: "active",
    funding_sources: [],
    schools: { name: "Test School" },
    campuses: null,
    families: null,
    ...overrides,
  };
}

function envelope(overrides: Partial<StudentProfileEnvelope> = {}): StudentProfileEnvelope {
  return {
    profileKind: "student",
    entityType: "student",
    entityId: TEST_UUIDS.student,
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
    campusId: null,
    displayName: "Alex Rivera",
    subtitle: "Student Profile",
    permissions: ["students.view", "students.edit", "families.manage"],
    enabledModules: ["platform", "ssis"],
    basePath: "/dashboard/students",
    sectionParam: "section",
    defaultSection: "overview",
    studentId: TEST_UUIDS.student,
    familyId: null,
    gradeLevel: "3rd_grade",
    program: "academy_fl_campus",
    enrollmentStatus: "enrolled",
    lifecycleStage: "active",
    photoUrl: null,
    preferredName: null,
    ...overrides,
  };
}

describe("Academy Launch 002 — Family Management permissions", () => {
  it("Admissions and SIS groups include families.manage", () => {
    expect(permissionsForGroup("ADMISSIONS_ACCESS")).toContain("families.manage");
    expect(permissionsForGroup("SIS_ACCESS")).toContain("families.manage");
  });

  it("Teachers can view students but not manage families", () => {
    const teacher = permissionsForGroup("TEACHER_ACCESS");
    expect(teacher).toContain("students.view");
    expect(teacher).not.toContain("families.manage");
    expect(teacher).not.toContain("students.edit");
  });
});

describe("Academy Launch 002 — Create new family during enrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates family + guardians and links the student in one RPC", async () => {
    const rpcCalls: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "create_family_with_guardians" && operation === "rpc") {
        rpcCalls.push(payload as Record<string, unknown>);
        return {
          data: {
            family_id: FAMILY_ID,
            guardian_ids: [GUARDIAN_ID],
            student_id: TEST_UUIDS.student,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });
    vi.mocked(assertAnyPermission).mockResolvedValue({ supabase } as never);

    const result = await createFamilyWithGuardians(
      familyForm({
        student_id: TEST_UUIDS.student,
        student_last_name: "Rivera",
        include_second_guardian: "true",
        second_first_name: "Jordan",
        second_last_name: "Rivera",
        second_relationship: "father",
        second_email: "jordan.rivera@example.com",
      })
    );

    expect(result).toEqual({
      familyId: FAMILY_ID,
      guardianIds: [GUARDIAN_ID],
      studentId: TEST_UUIDS.student,
    });
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0]).toMatchObject({
      p_school_id: TEST_UUIDS.school,
      p_family_name: deriveFamilyName("Rivera", "Rivera"),
      p_student_id: TEST_UUIDS.student,
      p_billing_email: "pat.rivera@example.com",
      p_billing_phone: "555-0100",
    });
    const guardians = rpcCalls[0]?.p_guardians as Array<Record<string, unknown>>;
    expect(guardians).toHaveLength(2);
    expect(guardians[0]).toMatchObject({
      first_name: "Pat",
      last_name: "Rivera",
      is_primary: true,
      email: "pat.rivera@example.com",
    });
    expect(guardians[1]).toMatchObject({
      first_name: "Jordan",
      last_name: "Rivera",
      is_primary: false,
    });
  });

  it("rejects create when primary guardian name is missing", async () => {
    const supabase = createMockSupabase(() => ({ data: null, error: null }));
    vi.mocked(assertAnyPermission).mockResolvedValue({ supabase } as never);

    const result = await createFamilyWithGuardians(
      familyForm({ primary_first_name: "", primary_last_name: "" })
    );

    expect(result).toEqual({ error: "Primary guardian first and last name are required." });
  });
});

describe("Academy Launch 002 — Link student to existing family", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links via createStudent with family_id (enrollment Yes path)", async () => {
    const rpcCalls: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "create_student_record" && operation === "rpc") {
        rpcCalls.push(payload as Record<string, unknown>);
        return { data: TEST_UUIDS.student, error: null };
      }
      return { data: null, error: null };
    });
    vi.mocked(assertPermission).mockResolvedValue({ supabase } as never);

    const result = await createStudent(studentForm({ family_id: FAMILY_ID }));

    expect(result).toEqual({ id: TEST_UUIDS.student });
    expect(rpcCalls[0]).toMatchObject({
      p_family_id: FAMILY_ID,
      p_first_name: "Alex",
      p_last_name: "Rivera",
    });
  });

  it("links an existing student via link_student_to_family RPC", async () => {
    const rpcCalls: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "link_student_to_family" && operation === "rpc") {
        rpcCalls.push(payload as Record<string, unknown>);
        return {
          data: { student_id: TEST_UUIDS.student, family_id: FAMILY_ID },
          error: null,
        };
      }
      if (table === "guardians" && operation === "select") {
        return { data: [{ id: GUARDIAN_ID }], error: null };
      }
      return { data: null, error: null };
    });
    vi.mocked(assertAnyPermission).mockResolvedValue({ supabase } as never);

    const formData = new FormData();
    formData.set("student_id", TEST_UUIDS.student);
    formData.set("family_id", FAMILY_ID);

    const result = await linkStudentToFamily(formData);

    expect(result).toEqual({ studentId: TEST_UUIDS.student, familyId: FAMILY_ID });
    expect(rpcCalls).toEqual([
      { p_student_id: TEST_UUIDS.student, p_family_id: FAMILY_ID },
    ]);
  });
});

describe("Academy Launch 002 — Multiple students in one family", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("can link a second student to the same family", async () => {
    const links: Array<{ student: string; family: string }> = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "link_student_to_family" && operation === "rpc") {
        const args = payload as { p_student_id: string; p_family_id: string };
        links.push({ student: args.p_student_id, family: args.p_family_id });
        return {
          data: { student_id: args.p_student_id, family_id: args.p_family_id },
          error: null,
        };
      }
      if (table === "guardians") {
        return { data: [{ id: GUARDIAN_ID }], error: null };
      }
      return { data: null, error: null };
    });
    vi.mocked(assertAnyPermission).mockResolvedValue({ supabase } as never);

    for (const studentId of [TEST_UUIDS.student, SIBLING_ID]) {
      const formData = new FormData();
      formData.set("student_id", studentId);
      formData.set("family_id", FAMILY_ID);
      const result = await linkStudentToFamily(formData);
      expect(result).toEqual({ studentId, familyId: FAMILY_ID });
    }

    expect(links).toEqual([
      { student: TEST_UUIDS.student, family: FAMILY_ID },
      { student: SIBLING_ID, family: FAMILY_ID },
    ]);
  });
});

describe("Academy Launch 002 — Student profile family section", () => {
  it("empty state shows Create Family and Link Existing Family when manageable", () => {
    const html = renderToStaticMarkup(
      createElement(FamilySection, {
        envelope: envelope(),
        data: {
          student: studentRecord(),
          guardians: [],
          authorizedContacts: [],
          siblings: [],
          households: [],
          relationships: [],
          families: [{ id: FAMILY_ID_2, family_name: "Other Family", billing_email: null }],
          canManageFamily: true,
        },
      })
    );

    expect(html).toContain("No family has been linked yet.");
    expect(html).toContain("Create Family");
    expect(html).toContain("Link Existing Family");
  });

  it("linked family shows guardian contact details (viewable by teachers)", () => {
    const html = renderToStaticMarkup(
      createElement(FamilySection, {
        envelope: envelope({
          familyId: FAMILY_ID,
          permissions: ["students.view"],
        }),
        data: {
          student: studentRecord({
            family_id: FAMILY_ID,
            families: { family_name: "Rivera Family" },
          }),
          guardians: [
            {
              id: GUARDIAN_ID,
              family_id: FAMILY_ID,
              first_name: "Pat",
              last_name: "Rivera",
              email: "pat.rivera@example.com",
              phone: "555-0100",
              is_primary: true,
              relationship_to_student: "mother",
            },
          ],
          authorizedContacts: [],
          siblings: [{ id: SIBLING_ID, first_name: "Sam", last_name: "Rivera" }],
          households: [],
          relationships: [],
          canManageFamily: false,
        },
      })
    );

    expect(html).toContain("Family: Rivera Family");
    expect(html).toContain("Pat Rivera");
    expect(html).toContain("pat.rivera@example.com");
    expect(html).toContain("555-0100");
    expect(html).not.toContain("Create Family");
    expect(html).not.toContain("No family has been linked yet.");
  });

  it("teachers without manage permission see view-only empty state", () => {
    const html = renderToStaticMarkup(
      createElement(FamilySection, {
        envelope: envelope({ permissions: ["students.view"], familyId: null }),
        data: {
          student: studentRecord(),
          guardians: [],
          authorizedContacts: [],
          siblings: [],
          households: [],
          relationships: [],
          families: [],
          canManageFamily: false,
        },
      })
    );

    expect(html).toContain("No family has been linked yet.");
    expect(html).toContain("Contact Admissions or School Leadership");
    expect(html).not.toContain(">Create Family<");
  });
});
