"use server";



import { revalidatePath } from "next/cache";

import { recordActivity } from "@/lib/platform/activity";

import { extractSchoolOrganizationId, resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";

import type { GradeValue } from "@/lib/constants/grades";

import type { ProgramValue } from "@/lib/constants/programs";

import { parseFundingSourcesFromForm } from "@/lib/funding/helpers";

import { syncStudentFundingSources } from "@/lib/funding/sync";

import {

  syncEnrollmentRelationship,

  syncGuardianStudentRelationships,

  syncStudentPlatformRelationships,

} from "@/lib/students/platform-sync";

import { createAuthClient } from "@/lib/supabase/server-auth";



export async function createFamily(formData: FormData) {

  const supabase = await createAuthClient();

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



export async function createStudent(formData: FormData) {

  const supabase = await createAuthClient();

  const fundingSources = parseFundingSourcesFromForm(formData);

  const schoolId = formData.get("school_id") as string;

  const familyId = (formData.get("family_id") as string) || null;

  const firstName = formData.get("first_name") as string;

  const lastName = formData.get("last_name") as string;

  const actorUserId = await resolveActorUserId(supabase);

  const schoolCtx = await resolveSchoolContext(supabase, schoolId);



  const { data, error } = await supabase

    .from("students")

    .insert({

      school_id: schoolId,

      family_id: familyId,

      first_name: firstName,

      last_name: lastName,

      preferred_name: (formData.get("preferred_name") as string) || null,

      date_of_birth: (formData.get("date_of_birth") as string) || null,

      grade_level: (formData.get("grade_level") as GradeValue) || null,

      gender: (formData.get("gender") as string) || null,

      program: (formData.get("program") as ProgramValue) || null,

      enrollment_status: (formData.get("enrollment_status") as string) || "pending",

      status: "active",

    })

    .select("id")

    .single();



  if (error) return { error: error.message };



  try {

    await syncStudentFundingSources(supabase, data.id, fundingSources);

  } catch (syncError) {

    await supabase.from("students").delete().eq("id", data.id);

    return {

      error: syncError instanceof Error ? syncError.message : "Failed to save funding sources",

    };

  }



  await recordActivity(supabase, {

    eventType: "student.created",

    moduleKey: "sis",

    entityType: "student",

    entityId: data.id,

    title: "Student created",

    summary: `${firstName} ${lastName}`,

    organizationId: schoolCtx?.organizationId,

    schoolId,

    studentId: data.id,

    familyId,

    actorUserId,

    sourceTable: "students",

    sourceId: data.id,

  });



  await syncStudentPlatformRelationships(supabase, data.id);



  revalidatePath("/dashboard/students");

  return { id: data.id };

}



export async function createGuardian(formData: FormData) {

  const supabase = await createAuthClient();

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

  const supabase = await createAuthClient();

  const studentId = formData.get("student_id") as string;

  const enrollmentStatus = (formData.get("enrollment_status") as string) || "pending";

  const program = formData.get("program") as ProgramValue;

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


