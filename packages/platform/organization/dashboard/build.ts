/**
 * Universal Organization dashboard.
 */

import { getGovernanceProfile } from "../profiles/catalog";
import { performanceAnalytics } from "../performance/engine";
import { getOrganization } from "../store";
import type { OrganizationDashboard } from "../types";

export function buildOrganizationDashboard(
  organizationId: string
): OrganizationDashboard | { error: string } {
  const org = getOrganization(organizationId);
  if (!org) return { error: "Organization not found." };
  const perf = performanceAnalytics(organizationId);
  const profile = getGovernanceProfile(org.identity.governanceProfileId);
  const mrJagGuidance = `Operating as ${profile?.title ?? org.identity.governanceProfileId} in ${org.constitution.strategyMode.replace("_", " ")} mode. Constitution v${org.constitution.version} governs recommendations.`;

  return {
    generatedAt: new Date().toISOString(),
    identity: org.identity,
    strategyMode: org.constitution.strategyMode,
    constitutionVersion: org.constitution.version,
    goalCounts: perf.goalCounts,
    activeGoals: perf.activeGoals,
    atRiskGoals: perf.atRiskGoals,
    openRisks: org.risks.filter((r) => r.open).length,
    openCompliance: org.compliance.filter((c) => c.status !== "met").length,
    departmentCount: org.departments.length,
    teamCount: org.teams.length,
    peopleCount: org.people.length,
    hasStrategicPlan: Boolean(org.strategicPlan?.active),
    financeHooks: org.finance,
    mrJagGuidance,
  };
}
