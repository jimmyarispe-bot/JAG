import { ACTIVE_PIPELINE_LEGACY_STAGES } from "@/lib/admissions/registry";
import {
  applySchoolFilter,
  hasNoSchoolAccess,
  matchesSchool,
  resolveDashboardSchoolScope,
  type SchoolScope,
} from "@/lib/dashboard/school-scope";
import type { MorningBriefMetricKey } from "@/lib/dashboard/morning-brief-access";
import { createAuthClient } from "@/lib/supabase/server-auth";

export { formatCount, formatCurrency } from "@/lib/format";

export interface DashboardMetrics {
  enrollment: number;
  activeStudents: number;
  admissionsPipeline: number;
  scholarshipsAwarded: number;
  employees: number;
  revenue: number;
}

/** @deprecated Prefer ACTIVE_PIPELINE_LEGACY_STAGES — kept for import compatibility. */
export const PIPELINE_STATUSES = ACTIVE_PIPELINE_LEGACY_STAGES;

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const metrics = await getDashboardMetricsForKeys([
    "enrollment",
    "activeStudents",
    "admissionsPipeline",
    "scholarshipsAwarded",
    "employees",
    "revenue",
  ]);

  return {
    enrollment: metrics.enrollment ?? 0,
    activeStudents: metrics.activeStudents ?? 0,
    admissionsPipeline: metrics.admissionsPipeline ?? 0,
    scholarshipsAwarded: metrics.scholarshipsAwarded ?? 0,
    employees: metrics.employees ?? 0,
    revenue: metrics.revenue ?? 0,
  };
}

async function countEnrollments(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("student_enrollments")
    .select("id, students!inner(school_id)", { count: "exact", head: true })
    .eq("enrollment_status", "enrolled");

  if (schoolIds?.length === 1) {
    query = query.eq("students.school_id", schoolIds[0]);
  } else if (schoolIds && schoolIds.length > 1) {
    query = query.in("students.school_id", schoolIds);
  }

  const { count } = await query;
  return count ?? 0;
}

async function countActiveStudents(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  query = applySchoolFilter(query, "school_id", schoolIds);
  const { count } = await query;
  return count ?? 0;
}

async function countAdmissionsPipeline(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("admissions_leads")
    .select("id", { count: "exact", head: true })
    .in("lead_stage", [...ACTIVE_PIPELINE_LEGACY_STAGES]);
  query = applySchoolFilter(query, "school_id", schoolIds);
  const { count } = await query;
  return count ?? 0;
}

async function countScholarshipsAwarded(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  // School via linked student or admissions lead (same join path as scholarships/queries).
  const { data, error } = await supabase
    .from("scholarship_applications")
    .select(
      `
      id,
      students(school_id),
      admissions_applications(
        admissions_leads(school_id)
      )
    `
    )
    .eq("scholarship_status", "approved");

  if (error || !data) return 0;
  if (!schoolIds) return data.length;

  return data.filter((row) => {
    const student = Array.isArray(row.students) ? row.students[0] : row.students;
    if (matchesSchool(schoolIds, (student as { school_id?: string } | null)?.school_id)) {
      return true;
    }

    const application = Array.isArray(row.admissions_applications)
      ? row.admissions_applications[0]
      : row.admissions_applications;
    const lead = Array.isArray(application?.admissions_leads)
      ? application?.admissions_leads[0]
      : application?.admissions_leads;
    return matchesSchool(schoolIds, (lead as { school_id?: string } | null)?.school_id);
  }).length;
}

async function countEmployees(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("employment_status", "active");
  query = applySchoolFilter(query, "school_id", schoolIds);
  const { count } = await query;
  return count ?? 0;
}

async function sumRevenue(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  const { data, error } = await supabase
    .from("payments")
    .select("amount, invoices(family_billing_accounts(school_id))");

  if (error || !data) return 0;

  return data
    .filter((payment) => {
      if (!schoolIds) return true;
      const invoice = Array.isArray(payment.invoices) ? payment.invoices[0] : payment.invoices;
      const account = Array.isArray(invoice?.family_billing_accounts)
        ? invoice?.family_billing_accounts[0]
        : invoice?.family_billing_accounts;
      return matchesSchool(schoolIds, (account as { school_id?: string } | null)?.school_id);
    })
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

/** Load only metrics the caller is allowed to see (permission checks happen upstream). */
export async function getDashboardMetricsForKeys(
  keys: MorningBriefMetricKey[]
): Promise<Partial<DashboardMetrics>> {
  if (!keys.length) return {};

  const supabase = await createAuthClient();
  const schoolIds = await resolveDashboardSchoolScope(supabase);
  const metrics: Partial<DashboardMetrics> = {};

  await Promise.all(
    keys.map(async (key) => {
      switch (key) {
        case "enrollment":
          metrics.enrollment = await countEnrollments(supabase, schoolIds);
          break;
        case "admissionsPipeline":
          metrics.admissionsPipeline = await countAdmissionsPipeline(supabase, schoolIds);
          break;
        case "scholarshipsAwarded":
          metrics.scholarshipsAwarded = await countScholarshipsAwarded(supabase, schoolIds);
          break;
        case "activeStudents":
          metrics.activeStudents = await countActiveStudents(supabase, schoolIds);
          break;
        case "employees":
          metrics.employees = await countEmployees(supabase, schoolIds);
          break;
        case "revenue":
          metrics.revenue = await sumRevenue(supabase, schoolIds);
          break;
        default:
          break;
      }
    })
  );

  return metrics;
}
