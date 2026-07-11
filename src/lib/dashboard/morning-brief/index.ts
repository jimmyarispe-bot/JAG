/**
 * Founder Morning Brief — Milestone 1 Phase A / Sprint 003.
 * Key Metrics: single getExecutiveKPIsAction via getFounderDashboardData.
 * Today's Brief: rule-based generateFounderMorningBrief from the same KPI object.
 */
import { hasExecutiveLeadershipRole } from "@/lib/executive/access";
import {
  getFounderDashboardData,
  type FounderDashboardData,
} from "@/lib/dashboard/founder-dashboard";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadOrganizationBranding } from "@/lib/branding";
import { composeMorningBriefExecutiveV2 } from "@/lib/dashboard/morning-brief/compose";
import type { FounderMorningBriefExecutiveV2 } from "@/lib/dashboard/morning-brief/types";
import { loadExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence";
import { getExecutiveKPIsAction } from "@/lib/executive/actions";
import type { ExecutiveKPIs } from "@/lib/executive/kpis";
import {
  formatMorningBriefForDisplay,
  generateFounderMorningBrief,
  mapMorningBriefActionsForUi,
} from "@/lib/executive/morning-brief";
import {
  appendTrendSentencesToBrief,
  calculateExecutiveTrends,
} from "@/lib/executive/trends";
import {
  appendHealthScoreToBrief,
  calculateExecutiveHealthScore,
} from "@/lib/executive/health-score";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

/** @deprecated Use FounderMorningBriefExecutiveV2 — alias kept for existing imports. */
export type FounderMorningBriefExecutive = FounderMorningBriefExecutiveV2;

export type {
  FounderMorningBriefExecutiveV2,
  MorningBriefFinancialPulse,
  MorningBriefNetworkHealth,
  MorningBriefKpiChanges,
  MorningBriefSectionFlags,
} from "@/lib/dashboard/morning-brief/types";

export interface FounderMorningBrief {
  founderDashboard: FounderDashboardData;
  executive: FounderMorningBriefExecutiveV2 | null;
}

const ZERO_KPIS: ExecutiveKPIs = {
  enrollment: 0,
  admissions: 0,
  admissionsByStage: [],
  revenue: 0,
  outstanding: 0,
  staff: 0,
  teacherAttendance: 0,
  teacherAttendanceDetail: {
    submittedPct: 0,
    missingPct: 0,
    submitted: 0,
    total: 0,
  },
  studentAttendance: 0,
  studentAttendanceDetail: {
    rate: 0,
    absentCount: 0,
    unsubmittedClassrooms: 0,
    present: 0,
    total: 0,
  },
  upcomingClasses: [],
  alerts: [],
};

/** Overlay rule-based KPI brief + trends + health score (UI unchanged). */
function applyGeneratedMorningBrief(
  executive: FounderMorningBriefExecutiveV2,
  kpis: ExecutiveKPIs,
  previousSnapshot: KpiSnapshotRecord[] = []
): FounderMorningBriefExecutiveV2 {
  const generated = generateFounderMorningBrief(kpis);
  const trends = calculateExecutiveTrends(kpis, previousSnapshot);
  const health = calculateExecutiveHealthScore({
    kpis,
    trends,
    previousSnapshot,
  });
  const summary = appendHealthScoreToBrief(
    appendTrendSentencesToBrief(formatMorningBriefForDisplay(generated), trends),
    health
  );
  const recommendedActions = mapMorningBriefActionsForUi(generated);

  return {
    ...executive,
    executiveSummary: summary,
    aiBrief: {
      ...executive.aiBrief,
      executiveBrief: summary,
      recommendedActions,
    },
  };
}

/** Compose founder home data — KPIs loaded once via getExecutiveKPIsAction. */
export async function getFounderMorningBrief(ctx: IdentityContext): Promise<FounderMorningBrief> {
  if (!hasExecutiveLeadershipRole(ctx)) {
    // Single getExecutiveKPIsAction inside getFounderDashboardData.
    return {
      founderDashboard: await getFounderDashboardData(ctx),
      executive: null,
    };
  }

  const supabase = await createAuthClient();
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ??
    ctx.accessibleSchoolIds[0];

  // Start KPI action once in parallel with workspace / branding (no second KPI call).
  const kpisResultPromise = getExecutiveKPIsAction();

  const [kpisResult, branding, workspace] = await Promise.all([
    kpisResultPromise,
    loadOrganizationBranding(supabase),
    loadExecutiveIntelligenceWorkspace(supabase, ctx, {
      schoolId,
      decisionLimit: 5,
      alertLimit: 25,
      includeJagWork: true,
    }),
  ]);

  const kpis = "error" in kpisResult ? ZERO_KPIS : kpisResult.data;

  const founderDashboard = await getFounderDashboardData(ctx, {
    preloadedKpis: kpisResult,
    preloadedWorkspace: workspace,
  });

  const executiveBase = await composeMorningBriefExecutiveV2({
    supabase,
    identity: ctx,
    schoolId,
    branding: {
      founderWorkspaceLabel: branding.founderWorkspaceLabel,
      intelligenceEngineLabel: branding.intelligenceEngineLabel,
      missionControlLabel: branding.missionControlLabel,
      financialIntelligenceLabel: branding.financialIntelligenceLabel,
      productName: branding.productName,
    },
    missionControlPriorities: {
      critical: workspace.missionControlCritical,
      high: [],
      medium: [],
      low: [],
    },
    missionControlAccessDenied: false,
    preloadedWorkspace: workspace,
  });

  return {
    founderDashboard,
    // Most recent snapshot rows from workspace.kpiPair — no extra snapshot query.
    executive: applyGeneratedMorningBrief(executiveBase, kpis, workspace.kpiPair.current),
  };
}

export {
  composeMorningBriefExecutiveV2,
  resolveMorningBriefSectionFlags,
} from "@/lib/dashboard/morning-brief/compose";

export {
  buildExecutiveSummaryNarrative,
  buildFinancialPulse,
  buildNetworkHealth,
  buildOvernightActivity,
  buildWhatChangedSinceYesterday,
  compareKpiSnapshots,
  decisionsToLegacyJagWork,
} from "@/lib/dashboard/morning-brief/sections";
