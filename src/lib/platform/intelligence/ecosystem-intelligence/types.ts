/**
 * Ecosystem Intelligence (federation) — shared types / DTOs (Sprint 072).
 *
 * Leaf module: permission-aware federation across organizations.
 * Soft-reads Digital Twin / Portfolio / Initiative lights only.
 * Distinct from Sprint 057 mid-pipeline `ecosystem` domain (external network intel).
 *
 * Naming note: Sprint 057 already owns `EcosystemRequest` / `createEcosystemIntelligence`.
 * This package uses Federation* / ECOSYSTEM_FEDERATION_* symbols to avoid collisions.
 *
 * Never bypasses tenant isolation — authorized summaries only.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const ECOSYSTEM_FEDERATION_VERSION = "0.1.0";
export const ECOSYSTEM_INTELLIGENCE_MODULE_ID = "ecosystem-intelligence" as const;

export const NODE_KINDS = [
  "organization",
  "school",
  "foundation",
  "business_unit",
  "vendor",
  "partner",
  "government_agency",
  "investor",
  "board",
  "community",
] as const;

export const RELATIONSHIP_KINDS = [
  "parent_subsidiary",
  "strategic_partnership",
  "vendor",
  "grant_collaboration",
  "shared_initiative",
  "shared_service",
  "network_member",
  "holding",
] as const;

export const SUMMARY_KINDS = [
  "health",
  "portfolio",
  "initiative",
  "financial",
  "risk",
  "kpi",
] as const;

export type NodeKind = (typeof NODE_KINDS)[number];
export type RelationshipKind = (typeof RELATIONSHIP_KINDS)[number];
export type SummaryKind = (typeof SUMMARY_KINDS)[number];
export type EcosystemFederationMetadata = Record<string, unknown>;

export interface EcosystemFederationScope {
  organizationId: string | null;
  schoolId: string | null;
  actorOrganizationId?: string | null;
  actorRoles?: string[];
}

/** Soft-reads — no peer engine imports. */
export interface DigitalTwinResultLight extends ResultLightBase {
  simulations?: Array<{ id?: string; valid?: boolean; confidence?: number }>;
  recommendation?: { preferredScenarioId?: string | null; mayAutoExecute?: boolean };
  explainability?: { confidence?: number; executiveSummary?: string };
  contributingDomains?: string[];
}

export interface PortfolioResultLight extends ResultLightBase {
  health?: {
    value?: number;
    state?: string;
    riskIndex?: number;
    capacityUtilization?: number;
    strategicCoverage?: number;
  };
  analytics?: { portfolioValue?: number; expectedRoi?: number };
  capacity?: { budgetUtilization?: number; staffUtilization?: number; overcommitted?: boolean };
  contributingDomains?: string[];
}

export interface InitiativeResultLight extends ResultLightBase {
  initiatives?: Array<{
    id?: string;
    title?: string;
    state?: string;
    progress?: { percentComplete?: number; healthScore?: number };
  }>;
  activeCount?: number;
  atRiskCount?: number;
  contributingDomains?: string[];
}

export interface BriefingResultLight extends ResultLightBase {
  healthScore?: { value?: number; label?: string };
  contributingDomains?: string[];
}

/** Federated org summary — never includes raw operational records. */
export interface FederatedOrgSummary {
  organizationId: string;
  displayName: string;
  nodeKind: NodeKind;
  authorized: boolean;
  sharingAgreementId?: string;
  health?: { value: number; label: string };
  portfolio?: { value: number; state: string };
  initiatives?: { active: number; atRisk: number };
  financial?: { trend: "up" | "flat" | "down"; index: number };
  risk?: { index: number; label: string };
  kpis?: Array<{ key: string; value: number }>;
  geography?: { region?: string; state?: string };
}

export interface OrganizationNode {
  id: string;
  organizationId: string;
  displayName: string;
  kind: NodeKind;
  authorized: boolean;
  region?: string;
  state?: string;
  metadata?: EcosystemFederationMetadata;
}

