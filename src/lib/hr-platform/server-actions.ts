"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requireHcmEditAccess } from "./access";
import { assignEmployee } from "./assignments";
import { emitCertificationExpiringAlerts } from "./certifications";
import {
  createEmploymentContract,
  renewContract,
  updateContractStatus,
} from "./contracts";
import {
  extendOffer,
  hireApplicant,
  scheduleInterview,
} from "./recruiting";
import {
  completeOnboardingTask,
  ensureExtendedOnboardingTasks,
} from "./onboarding";
import {
  addPerformanceNote,
  completePerformanceReview,
  createPerformanceGoal,
  createPerformanceReview,
} from "./performance";
import {
  assignTraining,
  completeTraining,
  createPdCourse,
} from "./professional-development";
import { decideLeaveRequest, submitLeaveRequest } from "./leave";
import { promoteEmployee, transitionEmployeeLifecycle } from "./lifecycle";
import type { ContractStatus, EmployeeLifecycleState, LeaveType } from "./types";

function revalidateHr() {
  revalidatePath("/dashboard/hr");
  revalidatePath("/dashboard/employee");
}

export async function transitionLifecycleAction(
  employeeId: string,
  toState: EmployeeLifecycleState,
  notes?: string
) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await transitionEmployeeLifecycle(supabase, {
    employeeId,
    toState,
    notes,
  });
  if (!result.ok) return { error: result.error, code: result.code };
  revalidateHr();
  return result;
}

export async function promoteEmployeeAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await promoteEmployee(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function scheduleInterviewAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await scheduleInterview(supabase, {
    applicationId: String(formData.get("application_id") ?? ""),
    scheduledAt: String(formData.get("scheduled_at") ?? ""),
    interviewType: String(formData.get("interview_type") ?? "") || undefined,
    locationOrLink: String(formData.get("location_or_link") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function extendOfferAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await extendOffer(supabase, {
    applicationId: String(formData.get("application_id") ?? ""),
    offerLetterPath: String(formData.get("offer_letter_path") ?? "") || null,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function hireApplicantAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const result = await hireApplicant(supabase, {
    applicationId: String(formData.get("application_id") ?? ""),
    schoolId:
      String(formData.get("school_id") ?? "") ||
      identity?.accessibleSchoolIds?.[0] ||
      "",
    hireDate: String(formData.get("hire_date") ?? "") || undefined,
    department: String(formData.get("department") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function completeOnboardingTaskAction(taskId: string) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await completeOnboardingTask(supabase, taskId);
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function seedOnboardingAction(employeeId: string) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const count = await ensureExtendedOnboardingTasks(supabase, employeeId);
  revalidateHr();
  return { ok: true as const, added: count };
}

export async function createContractAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await createEmploymentContract(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    schoolId: String(formData.get("school_id") ?? "") || null,
    title: String(formData.get("title") ?? "") || undefined,
    startDate: String(formData.get("start_date") ?? "") || undefined,
    endDate: String(formData.get("end_date") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function updateContractStatusAction(
  contractId: string,
  status: ContractStatus
) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await updateContractStatus(supabase, contractId, status);
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function renewContractAction(contractId: string) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await renewContract(supabase, contractId);
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function submitLeaveAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const result = await submitLeaveRequest(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    schoolId:
      String(formData.get("school_id") ?? "") ||
      identity?.accessibleSchoolIds?.[0] ||
      "",
    leaveType: String(formData.get("leave_type") ?? "pto") as LeaveType,
    startDate: String(formData.get("start_date") ?? ""),
    endDate: String(formData.get("end_date") ?? ""),
    hoursRequested: formData.get("hours_requested")
      ? Number(formData.get("hours_requested"))
      : undefined,
    reason: String(formData.get("reason") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function decideLeaveAction(
  leaveId: string,
  decision: "approved" | "denied"
) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await decideLeaveRequest(supabase, { leaveId, decision });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function assignEmployeeAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await assignEmployee(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    entityType: String(formData.get("entity_type") ?? "school") as
      | "school"
      | "program"
      | "class"
      | "position",
    entityId: String(formData.get("entity_id") ?? ""),
    entityLabel: String(formData.get("entity_label") ?? "") || undefined,
    isPrimary: formData.get("is_primary") === "true",
    effectiveStart: String(formData.get("effective_start") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function createReviewAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const result = await createPerformanceReview(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    schoolId:
      String(formData.get("school_id") ?? "") ||
      identity?.accessibleSchoolIds?.[0] ||
      "",
    evaluationType: String(formData.get("evaluation_type") ?? "annual"),
    summary: String(formData.get("summary") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function completeReviewAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await completePerformanceReview(
    supabase,
    String(formData.get("evaluation_id") ?? ""),
    {
      overallRating: String(formData.get("overall_rating") ?? "") || undefined,
      summary: String(formData.get("summary") ?? "") || undefined,
    }
  );
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function createGoalAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await createPerformanceGoal(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    targetDate: String(formData.get("target_date") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function addNoteAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await addPerformanceNote(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    schoolId: String(formData.get("school_id") ?? "") || null,
    noteType: (String(formData.get("note_type") ?? "note") as
      | "note"
      | "recognition"
      | "observation"
      | "improvement_plan"),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function createPdCourseAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await createPdCourse(supabase, {
    title: String(formData.get("title") ?? ""),
    schoolId: String(formData.get("school_id") ?? "") || null,
    courseType: String(formData.get("course_type") ?? "course"),
    ceuCredits: formData.get("ceu_credits")
      ? Number(formData.get("ceu_credits"))
      : undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function assignTrainingAction(formData: FormData) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await assignTraining(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    courseId: String(formData.get("course_id") ?? "") || null,
    courseTitle: String(formData.get("course_title") ?? ""),
  });
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function completeTrainingAction(trainingId: string) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await completeTraining(supabase, trainingId);
  if (!result.ok) return { error: result.error };
  revalidateHr();
  return result;
}

export async function emitCertAlertsAction(schoolId?: string) {
  const access = await requireHcmEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const count = await emitCertificationExpiringAlerts(supabase, {
    schoolId: schoolId || identity?.accessibleSchoolIds?.[0] || null,
  });
  revalidateHr();
  return { ok: true as const, count };
}
