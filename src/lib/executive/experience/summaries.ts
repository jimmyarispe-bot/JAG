/**
 * Domain summaries for Executive Workspace — thin wrappers over existing services.
 */

import { createInnovationEngine } from "@innovation";
import { describeStrategyChain, listGoals } from "@organization";
import { createLearningIntelligenceEngine } from "@learning-intelligence";
import { buildLearningProgressSummary } from "@academyos";
import { createChiefFinancialOfficerEngine } from "@cfo";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  getNetworkDashboardBySchool,
  getNetworkDashboardByCampus,
} from "@/lib/executive/network-dashboard";
import { getCommandCenterMetrics } from "@/lib/executive/command-center";
import { getExecutiveAdmissionsMetrics } from "@/lib/admissions/executive-metrics";
import {
  getSchedulingExecutiveStats,
  getScheduleConflicts,
} from "@/lib/scheduling/queries";
import { getExecutiveDeadlineAnalytics } from "@/lib/compliance/deadlines";
import { getFinanceOperationsSummary } from "@/lib/finance-platform/reports";
import { getSchoolLeaderHrSummary } from "@/lib/school-leader/experience/summaries";
import { getStrategicPlanningWorkspace } from "@/lib/executive/insights";
import { listAnnouncements } from "@/lib/communications/announcements";
import { listCommunications } from "@/lib/communications/queries";
import { createMemoryMetrics } from "@/lib/memory/metrics";
import { createTwinHistoryService } from "@/lib/digital-twin/history";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getExecutiveMultiSchoolSummary(supabase: AuthClient) {
  const [bySchool, byCampus] = await Promise.all([
    getNetworkDashboardBySchool(supabase),
    getNetworkDashboardByCampus(supabase).catch(() => []),
  ]);

  return {
    bySchool,
    byCampus,
    comparisons: bySchool.map((r) => ({
      campus: r.dimensionValue,
      enrollment: r.enrollment,
      revenue: r.revenue,
      utilizationStaff: r.activeStaff,
      pipeline: r.pipelineLeads,
      href: r.drillHref,
    })),
    note: "Multi-school enrollment, capacity, and comparisons from existing network reporting views — no duplicated reporting math.",
  };
}

export async function getExecutiveAcademicsSummary(organizationId: string) {
  let progress: ReturnType<typeof buildLearningProgressSummary> | null = null;
  let distribution: unknown = null;
  let interventions: unknown[] = [];

  try {
    progress = buildLearningProgressSummary(organizationId);
  } catch {
    progress = null;
  }

  try {
    const engine = createLearningIntelligenceEngine();
    distribution = engine.masteryDistribution(organizationId);
    interventions = (engine.listInterventions(organizationId) as unknown[]).slice(0, 15);
  } catch {
    distribution = null;
    interventions = [];
  }

  return {
    progress,
    masteryDistribution: distribution,
    interventions,
    source: "LearningIntelligenceEngine" as const,
    note: "Executive academics are read-only Learning Intelligence summaries — no duplicated mastery models.",
  };
}

export async function getExecutiveOperationsSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [command, admissions, scheduling, conflicts, compliance] = await Promise.all([
    getCommandCenterMetrics(supabase, schoolId ?? undefined).catch(() => null),
    getExecutiveAdmissionsMetrics().catch(() => null),
    getSchedulingExecutiveStats(schoolId ?? undefined).catch(() => null),
    getScheduleConflicts(schoolId ?? undefined).catch(() => []),
    getExecutiveDeadlineAnalytics(supabase, schoolId ?? undefined).catch(() => null),
  ]);

  return {
    command,
    admissions: admissions
      ? {
          newInquiries: admissions.newInquiries,
          applicationsSubmitted: admissions.applicationsSubmitted,
          accepted: admissions.accepted,
          waitlisted: admissions.waitlisted,
          awaitingDecision: admissions.awaitingDecision,
        }
      : null,
    scheduling,
    openConflicts: conflicts.length,
    compliance,
    note: "Admissions, attendance/sessions, staffing, scheduling, and compliance from existing services.",
  };
}

