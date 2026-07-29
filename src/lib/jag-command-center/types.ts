/** Executive Overview view models — UI + application services only. */

export type JagServiceHealth = "healthy" | "loading" | "unavailable";

export type JagOrgHealthView = {
  readonly status: "ready" | "empty";
  readonly overallHealth?: string;
  readonly healthScore?: number;
  readonly trend?: string;
  readonly riskLevel?: string;
  readonly confidence?: number;
  readonly primaryDrivers: readonly string[];
  readonly explanation: string;
  readonly capturedAt?: string;
  readonly source?: string;
};

export type JagPriorityItem = {
  readonly id: string;
  readonly title: string;
  readonly priority: string;
  readonly severity: string;
  readonly recommendedDecision: string;
  readonly evidenceCount: number;
  readonly href: string;
  readonly category?: string;
};

export type JagExecutiveBriefView = {
  readonly status: "ready" | "empty";
  readonly summary?: string;
  readonly stance?: string;
  readonly confidence?: number;
  readonly strategicPriorities: readonly string[];
  readonly criticalRisks: readonly string[];
  readonly recommendedActions: readonly string[];
  readonly capturedAt?: string;
  readonly explanation: string;
  readonly href: string;
};

export type JagCapabilityPackView = {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: string;
  readonly contributorCount: number;
  readonly dependencies: readonly string[];
  readonly description: string;
};

export type JagLoadedDomainView = {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: "loaded" | "unavailable";
  readonly packCount: number;
  readonly description: string;
};

export type JagRuntimeServiceView = {
  readonly id: string;
  readonly label: string;
  readonly health: JagServiceHealth;
  readonly detail: string;
};

export type JagRecentIntelligenceItem = {
  readonly id: string;
  readonly contributorId: string;
  readonly label: string;
  readonly confidence: number;
  readonly durationMs?: number;
  readonly resultSummary: string;
  readonly analyzedAt: string;
};

export type JagDecisionGroupId =
  | "students"
  | "operations"
  | "funding"
  | "executive";

export type JagRecommendedDecisionItem = {
  readonly id: string;
  readonly title: string;
  readonly rationale: string;
  readonly priority: number | string;
  readonly href?: string;
  readonly source: string;
};

export type JagRecommendedDecisionGroup = {
  readonly id: JagDecisionGroupId;
  readonly label: string;
  readonly items: readonly JagRecommendedDecisionItem[];
};

export type JagDecisionExecutionDashboard = {
  readonly openDecisions: number;
  readonly assigned: number;
  readonly overdue: number;
  readonly completedThisWeek: number;
  /** 0–1 when outcomes exist; null when none reviewed yet. */
  readonly outcomeSuccessRate: number | null;
  readonly outcomeReviewedCount: number;
  readonly href: string;
};

export type JagExecutiveOverviewModel = {
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly organizationHealth: JagOrgHealthView;
  readonly decisionExecution: JagDecisionExecutionDashboard;
  readonly priorities: readonly JagPriorityItem[];
  readonly executiveBrief: JagExecutiveBriefView;
  readonly capabilityPacks: readonly JagCapabilityPackView[];
  readonly domains: readonly JagLoadedDomainView[];
  readonly runtimeStatus: readonly JagRuntimeServiceView[];
  readonly recentIntelligence: readonly JagRecentIntelligenceItem[];
  readonly recommendedDecisions: readonly JagRecommendedDecisionGroup[];
};
