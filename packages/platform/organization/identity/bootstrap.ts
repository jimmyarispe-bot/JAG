/**
 * Bootstrap a Universal Organization from identity + governance profile.
 */

import {
  getGovernanceProfile,
  normalizeGovernanceProfileId,
} from "../profiles/catalog";
import { upsertOrganization } from "../store";
import type {
  GovernanceProfileId,
  OrganizationalConstitution,
  UniversalOrganization,
} from "../types";

export function createDefaultConstitution(input: {
  organizationId: string;
  profileId: GovernanceProfileId;
  strategyMode?: OrganizationalConstitution["strategyMode"];
}): OrganizationalConstitution {
  const profile = getGovernanceProfile(input.profileId)!;
  const now = new Date().toISOString();
  return {
    organizationId: input.organizationId,
    version: "1.0.0",
    legalStructure: input.profileId,
    governanceModel: profile.defaultGovernanceModel,
    ownership: {
      ownershipType: profile.allowsEquity ? "equity" : "mission",
      owners: Object.freeze([]),
      notes: null,
    },
    board: Object.freeze([]),
    committees: Object.freeze([]),
    delegationOfAuthority: Object.freeze([
      "Officers execute within approved budgets",
    ]),
    approvalThresholds: Object.freeze([
      {
        id: "thr:spend:default",
        domain: "spending",
        description: "Default spending threshold requiring elevated approval",
        amount: 10000,
        currency: "USD",
        requiresBoard: profile.allowsBoard,
        requiresCommitteeId: null,
      },
    ]),
    spendingAuthority: Object.freeze(profile.typicalDecisionRules),
    hiringAuthority: Object.freeze([
      profile.allowsBoard
        ? "Leadership hires within budget; board for executive roles"
        : "Owner/leadership approves hiring",
    ]),
    strategicPlanningFramework:
      input.strategyMode === "goals_only" ||
      (!input.strategyMode && profile.defaultStrategyMode === "goals_only")
        ? null
        : "mission-vision-objectives-initiatives-goals",
    riskTolerance: profile.defaultRiskTolerance,
    financialPolicies: Object.freeze([
      "Segregation of duties where scale permits",
      "Document material commitments",
    ]),
    complianceObligations: profile.typicalCompliance,
    decisionMakingRules: profile.typicalDecisionRules,
    strategyMode: input.strategyMode ?? profile.defaultStrategyMode,
    updatedAt: now,
  };
}

export function bootstrapUniversalOrganization(input: {
  organizationId: string;
  legalName: string;
  displayName?: string;
  governanceProfileId?: string | null;
  tenantOrgType?: string | null;
  industry?: string | null;
  sector?: string | null;
  timezone?: string;
  locale?: string;
  currency?: string;
  mission?: string | null;
  vision?: string | null;
  values?: readonly string[];
  strategyMode?: OrganizationalConstitution["strategyMode"];
}): UniversalOrganization {
  const profileId = normalizeGovernanceProfileId(input.governanceProfileId);
  const constitution = createDefaultConstitution({
    organizationId: input.organizationId,
    profileId,
    strategyMode: input.strategyMode,
  });
  const now = new Date().toISOString();
  const org: UniversalOrganization = {
    identity: {
      organizationId: input.organizationId,
      legalName: input.legalName,
      displayName: input.displayName ?? input.legalName,
      slug: null,
      governanceProfileId: profileId,
      tenantOrgType: input.tenantOrgType ?? null,
      industry: input.industry ?? null,
      sector: input.sector ?? null,
      foundedAt: null,
      timezone: input.timezone ?? "America/New_York",
      locale: input.locale ?? "en-US",
      currency: input.currency ?? "USD",
    },
    mission: {
      mission: input.mission ?? null,
      vision: input.vision ?? null,
      values: Object.freeze([...(input.values ?? [])]),
    },
    constitution,
    leadershipPersonRefs: Object.freeze([]),
    departments: Object.freeze([]),
    teams: Object.freeze([]),
    people: Object.freeze([]),
    strategicPlan: null,
    goals: Object.freeze([]),
    kpis: Object.freeze([]),
    projects: Object.freeze([]),
    tasks: Object.freeze([]),
    policies: Object.freeze([]),
    compliance: Object.freeze([]),
    risks: Object.freeze([]),
    finance: {
      multiEntity: profileId === "holding_company" || profileId === "healthcare_network",
      fiscalYearStartMonth: 1,
      chartOfAccountsReady: false,
      bankingConnected: false,
      notes: "JAG Finance™ / JAG CFO™ planned as follow-on multi-sprint initiative.",
    },
    knowledge: Object.freeze([]),
    memory: Object.freeze([]),
    twin: {
      organizationId: input.organizationId,
      twinEntityId: null,
      lastProjectedAt: null,
      notes: "Link to Digital Twin Organization entity when projected.",
    },
    assets: Object.freeze([]),
    technology: Object.freeze([]),
    customers: Object.freeze([]),
    updatedAt: now,
  };
  return upsertOrganization(org);
}
