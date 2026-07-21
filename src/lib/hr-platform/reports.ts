import type { createAuthClient } from "@/lib/supabase/server-auth";
import { listExpiringCertifications } from "./certifications";
import type { HcmOperationsSummary } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getHcmOperationsSummary(
  supabase: AuthClient,
  options?: { schoolId?: string | null }
): Promise<HcmOperationsSummary> {
  let empQuery = supabase.from("employees").select("id, employment_status, lifecycle_stage, hire_date");
  if (options?.schoolId) empQuery = empQuery.eq("school_id", options.schoolId);
  const { data: employees } = await empQuery;
  const list = employees ?? [];

  const activeEmployees = list.filter(
    (e) =>
      e.employment_status === "active" ||
      e.lifecycle_stage === "active" ||
      e.lifecycle_stage === "onboarding"
  ).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newHires = list.filter((e) => {
    if (!e.hire_date) return false;
    return new Date(e.hire_date) >= thirtyDaysAgo;
  }).length;

  let jobsQuery = supabase
    .from("hr_job_postings")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  if (options?.schoolId) jobsQuery = jobsQuery.eq("school_id", options.schoolId);
  const openJobs = await jobsQuery;

  let leaveQuery = supabase
    .from("leave_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (options?.schoolId) leaveQuery = leaveQuery.eq("school_id", options.schoolId);
  const leavePending = await leaveQuery;

  let reviewsQuery = supabase
    .from("performance_evaluations")
    .select("id", { count: "exact", head: true })
    .in("status", ["draft", "submitted"]);
  if (options?.schoolId) reviewsQuery = reviewsQuery.eq("school_id", options.schoolId);
  const reviewsOpen = await reviewsQuery;

  let trainingQuery = supabase
    .from("employee_training_records")
    .select("id", { count: "exact", head: true })
    .in("status", ["assigned", "in_progress"]);
  const trainingActive = await trainingQuery;

  const expiring = await listExpiringCertifications(supabase, {
    schoolId: options?.schoolId,
    withinDays: 90,
  });

  const onboardingCount = list.filter((e) => e.lifecycle_stage === "onboarding").length;
  const pendingLeave = leavePending.count ?? 0;
  const complianceAlerts = expiring.length + pendingLeave + onboardingCount;

  return {
    workforceTotal: list.length,
    openPositions: openJobs.count ?? 0,
    activeEmployees,
    newHires,
    certificationsExpiring: expiring.length,
    timeOffPending: pendingLeave,
    performanceReviewsOpen: reviewsOpen.count ?? 0,
    professionalDevelopmentActive: trainingActive.count ?? 0,
    complianceAlerts,
  };
}
