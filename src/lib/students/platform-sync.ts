import { createRelationship, upsertPrimaryRelationship } from "@/lib/platform/relationships";
import { extractSchoolOrganizationId, resolveActorUserId, resolveSchoolContext, resolveStudentContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Sync canonical platform relationships after student record changes. */
export async function syncStudentPlatformRelationships(
  supabase: AuthClient,
  studentId: string,
  options?: { campusId?: string | null }
) {
  const ctx = await resolveStudentContext(supabase, studentId);
  if (!ctx?.organizationId) return;

  const actorUserId = await resolveActorUserId(supabase);

  await upsertPrimaryRelationship(supabase, {
    organizationId: ctx.organizationId,
    schoolId: ctx.schoolId,
    relationshipType: "student.school",
    fromEntityType: "student",
    fromEntityId: studentId,
    toEntityType: "school",
    toEntityId: ctx.schoolId,
    isPrimary: true,
    source: "automation",
    createdBy: actorUserId,
    studentId,
    familyId: ctx.familyId,
  });

  if (ctx.familyId) {
    await upsertPrimaryRelationship(supabase, {
      organizationId: ctx.organizationId,
      schoolId: ctx.schoolId,
      relationshipType: "student.family",
      fromEntityType: "student",
      fromEntityId: studentId,
      toEntityType: "family",
      toEntityId: ctx.familyId,
      isPrimary: true,
      source: "automation",
      createdBy: actorUserId,
      studentId,
      familyId: ctx.familyId,
    });
  }

  const campusId = options?.campusId ?? ctx.campusId;
  if (campusId) {
    await upsertPrimaryRelationship(supabase, {
      organizationId: ctx.organizationId,
      schoolId: ctx.schoolId,
      relationshipType: "student.campus",
      fromEntityType: "student",
      fromEntityId: studentId,
      toEntityType: "campus",
      toEntityId: campusId,
      isPrimary: true,
      source: "automation",
      createdBy: actorUserId,
      studentId,
      familyId: ctx.familyId,
    });
  }
}

/** Link guardian to all students in the family via platform relationships. */
export async function syncGuardianStudentRelationships(
  supabase: AuthClient,
  guardianId: string,
  familyId: string
) {
  const { data: family } = await supabase
    .from("families")
    .select("school_id, schools(organization_id)")
    .eq("id", familyId)
    .maybeSingle();

  if (!family) return;

  const organizationId = extractSchoolOrganizationId(family.schools);
  if (!organizationId) return;

  const { data: guardian } = await supabase
    .from("guardians")
    .select("is_primary")
    .eq("id", guardianId)
    .maybeSingle();

  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("family_id", familyId);

  const actorUserId = await resolveActorUserId(supabase);

  for (const student of students ?? []) {
    await createRelationship(supabase, {
      organizationId,
      schoolId: family.school_id,
      relationshipType: "student.guardian",
      fromEntityType: "student",
      fromEntityId: student.id,
      toEntityType: "guardian",
      toEntityId: guardianId,
      isPrimary: guardian?.is_primary ?? false,
      source: "automation",
      createdBy: actorUserId,
      studentId: student.id,
      familyId,
    });
  }
}

/** Sync enrollment as a platform relationship. */
export async function syncEnrollmentRelationship(
  supabase: AuthClient,
  studentId: string,
  enrollmentId: string
) {
  const ctx = await resolveStudentContext(supabase, studentId);
  if (!ctx?.organizationId) return;

  const actorUserId = await resolveActorUserId(supabase);

  await createRelationship(supabase, {
    organizationId: ctx.organizationId,
    schoolId: ctx.schoolId,
    relationshipType: "student.enrollment",
    fromEntityType: "student",
    fromEntityId: studentId,
    toEntityType: "enrollment",
    toEntityId: enrollmentId,
    source: "automation",
    createdBy: actorUserId,
    studentId,
    familyId: ctx.familyId,
  });
}

/** Sync school → organization relationship for hierarchy views. */
export async function syncSchoolOrganizationRelationship(
  supabase: AuthClient,
  schoolId: string
) {
  const ctx = await resolveSchoolContext(supabase, schoolId);
  if (!ctx?.organizationId) return;

  const actorUserId = await resolveActorUserId(supabase);

  await upsertPrimaryRelationship(supabase, {
    organizationId: ctx.organizationId,
    schoolId,
    relationshipType: "school.organization",
    fromEntityType: "school",
    fromEntityId: schoolId,
    toEntityType: "organization",
    toEntityId: ctx.organizationId,
    isPrimary: true,
    source: "automation",
    createdBy: actorUserId,
    recordActivity: false,
  });
}