export async function getExecutiveFinanceSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const ops = await getFinanceOperationsSummary(supabase, { schoolId });

  let cfoNote =
    "ChiefFinancialOfficerEngine available for executive KPI / board patterns — summaries here remain read-only.";
  try {
    createChiefFinancialOfficerEngine();
    cfoNote =
      "FinanceEngine + ChiefFinancialOfficerEngine — executive summaries only; no accounting logic in this workspace.";
  } catch {
    /* optional */
  }

  return {
    summary: ops,
    readOnly: true as const,
    engines: ["FinanceEngine", "ChiefFinancialOfficerEngine"] as const,
    note: cfoNote,
    deepLinks: {
      finance: "/dashboard/finance",
      financeExecutive: "/dashboard/finance/executive",
      forecasting: "/dashboard/executive/forecasting",
      board: "/dashboard/executive/board",
      scholarships: "/dashboard/scholarships",
    },
  };
}

export async function getExecutivePeopleSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const hr = await getSchoolLeaderHrSummary(supabase, schoolId);
  return {
    ...hr,
    note: "People / leadership / hiring from existing HR workforce services — no duplicated HR logic.",
  };
}

export async function getExecutiveStrategySummary(
  supabase: AuthClient,
  organizationId: string,
  schoolId: string | null
) {
  let chain: ReturnType<typeof describeStrategyChain> | null = null;
  let goals: ReturnType<typeof listGoals> = [];
  try {
    chain = describeStrategyChain(organizationId);
    goals = listGoals(organizationId).slice(0, 20);
  } catch {
    chain = null;
    goals = [];
  }

  const workspace = await getStrategicPlanningWorkspace(
    supabase,
    schoolId ?? undefined
  ).catch(() => null);

  return {
    strategyEngine: chain,
    goals,
    workspace,
    deepLink: "/dashboard/executive/strategic",
    note: "StrategyEngine (@organization) + existing strategic planning workspace — no duplicated strategy logic.",
  };
}

export async function getExecutiveInnovationSummary(organizationId: string) {
  let portfolio: unknown = null;
  let roadmap: unknown = null;
  let dashboard: unknown = null;

  try {
    const engine = createInnovationEngine();
    engine.scan({ organizationId, limit: 15 });
    portfolio = engine.portfolio();
    roadmap = engine.roadmap();
    dashboard = engine.dashboard(organizationId);
  } catch {
    portfolio = null;
    roadmap = null;
    dashboard = null;
  }

  return {
    portfolio,
    roadmap,
    dashboard,
    source: "InnovationEngine" as const,
    note: "Innovation portfolio, experiments, and roadmaps from InnovationEngine — discovery only, no change implementation.",
  };
}

export async function getExecutiveIntelligenceSummary(organizationId: string) {
  let memorySummary: unknown = null;
  let twinHistory: unknown[] = [];

  try {
    memorySummary = createMemoryMetrics().summarize(organizationId);
  } catch {
    memorySummary = null;
  }

  try {
    twinHistory = [...createTwinHistoryService().list(organizationId)].slice(0, 15);
  } catch {
    twinHistory = [];
  }

  return {
    memorySummary,
    twinHistory,
    recommendationsNote:
      "Recommendations must be evidence-backed from Twin history and Organizational Memory — no speculative AI in this workspace.",
    deepLinks: {
      briefings: "/dashboard/executive/briefings",
      decisions: "/dashboard/executive/decisions",
      recommendations: "/dashboard/executive/recommendations",
    },
  };
}

export async function getExecutiveCommunicationsSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [announcements, communications] = await Promise.all([
    listAnnouncements(supabase, { schoolId, limit: 20 }),
    listCommunications({ schoolId: schoolId ?? undefined, pageSize: 20 }).catch(() => ({
      rows: [],
      total: 0,
    })),
  ]);

  return {
    announcements,
    communications: communications.rows ?? [],
    deepLink: "/dashboard/communications",
  };
}

export function getExecutiveReportsCatalog() {
  return [
    {
      id: "board",
      title: "Board reports",
      href: "/dashboard/executive/board",
      description: "Board packs via existing board reporting",
    },
    {
      id: "executive",
      title: "Executive reports",
      href: "/dashboard/executive/reports",
      description: "Executive report templates and exports",
    },
    {
      id: "kpis",
      title: "Operational KPIs",
      href: "/dashboard/executive/kpis",
      description: "KPI center",
    },
    {
      id: "academics",
      title: "Academic summaries",
      href: "/dashboard/executive/academics",
      description: "Learning Intelligence org summaries",
    },
    {
      id: "finance",
      title: "Financial summaries",
      href: "/dashboard/executive/finance",
      description: "Finance / CFO read-only executive summaries",
    },
    {
      id: "network",
      title: "Multi-school network",
      href: "/dashboard/executive/network",
      description: "Campus comparison reporting",
    },
  ] as const;
}
