/**
 * Founder Morning Brief — Milestone 1 Phase A / Sprint 002.
 * Single workspace load; Key Metrics + brief sections share platform services.
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
import { mapWorkspaceToFounderDashboard } from "@/lib/platform/executive-intelligence/map-founder-dashboard";

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

/** Compose founder home data from Sprint 002 platform services (single workspace load). */
export async function getFounderMorningBrief(ctx: IdentityContext): Promise<FounderMorningBrief> {
  // Non-leadership: Key Metrics only, still via platform workspace (no legacy SQL).
  if (!hasExecutiveLeadershipRole(ctx)) {
    return {
      founderDashboard: await getFounderDashboardData(ctx),
      executive: null,
    };
  }

  const supabase = await createAuthClient();
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ?? ctx.accessibleSchoolIds[0];

  const [branding, workspace] = await Promise.all([
    loadOrganizationBranding(supabase),
    loadExecutiveIntelligenceWorkspace(supabase, ctx, {
      schoolId,
      decisionLimit: 5,
      alertLimit: 25,
      includeJagWork: true,
    }),
  ]);

  const founderDashboard = mapWorkspaceToFounderDashboard(workspace, ctx);

  const executive = await composeMorningBriefExecutiveV2({
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
    executive,
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
