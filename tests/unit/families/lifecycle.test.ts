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

vi.mock("@/lib/students/platform-sync", () => ({
  syncStudentPlatformRelationships: vi.fn(async () => undefined),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  archiveFamily,
  canEditFamilies,
  canManageFamilyLifecycle,
  deleteFamily,
  getFamilySiblings,
  mergeFamilies,
  moveStudentToFamily,
  restoreFamily,
  splitFamily,
} from "@/lib/families";
import { familyGroupKey, findExistingFamily } from "@/lib/platform/imports/entities/student/family-intelligence";
import type { ImportLookupContext } from "@/lib/platform/imports/types";

const FAMILY_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FAMILY_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function identityWithRoles(roles: string[]): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: ["students.edit", "families.manage"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("CEO") || roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

function familyRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    school_id: TEST_UUIDS.school,
    family_name: "Carter Family",
    status: "active",
    previous_status: null,
    ...overrides,
  };
}

describe("Family permissions", () => {
  it("CEO and School Leader have lifecycle access", () => {
    expect(canManageFamilyLifecycle(identityWithRoles(["CEO"]))).toBe(true);
    expect(canManageFamilyLifecycle(identityWithRoles(["SCHOOL_LEADER"]))).toBe(true);
  });

  it("Admissions can edit but not lifecycle-delete", () => {
    expect(canEditFamilies(identityWithRoles(["ADMISSIONS"]))).toBe(true);
    expect(canManageFamilyLifecycle(identityWithRoles(["ADMISSIONS"]))).toBe(false);
  });

  it("Teacher and Parent cannot manage lifecycle", () => {
    expect(canManageFamilyLifecycle(identityWithRoles(["TEACHER"]))).toBe(false);
    expect(canManageFamilyLifecycle(identityWithRoles(["PARENT"]))).toBe(false);
  });
});

describe("Family archive / restore / delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("archives a family", async () => {
    const updates: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "families" && operation === "maybeSingle") {
        return { data: familyRow(FAMILY_A), error: null };
      }
      if (table === "families" && operation === "update") {
        updates.push(payload as Record<string, unknown>);
        return { data: null, error: null };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await archiveFamily(supabase, { familyId: FAMILY_A });
    expect(result.ok).toBe(true);
    expect(updates[0]).toMatchObject({ status: "archived", previous_status: "active" });
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "family.archived" })
    );
  });

  it("restore succeeds", async () => {
    const updates: Record<string, unknown>[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "families" && operation === "maybeSingle") {
        return {
          data: familyRow(FAMILY_A, { status: "archived", previous_status: "active" }),
          error: null,
        };
      }
      if (table === "families" && operation === "update") {
        updates.push(payload as Record<string, unknown>);
        return { data: null, error: null };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await restoreFamily(supabase, { familyId: FAMILY_A });
    expect(result.ok).toBe(true);
    expect(updates[0]).toMatchObject({ status: "active", previous_status: null });
  });

  it("delete blocked when students exist", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "families" && operation === "maybeSingle") {
        return { data: familyRow(FAMILY_A), error: null };
      }
      if (table === "students") {
        return { data: null, error: null, count: 2 };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await deleteFamily(supabase, {
      familyId: FAMILY_A,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("has_dependencies");
      expect(result.suggestArchive).toBe(true);
    }
  });

  it("delete succeeds with no dependencies", async () => {
    let deleted = false;
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "families" && operation === "maybeSingle") {
        return { data: familyRow(FAMILY_A), error: null };
      }
      if (table === "families" && operation === "delete") {
        deleted = true;
        return { data: null, error: null };
      }
      return { data: null, error: null, count: 0 };
    });

    const result = await deleteFamily(supabase, {
      familyId: FAMILY_A,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(true);
    expect(deleted).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "family.deleted" })
    );
  });
});

