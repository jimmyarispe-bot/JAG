/** Decision Center™ — shared command-center types. */

export type DecisionSeverity = "Info" | "Warning" | "Error" | "Critical";

export type RecommendationSort =
  | "highest_impact"
  | "easiest_fix"
  | "release_blockers"
  | "architecture_risk";

export type DecisionRecommendation = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly severity: DecisionSeverity;
  readonly confidence: "High" | "Medium" | "Low";
  readonly impact: "Low" | "Medium" | "High";
  readonly evidence: readonly string[];
  readonly affectedProducts: readonly string[];
  readonly affectedPackages: readonly string[];
  readonly estimatedEffort: "XS" | "S" | "M" | "L" | "XL";
  readonly blockingReleases: readonly string[];
  readonly score: number;
};

export type ProductDecisionCard = {
  readonly productId: string;
  readonly name: string;
  readonly version: string;
  readonly releaseStage: string;
  readonly qualityScore: number;
  readonly certificationStatus: string;
  readonly openBlockers: number;
  readonly openRecommendations: number;
  readonly technicalDebt: number;
  readonly testCoverage: number;
  readonly documentationCoverage: number;
};

export type ReleaseDecisionView = {
  readonly productId: string;
  readonly currentRc: string;
  readonly remainingGates: readonly string[];
  readonly gateFailures: readonly string[];
  readonly approvalStatus: string;
  readonly pendingReviews: readonly string[];
  readonly releaseRecommendation: string;
  readonly estimatedReadiness: number;
  readonly ready: boolean;
  readonly summary: string;
};

export type RiskItem = {
  readonly id: string;
  readonly category:
    | "architecture"
    | "technical_debt"
    | "documentation"
    | "per"
    | "connector"
    | "dependency"
    | "testing"
    | "api";
  readonly title: string;
  readonly severity: DecisionSeverity;
  readonly evidence: readonly string[];
  readonly trend: "up" | "down" | "flat";
};

export type RiskCenterView = {
  readonly generatedAt: string;
  readonly risks: readonly RiskItem[];
  readonly countsByCategory: Readonly<Record<string, number>>;
  readonly trends: readonly { readonly at: string; readonly riskScore: number }[];
};

export type PerCenterGroup = {
  readonly group: "Foundation" | "Studio" | "AcademyOS" | "Industry Packs";
  readonly pers: readonly {
    readonly id: string;
    readonly status: string;
    readonly description: string;
    readonly promoteToFoundation: boolean;
    readonly packsMentioning: readonly string[];
  }[];
};

export type PerCenterView = {
  readonly generatedAt: string;
  readonly groups: readonly PerCenterGroup[];
  readonly duplicates: readonly string[];
  readonly foundationCandidates: readonly string[];
  readonly byStatus: Readonly<Record<string, number>>;
};

export type TimelineEvent = {
  readonly id: string;
  readonly at: string;
  readonly title: string;
  readonly kind:
    | "release"
    | "sprint"
    | "per"
    | "certification"
    | "documentation"
    | "knowledge"
    | "other";
  readonly evidence: readonly string[];
};

export type ActivityItem = {
  readonly id: string;
  readonly at: string;
  readonly kind:
    | "commit"
    | "release"
    | "certification"
    | "per"
    | "documentation"
    | "recommendation";
  readonly summary: string;
  readonly evidence: readonly string[];
};

export type DecisionOverview = {
  readonly generatedAt: string;
  readonly platformVersion: string;
  readonly platformHealth: number;
  readonly studioHealth: number;
  readonly knowledgeGraphHealth: number;
  readonly repositoryFreshness: string;
  readonly overallQualityScore: number;
  readonly products: readonly ProductDecisionCard[];
  readonly topRisks: number;
  readonly openPers: number;
  readonly releaseReadyCount: number;
};
