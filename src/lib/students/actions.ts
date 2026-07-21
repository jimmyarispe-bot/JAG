"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/platform/activity";
import { extractSchoolOrganizationId, resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { GradeValue } from "@/lib/constants/grades";
import {
  assertCanonicalProgramForWrite,
  STUDENTS_PROGRAM_CODES,
} from "@/lib/constants/programs";
import { parseFundingSourcesFromForm } from "@/lib/funding/helpers";
import {
  syncEnrollmentRelationship,
  syncGuardianStudentRelationships,
  syncStudentPlatformRelationships,
} from "@/lib/students/platform-sync";
import { assertPermission } from "@/lib/platform/identity/action-guards";

async function requireStudentsEdit() {
  return assertPermission("students.edit");
}

export async function createFamily(formData: FormData) {
  const auth = await requireStudentsEdit();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const schoolId = formData.get("school_id") as string;
  const familyName = formData.get("family_name") as string;
  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = await resolveSchoolContext(supabase, schoolId);

  const { data, error } = await supabase
    .from("families")
    .insert({
      school_id: schoolId,
      family_name: familyName,
      primary_address: (formData.get("primary_address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip_code: (formData.get("zip_code") as string) || null,
      billing_email: (formData.get("billing_email") as string) || null,
      billing_phone: (formData.get("billing_phone") as string) || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    eventType: "family.created",
    moduleKey: "sis",
    entityType: "family",
    entityId: data.id,
    title: "Family created",
    summary: familyName,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    familyId: data.id,
    actorUserId,
    sourceTable: "families",
    sourceId: data.id,
  });

  revalidatePath("/dashboard/students");
  return { id: data.id };
}

function invalidProgramError(raw: string) {
  return {
    error: `Invalid program "${raw}". Allowed values: ${STUDENTS_PROGRAM_CODES.join(", ")}.`,
  };
}

export async function createStudent(formData: FormData) {
  const auth = await requireStudentsEdit();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const fundingSources = parseFundingSourcesFromForm(formData);
  const schoolId = formData.get("school_id") as string;
  const familyId = (formData.get("family_id") as string) || null;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const rawProgram = (formData.get("program") as string) || "";
  console.log("[TEMP_STUDENT_CREATE_AUDIT]", {
    stage: "createStudent.raw",
    rawForm: {
      school_id: schoolId,
      family_id: familyId,
      first_name: firstName,
      last_name: lastName,
      program: rawProgram,
      enrollment_status: formData.get("enrollment_status"),
    },
  });
  // Strict: only students_program_check codes — no silent alias rewrite on create.
  const programGate = assertCanonicalProgramForWrite(rawProgram);
  console.log("[TEMP_STUDENT_CREATE_AUDIT]", {
    stage: "createStudent.programGate",
    programGateOk: programGate.ok,
    programAfterGate: programGate.ok ? programGate.program : null,
    writePath: "rpc:create_student_record",
    finalProgramSentToPostgres: programGate.ok ? programGate.program : "(not sent - gate rejected)",
    rpcCalled: programGate.ok,
  });
  if (!programGate.ok) {
    console.log("[TEMP_STUDENT_CREATE_AUDIT]", {
      stage: "createStudent.gateRejected",
      error: programGate.error,
      rawProgram,
      rpcCalled: false,
    });
    return { error: programGate.error };
  }
  const program = programGate.program;

  // Atomic core write: student + funding in one DB transaction (RPC).
  console.log("[TEMP_STUDENT_CREATE_AUDIT]", {
    stage: "createStudent.beforeRpc",
    writePath: "rpc:create_student_record",
    finalProgramSentToPostgres: program,
    rpcCalled: true,
    payload: {
      p_school_id: schoolId,
      p_family_id: familyId,
      p_first_name: firstName,
      p_last_name: lastName,
      p_program: program,
      p_enrollment_status: (formData.get("enrollment_status") as string) || "pending",
    },
  });
  const { data: studentId, error } = await supabase.rpc("create_student_record", {
    p_school_id: schoolId,
    p_first_name: firstName,
    p_last_name: lastName,
    p_family_id: familyId,
    p_preferred_name: (formData.get("preferred_name") as string) || null,
    p_date_of_birth: (formData.get("date_of_birth") as string) || null,
    p_grade_level: (formData.get("grade_level") as GradeValue) || null,
    p_gender: (formData.get("gender") as string) || null,
    p_program: program,
    p_enrollment_status: (formData.get("enrollment_status") as string) || "pending",
    p_funding_source_codes: fundingSources,
  });

  if (error || !studentId) {
    console.log("[TEMP_STUDENT_CREATE_AUDIT]", {
      stage: "createStudent.error",
      error: error?.message ?? "Unable to create student.",
      rpcCalled: true,
      finalProgramSentToPostgres: program,
    });
    return { error: error?.message ?? "Unable to create student." };
  }

  // Post-commit side effects must not flip a successful create into a UI error.
  try {
    const actorUserId = await resolveActorUserId(supabase);
    const schoolCtx = await resolveSchoolContext(supabase, schoolId);
    await recordActivity(supabase, {
      eventType: "student.created",
      moduleKey: "sis",
      entityType: "student",
      entityId: studentId,
      title: "Student created",
      summary: `${firstName} ${lastName}`,
      organizationId: schoolCtx?.organizationId,
      schoolId,
      studentId,
      familyId,
      actorUserId,
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

  revalidatePath("/dashboard/students");
  return { id: studentId };
}

export async function createGuardian(formData: FormData) {
  const auth = await requireStudentsEdit();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const familyId = formData.get("family_id") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const actorUserId = await resolveActorUserId(supabase);

  const { data: family } = await supabase
    .from("families")
    .select("school_id, schools(organization_id)")
    .eq("id", familyId)
    .maybeSingle();

  const { data: guardian, error } = await supabase
    .from("guardians")
    .insert({
      family_id: familyId,
      first_name: firstName,
      last_name: lastName,
      relationship_to_student: (formData.get("relationship_to_student") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      is_primary: formData.get("is_primary") === "on",
      receives_billing: formData.get("receives_billing") === "on",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const organizationId = extractSchoolOrganizationId(family?.schools);

  await recordActivity(supabase, {
    eventType: "guardian.created",
    moduleKey: "sis",
    entityType: "guardian",
    entityId: guardian.id,
    title: "Guardian added",
    summary: `${firstName} ${lastName}`,
    organizationId,
    schoolId: family?.school_id,
    familyId,
    actorUserId,
    sourceTable: "guardians",
    sourceId: guardian.id,
  });

  await syncGuardianStudentRelationships(supabase, guardian.id, familyId);

  revalidatePath("/dashboard/students");
  return { success: true };
}

export async function createEnrollment(formData: FormData) {
  const auth = await requireStudentsEdit();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const studentId = formData.get("student_id") as string;
  const enrollmentStatus = (formData.get("enrollment_status") as string) || "pending";
  const rawProgram = (formData.get("program") as string) || "";
  const programGate = assertCanonicalProgramForWrite(rawProgram);
  if (!programGate.ok) {
    return { error: programGate.error };
  }
  const program = programGate.program;
  if (!program) {
    return invalidProgramError(rawProgram.trim() || "(empty)");
  }
  const actorUserId = await resolveActorUserId(supabase);

  const { data: student } = await supabase
    .from("students")
    .select("school_id, family_id, schools(organization_id)")
    .eq("id", studentId)
    .maybeSingle();

  const { data: enrollment, error } = await supabase
    .from("sis_enrollments")
    .insert({
      student_id: studentId,
      school_year_id: formData.get("school_year_id") as string,
      program,
      enrollment_status: enrollmentStatus,
      enrolled_at: (formData.get("enrolled_at") as string) || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const schoolOrgId = extractSchoolOrganizationId(student?.schools);

  await recordActivity(supabase, {
    eventType: "enrollment.created",
    moduleKey: "sis",
    entityType: "student",
    entityId: studentId,
    title: "Enrollment created",
    summary: `${program} — ${enrollmentStatus}`,
    organizationId: schoolOrgId,
    studentId,
    familyId: student?.family_id,
    actorUserId,
    relatedEntityType: "enrollment",
    relatedEntityId: enrollment.id,
    payload: { program, enrollmentStatus },
    sourceTable: "sis_enrollments",
    sourceId: enrollment.id,
  });

  await syncEnrollmentRelationship(supabase, studentId, enrollment.id);

  revalidatePath("/dashboard/students");
  return { success: true };
}
