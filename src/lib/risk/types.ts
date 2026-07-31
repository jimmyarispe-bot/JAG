/** Risk & Compliance Intelligence™ — deterministic risk domain (no AI). */

export const RISK_CATEGORIES = [
  "Financial",
  "Operational",
  "Strategic",
  "Technology",
  "Cybersecurity",
  "Regulatory",
  "Compliance",
  "HR",
  "Vendor",
  "Reputational",
  "Legal",
  "Safety",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

export const RISK_LIKELIHOODS = [1, 2, 3, 4, 5] as const;
export type RiskLikelihood = (typeof RISK_LIKELIHOODS)[number];

export const RISK_IMPACTS = [1, 2, 3, 4, 5] as const;
export type RiskImpact = (typeof RISK_IMPACTS)[number];

/** Mitigation workflow statuses for risks. */
export const RISK_STATUSES = [
  "Identified",
  "Assessing",
  "Mitigating",
  "Monitoring",
  "Resolved",
  "Closed",
] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const CONTROL_TYPES = [
  "Preventive",
  "Detective",
  "Corrective",
] as const;
export type ControlType = (typeof CONTROL_TYPES)[number];

export const CONTROL_EFFECTIVENESS = [
  "Effective",
  "Partially Effective",
  "Ineffective",
  "Not Assessed",
] as const;
export type ControlEffectiveness = (typeof CONTROL_EFFECTIVENESS)[number];

export const MITIGATION_STATUSES = [
  "Planned",
  "In Progress",
  "Blocked",
  "Completed",
  "Cancelled",
] as const;
export type MitigationStatus = (typeof MITIGATION_STATUSES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Partial",
  "Non-Compliant",
  "Not Assessed",
  "Overdue",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const RISK_TIMELINE_KINDS = [
  "created",
  "updated",
  "status_changed",
  "scored",
  "control_linked",
  "mitigation_updated",
  "compliance_linked",
  "review_scheduled",
  "closed",
] as const;
export type RiskTimelineKind = (typeof RISK_TIMELINE_KINDS)[number];

export type JagRisk = {
  readonly id: string;
  readonly organizationId: string;
  readonly category: RiskCategory;
  readonly title: string;
  readonly description: string;
  readonly severity: RiskSeverity;
  readonly likelihood: RiskLikelihood;
  readonly impact: RiskImpact;
  /** Deterministic inherent score (likelihood × impact). */
  readonly inherentScore: number;
  /** Deterministic residual score after controls / mitigations. */
  readonly residualScore: number;
  readonly status: RiskStatus;
  readonly owner: string | null;
  readonly businessUnit: string | null;
  readonly department: string | null;
  readonly relatedGoalId: string | null;
  readonly relatedDecisionId: string | null;
  readonly relatedEvidenceIds: readonly string[];
  readonly relatedTwinEntityId: string | null;
  readonly mitigationPlan: string;
  readonly reviewDate: string | null;
  readonly controlIds: readonly string[];
  readonly mitigationIds: readonly string[];
  readonly complianceRequirementIds: readonly string[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt: string | null;
  readonly closedAt: string | null;
  readonly createdBy: string;
};

export type JagControl = {
  readonly id: string;
  readonly organizationId: string;
  readonly riskId: string | null;
  readonly name: string;
  readonly description: string;
  readonly controlType: ControlType;
  readonly owner: string | null;
  readonly frequency: string;
  readonly lastReviewAt: string | null;
  readonly effectiveness: ControlEffectiveness;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type JagMitigation = {
  readonly id: string;
  readonly organizationId: string;
  readonly riskId: string;
  readonly title: string;
  readonly description: string;
  readonly status: MitigationStatus;
  readonly owner: string | null;
  readonly dueDate: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type JagComplianceRequirement = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly policyId: string | null;
  readonly procedure: string;
  readonly requiredEvidence: readonly string[];
  readonly requiredReviews: readonly string[];
  readonly renewalDate: string | null;
  readonly status: ComplianceStatus;
  readonly owner: string | null;
  readonly relatedRiskIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type JagPolicy = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly owner: string | null;
  readonly effectiveDate: string | null;
  readonly reviewDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type JagObligation = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly source: string;
  readonly dueDate: string | null;
  readonly status: ComplianceStatus;
  readonly owner: string | null;
  readonly relatedRequirementId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type JagAuditFinding = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly severity: RiskSeverity;
  readonly status: MitigationStatus;
  readonly relatedRiskId: string | null;
  readonly relatedRequirementId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type JagException = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly rationale: string;
  readonly relatedRiskId: string | null;
  readonly relatedRequirementId: string | null;
  readonly expiresAt: string | null;
  readonly approvedBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type RiskTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly riskId: string;
  readonly kind: RiskTimelineKind;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type CreateRiskInput = {
  readonly organizationId: string;
  readonly category: RiskCategory;
  readonly title: string;
  readonly description: string;
  readonly severity?: RiskSeverity;
  readonly likelihood?: RiskLikelihood;
  readonly impact?: RiskImpact;
  readonly status?: RiskStatus;
  readonly owner?: string | null;
  readonly businessUnit?: string | null;
  readonly department?: string | null;
  readonly relatedGoalId?: string | null;
  readonly relatedDecisionId?: string | null;
  readonly relatedEvidenceIds?: readonly string[];
  readonly relatedTwinEntityId?: string | null;
  readonly mitigationPlan?: string;
  readonly reviewDate?: string | null;
  readonly createdBy: string;
};

export type PatchRiskInput = {
  readonly organizationId: string;
  readonly riskId: string;
  readonly actor: string;
  readonly category?: RiskCategory;
  readonly title?: string;
  readonly description?: string;
  readonly severity?: RiskSeverity;
  readonly likelihood?: RiskLikelihood;
  readonly impact?: RiskImpact;
  readonly status?: RiskStatus;
  readonly owner?: string | null;
  readonly businessUnit?: string | null;
  readonly department?: string | null;
  readonly relatedGoalId?: string | null;
  readonly relatedDecisionId?: string | null;
  readonly relatedEvidenceIds?: readonly string[];
  readonly relatedTwinEntityId?: string | null;
  readonly mitigationPlan?: string;
  readonly reviewDate?: string | null;
  readonly controlIds?: readonly string[];
  readonly mitigationIds?: readonly string[];
  readonly complianceRequirementIds?: readonly string[];
};

export type RiskSummary = {
  readonly criticalRisks: number;
  readonly highRisks: number;
  readonly openRisks: number;
  readonly overdueReviews: number;
  readonly openMitigations: number;
  readonly complianceStatus: ComplianceStatus;
  readonly compliantRequirements: number;
  readonly totalRequirements: number;
  readonly byCategory: Readonly<Record<string, number>>;
  readonly byBusinessUnit: Readonly<Record<string, number>>;
  readonly bySeverity: Readonly<Record<RiskSeverity, number>>;
  readonly averageResidualScore: number;
};

export type RiskDashboard = {
  readonly critical: readonly JagRisk[];
  readonly high: readonly JagRisk[];
  readonly overdueReviews: readonly JagRisk[];
  readonly openMitigations: readonly JagMitigation[];
  readonly compliance: readonly JagComplianceRequirement[];
  readonly summary: RiskSummary;
};
