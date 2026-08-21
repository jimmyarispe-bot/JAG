import type { GradeValue } from "@/lib/constants/grades";
import {
  assertCanonicalProgramForWrite,
  type FundingSourceValue,
} from "@/lib/constants/programs";
import { syncStudentFundingSources } from "@/lib/funding/sync";
import { recordActivity } from "@/lib/platform/activity";
import { resolveSchoolContext } from "@/lib/platform/shared/context";
import {
  syncGuardianStudentRelationships,
  syncStudentPlatformRelationships,
} from "@/lib/students/platform-sync";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  ImportCommitHelpers,
  ImportDestination,
  ImportLookupContext,
  ImportRowCommitResult,
  PreviewRow,
} from "../../types";
import { findExistingFamily, splitParentName } from "./family-intelligence";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Enrollment status accepted on the student write path.
 * Mirrors StudentForm's options exactly — the platform has no inactive/alumni
 * state, so anything unrecognized falls back to "pending" rather than inventing
 * a value the DB constraint may reject.
 */
const STUDENT_ENROLLMENT_STATUSES = new Set(["enrolled", "pending", "waitlisted"]);

function normalizeEnrollmentStatus(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw) return "pending";
  if (STUDENT_ENROLLMENT_STATUSES.has(raw)) return raw;
  if (raw === "enrolled currently" || raw === "active" || raw === "current") return "enrolled";
  return "pending";
}

function asClient(helpers: ImportCommitHelpers): AuthClient {
  return helpers.supabase as AuthClient;
}

async function ensureFamilyAndGuardian(
  supabase: AuthClient,
  mapped: Record<string, unknown>,
  destination: ImportDestination,
  ctx: ImportLookupContext | undefined,
  actorUserId: string | null,
  related: ImportRowCommitResult["relatedEntities"]
): Promise<{ familyId: string; createdFamily: boolean; createdGuardian: boolean }> {
  const schoolId = destination.schoolId;
  const existing =
    (mapped._existing_family_id as string | undefined)
      ? { familyId: mapped._existing_family_id as string }
      : ctx
        ? findExistingFamily(mapped, ctx, schoolId)
        : null;

  if (existing?.familyId) {
    // Ensure guardian exists / link
    if (!mapped._existing_guardian_id && (mapped.parent_email || mapped.parent_name || mapped.parent_phone)) {
      const { firstName, lastName } = splitParentName(mapped.parent_name as string);
      const { data: guardian, error } = await supabase
        .from("guardians")
        .insert({
          family_id: existing.familyId,
          first_name: firstName,
          last_name: lastName,
          email: (mapped.parent_email as string) || null,
          phone: (mapped.parent_phone as string) || null,
          is_primary: true,
          receives_billing: true,
          receives_communications: true,
        })
        .select("id")
        .single();
      if (!error && guardian) {
        related?.push({ entityType: "guardian", entityId: guardian.id, action: "created" });
        await syncGuardianStudentRelationships(supabase, guardian.id, existing.familyId);
        return { familyId: existing.familyId, createdFamily: false, createdGuardian: true };
      }
    }
    related?.push({ entityType: "family", entityId: existing.familyId, action: "linked" });
    return { familyId: existing.familyId, createdFamily: false, createdGuardian: false };
  }

  const { firstName, lastName } = splitParentName(mapped.parent_name as string);
  const familyName =
    lastName && lastName !== "Guardian"
      ? `${lastName} Family`
      : `${String(mapped.last_name ?? "Student").trim()} Family`;

  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({
      school_id: schoolId,
      family_name: familyName,
      primary_address: (mapped.address as string) || null,
      city: (mapped.city as string) || null,
      state: (mapped.state as string) || null,
      zip_code: (mapped.zip as string) || null,
      billing_email: (mapped.parent_email as string) || null,
      billing_phone: (mapped.parent_phone as string) || null,
    })
    .select("id")
    .single();

  if (familyError || !family) {
    throw new Error(familyError?.message ?? "Unable to create family");
  }
  related?.push({ entityType: "family", entityId: family.id, action: "created" });

  const schoolCtx = await resolveSchoolContext(supabase, schoolId);
  if (actorUserId) {
    await recordActivity(supabase, {
      eventType: "family.created",
      moduleKey: "sis",
      entityType: "family",
      entityId: family.id,
      title: "Family created (import)",
      summary: familyName,
      organizationId: schoolCtx?.organizationId,
      schoolId,
      familyId: family.id,
      actorUserId,
      sourceTable: "families",
      sourceId: family.id,
    });
  }

  const { data: guardian, error: guardianError } = await supabase
    .from("guardians")
    .insert({
      family_id: family.id,
      first_name: firstName,
      last_name: lastName,
      email: (mapped.parent_email as string) || null,
      phone: (mapped.parent_phone as string) || null,
      is_primary: true,
      receives_billing: true,
      receives_communications: true,
    })
    .select("id")
    .single();

  if (!guardianError && guardian) {
    related?.push({ entityType: "guardian", entityId: guardian.id, action: "created" });
    await syncGuardianStudentRelationships(supabase, guardian.id, family.id);
  }

  return { familyId: family.id, createdFamily: true, createdGuardian: Boolean(guardian) };
}

