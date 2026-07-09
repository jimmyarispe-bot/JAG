import { createAuthClient } from "@/lib/supabase/server-auth";
import type { MorningBriefMetricKey } from "@/lib/dashboard/morning-brief-access";

export { formatCount, formatCurrency } from "@/lib/format";

export interface DashboardMetrics {
  enrollment: number;
  activeStudents: number;
  admissionsPipeline: number;
  scholarshipsAwarded: number;
  employees: number;
  revenue: number;
}

export const PIPELINE_STATUSES = [
  "new_inquiry",
  "information_sent",
  "tour_scheduled",
  "tour_completed",
  "application_started",
  "application_submitted",
  "records_requested",
  "admissions_review",
  "waitlisted",
] as const;

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

/** Load only metrics the caller is allowed to see (permission checks happen upstream). */
export async function getDashboardMetricsForKeys(
  keys: MorningBriefMetricKey[]
): Promise<Partial<DashboardMetrics>> {
  if (!keys.length) return {};

  const supabase = await createAuthClient();
  const metrics: Partial<DashboardMetrics> = {};

  await Promise.all(
    keys.map(async (key) => {
      switch (key) {
        case "enrollment": {
          const { count } = await supabase
            .from("student_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("enrollment_status", "enrolled");
          metrics.enrollment = count ?? 0;
          break;
        }
        case "admissionsPipeline": {
          const { count } = await supabase
            .from("admissions_leads")
            .select("*", { count: "exact", head: true })
            .in("lead_stage", [...PIPELINE_STATUSES]);
          metrics.admissionsPipeline = count ?? 0;
          break;
        }
        case "scholarshipsAwarded": {
          const { count } = await supabase
            .from("scholarship_applications")
            .select("*", { count: "exact", head: true })
            .eq("scholarship_status", "approved");
          metrics.scholarshipsAwarded = count ?? 0;
          break;
        }
        case "activeStudents": {
          const { count } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");
          metrics.activeStudents = count ?? 0;
          break;
        }
        case "employees": {
          const { count } = await supabase
            .from("employees")
            .select("*", { count: "exact", head: true })
            .eq("employment_status", "active");
          metrics.employees = count ?? 0;
          break;
        }
        case "revenue": {
          const { data } = await supabase.from("payments").select("amount");
          const revenueRows = data ?? [];
          metrics.revenue = revenueRows.reduce(
            (sum, row) => sum + Number(row.amount ?? 0),
            0
          );
          break;
        }
        default:
          break;
      }
    })
  );

  return metrics;
}
