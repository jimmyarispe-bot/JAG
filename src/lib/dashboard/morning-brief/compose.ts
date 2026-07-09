import type { OrganizationBranding } from "@/lib/branding";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getConfigSection } from "@/lib/configuration/sections";
import {
  DEFAULT_MORNING_BRIEF_SECTION_FLAGS,
  type FounderMorningBriefExecutiveV2,
  type MorningBriefSectionFlags,
  type MorningBriefOvernightActivityItem,
} from "@/lib/dashboard/morning-brief/types";
import {
  buildExecutiveSummaryNarrative,
  buildFinancialPulse,
  buildNetworkHealth,
  buildWhatChangedSinceYesterday,
  compareKpiSnapshots,
  decisionsToLegacyJagWork,
  selectMissionControlCritical,
} from "@/lib/dashboard/morning-brief/sections";
import { loadKpiSnapshotPair } from "@/lib/dashboard/morning-brief/kpi-compare";
import {
  getExecutiveAlerts,
  loadExecutiveAlertSources,
  type ActivityAlertLike,
} from "@/lib/platform/executive-alerts";
import { getExecutiveDecisionQueue } from "@/lib/platform/executive-decisions";
import type { MissionControlAiBrief } from "@/lib/platform/automation/mission-control-compose";
import { resolveJagWorkQueue } from "@/lib/platform/jag-work";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { resolveSchoolContext } from "@/lib/platform/shared/context";
import type { ExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function emptyAiBrief(): MissionControlAiBrief {
  return {
    executiveBrief: null,
    highestRisks: [],
    opportunities: [],
    recommendedActions: [],
    projectedProblems: [],
  };
}

const NOISE_ACTIVITY_TYPES = new Set([
  "platform.tag_applied",
  "platform.tag_removed",
  "platform.note_created",
  "platform.relationship_created",
]);

/** Overnight strip from Activity Engine events already loaded in alert sources. */
function overnightFromAlertActivity(
  events: ActivityAlertLike[],
  sinceIso: string,
  limit = 8
): MorningBriefOvernightActivityItem[] {
  const since = new Date(sinceIso).getTime();
  return events
    .filter((e) => {
      const at = e.occurred_at ?? e.created_at;
      return at ? new Date(at).getTime() >= since : false;
    })
    .filter((e) => !NOISE_ACTIVITY_TYPES.has(e.event_type ?? ""))
    .filter((e) => {
      const type = e.event_type ?? "";
      const classification = e.classification ?? "";
      return (
        classification === "critical" ||
        classification === "operational" ||
        classification === "audit" ||
        type.startsWith("admissions.") ||
        type.startsWith("executive.") ||
        type.startsWith("fi.") ||
        type.startsWith("edi.") ||
        type.includes("alert") ||
        type.includes("decision")
      );
    })
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      title: e.summary?.trim() || e.event_type || "Activity",
      summary: e.summary?.trim() || e.event_type || "Activity",
      moduleKey: e.module_key ?? "platform",
      eventType: e.event_type ?? "unknown",
      severity: e.classification ?? null,
      occurredAt: e.occurred_at ?? e.created_at ?? new Date().toISOString(),
      href: null,
    }));
}

export async function resolveMorningBriefSectionFlags(
  supabase: AuthClient,
  organizationId: string | null
): Promise<MorningBriefSectionFlags> {
  if (!organizationId) return { ...DEFAULT_MORNING_BRIEF_SECTION_FLAGS };
  try {
    const [executive, missionControl] = await Promise.all([
      getConfigSection(supabase, organizationId, "executive"),
      getConfigSection(supabase, organizationId, "mission_control"),
    ]);
    const brief =
      (executive.morning_brief as Record<string, unknown> | undefined) ?? {};
    const widgetsEnabled = executive.widgets_enabled !== false;
    const mcEnabled = missionControl.auto_sync !== false;

    return {
      executiveSummary: widgetsEnabled && brief.executive_summary !== false,
      topDecisions: widgetsEnabled && brief.top_decisions !== false,
      financialPulse: widgetsEnabled && brief.financial_pulse !== false,
      networkHealth: widgetsEnabled && brief.network_health !== false,
      overnightActivity: widgetsEnabled && brief.overnight_activity !== false,
      missionControl: mcEnabled && brief.mission_control !== false,
      executiveAlerts: widgetsEnabled && brief.executive_alerts !== false,
      kpiChanges: widgetsEnabled && brief.kpi_changes !== false,
      whatChanged: widgetsEnabled && brief.what_changed !== false,
    };
  } catch {
    return { ...DEFAULT_MORNING_BRIEF_SECTION_FLAGS };
  }
}

