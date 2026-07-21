import { mayReadSummary } from "@/lib/platform/intelligence/ecosystem-intelligence/federation/permissions";
import type {
  EcosystemPermissionContext,
  FederatedOrgSummary,
  SummaryKind,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

const ALL_KINDS: SummaryKind[] = [
  "health",
  "portfolio",
  "initiative",
  "financial",
  "risk",
  "kpi",
];

export function projectAuthorizedSummaries(
  summaries: FederatedOrgSummary[],
  permissions: EcosystemPermissionContext
): FederatedOrgSummary[] {
  return summaries
    .filter((s) => permissions.visibleOrganizationIds.includes(s.organizationId))
    .map((s) => {
      const allowed = new Set(
        ALL_KINDS.filter((k) => mayReadSummary(permissions, s.organizationId, k))
      );
      return {
        ...s,
        authorized: true,
        health: allowed.has("health") ? s.health : undefined,
        portfolio: allowed.has("portfolio") ? s.portfolio : undefined,
        initiatives: allowed.has("initiative") ? s.initiatives : undefined,
        financial: allowed.has("financial") ? s.financial : undefined,
        risk: allowed.has("risk") ? s.risk : undefined,
        kpis: allowed.has("kpi") ? s.kpis : undefined,
      };
    });
}