export async function commitStudentRow(
  mapped: Record<string, unknown>,
  destination: ImportDestination,
  action: PreviewRow["action"],
  targetEntityId: string | null | undefined,
  helpers: ImportCommitHelpers,
  ctx?: ImportLookupContext
): Promise<ImportRowCommitResult> {
  const supabase = asClient(helpers);
  const related: NonNullable<ImportRowCommitResult["relatedEntities"]> = [];

  if (action === "skip" || action === "ask") {
    return { ok: true, action: "skipped" };
  }

  try {
    const lookup =
      ctx ?? (await loadStudentLookupContext(supabase, destination.schoolId));

    const programRaw =
      (mapped.program as string) || destination.program || "";
    const programGate = assertCanonicalProgramForWrite(programRaw);
    if (!programGate.ok) {
      return { ok: false, action: "failed", error: programGate.error };
    }

    const { familyId } = await ensureFamilyAndGuardian(
      supabase,
      mapped,
      destination,
      lookup,
      helpers.actorUserId,
      related
    );

    const fundingCodes = mapped._funding_code
      ? [String(mapped._funding_code)]
      : [];

    if (action === "update" || action === "merge") {
      const studentId = targetEntityId || (mapped._existing_student_id as string);
      if (!studentId) {
        return { ok: false, action: "failed", error: "No existing student to update" };
      }

      const patch: Record<string, unknown> = {
        family_id: familyId,
        preferred_name: (mapped.preferred_name as string) || null,
        date_of_birth: (mapped.date_of_birth as string) || null,
        grade_level: (mapped.grade_level as GradeValue) || null,
        gender: (mapped.gender as string) || null,
        program: programGate.program,
      };
      if (destination.campusId) patch.campus_id = destination.campusId;
      if (destination.schoolYearId) patch.school_year_id = destination.schoolYearId;

      if (action === "merge") {
        // Only fill blanks on merge
        const { data: current } = await supabase
          .from("students")
          .select("preferred_name, date_of_birth, grade_level, gender, campus_id, school_year_id")
          .eq("id", studentId)
          .maybeSingle();
        if (current) {
          for (const key of Object.keys(patch)) {
            const cur = (current as Record<string, unknown>)[key];
            if (cur != null && cur !== "") delete patch[key];
          }
        }
      }

      const { error } = await supabase.from("students").update(patch).eq("id", studentId);
      if (error) return { ok: false, action: "failed", error: error.message };

      if (fundingCodes.length) {
        await syncStudentFundingSources(
          supabase,
          studentId,
          fundingCodes as FundingSourceValue[]
        );
      }

      related.push({ entityType: "student", entityId: studentId, action: "updated" });
      try {
        await syncStudentPlatformRelationships(supabase, studentId);
      } catch {
        // best-effort
      }

      return {
        ok: true,
        action: "updated",
        entityType: "student",
        entityId: studentId,
        relatedEntities: related,
      };
    }

    // Create
    const { data: studentId, error } = await supabase.rpc("create_student_record", {
      p_school_id: destination.schoolId,
      p_first_name: String(mapped.first_name ?? "").trim(),
      p_last_name: String(mapped.last_name ?? "").trim(),
      p_family_id: familyId,
      p_preferred_name: (mapped.preferred_name as string) || null,
      p_date_of_birth: (mapped.date_of_birth as string) || null,
      p_grade_level: (mapped.grade_level as GradeValue) || null,
      p_gender: (mapped.gender as string) || null,
      p_program: programGate.program,
      p_enrollment_status: normalizeEnrollmentStatus(mapped.enrollment_status),
      p_funding_source_codes: fundingCodes,
    });

    if (error || !studentId) {
      return { ok: false, action: "failed", error: error?.message ?? "Unable to create student" };
    }

    const postPatch: Record<string, unknown> = {};
    if (destination.campusId) postPatch.campus_id = destination.campusId;
    if (destination.schoolYearId) postPatch.school_year_id = destination.schoolYearId;
    if (Object.keys(postPatch).length) {
      await supabase.from("students").update(postPatch).eq("id", studentId);
    }

    if (destination.schoolYearId) {
      const { data: enrollment } = await supabase
        .from("sis_enrollments")
        .insert({
          student_id: studentId,
          school_year_id: destination.schoolYearId,
          program: programGate.program,
          enrollment_status: "pending",
        })
        .select("id")
        .maybeSingle();
      if (enrollment?.id) {
        related.push({ entityType: "sis_enrollment", entityId: enrollment.id, action: "created" });
      }
    }

    related.push({ entityType: "student", entityId: studentId, action: "created" });

    try {
      const schoolCtx = await resolveSchoolContext(supabase, destination.schoolId);
      await recordActivity(supabase, {
        eventType: "student.created",
        moduleKey: "sis",
        entityType: "student",
        entityId: studentId,
        title: "Student imported",
        summary: `${mapped.first_name} ${mapped.last_name}`,
        organizationId: schoolCtx?.organizationId,
        schoolId: destination.schoolId,
        studentId,
        familyId,
        actorUserId: helpers.actorUserId,
        sourceTable: "students",
        sourceId: studentId,
      });
    } catch {
      // best-effort
    }

    try {
      await syncStudentPlatformRelationships(supabase, studentId);
    } catch {
      // best-effort
    }

    return {
      ok: true,
      action: "imported",
      entityType: "student",
      entityId: studentId,
      relatedEntities: related,
    };
  } catch (err) {
    return {
      ok: false,
      action: "failed",
      error: err instanceof Error ? err.message : "Import row failed",
      relatedEntities: related,
    };
  }
}

