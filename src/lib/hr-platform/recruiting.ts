import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordHcmActivity } from "./activity";
import { transitionEmployeeLifecycle } from "./lifecycle";
import { seedDefaultOnboardingTasks } from "@/lib/hr/automation";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type RecruitingResult =
  | { ok: true; id: string; employeeId?: string }
  | { ok: false; error: string };

export async function scheduleInterview(
  supabase: AuthClient,
  input: {
    applicationId: string;
    scheduledAt: string;
    interviewType?: string;
    locationOrLink?: string;
    interviewerUserId?: string | null;
    notes?: string;
  }
): Promise<RecruitingResult> {
  const { data, error } = await supabase
    .from("hr_candidate_interviews")
    .insert({
      application_id: input.applicationId,
      scheduled_at: input.scheduledAt,
      interview_type: input.interviewType ?? "general",
      location_or_link: input.locationOrLink ?? null,
      interviewer_user_id: input.interviewerUserId ?? null,
      notes: input.notes ?? null,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to schedule" };

  await supabase
    .from("hr_job_applications")
    .update({ pipeline_stage: "interview" })
    .eq("id", input.applicationId);

  return { ok: true, id: data.id };
}

export async function extendOffer(
  supabase: AuthClient,
  input: {
    applicationId: string;
    offerLetterPath?: string | null;
    schoolId?: string | null;
  }
): Promise<RecruitingResult> {
  const { data: app, error: loadError } = await supabase
    .from("hr_job_applications")
    .select("id, candidate_name, job_posting_id, hired_employee_id, hr_job_postings(school_id)")
    .eq("id", input.applicationId)
    .maybeSingle();
  if (loadError || !app) return { ok: false, error: loadError?.message ?? "Application not found" };

  const { error } = await supabase
    .from("hr_job_applications")
    .update({
      pipeline_stage: "offer",
      offer_letter_path: input.offerLetterPath ?? null,
    })
    .eq("id", input.applicationId);

  if (error) return { ok: false, error: error.message };

  const posting = Array.isArray(app.hr_job_postings)
    ? app.hr_job_postings[0]
    : app.hr_job_postings;
  const schoolId =
    input.schoolId ?? (posting as { school_id?: string } | null)?.school_id ?? null;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  const actorUserId = await resolveActorUserId(supabase);
  const entityId = (app.hired_employee_id as string | null) ?? input.applicationId;

  await recordHcmActivity(supabase, {
    eventType: "employee.offer.extended",
    title: "Offer extended",
    summary: String(app.candidate_name ?? "Candidate"),
    entityId,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    actorUserId,
    sourceTable: "hr_job_applications",
    sourceId: input.applicationId,
  });

  try {
    const { sendHcmCommunication } = await import("./communications");
    await sendHcmCommunication(supabase, {
      kind: "offer_letter",
      organizationId: schoolCtx?.organizationId,
      schoolId,
      body: `Offer extended to ${app.candidate_name ?? "candidate"}.`,
      actorUserId,
    });
  } catch {
    // best-effort
  }

  return { ok: true, id: input.applicationId };
}

/**
 * Convert hired applicant → employee record + onboarding.
 */
export async function hireApplicant(
  supabase: AuthClient,
  input: {
    applicationId: string;
    schoolId: string;
    hireDate?: string;
    employeeType?: string;
    department?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }
): Promise<RecruitingResult> {
  const { data: app } = await supabase
    .from("hr_job_applications")
    .select("*, hr_job_postings(title, school_id, department, employment_type)")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (!app) return { ok: false, error: "Application not found" };

  const posting = Array.isArray(app.hr_job_postings)
    ? app.hr_job_postings[0]
    : app.hr_job_postings;
  const nameParts = String(app.candidate_name ?? "").trim().split(/\s+/);
  const firstName = input.firstName ?? nameParts[0] ?? "New";
  const lastName = input.lastName ?? (nameParts.slice(1).join(" ") || "Hire");
  const actorUserId = await resolveActorUserId(supabase);
  const hireDate = input.hireDate ?? new Date().toISOString().slice(0, 10);

  const { data: employee, error } = await supabase
    .from("employees")
    .insert({
      school_id: input.schoolId,
      employee_type: input.employeeType ?? (posting as { employment_type?: string })?.employment_type ?? "staff",
      employment_status: "active",
      lifecycle_stage: "onboarding",
      hire_date: hireDate,
      department:
        input.department ?? (posting as { department?: string })?.department ?? null,
      background_check_status: app.background_check_status ?? "pending",
    })
    .select("id, school_id, audit_id")
    .single();

  if (error || !employee) return { ok: false, error: error?.message ?? "Hire failed" };

  await supabase.from("employee_profiles").insert({
    employee_id: employee.id,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
    contact_email: input.email ?? app.candidate_email,
    contact_phone: app.candidate_phone,
    job_title: (posting as { title?: string })?.title ?? null,
  });

  await supabase.from("employee_service_history").insert({
    employee_id: employee.id,
    event_type: "hire",
    title: "Hired from recruiting pipeline",
    effective_date: hireDate,
    recorded_by: actorUserId,
  });

  await supabase
    .from("hr_job_applications")
    .update({ pipeline_stage: "hired", hired_employee_id: employee.id })
    .eq("id", input.applicationId);

  await supabase
    .from("hr_job_postings")
    .update({ status: "filled" })
    .eq("id", app.job_posting_id);

  await seedDefaultOnboardingTasks(supabase, employee.id);

  const schoolCtx = await resolveSchoolContext(supabase, employee.school_id);
  await recordHcmActivity(supabase, {
    eventType: "employee.created",
    title: "Employee created",
    summary: `${firstName} ${lastName}`,
    entityId: employee.id,
    organizationId: schoolCtx?.organizationId,
    schoolId: employee.school_id,
    actorUserId,
    payload: { applicationId: input.applicationId, auditId: employee.audit_id },
  });
  await recordHcmActivity(supabase, {
    eventType: "employee.hired",
    title: "Employee hired",
    summary: `${firstName} ${lastName}`,
    entityId: employee.id,
    organizationId: schoolCtx?.organizationId,
    schoolId: employee.school_id,
    actorUserId,
    payload: { applicationId: input.applicationId },
  });

  return { ok: true, id: input.applicationId, employeeId: employee.id };
}

export async function convertOfferToOnboarding(
  supabase: AuthClient,
  employeeId: string
): Promise<RecruitingResult> {
  const result = await transitionEmployeeLifecycle(supabase, {
    employeeId,
    toState: "onboarding",
    title: "Offer accepted — onboarding started",
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, id: employeeId, employeeId };
}
