/**
 * JAG Evolution™ — proposal-only continuous-improvement types (P-005).
 */

export const EVOLUTION_CLASSIFICATIONS = [
  "Personal Automation",
  "Organization Configuration",
  "Product Enhancement",
  "Platform Enhancement (PER)",
  "Innovation Proposal",
  "Documentation Improvement",
  "Training Improvement",
  "Bug Fix",
] as const;

export type EvolutionClassification =
  (typeof EVOLUTION_CLASSIFICATIONS)[number];

export type ArchitectureLayer =
  | "Foundation"
  | "Platform"
  | "Shared Service"
  | "Industry Pack"
  | "AcademyOS"
  | "Connector"
  | "Configuration"
  | "Automation"
  | "Documentation"
  | "Training"
  | "Bug";

export type EvolutionRequestStatus =
  | "captured"
  | "analyzing"
  | "in_review"
  | "duplicate"
  | "implemented"
  | "rejected"
  | "proposal_ready";

export type EvolutionCaptureRequest = {
  readonly requestId: string;
  readonly title: string;
  readonly description: string;
  readonly rawText: string;
  readonly persona: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly product: string | null;
  readonly page: string | null;
  readonly workflow: string | null;
  readonly timestamp: string;
  /** Reserved for future binary attachments */
  readonly attachments: readonly never[];
  readonly status: EvolutionRequestStatus;
};

export type EvolutionUnderstanding = {
  readonly requestId: string;
  readonly intent: string;
  readonly desiredOutcome: string;
  readonly businessProblem: string;
  readonly affectedWorkflow: string;
  readonly priorityHint: "low" | "medium" | "high" | "critical";
  readonly categoryHint: string;
  readonly confidence: number;
};

export type RepositoryHitKind =
  | "api"
  | "service"
  | "workflow"
  | "dashboard"
  | "documentation"
  | "tutorial"
  | "help_incident"
  | "evolution_request"
  | "knowledge_graph";

export type RepositoryHit = {
  readonly kind: RepositoryHitKind;
  readonly id: string;
  readonly title: string;
  readonly excerpt: string;
  readonly path?: string;
  readonly score: number;
};

export type RepositoryAnalysis = {
  readonly requestId: string;
  readonly query: string;
  readonly hits: readonly RepositoryHit[];
  readonly alreadyExists: boolean;
  readonly partialImplementation: boolean;
  readonly duplicateRequest: boolean;
  readonly duplicateOfRequestId: string | null;
  readonly reusableCapability: boolean;
  readonly summary: string;
  readonly searchedAt: string;
};

export type ArchitectureReview = {
  readonly requestId: string;
  readonly primaryLayer: ArchitectureLayer;
  readonly secondaryLayers: readonly ArchitectureLayer[];
  readonly rationale: string;
  readonly respectsBoundaries: boolean;
};

export type PriorityScores = {
  readonly businessValue: number;
  readonly userImpact: number;
  readonly frequency: number;
  readonly risk: number;
  readonly strategicAlignment: number;
  readonly engineeringEffort: number;
  readonly architectureImpact: number;
  readonly confidence: number;
  readonly total: number;
};

export type EvolutionProposal = {
  readonly proposalId: string;
  readonly requestId: string;
  readonly classification: EvolutionClassification;
  readonly status: EvolutionRequestStatus;
  readonly executiveSummary: string;
  readonly problemStatement: string;
  readonly recommendedSolution: string;
  readonly alternativeSolutions: readonly string[];
  readonly affectedPackages: readonly string[];
  readonly reusableComponents: readonly string[];
  readonly estimatedEffort: string;
  readonly risks: readonly string[];
  readonly requiredTests: readonly string[];
  readonly documentationUpdates: readonly string[];
  readonly releaseImpact: string;
  readonly confidenceScore: number;
  readonly recommendation: string;
  readonly architecture: ArchitectureReview;
  readonly understanding: EvolutionUnderstanding;
  readonly repository: RepositoryAnalysis;
  readonly priority: PriorityScores;
  readonly mrJagMessage: string;
  readonly createdAt: string;
  /** Always false — Evolution never mutates production code. */
  readonly generatesProductionCode: false;
  /** Studio remains approval authority. */
  readonly requiresStudioApproval: true;
};

export type EvolutionDashboard = {
  readonly generatedAt: string;
  readonly newestIdeas: readonly EvolutionCaptureRequest[];
  readonly mostRequested: readonly { readonly key: string; readonly count: number }[];
  readonly highestValue: readonly EvolutionProposal[];
  readonly duplicates: readonly EvolutionProposal[];
  readonly implemented: readonly EvolutionProposal[];
  readonly rejected: readonly EvolutionProposal[];
  readonly inReview: readonly EvolutionProposal[];
  readonly innovationCandidates: readonly EvolutionProposal[];
  readonly perCandidates: readonly EvolutionProposal[];
};

export type EvolutionAnalyticsSnapshot = {
  readonly generatedAt: string;
  readonly captureCount: number;
  readonly proposalCount: number;
  readonly byClassification: Readonly<Record<string, number>>;
  readonly byStatus: Readonly<Record<string, number>>;
  readonly averageConfidence: number;
  readonly averagePriority: number;
  readonly duplicateRate: number;
};