/** Load lookup context for validation / family detection. */
export async function loadStudentLookupContext(
  supabase: AuthClient,
  schoolId: string
): Promise<ImportLookupContext> {
  const [
    campusesRes,
    yearsRes,
    studentsRes,
    familiesRes,
    guardiansRes,
    fundingRes,
    fundsRes,
  ] = await Promise.all([
    supabase.from("campuses").select("id, school_id, name").eq("school_id", schoolId),
    supabase.from("school_years").select("id, school_id").eq("school_id", schoolId),
    supabase
      .from("students")
      .select("id, school_id, first_name, last_name, date_of_birth, grade_level, family_id")
      .eq("school_id", schoolId),
    supabase
      .from("families")
      .select(
        "id, school_id, family_name, primary_address, city, state, zip_code, billing_email, billing_phone"
      )
      .eq("school_id", schoolId),
    supabase.from("guardians").select("id, family_id, email, phone, first_name, last_name"),
    supabase.from("funding_sources").select("code, label"),
    supabase.from("scholarship_funds").select("id, fund_name").eq("school_id", schoolId),
  ]);

  const campusIdsBySchool = new Map<string, Set<string>>();
  const campusNamesBySchool = new Map<string, Map<string, string>>();
  for (const campus of campusesRes.data ?? []) {
    if (!campusIdsBySchool.has(campus.school_id)) campusIdsBySchool.set(campus.school_id, new Set());
    campusIdsBySchool.get(campus.school_id)!.add(campus.id);
    if (!campusNamesBySchool.has(campus.school_id)) campusNamesBySchool.set(campus.school_id, new Map());
    campusNamesBySchool.get(campus.school_id)!.set(campus.name.toLowerCase(), campus.id);
  }

  const schoolYearIdsBySchool = new Map<string, Set<string>>();
  for (const year of yearsRes.data ?? []) {
    if (!schoolYearIdsBySchool.has(year.school_id)) schoolYearIdsBySchool.set(year.school_id, new Set());
    schoolYearIdsBySchool.get(year.school_id)!.add(year.id);
  }

  const { STUDENTS_PROGRAM_CODES } = await import("@/lib/constants/programs");

  const fundingCodes = new Set<string>();
  const fundingLabels = new Map<string, string>();
  for (const row of fundingRes.data ?? []) {
    fundingCodes.add(row.code);
    fundingLabels.set(row.code, row.label);
  }

  const scholarshipFundNames = new Map<string, string>();
  for (const fund of fundsRes.data ?? []) {
    const name = (fund as { id: string; fund_name?: string; name?: string }).fund_name
      ?? (fund as { name?: string }).name
      ?? "";
    if (name) scholarshipFundNames.set(fund.id, name);
  }

  // Filter guardians to those belonging to school families
  const familyIds = new Set((familiesRes.data ?? []).map((f) => f.id));
  const guardians = (guardiansRes.data ?? []).filter((g) => familyIds.has(g.family_id));

  return {
    schoolIds: [schoolId],
    campusIdsBySchool,
    campusNamesBySchool,
    programCodes: new Set(STUDENTS_PROGRAM_CODES),
    schoolYearIdsBySchool,
    existingStudents: studentsRes.data ?? [],
    existingGuardians: guardians,
    existingFamilies: familiesRes.data ?? [],
    fundingCodes,
    fundingLabels,
    scholarshipFundNames,
  };
}
