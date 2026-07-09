import type { createAuthClient } from "@/lib/supabase/server-auth";
import { detectSchedulingConflicts, syncConflictsToMissionControl } from "@/lib/scheduling/conflicts";
import { getStaffWorkload, getStudentsWithoutSectionMatch, getSchedulingCapacityReport } from "@/lib/scheduling/queries";
import { JAG_VIRTUAL_PROGRAM_RULES } from "@/lib/scheduling/academy-way";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface SchedulingRecommendation {
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  detail: string;
  action?: string;
}

export async function generateSchedulingRecommendations(
  supabase: AuthClient,
  schoolId: string
): Promise<SchedulingRecommendation[]> {
  const recommendations: SchedulingRecommendation[] = [];

  const { data: existingConflicts } = await supabase
    .from("schedule_conflicts")
    .select("conflict_type, severity, title, description, recommendation")
    .eq("school_id", schoolId)
    .eq("is_resolved", false)
    .order("detected_at", { ascending: false })
    .limit(20);

  for (const c of existingConflicts ?? []) {
    recommendations.push({
      priority: c.severity === "critical" ? "high" : "medium",
      category: c.conflict_type,
      title: c.title,
      detail: c.description ?? "",
      action: c.recommendation ?? undefined,
    });
  }

  const workload = await getStaffWorkload(schoolId);
  for (const w of workload.filter((x) => x.overloaded)) {
    recommendations.push({
      priority: "high",
      category: "workload",
      title: `${w.name} is overloaded`,
      detail: `${w.weeklyHours} hours scheduled this week (${w.sessionCount} sessions)`,
      action: "Redistribute sessions or add co-teachers for workload balancing",
    });
  }

  const underutilized = workload.filter((x) => x.weeklyHours > 0 && x.weeklyHours < 10);
  for (const w of underutilized.slice(0, 5)) {
    recommendations.push({
      priority: "low",
      category: "utilization",
      title: `${w.name} has available capacity`,
      detail: `${w.weeklyHours} hours scheduled — may accept additional sections`,
      action: "Assign open sections or emergency coverage",
    });
  }

  const capacityReport = await getSchedulingCapacityReport(schoolId);
  for (const section of capacityReport.sections) {
    if (section.openSeats > 0 && section.enrolled > 0) {
      recommendations.push({
        priority: "low",
        category: "capacity",
        title: `Open seats in ${section.sectionCode}`,
        detail: `${section.openSeats} seats available (${section.enrolled}/${section.maxCapacity} enrolled)`,
        action: "Review waitlist or run placement for unassigned students",
      });
    }
    if (section.enrolled >= section.maxCapacity) {
      recommendations.push({
        priority: "medium",
        category: "capacity",
        title: `${section.sectionCode} at maximum — eligible for new section`,
        detail: `${section.courseName} · ${section.utilizationPct}% utilization`,
        action: "Create new section per JAG Virtual/HS capacity rules",
      });
    }
  }

  // Duplicate section detection — same SL level/step with low enrollment on both
  const slSections = capacityReport.sections.filter(
    (s) => s.structuredLiteracyLevel != null && s.enrolled > 0 && s.enrolled < 2
  );
  if (slSections.length >= 2) {
    recommendations.push({
      priority: "medium",
      category: "merge",
      title: "Class merge recommendation",
      detail: `${slSections.length} Structured Literacy sections under minimum size — consider merging`,
      action: "Merge sections to optimize capacity before opening new ones",
    });
  }

  const placementGaps = await getStudentsWithoutSectionMatch(schoolId);
  for (const gap of placementGaps) {
    recommendations.push({
      priority: "high",
      category: "placement_gap",
      title: `Place ${gap.studentName}`,
      detail: gap.reason,
      action: "Run placement intelligence from student profile or admissions handoff",
    });
  }

  return recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

export async function runPlacementForStudent(
  supabase: AuthClient,
  input: { studentId: string; schoolId: string; schoolYearId: string; program?: string | null }
) {
  const { enrollStudentInBestSection } = await import("@/lib/scheduling/placement");
  return enrollStudentInBestSection(supabase, input);
}

export async function getExecutiveSchedulingAnalytics(supabase: AuthClient, schoolId: string) {
  const [capacity, workload, gaps, recommendations] = await Promise.all([
    getSchedulingCapacityReport(schoolId),
    getStaffWorkload(schoolId),
    getStudentsWithoutSectionMatch(schoolId),
    generateSchedulingRecommendations(supabase, schoolId),
  ]);

  const totalEnrolled = capacity.sections.reduce((s, x) => s + x.enrolled, 0);
  const totalCapacity = capacity.sections.reduce((s, x) => s + x.maxCapacity, 0);
  const avgUtilization = totalCapacity
    ? Math.round((totalEnrolled / totalCapacity) * 100)
    : 0;

  return {
    sectionCount: capacity.sections.length,
    totalEnrolled,
    totalCapacity,
    avgUtilization,
    placementGaps: gaps.length,
    openConflicts: recommendations.filter((r) => r.category.includes("conflict") || r.priority === "high").length,
    overloadedTeachers: workload.filter((w) => w.overloaded).length,
    programRules: JAG_VIRTUAL_PROGRAM_RULES,
    recommendations: recommendations.slice(0, 15),
  };
}

export async function processSchedulingIntelligenceQueue(supabase: AuthClient) {
  const { data: schools } = await supabase.from("schools").select("id").eq("status", "active");
  for (const school of schools ?? []) {
    await detectSchedulingConflicts(supabase, school.id);
    await syncConflictsToMissionControl(supabase, school.id);
  }
}