describe("Merge / split families", () => {
  beforeEach(() => vi.clearAllMocks());

  it("merges families and archives source", async () => {
    const studentUpdates: unknown[] = [];
    const familyUpdates: unknown[] = [];
    const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
      if (table === "families" && operation === "select") {
        return {
          data: [
            familyRow(FAMILY_A, { family_name: "Source" }),
            familyRow(FAMILY_B, { family_name: "Target" }),
          ],
          error: null,
        };
      }
      if (table === "students" && operation === "select") {
        return { data: [{ id: TEST_UUIDS.student }], error: null };
      }
      if (table === "students" && operation === "update") {
        studentUpdates.push(payload);
        return { data: null, error: null };
      }
      if (table === "guardians" && operation === "select") {
        return { data: [{ id: "g1", email: "a@b.com", is_primary: true }], error: null };
      }
      if (table === "guardians" && operation === "maybeSingle") {
        return { data: { id: "g-target" }, error: null };
      }
      if (table === "guardians" && operation === "update") {
        return { data: null, error: null };
      }
      if (table === "families" && operation === "update") {
        familyUpdates.push(payload);
        return { data: null, error: null };
      }
      if (table === "family_billing_accounts") {
        return { data: null, error: null };
      }
      if (table === "family_households") {
        return { data: null, error: null };
      }
      void filters;
      return { data: null, error: null, count: 0 };
    });

    const result = await mergeFamilies(supabase, {
      sourceFamilyId: FAMILY_A,
      targetFamilyId: FAMILY_B,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.movedStudents).toBe(1);
      expect(result.targetFamilyId).toBe(FAMILY_B);
    }
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "family.merged" })
    );
  });

  it("splits selected students into a new family", async () => {
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "families" && operation === "maybeSingle") {
        return { data: familyRow(FAMILY_A), error: null };
      }
      if (table === "students" && operation === "select") {
        return {
          data: [
            { id: TEST_UUIDS.student, family_id: FAMILY_A, last_name: "Carter" },
          ],
          error: null,
        };
      }
      if (table === "families" && operation === "single") {
        return { data: { id: FAMILY_B }, error: null };
      }
      if (table === "students" && operation === "update") {
        expect((payload as { family_id?: string }).family_id).toBe(FAMILY_B);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const result = await splitFamily(supabase, {
      sourceFamilyId: FAMILY_A,
      studentIds: [TEST_UUIDS.student],
      newFamilyName: "Carter Household 2",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.newFamilyId).toBe(FAMILY_B);
      expect(result.movedStudentIds).toContain(TEST_UUIDS.student);
    }
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "family.split" })
    );
  });

  it("rejects split with no students selected", async () => {
    const supabase = createMockSupabase(() => ({ data: null, error: null }));
    const result = await splitFamily(supabase, {
      sourceFamilyId: FAMILY_A,
      studentIds: [],
      newFamilyName: "Empty",
    });
    expect(result.ok).toBe(false);
  });
});

describe("Student family relationships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("moves a student to another family and records timeline event", async () => {
    const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
      if (table === "students" && operation === "maybeSingle") {
        return {
          data: {
            id: TEST_UUIDS.student,
            school_id: TEST_UUIDS.school,
            family_id: FAMILY_A,
            first_name: "Ava",
            last_name: "Carter",
          },
          error: null,
        };
      }
      if (table === "families" && operation === "maybeSingle") {
        return { data: familyRow(FAMILY_B, { family_name: "Brooks" }), error: null };
      }
      if (table === "students" && operation === "update") {
        expect((payload as { family_id?: string }).family_id).toBe(FAMILY_B);
        expect(filters.id).toBe(TEST_UUIDS.student);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const result = await moveStudentToFamily(supabase, {
      studentId: TEST_UUIDS.student,
      familyId: FAMILY_B,
    });
    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "student.moved" })
    );
  });

  it("lists siblings sharing the same family", async () => {
    const siblingId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "students" && operation === "maybeSingle") {
        return {
          data: {
            id: TEST_UUIDS.student,
            family_id: FAMILY_A,
            school_id: TEST_UUIDS.school,
          },
          error: null,
        };
      }
      if (table === "students" && operation === "select") {
        return {
          data: [
            {
              id: siblingId,
              first_name: "Ben",
              last_name: "Carter",
              grade_level: "3",
              program: "academy",
              status: "active",
              school_id: TEST_UUIDS.school,
              photo_url: null,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const siblings = await getFamilySiblings(supabase, TEST_UUIDS.student);
    expect(siblings.some((s) => s.id === siblingId)).toBe(true);
  });
});

describe("Bulk import family duplicate prevention", () => {
  it("groups by guardian email / phone / household name", () => {
    expect(
      familyGroupKey({ parent_email: "a@example.com", parent_phone: "", family_name: "" })
    ).toBe("email:a@example.com");
    expect(
      familyGroupKey({ parent_email: "", parent_phone: "(555) 010-9999", family_name: "" })
    ).toBe("phone:5550109999");
    expect(
      familyGroupKey({ parent_email: "", parent_phone: "", family_name: "Nguyen Family" })
    ).toBe("household:nguyen family");
  });

  it("reuses existing family by email, phone, or household name", () => {
    const ctx: ImportLookupContext = {
      schoolIds: [TEST_UUIDS.school],
      campusIdsBySchool: new Map(),
      campusNamesBySchool: new Map(),
      programCodes: new Set(),
      schoolYearIdsBySchool: new Map(),
      existingStudents: [],
      existingGuardians: [
        {
          id: "g1",
          family_id: FAMILY_A,
          email: "parent@example.com",
          phone: "5551112222",
          first_name: "Pat",
          last_name: "Lee",
        },
      ],
      existingFamilies: [
        {
          id: FAMILY_B,
          school_id: TEST_UUIDS.school,
          family_name: "Brooks Family",
          primary_address: null,
          city: null,
          state: null,
          zip_code: null,
          billing_email: null,
          billing_phone: null,
        },
      ],
      fundingCodes: new Set(),
      fundingLabels: new Map(),
      scholarshipFundNames: new Map(),
    };

    expect(
      findExistingFamily({ parent_email: "parent@example.com" }, ctx, TEST_UUIDS.school)?.familyId
    ).toBe(FAMILY_A);
    expect(
      findExistingFamily({ parent_phone: "555-111-2222" }, ctx, TEST_UUIDS.school)?.familyId
    ).toBe(FAMILY_A);
    expect(
      findExistingFamily({ family_name: "Brooks Family" }, ctx, TEST_UUIDS.school)?.familyId
    ).toBe(FAMILY_B);
  });
});
