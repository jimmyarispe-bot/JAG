import type {
  EcosystemFederationRecommendation,
  GovernanceAuditEntry,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export function createAdvisoryRecommendation(
  preferredOpportunityIds: string[],
  risks: string[],
  tradeOffs: string[],
  nextSteps: string[]
): EcosystemFederationRecommendation {
  return {
    preferredOpportunityIds,
    keyTradeOffs: tradeOffs,
    resourceImplications: [
      "Cross-org resource moves require explicit sharing agreements.",
      "No raw tenant data is transferred by this recommendation.",
    ],
    majorRisks: risks,
    nextSteps,
    advisoryOnly: true,
    humanAuthorizationRequired: true,
    mayAutoExecute: false,
  };
}

export function auditEntry(
  at: string,
  action: string,
  actorOrganizationId: string | null,
  allowed: boolean,
  reason: string,
  targetOrganizationId?: string
): GovernanceAuditEntry {
  return {
    at,
    action,
    actorOrganizationId,
    targetOrganizationId,
    allowed,
    reason,
  };
}