export interface EcosystemRelationship {
  id: string;
  kind: RelationshipKind;
  fromId: string;
  toId: string;
  label: string;
  strength: number;
  sharedInitiativeIds?: string[];
  metadata?: EcosystemFederationMetadata;
}

export interface SharingAgreement {
  id: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  allowedSummaries: SummaryKind[];
  active: boolean;
  audited: boolean;
}

export interface EcosystemPermissionContext {
  actorOrganizationId: string | null;
  actorRoles: string[];
  agreements: SharingAgreement[];
  visibleOrganizationIds: string[];
}

export interface EcosystemMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  contributingOrganizationIds: string[];
}

export interface FederationRisk {
  id: string;
  kind:
    | "shared_vendor"
    | "shared_compliance"
    | "funding_concentration"
    | "leadership_bottleneck"
    | "geographic_dependency"
    | "operational_concentration";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  organizationIds: string[];
}

export interface FederationOpportunity {
  id: string;
  kind:
    | "shared_purchasing"
    | "shared_staffing"
    | "joint_grant"
    | "resource_sharing"
    | "technology_consolidation"
    | "program_expansion";
  title: string;
  description: string;
  organizationIds: string[];
  estimatedImpact: number;
}

export interface EcosystemGraph {
  nodes: OrganizationNode[];
  relationships: EcosystemRelationship[];
  rootOrganizationId: string | null;
}

export interface EcosystemFederationModel {
  graph: EcosystemGraph;
  summaries: FederatedOrgSummary[];
  metrics: EcosystemMetric[];
  risks: FederationRisk[];
  opportunities: FederationOpportunity[];
  geographicCoverage: Array<{ region: string; organizationIds: string[]; enrollmentIndex: number }>;
}

export interface GovernanceAuditEntry {
  at: string;
  action: string;
  actorOrganizationId: string | null;
  targetOrganizationId?: string;
  allowed: boolean;
  reason: string;
}

export interface EcosystemFederationRecommendation {
  preferredOpportunityIds: string[];
  keyTradeOffs: string[];
  resourceImplications: string[];
  majorRisks: string[];
  nextSteps: string[];
  advisoryOnly: true;
  humanAuthorizationRequired: true;
  mayAutoExecute: false;
}

export interface EcosystemFederationExplainability {
  executiveSummary: string;
  assumptions: string[];
  confidence: number;
  inputsUsed: string[];
  domainsConsulted: string[];
  constraintsEncountered: string[];
  uncertainties: string[];
  unauthorizedOrganizationsExcluded: string[];
}

export interface EcosystemMemberInput {
  organizationId: string;
  displayName: string;
  kind?: NodeKind;
  region?: string;
  state?: string;
  authorized?: boolean;
  sharingAgreementId?: string;
  healthValue?: number;
  portfolioValue?: number;
  portfolioState?: string;
  activeInitiatives?: number;
  atRiskInitiatives?: number;
  financialIndex?: number;
  financialTrend?: "up" | "flat" | "down";
  riskIndex?: number;
  enrollmentIndex?: number;
  relationships?: Array<{
    toOrganizationId: string;
    kind: RelationshipKind;
    label?: string;
    strength?: number;
  }>;
}

export interface EcosystemFederationRequest {
  requestId: string;
  scope: EcosystemFederationScope;
  periodLabel?: string;
  members?: EcosystemMemberInput[];
  agreements?: SharingAgreement[];
  digitalTwinResult?: DigitalTwinResultLight;
  portfolioResult?: PortfolioResultLight;
  initiativeResult?: InitiativeResultLight;
  briefingResult?: BriefingResultLight;
  metadata?: EcosystemFederationMetadata;
}

export interface EcosystemFederationResult {
  requestId: string;
  version: string;
  scope: EcosystemFederationScope;
  generatedAt: string;
  model: EcosystemFederationModel;
  federation: {
    authorizedCount: number;
    excludedCount: number;
    agreementCount: number;
    summaries: FederatedOrgSummary[];
  };
  recommendation: EcosystemFederationRecommendation;
  explainability: EcosystemFederationExplainability;
  auditLog: GovernanceAuditEntry[];
  contributingDomains: string[];
}
