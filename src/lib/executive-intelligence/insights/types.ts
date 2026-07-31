/** Executive Intelligence™ Beta — deterministic insight model (no AI). */

export const INSIGHT_SEVERITIES = ["Info", "Warning", "Critical"] as const;
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];

export const INSIGHT_DOMAINS = [
  "Finance",
  "Operations",
  "Knowledge",
  "Organization",
] as const;
export type InsightDomain = (typeof INSIGHT_DOMAINS)[number];

export const INSIGHT_STATUSES = ["Active", "Resolved"] as const;
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];

export type InsightEvidenceRef = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

export type ExecutiveInsight = {
  readonly id: string;
  readonly organizationId: string;
  readonly ruleId: string;
  readonly domain: InsightDomain;
  readonly severity: InsightSeverity;
  readonly title: string;
  readonly description: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly supportingEvidence: readonly InsightEvidenceRef[];
  readonly relatedConnectorIds: readonly string[];
  readonly relatedGraphNodeIds: readonly string[];
  readonly suggestedNextStep: string;
  readonly status: InsightStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt: string | null;
};

export type InsightTimelineKind =
  | "created"
  | "severity_changed"
  | "resolved";

export type InsightTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly insightId: string;
  readonly ruleId: string;
  readonly kind: InsightTimelineKind;
  readonly at: string;
  readonly message: string;
  readonly fromSeverity: InsightSeverity | null;
  readonly toSeverity: InsightSeverity | null;
};

export type InsightRuleHit = {
  readonly severity: InsightSeverity;
  readonly title: string;
  readonly description: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly supportingEvidence: readonly InsightEvidenceRef[];
  readonly relatedConnectorIds: readonly string[];
  readonly relatedGraphNodeIds: readonly string[];
  readonly suggestedNextStep: string;
};

export type InsightEvaluationContext = {
  readonly organizationId: string;
  readonly now: Date;
};

export type InsightRule = {
  readonly id: string;
  readonly domain: InsightDomain;
  readonly title: string;
  evaluate(ctx: InsightEvaluationContext): InsightRuleHit | null;
};

export type InsightSeverityCounts = {
  readonly Info: number;
  readonly Warning: number;
  readonly Critical: number;
};

export type InsightDashboardSection = {
  readonly active: readonly ExecutiveInsight[];
  readonly recentlyResolved: readonly ExecutiveInsight[];
  readonly countsBySeverity: InsightSeverityCounts;
  readonly evaluatedAt: string;
};

export type InsightFilter = {
  readonly severity?: InsightSeverity | "";
  readonly domain?: InsightDomain | "";
  readonly status?: InsightStatus | "";
};