export interface ComposeMorningBriefV2Input {
  supabase: AuthClient;
  identity: IdentityContext;
  schoolId?: string;
  branding: Pick<
    OrganizationBranding,
    | "founderWorkspaceLabel"
    | "intelligenceEngineLabel"
    | "missionControlLabel"
    | "financialIntelligenceLabel"
    | "productName"
  >;
  /** Mission Control compose priorities when already loaded (avoid duplicate compose). */
  missionControlPriorities?: Record<
    "critical" | "high" | "medium" | "low",
    import("@/lib/platform/automation/mission-control-compose").MissionControlPriorityItem[]
  >;
  missionControlAiBrief?: MissionControlAiBrief;
  missionControlAccessDenied?: boolean;
  now?: Date;
  /** Pass shared workspace from loadExecutiveIntelligenceWorkspace to skip re-fetch. */
  preloadedWorkspace?: ExecutiveIntelligenceWorkspace;
}

/**
 * Compose Morning Brief 2.0 sections from platform services.
 * Prefer preloadedWorkspace (Task 6); otherwise loads alert sources once.
 */
export async function composeMorningBriefExecutiveV2(
  input: ComposeMorningBriefV2Input
): Promise<FounderMorningBriefExecutiveV2> {
  const now = input.now ?? new Date();
  const builtAt = now.toISOString();
  const schoolId =
    input.schoolId ??
    input.identity.orgAssignments.find((a) => a.is_primary)?.school_id ??
    input.identity.accessibleSchoolIds[0];

  const schoolCtx = schoolId
    ? await resolveSchoolContext(input.supabase, schoolId)
    : null;
  const organizationId =
    input.preloadedWorkspace?.organizationId ?? schoolCtx?.organizationId ?? null;

  const filters = input.preloadedWorkspace?.filters ?? {
    organizationId,
    schoolId: schoolId ?? null,
    campusId: schoolCtx?.campusId ?? null,
  };

  const sectionFlags = await resolveMorningBriefSectionFlags(
    input.supabase,
    organizationId
  );

  let alertSources = input.preloadedWorkspace?.alertSources;
  let alertStream = input.preloadedWorkspace?.alerts;
  let kpiPair = input.preloadedWorkspace?.kpiPair;
  let decisionQueue = input.preloadedWorkspace?.decisions;

  if (!alertSources || !alertStream || !kpiPair || !decisionQueue) {
    alertSources = await loadExecutiveAlertSources(input.supabase, filters);
    const complianceAlerts = alertSources.compliance?.overdue ?? 0;
    const missionControlCriticalCount = alertSources.missionControl.filter(
      (i) => (i.severity ?? "").toLowerCase() === "critical"
    ).length;

    const [stream, pair, workQueue] = await Promise.all([
      getExecutiveAlerts(input.supabase, {
        filters,
        limit: 25,
        preloadedSources: alertSources,
      }),
      loadKpiSnapshotPair(
        input.supabase,
        {
          networkId: null,
          regionId: null,
          campusId: filters.campusId ?? null,
          programId: null,
          program: null,
          organizationId: filters.organizationId ?? null,
          schoolId: filters.schoolId ?? null,
        },
        now
      ),
      resolveJagWorkQueue({
        workspaceKey: "executive",
        input: {
          supabase: input.supabase,
          identity: input.identity,
          activePerspective: "needs_human_decision",
          insights: [],
          complianceAlerts,
          missionControlCritical: missionControlCriticalCount,
          engineRecommendations: [],
          executionState: null,
        },
      }),
    ]);

    alertStream = stream;
    kpiPair = pair;
    decisionQueue = await getExecutiveDecisionQueue(input.supabase, {
      filters,
      limit: 5,
      jagWorkItems: workQueue.allItems,
      preloadedAlerts: alertStream.alerts,
      preloadedMissionControl: alertSources.missionControl,
      preloadedActivity: alertSources.activity,
      preloadedKpiSnapshots: kpiPair.current.filter(
        (r) =>
          r.status === "critical" || r.status === "at_risk" || r.status === "watch"
      ),
    });
  }

  const financialPulse = buildFinancialPulse(alertSources.aggregate);
  const networkHealth = buildNetworkHealth(alertSources.aggregate);

  const overnightSince = new Date(now.getTime() - 18 * 3600_000).toISOString();
  const overnightActivity = overnightFromAlertActivity(
    alertSources.activity,
    overnightSince,
    8
  );

  const missionControlCritical = input.missionControlAccessDenied
    ? []
    : selectMissionControlCritical(
        input.missionControlPriorities ?? {
          critical: input.preloadedWorkspace?.missionControlCritical ?? [],
          high: [],
          medium: [],
          low: [],
        }
      );

  const topDecisions = decisionQueue.decisions.slice(0, 5);
  const executiveAlerts = alertStream.alerts
    .filter((a) => a.status === "open" || a.status === "acknowledged")
    .slice(0, 8);

  const kpiChanges = compareKpiSnapshots(
    kpiPair.current,
    kpiPair.prior,
    kpiPair.currentDate,
    kpiPair.priorDate,
    5
  );
  const whatChangedSinceYesterday = buildWhatChangedSinceYesterday(
    kpiPair.current,
    kpiPair.prior,
    10
  );

  const executiveSummary = buildExecutiveSummaryNarrative({
    productName: input.branding.productName,
    workspaceLabel: input.branding.founderWorkspaceLabel,
    aggregate: alertSources.aggregate,
    alerts: executiveAlerts,
    decisions: topDecisions,
    missionControlCriticalCount: missionControlCritical.length,
    financialPulse,
  });

  const aiBrief = input.missionControlAiBrief
    ? { ...input.missionControlAiBrief }
    : emptyAiBrief();
  // Morning Brief 2.0: deterministic template is canonical (no AI yet).
  // Preserve EDI risks/actions; replace narrative with template summary.
  if (sectionFlags.executiveSummary) {
    aiBrief.executiveBrief = executiveSummary;
  }

  const legacyPriorities = missionControlCritical.length
    ? missionControlCritical
    : (input.missionControlPriorities?.high ?? []).slice(0, 5);

  return {
    priorities: legacyPriorities,
    aiBrief,
    decisionsWaiting: decisionsToLegacyJagWork(topDecisions),
    decisionsCount: decisionQueue.decisions.length,
    executiveSummary: sectionFlags.executiveSummary ? executiveSummary : "",
    topDecisions: sectionFlags.topDecisions ? topDecisions : [],
    financialPulse: sectionFlags.financialPulse
      ? financialPulse
      : {
          estimatedCash: null,
          collectionsYesterday: null,
          receivablesDue: null,
          payrollDue: null,
          financialRisk: null,
          confidence: "Unknown",
          methodologyNote: "",
        },
    networkHealth: sectionFlags.networkHealth
      ? networkHealth
      : { nodes: [], overall: "Unknown" },
    overnightActivity: sectionFlags.overnightActivity ? overnightActivity : [],
    missionControlCritical: sectionFlags.missionControl
      ? missionControlCritical
      : [],
    executiveAlerts: sectionFlags.executiveAlerts ? executiveAlerts : [],
    kpiChanges: sectionFlags.kpiChanges
      ? kpiChanges
      : {
          largestIncreases: [],
          largestDecreases: [],
          comparedSnapshotDate: null,
          currentSnapshotDate: null,
        },
    whatChangedSinceYesterday: sectionFlags.whatChanged
      ? whatChangedSinceYesterday
      : [],
    sectionFlags,
    brandingLabels: {
      founderWorkspaceLabel: input.branding.founderWorkspaceLabel,
      intelligenceEngineLabel: input.branding.intelligenceEngineLabel,
      missionControlLabel: input.branding.missionControlLabel,
      financialIntelligenceLabel: input.branding.financialIntelligenceLabel,
      productName: input.branding.productName,
    },
    builtAt,
  };
}
