import { createAuthClient } from "@/lib/supabase/server-auth";
import { getStudentDashboardSummary } from "@/lib/sis/queries";
import { getLatestStudentSuccessScore } from "@/lib/ssis/score";
import { getStudentFundingCenter } from "@/lib/ssis/funding";
import { getParentEngagementSummary } from "@/lib/ssis/engagement";
import type { SuccessScoreResult } from "@/lib/ssis/score";

export interface ExecutiveSummary extends Awaited<ReturnType<typeof getStudentDashboardSummary>> {
  successScore: SuccessScoreResult | null;
  scholarshipCount: number;
  fundingRecordCount: number;
  stateFundingVerified: boolean;
  parentEngagementScore: number;
  parentDisengaged: boolean;
  missionControlAlertCount: number;
  lifecycleStage: string;
  outstandingTasks: number;
}

const EMPTY_DASHBOARD_SUMMARY = {
  attendanceRate: 0,
  absencesThisMonth: 0,
  tardiesThisMonth: 0,
  positiveBehaviorCount: 0,
  incidentCount: 0,
  activeServicesCount: 0,
  upcomingMeetings: [] as { title: string; date: string; href?: string }[],
  medicalAlertCount: 0,
  documentCount: 0,
  spedReviewDue: false,
};

/** Safe defaults so a brand-new student (no family/docs/enrollments) never crashes the profile. */
export function emptyStudentExecutiveSummary(
  lifecycleStage = "active"
): ExecutiveSummary {
  return {
    ...EMPTY_DASHBOARD_SUMMARY,
    successScore: null,
    scholarshipCount: 0,
    fundingRecordCount: 0,
    stateFundingVerified: false,
    parentEngagementScore: 0,
    parentDisengaged: false,
    missionControlAlertCount: 0,
    lifecycleStage,
    outstandingTasks: 0,
  };
}

export async function getStudentExecutiveSummary(studentId: string): Promise<ExecutiveSummary> {
  try {
    const supabase = await createAuthClient();

    const [base, successScore, funding, engagement, studentRes, missionRes] = await Promise.all([
      getStudentDashboardSummary(studentId),
      getLatestStudentSuccessScore(supabase, studentId),
      getStudentFundingCenter(supabase, studentId),
      getParentEngagementSummary(supabase, studentId),
      supabase.from("students").select("lifecycle_stage").eq("id", studentId).maybeSingle(),
      supabase
        .from("platform_mission_control_items")
        .select("id")
        .eq("entity_type", "student")
        .eq("entity_id", studentId)
        .eq("is_resolved", false),
    ]);

    const fundingRows = funding ?? [];
    const scholarships = fundingRows.filter((f) =>
      ["school_scholarship", "outside_scholarship"].includes(f.funding_category as string)
    );
    const stateFunding = fundingRows.filter((f) => f.funding_category === "state_funding");

    return {
      ...base,
      successScore,
      scholarshipCount: scholarships.length,
      fundingRecordCount: fundingRows.length,
      stateFundingVerified: stateFunding.some((f) => f.verification_status === "verified"),
      parentEngagementScore: engagement?.engagementScore ?? 0,
      parentDisengaged: engagement?.disengaged ?? false,
      missionControlAlertCount: missionRes.data?.length ?? 0,
      lifecycleStage: studentRes.data?.lifecycle_stage ?? "active",
      outstandingTasks: missionRes.data?.length ?? 0,
    };
  } catch (error) {
    console.error("[ssis] getStudentExecutiveSummary:", error);
    return emptyStudentExecutiveSummary();
  }
}

export { getStudentFundingCenter, getParentEngagementSummary };
export type { SuccessScoreResult };
