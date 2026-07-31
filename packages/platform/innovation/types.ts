/**
 * JAG Innovation™ — strategic opportunity intelligence types (P-006).
 */

export const PORTFOLIO_CATEGORIES = [
  "Quick Wins",
  "Strategic Investments",
  "Research",
  "Platform",
  "Industry",
  "Experimental",
  "Deferred",
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const ROADMAP_HORIZONS = ["Now", "Next", "Later", "Future"] as const;
export type RoadmapHorizon = (typeof ROADMAP_HORIZONS)[number];

export type InnovationSignalSource =
  | "evolution_proposals"
  | "help_incidents"
  | "coach_analytics"
  | "academy_analytics"
  | "usage_analytics"
  | "performance_metrics"
  | "repository_metrics"
  | "customer_feedback"
  | "operational_kpis"
  | "financial_kpis";

export type InnovationSignal = {
  readonly id: string;
  readonly source: InnovationSignalSource;
  readonly theme: string;
  readonly strength: number;
  readonly organizationId: string | null;
  readonly evidence: string;
  readonly observedAt: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
};

export type PatternKind =
  | "frequently_requested"
  | "workflow_bottleneck"
  | "training_gap"
  | "feature_abandonment"
  | "performance_degradation"
  | "operational_inefficiency"
  | "emerging_opportunity";

export type InnovationPattern = {
  readonly id: string;
  readonly kind: PatternKind;
  readonly title: string;
  readonly summary: string;
  readonly theme: string;
  readonly signalIds: readonly string[];
  readonly strength: number;
  readonly detectedAt: string;
};

export type FinancialImpact = {
  readonly revenueOpportunity: number;
  readonly costReduction: number;
  readonly productivityGainHours: number;
  readonly riskReduction: number;
  readonly customerImpact: number;
  readonly ebitdaImprovement: number;
  readonly currency: "USD";
};

export type OpportunityScores = {
  readonly businessValue: number;
  readonly technicalFeasibility: number;
  readonly strategicAlignment: number;
  readonly risk: number;
  readonly confidence: number;
  readonly total: number;
};

export type InnovationCandidate = {
  readonly opportunityId: string;
  readonly executiveSummary: string;
  readonly problem: string;
  readonly opportunity: string;
  readonly businessValue: string;
  readonly technicalFeasibility: string;
  readonly strategicAlignment: string;
  readonly dependencies: readonly string[];
  readonly estimatedEffort: string;
  readonly risk: string;
  readonly confidence: number;
  readonly scores: OpportunityScores;
  readonly financial: FinancialImpact;
  readonly portfolioCategory: PortfolioCategory;
  readonly roadmapHorizon: RoadmapHorizon;
  readonly patternIds: readonly string[];
  readonly signalIds: readonly string[];
  readonly themes: readonly string[];
  readonly mrJagMessage: string;
  readonly createdAt: string;
  /** Innovation discovers opportunities; it does not implement them. */
  readonly implementsChanges: false;
};

export type InnovationRoadmap = {
  readonly generatedAt: string;
  readonly now: readonly InnovationCandidate[];
  readonly next: readonly InnovationCandidate[];
  readonly later: readonly InnovationCandidate[];
  readonly future: readonly InnovationCandidate[];
};

export type InnovationPortfolio = {
  readonly generatedAt: string;
  readonly byCategory: Readonly<
    Record<PortfolioCategory, readonly InnovationCandidate[]>
  >;
  readonly mix: Readonly<Record<PortfolioCategory, number>>;
};

export type InnovationDashboard = {
  readonly generatedAt: string;
  readonly pipeline: readonly InnovationCandidate[];
  readonly highestValue: readonly InnovationCandidate[];
  readonly highestConfidence: readonly InnovationCandidate[];
  readonly quickWins: readonly InnovationCandidate[];
  readonly strategicInvestments: readonly InnovationCandidate[];
  readonly expectedRoi: number;
  readonly portfolioMix: Readonly<Record<PortfolioCategory, number>>;
  readonly patterns: readonly InnovationPattern[];
  readonly signalCount: number;
  readonly mrJagHighlights: readonly string[];
};

export type HostInnovationSignals = {
  readonly usageAnalytics?: readonly {
    featureId: string;
    abandonmentRate?: number;
    activeUsers?: number;
  }[];
  readonly performanceMetrics?: readonly {
    route: string;
    p95Ms?: number;
    errorRate?: number;
  }[];
  readonly repositoryMetrics?: readonly {
    metric: string;
    value: number;
  }[];
  readonly customerFeedback?: readonly {
    theme: string;
    sentiment?: number;
    count?: number;
  }[];
  readonly operationalKpis?: readonly {
    name: string;
    value: number;
    target?: number;
  }[];
  readonly financialKpis?: readonly {
    name: string;
    value: number;
  }[];
};
