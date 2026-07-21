import { buildRelationships } from "@/lib/platform/intelligence/ecosystem-intelligence/models/relationship";
import { toOrganizationNode } from "@/lib/platform/intelligence/ecosystem-intelligence/models/organization-node";
import type {
  EcosystemMemberInput,
  EcosystemFederationModel,
  EcosystemPermissionContext,
  FederatedOrgSummary,
  PortfolioResultLight,
  InitiativeResultLight,
  BriefingResultLight,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export interface BuildEcosystemFederationModelInput {
  rootOrganizationId: string | null;
  members: EcosystemMemberInput[];
  permissions: EcosystemPermissionContext;
  portfolio?: PortfolioResultLight;
  initiatives?: InitiativeResultLight;
  briefing?: BriefingResultLight;
  createId: (prefix: string) => string;
}

export function buildEcosystemFederationModel(
  input: BuildEcosystemFederationModelInput
): EcosystemFederationModel {
  const visible = new Set(input.permissions.visibleOrganizationIds);
  const authorizedMembers = input.members.filter(
    (m) => m.authorized !== false && visible.has(m.organizationId)
  );
  const authorizedIds = new Set(authorizedMembers.map((m) => m.organizationId));

  const nodes = authorizedMembers.map((m) => toOrganizationNode(m, true));
  const relationships = buildRelationships(authorizedMembers, authorizedIds, input.createId);
  const summaries = authorizedMembers.map((m) => toSummary(m, input));

  return {
    graph: {
      nodes,
      relationships,
      rootOrganizationId: input.rootOrganizationId,
    },
    summaries,
    metrics: [],
    risks: [],
    opportunities: [],
    geographicCoverage: [],
  };
}

function toSummary(
  member: EcosystemMemberInput,
  input: BuildEcosystemFederationModelInput
): FederatedOrgSummary {
  const isRoot = member.organizationId === input.rootOrganizationId;
  const healthValue =
    member.healthValue ??
    (isRoot ? input.briefing?.healthScore?.value ?? input.portfolio?.health?.value ?? 60 : 55);
  const portfolioValue =
    member.portfolioValue ??
    (isRoot ? input.portfolio?.analytics?.portfolioValue ?? 100_000 : 50_000);
  const active =
    member.activeInitiatives ?? (isRoot ? input.initiatives?.activeCount ?? 0 : 0);
  const atRisk =
    member.atRiskInitiatives ?? (isRoot ? input.initiatives?.atRiskCount ?? 0 : 0);
  const riskIndex =
    member.riskIndex ?? (isRoot ? input.portfolio?.health?.riskIndex ?? 40 : 35);

  return {
    organizationId: member.organizationId,
    displayName: member.displayName,
    nodeKind: member.kind ?? "organization",
    authorized: true,
    sharingAgreementId: member.sharingAgreementId,
    health: {
      value: healthValue,
      label: healthValue >= 70 ? "healthy" : healthValue >= 50 ? "watch" : "critical",
    },
    portfolio: {
      value: portfolioValue,
      state: member.portfolioState ?? input.portfolio?.health?.state ?? "watch",
    },
    initiatives: { active, atRisk },
    financial: {
      trend: member.financialTrend ?? "flat",
      index: member.financialIndex ?? 50,
    },
    risk: {
      index: riskIndex,
      label: riskIndex >= 70 ? "elevated" : riskIndex >= 40 ? "moderate" : "low",
    },
    kpis: [
      { key: "health", value: healthValue },
      { key: "risk", value: riskIndex },
    ],
    geography: { region: member.region, state: member.state },
  };
}
